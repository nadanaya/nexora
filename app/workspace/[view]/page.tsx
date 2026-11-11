import { notFound } from 'next/navigation'
import { isAxhubConfigured, loginUrl, me } from '@/lib/axhub-server'
import { NexoraWorkspace } from '@/components/NexoraWorkspace'

const views: Record<string,string> = { dashboard:'현황',relationships:'관계·영향',incentives:'합산 검증',ai:'AI 판단',approvals:'승인 업무함',payments:'모의 지급',tasks:'후속 작업',replay:'Decision Replay',audit:'감사 기록',demo:'Guided Demo' }
export default async function Page({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params
  if (!views[view]) notFound()
  const visitor = await me()
  return <NexoraWorkspace authenticated={visitor.authenticated} userId={visitor.user_id} userName={visitor.name || visitor.email || ''} isAdmin={visitor.is_admin} signInUrl={isAxhubConfigured() ? await loginUrl('/workspace/'+view) : '#'} initialTab={views[view]} />
}
