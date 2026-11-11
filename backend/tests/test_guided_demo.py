"""Production-route demo isolation and actual workflow verification."""
import pytest
from concurrent.futures import ThreadPoolExecutor
from backend import domain as D, analysis as AI
from backend.store import transaction,connection
from backend.tests.test_engine import client,request,state,SUPPORT,files,ready,act,APPROVER


@pytest.mark.parametrize('scenario,length,expected',[('A',6,'SIMULATED_PAID'),('B',8,'APPROVED'),('C',6,'REJECTED')])
def test_guided_scenarios_isolated_and_persisted(client,scenario,length,expected):
    c,tenant=client
    with transaction(tenant) as s:before=D.digest(s)
    response=request(c,tenant,'/api/v1/demo/start',dict(scenario=scenario))
    assert response.status_code==200
    run=response.json()['run_id']
    for step in range(length):
        r=request(c,tenant,f'/api/v1/demo/{run}/step',dict(expected_step=step))
        assert r.status_code==200,r.text
        assert r.json()['scenario']['step']==step+1
    result=r.json()
    active=[x for x in result['cases'] if x['state']!='SUPERSEDED']
    assert active[0]['state']==expected
    assert all(x['source_kind']=='synthetic' for x in result['rebates'])
    if scenario=='A':
        assert len(result['payments'])==1 and active[0]['analysis']['output']['mode']=='deterministic'
        assert all(t['state']=='DONE' for t in result['tasks'] if t['department']=='재무팀')
    if scenario=='B':
        impact=result['impacts'][0]['cases'][0]
        assert impact['before_amount']==1200000 and impact['after_amount']==2300000
        assert not impact['before_executive'] and impact['after_executive']
        assert impact['before_state']=='SCHEDULED' and impact['after_state']=='SUPERSEDED'
        assert any(t['department']=='내부감시팀' for t in result['tasks'])
        assert len(active[0]['approvals'])==2
    if scenario=='C':
        assert any(t['department']=='영업팀' and t['state']=='DONE' for t in result['tasks'])
        assert not result['payments']
    # Repeat click cannot advance or duplicate payment; reconnect reads the committed run.
    assert request(c,tenant,f'/api/v1/demo/{run}/step',dict(expected_step=length-1)).status_code==409
    assert request(c,tenant,f'/api/v1/demo/{run}/workspace').json()['scenario']['step']==length
    assert request(c,tenant,f'/api/v1/demo/{run}/workspace',user='other',admin=False).status_code==404
    with transaction(tenant) as s:assert D.digest(s)==before


def test_demo_reset_creates_new_run_preserves_old(client):
    c,tenant=client
    a=request(c,tenant,'/api/v1/demo/start',dict(scenario='A')).json()['run_id']
    request(c,tenant,f'/api/v1/demo/{a}/step',dict(expected_step=0))
    b=request(c,tenant,'/api/v1/demo/start',dict(scenario='C')).json()['run_id']
    assert a!=b
    assert request(c,tenant,f'/api/v1/demo/{a}/workspace').json()['scenario']['step']==1
    assert request(c,tenant,f'/api/v1/demo/{b}/workspace').json()['scenario']['step']==0


def test_concurrent_demo_step_runs_once(client):
    c,tenant=client
    run=request(c,tenant,'/api/v1/demo/start',dict(scenario='A')).json()['run_id']
    def step(_):return request(c,tenant,f'/api/v1/demo/{run}/step',dict(expected_step=0))
    with ThreadPoolExecutor(max_workers=2) as pool:responses=list(pool.map(step,range(2)))
    assert sorted(r.status_code for r in responses)==[200,409]
    result=request(c,tenant,f'/api/v1/demo/{run}/workspace').json()
    assert len(result['cases'])==1 and result['scenario']['step']==1


def test_rule_explanation_preserves_approval_and_bounds():
    s=state();c=D.create_case(s,SUPPORT,'A','2026-06')
    before=D.digest(D.context(s,c))
    result=AI.explain(AI.prepare(s,c))
    assert result['mode']=='deterministic' and result['risk_level']=='UNKNOWN'
    assert result['rule_result']['group_month_exposure_krw']==2400000
    assert '외부 AI' in result['summary']
    assert D.digest(D.context(s,c))==before and c['state']=='DRAFT'


def test_internal_auditor_can_complete_review_but_not_approve(client):
    c,tenant=client
    request(c,tenant,'/api/v1/members',dict(user_id='auditor',role='내부감시팀'))
    with transaction(tenant,True) as s:
        task=D.task(s,SUPPORT,'dataset','내부감시팀','관계 근거 조사','합성 테스트')
        tid=task['id']
    r=request(c,tenant,f'/api/v1/tasks/{tid}/resolve',dict(reason='검토 결과: 추가 확인 요청'),user='auditor',admin=False)
    assert r.status_code==200 and r.json()['result']=='검토 결과: 추가 확인 요청'
    request(c,tenant,'/api/v1/datasets/import',files())
    with transaction(tenant,True) as s:
        case=D.create_case(s,SUPPORT,'Z','2026-06');ready(s,case)
        act(s,case,APPROVER,'revoke');act(s,case,SUPPORT,'resubmit')
        id=case['id'];revision=case['revision']
    denied=request(c,tenant,f'/api/v1/cases/{id}/actions',dict(action='approve',revision=revision,reason='감시 역할의 승인 시도'),user='auditor',admin=False)
    assert denied.status_code==403
