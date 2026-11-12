"""Requires disposable PostgreSQL. Never marks browser/production success."""
from backend import showcase as S
from backend.store import connection
from backend.tests.test_engine import client, request  # noqa: F401
from backend.tests.test_showcase import setup, get, action


def stored(tenant):
    # A fresh DB connection, independent of the API request transaction.
    with connection() as conn:
        return conn.execute('SELECT payload FROM nx_state WHERE tenant=%s',(S.tenant(tenant),)).fetchone()[0]


def test_approval_payment_and_task_survive_fresh_reads(client):
    api,tenant=setup(client)
    assert request(api,tenant,'/api/v1/showcase/seed',{}).status_code==200
    c=next(c for c in get(api,tenant)['cases'] if c['state']=='PENDING_SUPPORT')
    r=action(api,tenant,c,'approve',user='reviewer');assert r.status_code==200
    c=r.json();assert stored(tenant)['cases'][c['id']]['approvals']
    if c['state']=='PENDING_EXECUTIVE':
        r=action(api,tenant,c,'approve',user='exec');assert r.status_code==200;c=r.json()
    assert next(x for x in get(api,tenant)['cases'] if x['id']==c['id'])['state']=='APPROVED'
    r=action(api,tenant,c,'schedule',user='finance',planned_date='2026-07-03');assert r.status_code==200;c=r.json()
    task=next(t for t in get(api,tenant)['tasks'] if t['case']==c['id'] and t['title']=='지급 일정 반영')
    r=request(api,tenant,f"/api/v1/showcase/tasks/{task['id']}/resolve",{'reason':'DEMO 재무 일정 확인'},user='finance',admin=False)
    assert r.status_code==200 and stored(tenant)['tasks'][task['id']]['state']=='DONE'
    r=action(api,tenant,c,'simulate_payment',user='finance',idempotency_key='persistence-payment-1');assert r.status_code==200
    view=get(api,tenant);db=stored(tenant)
    assert db['cases'][c['id']]['state']=='SIMULATED_PAID' and len(view['payments'])==1
    assert any(e['kind']=='SIMULATED_PAYMENT' for e in db['events'])
    assert action(api,tenant,c,'simulate_payment',user='finance',idempotency_key='persistence-payment-2').status_code==409


def test_reject_resubmit_hold_and_role_payload_are_persistent(client):
    api,tenant=setup(client)
    assert request(api,tenant,'/api/v1/showcase/seed',{}).status_code==200
    c=next(c for c in get(api,tenant)['cases'] if c['state']=='PENDING_SUPPORT')
    assert action(api,tenant,c,'approve',user='sales').status_code==403
    # Browser role fields cannot override signed identity/server member registry.
    assert action(api,tenant,c,'approve',user='sales',role='영업지원팀').status_code==422
    r=action(api,tenant,c,'reject',user='reviewer');assert r.status_code==200;c=r.json()
    assert stored(tenant)['cases'][c['id']]['state']=='REJECTED'
    r=action(api,tenant,c,'resubmit',user='maker');assert r.status_code==200;c=r.json()
    assert stored(tenant)['cases'][c['id']]['state']=='PENDING_SUPPORT'
    r=action(api,tenant,c,'hold',user='reviewer');assert r.status_code==200
    assert stored(tenant)['cases'][c['id']]['state']=='ON_HOLD'
    assert next(x for x in get(api,tenant)['cases'] if x['id']==c['id'])['state']=='ON_HOLD'
