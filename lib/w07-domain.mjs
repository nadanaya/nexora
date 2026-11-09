export const APPROVAL_LIMIT_KRW = 2_000_000

const REQUIRED_HEADERS = {
  agencies: ['agency_id', 'agency_name', 'representative_name', 'address', 'bank_account_no'],
  rebates: ['rebate_id', 'agency_id', 'period_ym', 'rebate_amount_krw', 'approval_status'],
  deposits: ['deposit_id', 'agency_id', 'bank_account_no'],
}

export function parsePipeCsv(text, sourceName) {
  const input = String(text ?? '').replace(/^\uFEFF/, '')
  const records = []
  let row = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        cell += '"'
        i += 1
      } else if (char === '"') quoted = false
      else cell += char
    } else if (char === '"') quoted = true
    else if (char === '|') {
      row.push(cell.trim())
      cell = ''
    } else if (char === '\n') {
      row.push(cell.trim())
      if (row.some((value) => value !== '')) records.push(row)
      row = []
      cell = ''
    } else if (char !== '\r') cell += char
  }
  if (quoted) throw new Error(`${sourceName}: 닫히지 않은 따옴표가 있습니다.`)
  row.push(cell.trim())
  if (row.some((value) => value !== '')) records.push(row)
  if (records.length < 2) throw new Error(`${sourceName}: 헤더와 데이터 행을 확인할 수 없습니다.`)

  const headers = records[0]
  if (headers.some((header) => !header) || new Set(headers).size !== headers.length) {
    throw new Error(`${sourceName}: 헤더가 비어 있거나 중복됩니다.`)
  }
  return records.slice(1).map((values, index) => {
    if (values.length !== headers.length) throw new Error(`${sourceName}: ${index + 2}행의 열 수가 헤더와 다릅니다.`)
    return Object.fromEntries(headers.map((header, column) => [header, values[column]]))
  })
}

export function validateRows(kind, rows, sourceName) {
  const required = REQUIRED_HEADERS[kind]
  if (!required) throw new Error('지원하지 않는 자료 종류입니다.')
  if (!Array.isArray(rows) || rows.length === 0) throw new Error(`${sourceName}: 데이터가 없습니다.`)
  const missing = required.filter((header) => !(header in rows[0]))
  if (missing.length) throw new Error(`${sourceName}: 필수 열을 찾을 수 없습니다 (${missing.join(', ')}).`)
  if (rows.length > 10_000) throw new Error(`${sourceName}: 한 번에 10,000행까지만 불러올 수 있습니다.`)
  return rows
}

function normalized(value) {
  const text = String(value ?? '').trim()
  if (!text || text.toLocaleUpperCase() === 'NONE') return ''
  return text.replace(/[\s-]/g, '').toLocaleLowerCase()
}

function maskAccount(account) {
  const digits = String(account ?? '').replace(/\D/g, '')
  return digits ? `••••${digits.slice(-4)}` : ''
}

export function buildRelationshipNetwork(agencies, deposits) {
  const agencyById = new Map(agencies.map((agency) => [agency.agency_id, agency]))
  const accountsByAgency = new Map(agencies.map((agency) => [
    agency.agency_id,
    new Set([normalized(agency.bank_account_no)].filter(Boolean)),
  ]))
  for (const deposit of deposits) {
    if (!agencyById.has(deposit.agency_id)) throw new Error(`입금 자료의 거래처를 마스터에서 찾을 수 없습니다: ${deposit.agency_id}`)
    const account = normalized(deposit.bank_account_no)
    if (account) accountsByAgency.get(deposit.agency_id).add(account)
  }

  const parent = new Map(agencies.map(({ agency_id }) => [agency_id, agency_id]))
  const find = (id) => {
    let root = id
    while (parent.get(root) !== root) root = parent.get(root)
    while (parent.get(id) !== id) {
      const next = parent.get(id)
      parent.set(id, root)
      id = next
    }
    return root
  }
  const union = (left, right) => {
    const leftRoot = find(left)
    const rightRoot = find(right)
    if (leftRoot !== rightRoot) parent.set(rightRoot, leftRoot)
  }

  const edges = []
  for (let leftIndex = 0; leftIndex < agencies.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < agencies.length; rightIndex += 1) {
      const left = agencies[leftIndex]
      const right = agencies[rightIndex]
      const matchedFields = []
      const representativeLeft = normalized(left.representative_name)
      const representativeRight = normalized(right.representative_name)
      const addressLeft = normalized(left.address)
      const addressRight = normalized(right.address)
      if (representativeLeft && representativeLeft === representativeRight) matchedFields.push('대표자')
      if (addressLeft && addressLeft === addressRight) matchedFields.push('주소')
      const matchingAccount = [...accountsByAgency.get(left.agency_id)]
        .find((account) => accountsByAgency.get(right.agency_id).has(account))
      if (matchingAccount) matchedFields.push('계좌')
      if (matchedFields.length < 2) continue
      union(left.agency_id, right.agency_id)
      edges.push({
        leftAgencyId: left.agency_id,
        rightAgencyId: right.agency_id,
        matchedFields,
        accountMasked: matchingAccount ? maskAccount(matchingAccount) : '',
      })
    }
  }

  const membersByRoot = new Map()
  for (const agency of agencies) {
    const root = find(agency.agency_id)
    if (!membersByRoot.has(root)) membersByRoot.set(root, [])
    membersByRoot.get(root).push(agency)
  }
  const groups = [...membersByRoot.values()]
    .map((members) => members.sort((a, b) => a.agency_id.localeCompare(b.agency_id)))
    .sort((a, b) => a[0].agency_id.localeCompare(b[0].agency_id))
    .map((members, index) => {
      const ids = new Set(members.map(({ agency_id }) => agency_id))
      return {
        id: `REL-${String(index + 1).padStart(2, '0')}`,
        agencyIds: [...ids],
        agencies: members.map(({ agency_id, agency_name }) => ({ agency_id, agency_name })),
        related: members.length > 1,
        edges: edges.filter((edge) => ids.has(edge.leftAgencyId) && ids.has(edge.rightAgencyId)),
      }
    })
  const groupByAgency = new Map()
  for (const group of groups) for (const agencyId of group.agencyIds) groupByAgency.set(agencyId, group)
  return { groups, groupByAgency, edges }
}

export function buildRebateRows(rebates, agencies, groupByAgency) {
  const agencyById = new Map(agencies.map((agency) => [agency.agency_id, agency]))
  const ids = new Set()
  return rebates.map((rebate) => {
    if (ids.has(rebate.rebate_id)) throw new Error(`중복 장려금 ID가 있습니다: ${rebate.rebate_id}`)
    ids.add(rebate.rebate_id)
    const amount = Number(rebate.rebate_amount_krw)
    if (!Number.isSafeInteger(amount) || amount < 0) throw new Error(`장려금 금액이 올바르지 않습니다: ${rebate.rebate_id}`)
    const agency = agencyById.get(rebate.agency_id)
    const group = groupByAgency.get(rebate.agency_id)
    if (!agency || !group) throw new Error(`장려금 거래처를 마스터에서 찾을 수 없습니다: ${rebate.rebate_id}`)
    if (!/^\d{4}-\d{2}$/.test(rebate.period_ym)) throw new Error(`대상 월이 올바르지 않습니다: ${rebate.rebate_id}`)
    return {
      rebate_id: rebate.rebate_id,
      agency_id: rebate.agency_id,
      agency_name: agency.agency_name,
      period_ym: rebate.period_ym,
      amount,
      original_status: rebate.approval_status,
      group_id: group.id,
    }
  })
}

export function aggregateGroupMonths(rows, groupById) {
  const aggregates = new Map()
  for (const row of rows) {
    const key = `${row.group_id}|${row.period_ym}`
    if (!aggregates.has(key)) aggregates.set(key, { key, groupId: row.group_id, period: row.period_ym, amount: 0, rows: [] })
    const item = aggregates.get(key)
    item.amount += row.amount
    item.rows.push(row)
  }
  return [...aggregates.values()].map((item) => ({
    ...item,
    group: groupById.get(item.groupId),
    authority: item.amount > APPROVAL_LIMIT_KRW ? '영업임원' : '영업지원팀',
  }))
}

export function currentStatus(row, action) {
  if (row.original_status !== '미지급') return row.original_status === '승인' ? '원본 승인' : '원본 반려'
  return action?.status ?? '검토 대기'
}

export function canAct(role, authority) {
  return role === '관리자' || role === authority
}

export function canSimulatePayment(row, groupRows, actions) {
  if (currentStatus(row, actions.get(row.rebate_id)) !== '승인 완료') return false
  return groupRows
    .filter((item) => item.original_status === '미지급')
    .every((item) => currentStatus(item, actions.get(item.rebate_id)) === '승인 완료')
}

export function nextStatus(action) {
  return ({
    approve: '승인 완료',
    reject: '반려',
    request_evidence: '소명 요청',
    record_response: '검토 대기',
    simulate_payment: '모의 지급 완료',
  })[action] ?? null
}
