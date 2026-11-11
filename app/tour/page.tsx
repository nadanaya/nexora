import { NexoraTour } from '@/components/NexoraTour'
import { isAxhubConfigured, loginUrl, me } from '@/lib/axhub-server'

export default async function TourPage() {
  const visitor = await me()
  const signInUrl = isAxhubConfigured() ? await loginUrl('/tour') : undefined

  return <NexoraTour authenticated={visitor.authenticated} isAdmin={visitor.is_admin} signInUrl={signInUrl} />
}
