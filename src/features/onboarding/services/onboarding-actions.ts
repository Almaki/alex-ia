'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { FleetType, PositionType } from '@/types/database'

export async function completeOnboarding(data: {
  full_name: string
  fleet: FleetType
  position: PositionType
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.full_name,
      fleet: data.fleet,
      position: data.position,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function getOnboardingStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { completed: false, profile: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, full_name, fleet, position')
    .eq('id', user.id)
    .single()

  return {
    completed: profile?.onboarding_completed ?? false,
    profile,
  }
}
