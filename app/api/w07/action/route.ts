import { db } from '@/lib/db'
import { apiError, requireW07Actor } from '@/lib/w07-access'
import { APPROVAL_LIMIT_KRW, canAct, currentStatus, nextStatus } from '@/lib/w07-domain.mjs'
import type { RebateRow } from '@/lib/w07-domain.mjs'

export const dynamic = 'force-dynamic'
const ACTIONS = new Set(['approve', 'reject', 'request_evidence', 'record_response', 'simulate_payment'])

function validation(message: string) {
  const error = new Error(message)
  error.name = 'W07ValidationError'
  return error
}

export async function POST(request: Request) {
  try {
    const actor = await requireW07Actor()
    const body = await request.json() as { rebateId?: unknown; action?: unknown; reason?: unknown }
    const rebateId = typeof body.rebateId === 'string' ? body.rebateId.trim() : ''
    const action = typeof body.action === 'string' ? body.action : ''
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    if (!rebateId || rebateId.length > 100 || !ACTIONS.has(action)) throw validation('처리 요청을 확인할 수 없습니다.')
    if (action !== 'simulate_payment' && (reason.length < 2 || reason.length > 500)) {
      throw validation('처리 근거를 2~500자로 입력해 주세요. 계좌번호나 주민번호 등 민감정보는 입력하지 마세요.')
    }

    const sql = db()
    const result = await sql.begin(async (tx) => {
      const [row] = await tx<RebateRow[]>`
        SELECT rebate_id, agency_id, agency_name, period_ym, amount_krw::int AS amount, original_status, group_id
        FROM w07_rebates WHERE rebate_id = ${rebateId} FOR UPDATE
      `
      if (!row) throw validation('장려금 요청을 찾을 수 없습니다.')
      if (row.original_status !== '미지급') throw validation('원본에서 이미 승인 또는 반려된 요청은 수정할 수 없습니다.')

      const groupRows = await tx<RebateRow[]>`
        SELECT rebate_id, agency_id, agency_name, period_ym, amount_krw::int AS amount, original_status, group_id
        FROM w07_rebates WHERE group_id = ${row.group_id} AND period_ym = ${row.period_ym} FOR UPDATE
      `
      const groupAmount = groupRows.reduce((sum, item) => sum + Number(item.amount), 0)
      const authority = groupAmount > APPROVAL_LIMIT_KRW ? '영업임원' : '영업지원팀'
      const ids = groupRows.map((item) => item.rebate_id)
      const priorActions = await tx<{ rebate_id: string; status: string }[]>`
        SELECT rebate_id, status FROM w07_actions WHERE rebate_id = ANY(${tx.array(ids)})
      `
      const actionById = new Map(priorActions.map((item) => [item.rebate_id, item]))
      const status = currentStatus(row, actionById.get(row.rebate_id))

      if (action !== 'record_response' && !canAct(actor.businessRole, authority)) {
        throw validation(`이 그룹·월은 ${authority} 승인 권한이 필요합니다.`)
      }
      if (action === 'record_response' && !['영업지원팀', '영업임원', '관리자'].includes(actor.businessRole)) {
        throw validation('소명 회신은 업무 처리 권한이 있는 사용자만 기록할 수 있습니다.')
      }
      if (['approve', 'reject', 'request_evidence'].includes(action) && status !== '검토 대기') {
        throw validation('검토 대기 상태의 요청만 승인, 반려 또는 소명 요청을 할 수 있습니다.')
      }
      if (action === 'record_response' && status !== '소명 요청') throw validation('소명 요청 상태의 건만 회신을 기록할 수 있습니다.')
      if (action === 'simulate_payment') {
        const allApproved = groupRows
          .filter((item) => item.original_status === '미지급')
          .every((item) => currentStatus(item, actionById.get(item.rebate_id)) === '승인 완료')
        if (status !== '승인 완료' || !allApproved) {
          throw validation('같은 관련자 그룹·월의 미지급 요청을 모두 승인한 뒤 모의 지급할 수 있습니다.')
        }
      }

      const next = nextStatus(action)
      if (!next) throw validation('지원하지 않는 처리입니다.')
      const auditReason = action === 'simulate_payment'
        ? '수취계좌 정보 없음 · 실제 은행 이체 없음'
        : reason
      const actorName = actor.name || actor.user_id
      await tx`
        INSERT INTO w07_actions (rebate_id, status, reason, actor_id, actor_name, actor_role, updated_at)
        VALUES (${row.rebate_id}, ${next}, ${auditReason}, ${actor.user_id}, ${actorName}, ${actor.businessRole}, now())
        ON CONFLICT (rebate_id) DO UPDATE SET status = EXCLUDED.status, reason = EXCLUDED.reason,
          actor_id = EXCLUDED.actor_id, actor_name = EXCLUDED.actor_name,
          actor_role = EXCLUDED.actor_role, updated_at = now()
      `
      await tx`
        INSERT INTO w07_audit (event, rebate_id, group_id, period_ym, amount_krw, reason, actor_id, actor_name, actor_role)
        VALUES (${({ approve: '승인', reject: '반려', request_evidence: '소명 요청', record_response: '소명 회신 기록 · 재검토 대기', simulate_payment: '모의 지급 처리 · 실제 이체 없음' } as Record<string, string>)[action]},
          ${row.rebate_id}, ${row.group_id}, ${row.period_ym}, ${row.amount}, ${auditReason},
          ${actor.user_id}, ${actorName}, ${actor.businessRole})
      `
      return { rebateId: row.rebate_id, status: next }
    })
    return Response.json({ ok: true, ...result })
  } catch (error) {
    return apiError(error)
  }
}
