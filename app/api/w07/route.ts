import { db } from '@/lib/db'
import { apiError, requireW07Actor } from '@/lib/w07-access'
import { aggregateGroupMonths, currentStatus } from '@/lib/w07-domain.mjs'
import type { AgencySummary, RebateRow, RelationshipEdge } from '@/lib/w07-domain.mjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const actor = await requireW07Actor()
    const sql = db()
    const [dataset] = await sql<{ imported_at: Date; agency_count: number; rebate_count: number }[]>`
      SELECT imported_at, agency_count, rebate_count FROM w07_datasets WHERE id = 1
    `
    const [agencies, relationships, rows, actions, audit, members] = await Promise.all([
      sql<{ agency_id: string; agency_name: string; group_id: string }[]>`
        SELECT agency_id, agency_name, group_id FROM w07_agencies ORDER BY agency_id
      `,
      sql<{ left_agency_id: string; right_agency_id: string; group_id: string; matched_fields: string[]; account_masked: string }[]>`
        SELECT left_agency_id, right_agency_id, group_id, matched_fields, account_masked
        FROM w07_relationships ORDER BY group_id, left_agency_id, right_agency_id
      `,
      sql<RebateRow[]>`
        SELECT rebate_id, agency_id, agency_name, period_ym, amount_krw::int AS amount,
          original_status, group_id FROM w07_rebates ORDER BY period_ym DESC, rebate_id
      `,
      sql<{ rebate_id: string; status: string; reason: string; actor_name: string; actor_role: string; updated_at: Date }[]>`
        SELECT rebate_id, status, reason, actor_name, actor_role, updated_at FROM w07_actions
      `,
      sql<{ id: string; event: string; rebate_id: string; group_id: string; period_ym: string; amount_krw: number; reason: string; actor_name: string; actor_role: string; occurred_at: Date }[]>`
        SELECT id::text, event, rebate_id, group_id, period_ym, amount_krw::int,
          reason, actor_name, actor_role, occurred_at FROM w07_audit ORDER BY occurred_at DESC LIMIT 80
      `,
      actor.businessRole === '관리자'
        ? sql<{ user_id: string; display_name: string; business_role: string; active: boolean; updated_at: Date }[]>`
            SELECT user_id, display_name, business_role, active, updated_at FROM w07_members ORDER BY display_name, user_id
          `
        : Promise.resolve([]),
    ])

    const byGroup = new Map<string, AgencySummary[]>()
    for (const agency of agencies) {
      if (!byGroup.has(agency.group_id)) byGroup.set(agency.group_id, [])
      byGroup.get(agency.group_id)!.push({ agency_id: agency.agency_id, agency_name: agency.agency_name })
    }
    const edgeByGroup = new Map<string, RelationshipEdge[]>()
    const agencyName = new Map(agencies.map((agency) => [agency.agency_id, agency.agency_name]))
    for (const edge of relationships) {
      if (!edgeByGroup.has(edge.group_id)) edgeByGroup.set(edge.group_id, [])
      edgeByGroup.get(edge.group_id)!.push({
        leftAgencyId: edge.left_agency_id,
        rightAgencyId: edge.right_agency_id,
        matchedFields: edge.matched_fields,
        accountMasked: edge.account_masked,
      })
    }
    const groups = [...byGroup.entries()].map(([id, groupAgencies]) => ({
      id,
      agencies: groupAgencies,
      agencyIds: groupAgencies.map((agency) => agency.agency_id),
      related: groupAgencies.length > 1,
      edges: edgeByGroup.get(id) ?? [],
    }))
    const groupById = new Map(groups.map((group) => [group.id, group]))
    const rowsForDomain = rows.map((row) => ({ ...row, amount: Number(row.amount) }))
    const rollups = aggregateGroupMonths(rowsForDomain, groupById)
    const actionById = new Map(actions.map((action) => [action.rebate_id, action]))
    const rollupsForClient = rollups.map((item) => ({
      groupId: item.groupId,
      period: item.period,
      amount: item.amount,
      authority: item.authority,
      agencies: item.group?.agencies ?? [],
      related: item.group?.related ?? false,
      edges: (item.group?.edges ?? []).map((edge) => ({
        ...edge,
        leftName: agencyName.get(edge.leftAgencyId) ?? edge.leftAgencyId,
        rightName: agencyName.get(edge.rightAgencyId) ?? edge.rightAgencyId,
      })),
      pendingCount: item.rows.filter((row) => row.original_status === '미지급').length,
    }))
    const rebateItems = rowsForDomain.map((row) => ({
      ...row,
      status: currentStatus(row, actionById.get(row.rebate_id)),
      action: actionById.get(row.rebate_id) ?? null,
      authority: rollups.find((item) => item.groupId === row.group_id && item.period === row.period_ym)?.authority ?? '영업지원팀',
      groupAmount: rollups.find((item) => item.groupId === row.group_id && item.period === row.period_ym)?.amount ?? row.amount,
      groupPendingStatuses: rowsForDomain
        .filter((candidate) => candidate.group_id === row.group_id && candidate.period_ym === row.period_ym && candidate.original_status === '미지급')
        .map((candidate) => currentStatus(candidate, actionById.get(candidate.rebate_id))),
    }))
    return Response.json({
      actor: { userId: actor.user_id, name: actor.name || actor.email || actor.user_id, role: actor.businessRole },
      dataset: dataset ? {
        importedAt: dataset.imported_at,
        agencyCount: dataset.agency_count,
        rebateCount: dataset.rebate_count,
      } : null,
      periods: [...new Set(rowsForDomain.map((row) => row.period_ym))].sort().reverse(),
      groups: rollupsForClient,
      rebates: rebateItems,
      audit,
      members,
    })
  } catch (error) {
    return apiError(error)
  }
}
