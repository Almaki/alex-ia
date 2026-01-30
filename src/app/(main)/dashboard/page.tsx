import { redirect } from 'next/navigation'
import { checkIsAdmin } from '@/features/admin/services/admin-actions'
import { AdminDashboard } from '@/features/admin/components'

export default async function DashboardPage() {
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) redirect('/chat')

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
        <p className="mt-1 text-sm text-gray-400">
          Metricas y gestion de usuarios de AlexIA
        </p>
      </div>

      <AdminDashboard />
    </div>
  )
}
