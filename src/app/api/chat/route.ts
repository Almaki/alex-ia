import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { executeRagPipeline } from '@/features/rag/services/rag-pipeline'
import { buildSystemPrompt } from './system-prompt'

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
    const { message, conversationId } = body as {
      message: string
      conversationId: string | null
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
      .select('*')
      .eq('id', user.id)
      .single()

    // 5. Execute RAG pipeline
    let ragContext = ''
    let ragSources: { chunk_id: string; manual_type: string; aircraft_type: string | null; section: string | null; page_number: number | null; similarity: number }[] = []

    try {
      const ragResult = await executeRagPipeline(message, {
        aircraftType: profile?.fleet ?? undefined,
      })
      ragContext = ragResult.formattedContext
      ragSources = ragResult.sources
    } catch {
      // RAG failure is non-fatal — continue without context
      console.warn('RAG pipeline failed, continuing without context')
    }

    // 6. Get or create conversation
    let activeConversationId = conversationId

    if (!activeConversationId) {
      const title = message.length > 50 ? message.slice(0, 50) + '...' : message
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({ user_id: user.id, title })
        .select('id')
        .single()

      if (convError || !newConv) {
        return Response.json({ error: 'Error creando conversacion' }, { status: 500 })
      }
      activeConversationId = newConv.id
    }

    // 7. Save user message
    await supabase.from('messages').insert({
      conversation_id: activeConversationId,
      role: 'user',
      content: message,
    })

    // 8. Build message history for context
    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', activeConversationId)
      .order('created_at', { ascending: true })
      .limit(20)

    const chatHistory = (history ?? []).map((m) => ({
      role: m.role as 'user' | 'model',
      parts: [{ text: m.content }],
    }))
    // Gemini uses 'model' for assistant role
    chatHistory.forEach((m) => {
      if (m.role === ('assistant' as string)) {
        m.role = 'model'
      }
    })

    // 9. Call Gemini with streaming
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'API key no configurada' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: buildSystemPrompt(profile, ragContext),
    })

    const chat = model.startChat({
      history: chatHistory.slice(0, -1), // Exclude the last user message (we send it below)
    })

    const result = await chat.sendMessageStream(message)

    // 10. Stream response via SSE
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

          // Sources are stored server-side only — never sent to client
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))

          // Save assistant message to DB
          await supabase.from('messages').insert({
            conversation_id: activeConversationId,
            role: 'assistant',
            content: fullResponse,
            sources: ragSources.length > 0 ? ragSources : null,
          })

          // Update conversation timestamp
          await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', activeConversationId)

          controller.close()
        } catch (err) {
          console.error('Streaming error:', err)
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
  } catch (err) {
    console.error('Chat API error:', err)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
