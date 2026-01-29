# Generador de Preguntas de Quiz - AlexIA

Script CLI para generar preguntas de quiz a partir de chunks de manuales de aviacion procesados, utilizando Google Gemini.

## Requisitos Previos

1. Tener el manual procesado con `process-manual.ts`
2. Variables de entorno configuradas en `.env.local`:
   - `GOOGLE_GENERATIVE_AI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Uso Basico

```bash
# Usando el runner de Node
node scripts/run-quiz-generator.js --aircraft A320

# O directamente con tsx
npx tsx scripts/generate-quiz-questions.ts --aircraft A320
```

## Opciones

### Opciones Obligatorias

- `--aircraft` - Tipo de aeronave (A320, B737, E190, etc.)

### Opciones Opcionales

- `--category` - Categoria especifica de preguntas a generar
  - Valores: `systems`, `aerodynamics`, `meteorology`, `regulations`, `procedures`, `performance`, `navigation`, `human_factors`, `emergency`
  - Si no se especifica, Gemini auto-detecta la categoria del contenido

- `--difficulty` - Nivel de dificultad (1, 2, o 3)
  - 1 = Conceptos basicos
  - 2 = Aplicacion practica
  - 3 = Escenarios complejos/analisis
  - Si no se especifica, genera un mix de las 3 dificultades

- `--limit` - Maximo de chunks a procesar (default: 50)

- `--batch-size` - Chunks por llamada a Gemini (default: 5)

## Ejemplos

### Generar preguntas para A320 (configuracion basica)
```bash
node scripts/run-quiz-generator.js --aircraft A320
```

### Generar solo preguntas de sistemas
```bash
node scripts/run-quiz-generator.js --aircraft A320 --category systems
```

### Generar solo preguntas de nivel basico
```bash
node scripts/run-quiz-generator.js --aircraft A320 --difficulty 1
```

### Generar preguntas de emergencia nivel avanzado
```bash
node scripts/run-quiz-generator.js --aircraft A320 --category emergency --difficulty 3
```

### Procesar solo 20 chunks en batches de 3
```bash
node scripts/run-quiz-generator.js --aircraft A320 --limit 20 --batch-size 3
```

## Flujo de Trabajo

1. **Fetch chunks** - Obtiene chunks aleatorios de `aviation_manual_chunks` filtrados por `aircraft_type`

2. **Generate questions** - Por cada batch de chunks:
   - Construye un prompt para Gemini
   - Llama a `gemini-2.0-flash-exp`
   - Parsea la respuesta JSON
   - Valida cada pregunta generada
   - Espera 1 segundo entre batches (rate limiting)

3. **Insert into DB** - Inserta preguntas validas en `quiz_questions`

4. **Summary** - Muestra estadisticas:
   - Chunks procesados
   - Preguntas generadas
   - Preguntas insertadas
   - Errores encontrados

## Estructura de Preguntas Generadas

Cada pregunta tiene:

```typescript
{
  content: string           // El texto de la pregunta
  options: string[]         // Array de 4 opciones
  correct_index: number     // Indice de la opcion correcta (0-3)
  explanation: string       // Explicacion de por que es correcta
  difficulty: number        // 1, 2, o 3
  category: string          // Categoria de la pregunta
  aircraft_type: string     // Tipo de aeronave (del CLI)
  source_chunk_id: number   // ID del chunk fuente
}
```

## Categorias Disponibles

- `systems` - Sistemas de la aeronave
- `aerodynamics` - Aerodinamica y vuelo
- `meteorology` - Meteorologia aeronautica
- `regulations` - Regulaciones y normativas
- `procedures` - Procedimientos operacionales
- `performance` - Performance de la aeronave
- `navigation` - Navegacion aerea
- `human_factors` - Factores humanos
- `emergency` - Procedimientos de emergencia

## Validaciones

Cada pregunta generada se valida antes de insertar:

- Contenido de al menos 10 caracteres
- Exactamente 4 opciones
- Indice correcto entre 0-3
- Explicacion de al menos 10 caracteres
- Dificultad entre 1-3
- Categoria valida

## Manejo de Errores

- Si un batch falla, el script continua con el siguiente
- Los errores se registran y se muestran en el resumen final
- Preguntas invalidas se descartan automaticamente

## Esquema de Base de Datos

### Tabla: `quiz_questions`

```sql
CREATE TABLE quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  options jsonb NOT NULL,
  correct_index smallint NOT NULL,
  explanation text NOT NULL,
  difficulty smallint NOT NULL,
  category text NOT NULL,
  aircraft_type text NOT NULL,
  source_chunk_id bigint REFERENCES aviation_manual_chunks(id),
  created_at timestamp DEFAULT now()
);
```

## Troubleshooting

### Error: "No se encontraron chunks"
- Verifica que el manual haya sido procesado con `process-manual.ts`
- Confirma que el `aircraft_type` coincide exactamente

### Error: "Gemini API error"
- Verifica que `GOOGLE_GENERATIVE_AI_API_KEY` sea valida
- Reduce `--batch-size` si hay timeouts
- Aumenta el delay si hay rate limiting

### Preguntas de baja calidad
- Usa `--difficulty` especifico para mejor control
- Especifica `--category` para enfoque tematico
- Revisa la calidad de los chunks fuente

## Best Practices

1. **Start small** - Prueba con `--limit 10` primero
2. **Batch size** - 5 chunks por batch es optimo para balance calidad/velocidad
3. **Review first** - Revisa las primeras preguntas generadas antes de procesar todo
4. **Category specific** - Mejor especificar categoria que auto-detectar
5. **Mix difficulties** - No especificar dificultad genera variedad natural

## Integracion con AlexIA

Las preguntas generadas estan disponibles inmediatamente para:
- Modos de estudio en la app
- Examenes de practica
- Sistema de aprendizaje adaptativo
- Estadisticas de progreso del estudiante
