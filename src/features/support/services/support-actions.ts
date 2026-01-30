'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  SupportTicket,
  SupportTicketWithMessages,
  CreateTicketForm,
  SupportMessage,
} from '../types'

export async function getUserTickets(): Promise<{
  data: SupportTicket[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'No autenticado' }
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching tickets:', error)
      return { data: null, error: 'Error al cargar los tickets' }
    }

    return { data: data as SupportTicket[], error: null }
  } catch (err) {
    console.error('Unexpected error in getUserTickets:', err)
    return { data: null, error: 'Error inesperado al cargar tickets' }
  }
}

export async function getTicketDetail(ticketId: string): Promise<{
  data: SupportTicketWithMessages | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'No autenticado' }
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single()

    if (ticketError) {
      console.error('Error fetching ticket:', ticketError)
      return { data: null, error: 'Error al cargar el ticket' }
    }

    const { data: messages, error: messagesError } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return { data: null, error: 'Error al cargar los mensajes' }
    }

    const ticketWithMessages: SupportTicketWithMessages = {
      ...(ticket as SupportTicket),
      messages: (messages as SupportMessage[]) || [],
    }

    return { data: ticketWithMessages, error: null }
  } catch (err) {
    console.error('Unexpected error in getTicketDetail:', err)
    return { data: null, error: 'Error inesperado al cargar el ticket' }
  }
}

export async function createTicket(form: CreateTicketForm): Promise<{
  data: SupportTicket | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'No autenticado' }
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject: form.subject,
        category: form.category,
        status: 'open',
        priority: 'normal',
      })
      .select()
      .single()

    if (ticketError) {
      console.error('Error creating ticket:', ticketError)
      return { data: null, error: 'Error al crear el ticket' }
    }

    const { error: messageError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        sender_type: 'user',
        content: form.message,
      })

    if (messageError) {
      console.error('Error creating initial message:', messageError)
      return { data: null, error: 'Error al crear el mensaje inicial' }
    }

    return { data: ticket as SupportTicket, error: null }
  } catch (err) {
    console.error('Unexpected error in createTicket:', err)
    return { data: null, error: 'Error inesperado al crear el ticket' }
  }
}

export async function addUserMessage(
  ticketId: string,
  content: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'No autenticado' }
    }

    const { error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_type: 'user',
        content,
      })

    if (error) {
      console.error('Error adding message:', error)
      return { error: 'Error al enviar el mensaje' }
    }

    return { error: null }
  } catch (err) {
    console.error('Unexpected error in addUserMessage:', err)
    return { error: 'Error inesperado al enviar el mensaje' }
  }
}

export async function rateTicket(
  ticketId: string,
  rating: number
): Promise<{ error: string | null }> {
  try {
    if (rating < 1 || rating > 5) {
      return { error: 'La calificacion debe estar entre 1 y 5' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'No autenticado' }
    }

    const { error } = await supabase
      .from('support_tickets')
      .update({ satisfaction_rating: rating })
      .eq('id', ticketId)

    if (error) {
      console.error('Error rating ticket:', error)
      return { error: 'Error al calificar el ticket' }
    }

    return { error: null }
  } catch (err) {
    console.error('Unexpected error in rateTicket:', err)
    return { error: 'Error inesperado al calificar' }
  }
}

export async function escalateTicket(ticketId: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'No autenticado' }
    }

    const { error } = await supabase
      .from('support_tickets')
      .update({ status: 'escalated', updated_at: new Date().toISOString() })
      .eq('id', ticketId)

    if (error) {
      console.error('Error escalating ticket:', error)
      return { error: 'Error al escalar el ticket' }
    }

    return { error: null }
  } catch (err) {
    console.error('Unexpected error in escalateTicket:', err)
    return { error: 'Error inesperado al escalar el ticket' }
  }
}

export async function closeTicket(ticketId: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'No autenticado' }
    }

    const { error } = await supabase
      .from('support_tickets')
      .update({
        status: 'closed',
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)

    if (error) {
      console.error('Error closing ticket:', error)
      return { error: 'Error al cerrar el ticket' }
    }

    return { error: null }
  } catch (err) {
    console.error('Unexpected error in closeTicket:', err)
    return { error: 'Error inesperado al cerrar el ticket' }
  }
}
