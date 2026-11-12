export const workspaceRoutes = {
  '현황': '/workspace/dashboard', '관계·영향': '/workspace/relationships',
  '합산 검증': '/workspace/incentives', 'AI 판단': '/workspace/ai',
  '승인 업무함': '/workspace/approvals', '모의 지급': '/workspace/payments',
  '후속 작업': '/workspace/tasks', 'Decision Replay': '/workspace/replay',
  '감사 기록': '/workspace/audit', 'Guided Demo': '/workspace/demo', '관리': '/workspace/admin',
}

/** @param {string} view @param {string} scope @param {string} [caseId] */
export function workspaceHref(view, scope, caseId = '', filter = '') {
  const path = workspaceRoutes[/** @type {keyof typeof workspaceRoutes} */ (view)]
  if (!path) throw new Error('지원하지 않는 업무 화면입니다.')
  const query = new URLSearchParams({ scope: scope === 'live' ? 'live' : 'demo' })
  if (caseId) query.set('case', caseId)
  if (filter) query.set('filter', filter)
  return `${path}?${query}`
}
