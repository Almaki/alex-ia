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
