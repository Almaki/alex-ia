import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { buildRosterPrompt } from './system-prompt'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 })
    }

    // 2. Parse form data (expect image or base64)
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return Response.json({ error: 'No se proporciono archivo' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      return Response.json({ error: 'Tipo de archivo no soportado. Usa JPG, PNG, WebP o PDF.' }, { status: 400 })
    }

    // 3. Convert file to base64 for Gemini
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type

    // 4. Create roster upload record
    const fileType = file.type === 'application/pdf' ? 'pdf' : 'image'
    const { data: upload, error: uploadError } = await supabase
      .from('roster_uploads')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_type: fileType,
        status: 'processing',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      })
      .select('id')
      .single()

    if (uploadError) {
      return Response.json({ error: 'Error guardando archivo' }, { status: 500 })
    }

    // 5. Call Gemini Vision
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'API key no configurada' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: buildRosterPrompt(),
    })

    const result = await model.generateContent([
      { text: 'Analiza este roster de tripulacion y extrae toda la informacion en formato JSON. Responde SOLO con el JSON, sin explicaciones.' },
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
    ])

    const responseText = result.response.text()

    // 6. Parse JSON response
    let parsedData
    try {
      // Clean response - remove markdown code blocks if present
      const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsedData = JSON.parse(cleanJson)
    } catch {
      // Update upload as failed
      await supabase
        .from('roster_uploads')
        .update({ status: 'failed', error_message: 'No se pudo interpretar el roster', raw_response: { text: responseText } })
        .eq('id', upload.id)

      return Response.json({
        error: 'No se pudo interpretar el roster. Intenta con una imagen mas clara.',
        raw: responseText
      }, { status: 422 })
    }

    // 7. Save parsed data to logbook tables
    const entries = parsedData.entries || []
    const savedEntries = []

    for (const entry of entries) {
      // Insert logbook entry
      const { data: logbookEntry, error: entryError } = await supabase
        .from('logbook_entries')
        .upsert({
          user_id: user.id,
          roster_upload_id: upload.id,
          entry_date: entry.date,
          activity_type: entry.activity_type || 'other',
          check_in: entry.check_in || null,
          check_out: entry.check_out || null,
          hotel: entry.hotel || null,
          notes: entry.notes || null,
          crew_captain: entry.crew_captain || null,
          crew_first_officer: entry.crew_first_officer || null,
          crew_purser: entry.crew_purser || null,
        }, { onConflict: 'user_id,entry_date' })
        .select('id')
        .single()

      if (entryError) {
        console.error('Error saving entry:', entryError)
        continue
      }

      // Insert flights for this entry
      if (entry.flights && entry.flights.length > 0) {
        const flightsToInsert = entry.flights.map((flight: Record<string, unknown>, index: number) => ({
          entry_id: logbookEntry.id,
          flight_number: flight.flight_number || null,
          aircraft_type: flight.aircraft_type || null,
          aircraft_registration: flight.aircraft_registration || null,
          origin: flight.origin || 'UNK',
          destination: flight.destination || 'UNK',
          std: flight.std || null,
          sta: flight.sta || null,
          block_hours: flight.block_hours || null,
          is_night: flight.is_night || false,
          sort_order: index,
        }))

        // Delete existing flights for this entry first (in case of re-upload)
        await supabase.from('logbook_flights').delete().eq('entry_id', logbookEntry.id)

        await supabase.from('logbook_flights').insert(flightsToInsert)
      }

      savedEntries.push({ ...entry, id: logbookEntry.id })
    }

    // 8. Update upload status
    await supabase
      .from('roster_uploads')
      .update({
        status: 'completed',
        month: parsedData.month || new Date().getMonth() + 1,
        year: parsedData.year || new Date().getFullYear(),
        raw_response: parsedData,
      })
      .eq('id', upload.id)

    return Response.json({
      success: true,
      uploadId: upload.id,
      entriesCount: savedEntries.length,
      data: parsedData,
    })

  } catch (err) {
    console.error('Roster API error:', err)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
