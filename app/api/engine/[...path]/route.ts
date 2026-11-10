import { createHash, createHmac } from 'node:crypto'
import { makeAxhub, me, TENANT } from '@/lib/axhub-server'
import { isAllowedOrigin } from '@/lib/request-origin.mjs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const visitor = await me()
  if (!visitor.authenticated || visitor.tenant_slug !== TENANT) {
    return Response.json({ error: 'AXHub 로그인과 테넌트를 확인해 주세요.' }, { status: 401 })
  }
  const secret = process.env.NEXORA_INTERNAL_SECRET
  if (!secret || secret.length < 32) return Response.json({ error: '업무 서버 연결 설정이 필요합니다.' }, { status: 503 })
  if (request.method !== 'GET') {
    if (!isAllowedOrigin({ origin: request.headers.get('origin'), host: request.headers.get('host'), url: request.url, fetchSite: request.headers.get('sec-fetch-site') })) {
      return Response.json({ error: '다른 사이트에서 보낸 요청입니다.' }, { status: 403 })
    }
  }
  const { path } = await context.params
  if (path.some(p => !/^[a-zA-Z0-9_-]+$/.test(p))) return Response.json({ error: '잘못된 경로입니다.' }, { status: 400 })
  if (path.join('/') === 'directory' && request.method === 'GET') {
    if (!visitor.is_admin) return Response.json({ error: '관리자만 구성원을 조회할 수 있습니다.' }, { status: 403 })
    try {
      const sdk = await makeAxhub()
      const directory = await sdk.tenants.membersDirectory(TENANT)
      return Response.json({ items: directory.items.map(m => ({ userId: m.userId, name: m.name })) })
    } catch {
      return Response.json({ error: '회사 앱 주소에서 구성원 목록을 확인해 주세요.' }, { status: 503 })
    }
  }
  const pathname = '/api/v1/' + path.join('/')
  const body = request.method === 'GET' ? '' : await request.text()
  if (Buffer.byteLength(body) > 16_000_000) return Response.json({ error: '한 번에 16MB까지 등록할 수 있습니다.' }, { status: 413 })
  if (path.join('/') === 'members' && request.method === 'POST') {
    if (!visitor.is_admin) return Response.json({ error: '관리자만 역할을 등록합니다.' }, { status: 403 })
    try {
      const target = JSON.parse(body).user_id
      if (target !== visitor.user_id) {
        const sdk = await makeAxhub()
        const directory = await sdk.tenants.membersDirectory(TENANT)
        if (!directory.items.some(m => m.userId === target)) return Response.json({ error: '가입한 활성 구성원만 역할을 등록할 수 있습니다.' }, { status: 422 })
      }
    } catch {
      return Response.json({ error: '사용자 정보를 확인할 수 없습니다. 회사 앱 주소에서 다시 시도해 주세요.' }, { status: 422 })
    }
  }
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const identity = Buffer.from(JSON.stringify({ id: visitor.user_id, tenant: TENANT, admin: visitor.is_admin })).toString('hex')
  const canonical = [timestamp, request.method, pathname, identity, createHash('sha256').update(body).digest('hex')].join('\n')
  try {
    const result = await fetch(`http://127.0.0.1:${process.env.NEXORA_API_PORT || '8000'}${pathname}`, {
      method: request.method,
      headers: { 'Content-Type': 'application/json', 'x-nx-time': timestamp, 'x-nx-identity': identity,
        'x-nx-signature': createHmac('sha256', secret).update(canonical).digest('hex') },
      ...(body ? { body } : {}), cache: 'no-store', signal: AbortSignal.timeout(55_000),
    })
    return new Response(await result.text(), { status: result.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: '업무 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 503 })
  }
}

export { proxy as GET, proxy as POST }
