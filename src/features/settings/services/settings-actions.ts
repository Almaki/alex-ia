'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

interface Profile {
  id: string
  full_name: string | null
  email: string
  fleet: string | null
  position: string | null
}

interface UpdateProfileData {
  fullName: string
  fleet: string | null
  position: string | null
}

/**
 * Obtiene el perfil del usuario actual
 */
export async function getProfile(): Promise<{ data?: Profile; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'No autenticado' }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, fleet, position')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return { error: 'Error al obtener el perfil' }
    }

    return { data: profile as Profile }
  } catch (error) {
    console.error('Unexpected error in getProfile:', error)
    return { error: 'Error inesperado al obtener el perfil' }
  }
}

/**
 * Actualiza el perfil del usuario actual
 */
export async function updateProfile(
  formData: UpdateProfileData
): Promise<{ data?: Profile; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'No autenticado' }
    }

    // Actualizar perfil
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: formData.fullName,
        fleet: formData.fleet,
        position: formData.position,
      })
      .eq('id', user.id)
      .select('id, full_name, email, fleet, position')
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return { error: 'Error al actualizar el perfil' }
    }

    return { data: updatedProfile as Profile }
  } catch (error) {
    console.error('Unexpected error in updateProfile:', error)
    return { error: 'Error inesperado al actualizar el perfil' }
  }
}

/**
 * Elimina la cuenta del usuario actual de forma permanente
 * Utiliza el service role client para eliminar del auth.users,
 * lo que cascadea a profiles y otras tablas relacionadas
 */
export async function deleteAccount(): Promise<{ success?: boolean; error?: string }> {
  try {
    // 1. Verificar autenticación con cliente regular
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'No autenticado' }
    }

    // 2. Validar variables de entorno necesarias
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables')
      return { error: 'Configuración del servidor incompleta' }
    }

    // 3. Crear cliente con service role para poder eliminar auth.users
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 4. Eliminar usuario (cascadea a profiles y otras tablas)
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return { error: 'Error al eliminar la cuenta' }
    }

    // 5. Cerrar sesión en el cliente regular
    await supabase.auth.signOut()

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in deleteAccount:', error)
    return { error: 'Error inesperado al eliminar la cuenta' }
  }
}
