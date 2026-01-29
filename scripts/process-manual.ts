/**
 * Script CLI para procesar manuales de aviacion en PDF
 *
 * Uso:
 *   npx tsx scripts/process-manual.ts --file ./manual.pdf --type FCOM --aircraft A320
 *
 * Opciones:
 *   --file        Ruta al archivo PDF (obligatorio)
 *   --type        Tipo de manual: FCOM, QRH, MEL, SOP, AOM, TRAINING (obligatorio)
 *   --aircraft    Tipo de aeronave: A320, B737, E190, etc. (opcional)
 *   --chunk-size  Tamano de cada chunk en caracteres (default: 1000)
 *   --overlap     Caracteres de overlap entre chunks (default: 200)
 *   --dry-run     Solo muestra stats sin insertar en DB
 *
 * Requiere:
 *   - GOOGLE_GENERATIVE_AI_API_KEY en .env.local
 *   - NEXT_PUBLIC_SUPABASE_URL en .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY en .env.local (acceso admin, no anon)
 */

import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

// pdf-parse v1 is CJS-only, so we use createRequire
const require = createRequire(import.meta.url)
const pdf: (buffer: Buffer) => Promise<{ text: string; numpages: number }> = require('pdf-parse')

// --- Config ---
const EMBEDDING_MODEL = 'text-embedding-004'
const BATCH_SIZE = 50 // Embeddings por batch (API limit friendly)
const INSERT_BATCH = 20 // Rows por insert a Supabase

// --- Parse CLI args ---
interface CliArgs {
  file: string
  type: string
  aircraft?: string
  chunkSize: number
  overlap: number
  dryRun: boolean
}

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

  if (!map.file || !map.type) {
    console.error('\nUso: npx tsx scripts/process-manual.ts --file ./manual.pdf --type FCOM [--aircraft A320]\n')
    console.error('Opciones:')
    console.error('  --file        Ruta al PDF (obligatorio)')
    console.error('  --type        Tipo: FCOM, QRH, MEL, SOP, AOM, TRAINING (obligatorio)')
    console.error('  --aircraft    Aeronave: A320, B737, E190, etc. (opcional)')
    console.error('  --chunk-size  Tamano chunk en chars (default: 1000)')
    console.error('  --overlap     Overlap entre chunks (default: 200)')
    console.error('  --dry-run     Solo mostrar stats, no insertar')
    process.exit(1)
  }

  const validTypes = ['FCOM', 'QRH', 'MEL', 'SOP', 'AOM', 'TRAINING']
  if (!validTypes.includes(map.type.toUpperCase())) {
    console.error(`Tipo invalido: ${map.type}. Usa: ${validTypes.join(', ')}`)
    process.exit(1)
  }

  return {
    file: map.file,
    type: map.type.toUpperCase(),
    aircraft: map.aircraft,
    chunkSize: parseInt(map['chunk-size'] || '1000', 10),
    overlap: parseInt(map.overlap || '200', 10),
    dryRun: map['dry-run'] === 'true',
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

// --- PDF extraction ---
async function extractText(filePath: string): Promise<{ text: string; pages: number }> {
  const absolutePath = path.resolve(filePath)
  if (!fs.existsSync(absolutePath)) {
    console.error(`Archivo no encontrado: ${absolutePath}`)
    process.exit(1)
  }

  const buffer = fs.readFileSync(absolutePath)
  const data = await pdf(buffer)
  return { text: data.text, pages: data.numpages }
}

// --- Chunking ---
interface Chunk {
  content: string
  index: number
  pageEstimate: number
}

function cleanText(text: string): string {
  // Memory-efficient cleaning: process in blocks instead of single regex on huge string
  const lines = text.split('\n')
  const result: string[] = []
  let emptyCount = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length === 0) {
      emptyCount++
      if (emptyCount <= 2) result.push('')
    } else {
      emptyCount = 0
      result.push(trimmed)
    }
  }

  return result.join('\n').trim()
}

function chunkText(text: string, chunkSize: number, overlap: number, totalPages: number): Chunk[] {
  const chunks: Chunk[] = []
  const cleaned = cleanText(text)
  const totalLength = cleaned.length

  let start = 0
  let index = 0

  while (start < totalLength) {
    let end = Math.min(start + chunkSize, totalLength)

    // Try to break at a paragraph or sentence boundary
    if (end < totalLength) {
      const searchEnd = Math.min(end + 100, totalLength)
      const slice = cleaned.slice(start, searchEnd)
      const minBreak = Math.floor(chunkSize * 0.7)
      const paragraphBreak = slice.lastIndexOf('\n\n')
      const sentenceBreak = slice.lastIndexOf('. ')

      if (paragraphBreak > minBreak) {
        end = start + paragraphBreak + 2
      } else if (sentenceBreak > minBreak) {
        end = start + sentenceBreak + 2
      }
    }

    end = Math.min(end, totalLength)
    const content = cleaned.slice(start, end).trim()

    if (content.length > 50) {
      const pageEstimate = Math.ceil((start / totalLength) * totalPages) || 1
      chunks.push({ content, index, pageEstimate })
      index++
    }

    // Ensure forward progress
    const nextStart = end - overlap
    start = nextStart <= start ? start + chunkSize : nextStart
    if (start >= totalLength) break
  }

  return chunks
}

// --- Detect sections ---
function detectSection(content: string): string | null {
  // Common aviation manual section patterns
  const patterns = [
    /^(?:CHAPTER|CAPITULO)\s+(\d+[\.\d]*\s*[-:]?\s*.+)/im,
    /^(\d+\.\d+[\.\d]*)\s+(.+)/m,
    /^(?:SECTION|SECCION)\s+(\w+[\.\d]*\s*[-:]?\s*.+)/im,
    /^((?:NORMAL|ABNORMAL|EMERGENCY)\s+PROCEDURES)/im,
    /^(LIMITATIONS|PERFORMANCE|SYSTEMS)/im,
  ]

  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match) {
      return match[1].trim().slice(0, 100)
    }
  }

  return null
}

// --- Generate embeddings in batches ---
async function generateEmbeddingsBatch(
  texts: string[],
  genAI: GoogleGenerativeAI
): Promise<number[][]> {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL })

  const result = await model.batchEmbedContents({
    requests: texts.map((text) => ({
      content: { parts: [{ text }], role: 'user' },
    })),
  })

  return result.embeddings.map((e) => e.values)
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

  if (!args.dryRun && (!supabaseUrl || !supabaseServiceKey)) {
    console.error('Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
    console.error('(SUPABASE_SERVICE_ROLE_KEY es la key de servicio, no la anon key)')
    process.exit(1)
  }

  console.log('\n=== AlexIA - Procesador de Manuales ===\n')
  console.log(`Archivo:    ${args.file}`)
  console.log(`Tipo:       ${args.type}`)
  console.log(`Aeronave:   ${args.aircraft || 'general'}`)
  console.log(`Chunk size: ${args.chunkSize} chars`)
  console.log(`Overlap:    ${args.overlap} chars`)
  console.log(`Dry run:    ${args.dryRun}`)
  console.log('')

  // 1. Extract text from PDF
  console.log('[1/4] Extrayendo texto del PDF...')
  const { text, pages } = await extractText(args.file)
  console.log(`  -> ${pages} paginas, ${text.length.toLocaleString()} caracteres extraidos`)

  if (text.length < 100) {
    console.error('El PDF no contiene texto extraible. Podria ser un PDF escaneado (imagen).')
    console.error('Para PDFs escaneados, necesitas OCR primero (ej: Adobe Acrobat, Tesseract).')
    process.exit(1)
  }

  // 2. Chunk the text
  console.log('\n[2/4] Dividiendo en chunks...')
  const chunks = chunkText(text, args.chunkSize, args.overlap, pages)
  console.log(`  -> ${chunks.length} chunks generados`)

  // Detect sections
  let sectionsFound = 0
  const chunksWithMeta = chunks.map((chunk) => {
    const section = detectSection(chunk.content)
    if (section) sectionsFound++
    return {
      ...chunk,
      section,
      metadata: {
        manualType: args.type,
        aircraftType: args.aircraft || null,
        section: section || null,
        pageNumber: chunk.pageEstimate,
        chunkIndex: chunk.index,
        sourceFile: path.basename(args.file),
      },
    }
  })
  console.log(`  -> ${sectionsFound} secciones detectadas automaticamente`)

  // Dry run stats
  if (args.dryRun) {
    console.log('\n=== DRY RUN - Stats ===')
    console.log(`Total chunks:     ${chunks.length}`)
    console.log(`Avg chunk size:   ${Math.round(chunks.reduce((a, c) => a + c.content.length, 0) / chunks.length)} chars`)
    console.log(`Min chunk size:   ${Math.min(...chunks.map((c) => c.content.length))} chars`)
    console.log(`Max chunk size:   ${Math.max(...chunks.map((c) => c.content.length))} chars`)
    console.log(`Secciones:        ${sectionsFound}`)
    console.log(`Embedding calls:  ${Math.ceil(chunks.length / BATCH_SIZE)} batches`)
    console.log(`DB inserts:       ${Math.ceil(chunks.length / INSERT_BATCH)} batches`)
    console.log('\nPrimeros 3 chunks:')
    chunksWithMeta.slice(0, 3).forEach((c, i) => {
      console.log(`\n--- Chunk ${i} (pag ~${c.pageEstimate}, seccion: ${c.section || 'N/A'}) ---`)
      console.log(c.content.slice(0, 200) + '...')
    })
    console.log('\nPara insertar en la base de datos, ejecuta sin --dry-run')
    return
  }

  // 3. Generate embeddings
  console.log('\n[3/4] Generando embeddings con Google Gemini...')
  const genAI = new GoogleGenerativeAI(geminiKey)
  const allEmbeddings: number[][] = []

  const totalBatches = Math.ceil(chunksWithMeta.length / BATCH_SIZE)
  for (let i = 0; i < chunksWithMeta.length; i += BATCH_SIZE) {
    const batch = chunksWithMeta.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1

    process.stdout.write(`  -> Batch ${batchNum}/${totalBatches} (${batch.length} chunks)...`)
    const embeddings = await generateEmbeddingsBatch(
      batch.map((c) => c.content),
      genAI
    )
    allEmbeddings.push(...embeddings)
    console.log(' OK')

    // Rate limit: small delay between batches
    if (i + BATCH_SIZE < chunksWithMeta.length) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  console.log(`  -> ${allEmbeddings.length} embeddings generados (768 dim)`)

  // 4. Insert into Supabase
  console.log('\n[4/4] Insertando en Supabase...')
  const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

  let inserted = 0
  const totalInsertBatches = Math.ceil(chunksWithMeta.length / INSERT_BATCH)

  for (let i = 0; i < chunksWithMeta.length; i += INSERT_BATCH) {
    const batch = chunksWithMeta.slice(i, i + INSERT_BATCH)
    const batchNum = Math.floor(i / INSERT_BATCH) + 1

    const rows = batch.map((chunk, j) => ({
      content: chunk.content,
      embedding: JSON.stringify(allEmbeddings[i + j]),
      metadata: chunk.metadata,
      source_file: path.basename(args.file),
      is_active: true,
    }))

    process.stdout.write(`  -> Insert batch ${batchNum}/${totalInsertBatches}...`)
    const { error } = await supabase.from('aviation_manual_chunks').insert(rows)

    if (error) {
      console.error(`\n  ERROR en batch ${batchNum}:`, error.message)
      process.exit(1)
    }

    inserted += batch.length
    console.log(` OK (${inserted}/${chunksWithMeta.length})`)
  }

  console.log('\n=== Procesamiento completo ===')
  console.log(`Manual:     ${path.basename(args.file)}`)
  console.log(`Tipo:       ${args.type}`)
  console.log(`Aeronave:   ${args.aircraft || 'general'}`)
  console.log(`Chunks:     ${inserted}`)
  console.log(`Paginas:    ${pages}`)
  console.log('\nEl manual ya esta disponible para consultas en AlexIA.')
}

main().catch((err) => {
  console.error('\nError fatal:', err.message || err)
  process.exit(1)
})
