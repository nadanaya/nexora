"""Deterministic W07 rules. Source files are never written by this module."""
import csv
import hashlib
import hmac
import io
import json
import re
import unicodedata
from collections import Counter
from copy import deepcopy
from datetime import date, datetime, timezone
from itertools import combinations
from uuid import uuid4

import networkx as nx

LIMIT = 2_000_000
RULES = 'w07-2of3-exact-v1'
ROLES = ['영업지원팀', '영업임원', '영업팀', '재무팀', '내부감시팀', '조회전용']
FIELDS = ['representative_name', 'address', 'bank_account_no']


class RuleError(Exception):
    def __init__(self, code, message, status=409):
        self.code, self.message, self.status = code, message, status


def require(ok, code, message, status=409):
    if not ok:
        raise RuleError(code, message, status)


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def now():
    return datetime.now(timezone.utc).isoformat()


def token(value, key):
    value = unicodedata.normalize('NFC', str(value)).strip()
    if not value or value.upper() == 'NONE':
        return ''
    return hmac.new(key.encode(), value.encode(), hashlib.sha256).hexdigest()


def empty():
    return dict(version=0, agencies={}, rebates={}, deposits=[], cases={}, tasks={}, payments={},
                members={}, impacts={}, events=[], files=[], graph_revision=0)


def event(s, actor, kind, target, details):
    previous = s['events'][-1]['hash'] if s['events'] else ''
    e = dict(id=str(uuid4()), sequence=len(s['events'])+1, at=now(), actor=actor['id'],
             role=actor['role'], kind=kind, target=target, details=deepcopy(details), previous_hash=previous)
    if s.get('demo'):
        e.update(source_kind='synthetic', provenance='DEMO')
    e['hash'] = digest(e)
    s['events'].append(e)
    return e


def graph(s):
    g = nx.Graph()
    g.add_nodes_from(s['agencies'])
    for (a, x), (b, y) in combinations(sorted(s['agencies'].items()), 2):
        matched = [f for f in FIELDS if x['keys'][f] and x['keys'][f] == y['keys'][f]]
        if len(matched) >= 2:
            g.add_edge(a, b, matched_fields=matched)
    groups = [sorted(c) for c in nx.connected_components(g)]
    return g, sorted(groups)


def members(s, agency):
    return next(c for c in graph(s)[1] if agency in c)


def read_csv(content, required):
    require(isinstance(content, str) and len(content.encode()) <= 5_000_000,
            'INVALID_FILE', '파일은 UTF-8 텍스트 5MB 이하여야 합니다.', 422)
    reader = csv.DictReader(io.StringIO(content.removeprefix('\ufeff')), delimiter='|', strict=True)
    require(reader.fieldnames and len(set(reader.fieldnames)) == len(reader.fieldnames)
            and set(required) <= set(reader.fieldnames), 'CSV_HEADERS', '필수 열 또는 파이프 구분자를 확인하세요.', 422)
    rows = list(reader)
    require(0 < len(rows) <= 10000 and all(None not in r and None not in r.values() for r in rows),
            'CSV_ROWS', '행 수 또는 열 수가 올바르지 않습니다.', 422)
    return rows


def import_data(s, actor, files, key):
    require(actor['admin'], 'FORBIDDEN', '관리자만 원본을 등록할 수 있습니다.', 403)
    require(not s['agencies'], 'ALREADY_IMPORTED', '등록된 원본은 덮어쓰지 않습니다.')
    a = read_csv(files['agencies'], ['agency_id','agency_name',*FIELDS,'rebate_eligible'])
    r = read_csv(files['rebates'], ['rebate_id','agency_id','period_ym','rebate_amount_krw','approval_status','approver','payment_date'])
    d = read_csv(files['deposits'], ['deposit_id','agency_id','deposit_date','amount_krw','bank_account_no'])
    for kind in ['agencies', 'rebates', 'deposits']:
        s['files'].append(dict(kind=kind, sha256=hashlib.sha256(files[kind].encode()).hexdigest(),
                               source_kind='original', encoding='UTF-8', delimiter='|'))
    for i, x in enumerate(a, 2):
        id = x['agency_id']
        require(id and id not in s['agencies'], 'DUPLICATE_AGENCY', '거래처 식별자가 중복됩니다.', 422)
        require(x['rebate_eligible'] in ['True','False'], 'ELIGIBILITY', '지급 대상 여부를 확인하세요.', 422)
        s['agencies'][id] = dict(id=id, name=x['agency_name'], eligible=x['rebate_eligible']=='True',
            keys={f:token(x[f],key) for f in FIELDS}, version=1, source_row=i, source_kind='original')
    for i, x in enumerate(r, 2):
        id = x['rebate_id']
        require(id and id not in s['rebates'] and x['agency_id'] in s['agencies'], 'REBATE_REFERENCE', '장려금 중복 또는 거래처 참조 오류입니다.', 422)
        require(re.fullmatch(r'\d{4}-(0[1-9]|1[0-2])',x['period_ym']) and x['rebate_amount_krw'].isdigit(), 'AMOUNT_PERIOD', '월과 금액을 확인하세요.', 422)
        require(x['approval_status'] in ['승인','미지급','반려'], 'SOURCE_STATUS', '원본 상태를 확인하세요.', 422)
        paid = x['payment_date'] != 'NONE'
        if paid:
            date.fromisoformat(x['payment_date'])
        s['rebates'][id] = dict(id=id, agency=x['agency_id'], month=x['period_ym'], amount=int(x['rebate_amount_krw']),
            original_status=x['approval_status'], original_approver=x['approver'], historical_paid=paid,
            payment_date=x['payment_date'], source_row=i, source_kind='original')
    ids = set()
    for i, x in enumerate(d, 2):
        require(x['deposit_id'] not in ids and x['agency_id'] in s['agencies'], 'DEPOSIT_REFERENCE', '입금 중복 또는 거래처 참조 오류입니다.', 422)
        ids.add(x['deposit_id'])
        mismatch = token(x['bank_account_no'],key) != s['agencies'][x['agency_id']]['keys']['bank_account_no']
        s['deposits'].append(dict(id=x['deposit_id'],agency=x['agency_id'], mismatch=mismatch, source_row=i, source_kind='original'))
    s['graph_revision'] = 1
    s['matching_key_fingerprint']=hashlib.sha256(key.encode()).hexdigest()
    event(s,actor,'DATASET_IMPORTED','dataset',reconcile(s))
    # Historical exceptions are review tasks, never new payment requests.
    for group in graph(s)[1]:
        for month in sorted({x['month'] for x in s['rebates'].values()}):
            rows = [x for x in s['rebates'].values() if x['agency'] in group and x['month']==month]
            if sum(x['amount'] for x in rows)>LIMIT and any(x['historical_paid'] and x['original_approver']!='영업임원' for x in rows):
                task(s,actor,'dataset','영업팀','과거 그룹 합산 승인 증거 확인',f'{month} / {", ".join(group)}')
    return reconcile(s)


def reconcile(s):
    r = list(s['rebates'].values())
    return dict(agencies=len(s['agencies']), rebates=len(r), deposits=len(s['deposits']),
        total=sum(x.get('original_amount',x['amount']) for x in r), current_total=sum(x['amount'] for x in r), status_counts=dict(Counter(x['original_status'] for x in r)),
        unpaid_including_rejected=sum(x['amount'] for x in r if not x['historical_paid']),
        related_groups=[c for c in graph(s)[1] if len(c)>1],
        mismatches=[x['id'] for x in s['deposits'] if x['mismatch']], source_kind='derived', rules_version=RULES)


def task(s,actor,case,department,title,reason):
    existing = next((t for t in s['tasks'].values() if t['case']==case and t['title']==title and t['state']=='OPEN'),None)
    if existing:
        if existing['reason']!=reason:
            existing['reason']=reason
            existing['updated_at']=now()
            event(s,actor,'TASK_UPDATED',existing['id'],dict(reason=reason))
        return existing
    t = dict(id=str(uuid4()),case=case,department=department,assignee_role=department,title=title,reason=reason,state='OPEN', created_at=now(),due_date=None,result=None)
    if s.get('demo'):
        t.update(source_kind='synthetic', provenance='DEMO')
    s['tasks'][t['id']]=t
    event(s,actor,'TASK_CREATED',t['id'],dict(case=case,department=department,title=title))
    return t


def context(s,c):
    group=members(s,c['agency'])
    rows=[x for x in s['rebates'].values() if x['agency'] in group and x['month']==c['month']
          and x['original_status']!='반려']
    total=sum(x['amount'] for x in rows)
    return dict(group=group, exposure=total, executive=total>LIMIT,
                versions={a:s['agencies'][a]['version'] for a in group},
                items=c['items'], amount=sum(s['rebates'][i]['amount'] for i in c['items']),
                evidence=c['evidence'], payout=c['payout'], rules=RULES)


def blockers(s,c):
    result=[]
    for kind in ['settlement','payout']:
        if not any(e['kind']==kind and e['verified'] for e in c['evidence']):
            result.append('정산 근거 없음' if kind=='settlement' else '검증된 지급 수취계좌 증빙 없음')
    group=members(s,c['agency'])
    needs_explanation=len(group)>1 or any(d['agency'] in group and d['mismatch'] for d in s['deposits'])
    if needs_explanation and not any(e['kind']=='relationship' and e['verified'] for e in c['evidence']):
        result.append('관계·입금 불일치 소명 검토 필요')
    if set(c['payout']) != {s['rebates'][i]['agency'] for i in c['items']}:
        result.append('지급 대상별 수취계좌 미확인')
    elif any(not any(e['id']==p['evidence_id'] and e['verified'] for e in c['evidence']) for p in c['payout'].values()):
        result.append('지급 대상별 계좌 증빙 검토 미완료')
    if not {s['rebates'][i]['agency'] for i in c['items']} <= set(group):
        result.append('그룹 분리 후 심사 재기안 필요')
    return result


def invalidate(s,actor,c,reason):
    if c['state']=='SIMULATED_PAID':
        task(s,actor,c['id'],'재무팀','지급 후 변경 검토',reason)
        task(s,actor,c['id'],'내부감시팀','기지급 관계 변경 조사',reason)
        return
    before=c['state']
    c['revision']+=1
    c['state']='REASSESSMENT_REQUIRED'
    c['approvals']=[]
    if c.get('analysis'):
        c['analysis']['stale']=True
    if c.get('schedule'):
        c['schedule']['state']='SUSPENDED'
        event(s,actor,'SCHEDULE_SUSPENDED',c['id'],dict(reason=reason))
    task(s,actor,c['id'],'영업팀','변경 영향 소명',reason)
    task(s,actor,c['id'],'재무팀','지급 일정 재검토',reason)
    task(s,actor,c['id'],'내부감시팀','변경된 관계와 승인 근거 검토',reason)
    event(s,actor,'APPROVAL_INVALIDATED',c['id'],dict(before=before,after=c['state'],reason=reason,revision=c['revision']))


def create_case(s,actor,agency,month):
    require(actor['role']=='영업지원팀','FORBIDDEN','영업지원팀이 심사를 기안합니다.',403)
    require(agency in s['agencies'],'NOT_FOUND','거래처가 없습니다.',404)
    group=members(s,agency)
    items=[x['id'] for x in s['rebates'].values() if x['agency'] in group and x['month']==month
           and x['original_status']=='미지급' and not x['historical_paid']]
    require(items,'NO_ITEMS','새로 지급할 미지급 건이 없습니다.')
    require(all(s['agencies'][s['rebates'][i]['agency']]['eligible'] for i in items),'INELIGIBLE','지급 대상 거래처가 아닙니다.')
    require(not any(set(items)&set(c['items']) for c in s['cases'].values() if c['state']!='SUPERSEDED'),'RESERVED','이미 심사가 생성된 항목입니다. 기존 심사를 재검토하세요.')
    c=dict(id=str(uuid4()),agency=agency,month=month,items=items,revision=1,state='DRAFT',
           creator=actor['id'],evidence=[],payout={},approvals=[],schedule=None,source_kind='derived')
    if s.get('demo'):
        c.update(source_kind='synthetic', provenance='DEMO', original_reference=dict(agency=agency, items=deepcopy(items), scope='W07_SNAPSHOT'))
    s['cases'][c['id']]=c
    event(s,actor,'CASE_CREATED',c['id'],dict(items=items,context=context(s,c)))
    return c


def operate(s,actor,id,body,key):
    require(id in s['cases'],'NOT_FOUND','심사를 찾을 수 없습니다.',404)
    c=s['cases'][id]
    action=body['action']
    require(actor['role']!='조회전용','FORBIDDEN','조회 권한으로 처리할 수 없습니다.',403)
    if action=='simulate_payment':
        require(actor['role']=='재무팀','FORBIDDEN','재무팀이 모의 지급을 실행합니다.',403)
        idem=body.get('idempotency_key','')
        require(8<=len(idem)<=128,'IDEMPOTENCY_REQUIRED','중복 방지 키가 필요합니다.',422)
        request_hash=digest(dict(case=id,body=body))
        if idem in s['payments']:
            p=s['payments'][idem]
            require(p['request_hash']==request_hash,'KEY_REUSED','같은 키를 다른 요청에 사용할 수 없습니다.')
            return p
    require(c['revision']==body['revision'],'STALE_REVISION','정보가 변경됐습니다. 새로고침하세요.')
    require(c['state']!='SIMULATED_PAID','ALREADY_PAID','이미 모의 지급했습니다. 조정 검토만 가능합니다.')
    require(c['state']!='SUPERSEDED','SUPERSEDED','관계 변경으로 대체된 심사입니다. 새 심사를 사용하세요.')
    reason=body.get('reason','').strip()
    require(2<=len(reason)<=500,'REASON_REQUIRED','처리 근거를 2~500자로 입력하세요.',422)
    before=c['state']
    if action=='evidence':
        require(actor['role'] in ['영업팀','영업지원팀'],'FORBIDDEN','영업 담당자가 증빙을 제출합니다.',403)
        require(body.get('kind') in ['settlement','payout','relationship'],'EVIDENCE_KIND','증빙 유형을 확인하세요.',422)
        require(body.get('source_kind') in ['assumption','synthetic','confirmed'],'PROVENANCE','실제 확인 또는 모의 자료인지 표시하세요.',422)
        if c['state']!='DRAFT':
            invalidate(s,actor,c,'증빙 또는 수취계좌 변경')
        e=dict(id=str(uuid4()),kind=body['kind'],reference=reason,source_kind=body['source_kind'],
               verified=False,submitted_by=actor['id'])
        if e['kind']=='payout':
            agency=body.get('agency')
            require(agency in {s['rebates'][i]['agency'] for i in c['items']},'PAYOUT_AGENCY','지급 대상 거래처를 확인하세요.',422)
            account=body.get('account','').strip()
            require(5<=len(account)<=100 and len(body.get('holder','').strip())>=2,'PAYOUT_ACCOUNT','수취계좌와 예금주를 확인하세요.',422)
            e['agency']=agency
            c['payout'][agency]=dict(match_key=token(account,key),holder_key=token(body['holder'],key),masked='••••'+re.sub(r'\D','',account)[-4:],evidence_id=e['id'])
            for prior in c['evidence']:
                if prior['kind']=='payout' and prior.get('agency')==agency:
                    prior['verified']=False
        c['evidence'].append(e)
    elif action=='verify_evidence':
        require(actor['role']=='영업지원팀','FORBIDDEN','영업지원팀이 증빙을 검토합니다.',403)
        e=next((e for e in c['evidence'] if e['id']==body.get('evidence_id')),None)
        require(e is not None,'EVIDENCE_NOT_FOUND','증빙이 없습니다.',404)
        require(e['submitted_by']!=actor['id'],'SELF_VERIFY','제출자와 검토자를 분리하세요.',403)
        if c['state'] in ['PENDING_SUPPORT','PENDING_EXECUTIVE','APPROVED','SCHEDULED']:
            invalidate(s,actor,c,'증빙 검증 결과 변경')
        if e['kind']=='payout':
            require(c['payout'][e['agency']]['evidence_id']==e['id'],'SUPERSEDED','교체된 계좌 증빙입니다.')
        e.update(verified=True,verified_by=actor['id'],verified_at=now())
    elif action in ['submit','resubmit']:
        require(actor['role']=='영업지원팀','FORBIDDEN','영업지원팀이 상신합니다.',403)
        require(c['state'] in ['DRAFT','ON_HOLD','REJECTED','REASSESSMENT_REQUIRED'],'INVALID_STATE','현재 상태에서 상신할 수 없습니다.')
        if c['state']=='REJECTED':
            c['revision']+=1
        c['approvals']=[]
        missing=blockers(s,c)
        c['state']='ON_HOLD' if missing else 'PENDING_SUPPORT'
        if missing:
            task(s,actor,id,'영업팀','필수 증빙 보완',' / '.join(missing))
    elif action=='approve':
        expected='영업지원팀' if c['state']=='PENDING_SUPPORT' else '영업임원' if c['state']=='PENDING_EXECUTIVE' else None
        require(expected is not None,'INVALID_STATE','승인 대기 상태가 아닙니다.')
        require(actor['role']==expected and actor['id']!=c['creator'],'FORBIDDEN','해당 승인 권한과 별도 승인자가 필요합니다.',403)
        require(not blockers(s,c),'MISSING_EVIDENCE','필수 증빙을 확인하세요.')
        c['approvals'].append(dict(actor=actor['id'],role=actor['role'],revision=c['revision'],context_hash=digest(context(s,c)),at=now()))
        c['state']='PENDING_EXECUTIVE' if expected=='영업지원팀' and context(s,c)['executive'] else 'APPROVED'
        if c['state']=='APPROVED':
            task(s,actor,id,'재무팀','지급 일정 반영','사람 승인 완료. 모의 지급 일정을 등록하세요.')
    elif action=='reject':
        require(c['state'] in ['PENDING_SUPPORT','PENDING_EXECUTIVE'],'INVALID_STATE','승인 대기 건만 거절할 수 있습니다.')
        require(actor['role']==('영업지원팀' if c['state']=='PENDING_SUPPORT' else '영업임원'),'FORBIDDEN','해당 승인자가 거절해야 합니다.',403)
        c['state']='REJECTED'
        c['approvals']=[]
        if c.get('schedule'):
            c['schedule']['state']='CANCELLED'
            event(s,actor,'SCHEDULE_CANCELLED',id,dict(reason=reason))
        task(s,actor,id,'영업팀','거절 사유 보완',reason)
    elif action=='hold':
        require(actor['role'] in ['영업지원팀','영업임원'], 'FORBIDDEN', '심사 담당자가 보류합니다.', 403)
        require(c['state'] in ['DRAFT','PENDING_SUPPORT','PENDING_EXECUTIVE','APPROVED','SCHEDULED','REASSESSMENT_REQUIRED'], 'INVALID_STATE', '현재 상태에서 보류할 수 없습니다.')
        invalidate(s,actor,c,reason)
        c['state']='ON_HOLD'
    elif action=='revoke':
        require(actor['id'] in [a['actor'] for a in c['approvals']],'FORBIDDEN','승인 당사자만 승인을 취소합니다.',403)
        invalidate(s,actor,c,reason)
    elif action=='schedule':
        require(actor['role']=='재무팀','FORBIDDEN','재무팀이 일정을 등록합니다.',403)
        require(c['state']=='APPROVED','INVALID_STATE','승인 완료 건만 일정에 반영합니다.')
        planned=date.fromisoformat(body.get('planned_date',''))
        require(planned>=date(2026,7,1),'PAST_SCHEDULE','가상 업무 기준일 이후를 선택하세요.',422)
        require(planned.weekday()<5,'BUSINESS_DAY','지급 예정일은 월~금 영업일로 선택하세요.',422)
        c['schedule']=dict(date=planned.isoformat(),amount=context(s,c)['amount'],state='SCHEDULED',actor=actor['id'])
        c['state']='SCHEDULED'
    elif action=='simulate_payment':
        require(c['state']=='SCHEDULED' and c.get('schedule',{}).get('state')=='SCHEDULED','INVALID_STATE','승인 및 지급 일정 등록이 필요합니다.')
        ctx=context(s,c)
        needed={'영업지원팀','영업임원'} if ctx['executive'] else {'영업지원팀'}
        valid={a['role'] for a in c['approvals'] if a['revision']==c['revision'] and a['context_hash']==digest(ctx)}
        require(not blockers(s,c) and needed<=valid,'APPROVAL_INVALID','현재 정보에 대한 유효한 사람 승인이 필요합니다.')
        paid={i for p in s['payments'].values() for i in p['items']}
        require(not paid.intersection(c['items']) and not any(s['rebates'][i]['historical_paid'] for i in c['items']),'DUPLICATE_PAYMENT','이미 지급된 항목이 있습니다.')
        p=dict(receipt_id='SIM-'+str(uuid4()),case=id,revision=c['revision'],request_hash=request_hash,
               items=c['items'],amount=ctx['amount'],mode='simulation',at=now(),source_kind='synthetic')
        s['payments'][idem]=p
        c['state']='SIMULATED_PAID'
        c['schedule']['state']='SIMULATED_PAID'
        for t in s['tasks'].values():
            if t['case']==id and t['department']=='재무팀' and t['title']=='지급 일정 반영' and t['state']=='OPEN':
                t.update(state='DONE',result='모의 지급 완료 · '+p['receipt_id'],resolution='모의 지급 결과 확인',resolved_by=actor['id'],resolved_at=now())
                event(s,actor,'TASK_RESOLVED',t['id'],dict(receipt_id=p['receipt_id'],mode='simulation'))
        event(s,actor,'SIMULATED_PAYMENT',id,p)
        return p
    else:
        raise RuleError('UNKNOWN_ACTION','지원하지 않는 처리입니다.',422)
    event(s,actor,action.upper(),id,dict(before=before,after=c['state'],revision=c['revision'],reason=reason))
    return c


def change_preview(s,agency,patch,key):
    require(agency in s['agencies'],'NOT_FOUND','거래처가 없습니다.',404)
    require(patch and set(patch)<=set(FIELDS),'PATCH_FIELDS','대표자·주소·정산계좌만 정정할 수 있습니다.',422)
    after=deepcopy(s)
    after['agencies'][agency].setdefault('version_history',[]).append(dict(version=s['agencies'][agency]['version'],keys=deepcopy(s['agencies'][agency]['keys']),recorded_at=now()))
    after['agencies'][agency]['keys'].update({f:token(v,key) for f,v in patch.items()})
    after['agencies'][agency]['version']+=1
    affected=set(members(s,agency))|set(members(after,agency))
    impacts=[]
    for c in s['cases'].values():
        if affected.intersection(members(s,c['agency'])):
            old,new=context(s,c),context(after,c)
            impacts.append(dict(case=c['id'],before_group=old['group'],after_group=new['group'],
                before_amount=old['exposure'],after_amount=new['exposure'],before_executive=old['executive'],
                after_executive=new['executive'],before_state=c['state'],action='사후 검토' if c['state']=='SIMULATED_PAID' else '승인 무효화·일정 중지'))
    return after,dict(agency=agency,base_version=s['version'],before_group=members(s,agency),after_group=members(after,agency),
                      cases=impacts,source_kind='assumption',rules_version=RULES)


def apply_change(s,actor,agency,patch,key,reason,source_kind,effective_at='2026-07-01'):
    require(actor['role']=='영업지원팀','FORBIDDEN','영업지원팀이 관계 정보를 정정합니다.',403)
    after,impact=change_preview(s,agency,patch,key)
    s['agencies']=after['agencies']
    s['agencies'][agency].update(source_kind=source_kind,effective_at=effective_at)
    s['graph_revision']+=1
    impact.update(id=str(uuid4()),reason=reason,at=now(),source_kind=source_kind,replacement_cases=[])
    rebuild=[]
    for item in impact['cases']:
        case=s['cases'][item['case']]
        if case['state']=='SUPERSEDED':continue
        was_paid=case['state']=='SIMULATED_PAID'
        invalidate(s,actor,case,reason)
        if not was_paid and item['before_group']!=item['after_group']:
            case['state']='SUPERSEDED'
            rebuild.append(case)
            event(s,actor,'CASE_SUPERSEDED',case['id'],dict(reason='관계 합병·분리로 재기안'))
        item['after_state']=case['state']
    for case in rebuild:
        for aid in sorted({s['rebates'][i]['agency'] for i in case['items']}):
            candidates=[x['id'] for x in s['rebates'].values() if x['agency'] in members(s,aid) and x['month']==case['month'] and x['original_status']=='미지급' and not x['historical_paid']]
            reserved={i for c in s['cases'].values() if c['state']!='SUPERSEDED' for i in c['items']}
            if candidates and not reserved.intersection(candidates):
                impact['replacement_cases'].append(create_case(s,actor,aid,case['month'])['id'])
    s['impacts'][impact['id']]=impact
    event(s,actor,'RELATIONSHIP_CHANGED',agency,impact)
    return impact


def public_state(s,actor):
    g,groups=graph(s)
    cases=[]
    for c in s['cases'].values():
        row=deepcopy(c)
        row['context']={k:v for k,v in context(s,c).items() if k not in ['evidence','payout','versions']}
        row['blockers']=blockers(s,c)
        row['payout']={a:dict(masked=p['masked']) for a,p in c['payout'].items()}
        cases.append(row)
    return dict(version=s['version'],actor=actor,summary=reconcile(s),files=s['files'],
        agencies=[{k:v for k,v in a.items() if k not in ['keys','version_history']} for a in s['agencies'].values()],
        rebates=list(s['rebates'].values()),groups=groups,
        edges=[dict(left=a,right=b,**data) for a,b,data in g.edges(data=True)],cases=cases,
        tasks=list(s['tasks'].values()),payments=list(s['payments'].values()),
        impacts=list(s['impacts'].values()),events=s['events'][-100:],members=s['members'] if actor['admin'] else {},scenario=s.get('scenario'),
        demo=s.get('demo'), workflow_counts=dict(active_cases=sum(c['state'] not in ['SIMULATED_PAID','REJECTED','SUPERSEDED'] for c in cases), open_tasks=sum(t['state']=='OPEN' for t in s['tasks'].values())))
