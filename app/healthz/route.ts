export async function GET() {
  try {
    const response = await fetch(`http://127.0.0.1:${process.env.NEXORA_API_PORT || '8000'}/readyz`, { cache: 'no-store', signal: AbortSignal.timeout(3000) })
    if (!response.ok) throw new Error('not ready')
  } catch {
    return new Response('업무 서버 준비 중', { status: 503 })
  }
  return new Response('ok', {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}
