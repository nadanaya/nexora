/** @param {string} path @param {unknown} [body] */
export async function requestEngine(path, body) {
  let response
  try {
    response = await fetch('/api/engine/' + path, {
      ...(body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      cache: 'no-store', signal: AbortSignal.timeout(45000),
    })
  } catch {
    throw new Error('업무 서버 응답이 지연되거나 연결이 끊겼습니다. 잠시 후 새로고침하고, 상태를 확인한 뒤 다시 시도하세요.')
  }
  let value
  try { value = await response.json() } catch {
    throw new Error(`업무 서버 응답 형식이 올바르지 않습니다 (${response.status}). 새로고침 후 다시 시도하세요.`)
  }
  if (!response.ok) {
    const next = response.status === 401 ? ' AXHub에 다시 로그인하세요.'
      : response.status === 403 ? ' 현재 업무 역할을 확인하고 해당 담당자에게 처리를 요청하세요.'
      : response.status === 409 ? ' 최신 상태와 증빙을 확인한 뒤 다시 시도하세요.'
      : response.status >= 500 ? ' 잠시 후 다시 시도하거나 관리자에게 연결 설정을 확인해 주세요.' : ' 입력값과 처리 근거를 확인하세요.'
    throw new Error((typeof value?.error === 'string' ? value.error : '요청을 처리하지 못했습니다.') + next)
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('업무 서버 응답 형식이 올바르지 않습니다. 새로고침 후 다시 시도하세요.')
  }
  return value
}
