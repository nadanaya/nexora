import { db, isDbConfigured } from '@/lib/db'

export type BusinessRole = '관리자' | '영업지원팀' | '영업임원' | '조회전용'

export async function ensureW07Schema() {
  if (!isDbConfigured()) throw new Error('DATABASE_NOT_READY')
  const sql = db()
  await sql`
    CREATE TABLE IF NOT EXISTS w07_datasets (
      id smallint PRIMARY KEY CHECK (id = 1),
      imported_at timestamptz NOT NULL,
      imported_by text NOT NULL,
      agency_count integer NOT NULL,
      rebate_count integer NOT NULL
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS w07_members (
      user_id text PRIMARY KEY,
      display_name text NOT NULL DEFAULT '',
      business_role text NOT NULL CHECK (business_role IN ('관리자', '영업지원팀', '영업임원', '조회전용')),
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS w07_agencies (
      agency_id text PRIMARY KEY,
      agency_name text NOT NULL,
      group_id text NOT NULL
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS w07_relationships (
      left_agency_id text NOT NULL,
      right_agency_id text NOT NULL,
      group_id text NOT NULL,
      matched_fields text[] NOT NULL,
      account_masked text NOT NULL DEFAULT '',
      PRIMARY KEY (left_agency_id, right_agency_id)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS w07_rebates (
      rebate_id text PRIMARY KEY,
      agency_id text NOT NULL REFERENCES w07_agencies(agency_id),
      agency_name text NOT NULL,
      period_ym text NOT NULL,
      amount_krw bigint NOT NULL CHECK (amount_krw >= 0),
      original_status text NOT NULL,
      group_id text NOT NULL,
      imported_at timestamptz NOT NULL DEFAULT now()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS w07_rebates_group_period_idx ON w07_rebates (group_id, period_ym)`
  await sql`
    CREATE TABLE IF NOT EXISTS w07_actions (
      rebate_id text PRIMARY KEY REFERENCES w07_rebates(rebate_id),
      status text NOT NULL CHECK (status IN ('소명 요청', '검토 대기', '승인 완료', '반려', '모의 지급 완료')),
      reason text NOT NULL,
      actor_id text NOT NULL,
      actor_name text NOT NULL,
      actor_role text NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS w07_audit (
      id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      event text NOT NULL,
      rebate_id text NOT NULL DEFAULT '',
      group_id text NOT NULL DEFAULT '',
      period_ym text NOT NULL DEFAULT '',
      amount_krw bigint NOT NULL DEFAULT 0,
      reason text NOT NULL DEFAULT '',
      actor_id text NOT NULL,
      actor_name text NOT NULL,
      actor_role text NOT NULL,
      occurred_at timestamptz NOT NULL DEFAULT now()
    )
  `
}
