import test from 'node:test'
import assert from 'node:assert/strict'
import { workspaceHref } from '../lib/workspace-navigation.mjs'
import { requestEngine } from '../lib/engine-client.mjs'

test('deep links preserve scope and safely encode case identifiers', () => {
  const url = workspaceHref('승인 업무함','live','case/with?reserved#chars')
  const parsed = new URL(url,'https://example.test')
  assert.equal(parsed.pathname,'/workspace/approvals')
  assert.equal(parsed.searchParams.get('scope'),'live')
  assert.equal(parsed.searchParams.get('case'),'case/with?reserved#chars')
  assert.throws(() => workspaceHref('javascript:alert(1)','demo'))
})

test('dashboard list links carry their filter across route remounts', () => {
  const cases = new URL(workspaceHref('승인 업무함', 'live', '', '진행'), 'https://example.test')
  assert.equal(cases.searchParams.get('filter'), '진행')
  assert.equal(cases.searchParams.has('case'), false)
  const tasks = new URL(workspaceHref('후속 작업', 'demo', '', 'OPEN'), 'https://example.test')
  assert.equal(tasks.pathname, '/workspace/tasks')
  assert.equal(tasks.searchParams.get('filter'), 'OPEN')
})

test('network, HTML error and authorization failures produce actionable text', async t => {
  const original = globalThis.fetch
  t.after(() => { globalThis.fetch = original })
  globalThis.fetch = async () => { throw new Error('private upstream details') }
  await assert.rejects(requestEngine('workspace'), /새로고침/)
  globalThis.fetch = async () => new Response('<html>upstream</html>',{status:502})
  await assert.rejects(requestEngine('workspace'), /응답 형식.*502/)
  globalThis.fetch = async () => Response.json({error:'해당 역할 필요'},{status:403})
  await assert.rejects(requestEngine('cases/a/actions',{}), /담당자/)
  globalThis.fetch = async () => Response.json(null,{status:503})
  await assert.rejects(requestEngine('workspace'), /관리자/)
  globalThis.fetch = async () => Response.json(null)
  await assert.rejects(requestEngine('workspace'), /응답 형식/)
})
