import test from 'node:test'
import assert from 'node:assert/strict'
import { isAllowedOrigin } from '../lib/request-origin.mjs'

test('reverse proxy: public browser origin matches Host despite a private listener URL', () => {
  assert.equal(isAllowedOrigin({ origin: 'https://nexora-n28m.axhub.app', host: 'nexora-n28m.axhub.app', url: 'http://localhost:3000/api/engine/cases', fetchSite: 'same-origin' }), true)
  assert.equal(isAllowedOrigin({ origin: 'http://127.0.0.1:3107', host: '127.0.0.1:3107', url: 'http://127.0.0.1:45123/api/engine/cases', fetchSite: 'same-origin' }), true)
})

test('cross-site, malformed, null and forged forwarded origins are rejected', () => {
  const base = { host: 'nexora-n28m.axhub.app', url: 'http://localhost:3000/api/engine/cases', fetchSite: 'same-origin' }
  for (const origin of ['https://evil.example', 'null', 'not a URL', 'file://nexora-n28m.axhub.app', 'http://localhost:3000']) assert.equal(isAllowedOrigin({ ...base, origin, forwardedHost: 'evil.example' }), false)
  assert.equal(isAllowedOrigin({ ...base, origin: 'https://nexora-n28m.axhub.app', fetchSite: 'cross-site' }), false)
})
