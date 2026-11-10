import hashlib
import hmac
import json
import os
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from backend import domain as D
from backend.main import app
from backend.store import transaction

KEY='test-matching-key-not-production-0000000000'
SUPPORT=dict(id='support',role='영업지원팀',admin=False)
APPROVER=dict(id='approver',role='영업지원팀',admin=False)
SALES=dict(id='sales',role='영업팀',admin=False)
EXEC=dict(id='executive',role='영업임원',admin=False)
FIN=dict(id='finance',role='재무팀',admin=False)
ADMIN=dict(id='admin',role='조회전용',admin=True)


def files():
    return dict(agencies='agency_id|agency_name|representative_name|address|bank_account_no|rebate_eligible\nA|가상 거래처 A|가상 대표|가상 주소|가상 계좌1|True\nB|가상 거래처 B|가상 대표|가상 주소|가상 계좌2|True\nC|가상 거래처 C|가상 대표|다른 주소|가상 계좌1|True\nZ|가상 거래처 Z|별도 대표|별도 주소|별도 계좌|True\n',
        rebates='rebate_id|agency_id|period_ym|rebate_amount_krw|approval_status|approver|payment_date\nR1|A|2026-06|900000|미지급|NONE|NONE\nR2|B|2026-06|800000|미지급|NONE|NONE\nR3|C|2026-06|700000|미지급|NONE|NONE\nR4|Z|2026-06|2000000|미지급|NONE|NONE\n',
        deposits='deposit_id|agency_id|deposit_date|amount_krw|bank_account_no\nP1|B|2026-06-01|100|실제 다른 입금계좌\n')


def state():
    s=D.empty()
    D.import_data(s,ADMIN,files(),KEY)
    return s


def act(s,c,actor,action,**kw):
    return D.operate(s,actor,c['id'],dict(action=action,revision=c['revision'],reason='합성 테스트 근거',**kw),KEY)


def ready(s,c):
    for kind in ['settlement','relationship']:
        act(s,c,SALES,'evidence',kind=kind,source_kind='synthetic')
        act(s,c,SUPPORT,'verify_evidence',evidence_id=c['evidence'][-1]['id'])
    for agency in {s['rebates'][i]['agency'] for i in c['items']}:
        act(s,c,SALES,'evidence',kind='payout',source_kind='synthetic',agency=agency,account='가상은행 12345'+agency,holder='가상예금주')
        act(s,c,SUPPORT,'verify_evidence',evidence_id=c['evidence'][-1]['id'])
    act(s,c,SUPPORT,'submit')
    act(s,c,APPROVER,'approve')
    if c['state']=='PENDING_EXECUTIVE':act(s,c,EXEC,'approve')
    act(s,c,FIN,'schedule',planned_date='2026-07-03')


def test_transitive_and_missing_values():
    s=state()
    g,groups=D.graph(s)
    assert ['A','B','C'] in groups and not g.has_edge('B','C')
    for a in s['agencies'].values():a['keys']={f:'' for f in D.FIELDS}
    assert len(D.graph(s)[1])==4


def test_real_source_reconciliation():
    root=Path(__file__).resolve().parents[3]/'01_참가자_배포용/04_원본데이터/01_corevia'
    paths=dict(agencies=root/'master/m_agency_cv.csv',rebates=root/'sales/sales_rebate_payment_cv.csv',deposits=root/'financials/fin_collection_history_cv.csv')
    before={k:hashlib.sha256(p.read_bytes()).hexdigest() for k,p in paths.items()}
    s=D.empty()
    result=D.import_data(s,ADMIN,{k:p.read_text(encoding='utf-8') for k,p in paths.items()},KEY)
    assert result['agencies']==50 and result['rebates']==240 and result['total']==232865386
    assert result['related_groups']==[['D-011','D-024','D-037']]
    c=D.create_case(s,SUPPORT,'D-011','2026-06')
    assert D.context(s,c)['exposure']==3888097
    assert before=={k:hashlib.sha256(p.read_bytes()).hexdigest() for k,p in paths.items()}


def test_normal_limit_and_duplicate():
    s=state();c=D.create_case(s,SUPPORT,'Z','2026-06');ready(s,c)
    assert len(c['approvals'])==1
    p=act(s,c,FIN,'simulate_payment',idempotency_key='test-normal-1')
    assert p['amount']==2000000
    assert act(s,c,FIN,'simulate_payment',idempotency_key='test-normal-1')==p
    with pytest.raises(D.RuleError,match='이미'):act(s,c,FIN,'simulate_payment',idempotency_key='test-normal-2')


def test_executive_and_separation():
    s=state();c=D.create_case(s,SUPPORT,'A','2026-06');ready(s,c)
    assert {a['role'] for a in c['approvals']}=={'영업지원팀','영업임원'}
    assert act(s,c,FIN,'simulate_payment',idempotency_key='test-exec-1')['amount']==2400000


def test_missing_rejection_resubmit():
    s=state();c=D.create_case(s,SUPPORT,'A','2026-06')
    act(s,c,SUPPORT,'submit');assert c['state']=='ON_HOLD' and s['tasks']
    with pytest.raises(D.RuleError):act(s,c,FIN,'simulate_payment',idempotency_key='missing-1')
    # ready would schedule; instead reject at the executive step after normal evidence setup.
    ready(s,c)
    act(s,c,EXEC,'revoke'); assert c['state']=='REASSESSMENT_REQUIRED'
    act(s,c,SUPPORT,'resubmit');act(s,c,APPROVER,'approve');act(s,c,EXEC,'reject')
    revision=c['revision'];act(s,c,SUPPORT,'resubmit')
    assert c['revision']==revision+1 and c['state']=='PENDING_SUPPORT'


def test_changed_relationship_invalidates_and_suspends():
    s=state();c=D.create_case(s,SUPPORT,'A','2026-06');ready(s,c)
    after,impact=D.change_preview(s,'A',{'representative_name':'새 가상 대표','address':'새 가상 주소'},KEY)
    assert impact['cases'][0]['after_amount']<impact['cases'][0]['before_amount']
    s['agencies']=after['agencies'];D.invalidate(s,SUPPORT,c,'정보 정정')
    assert c['state']=='REASSESSMENT_REQUIRED' and c['schedule']['state']=='SUSPENDED' and not c['approvals']
    with pytest.raises(D.RuleError):act(s,c,FIN,'simulate_payment',idempotency_key='changed-1')


def test_stale_and_self_approval_and_evidence():
    s=state();c=D.create_case(s,SUPPORT,'Z','2026-06')
    with pytest.raises(D.RuleError):D.operate(s,SUPPORT,c['id'],dict(action='submit',revision=99,reason='오래된 요청'),KEY)
    act(s,c,SALES,'evidence',kind='settlement',source_kind='synthetic')
    with pytest.raises(D.RuleError):act(s,c,SALES,'verify_evidence',evidence_id=c['evidence'][-1]['id'])
    ready(s,c);act(s,c,APPROVER,'revoke');act(s,c,SUPPORT,'resubmit')
    with pytest.raises(D.RuleError):act(s,c,SUPPORT,'approve')


def test_paid_change_remains_paid_and_audit_chain():
    s=state();c=D.create_case(s,SUPPORT,'Z','2026-06');ready(s,c)
    act(s,c,FIN,'simulate_payment',idempotency_key='paid-test-1')
    D.invalidate(s,SUPPORT,c,'사후 정보 정정')
    assert c['state']=='SIMULATED_PAID'
    previous=''
    for e in s['events']:
        copy=dict(e);hash=copy.pop('hash')
        assert e['previous_hash']==previous and D.digest(copy)==hash
        previous=hash


@pytest.fixture
def client(monkeypatch):
    if not os.environ.get('DATABASE_URL'):pytest.skip('PostgreSQL DATABASE_URL required')
    monkeypatch.setenv('NEXORA_INTERNAL_SECRET','test-secret-that-is-long-enough-000000')
    monkeypatch.setenv('NEXORA_MATCH_KEY',KEY)
    tenant='test-'+str(uuid4())
    monkeypatch.setenv('APPHUB_TENANT',tenant)
    with TestClient(app) as c:
        yield c,tenant


def request(client,tenant,path,body=None,user='admin',admin=True):
    method='GET' if body is None else 'POST'
    raw='' if body is None else json.dumps(body,ensure_ascii=False)
    identity=json.dumps(dict(id=user,tenant=tenant,admin=admin)).encode().hex()
    stamp=str(int(time.time()))
    signature=hmac.new(os.environ['NEXORA_INTERNAL_SECRET'].encode(),'\n'.join([stamp,method,path,identity,hashlib.sha256(raw.encode()).hexdigest()]).encode(),hashlib.sha256).hexdigest()
    return client.request(method,path,content=raw.encode(),headers={'content-type':'application/json','x-nx-time':stamp,'x-nx-identity':identity,'x-nx-signature':signature})


def test_api_pg_concurrent_payment_and_auth(client):
    c,tenant=client
    assert c.get('/api/v1/workspace').status_code==401
    assert request(c,tenant,'/api/v1/datasets/import',files()).status_code==200
    assert request(c,tenant,'/api/v1/members',dict(user_id='finance',role='재무팀')).status_code==200
    with transaction(tenant,True) as s:
        case=D.create_case(s,SUPPORT,'A','2026-06');ready(s,case);id=case['id'];revision=case['revision']
    def pay(n):return request(c,tenant,f'/api/v1/cases/{id}/actions',dict(action='simulate_payment',revision=revision,reason='동시 지급 테스트',idempotency_key='parallel-'+str(n)),user='finance',admin=False)
    with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(pay,[1,2]))
    assert sorted(x.status_code for x in results)==[200,409]
    with transaction(tenant) as s:
        assert len(s['payments'])==1
        assert s['cases'][id]['state']=='SIMULATED_PAID'


def test_api_bad_signature_and_cross_tenant(client):
    c,tenant=client
    assert c.get('/api/v1/workspace',headers={'x-nx-time':str(int(time.time())),'x-nx-signature':'fake'}).status_code==401
    assert request(c,'other-tenant','/api/v1/workspace').status_code==403


def test_every_payout_requires_own_verified_evidence():
    s=state();c=D.create_case(s,SUPPORT,'A','2026-06');ready(s,c)
    c['evidence'][-1]['verified']=False
    assert '지급 대상별 계좌 증빙 검토 미완료' in D.blockers(s,c)
    with pytest.raises(D.RuleError):act(s,c,FIN,'simulate_payment',idempotency_key='unverified-1')


def test_api_split_regenerates_cases_and_invalidates(client):
    c,tenant=client
    assert request(c,tenant,'/api/v1/datasets/import',files()).status_code==200
    assert request(c,tenant,'/api/v1/members',dict(user_id='support',role='영업지원팀')).status_code==200
    with transaction(tenant,True) as s:
        old=D.create_case(s,SUPPORT,'A','2026-06');ready(s,old);id=old['id']
    with transaction(tenant) as s:version=s['version']
    body=dict(agency='A',patch={'representative_name':'정정 가상 대표','address':'정정 가상 주소'},reason='합성 관계 분리',source_kind='synthetic',effective_at='2026-07-01',base_version=version,apply=True)
    response=request(c,tenant,'/api/v1/relationships/change',body,user='support',admin=False)
    assert response.status_code==200,response.text
    with transaction(tenant) as s:
        assert s['cases'][id]['state']=='SUPERSEDED'
        assert len([x for x in s['cases'].values() if x['state']=='DRAFT'])==3
        assert s['cases'][id]['schedule']['state']=='SUSPENDED'


def test_api_transaction_rollback_and_audit_immutable(client):
    c,tenant=client
    broken=files();broken['rebates']+='R1|A|2026-06|5|미지급|NONE|NONE\n'
    assert request(c,tenant,'/api/v1/datasets/import',broken).status_code==422
    with transaction(tenant) as s:assert not s['agencies'] and not s['events']
    assert request(c,tenant,'/api/v1/datasets/import',files()).status_code==200
    from backend.store import connection
    import psycopg
    with pytest.raises(psycopg.Error):
        with connection() as conn:conn.execute('DELETE FROM nx_audit WHERE tenant=%s',(tenant,))


def test_api_amount_correction_preserves_source_and_reapproval(client):
    c,tenant=client
    request(c,tenant,'/api/v1/datasets/import',files())
    request(c,tenant,'/api/v1/members',dict(user_id='support',role='영업지원팀'))
    with transaction(tenant,True) as s:
        case=D.create_case(s,SUPPORT,'Z','2026-06');ready(s,case);id=case['id']
    with transaction(tenant) as s:version=s['version']
    response=request(c,tenant,'/api/v1/rebates/R4/correct',dict(amount=2000001,reason='합성 정산 금액 정정',source_kind='synthetic',base_version=version),user='support',admin=False)
    assert response.status_code==200
    with transaction(tenant) as s:
        assert s['rebates']['R4']['original_amount']==2000000
        assert D.context(s,s['cases'][id])['executive']
        assert s['cases'][id]['state']=='REASSESSMENT_REQUIRED'
        assert D.reconcile(s)['total']==4400000


def test_idempotent_key_cannot_change_body():
    s=state();c=D.create_case(s,SUPPORT,'Z','2026-06');ready(s,c)
    act(s,c,FIN,'simulate_payment',idempotency_key='same-body-1')
    with pytest.raises(D.RuleError):
        D.operate(s,FIN,c['id'],dict(action='simulate_payment',revision=c['revision'],reason='다른 요청 본문',idempotency_key='same-body-1'),KEY)


def test_api_ai_missing_configuration_never_changes_approval(client,monkeypatch):
    c,tenant=client
    monkeypatch.delenv('LLM_API_KEY',raising=False)
    request(c,tenant,'/api/v1/datasets/import',files())
    with transaction(tenant,True) as s:
        case=D.create_case(s,SUPPORT,'Z','2026-06');id=case['id']
    response=request(c,tenant,f'/api/v1/cases/{id}/analysis',{})
    assert response.status_code==503
    with transaction(tenant) as s:assert s['cases'][id]['state']=='DRAFT'
