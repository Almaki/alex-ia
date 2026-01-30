'use server'

import { createClient } from '@/lib/supabase/server'

interface ManualSource {
  source_file: string
  manual_type: string
  aircraft_type: string | null
  chunk_count: number
  is_active: boolean
  first_uploaded: string
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) throw new Error('No autorizado')
  return supabase
}

export async function getManualSources(): Promise<ManualSource[]> {
  const supabase = await requireAdmin()
  const { data, error } = await supabase.rpc('list_manual_sources')

  if (error) {
    console.error('list_manual_sources error:', error)
    return []
  }

  return (data ?? []) as ManualSource[]
}

export async function toggleManualActive(
  sourceFile: string,
  active: boolean
): Promise<{ error?: string; affected?: number }> {
  const supabase = await requireAdmin()

  const { data, error } = await supabase.rpc('toggle_manual_active', {
    p_source_file: sourceFile,
    p_active: active,
  })

  if (error) return { error: error.message }
  return { affected: data as number }
}

export async function deleteManual(
  sourceFile: string
): Promise<{ error?: string; affected?: number }> {
  const supabase = await requireAdmin()

  const { data, error } = await supabase.rpc('delete_manual', {
    p_source_file: sourceFile,
  })

  if (error) return { error: error.message }
  return { affected: data as number }
}

export async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return profile?.is_admin === true
}

// ========== DASHBOARD STATS ==========

interface DashboardStats {
  totalUsers: number
  activeToday: number
  totalQueries: number
  subscriptionBreakdown: { type: string; count: number }[]
}

export async function getAdminDashboardStats(): Promise<DashboardStats> {
  const supabase = await requireAdmin()

  // Total users
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })

  // Active today (last_seen_at within 24 hours)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: activeToday } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gte('last_seen_at', yesterday)

  // Total queries from usage_stats
  const { data: usageData } = await supabase
    .from('usage_stats')
    .select('query_count')
  const totalQueries = usageData?.reduce((sum, u) => sum + (u.query_count || 0), 0) ?? 0

  // Subscription breakdown
  const { data: subData } = await supabase
    .from('profiles')
    .select('subscription_type')

  const breakdown: Record<string, number> = { freemium: 0, pro: 0, premium: 0 }
  subData?.forEach((p) => {
    const t = p.subscription_type || 'freemium'
    breakdown[t] = (breakdown[t] || 0) + 1
  })

  return {
    totalUsers: totalUsers ?? 0,
    activeToday: activeToday ?? 0,
    totalQueries,
    subscriptionBreakdown: Object.entries(breakdown).map(([type, count]) => ({ type, count })),
  }
}

// ========== USER MANAGEMENT ==========

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

export async function getUsers(): Promise<AdminUser[]> {
  const supabase = await requireAdmin()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, fleet, position, subscription_type, is_admin, last_seen_at, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return data as AdminUser[]
}

export async function updateUserSubscription(
  userId: string,
  subscriptionType: string
): Promise<{ error?: string }> {
  const supabase = await requireAdmin()

  const validTypes = ['freemium', 'pro', 'premium']
  if (!validTypes.includes(subscriptionType)) {
    return { error: 'Tipo de suscripcion invalido' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ subscription_type: subscriptionType })
    .eq('id', userId)

  if (error) return { error: error.message }
  return {}
}

// ========== TOP QUERIES ==========

interface TopQuery {
  content: string
  count: number
}

export async function getTopQueries(): Promise<TopQuery[]> {
  const supabase = await requireAdmin()

  // Get recent user messages and count duplicates
  const { data: messages } = await supabase
    .from('messages')
    .select('content')
    .eq('role', 'user')
    .order('created_at', { ascending: false })
    .limit(500)

  if (!messages || messages.length === 0) return []

  // Count message frequency (normalize by lowercase + trim)
  const counts: Record<string, { original: string; count: number }> = {}
  messages.forEach((m) => {
    const normalized = m.content.toLowerCase().trim()
    if (!counts[normalized]) {
      counts[normalized] = { original: m.content, count: 0 }
    }
    counts[normalized].count++
  })

  // Sort by count, return top 10
  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((item) => ({ content: item.original, count: item.count }))
}

// ========== UPDATE LAST SEEN ==========

export async function updateLastSeen(): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('profiles')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', user.id)
  } catch {
    // Silent fail - not critical
  }
}
