'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  getAdminDashboardStats,
  getUsers,
  updateUserSubscription,
  getTopQueries,
} from '../services/admin-actions'

interface DashboardStats {
  totalUsers: number
  activeToday: number
  totalQueries: number
  subscriptionBreakdown: { type: string; count: number }[]
}

interface AdminUser {
  id: string
  email: string
  full_name: string | null
  fleet: string | null
  position: string | null
  subscription_type: string
  is_admin: boolean
  last_seen_at: string | null
  created_at: string
}

interface TopQuery {
  content: string
  count: number
}

const SUB_COLORS: Record<string, string> = {
  freemium: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  pro: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  premium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

const SUB_LABELS: Record<string, string> = {
  freemium: 'Freemium',
  pro: 'Pro',
  premium: 'Premium',
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [topQueries, setTopQueries] = useState<TopQuery[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const [statsData, usersData, queriesData] = await Promise.all([
        getAdminDashboardStats(),
        getUsers(),
        getTopQueries(),
      ])
      setStats(statsData)
      setUsers(usersData)
      setTopQueries(queriesData)
    })
  }, [])

  const handleSubscriptionChange = async (userId: string, newType: string) => {
    const result = await updateUserSubscription(userId, newType)
    if (!result.error) {
      setUsers((prev) =>
        prev.map((u) => u.id === userId ? { ...u, subscription_type: newType } : u)
      )
    }
  }

  const isOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false
    return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000 // 5 minutes
  }

  if (isPending && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-gray-900/50 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Usuarios Totales</p>
            <p className="text-2xl md:text-3xl font-bold text-white">{stats.totalUsers}</p>
          </div>
          <div className="bg-gray-900/50 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Activos Hoy</p>
            <p className="text-2xl md:text-3xl font-bold text-emerald-400">{stats.activeToday}</p>
          </div>
          <div className="bg-gray-900/50 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Total Queries</p>
            <p className="text-2xl md:text-3xl font-bold text-purple-400">{stats.totalQueries}</p>
          </div>
          <div className="bg-gray-900/50 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">En Linea</p>
            <p className="text-2xl md:text-3xl font-bold text-cyan-400">
              {users.filter((u) => isOnline(u.last_seen_at)).length}
            </p>
          </div>
        </div>
      )}

      {/* Subscription Breakdown */}
      {stats && (
        <div className="bg-gray-900/50 border border-white/10 rounded-xl p-4 md:p-6">
          <h3 className="text-sm font-semibold text-white mb-3">Distribucion de Suscripciones</h3>
          <div className="flex gap-4">
            {stats.subscriptionBreakdown.map((item) => (
              <div key={item.type} className="flex-1 text-center">
                <p className="text-2xl font-bold text-white">{item.count}</p>
                <p className={`text-xs font-medium mt-1 ${
                  item.type === 'freemium' ? 'text-gray-400' :
                  item.type === 'pro' ? 'text-blue-400' : 'text-amber-400'
                }`}>
                  {SUB_LABELS[item.type] || item.type}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-gray-900/50 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 md:p-6 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">Usuarios ({users.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-400">Usuario</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-400 hidden md:table-cell">Flota</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-400">Plan</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-400 hidden sm:table-cell">Estado</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-400 hidden lg:table-cell">Registro</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-medium truncate max-w-[180px]">
                        {user.full_name || 'Sin nombre'}
                        {user.is_admin && (
                          <span className="ml-1.5 text-xs text-purple-400">(Admin)</span>
                        )}
                      </p>
                      <p className="text-gray-500 text-xs truncate max-w-[180px]">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                    {user.fleet || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.subscription_type}
                      onChange={(e) => handleSubscriptionChange(user.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-lg border cursor-pointer bg-transparent ${SUB_COLORS[user.subscription_type] || SUB_COLORS.freemium}`}
                    >
                      <option value="freemium" className="bg-gray-900">Freemium</option>
                      <option value="pro" className="bg-gray-900">Pro</option>
                      <option value="premium" className="bg-gray-900">Premium</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-flex items-center gap-1.5 text-xs ${
                      isOnline(user.last_seen_at) ? 'text-emerald-400' : 'text-gray-500'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        isOnline(user.last_seen_at) ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'
                      }`} />
                      {isOnline(user.last_seen_at) ? 'En linea' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                    {new Date(user.created_at).toLocaleDateString('es-MX')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Queries */}
      {topQueries.length > 0 && (
        <div className="bg-gray-900/50 border border-white/10 rounded-xl p-4 md:p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Preguntas Mas Frecuentes</h3>
          <div className="space-y-2">
            {topQueries.map((query, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
              >
                <span className="text-xs font-bold text-purple-400 w-6 text-center">
                  {index + 1}
                </span>
                <p className="flex-1 text-sm text-gray-300 truncate">{query.content}</p>
                <span className="text-xs font-medium text-gray-500 shrink-0">
                  {query.count}x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
