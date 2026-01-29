/**
 * Script CLI para generar preguntas de quiz desde chunks de manuales de aviacion
 *
 * Uso:
 *   npx tsx scripts/generate-quiz-questions.ts --aircraft A320 [opciones]
 *
 * Opciones:
 *   --aircraft    Tipo de aeronave: A320, B737, E190, etc. (obligatorio)
 *   --category    Categoria especifica: systems, aerodynamics, meteorology,
 *                 regulations, procedures, performance, navigation,
 *                 human_factors, emergency (opcional, auto-detecta si no se provee)
 *   --difficulty  Dificultad: 1, 2, o 3 (opcional, genera mix si no se provee)
 *   --limit       Maximo de chunks a procesar (default: 50)
 *   --batch-size  Chunks por llamada a Gemini (default: 5)
 *
 * Requiere:
 *   - GOOGLE_GENERATIVE_AI_API_KEY en .env.local
 *   - NEXT_PUBLIC_SUPABASE_URL en .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY en .env.local
 */

import fs from 'fs'
import path from 'path'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

// --- Config ---
const GENERATION_MODEL = 'gemini-2.5-flash'
const DELAY_BETWEEN_BATCHES = 1000 // 1 segundo
const VALID_CATEGORIES = [
  'systems',
  'aerodynamics',
  'meteorology',
  'regulations',
  'procedures',
  'performance',
  'navigation',
  'human_factors',
  'emergency',
]

// --- Types ---
interface CliArgs {
  aircraft: string
  category?: string
  difficulty?: number
  limit: number
  batchSize: number
}

interface ChunkMetadata {
  manualType: string
  aircraftType: string
  section: string | null
  pageNumber: number | null
  sourceFile: string
  chunkIndex: number
}

interface Chunk {
  id: number
  content: string
  metadata: ChunkMetadata
}

interface GeneratedQuestion {
  content: string
  options: string[]
  correct_index: number
  explanation: string
  difficulty: number
  category: string
}

interface QuizQuestion extends GeneratedQuestion {
  aircraft_type: string
  source_chunk_id: number
}

interface ProcessingStats {
  chunksProcessed: number
  questionsGenerated: number
  questionsInserted: number
  errors: number
  errorDetails: string[]
}

// --- Parse CLI args ---
function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const map: Record<string, string> = {}

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2)
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : 'true'
      map[key] = val
      if (val !== 'true') i++
    }
  }

  if (!map.aircraft) {
    console.error('\nUso: npx tsx scripts/generate-quiz-questions.ts --aircraft A320 [opciones]\n')
    console.error('Opciones:')
    console.error('  --aircraft    Tipo de aeronave (obligatorio)')
    console.error('  --category    Categoria especifica (opcional)')
    console.error('  --difficulty  1, 2, o 3 (opcional)')
    console.error('  --limit       Max chunks a procesar (default: 50)')
    console.error('  --batch-size  Chunks por batch (default: 5)')
    console.error('\nCategorias validas:')
    console.error('  ' + VALID_CATEGORIES.join(', '))
    process.exit(1)
  }

  const category = map.category?.toLowerCase()
  if (category && !VALID_CATEGORIES.includes(category)) {
    console.error(`Categoria invalida: ${category}`)
    console.error(`Categorias validas: ${VALID_CATEGORIES.join(', ')}`)
    process.exit(1)
  }

  const difficulty = map.difficulty ? parseInt(map.difficulty, 10) : undefined
  if (difficulty !== undefined && (difficulty < 1 || difficulty > 3)) {
    console.error('Dificultad debe ser 1, 2, o 3')
    process.exit(1)
  }

  return {
    aircraft: map.aircraft.toUpperCase(),
    category,
    difficulty,
    limit: parseInt(map.limit || '50', 10),
    batchSize: parseInt(map['batch-size'] || '5', 10),
  }
}

// --- Load env ---
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('No se encontro .env.local en el directorio actual')
    process.exit(1)
  }

  const content = fs.readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const val = trimmed.slice(eqIndex + 1).trim()
    if (!process.env[key]) {
      process.env[key] = val
    }
  }
}

// --- Fetch chunks from Supabase ---
async function fetchChunks(
  supabaseUrl: string,
  supabaseKey: string,
  aircraft: string,
  limit: number
): Promise<Chunk[]> {
  const supabase = createClient(supabaseUrl, supabaseKey)

  // metadata is jsonb, filter by aircraftType inside it
  const { data, error } = await supabase
    .from('aviation_manual_chunks')
    .select('id, content, metadata')
    .eq('metadata->>aircraftType', aircraft)
    .limit(limit)
    .order('id', { ascending: true })

  if (error) {
    console.error('Error al obtener chunks:', error.message)
    process.exit(1)
  }

  return data as Chunk[]
}

// --- Generate prompt for Gemini ---
function buildPrompt(chunks: Chunk[], args: CliArgs): string {
  const chunkTexts = chunks
    .map((chunk, i) => `[Chunk ${i + 1}]\n${chunk.content}`)
    .join('\n\n---\n\n')

  const difficultyStr = args.difficulty
    ? `${args.difficulty}`
    : 'genera un mix de dificultades 1, 2, y 3'

  const categoryStr = args.category
    ? args.category
    : 'detecta automaticamente la categoria del contenido (systems, aerodynamics, meteorology, regulations, procedures, performance, navigation, human_factors, emergency)'

  return `Eres un experto en aviacion y educacion. Tu tarea es generar preguntas de quiz basadas en el siguiente contenido tecnico de aviacion.

Genera entre 2 y 3 preguntas de opcion multiple por cada fragmento de texto proporcionado.

REGLAS:
- Cada pregunta debe tener exactamente 4 opciones de respuesta
- Solo una opcion es correcta
- Las opciones incorrectas deben ser plausibles (no obvias)
- La explicacion debe ser clara y educativa
- Las preguntas deben cubrir conceptos tecnicos reales del texto
- Dificultad ${difficultyStr}: 1=conceptos basicos, 2=aplicacion practica, 3=escenarios complejos/analisis
- Categoria: ${categoryStr}
- Idioma: Espanol

FORMATO DE RESPUESTA (JSON estricto):
[
  {
    "content": "La pregunta aqui?",
    "options": ["Opcion A", "Opcion B", "Opcion C", "Opcion D"],
    "correct_index": 0,
    "explanation": "Explicacion de por que la opcion A es correcta...",
    "difficulty": 2,
    "category": "systems"
  }
]

CONTENIDO DE AVIACION:
---
${chunkTexts}
---

Responde SOLO con el JSON, sin texto adicional.`
}

// --- Call Gemini to generate questions ---
async function generateQuestions(
  genAI: GoogleGenerativeAI,
  chunks: Chunk[],
  args: CliArgs
): Promise<GeneratedQuestion[]> {
  const model = genAI.getGenerativeModel({ model: GENERATION_MODEL })
  const prompt = buildPrompt(chunks, args)

  try {
    const result = await model.generateContent(prompt)
    const response = result.response
    let text = response.text()

    // Strip markdown code fences if present
    text = text.trim()
    if (text.startsWith('```json')) {
      text = text.slice(7)
    } else if (text.startsWith('```')) {
      text = text.slice(3)
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3)
    }
    text = text.trim()

    // Parse JSON
    const questions = JSON.parse(text) as GeneratedQuestion[]
    return questions
  } catch (error: any) {
    throw new Error(`Gemini API error: ${error.message || error}`)
  }
}

// --- Validate question ---
function validateQuestion(q: any): q is GeneratedQuestion {
  if (!q || typeof q !== 'object') return false
  if (typeof q.content !== 'string' || q.content.length < 10) return false
  if (!Array.isArray(q.options) || q.options.length !== 4) return false
  if (!q.options.every((opt: any) => typeof opt === 'string' && opt.length > 0)) return false
  if (typeof q.correct_index !== 'number' || q.correct_index < 0 || q.correct_index > 3) return false
  if (typeof q.explanation !== 'string' || q.explanation.length < 10) return false
  if (typeof q.difficulty !== 'number' || q.difficulty < 1 || q.difficulty > 3) return false
  if (typeof q.category !== 'string' || !VALID_CATEGORIES.includes(q.category)) return false
  return true
}

// --- Insert questions into Supabase ---
async function insertQuestions(
  supabaseUrl: string,
  supabaseKey: string,
  questions: QuizQuestion[]
): Promise<number> {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const rows = questions.map((q) => ({
    content: q.content,
    options: q.options,
    correct_index: q.correct_index,
    explanation: q.explanation,
    difficulty: q.difficulty,
    category: q.category,
    aircraft_type: q.aircraft_type,
    source_chunk_id: q.source_chunk_id,
  }))

  const { error, count } = await supabase.from('quiz_questions').insert(rows)

  if (error) {
    throw new Error(`Supabase insert error: ${error.message}`)
  }

  return count || rows.length
}

// --- Main ---
async function main() {
  loadEnv()
  const args = parseArgs()

  // Validate env vars
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!geminiKey) {
    console.error('Falta GOOGLE_GENERATIVE_AI_API_KEY en .env.local')
    process.exit(1)
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
    process.exit(1)
  }

  console.log('\n=== AlexIA - Generador de Preguntas de Quiz ===\n')
  console.log(`Aeronave:    ${args.aircraft}`)
  console.log(`Categoria:   ${args.category || 'auto-detectar'}`)
  console.log(`Dificultad:  ${args.difficulty || 'mix 1-3'}`)
  console.log(`Limite:      ${args.limit} chunks`)
  console.log(`Batch size:  ${args.batchSize} chunks`)
  console.log('')

  // 1. Fetch chunks
  console.log('[1/3] Obteniendo chunks desde Supabase...')
  const chunks = await fetchChunks(supabaseUrl, supabaseServiceKey, args.aircraft, args.limit)
  console.log(`  -> ${chunks.length} chunks obtenidos`)

  if (chunks.length === 0) {
    console.log('\nNo se encontraron chunks para el tipo de aeronave especificado.')
    console.log('Verifica que el manual haya sido procesado primero con process-manual.ts')
    return
  }

  // 2. Generate questions in batches
  console.log('\n[2/3] Generando preguntas con Google Gemini...')
  const genAI = new GoogleGenerativeAI(geminiKey)
  const allQuestions: QuizQuestion[] = []
  const stats: ProcessingStats = {
    chunksProcessed: 0,
    questionsGenerated: 0,
    questionsInserted: 0,
    errors: 0,
    errorDetails: [],
  }

  const totalBatches = Math.ceil(chunks.length / args.batchSize)

  for (let i = 0; i < chunks.length; i += args.batchSize) {
    const batch = chunks.slice(i, i + args.batchSize)
    const batchNum = Math.floor(i / args.batchSize) + 1

    process.stdout.write(`  -> Procesando batch ${batchNum}/${totalBatches} (${batch.length} chunks)...`)

    try {
      const questions = await generateQuestions(genAI, batch, args)

      // Validate and attach metadata
      let validCount = 0
      for (const q of questions) {
        if (validateQuestion(q)) {
          // Assign to first chunk in batch (could be more sophisticated)
          allQuestions.push({
            ...q,
            aircraft_type: args.aircraft,
            source_chunk_id: batch[0].id,
          })
          validCount++
        }
      }

      stats.chunksProcessed += batch.length
      stats.questionsGenerated += validCount
      console.log(` OK (${validCount} preguntas)`)
    } catch (error: any) {
      stats.errors++
      const errorMsg = error.message || String(error)
      stats.errorDetails.push(`Batch ${batchNum}: ${errorMsg}`)
      console.log(` ERROR: ${errorMsg}`)
    }

    // Rate limiting delay
    if (i + args.batchSize < chunks.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
    }
  }

  // 3. Insert questions into database
  if (allQuestions.length > 0) {
    console.log('\n[3/3] Insertando preguntas en Supabase...')
    try {
      const inserted = await insertQuestions(supabaseUrl, supabaseServiceKey, allQuestions)
      stats.questionsInserted = inserted
      console.log(`  -> ${inserted} preguntas insertadas`)
    } catch (error: any) {
      console.error(`  ERROR: ${error.message}`)
      stats.errors++
    }
  } else {
    console.log('\n[3/3] No hay preguntas para insertar')
  }

  // Final summary
  console.log('\n=== Resumen de Generacion ===')
  console.log(`Chunks procesados:     ${stats.chunksProcessed}`)
  console.log(`Preguntas generadas:   ${stats.questionsGenerated}`)
  console.log(`Preguntas insertadas:  ${stats.questionsInserted}`)
  console.log(`Errores:               ${stats.errors}`)

  if (stats.errorDetails.length > 0) {
    console.log('\nDetalles de errores:')
    stats.errorDetails.forEach((err) => console.log(`  - ${err}`))
  }

  console.log('\nLas preguntas generadas ya estan disponibles en la base de datos.')
}

main().catch((err) => {
  console.error('\nError fatal:', err.message || err)
  process.exit(1)
})
