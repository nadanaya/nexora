import test from 'node:test'
import assert from 'node:assert/strict'
import {
  APPROVAL_LIMIT_KRW,
  aggregateGroupMonths,
  buildRebateRows,
  buildRelationshipNetwork,
  canAct,
  canSimulatePayment,
  parsePipeCsv,
} from '../lib/w07-domain.mjs'

test('관계는 비어 있지 않은 식별 정보 2개 이상 일치할 때만 연결하고 전이적으로 묶는다', () => {
  const agencies = [
    { agency_id: 'A', agency_name: '가상상사', representative_name: '김가상', address: '서울 중구 1', bank_account_no: '111-222' },
    { agency_id: 'B', agency_name: '예시유통', representative_name: '김가상', address: '서울 중구 1', bank_account_no: '333-444' },
    { agency_id: 'C', agency_name: '샘플파트너', representative_name: '김가상', address: '부산 해운대 2', bank_account_no: '333-444' },
    { agency_id: 'D', agency_name: '단독판매', representative_name: '', address: '', bank_account_no: '' },
  ]
  const network = buildRelationshipNetwork(agencies, [])
  assert.equal(network.groups.find((group) => group.agencyIds.includes('A')).agencyIds.length, 3)
  assert.equal(network.groupByAgency.get('A').id, network.groupByAgency.get('C').id)
  assert.equal(network.groupByAgency.get('D').related, false)
  assert.deepEqual(network.edges[0].matchedFields, ['대표자', '주소'])
})

test('입금 계좌는 관계 근거에만 쓰고 화면/저장용 근거는 끝 4자리만 남긴다', () => {
  const agencies = [
    { agency_id: 'A', agency_name: '가상상사', representative_name: '가상인', address: '서울 1', bank_account_no: '' },
    { agency_id: 'B', agency_name: '예시유통', representative_name: '가상인', address: '부산 2', bank_account_no: '' },
  ]
  const network = buildRelationshipNetwork(agencies, [
    { deposit_id: 'D1', agency_id: 'A', bank_account_no: '9876543210' },
    { deposit_id: 'D2', agency_id: 'B', bank_account_no: '9876543210' },
  ])
  assert.equal(network.edges.length, 1, '대표자와 계좌 두 근거가 일치하면 연결한다')
  assert.equal(network.edges[0].accountMasked, '••••3210')
  assert.equal(network.edges.some((edge) => 'payoutAccount' in edge), false)
})

test('2백만원 이하는 지원팀 전결, 초과는 임원 결재', () => {
  const agencies = [
    { agency_id: 'A', agency_name: '가상상사', representative_name: '가상인', address: '서울 1' },
    { agency_id: 'B', agency_name: '예시유통', representative_name: '가상인', address: '서울 1' },
  ]
  const { groupByAgency, groups } = buildRelationshipNetwork(agencies, [])
  const groupById = new Map(groups.map((group) => [group.id, group]))
  const rows = buildRebateRows([
    { rebate_id: 'R1', agency_id: 'A', period_ym: '2026-06', rebate_amount_krw: '1000000', approval_status: '미지급' },
    { rebate_id: 'R2', agency_id: 'B', period_ym: '2026-06', rebate_amount_krw: '1000000', approval_status: '미지급' },
    { rebate_id: 'R3', agency_id: 'A', period_ym: '2026-07', rebate_amount_krw: '2000001', approval_status: '미지급' },
  ], agencies, groupByAgency)
  const aggregates = aggregateGroupMonths(rows, groupById)
  assert.equal(APPROVAL_LIMIT_KRW, 2_000_000)
  assert.equal(aggregates.find((item) => item.period === '2026-06').authority, '영업지원팀')
  assert.equal(aggregates.find((item) => item.period === '2026-07').authority, '영업임원')
  assert.equal(canAct('영업지원팀', '영업지원팀'), true)
  assert.equal(canAct('영업지원팀', '영업임원'), false)
})

test('그룹의 미지급 건을 모두 승인해야 모의 지급을 기록할 수 있다', () => {
  const a = { rebate_id: 'R1', original_status: '미지급' }
  const b = { rebate_id: 'R2', original_status: '미지급' }
  assert.equal(canSimulatePayment(a, [a, b], new Map([['R1', { status: '승인 완료' }]])), false)
  assert.equal(canSimulatePayment(a, [a, b], new Map([
    ['R1', { status: '승인 완료' }], ['R2', { status: '승인 완료' }],
  ])), true)
})

test('파이프 CSV 인용부호와 열 수를 검증한다', () => {
  assert.deepEqual(parsePipeCsv('id|name\n1|"샘플|상사"\n', 'sample')[0], { id: '1', name: '샘플|상사' })
  assert.throws(() => parsePipeCsv('id|name\n1\n', 'sample'), /열 수/)
})
