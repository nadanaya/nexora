"""Exercise the real local HTTP gateway/API; all actors/data are synthetic."""
import json
import sys
from pathlib import Path

import httpx

base='http://127.0.0.1:3107'
trace=[]
def call(actor,path,body=None,expected=200):
    response=httpx.request('GET' if body is None else 'POST',base+'/api/engine/'+path,json=body,
        headers={'Cookie':'demo_actor='+actor},timeout=60)
    value=response.json()
    trace.append(dict(actor=actor,path=path,status=response.status_code,state=value.get('state'),error_code=value.get('code')))
    assert response.status_code==expected,(path,response.status_code,value)
    return value

def workspace():return call('draft','workspace')
def case_for(agency):
    return next((c for c in workspace()['cases'] if c['agency']==agency and c['state']!='SUPERSEDED'),None)
def action(actor,case_id,name,**kw):
    case=next(c for c in workspace()['cases'] if c['id']==case_id)
    return call(actor,f'cases/{case_id}/actions',dict(action=name,revision=case['revision'],reason='합성 제출 검증 회신',**kw))

def prepare(agency):
    case=case_for(agency);assert case
    for kind in ['settlement','relationship']:
        if not any(e['kind']==kind and e['verified'] for e in case['evidence']):
            action('sales',case['id'],'evidence',kind=kind,source_kind='synthetic')
            current=case_for(agency)
            action('support',case['id'],'verify_evidence',evidence_id=current['evidence'][-1]['id'])
            case=case_for(agency)
    for target in case['context']['group']:
        if target in case['payout']:continue
        action('sales',case['id'],'evidence',kind='payout',source_kind='synthetic',agency=target,account='합성은행 1234500-'+target,holder='합성 예금주')
        current=case_for(agency)
        action('support',case['id'],'verify_evidence',evidence_id=current['evidence'][-1]['id'])
    return case_for(agency)

def approve_and_schedule(agency):
    c=prepare(agency)
    action('draft',c['id'],'submit')
    action('support',c['id'],'approve')
    if case_for(agency)['state']=='PENDING_EXECUTIVE':action('executive',c['id'],'approve')
    action('finance',c['id'],'schedule',planned_date='2026-07-03')
    for t in workspace()['tasks']:
        if t['case']==c['id'] and t['department']=='재무팀' and t['state']=='OPEN':call('finance',f"tasks/{t['id']}/resolve",dict(reason='합성 승인 결과에 따른 일정 반영 확인'))
    return case_for(agency)

def run_all():
    a=call('draft','cases',dict(agency='API-N1',month='2026-06'))
    ai=call('draft',f"cases/{a['id']}/analysis",{},expected=503)
    assert ai['code']=='AI_NOT_CONFIGURED'
    a=approve_and_schedule('API-N1')
    paid=action('finance',a['id'],'simulate_payment',idempotency_key='api-normal-payment')
    assert paid['mode']=='simulation' and paid['amount']==2000000
    b=call('draft','cases',dict(agency='API-C1',month='2026-06'))
    b=approve_and_schedule('API-C1');assert b['context']['executive']
    state=workspace()
    impact=call('draft','relationships/change',dict(agency='API-C1',patch={'representative_name':'합성 새 대표','address':'합성 새 주소'},reason='합성 관계 분리',source_kind='synthetic',effective_at='2026-07-01',base_version=state['version'],apply=True))
    assert impact['cases'][0]['before_executive'] and not impact['cases'][0]['after_executive']
    assert case_for('API-C1')['state']=='DRAFT'
    assert next(c for c in workspace()['cases'] if c['id']==b['id'])['schedule']['state']=='SUSPENDED'
    revised=approve_and_schedule('API-C1');assert not revised['context']['executive'] and revised['context']['amount']==900000
    h=call('draft','cases',dict(agency='API-H1',month='2026-06'))
    action('draft',h['id'],'submit');assert case_for('API-H1')['state']=='ON_HOLD'
    prepare('API-H1')
    for t in workspace()['tasks']:
        if t['case']==h['id'] and t['department']=='영업팀' and t['state']=='OPEN':call('sales',f"tasks/{t['id']}/resolve",dict(reason='합성 증빙 회신 검토 완료'))
    action('draft',h['id'],'resubmit');action('support',h['id'],'reject')
    assert case_for('API-H1')['state']=='REJECTED'
    result=dict(source_kind='synthetic',transport='real_http_gateway_next_fastapi_postgresql',
                scenarios={'A_workflow':'passed','A_external_AI':'blocked_missing_credentials','B':'passed','C':'passed'},trace=trace)
    out=Path(__file__).resolve().parents[1]/'submission/evidence/api-demo.json'
    out.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(result['scenarios'],ensure_ascii=False))

if __name__=='__main__':
    command=sys.argv[1] if len(sys.argv)>1 else 'all'
    if command=='all':run_all()
    elif command=='prepare':print(prepare(sys.argv[2])['state'])
    elif command=='approve-schedule':print(approve_and_schedule(sys.argv[2])['state'])
    elif command=='close-sales':
        c=case_for(sys.argv[2])
        for t in workspace()['tasks']:
            if t['case']==c['id'] and t['department']=='영업팀' and t['state']=='OPEN':call('sales',f"tasks/{t['id']}/resolve",dict(reason='합성 증빙 회신 검토 완료'))
        print('Synthetic sales tasks resolved')
    elif command=='snapshot':
        response=httpx.get(base+'/__demo/evidence',timeout=30);response.raise_for_status();print('Snapshot saved')

    elif command=='stop':
        response=httpx.post(base+'/__demo/stop',timeout=20);response.raise_for_status();print('Isolated demo stopped')
