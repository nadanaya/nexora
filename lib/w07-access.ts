import { db, isDbConfigured } from '@/lib/db'
import { ensureW07Schema, type BusinessRole } from '@/lib/w07-db'
import { me, type AxhubMe } from '@/lib/axhub-server'

export class W07AccessError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export type W07Actor = AxhubMe & { businessRole: BusinessRole }

export async function requireW07Actor(): Promise<W07Actor> {
  const visitor = await me()
  if (!visitor.authenticated || !visitor.user_id) throw new W07AccessError(401, '로그인 후 이용해 주세요.')
  if (!isDbConfigured()) throw new W07AccessError(503, '앱 데이터베이스가 아직 준비되지 않았습니다.')
  const sql = db()
  if (visitor.is_admin) {
    await ensureW07Schema()
    await sql`
      INSERT INTO w07_members (user_id, display_name, business_role, active)
      VALUES (${visitor.user_id}, ${visitor.name || visitor.email || '관리자'}, '관리자', true)
      ON CONFLICT (user_id) DO UPDATE SET business_role = '관리자', active = true, updated_at = now()
    `
  } else {
    const [schema] = await sql<{ table_name: string | null }[]>`
      SELECT to_regclass('public.w07_members')::text AS table_name
    `
    if (!schema?.table_name) throw new W07AccessError(403, 'NEXORA 관리자 초기 설정을 기다리고 있습니다.')
  }
  const [member] = await sql<{ business_role: BusinessRole; active: boolean }[]>`
    SELECT business_role, active FROM w07_members WHERE user_id = ${visitor.user_id} LIMIT 1
  `
  if (!member?.active) throw new W07AccessError(403, 'NEXORA 사용 권한이 등록되지 않았습니다. 앱 관리자에게 문의해 주세요.')
  return { ...visitor, businessRole: member.business_role }
}

export async function requireW07Admin(): Promise<W07Actor> {
  const actor = await requireW07Actor()
  if (actor.businessRole !== '관리자') throw new W07AccessError(403, '이 작업은 앱 관리자만 할 수 있습니다.')
  return actor
}

export function apiError(error: unknown) {
  if (error instanceof W07AccessError) return Response.json({ error: error.message }, { status: error.status })
  if (error instanceof Error && error.message === 'DATABASE_NOT_READY') {
    return Response.json({ error: '앱 데이터베이스가 아직 준비되지 않았습니다.' }, { status: 503 })
  }
  if (error instanceof Error && error.name === 'W07ValidationError') {
    return Response.json({ error: error.message }, { status: 400 })
  }
  return Response.json({ error: '요청을 처리하지 못했습니다. 입력을 확인한 뒤 다시 시도해 주세요.' }, { status: 500 })
}
