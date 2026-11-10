"""Submission gates. Mock model tests are explicitly not external AI evidence."""
import json
import os
from concurrent.futures import ThreadPoolExecutor

import httpx
import pytest

from backend import analysis as AI
from backend import domain as D
from backend.store import connection, transaction
from backend.tests.test_engine import client, request, files, state, act, ready, SUPPORT, APPROVER, SALES, EXEC, FIN


def model_output():
    fact=dict(claim='규칙 엔진의 합산액과 증빙 상태를 검토해야 합니다.',evidence_refs=['calculation'])
    return dict(summary='모의 모델 응답 · 실제 외부 AI 결과가 아닙니다.',relationship_evidence=[],payment_risks=[fact],
                missing_evidence=['수취계좌 확인'],suggested_tasks=[dict(department='영업팀',title='증빙 확인',reason='수취계좌 증빙을 확인합니다.',evidence_refs=['blockers'])],
                facts=[fact],uncertainties=['실제 수취계좌 미확인'],suggested_actions=['사람 검토'],limitations=['모의 모델 응답'])


def setup_case(client,agency='Z'):
    c,tenant=client
    assert request(c,tenant,'/api/v1/datasets/import',files()).status_code==200
    with transaction(tenant,True) as s:
        case=D.create_case(s,SUPPORT,agency,'2026-06')
        return case['id']


@pytest.mark.parametrize('failure',['timeout','http_error','invalid_json','invalid_shape','unknown_evidence','forged_amount'])
def test_ai_failures_preserve_rules_and_log_attempt(client,monkeypatch,failure):
    c,tenant=client;id=setup_case(client)
    monkeypatch.setenv('LLM_API_KEY','synthetic-test-key')
    monkeypatch.setenv('LLM_BASE_URL','https://model.example.invalid/v1')
    monkeypatch.setenv('LLM_MODEL','synthetic-test-model')
    def fake_post(*args,**kw):
        if failure=='timeout':raise httpx.ReadTimeout('synthetic timeout')
        req=httpx.Request('POST',args[0])
        if failure=='http_error':return httpx.Response(401,request=req)
        output=model_output()
        if failure=='invalid_shape':output={'summary':'missing fields'}
        if failure=='unknown_evidence':output['facts'][0]['evidence_refs']=['invented-evidence']
        if failure=='forged_amount':output['approved_amount_krw']=1
        content='not JSON' if failure=='invalid_json' else json.dumps(output)
        return httpx.Response(200,json={'choices':[{'message':{'content':content}}]},request=req)
    monkeypatch.setattr(httpx,'post',fake_post)
    with transaction(tenant) as s:before=D.digest(D.context(s,s['cases'][id]))
    response=request(c,tenant,f'/api/v1/cases/{id}/analysis',{})
    assert response.status_code==502
    with transaction(tenant) as s:
        assert s['cases'][id]['state']=='DRAFT' and not s['cases'][id]['approvals']
        assert D.digest(D.context(s,s['cases'][id]))==before
        assert s['events'][-1]['kind']=='AI_ANALYSIS_FAILED'
        assert 'analysis' not in s['cases'][id]


def test_valid_mock_ai_uses_graph_evidence_and_cannot_mutate_rules(client,monkeypatch):
    c,tenant=client;id=setup_case(client,'A')
    for key,value in dict(LLM_API_KEY='synthetic-test-key',LLM_BASE_URL='https://model.example.invalid/v1',LLM_MODEL='synthetic-test-model').items():monkeypatch.setenv(key,value)
    def fake_post(*args,**kw):
        inputs=json.loads(kw['json']['messages'][1]['content'])
        assert inputs['references']['calculation']['group_month_exposure_krw']==2400000
        assert 'edge:A:B' in inputs['references'] and 'edge:A:C' in inputs['references']
        assert 'payout' not in inputs
        return httpx.Response(200,json={'choices':[{'message':{'content':json.dumps(model_output())}}]},request=httpx.Request('POST',args[0]))
    monkeypatch.setattr(httpx,'post',fake_post)
    assert request(c,tenant,f'/api/v1/cases/{id}/analysis',{}).status_code==200
    with transaction(tenant) as s:
        assert s['cases'][id]['state']=='DRAFT' and D.context(s,s['cases'][id])['exposure']==2400000
        assert not s['tasks'] and not s['payments']
        assert s['cases'][id]['analysis']['model']=='synthetic-test-model'


def test_executive_gate_cannot_be_satisfied_by_support_twice():
    s=state();case=D.create_case(s,SUPPORT,'A','2026-06');ready(s,case)
    act(s,case,EXEC,'revoke');act(s,case,SUPPORT,'resubmit');act(s,case,APPROVER,'approve')
    assert case['state']=='PENDING_EXECUTIVE'
    with pytest.raises(D.RuleError):act(s,case,APPROVER,'approve')
    with pytest.raises(D.RuleError):act(s,case,FIN,'schedule',planned_date='2026-07-03')
    with pytest.raises(D.RuleError):act(s,case,FIN,'simulate_payment',idempotency_key='no-executive')
    act(s,case,EXEC,'approve');assert case['state']=='APPROVED'


def test_information_change_marks_previous_ai_explanation_stale():
    s=state();case=D.create_case(s,SUPPORT,'Z','2026-06')
    case['analysis']=dict(output=model_output(),model='synthetic-test-model',stale=False)
    D.invalidate(s,SUPPORT,case,'합성 정보 정정')
    assert case['analysis']['stale'] is True
    assert case['state']=='REASSESSMENT_REQUIRED' and not case['approvals']


def test_sales_task_completion_and_finance_rejection_schedule(client):
    c,tenant=client;id=setup_case(client)
    for user,role in [('sales','영업팀'),('finance','재무팀')]:request(c,tenant,'/api/v1/members',dict(user_id=user,role=role))
    with transaction(tenant,True) as s:
        case=s['cases'][id];act(s,case,SUPPORT,'submit');sales_task=next(iter(s['tasks']))
    assert request(c,tenant,f'/api/v1/tasks/{sales_task}/resolve',dict(reason='미확인 증빙은 완료할 수 없음'),user='sales',admin=False).status_code==409
    with transaction(tenant,True) as s:ready(s,s['cases'][id])
    assert request(c,tenant,f'/api/v1/tasks/{sales_task}/resolve',dict(reason='합성 회신과 검토 완료'),user='sales',admin=False).status_code==200
    with transaction(tenant,True) as s:
        case=s['cases'][id];act(s,case,APPROVER,'revoke')
        finance_task=next(t['id'] for t in s['tasks'].values() if t['department']=='재무팀' and t['title']=='지급 일정 재검토')
        assert case['schedule']['state']=='SUSPENDED'
        act(s,case,SUPPORT,'resubmit');act(s,case,APPROVER,'reject')
        assert case['schedule']['state']=='CANCELLED' and case['state']=='REJECTED'
    assert request(c,tenant,f'/api/v1/tasks/{finance_task}/resolve',dict(reason='취소 일정을 지급 가능으로 처리 금지'),user='finance',admin=False).status_code==409


def test_atomic_payment_audit_and_relational_item_records(client):
    c,tenant=client;id=setup_case(client,'A')
    request(c,tenant,'/api/v1/members',dict(user_id='finance',role='재무팀'))
    with transaction(tenant,True) as s:ready(s,s['cases'][id]);revision=s['cases'][id]['revision']
    response=request(c,tenant,f'/api/v1/cases/{id}/actions',dict(action='simulate_payment',revision=revision,reason='원자성 검증용 모의 지급',idempotency_key='atomic-payment'),user='finance',admin=False)
    assert response.status_code==200
    receipt=response.json()['receipt_id']
    with connection() as conn:
        payload=conn.execute('SELECT payload FROM nx_state WHERE tenant=%s',(tenant,)).fetchone()[0]
        items=conn.execute('SELECT count(*) FROM nx_payment_items WHERE tenant=%s AND receipt_id=%s',(tenant,receipt)).fetchone()[0]
        audits=conn.execute("SELECT count(*) FROM nx_audit WHERE tenant=%s AND event->>'kind'='SIMULATED_PAYMENT' AND event->'details'->>'receipt_id'=%s",(tenant,receipt)).fetchone()[0]
    assert payload['cases'][id]['state']=='SIMULATED_PAID' and items==3 and audits==1


def test_revoke_payment_race_never_pays_without_valid_approval(client):
    c,tenant=client;id=setup_case(client,'A')
    for user,role in [('finance','재무팀'),('executive','영업임원')]:request(c,tenant,'/api/v1/members',dict(user_id=user,role=role))
    with transaction(tenant,True) as s:ready(s,s['cases'][id]);revision=s['cases'][id]['revision']
    def execute(action):
        body=dict(action=action,revision=revision,reason='취소·지급 경합 검증')
        if action=='simulate_payment':body['idempotency_key']='revoke-race-test'
        return request(c,tenant,f'/api/v1/cases/{id}/actions',body,user='finance' if action=='simulate_payment' else 'executive',admin=False)
    with ThreadPoolExecutor(max_workers=2) as pool:responses=list(pool.map(execute,['revoke','simulate_payment']))
    assert sorted(r.status_code for r in responses)==[200,409]
    with transaction(tenant) as s:
        case=s['cases'][id]
        assert (case['state']=='SIMULATED_PAID' and len(s['payments'])==1) or (case['state']=='REASSESSMENT_REQUIRED' and not s['payments'])


@pytest.mark.skipif(not (os.environ.get('LLM_API_KEY') and os.environ.get('LLM_MODEL') and os.environ.get('LLM_BASE_URL')),reason='BLOCKED: external AI credentials are absent; mock tests are not external AI evidence')
def test_actual_external_model_call():
    s=state();case=D.create_case(s,SUPPORT,'Z','2026-06')
    result=AI.generate(AI.prepare(s,case))
    assert result['summary'] and s['cases'][case['id']]['state']=='DRAFT'
