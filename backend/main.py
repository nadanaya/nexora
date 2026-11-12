import hashlib
import hmac
import json
import os
import time
from pathlib import Path
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from . import domain as D
from . import analysis as AI
from .store import migrate, transaction, connection
from .guided_demo import register as register_demo
from . import showcase as Showcase


@asynccontextmanager
async def lifespan(app):
    for name in ['NEXORA_INTERNAL_SECRET','NEXORA_MATCH_KEY','DATABASE_URL']:
        if not os.environ.get(name):
            raise RuntimeError(f'{name} is required')
    migrate()
    bootstrap=Path(__file__).with_name('bootstrap.json')
    if bootstrap.exists() and os.environ.get('NEXORA_BOOTSTRAP')=='1':
        data=json.loads(bootstrap.read_text(encoding='utf-8'))
        D.require(data['matching_key_fingerprint']==hashlib.sha256(os.environ['NEXORA_MATCH_KEY'].encode()).hexdigest(),
                  'MATCH_KEY_CHANGED','비교 키가 변경됐습니다. 기존 데이터와 다른 키로 시작하지 않습니다.',503)
        tenant = os.environ.get('APPHUB_TENANT','lounge')
        with transaction(tenant) as s:
            needs_import = not s['agencies']
            if not needs_import:
                D.require(s.get('matching_key_fingerprint')==data['matching_key_fingerprint'],
                          'MATCH_KEY_CHANGED','기존 데이터의 비교 키가 다릅니다. 이전 키를 유지해야 합니다.',503)
        if needs_import:
            with transaction(tenant,True) as s:
                if not s['agencies']:
                    s.update(data)
                else:
                    D.require(s.get('matching_key_fingerprint')==data['matching_key_fingerprint'],
                              'MATCH_KEY_CHANGED','기존 데이터의 비교 키가 다릅니다. 이전 키를 유지해야 합니다.',503)
    yield


app=FastAPI(title='NEXORA W07',version='1.0.0',lifespan=lifespan,docs_url=None,redoc_url=None)


@app.exception_handler(D.RuleError)
async def business_error(request,exc):
    return JSONResponse(dict(error=exc.message,code=exc.code),status_code=exc.status)


@app.exception_handler(ValueError)
async def invalid_value(request,exc):
    return JSONResponse(dict(error='날짜 또는 입력 형식을 확인하세요.',code='INVALID_VALUE'),status_code=422)


async def identity(request:Request):
    raw=await request.body()
    stamp=request.headers.get('x-nx-time','')
    identity=request.headers.get('x-nx-identity','')
    signature=request.headers.get('x-nx-signature','')
    secret=os.environ.get('NEXORA_INTERNAL_SECRET','')
    D.require(len(secret)>=32,'SERVICE_UNAVAILABLE','내부 인증 설정이 필요합니다.',503)
    D.require(stamp.isdigit() and abs(time.time()-int(stamp))<=30,'AUTH_EXPIRED','인증이 만료됐습니다.',401)
    canonical='\n'.join([stamp,request.method,request.url.path,identity,hashlib.sha256(raw).hexdigest()])
    expected=hmac.new(secret.encode(),canonical.encode(),hashlib.sha256).hexdigest()
    D.require(hmac.compare_digest(expected,signature),'BAD_SIGNATURE','인증 서명이 올바르지 않습니다.',401)
    actor=json.loads(bytes.fromhex(identity))
    D.require(actor.get('tenant')==os.environ.get('APPHUB_TENANT','lounge') and actor.get('id'), 'TENANT_DENIED','테넌트 접근이 거절됐습니다.',403)
    return actor


def actor_in(s,identity):
    if identity.get('demo_identity'):
        return {**identity, 'role': identity['business_role']}
    member=s['members'].get(identity['id'])
    D.require(member or identity.get('admin'),'NOT_MEMBER','관리자가 업무 역할을 등록해야 합니다.',403)
    return dict(**identity,role=member['role'] if member else '조회전용')


class Input(BaseModel):
    model_config=ConfigDict(extra='forbid')


register_demo(app,identity)


class Files(Input):
    agencies:str=Field(max_length=5_000_000)
    rebates:str=Field(max_length=5_000_000)
    deposits:str=Field(max_length=5_000_000)


class NewCase(Input):
    agency:str=Field(max_length=100)
    month:str=Field(pattern=r'^\d{4}-(0[1-9]|1[0-2])$')


class Action(Input):
    action:str
    revision:int=Field(ge=1)
    reason:str=Field(default='',max_length=500)
    kind:str|None=None
    source_kind:str|None=None
    agency:str|None=None
    account:str|None=Field(default=None,max_length=100)
    holder:str|None=Field(default=None,max_length=100)
    evidence_id:str|None=None
    planned_date:str|None=None
    idempotency_key:str|None=None


class Member(Input):
    user_id:str=Field(min_length=1,max_length=100)
    role:str


class Change(Input):
    agency:str
    patch:dict[str,str]
    reason:str=Field(min_length=2,max_length=500)
    source_kind:str
    effective_at:str
    base_version:int
    apply:bool=False


@app.get('/healthz')
def health():return dict(status='ok',mode='simulation')


@app.get('/readyz')
def ready():
    with connection() as conn:conn.execute('SELECT 1')
    return dict(status='ready')


@app.get('/api/v1/workspace')
def workspace(identity=Depends(identity)):
    with transaction(identity['tenant']) as s:
        return dict(**D.public_state(s,actor_in(s,identity)),ai=AI.configuration())


@app.post('/api/v1/members')
def member(body:Member,identity=Depends(identity)):
    D.require(identity['admin'],'FORBIDDEN','관리자만 역할을 등록합니다.',403)
    D.require(body.role in D.ROLES,'ROLE','업무 역할을 확인하세요.',422)
    with transaction(identity['tenant'],True) as s:
        actor=actor_in(s,identity)
        previous=s['members'].get(body.user_id)
        s['members'][body.user_id]=dict(role=body.role)
        # Removing/changing an approver's authority invalidates unexecuted approvals.
        if previous and previous['role']!=body.role:
            for c in s['cases'].values():
                if any(a['actor']==body.user_id for a in c['approvals']):D.invalidate(s,actor,c,'승인자 업무 권한 변경')
            with transaction(Showcase.tenant(identity['tenant']),True) as demo:
                for c in demo['cases'].values():
                    if any(a['actor']==body.user_id for a in c['approvals']):
                        D.invalidate(demo,actor,c,'승인자 업무 권한 변경')
        D.event(s,actor,'ROLE_ASSIGNED',body.user_id,dict(role=body.role))
        return dict(ok=True)


@app.post('/api/v1/datasets/import')
def ingest(body:Files,identity=Depends(identity)):
    with transaction(identity['tenant'],True) as s:
        return D.import_data(s,actor_in(s,identity),body.model_dump(),os.environ['NEXORA_MATCH_KEY'])


@app.post('/api/v1/cases')
def new_case(body:NewCase,identity=Depends(identity)):
    with transaction(identity['tenant'],True) as s:
        return D.create_case(s,actor_in(s,identity),body.agency,body.month)


@app.post('/api/v1/cases/{id}/actions')
def operate(id:str,body:Action,identity=Depends(identity)):
    with transaction(identity['tenant'],True) as s:
        return D.operate(s,actor_in(s,identity),id,body.model_dump(exclude_none=True),os.environ['NEXORA_MATCH_KEY'])


@app.post('/api/v1/relationships/change')
def change(body:Change,identity=Depends(identity)):
    D.require(body.source_kind in ['confirmed','synthetic','assumption'],'PROVENANCE','정정 자료 구분을 선택하세요.',422)
    D.require(body.effective_at=='2026-07-01','EFFECTIVE_DATE','현재 버전은 가상 기준일 정정만 지원합니다. 다른 적용일은 별도 시나리오로 검토하세요.',422)
    with transaction(identity['tenant'],body.apply) as s:
        actor=actor_in(s,identity)
        D.require(actor['role']=='영업지원팀','FORBIDDEN','영업지원팀이 관계 정보를 정정합니다.',403)
        D.require(body.base_version==s['version'],'STALE_PREVIEW','데이터가 변경됐습니다. 다시 미리보기하세요.')
        after,impact=D.change_preview(s,body.agency,body.patch,os.environ['NEXORA_MATCH_KEY'])
        if body.apply:
            impact=D.apply_change(s,actor,body.agency,body.patch,os.environ['NEXORA_MATCH_KEY'],body.reason,body.source_kind,body.effective_at)
        return impact


class Resolution(Input):
    reason:str=Field(min_length=2,max_length=500)


class Correction(Input):
    amount:int=Field(ge=0,le=1_000_000_000_000)
    reason:str=Field(min_length=2,max_length=500)
    source_kind:str
    base_version:int


@app.post('/api/v1/rebates/{id}/correct')
def correct(id:str,body:Correction,identity=Depends(identity)):
    with transaction(identity['tenant'],True) as s:
        actor=actor_in(s,identity)
        D.require(actor['role']=='영업지원팀','FORBIDDEN','영업지원팀이 정산 정보를 정정합니다.',403)
        D.require(body.base_version==s['version'],'STALE_REVISION','정보가 변경됐습니다.')
        D.require(body.source_kind in ['confirmed','synthetic','assumption'],'PROVENANCE','정정 자료 구분을 표시하세요.',422)
        row=s['rebates'].get(id)
        D.require(row is not None,'NOT_FOUND','장려금 항목이 없습니다.',404)
        paid=row['historical_paid'] or any(id in p['items'] for p in s['payments'].values())
        D.require(not paid,'PAID_CORRECTION','지급된 금액은 덮어쓰지 않습니다. 사후 검토 작업을 생성하세요.')
        before=row['amount']
        row.setdefault('original_amount',before)
        row.update(amount=body.amount,correction_source_kind=body.source_kind,correction_reason=body.reason)
        for case in s['cases'].values():
            if case['state']!='SUPERSEDED' and case['month']==row['month'] and row['agency'] in D.members(s,case['agency']):
                D.invalidate(s,actor,case,body.reason)
        D.event(s,actor,'REBATE_CORRECTED',id,dict(before=before,after=body.amount,source_kind=body.source_kind,reason=body.reason))
        return dict(ok=True)


@app.post('/api/v1/tasks/{id}/resolve')
def resolve(id:str,body:Resolution,identity=Depends(identity)):
    with transaction(identity['tenant'],True) as s:
        actor=actor_in(s,identity)
        t=s['tasks'].get(id)
        D.require(t is not None,'NOT_FOUND','작업이 없습니다.',404)
        D.require(actor['role']==t['department'],'FORBIDDEN','담당 부서만 작업을 완료합니다.',403)
        D.require(t['state']=='OPEN','INVALID_STATE','이미 완료한 작업입니다.')
        if t['case'] in s['cases'] and t['department']!='내부감시팀':
            c=s['cases'][t['case']]
            D.require(not D.blockers(s,c) if t['department']=='영업팀' else bool(c.get('schedule') and c['schedule']['state'] in ['SCHEDULED','SIMULATED_PAID']),
                      'TASK_BLOCKED','증빙 검토 또는 일정 반영을 먼저 완료하세요.')
        t.update(state='DONE',resolution=body.reason,result=body.reason,resolved_by=actor['id'],resolved_at=D.now())
        D.event(s,actor,'TASK_RESOLVED',id,dict(reason=body.reason))
        return t


@app.get('/api/v1/analysis/configuration')
def analysis_configuration(identity=Depends(identity)):
    with transaction(identity['tenant']) as s:actor_in(s,identity)
    return AI.configuration()


@app.post('/api/v1/cases/{id}/explanation')
def explanation(id:str,identity=Depends(identity)):
    with transaction(identity['tenant'],True) as s:
        actor=actor_in(s,identity)
        D.require(id in s['cases'],'NOT_FOUND','심사가 없습니다.',404)
        c=s['cases'][id]
        result=AI.explain(AI.prepare(s,c))
        c['analysis']=dict(output=result,model='deterministic-rules',mode='deterministic',revision=c['revision'],stale=False)
        D.event(s,actor,'RULE_EXPLANATION_CREATED',id,dict(revision=c['revision'],mode='deterministic'))
        return c['analysis']


@app.post('/api/v1/cases/{id}/analysis')
def analysis(id:str,identity=Depends(identity)):
    with transaction(identity['tenant']) as s:
        actor=actor_in(s,identity)
        D.require(id in s['cases'],'NOT_FOUND','심사가 없습니다.',404)
        c=s['cases'][id]
        revision=c['revision']
        input_hash=D.digest(D.context(s,c))
        inputs=AI.prepare(s,c)
    try:
        result=AI.generate(inputs)
    except D.RuleError as error:
        with transaction(identity['tenant'],True) as s:
            D.event(s,actor,'AI_ANALYSIS_FAILED',id,dict(code=error.code,revision=revision,input_hash=input_hash))
        raise
    with transaction(identity['tenant'],True) as s:
        D.require(s['cases'][id]['revision']==revision and D.digest(D.context(s,s['cases'][id]))==input_hash,'STALE_ANALYSIS','분석 중 정보가 변경됐습니다.')
        s['cases'][id]['analysis']=dict(output=result,model=result['execution']['model'],execution=result['execution'],input_hash=input_hash,source_kind='derived',at=D.now(),stale=False)
        D.event(s,actor,'AI_ANALYSIS_CREATED',id,dict(model=result['execution']['model'],provider=result['execution']['provider'],input_hash=input_hash))
    return result


# Same handlers and same role/state checks; only the aggregate key changes.
# The signed identity and operational member registry remain authoritative.
async def showcase_identity(request: Request):
    real = await identity(request)
    with transaction(real['tenant']) as s:
        actor = actor_in(s, real)
    return {**real, 'tenant': Showcase.tenant(real['tenant']), 'demo_identity': True,
            'business_role': actor['role'], 'base_tenant': real['tenant']}


@app.post('/api/v1/showcase/seed')
def showcase_seed(identity=Depends(identity)):
    D.require(identity['admin'], 'FORBIDDEN', '관리자만 DEMO 초기 데이터를 생성합니다.', 403)
    with transaction(identity['tenant']) as original:
        actor = actor_in(original, identity)
        with transaction(Showcase.tenant(identity['tenant']), True) as demo:
            return Showcase.seed(demo, original, actor, os.environ['NEXORA_MATCH_KEY'])


@app.get('/api/v1/showcase/workspace')
def showcase_workspace(identity=Depends(showcase_identity)):
    result = workspace(identity)
    if identity['admin']:
        with transaction(identity['base_tenant']) as original:
            result['members'] = original['members']
    if not result['demo']:
        result['demo'] = dict(initialized=False, provenance='DEMO', source_kind='synthetic', label='DEMO 초기 데이터 미생성')
    return result


@app.post('/api/v1/showcase/cases')
def showcase_case(body: NewCase, identity=Depends(showcase_identity)):
    return new_case(body, identity)


@app.post('/api/v1/showcase/cases/{id}/actions')
def showcase_action(id: str, body: Action, identity=Depends(showcase_identity)):
    if body.action == 'evidence':
        D.require(body.source_kind == 'synthetic', 'DEMO_SOURCE', 'DEMO 증빙은 합성 자료로 표시하세요.', 422)
    return operate(id, body, identity)


@app.post('/api/v1/showcase/cases/{id}/explanation')
def showcase_explanation(id: str, identity=Depends(showcase_identity)):
    return explanation(id, identity)


@app.post('/api/v1/showcase/cases/{id}/analysis')
def showcase_analysis(id: str, identity=Depends(showcase_identity)):
    return analysis(id, identity)


@app.post('/api/v1/showcase/relationships/change')
def showcase_change(body: Change, identity=Depends(showcase_identity)):
    D.require(body.source_kind == 'synthetic', 'DEMO_SOURCE', 'DEMO 정정은 합성 자료로 표시하세요.', 422)
    return change(body, identity)


@app.post('/api/v1/showcase/rebates/{id}/correct')
def showcase_correct(id: str, body: Correction, identity=Depends(showcase_identity)):
    D.require(body.source_kind == 'synthetic', 'DEMO_SOURCE', 'DEMO 정정은 합성 자료로 표시하세요.', 422)
    return correct(id, body, identity)


@app.post('/api/v1/showcase/tasks/{id}/resolve')
def showcase_resolve(id: str, body: Resolution, identity=Depends(showcase_identity)):
    return resolve(id, body, identity)
