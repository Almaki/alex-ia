import { redirect } from 'next/navigation'
import { checkIsAdmin } from '@/features/admin/services/admin-actions'
import { BitacoraPage } from '@/features/bitacora/components'

export default async function BetaPage() {
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) redirect('/chat')

  return <BitacoraPage />
}
