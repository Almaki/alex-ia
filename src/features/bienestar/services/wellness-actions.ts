'use server'

import { createClient } from '@/lib/supabase/server'
import type { WellnessConversation, WellnessMessage } from '../types'

export async function getWellnessConversations(): Promise<WellnessConversation[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('wellness_conversations')
    .select('id, title, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(50)

  return (data ?? []) as WellnessConversation[]
}

export async function getWellnessMessages(conversationId: string): Promise<WellnessMessage[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Verify conversation belongs to user
  const { data: conv } = await supabase
    .from('wellness_conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!conv) return []

  const { data } = await supabase
    .from('wellness_messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  return (data ?? []).map((m) => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))
}

export async function deleteWellnessConversation(conversationId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('wellness_conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return {}
}
