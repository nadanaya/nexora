"""Authenticated, owner-scoped synthetic runs. No operation uses the live tenant key."""
import hashlib
import os
from uuid import UUID, uuid4

from fastapi import Depends
from pydantic import BaseModel, ConfigDict, Field

from . import domain as D, analysis as AI
from .store import transaction


STEPS={
 'A':['요청 접수','규칙 기반 설명','합성 증빙 제출·검토','영업지원 모의 승인','재무 일정 반영','모의 지급·감사'],
 'B':['기존 개별 요청','증빙·상신','영업지원 모의 승인','기존 일정 반영','계좌 정정·Decision Replay','그룹 증빙 재검토','영업지원 재승인','영업임원 모의 승인'],
 'C':['요청 접수','증빙 부족으로 보류','부족 정보 설명','합성 회신·영업 작업 완료','재상신','승인 거절·후속 작업']}


def scope(identity,run_id):
    UUID(run_id)
    owner=hashlib.sha256((identity['tenant']+':'+identity['id']).encode()).hexdigest()
    return identity['tenant']+'-guided-'+owner[:24]+'-'+run_id,owner


def actor(role):
    names={'영업지원팀':'synthetic-reviewer','영업팀':'synthetic-sales','영업임원':'synthetic-executive','재무팀':'synthetic-finance','내부감시팀':'synthetic-auditor'}
    return dict(id=names[role],role=role,admin=False)


def start(s,identity,scenario,owner,key):
    D.require(not s['agencies'],'ALREADY_STARTED','이미 시작한 시연입니다.')
    system=dict(id='synthetic-import',role='조회전용',admin=True)
    files=dict(agencies='agency_id|agency_name|representative_name|address|bank_account_no|rebate_eligible\nDEMO-A|합성 거래처 A|합성 대표|합성 주소 A|SYNTHETIC-11111|True\nDEMO-B|합성 거래처 B|합성 대표|합성 주소 B|SYNTHETIC-22222|True\n',
        rebates='rebate_id|agency_id|period_ym|rebate_amount_krw|approval_status|approver|payment_date\nDEMO-RA|DEMO-A|2026-06|1200000|미지급|NONE|NONE\nDEMO-RB|DEMO-B|2026-06|1100000|미지급|NONE|NONE\n',
        deposits='deposit_id|agency_id|deposit_date|amount_krw|bank_account_no\nDEMO-DP|DEMO-A|2026-06-01|100|SYNTHETIC-11111\n')
    D.import_data(s,system,files,key)
    for collection in ['agencies','rebates']:
        for row in s[collection].values():row['source_kind']='synthetic'
    for row in s['files']+s['deposits']:row['source_kind']='synthetic'
    s['scenario']=dict(label='격리된 Guided Demo · 합성 자료',source_kind='synthetic',code=scenario,owner=owner,step=0,steps=STEPS[scenario])
    D.event(s,system,'GUIDED_DEMO_STARTED','demo',dict(scenario=scenario,source_kind='synthetic'))


def act(s,c,role,action,**extra):
    return D.operate(s,actor(role),c['id'],dict(action=action,revision=c['revision'],reason='Guided Demo 합성 역할의 모의 처리',**extra),os.environ['NEXORA_MATCH_KEY'])


def evidence(s,c):
    for kind in ['settlement','relationship']:
        act(s,c,'영업팀','evidence',kind=kind,source_kind='synthetic')
    for aid in sorted({s['rebates'][i]['agency'] for i in c['items']}):
        act(s,c,'영업팀','evidence',kind='payout',source_kind='synthetic',agency=aid,account='SYNTHETIC-99999',holder='합성 수취인')
    for e in c['evidence']:
        if not e['verified']:act(s,c,'영업지원팀','verify_evidence',evidence_id=e['id'])


def advance(s):
    meta=s['scenario'];step=meta['step'];code=meta['code']
    D.require(step<len(STEPS[code]),'DEMO_COMPLETE','시연이 끝났습니다. 새 실행을 시작하세요.')
    if step==0:
        creator=dict(id='synthetic-creator',role='영업지원팀',admin=False)
        c=D.create_case(s,creator,'DEMO-A','2026-06')
        c['source_kind']='synthetic';meta['case']=c['id']
    else:
        c=s['cases'][meta['case']]
        if (code=='A' and step==1) or (code=='C' and step==2):
            c['analysis']=dict(output=AI.explain(AI.prepare(s,c)),mode='deterministic',model='deterministic-rules',stale=False)
            D.event(s,actor('영업지원팀'),'RULE_EXPLANATION_CREATED',c['id'],dict(mode='deterministic',source_kind='synthetic'))
        elif (code=='A' and step==2) or (code=='B' and step in [1,5]) or (code=='C' and step==3):
            evidence(s,c)
            if code!='C':act(s,c,'영업지원팀','resubmit')
            for t in s['tasks'].values():
                if t['case']==c['id'] and t['department']=='영업팀' and t['state']=='OPEN' and not D.blockers(s,c):
                    t.update(state='DONE',result='합성 회신·증빙 검토 완료',resolution='합성 회신·증빙 검토 완료',resolved_by='synthetic-sales',resolved_at=D.now())
                    D.event(s,actor('영업팀'),'TASK_RESOLVED',t['id'],dict(source_kind='synthetic'))
        elif (code=='A' and step==3) or (code=='B' and step in [2,6]):act(s,c,'영업지원팀','approve')
        elif (code=='A' and step==4) or (code=='B' and step==3):act(s,c,'재무팀','schedule',planned_date='2026-07-03')
        elif code=='A' and step==5:
            act(s,c,'재무팀','simulate_payment',idempotency_key='guided-'+c['id'])
            for t in s['tasks'].values():
                if t['case']==c['id'] and t['department']=='재무팀' and t['state']=='OPEN':
                    t.update(state='DONE',result='모의 지급 결과 확인',resolved_by='synthetic-finance',resolved_at=D.now())
                    D.event(s,actor('재무팀'),'TASK_RESOLVED',t['id'],dict(source_kind='synthetic'))
        elif code=='B' and step==4:
            result=D.apply_change(s,dict(id='synthetic-creator',role='영업지원팀',admin=False),'DEMO-B',dict(bank_account_no='SYNTHETIC-11111'),os.environ['NEXORA_MATCH_KEY'],'합성 계좌 정보 정정','synthetic')
            meta['case']=result['replacement_cases'][0]
        elif code=='B' and step==7:act(s,c,'영업임원','approve')
        elif code=='C' and step in [1,4]:act(s,c,'영업지원팀','resubmit')
        elif code=='C' and step==5:act(s,c,'영업지원팀','reject')
    meta['step']+=1
    D.event(s,actor('영업지원팀'),'GUIDED_DEMO_STEP','demo',dict(step=meta['step'],scenario=code,source_kind='synthetic'))


class Start(BaseModel):
    model_config=ConfigDict(extra='forbid')
    scenario:str=Field(pattern='^[ABC]$')


class Step(BaseModel):
    model_config=ConfigDict(extra='forbid')
    expected_step:int=Field(ge=0,le=8)


def register(app,identity_dependency):
    @app.post('/api/v1/demo/start')
    def create(body:Start,identity=Depends(identity_dependency)):
        run_id=str(uuid4());tenant,owner=scope(identity,run_id)
        with transaction(tenant,True) as s:start(s,identity,body.scenario,owner,os.environ['NEXORA_MATCH_KEY'])
        return dict(run_id=run_id,source_kind='synthetic')

    @app.get('/api/v1/demo/{run_id}/workspace')
    def read(run_id:str,identity=Depends(identity_dependency)):
        tenant,owner=scope(identity,run_id)
        with transaction(tenant) as s:
            D.require(s.get('scenario',{}).get('owner')==owner,'DEMO_NOT_FOUND','내 계정의 시연이 아닙니다.',404)
            return D.public_state(s,dict(**identity,role='조회전용'))

    @app.post('/api/v1/demo/{run_id}/step')
    def step(run_id:str,body:Step,identity=Depends(identity_dependency)):
        tenant,owner=scope(identity,run_id)
        with transaction(tenant,True) as s:
            D.require(s.get('scenario',{}).get('owner')==owner,'DEMO_NOT_FOUND','내 계정의 시연이 아닙니다.',404)
            D.require(s['scenario']['step']==body.expected_step,'STALE_DEMO_STEP','이미 처리한 단계입니다. 최신 시연을 불러오세요.')
            advance(s)
        with transaction(tenant) as s:return D.public_state(s,dict(**identity,role='조회전용'))
