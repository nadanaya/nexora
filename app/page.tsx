import { isAxhubConfigured, loginUrl, me } from '@/lib/axhub-server'
import { NexoraWorkspace } from '@/components/NexoraWorkspace'

export default async function Home() {
  const visitor = await me()
  const configured = isAxhubConfigured()
  const signIn = configured ? await loginUrl('/') : '#'
  return <NexoraWorkspace
    authenticated={visitor.authenticated}
    userId={visitor.user_id}
    userName={visitor.name || visitor.email || ''}
    isAdmin={visitor.is_admin}
    signInUrl={signIn}
  />
}
