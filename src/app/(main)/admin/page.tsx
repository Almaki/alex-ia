import { redirect } from 'next/navigation'
import { checkIsAdmin } from '@/features/admin/services/admin-actions'
import { ManualManager, TicketManager } from '@/features/admin/components'

export default async function AdminPage() {
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) redirect('/dashboard')

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Panel de Administracion</h1>
        <p className="mt-1 text-gray-400">Gestiona manuales, tickets y configuracion de AlexIA</p>
      </div>

      <ManualManager />

      <TicketManager />
    </div>
  )
}
