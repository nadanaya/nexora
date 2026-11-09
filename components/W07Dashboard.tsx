'use client'

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Button, Card, Chip, Input, Label, TextField } from '@heroui/react'

type Role = '관리자' | '영업지원팀' | '영업임원' | '조회전용'
type Edge = { leftName: string; rightName: string; matchedFields: string[]; accountMasked: string }
type Group = {
  groupId: string
  period: string
  amount: number
  authority: string
  agencies: Array<{ agency_id: string; agency_name: string }>
  related: boolean
  edges: Edge[]
  pendingCount: number
}
type Rebate = {
  rebate_id: string
  agency_id: string
  agency_name: string
  period_ym: string
  amount: number
  original_status: string
  group_id: string
  status: string
  authority: string
  groupAmount: number
  groupPendingStatuses: string[]
  action: { reason: string; actor_name: string; actor_role: string; updated_at: string } | null
}
type Member = { user_id: string; display_name: string; business_role: Role; active: boolean; updated_at: string }
type DashboardData = {
  actor: { userId: string; name: string; role: Role }
  dataset: { importedAt: string; agencyCount: number; rebateCount: number } | null
  periods: string[]
  groups: Group[]
  rebates: Rebate[]
  audit: Array<{ id: string; event: string; rebate_id: string; group_id: string; period_ym: string; amount_krw: number; reason: string; actor_name: string; actor_role: string; occurred_at: string }>
  members: Member[]
}

const ROLE_OPTIONS: Role[] = ['영업지원팀', '영업임원', '조회전용']
const ACTION_LABELS: Record<string, string> = {
  approve: '승인', reject: '반려', request_evidence: '소명 요청', record_response: '회신 기록', simulate_payment: '모의 지급',
}

function krw(value: number) {
  return `${Number(value).toLocaleString('ko-KR')}원`
}

function toneFor(status: string): 'success' | 'warning' | 'danger' | 'accent' {
  if (status.includes('승인') || status.includes('완료')) return 'success'
  if (status.includes('소명') || status.includes('임원')) return 'warning'
  if (status.includes('반려')) return 'danger'
  return 'accent'
}

function Status({ children }: { children: string }) {
  return <Chip color={toneFor(children)} size="sm"><Chip.Label>{children}</Chip.Label></Chip>
}

async function requestJson(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: 'no-store' })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || '요청을 처리하지 못했습니다.')
  return result
}

export function W07Dashboard({ userId }: { userId: string }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [period, setPeriod] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let current = true
    requestJson('/api/w07')
      .then((result: DashboardData) => {
        if (!current) return
        setData(result)
        setError('')
        setPeriod((selected) => result.periods.includes(selected) ? selected : result.periods[0] || '')
      })
      .catch((reason: Error) => { if (current) setError(reason.message) })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [refreshKey])

  const refresh = useCallback(() => {
    setLoading(true)
    setRefreshKey((key) => key + 1)
  }, [])
  const selectedGroups = useMemo(() => (data?.groups ?? [])
    .filter((item) => item.period === period)
    .filter((item) => `${item.groupId} ${item.agencies.map((agency) => agency.agency_name).join(' ')}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((a, b) => b.amount - a.amount), [data, period, query])
  const selectedRows = useMemo(() => (data?.rebates ?? [])
    .filter((item) => item.period_ym === period)
    .filter((item) => `${item.rebate_id} ${item.agency_name} ${item.group_id}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [data, period, query])
  const pending = selectedRows.filter((row) => row.original_status === '미지급')
  const executiveCount = selectedGroups.filter((group) => group.authority === '영업임원').length
  const relatedCount = selectedGroups.filter((group) => group.related).length

  if (loading) return <Card><Card.Content><p className="t-small">NEXORA 업무 공간을 불러오는 중입니다.</p></Card.Content></Card>
  if (error) {
    const pendingAccess = error.includes('권한이 등록')
    return (
      <Card>
        <Card.Header>
          <Card.Title>{pendingAccess ? '사용 권한이 아직 없습니다' : '업무 공간을 열지 못했습니다'}</Card.Title>
          <Card.Description>{pendingAccess ? '관리자에게 사용자 ID와 필요한 업무 권한을 전달해 주세요.' : error}</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-3">
          {pendingAccess && <p className="rounded-card bg-muted p-3 font-mono t-small">{userId}</p>}
          <div><Button variant="outline" onPress={refresh}>다시 확인</Button></div>
        </Card.Content>
      </Card>
    )
  }
  if (!data) return null

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="선택 월 요약">
        <Metric label="등록 거래처" value={data.dataset ? data.dataset.agencyCount.toLocaleString('ko-KR') : '0'} detail="거래처 마스터 기준" />
        <Metric label="관련자 그룹" value={relatedCount.toLocaleString('ko-KR')} detail="2개 이상 연결 신호 · 전이 연결" />
        <Metric label="미지급 요청" value={pending.length.toLocaleString('ko-KR')} detail={pending.length ? krw(pending.reduce((sum, item) => sum + item.amount, 0)) : '선택 월 기준'} />
        <Metric label="임원 결재 그룹" value={executiveCount.toLocaleString('ko-KR')} detail="관련자 그룹 월 합산 2,000,000원 초과" />
      </section>

      <Card>
        <Card.Content className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="t-card-title">업무 현황</p>
              <p className="t-caption mt-1">현재 처리자: {data.actor.name} · {data.actor.role}</p>
            </div>
            <Button variant="outline" onPress={refresh}>새로고침</Button>
          </div>
          {data.periods.length > 0 && <div className="flex flex-wrap gap-2" aria-label="대상 월 선택">
            {data.periods.map((item) => <Button key={item} size="sm" variant={period === item ? 'secondary' : 'outline'} onPress={() => setPeriod(item)}>{item}</Button>)}
          </div>}
          <TextField>
            <Label>거래처·그룹·요청 검색</Label>
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름, REL-01, 요청 ID" />
          </TextField>
        </Card.Content>
      </Card>

      {!data.dataset ? (
        <>
          <Card>
            <Card.Header>
              <Card.Title>W07 원본 자료를 등록해 주세요</Card.Title>
              <Card.Description>세 파일을 함께 분석해 관련 거래처 그룹과 월별 승인 권한을 계산합니다. 한 번 등록한 자료는 덮어쓰지 않습니다.</Card.Description>
            </Card.Header>
          </Card>
          {data.actor.role === '관리자' && <ImportPanel onComplete={refresh} />}
        </>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <SectionTitle title="관련 거래처 · 월 한도" detail="그룹 합산액이 승인 권한을 결정합니다. 연결 신호는 부정행위 판정이 아닙니다." />
            {selectedGroups.length ? selectedGroups.map((group) => <GroupCard key={`${group.groupId}-${group.period}`} item={group} />) : <EmptyCard text="조건에 맞는 그룹이 없습니다." />}
          </section>

          <section className="flex flex-col gap-3">
            <SectionTitle title="장려금 승인 · 소명 · 모의 지급" detail="원본 승인·반려 이력은 읽기 전용입니다. 실제 은행 이체는 하지 않습니다." />
            {selectedRows.length ? selectedRows.map((row) => <RebateCard key={row.rebate_id} row={row} role={data.actor.role} onComplete={refresh} />) : <EmptyCard text="선택한 월에 표시할 장려금이 없습니다." />}
          </section>

          {data.actor.role === '관리자' && <MemberPanel members={data.members} onComplete={refresh} />}

          <section className="flex flex-col gap-3">
            <SectionTitle title="감사 기록" detail="최근 처리자·권한·근거를 기록합니다. 전체 계좌번호는 저장하지 않습니다." />
            {data.audit.length ? data.audit.map((event) => <Card key={event.id}>
              <Card.Content className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><Status>{event.event}</Status><span className="t-small">{event.actor_name} · {event.actor_role}</span></div>
                  <p className="t-caption mt-2">{event.rebate_id ? `${event.rebate_id} · ${event.group_id} · ${event.period_ym} · ${krw(event.amount_krw)}` : '관리자 기록'}</p>
                  {event.reason && <p className="t-small mt-2">{event.reason}</p>}
                </div>
                <time className="t-caption">{new Date(event.occurred_at).toLocaleString('ko-KR')}</time>
              </Card.Content>
            </Card>) : <EmptyCard text="아직 기록된 처리 이력이 없습니다." />}
          </section>

          {data.dataset && <p className="t-caption">자료 등록 {new Date(data.dataset.importedAt).toLocaleString('ko-KR')} · {data.dataset.agencyCount}개 거래처 · {data.dataset.rebateCount}개 장려금</p>}
        </>
      )}
    </div>
  )
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <Card><Card.Content className="flex flex-col gap-2">
    <span className="t-caption">{label}</span><strong className="t-page-title tabular-nums">{value}</strong><span className="t-caption">{detail}</span>
  </Card.Content></Card>
}

function SectionTitle({ title, detail }: { title: string; detail: string }) {
  return <div><h2 className="t-section-title">{title}</h2><p className="t-caption mt-1">{detail}</p></div>
}

function EmptyCard({ text }: { text: string }) {
  return <Card><Card.Content><p className="t-small text-secondary">{text}</p></Card.Content></Card>
}

function GroupCard({ item }: { item: Group }) {
  return <Card>
    <Card.Content className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="t-card-title">{item.groupId} <span className="t-caption">· {item.agencies.length}개 거래처</span></p>
          <p className="t-small mt-1">{item.agencies.map((agency) => agency.agency_name).join(' · ')}</p></div>
        <div className="flex flex-wrap items-center gap-2"><strong className="t-card-title tabular-nums">{krw(item.amount)}</strong><Status>{item.authority}</Status></div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip color={item.related ? 'warning' : 'accent'} size="sm"><Chip.Label>{item.related ? '관련성 검토' : '단독 거래처'}</Chip.Label></Chip>
        <span className="t-caption">{item.pendingCount}건 원본 미지급</span>
      </div>
      {item.edges.length > 0 && <details className="rounded-card bg-muted p-3">
        <summary className="t-small cursor-pointer">관계 근거 보기</summary>
        <ul className="mt-3 flex list-none flex-col gap-2 p-0">
          {item.edges.map((edge) => <li key={`${edge.leftName}-${edge.rightName}`} className="t-small">
            <strong>{edge.leftName} ↔ {edge.rightName}</strong>
            <span className="text-secondary"> · {edge.matchedFields.join(' · ')}</span>
            {edge.accountMasked && <span className="t-caption"> · 계좌 {edge.accountMasked}</span>}
          </li>)}
        </ul>
      </details>}
    </Card.Content>
  </Card>
}

function RebateCard({ row, role, onComplete }: { row: Rebate; role: Role; onComplete: () => void }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const canDecide = role === '관리자' || role === row.authority
  const canPay = row.status === '승인 완료' && row.groupPendingStatuses.every((status) => status === '승인 완료')
  const actions = row.original_status !== '미지급' ? []
    : row.status === '검토 대기' ? ['request_evidence', 'approve', 'reject']
      : row.status === '소명 요청' ? ['record_response']
        : row.status === '승인 완료' && canPay ? ['simulate_payment'] : []

  async function act(action: string) {
    setBusy(true)
    setError('')
    try {
      await requestJson('/api/w07/action', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rebateId: row.rebate_id, action, reason }),
      })
      setReason('')
      onComplete()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '처리 중 오류가 발생했습니다.')
    } finally { setBusy(false) }
  }

  return <Card>
    <Card.Content className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="t-card-title">{row.agency_name}</p><p className="t-caption mt-1">{row.rebate_id} · {row.group_id} · {row.period_ym}</p></div>
        <div className="flex flex-wrap items-center gap-2"><strong className="t-card-title tabular-nums">{krw(row.amount)}</strong><Status>{row.status}</Status></div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip color={row.authority === '영업임원' ? 'warning' : 'accent'} size="sm"><Chip.Label>{row.authority} 권한</Chip.Label></Chip>
        <span className="t-caption">그룹 월 합산 {krw(row.groupAmount)}</span>
        {row.action && <span className="t-caption">최근 처리: {row.action.actor_name} · {row.action.actor_role}</span>}
      </div>
      {row.action?.reason && <p className="t-small rounded-card bg-muted p-3">근거: {row.action.reason}</p>}
      {actions.length > 0 && <div className="flex flex-col gap-3">
        {actions.some((action) => action !== 'simulate_payment') && <TextField>
          <Label>{row.status === '소명 요청' ? '소명 회신 또는 재검토 메모' : '처리 근거'}</Label>
          <Input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder="민감정보·계좌번호는 입력하지 마세요" />
        </TextField>}
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => <Button key={action} size="sm" variant={action === 'reject' ? 'danger' : action === 'simulate_payment' ? 'primary' : action === 'approve' ? 'primary' : 'outline'}
            isDisabled={busy || (action !== 'simulate_payment' && (!reason.trim() || (['approve', 'reject', 'request_evidence'].includes(action) && !canDecide)))}
            onPress={() => void act(action)}>
            {busy ? '처리 중…' : ACTION_LABELS[action]}
          </Button>)}
        </div>
      </div>}
      {row.status === '승인 완료' && !canPay && <p className="t-caption">같은 관련자 그룹·월의 미지급 건을 모두 승인해야 모의 지급할 수 있습니다.</p>}
      {row.original_status !== '미지급' && <p className="t-caption">원본 승인·반려 이력 · 변경 불가</p>}
      {error && <p className="t-small text-danger" role="alert">{error}</p>}
    </Card.Content>
  </Card>
}

function ImportPanel({ onComplete }: { onComplete: () => void }) {
  const [files, setFiles] = useState<{ agencies: File | null; rebates: File | null; deposits: File | null }>({ agencies: null, rebates: null, deposits: null })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  function fileChange(key: keyof typeof files, event: ChangeEvent<HTMLInputElement>) {
    setFiles((previous) => ({ ...previous, [key]: event.target.files?.[0] ?? null }))
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setError(''); setMessage('')
    try {
      const form = new FormData()
      for (const key of ['agencies', 'rebates', 'deposits'] as const) {
        if (!files[key]) throw new Error('세 가지 자료를 모두 선택해 주세요.')
        form.append(key, files[key]!)
      }
      const result = await requestJson('/api/w07/import', { method: 'POST', body: form })
      setMessage(`${result.agencyCount}개 거래처와 ${result.rebateCount}개 장려금 요청을 등록했습니다.`)
      onComplete()
    } catch (reason) { setError(reason instanceof Error ? reason.message : '자료 등록에 실패했습니다.') }
    finally { setBusy(false) }
  }
  return <Card>
    <Card.Header><Card.Title>원본 자료 등록</Card.Title><Card.Description>마스터 · 장려금 · 입금 이력 CSV를 함께 선택합니다. 파이프(|) 구분 파일을 지원합니다.</Card.Description></Card.Header>
    <Card.Content className="flex flex-col gap-5">
      <p className="t-caption rounded-card bg-muted p-3">등록 시 파일은 NEXORA 서버로 전송됩니다. 전체 주소·대표자명·계좌번호는 저장하지 않고, 관계 계산에 필요한 계좌는 끝 4자리만 남깁니다. 지급 수취계좌는 별도로 등록하지 않습니다.</p>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <FileField label="거래처 마스터" file={files.agencies} onChange={(event) => fileChange('agencies', event)} />
        <FileField label="판매장려금 내역" file={files.rebates} onChange={(event) => fileChange('rebates', event)} />
        <FileField label="입금 이력" file={files.deposits} onChange={(event) => fileChange('deposits', event)} />
        <div><Button type="submit" variant="primary" isDisabled={busy}>{busy ? '자료를 분석하고 있습니다…' : '자료 분석 및 등록'}</Button></div>
      </form>
      {message && <p className="t-small text-success" role="status">{message}</p>}
      {error && <p className="t-small text-danger" role="alert">{error}</p>}
    </Card.Content>
  </Card>
}

function FileField({ label, file, onChange }: { label: string; file: File | null; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return <TextField>
    <Label>{label}</Label>
    <Input type="file" accept=".csv,.txt,text/csv,text/plain" onChange={onChange} />
    {file && <p className="t-caption">선택: {file.name} · {Math.ceil(file.size / 1024)}KB</p>}
  </TextField>
}

function MemberPanel({ members, onComplete }: { members: Member[]; onComplete: () => void }) {
  const [userId, setUserId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<Role>('영업지원팀')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      await requestJson('/api/w07/members', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId, displayName, role }) })
      setUserId(''); setDisplayName(''); onComplete()
    } catch (reason) { setError(reason instanceof Error ? reason.message : '권한을 저장하지 못했습니다.') }
    finally { setBusy(false) }
  }
  return <section className="flex flex-col gap-3">
    <SectionTitle title="사용자 권한 관리" detail="사용자의 AXHub ID에 업무 역할을 지정합니다. 관리자만 접근할 수 있습니다." />
    <Card>
      <Card.Content className="flex flex-col gap-4">
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
          <TextField><Label>AXHub 사용자 ID</Label><Input value={userId} onChange={(event) => setUserId(event.target.value)} required maxLength={200} /></TextField>
          <TextField><Label>표시 이름</Label><Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} /></TextField>
          <div className="flex flex-wrap gap-2" aria-label="업무 역할 선택">
            {ROLE_OPTIONS.map((option) => <Button key={option} type="button" size="sm" variant={role === option ? 'secondary' : 'outline'} onPress={() => setRole(option)}>{option}</Button>)}
          </div>
          <Button type="submit" variant="primary" isDisabled={busy}>{busy ? '저장 중…' : '권한 저장'}</Button>
        </form>
        {error && <p className="t-small text-danger" role="alert">{error}</p>}
        <div className="flex flex-col gap-2">
          {members.map((member) => <div key={member.user_id} className="flex flex-wrap items-center justify-between gap-2 rounded-card bg-muted p-3">
            <span className="t-small">{member.display_name || member.user_id} <span className="t-caption">· {member.user_id}</span></span>
            <div className="flex items-center gap-2"><Status>{member.business_role}</Status><span className="t-caption">{member.active ? '활성' : '비활성'}</span></div>
          </div>)}
        </div>
      </Card.Content>
    </Card>
  </section>
}
