import { db } from '@/lib/db'
import { apiError, requireW07Admin } from '@/lib/w07-access'
import type { BusinessRole } from '@/lib/w07-db'

export const dynamic = 'force-dynamic'
const MEMBER_ROLES = new Set<BusinessRole>(['영업지원팀', '영업임원', '조회전용'])

export async function POST(request: Request) {
  try {
    const actor = await requireW07Admin()
    const body = await request.json() as { userId?: unknown; displayName?: unknown; role?: unknown }
    const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 80) : ''
    const role = typeof body.role === 'string' ? body.role as BusinessRole : null
    if (!userId || userId.length > 200 || /[\s<>]/.test(userId)) {
      const error = new Error('사용자 ID 형식을 확인해 주세요.')
      error.name = 'W07ValidationError'
      throw error
    }
    if (!role || !MEMBER_ROLES.has(role)) {
      const error = new Error('업무 권한을 선택해 주세요.')
      error.name = 'W07ValidationError'
      throw error
    }
    const sql = db()
    await sql.begin(async (tx) => {
      await tx`
        INSERT INTO w07_members (user_id, display_name, business_role, active, updated_at)
        VALUES (${userId}, ${displayName}, ${role}, true, now())
        ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name,
          business_role = EXCLUDED.business_role, active = true, updated_at = now()
      `
      await tx`
        INSERT INTO w07_audit (event, reason, actor_id, actor_name, actor_role)
        VALUES ('사용자 권한 설정', ${`${displayName || userId} · ${role}`},
          ${actor.user_id}, ${actor.name || actor.user_id}, ${actor.businessRole})
      `
    })
    return Response.json({ ok: true })
  } catch (error) {
    return apiError(error)
  }
}
