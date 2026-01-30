import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { buildWellnessPrompt } from './system-prompt'

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
    const { message, conversationId, responseMode } = body as {
      message: string
      conversationId: string | null
      responseMode?: 'concise' | 'detailed'
    }

    if (!message?.trim()) {
      return Response.json({ error: 'Mensaje vacio' }, { status: 400 })
    }

    // 3. Increment usage
    await supabase.rpc('increment_usage', {
      p_user_id: user.id,
      p_field: 'query_count',
      p_amount: 1,
    })

    // 4. Get user profile for personalization
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const userName = profile?.full_name || 'piloto'

    // 5. Get or create wellness conversation
    let activeConversationId = conversationId

    if (!activeConversationId) {
      const title = message.length > 50 ? message.slice(0, 50) + '...' : message
      const { data: newConv, error: convError } = await supabase
        .from('wellness_conversations')
        .insert({ user_id: user.id, title })
        .select('id')
        .single()

      if (convError || !newConv) {
        return Response.json({ error: 'Error creando conversacion' }, { status: 500 })
      }
      activeConversationId = newConv.id
    }

    // 6. Save user message
    await supabase.from('wellness_messages').insert({
      conversation_id: activeConversationId,
      role: 'user',
      content: message,
    })

    // 7. Build message history for context (last 15 messages)
    const { data: history } = await supabase
      .from('wellness_messages')
      .select('role, content')
      .eq('conversation_id', activeConversationId)
      .order('created_at', { ascending: true })
      .limit(15)

    const rawHistory = (history ?? []).map((m) => ({
      role: m.role as 'user' | 'model',
      parts: [{ text: m.content }],
    }))
    // Gemini uses 'model' for assistant role
    rawHistory.forEach((m) => {
      if (m.role === ('assistant' as string)) {
        m.role = 'model'
      }
    })

    // Validate and fix chat history - Gemini requires alternating user/model roles
    // and the first message must be from 'user'
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

    // 8. Call Gemini with streaming
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'API key no configurada' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: buildWellnessPrompt(userName, responseMode || 'detailed'),
    })

    const chat = model.startChat({
      history: chatHistory.slice(0, -1),
    })

    // Call Gemini with specific error handling
    let result
    try {
      result = await chat.sendMessageStream(message)
    } catch (err: unknown) {
      console.error('Gemini sendMessageStream error (wellness):', err)
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

    // 9. Stream response via SSE
    const encoder = new TextEncoder()
    let fullResponse = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send conversation ID first
          if (!conversationId) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'conversation_id', id: activeConversationId })}\n\n`)
            )
          }

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

          // Save assistant message to DB
          await supabase.from('wellness_messages').insert({
            conversation_id: activeConversationId,
            role: 'assistant',
            content: fullResponse,
          })

          // Update conversation timestamp
          await supabase
            .from('wellness_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', activeConversationId)

          controller.close()
        } catch (err) {
          console.error('Wellness streaming error:', err)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Error generando respuesta' })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Wellness API error:', msg)

    if (msg.includes('429') || msg.includes('quota') || msg.includes('rate')) {
      return Response.json(
        { error: 'Servicio temporalmente no disponible. Intenta de nuevo en unos minutos.' },
        { status: 429 }
      )
    }

    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
