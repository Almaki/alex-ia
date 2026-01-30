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

// ========== SUPPORT TICKET MANAGEMENT ==========

interface AdminTicket {
  id: string
  user_id: string
  subject: string
  category: string
  status: string
  priority: string
  satisfaction_rating: number | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  user_name: string | null
  user_email: string | null
}

interface AdminTicketMessage {
  id: string
  ticket_id: string
  sender_type: string
  content: string
  created_at: string
}

export async function getAdminTickets(
  statusFilter?: string
): Promise<AdminTicket[]> {
  const supabase = await requireAdmin()

  let query = supabase
    .from('support_tickets')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(100)

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: tickets, error } = await query

  if (error) {
    console.error('Error fetching admin tickets:', error)
    return []
  }

  if (!tickets || tickets.length === 0) return []

  // Fetch user info for all tickets
  const userIds = [...new Set(tickets.map(t => t.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds)

  const profileMap = new Map(
    (profiles ?? []).map(p => [p.id, p])
  )

  return tickets.map(t => ({
    ...t,
    user_name: profileMap.get(t.user_id)?.full_name ?? null,
    user_email: profileMap.get(t.user_id)?.email ?? null,
  })) as AdminTicket[]
}

export async function getAdminTicketMessages(
  ticketId: string
): Promise<AdminTicketMessage[]> {
  const supabase = await requireAdmin()

  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching ticket messages:', error)
    return []
  }

  return (data ?? []) as AdminTicketMessage[]
}

export async function addAdminMessage(
  ticketId: string,
  content: string
): Promise<{ error?: string }> {
  const supabase = await requireAdmin()

  const { error } = await supabase
    .from('support_messages')
    .insert({
      ticket_id: ticketId,
      sender_type: 'admin',
      content,
    })

  if (error) return { error: error.message }

  // Update ticket timestamp
  await supabase
    .from('support_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', ticketId)

  return {}
}

export async function updateTicketStatus(
  ticketId: string,
  status: string
): Promise<{ error?: string }> {
  const supabase = await requireAdmin()

  const validStatuses = ['open', 'in_progress', 'resolved', 'escalated', 'closed']
  if (!validStatuses.includes(status)) {
    return { error: 'Status invalido' }
  }

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'resolved' || status === 'closed') {
    updates.resolved_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('support_tickets')
    .update(updates)
    .eq('id', ticketId)

  if (error) return { error: error.message }
  return {}
}

export async function getTicketStats(): Promise<{ status: string; count: number }[]> {
  const supabase = await requireAdmin()

  const { data, error } = await supabase
    .from('support_tickets')
    .select('status')

  if (error || !data) return []

  const counts: Record<string, number> = {}
  data.forEach(t => {
    counts[t.status] = (counts[t.status] || 0) + 1
  })

  return Object.entries(counts).map(([status, count]) => ({ status, count }))
}
