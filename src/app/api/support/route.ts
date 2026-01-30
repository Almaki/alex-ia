import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { buildSupportPrompt } from './system-prompt'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 })
    }

    // 2. Parse body
    const body = await request.json()
    const { message, ticketId } = body as {
      message: string
      ticketId: string
    }

    if (!message?.trim()) {
      return Response.json({ error: 'Mensaje vacio' }, { status: 400 })
    }

    if (!ticketId) {
      return Response.json({ error: 'ticketId requerido' }, { status: 400 })
    }

    // 3. Get user profile for personalization
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const userName = profile?.full_name || 'Piloto'

    // 4. Fetch message history from support_messages (last 20 messages)
    const { data: history } = await supabase
      .from('support_messages')
      .select('sender_type, message')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
      .limit(20)

    // 5. Build chat history - map sender_type to Gemini roles
    const rawHistory = (history ?? []).map((m) => ({
      role: (m.sender_type === 'user' ? 'user' : 'model') as 'user' | 'model',
      parts: [{ text: m.message }],
    }))

    // 6. Validate and fix alternating roles
    const chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = []
    for (const msg of rawHistory) {
      if (chatHistory.length === 0 && msg.role === 'model') continue
      if (chatHistory.length === 0) {
        chatHistory.push(msg)
      } else {
        const lastRole = chatHistory[chatHistory.length - 1].role
        if (msg.role === lastRole) {
          chatHistory[chatHistory.length - 1].parts[0].text += '\n\n' + msg.parts[0].text
        } else {
          chatHistory.push(msg)
        }
      }
    }

    // 7. Call Gemini 2.5 Flash with streaming
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'API key no configurada' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: buildSupportPrompt(userName),
    })

    const chat = model.startChat({
      history: chatHistory.slice(0, -1),
    })

    // Call Gemini with specific error handling
    let result
    try {
      result = await chat.sendMessageStream(message)
    } catch (err: unknown) {
      console.error('Gemini sendMessageStream error (support):', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      const errorString = errorMessage.toLowerCase()

      if (errorString.includes('rate limit') || errorString.includes('quota') || errorString.includes('429')) {
        return Response.json(
          { error: 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.' },
          { status: 429 }
        )
      }
      if (errorString.includes('safety') || errorString.includes('blocked')) {
        return Response.json(
          { error: 'No puedo procesar esa consulta. Intenta reformularla.' },
          { status: 400 }
        )
      }
      return Response.json(
        { error: 'Error generando respuesta. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    // 8. Stream response via SSE
    const encoder = new TextEncoder()
    let fullResponse = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            if (text) {
              fullResponse += text
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: text })}\n\n`)
              )
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))

          // 9. Save full response as support_message
          await supabase.from('support_messages').insert({
            ticket_id: ticketId,
            sender_type: 'agent',
            message: fullResponse,
          })

          // 10. Update ticket status if currently 'open'
          const { data: ticket } = await supabase
            .from('support_tickets')
            .select('status')
            .eq('id', ticketId)
            .single()

          if (ticket?.status === 'open') {
            await supabase
              .from('support_tickets')
              .update({ status: 'in_progress' })
              .eq('id', ticketId)
          }

          // Update ticket timestamp
          await supabase
            .from('support_tickets')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', ticketId)

          controller.close()
        } catch (err) {
          console.error('Support streaming error:', err)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Error generando respuesta' })}\n\n`)
          )
          controller.close()
        }
      },
    })

    // 11. Return stream Response with SSE headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Support API error:', msg)

    if (msg.includes('429') || msg.includes('quota') || msg.includes('rate')) {
      return Response.json(
        { error: 'Servicio temporalmente no disponible. Intenta de nuevo en unos minutos.' },
        { status: 429 }
      )
    }

    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
