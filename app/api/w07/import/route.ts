import { db } from '@/lib/db'
import { apiError, requireW07Admin } from '@/lib/w07-access'
import { buildRebateRows, buildRelationshipNetwork, parsePipeCsv, validateRows } from '@/lib/w07-domain.mjs'
import type { AgencyInput, DepositInput, RebateInput } from '@/lib/w07-domain.mjs'

export const dynamic = 'force-dynamic'

function validation(message: string) {
  const error = new Error(message)
  error.name = 'W07ValidationError'
  return error
}

export async function POST(request: Request) {
  try {
    const actor = await requireW07Admin()
    const size = Number(request.headers.get('content-length') ?? 0)
    if (size > 15 * 1024 * 1024) throw validation('업로드 전체 크기는 15MB 이하여야 합니다.')
    const form = await request.formData()
    const fileFor = (key: string): File => {
      const value = form.get(key)
      if (!(value instanceof File)) throw validation(`${key} CSV 파일을 선택해 주세요.`)
      if (value.size > 5 * 1024 * 1024) throw validation(`${key} 파일은 5MB 이하여야 합니다.`)
      return value
    }
    const agencyFile = fileFor('agencies')
    const rebateFile = fileFor('rebates')
    const depositFile = fileFor('deposits')
    const [agencyText, rebateText, depositText] = await Promise.all([
      agencyFile.text(), rebateFile.text(), depositFile.text(),
    ])
    const agencies = validateRows('agencies', parsePipeCsv(agencyText, agencyFile.name), agencyFile.name) as unknown as AgencyInput[]
    const rebates = validateRows('rebates', parsePipeCsv(rebateText, rebateFile.name), rebateFile.name) as unknown as RebateInput[]
    const deposits = validateRows('deposits', parsePipeCsv(depositText, depositFile.name), depositFile.name) as unknown as DepositInput[]
    const agencyIds = new Set(agencies.map(({ agency_id }) => agency_id))
    if (agencyIds.size !== agencies.length) throw validation('거래처 마스터에 중복 거래처 ID가 있습니다.')
    if (agencyIds.size > 5_000 || rebates.length > 10_000 || deposits.length > 20_000) throw validation('자료 행 수가 허용량을 초과했습니다.')
    for (const rebate of rebates) {
      if (!['미지급', '승인', '반려'].includes(rebate.approval_status)) throw validation(`장려금 ${rebate.rebate_id}의 원본 승인 상태를 확인해 주세요.`)
    }

    const network = buildRelationshipNetwork(agencies, deposits)
    const rows = buildRebateRows(rebates, agencies, network.groupByAgency)
    const groupByAgency = network.groupByAgency
    const sql = db()
    await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(hashtext('nexora-w07-import'))`
      const [existing] = await tx`SELECT id FROM w07_datasets WHERE id = 1 FOR UPDATE`
      if (existing) throw validation('이미 자료가 등록되어 있습니다. 기존 자료 교체는 관리자 절차로 진행해 주세요.')
      await tx`
        INSERT INTO w07_datasets (id, imported_at, imported_by, agency_count, rebate_count)
        VALUES (1, now(), ${actor.user_id}, ${agencies.length}, ${rows.length})
      `
      for (const agency of agencies) {
        const group = groupByAgency.get(agency.agency_id)
        if (!group) throw validation(`거래처 ${agency.agency_id}의 관계 그룹을 계산하지 못했습니다.`)
        await tx`
          INSERT INTO w07_agencies (agency_id, agency_name, group_id)
          VALUES (${agency.agency_id}, ${agency.agency_name}, ${group.id})
        `
      }
      for (const edge of network.edges) {
        const group = groupByAgency.get(edge.leftAgencyId)
        if (!group) continue
        await tx`
          INSERT INTO w07_relationships (left_agency_id, right_agency_id, group_id, matched_fields, account_masked)
          VALUES (${edge.leftAgencyId}, ${edge.rightAgencyId}, ${group.id}, ${tx.array(edge.matchedFields)}, ${edge.accountMasked})
        `
      }
      for (const row of rows) {
        await tx`
          INSERT INTO w07_rebates (rebate_id, agency_id, agency_name, period_ym, amount_krw, original_status, group_id)
          VALUES (${row.rebate_id}, ${row.agency_id}, ${row.agency_name}, ${row.period_ym}, ${row.amount}, ${row.original_status}, ${row.group_id})
        `
      }
      await tx`
        INSERT INTO w07_audit (event, reason, actor_id, actor_name, actor_role)
        VALUES ('자료 등록', ${`${agencies.length}개 거래처 · ${rows.length}개 장려금 · 입금 자료 ${deposits.length}건 분석`},
          ${actor.user_id}, ${actor.name || actor.email || actor.user_id}, ${actor.businessRole})
      `
    })
    return Response.json({ imported: true, agencyCount: agencies.length, rebateCount: rows.length, groups: network.groups.length })
  } catch (error) {
    return apiError(error)
  }
}
