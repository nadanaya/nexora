'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Chip, Input, Label, TextArea, TextField } from '@heroui/react'
import { StatCard, useConfirm } from '@/components/ax'

type Evidence = { id: string; kind: string; reference: string; verified: boolean; source_kind: string; submitted_by: string }
type Case = { id: string; agency: string; month: string; revision: number; state: string; creator: string; evidence: Evidence[];
  items: string[]; blockers: string[]; payout: Record<string, { masked: string }>; approvals: { actor: string; role: string }[];
  context: { group: string[]; amount: number; exposure: number; executive: boolean }; schedule: { date: string; state: string } | null;
  analysis?: { output: { summary: string; uncertainties: string[]; suggested_actions: string[] } } }
type Impact = { before_group: string[]; after_group: string[]; base_version: number; cases: { case: string; before_amount: number; after_amount: number; action: string }[] }
type Workspace = { version: number; actor: { id: string; role: string; admin: boolean }; summary: { agencies: number; rebates: number; total: number; related_groups: string[][]; status_counts: Record<string, number>; mismatches: string[] };
  agencies: { id: string; name: string }[]; groups: string[][]; edges: { left: string; right: string; matched_fields: string[] }[];
  cases: Case[]; tasks: { id: string; case: string; title: string; department: string; state: string; reason: string }[];
  payments: { receipt_id: string; amount: number; at: string }[]; events: { id: string; kind: string; actor: string; role: string; at: string }[];
  members: Record<string, { role: string }> }

const states: Record<string, string> = { DRAFT: '기안', ON_HOLD: '증빙 보류', PENDING_SUPPORT: '영업지원 승인 대기', PENDING_EXECUTIVE: '영업임원 승인 대기', APPROVED: '승인 완료', SCHEDULED: '지급 일정 반영', SIMULATED_PAID: '모의 지급 완료', REJECTED: '거절', REASSESSMENT_REQUIRED: '재심사 필요', SUSPENDED: '일정 중지' }
states.SUPERSEDED = '관계 변경으로 대체됨'
const kinds: Record<string, string> = { settlement: '정산 근거', payout: '지급 수취계좌 확인', relationship: '관계·입금 소명' }
const fields: Record<string, string> = { representative_name: '대표자', address: '주소', bank_account_no: '등록 정산계좌' }
const roles = ['영업지원팀', '영업임원', '영업팀', '재무팀', '조회전용']
const money = (n: number) => `${n.toLocaleString('ko-KR')}원`
const eventNames: Record<string, string> = { DATASET_IMPORTED: '원본 등록', ROLE_ASSIGNED: '업무 역할 등록', CASE_CREATED: '심사 기안', TASK_CREATED: '후속 작업 생성', TASK_RESOLVED: '후속 작업 완료', EVIDENCE: '증빙 제출', VERIFY_EVIDENCE: '증빙 검토', SUBMIT: '승인 상신', RESUBMIT: '재상신', APPROVE: '사람 승인', REJECT: '거절', REVOKE: '승인 취소', SCHEDULE: '재무 일정 반영', SCHEDULE_SUSPENDED: '일정 중지', APPROVAL_INVALIDATED: '승인 무효화', SIMULATED_PAYMENT: '모의 지급', RELATIONSHIP_CHANGED: '관계 정정', AI_ANALYSIS_CREATED: 'AI 근거 설명 생성' }

async function api(path: string, body?: unknown) {
  const response = await fetch('/api/engine/' + path, { ...(body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), cache: 'no-store' })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || '처리에 실패했습니다.')
  return result
}

function Field({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (s: string) => void; multiline?: boolean }) {
  return <TextField value={value} onChange={onChange}><Label>{label}</Label>{multiline ? <TextArea /> : <Input />}</TextField>
}

export function OperationsDashboard() {
  const [data, setData] = useState<Workspace | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState('심사')
  const [selected, setSelected] = useState('')
  const [agency, setAgency] = useState('D-011')
  const [month, setMonth] = useState('2026-06')
  const [reason, setReason] = useState('')
  const [date, setDate] = useState('2026-07-03')
  const [evidenceKind, setEvidenceKind] = useState('settlement')
  const [sourceKind, setSourceKind] = useState('synthetic')
  const [payoutAgency, setPayoutAgency] = useState('')
  const [account, setAccount] = useState('')
  const [holder, setHolder] = useState('')
  const [member, setMember] = useState('')
  const [directory, setDirectory] = useState<{ userId: string; name: string }[]>([])
  const [role, setRole] = useState('조회전용')
  const [patchField, setPatchField] = useState('representative_name')
  const [patchValue, setPatchValue] = useState('')
  const [impact, setImpact] = useState<Impact | null>(null)
  const [csvFiles, setCsvFiles] = useState<Record<string, File>>({})
  const confirm = useConfirm()
  const refresh = useCallback(async () => { setData(await api('workspace')) }, [])
  useEffect(() => {
    let active = true
    api('workspace').then(value => { if (active) setData(value) }).catch(e => { if (active) setError(e.message) })
    return () => { active = false }
  }, [])
  useEffect(() => {
    if (data?.actor.admin) api('directory').then(result => setDirectory(result.items)).catch(() => setDirectory([]))
  }, [data?.actor.admin])
  async function run(job: () => Promise<unknown>, message = '처리를 기록했습니다.') {
    setBusy(true); setError(''); setNotice('')
    try { await job(); await refresh(); setNotice(message) } catch (e) { setError(e instanceof Error ? e.message : '처리에 실패했습니다.') } finally { setBusy(false) }
  }
  if (!data) return <Card><Card.Content><p role={error ? 'alert' : 'status'}>{error || '업무 데이터를 확인하고 있습니다…'}</p><Button variant="outline" onPress={() => run(refresh)}>다시 불러오기</Button></Card.Content></Card>
  const c = data.cases.find(x => x.id === selected)
  const actor = data.actor
  const action = (name: string, extra: object = {}) => c && run(() => api(`cases/${c.id}/actions`, { action: name, revision: c.revision, reason, ...extra }))
  const changeBody = { agency, patch: { [patchField]: patchValue }, reason, source_kind: sourceKind, effective_at: '2026-07-01', base_version: data.version }
  return <div className="flex flex-col gap-6">
    <div className="flex flex-wrap items-center gap-3"><Chip color="accent"><Chip.Label>{actor.role}</Chip.Label></Chip><span className="t-caption">업무 기준일 2026.07.01 · 은행 연결 없는 모의 지급</span><Button size="sm" variant="outline" isDisabled={busy} onPress={() => run(refresh, '최신 상태를 불러왔습니다.')}>새로고침</Button></div>
    {error && <p role="alert" className="text-danger">{error}</p>}{notice && <p role="status" className="text-success">{notice}</p>}
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><StatCard label="원본 거래처" value={`${data.summary.agencies}개`} sub="원본 CSV 보존" /><StatCard label="원본 장려금" value={money(data.summary.total)} sub={`${data.summary.rebates}건 · 전 기간`} /><StatCard label="진행 심사" value={`${data.cases.filter(c => !['SIMULATED_PAID','REJECTED'].includes(c.state)).length}건`} sub="현재 운영 상태" /><StatCard label="열린 후속 작업" value={`${data.tasks.filter(t => t.state === 'OPEN').length}건`} sub="영업 소명·재무 일정" /></div>
    <div className="flex flex-wrap gap-2" aria-label="업무 메뉴">{['심사','관계·영향','후속 작업','지급·감사',...(actor.admin ? ['관리'] : [])].map(t => <Button key={t} variant={tab === t ? 'primary' : 'outline'} onPress={() => setTab(t)}>{t}</Button>)}</div>
    {tab === '심사' && <>
      <Card><Card.Header><Card.Title>월별 지급 심사</Card.Title><Card.Description>원본 승인 이력은 새 승인으로 인정하지 않습니다. 이미 지급된 항목은 기안에서 제외합니다.</Card.Description></Card.Header><Card.Content>
        <div className="grid gap-4 md:grid-cols-3"><Field label="거래처 코드" value={agency} onChange={setAgency} /><Field label="정산 월 (연-월)" value={month} onChange={setMonth} /><Button isDisabled={busy || actor.role !== '영업지원팀'} onPress={() => run(async () => { const created = await api('cases', { agency, month }); setSelected(created.id) }, '그룹의 미지급 항목으로 심사를 기안했습니다.')}>관련자 그룹 심사 기안</Button></div>
      </Card.Content></Card>
      <div className="grid gap-6 lg:grid-cols-3"><Card><Card.Header><Card.Title>심사 목록</Card.Title></Card.Header><Card.Content><div className="flex flex-col gap-2">{!data.cases.length && <p className="t-small">아직 기안된 심사가 없습니다.</p>}{data.cases.map(row => <Button key={row.id} variant={selected === row.id ? 'primary' : 'outline'} onPress={() => { setSelected(row.id); setReason('') }}>{row.month} · {row.agency} · {states[row.state]}</Button>)}</div></Card.Content></Card>
      {c && <Card className="lg:col-span-2"><Card.Header><Card.Title>{c.month} · {c.context.group.join(' · ')}</Card.Title><Card.Description>{states[c.state]} · {c.revision}차 검토</Card.Description></Card.Header><Card.Content><div className="flex flex-col gap-5">
        <p className="t-body">이번 요청 {money(c.context.amount)} · 월 그룹 노출액 {money(c.context.exposure)} · {c.context.executive ? '영업지원 → 영업임원 승인 필요' : '영업지원 승인 필요'}</p>
        {c.blockers.length > 0 && <div className="bg-muted rounded-card p-4"><p className="t-card-title">지급 차단 사유</p><ul>{c.blockers.map(b => <li key={b}>{b}</li>)}</ul></div>}
        <Field label="처리 근거·증빙 참조 (민감한 원문은 입력하지 마세요)" value={reason} onChange={setReason} multiline />
        <div className="flex flex-wrap gap-2">{['DRAFT','ON_HOLD','REJECTED','REASSESSMENT_REQUIRED'].includes(c.state) && <Button isDisabled={busy || actor.role !== '영업지원팀'} onPress={() => action('resubmit')}>검증 후 상신</Button>}{['PENDING_SUPPORT','PENDING_EXECUTIVE'].includes(c.state) && <><Button isDisabled={busy || actor.role !== (c.state === 'PENDING_SUPPORT' ? '영업지원팀' : '영업임원') || actor.id === c.creator} onPress={() => action('approve')}>사람 승인</Button><Button variant="danger-soft" isDisabled={busy} onPress={() => action('reject')}>거절</Button></>}{c.approvals.some(a => a.actor === actor.id) && c.state !== 'SIMULATED_PAID' && <Button variant="danger-soft" isDisabled={busy} onPress={async () => { if (await confirm({ title: '승인을 취소할까요?', description: '재심사로 전환하고 재무 일정을 중지합니다.', confirmLabel: '승인 취소', variant: 'danger' })) action('revoke') }}>내 승인 취소</Button>}</div>
        {['영업팀','영업지원팀'].includes(actor.role) && c.state !== 'SIMULATED_PAID' && <div className="flex flex-col gap-3"><p className="t-card-title">증빙 보완</p><div className="flex flex-wrap gap-2">{Object.entries(kinds).map(([k,v]) => <Button key={k} size="sm" variant={evidenceKind === k ? 'primary' : 'outline'} onPress={() => setEvidenceKind(k)}>{v}</Button>)}</div><div className="flex flex-wrap gap-2">{[['synthetic','합성·모의 자료'],['confirmed','담당자 실제 확인'],['assumption','참가자 가정']].map(([k,v]) => <Button key={k} size="sm" variant={sourceKind === k ? 'primary' : 'outline'} onPress={() => setSourceKind(k)}>{v}</Button>)}</div>{evidenceKind === 'payout' && <><p className="t-caption">입금 이력에서 추정하지 않은 지급 수취계좌를 입력하세요. 저장 시 비교 키와 끝 4자리만 남습니다.</p><Field label="지급 대상 거래처 코드" value={payoutAgency} onChange={setPayoutAgency} /><Field label="지급 은행·수취계좌" value={account} onChange={setAccount} /><Field label="예금주" value={holder} onChange={setHolder} /></>}<Button variant="outline" isDisabled={busy} onPress={() => action('evidence', { kind: evidenceKind, source_kind: sourceKind, ...(evidenceKind === 'payout' ? { agency: payoutAgency, account, holder } : {}) })}>증빙 참조 제출</Button></div>}
        <div><p className="t-card-title">증빙과 검토 이력</p>{c.evidence.map(e => <div key={e.id} className="flex flex-wrap items-center gap-2 py-2"><span className="t-small">{kinds[e.kind]} · {e.source_kind === 'synthetic' ? '합성' : e.source_kind === 'confirmed' ? '확인 회신' : '가정'} · {e.reference} · {e.verified ? '검토 완료' : '미검토'}</span>{!e.verified && actor.role === '영업지원팀' && e.submitted_by !== actor.id && <Button size="sm" isDisabled={busy} onPress={() => action('verify_evidence', { evidence_id: e.id })}>증빙 검증</Button>}</div>)}</div>
        <p className="t-small">사람 승인: {c.approvals.map(a => a.role).join(' → ') || '아직 없음'}</p>
        {actor.role === '재무팀' && <><Field label="모의 지급 예정일 (연-월-일)" value={date} onChange={setDate} /><div className="flex gap-2"><Button isDisabled={busy || c.state !== 'APPROVED'} onPress={() => action('schedule', { planned_date: date })}>지급 일정 반영</Button><Button isDisabled={busy || c.state !== 'SCHEDULED'} onPress={async () => { if (await confirm({ title: '모의 지급을 실행할까요?', description: '현재 승인과 계좌 증빙을 다시 검증합니다. 실제 이체는 발생하지 않습니다.', confirmLabel: '모의 지급 실행' })) action('simulate_payment', { idempotency_key: `payment-${c.id}-${c.revision}` }) }}>모의 지급 실행</Button></div></>}
        {c.schedule && <p className="t-small">재무 일정: {c.schedule.date} · {states[c.schedule.state]}</p>}
        <Button variant="outline" isDisabled={busy} onPress={() => run(() => api(`cases/${c.id}/analysis`, {}), 'AI 근거 설명을 생성했습니다.')}>AI 근거 설명 요청</Button>{c.analysis && <div><p className="t-body">{c.analysis.output.summary}</p><p className="t-small">불확실성: {c.analysis.output.uncertainties.join(' / ')}</p><p className="t-small">제안: {c.analysis.output.suggested_actions.join(' / ')}</p></div>}
      </div></Card.Content></Card>}</div>
    </>}
    {tab === '관계·영향' && <>
      <Card><Card.Header><Card.Title>원본 관계 근거</Card.Title><Card.Description>직접 일치와 전이 연결을 구분합니다. 입금계좌는 마스터 관계를 바꾸지 않습니다.</Card.Description></Card.Header><Card.Content><div className="flex flex-col gap-3">{data.groups.filter(g => g.length > 1).map(g => <p key={g.join()} className="t-body">관련자 그룹: {g.join(' ↔ ')}</p>)}{data.edges.map(e => <p key={e.left + e.right} className="t-small">{e.left} ↔ {e.right} · {e.matched_fields.map(f => fields[f]).join(' + ')}</p>)}<p className="t-small">등록계좌와 다른 입금: {data.summary.mismatches.join(', ') || '없음'} · 추가 소명 신호</p></div></Card.Content></Card>
      <Card><Card.Header><Card.Title>관계 변경 영향 분석</Card.Title><Card.Description>가상 기준일 정정만 지원합니다. 원본 파일을 덮어쓰지 않고 변경 회차를 만듭니다.</Card.Description></Card.Header><Card.Content><div className="flex flex-col gap-4"><Field label="정정 거래처 코드" value={agency} onChange={v => { setAgency(v); setImpact(null) }} /><div className="flex flex-wrap gap-2">{Object.entries(fields).map(([k,v]) => <Button key={k} size="sm" variant={patchField === k ? 'primary' : 'outline'} onPress={() => { setPatchField(k); setImpact(null) }}>{v}</Button>)}</div><Field label="정정 값" value={patchValue} onChange={v => { setPatchValue(v); setImpact(null) }} /><Field label="변경 근거" value={reason} onChange={v => { setReason(v); setImpact(null) }} /><div className="flex gap-2">{[['assumption','참가자 가정'],['synthetic','합성 시나리오'],['confirmed','실제 확인 정정']].map(([k,v]) => <Button key={k} size="sm" variant={sourceKind === k ? 'primary' : 'outline'} onPress={() => { setSourceKind(k); setImpact(null) }}>{v}</Button>)}</div><Button isDisabled={busy || actor.role !== '영업지원팀'} onPress={() => run(async () => setImpact(await api('relationships/change', { ...changeBody, apply: false })), '변경 전후 영향을 계산했습니다.')}>영향 미리보기</Button>{impact && <><p className="t-body">{impact.before_group.join(' · ')} → {impact.after_group.join(' · ')}</p>{impact.cases.map(i => <p key={i.case} className="t-small">월 그룹 합계 {money(i.before_amount)} → {money(i.after_amount)} · {i.action}</p>)}{impact.cases.length === 0 && <p className="t-small">영향받는 기존 심사는 없습니다.</p>}<Button variant="danger-soft" isDisabled={busy} onPress={async () => { if (await confirm({ title: '관계 정정을 적용할까요?', description: '관련 심사의 승인이 무효화되고 지급 일정이 중지됩니다.', confirmLabel: '정정 적용', variant: 'danger' })) run(async () => { await api('relationships/change', { ...changeBody, base_version: impact.base_version, apply: true }); setImpact(null) }, '관계 변경과 후속 작업을 반영했습니다.') }}>영향 확인 후 정정 적용</Button></>}</div></Card.Content></Card>
    </>}
    {tab === '후속 작업' && <Card><Card.Header><Card.Title>영업·재무 후속 작업</Card.Title></Card.Header><Card.Content><div className="flex flex-col gap-4"><Field label="작업 완료 근거" value={reason} onChange={setReason} />{!data.tasks.length && <p className="t-small">생성된 후속 작업이 없습니다.</p>}{data.tasks.map(t => <div key={t.id} className="flex flex-wrap items-center justify-between gap-3"><div><p className="t-card-title">{t.department} · {t.title} · {t.state === 'OPEN' ? '진행 중' : '완료'}</p><p className="t-small">{t.reason}</p></div>{t.state === 'OPEN' && actor.role === t.department && <Button size="sm" isDisabled={busy} onPress={() => run(() => api(`tasks/${t.id}/resolve`, { reason }))}>근거 확인 후 완료</Button>}</div>)}</div></Card.Content></Card>}
    {tab === '지급·감사' && <><Card><Card.Header><Card.Title>모의 지급 영수증</Card.Title><Card.Description>실제 은행 이체 또는 자금 집행 결과가 아닙니다.</Card.Description></Card.Header><Card.Content>{!data.payments.length && <p className="t-small">아직 모의 지급 기록이 없습니다.</p>}{data.payments.map(p => <p key={p.receipt_id} className="t-small">{money(p.amount)} · {p.at} · {p.receipt_id}</p>)}</Card.Content></Card><Card><Card.Header><Card.Title>감사 기록</Card.Title><Card.Description>최근 100개 이벤트 · 상태 변경과 같은 거래에서 저장</Card.Description></Card.Header><Card.Content><ol className="flex flex-col gap-2">{data.events.slice().reverse().map(e => <li key={e.id} className="t-small">{new Date(e.at).toLocaleString('ko-KR')} · {eventNames[e.kind] || '업무 처리'} · {e.role}</li>)}</ol></Card.Content></Card></>}
    {tab === '관리' && actor.admin && <>
      <Card><Card.Header><Card.Title>회사 구성원</Card.Title><Card.Description>가입한 활성 구성원을 선택하면 역할 등록 칸에 반영됩니다. 목록이 없으면 회사 앱 주소에서 접속하세요.</Card.Description></Card.Header><Card.Content><div className="flex flex-wrap gap-2"><Button variant="outline" onPress={() => setMember(actor.id)}>내 계정 선택</Button>{directory.filter(m => m.userId !== actor.id).map(m => <Button key={m.userId} variant="outline" onPress={() => setMember(m.userId)}>{m.name}</Button>)}</div></Card.Content></Card>
      <Card><Card.Header><Card.Title>업무 역할 등록</Card.Title><Card.Description>관리자 권한은 업무 승인을 대신하지 않습니다. 기안자와 승인자는 다른 사용자여야 합니다.</Card.Description></Card.Header><Card.Content><div className="flex flex-col gap-4"><p className="t-caption">내 사용자 식별자: {actor.id}</p><Field label="AXHub 사용자 식별자" value={member} onChange={setMember} /><div className="flex flex-wrap gap-2">{roles.map(r => <Button key={r} size="sm" variant={role === r ? 'primary' : 'outline'} onPress={() => setRole(r)}>{r}</Button>)}</div><Button isDisabled={busy} onPress={() => run(() => api('members', { user_id: member, role }))}>역할 등록</Button>{Object.entries(data.members).map(([id,m]) => <p key={id} className="t-small">{id} · {m.role}</p>)}</div></Card.Content></Card>
      <Card><Card.Header><Card.Title>원본 CSV 3종 등록</Card.Title><Card.Description>UTF-8 · 파이프 구분자. 기존 구버전 자료는 자동으로 운영 승인에 이관하지 않습니다. 현재 엔진에는 한 번만 등록합니다.</Card.Description></Card.Header><Card.Content><div className="flex flex-col gap-3">{[['agencies','거래처 마스터'],['rebates','판매장려금'],['deposits','입금 이력']].map(([k,v]) => <TextField key={k}><Label>{v}</Label><Input type="file" accept=".csv" onChange={e => { const file = e.target.files?.[0]; if (file) setCsvFiles(f => ({ ...f, [k]: file })) }} /></TextField>)}<Button isDisabled={busy || data.summary.agencies > 0 || Object.keys(csvFiles).length !== 3} onPress={() => run(async () => { const body: Record<string,string> = {}; for (const [k,f] of Object.entries(csvFiles)) body[k] = new TextDecoder('utf-8', { fatal: true }).decode(await f.arrayBuffer()); await api('datasets/import', body) }, '원본을 검산하고 비교 키와 계보를 등록했습니다.')}>원본 검산 및 등록</Button></div></Card.Content></Card>
    </>}
  </div>
}
