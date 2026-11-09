export const APPROVAL_LIMIT_KRW: number

export type AgencyInput = {
  agency_id: string
  agency_name: string
  representative_name?: string
  address?: string
  bank_account_no?: string
}
export type DepositInput = { deposit_id: string; agency_id: string; bank_account_no?: string }
export type RebateInput = {
  rebate_id: string
  agency_id: string
  period_ym: string
  rebate_amount_krw: string | number
  approval_status: string
}
export type AgencySummary = Pick<AgencyInput, 'agency_id' | 'agency_name'>
export type RelationshipEdge = {
  leftAgencyId: string
  rightAgencyId: string
  matchedFields: string[]
  accountMasked: string
}
export type RelationshipGroup = {
  id: string
  agencyIds: string[]
  agencies: AgencySummary[]
  related: boolean
  edges: RelationshipEdge[]
}
export type RebateRow = {
  rebate_id: string
  agency_id: string
  agency_name: string
  period_ym: string
  amount: number
  original_status: string
  group_id: string
}

export function parsePipeCsv(text: string, sourceName: string): Record<string, string>[]
export function validateRows(kind: 'agencies' | 'rebates' | 'deposits', rows: Record<string, string>[], sourceName: string): Record<string, string>[]
export function buildRelationshipNetwork(agencies: AgencyInput[], deposits: DepositInput[]): {
  groups: RelationshipGroup[]
  groupByAgency: Map<string, RelationshipGroup>
  edges: RelationshipEdge[]
}
export function buildRebateRows(rebates: RebateInput[], agencies: AgencyInput[], groupByAgency: Map<string, RelationshipGroup>): RebateRow[]
export function aggregateGroupMonths(rows: RebateRow[], groupById: Map<string, RelationshipGroup>): Array<{
  key: string
  groupId: string
  period: string
  amount: number
  rows: RebateRow[]
  group: RelationshipGroup | undefined
  authority: '영업임원' | '영업지원팀'
}>
export function currentStatus(row: RebateRow, action?: { status: string }): string
export function canAct(role: '관리자' | '영업임원' | '영업지원팀' | '조회전용', authority: string): boolean
export function canSimulatePayment(row: RebateRow, groupRows: RebateRow[], actions: Map<string, { status: string }>): boolean
export function nextStatus(action: string): string | null
