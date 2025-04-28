import { redirect } from 'next/navigation'
import { KeyRound } from 'lucide-react'

import PageCard from '@/components/ui/page-card'
import { getUser } from '@/lib/db/queries/queries'
import UpdateDidForm from './update-did-form'
import { NEXT_PUBLIC_PLATFORM_ISSUER_DID } from '@/lib/config'

export const revalidate = 0

export default async function PlatformDidPage() {
  const user = await getUser()
  if (!user) redirect('/connect-wallet')
  if (user.role !== 'admin') redirect('/dashboard')

  return (
    <PageCard
      icon={KeyRound}
      title='Platform DID'
      description='The platform uses this Flare DID whenever FlareCred itself issues verifiable credentials.'
    >
      <p className='text-muted-foreground mb-6 text-sm'>
        Paste an existing DID or generate a fresh one below. The value is stored in the environment
        file and utilised for credential issuance on the Flare Network.
      </p>
      <UpdateDidForm defaultDid={NEXT_PUBLIC_PLATFORM_ISSUER_DID} />
    </PageCard>
  )
}