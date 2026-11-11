"""Versioned, shared DEMO aggregate in the existing PostgreSQL database.

The live tenant is read only. Seed uses the normal domain commands, never writes
approvals or receipts, and never restores records after a user processes them.
"""
from copy import deepcopy

from . import domain as D

SEED_VERSION = 'w07-showcase-v1'


def tenant(base):
    return base + '-showcase-v1'


def counts(s):
    return dict(active_cases=sum(c['state'] not in ['SIMULATED_PAID', 'REJECTED', 'SUPERSEDED'] for c in s['cases'].values()),
                open_tasks=sum(t['state'] == 'OPEN' for t in s['tasks'].values()))


def report(s, before, created):
    return dict(seed_version=SEED_VERSION, provenance='DEMO', created=created,
                before=before, after=counts(s),
                cases=[dict(id=c['id'], label=c.get('demo_label'), agency=c['agency'], month=c['month'],
                            state=c['state'], source_kind=c['source_kind'], provenance=c.get('provenance'),
                            amount=D.context(s, c)['amount'], executive=D.context(s, c)['executive'])
                       for c in s['cases'].values()],
                tasks=[dict(id=t['id'], case=t['case'], department=t['department'], title=t['title'],
                            state=t['state'], provenance=t.get('provenance')) for t in s['tasks'].values()])


def seed(s, original, actor, key):
    before = counts(s)
    if s.get('demo', {}).get('seed_version') == SEED_VERSION:
        return report(s, before, False)
    D.require(not s['agencies'] and not s['cases'], 'DEMO_NOT_EMPTY', '기존 시연 데이터를 덮어쓰지 않습니다.')
    D.require(original['agencies'], 'SOURCE_REQUIRED', 'W07 원본 등록이 필요합니다.')
    for collection in ['agencies', 'rebates', 'deposits', 'files']:
        s[collection] = deepcopy(original[collection])
    for collection in ['agencies', 'rebates']:
        for row in s[collection].values():
            row['source_scope'] = 'W07_SNAPSHOT'
    s['graph_revision'] = original['graph_revision']
    s['matching_key_fingerprint'] = original.get('matching_key_fingerprint')
    s['demo'] = dict(seed_version=SEED_VERSION, provenance='DEMO', source_kind='synthetic',
                     source_tenant=actor['tenant'], source_version=original['version'],
                     seeded_at=D.now(), initialized=True,
                     label='DEMO · W07 원본 참조 스냅샷 / 합성 심사·증빙·후속 작업')
    creator = dict(id='DEMO-SEED-CREATOR', role='영업지원팀', admin=False)
    sales = dict(id='DEMO-SEED-SALES', role='영업팀', admin=False)
    reviewer = dict(id='DEMO-SEED-REVIEWER', role='영업지원팀', admin=False)

    def act(c, who, action, **extra):
        return D.operate(s, who, c['id'], dict(action=action, revision=c['revision'],
                         reason='DEMO / SIMULATED 합성 증빙 및 초기 상태 구성', **extra), key)

    def evidence(c):
        for kind in ['settlement', 'relationship']:
            act(c, sales, 'evidence', kind=kind, source_kind='synthetic')
        for aid in sorted({s['rebates'][i]['agency'] for i in c['items']}):
            act(c, sales, 'evidence', kind='payout', source_kind='synthetic', agency=aid,
                account='SIMULATED-PAYOUT-99999', holder='DEMO 가상 수취인')
        for e in c['evidence']:
            act(c, reviewer, 'verify_evidence', evidence_id=e['id'])

    candidates = sorted({(r['agency'], r['month']) for r in s['rebates'].values()
                         if r['original_status'] == '미지급' and not r['historical_paid']})
    # Include a >2m group when available; all amounts remain original-derived.
    candidates.sort(key=lambda pair: (not D.context(s, dict(agency=pair[0], month=pair[1], items=[], evidence=[], payout={}))['executive'], pair))
    made = []
    for aid, month in candidates:
        try:
            c = D.create_case(s, creator, aid, month)
        except D.RuleError as exc:
            if exc.code in ['RESERVED', 'INELIGIBLE', 'NO_ITEMS']:
                continue
            raise
        made.append(c)
        c['demo_label'] = ['DEMO-01 승인 대기', 'DEMO-02 승인 검토', 'DEMO-03 증빙 확인',
                           'DEMO-04 수취계좌 증빙 보류', 'DEMO-05 정보 정정 재심사'][len(made)-1]
        if len(made) == 5:
            break
    D.require(len(made) == 5, 'DEMO_SOURCE_INSUFFICIENT', '중복 없는 미지급 심사 후보 5건이 필요합니다.')
    for c in made[:2] + made[4:]:
        evidence(c)
        act(c, creator, 'submit')
    act(made[3], creator, 'submit')  # Missing payout -> ON_HOLD and one sales task.
    act(made[4], sales, 'evidence', kind='settlement', source_kind='synthetic')
    # Normal invalidation creates sales / finance / monitoring tasks (three).
    D.require(counts(s) == dict(active_cases=5, open_tasks=4), 'DEMO_COUNTS', '초기 시연 집계 검증 실패')
    D.event(s, actor, 'DEMO_SEEDED', SEED_VERSION, dict(before=before, after=counts(s), source_kind='synthetic'))
    return report(s, before, True)
