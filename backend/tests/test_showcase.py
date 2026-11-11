from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from pathlib import Path
import json
from fastapi.testclient import TestClient

from backend import domain as D, showcase as S
from backend.store import transaction, connection
from backend.tests.test_engine import client, request  # noqa: F401 -- pytest fixture
from backend.main import app


def setup(client):
    api, tenant = client
    root = Path(__file__).resolve().parents[3] / '01_참가자_배포용/04_원본데이터/01_corevia'
    paths = dict(agencies=root/'master/m_agency_cv.csv', rebates=root/'sales/sales_rebate_payment_cv.csv',
                 deposits=root/'financials/fin_collection_history_cv.csv')
    assert request(api, tenant, '/api/v1/datasets/import', {k:p.read_text(encoding='utf-8') for k,p in paths.items()}).status_code == 200
    for user, role in [('maker','영업지원팀'),('reviewer','영업지원팀'),('sales','영업팀'),('exec','영업임원'),('finance','재무팀')]:
        assert request(api, tenant, '/api/v1/members', dict(user_id=user, role=role)).status_code == 200
    return api, tenant


def get(api, tenant):
    r = request(api, tenant, '/api/v1/showcase/workspace')
    assert r.status_code == 200, r.text
    return r.json()


def action(api, tenant, c, name, user='maker', **kw):
    return request(api, tenant, f"/api/v1/showcase/cases/{c['id']}/actions",
                   dict(action=name, revision=c['revision'], reason='DEMO API 검증 근거', **kw), user=user, admin=False)


def test_bootstrap_restart_preserves_original_aggregate(client, monkeypatch):
    api, tenant = setup(client)
    with transaction(tenant) as s:
        before = deepcopy(s)
    class Bootstrap:
        def with_name(self, name): return self
        def exists(self): return True
        def read_text(self, **kw): return json.dumps(before)
    monkeypatch.setattr('backend.main.Path', lambda _: Bootstrap())
    monkeypatch.setenv('NEXORA_BOOTSTRAP', '1')
    with TestClient(app):
        with transaction(tenant) as s:
            assert s == before


def test_showcase_seed_concurrent_idempotent_and_live_preserved(client):
    api, tenant = setup(client)
    with transaction(tenant) as s:
        before = deepcopy(s)
    assert get(api, tenant)['workflow_counts'] == dict(active_cases=0, open_tasks=0)
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(lambda _: request(api, tenant, '/api/v1/showcase/seed', {}), range(2)))
    assert all(r.status_code == 200 for r in responses), [r.text for r in responses]
    assert sorted(r.json()['created'] for r in responses) == [False, True]
    data = get(api, tenant)
    assert data['workflow_counts'] == dict(active_cases=5, open_tasks=4)
    assert {c['state'] for c in data['cases']} == {'DRAFT','ON_HOLD','PENDING_SUPPORT','REASSESSMENT_REQUIRED'}
    assert all(c['provenance']=='DEMO' and not c['approvals'] for c in data['cases'])
    assert all(t['provenance']=='DEMO' and t['case'] in {c['id'] for c in data['cases']} for t in data['tasks'])
    assert {'영업팀','재무팀'} <= {t['department'] for t in data['tasks']}
    assert data['summary']['total'] == 232865386
    with transaction(tenant) as s:
        assert s == before
    with connection() as conn:
        assert conn.execute('SELECT count(*) FROM nx_audit WHERE tenant=%s', (S.tenant(tenant),)).fetchone()[0] == len(data['events'])
    assert request(api, tenant, '/api/v1/showcase/seed', {}, user='sales', admin=False).status_code == 403
    assert request(api, 'other-tenant', '/api/v1/showcase/workspace').status_code == 403


def test_showcase_human_approval_finance_payment_and_repeat_seed(client):
    api, tenant = setup(client)
    assert request(api, tenant, '/api/v1/showcase/seed', {}).status_code == 200
    c = next(c for c in get(api, tenant)['cases'] if c['state']=='PENDING_SUPPORT')
    assert request(api, tenant, '/api/v1/members', dict(user_id=c['creator'], role='영업지원팀')).status_code == 200
    assert action(api, tenant, c, 'approve', user=c['creator']).status_code == 403
    # Changing member authority in the real registry is respected by DEMO.
    assert action(api, tenant, c, 'approve', user='sales').status_code == 403
    r = action(api, tenant, c, 'approve', user='reviewer'); assert r.status_code == 200, r.text
    c = r.json()
    if c['state']=='PENDING_EXECUTIVE':
        assert action(api, tenant, c, 'approve', user='reviewer').status_code == 403
        c = action(api, tenant, c, 'approve', user='exec').json()
    assert c['state']=='APPROVED'
    c = action(api, tenant, c, 'schedule', user='finance', planned_date='2026-07-03').json()
    task = next(t for t in get(api, tenant)['tasks'] if t['case']==c['id'] and t['title']=='지급 일정 반영')
    assert request(api, tenant, f"/api/v1/showcase/tasks/{task['id']}/resolve", dict(reason='DEMO 일정 확인'), user='finance', admin=False).status_code == 200
    def pay(n):
        return action(api, tenant, c, 'simulate_payment', user='finance', idempotency_key='showcase-pay-'+str(n))
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(pay, [1,2]))
    assert sorted(r.status_code for r in results) == [200,409]
    data = get(api, tenant)
    assert data['workflow_counts'] == dict(active_cases=4, open_tasks=4)
    assert len(data['payments']) == 1 and data['payments'][0]['case'] == c['id']
    assert any(e['kind']=='SIMULATED_PAYMENT' for e in data['events'])
    with connection() as conn:
        assert conn.execute('SELECT count(*) FROM nx_payment_items WHERE tenant=%s', (S.tenant(tenant),)).fetchone()[0] == len(c['items'])
    again = request(api, tenant, '/api/v1/showcase/seed', {}).json()
    assert not again['created'] and again['after'] == data['workflow_counts']


def test_showcase_missing_rejection_and_relationship_change(client):
    api, tenant = setup(client)
    assert request(api, tenant, '/api/v1/showcase/seed', {}).status_code == 200
    data = get(api, tenant)
    hold = next(c for c in data['cases'] if c['state']=='ON_HOLD')
    assert '검증된 지급 수취계좌 증빙 없음' in hold['blockers']
    assert action(api, tenant, hold, 'simulate_payment', user='finance', idempotency_key='missing-account').status_code == 409
    c = next(c for c in data['cases'] if c['state']=='PENDING_SUPPORT')
    assert action(api, tenant, c, 'reject', user='reviewer').status_code == 200
    assert get(api, tenant)['workflow_counts'] == dict(active_cases=4, open_tasks=5)
    assert action(api, tenant, c, 'evidence', user='sales', kind='settlement', source_kind='confirmed').status_code == 422
    data = get(api, tenant)
    agency = next(c for c in data['cases'] if c['context']['executive'])['agency']
    change = dict(agency=agency, patch=dict(representative_name='DEMO 정정 대표',address='DEMO 정정 주소'),
                  reason='DEMO 관계 분리',source_kind='synthetic',effective_at='2026-07-01',base_version=data['version'],apply=True)
    response = request(api, tenant, '/api/v1/showcase/relationships/change', change, user='maker', admin=False)
    assert response.status_code == 200, response.text
    assert response.json()['replacement_cases']
    assert any(not c['after_executive'] for c in response.json()['cases'])
    after = get(api, tenant)
    assert any(c['state']=='SUPERSEDED' for c in after['cases'])
    assert all(c['provenance']=='DEMO' for c in after['cases'])
    with transaction(tenant) as s:
        assert not s['cases'] and D.reconcile(s)['total']==232865386
