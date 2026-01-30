# Bitacora Digital - Quick Start Guide

## Configuracion Inicial

### 1. Aplicar Migracion de Base de Datos

**Opcion A: Via Supabase CLI**
```bash
cd c:\Users\malia\OneDrive\Documentos\AI\SOFTWARE\2026\SV2\alex-ia
supabase db push
```

**Opcion B: Via Supabase Dashboard**
1. Ir a SQL Editor en Supabase Dashboard
2. Copiar contenido de `supabase/migrations/20260129_create_logbook_tables.sql`
3. Ejecutar

### 2. Verificar Variables de Entorno

Asegurar que `.env.local` tenga:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...
```

### 3. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

## Testing API - Roster Upload

### Via Curl (Windows PowerShell)

```powershell
$file = "C:\path\to\roster.jpg"
$uri = "http://localhost:3000/api/roster"

$form = @{
    file = Get-Item -Path $file
}

$response = Invoke-RestMethod -Uri $uri -Method Post -Form $form
$response | ConvertTo-Json -Depth 10
```

### Via JavaScript Fetch

```javascript
async function uploadRoster(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/roster', {
    method: 'POST',
    body: formData,
  })

  const result = await response.json()
  console.log(result)
  // {
  //   success: true,
  //   uploadId: "uuid",
  //   entriesCount: 30,
  //   data: { month: 1, year: 2026, entries: [...] }
  // }
}

// Uso en componente React
<input
  type="file"
  accept="image/jpeg,image/png,image/webp,application/pdf"
  onChange={(e) => uploadRoster(e.target.files[0])}
/>
```

### Via Thunder Client / Postman

1. Metodo: `POST`
2. URL: `http://localhost:3000/api/roster`
3. Body: `form-data`
4. Key: `file` (type: File)
5. Value: Seleccionar imagen/PDF
6. Headers: Cookie de autenticacion (via login previo)

## Testing Server Actions

### En Componente de Server

```typescript
// app/(main)/bitacora/page.tsx
import { getLogbookEntries, getLogbookStats } from '@/features/bitacora/services/bitacora-actions'

export default async function BitacoraPage() {
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const { data: entries, error } = await getLogbookEntries(currentMonth, currentYear)
  const { data: stats } = await getLogbookStats()

  return (
    <div>
      <h1>Bitacora Digital</h1>

      {stats && (
        <div>
          <p>Total Vuelos: {stats.totalFlights}</p>
          <p>Horas Block: {stats.totalBlockHours.toFixed(1)}</p>
          <p>Horas Vuelo: {stats.totalFlightHours.toFixed(1)}</p>
          <p>Vuelos Nocturnos: {stats.nightFlights}</p>
          <p>Vuelos PF: {stats.pfFlights}</p>
        </div>
      )}

      {entries?.map((entry) => (
        <div key={entry.id}>
          <p>{entry.entry_date} - {entry.activity_type}</p>
          <p>Vuelos: {entry.flights.length}</p>
        </div>
      ))}
    </div>
  )
}
```

### En Componente Cliente (con useTransition)

```typescript
'use client'

import { useState, useTransition } from 'react'
import { createManualLogbookEntry } from '@/features/bitacora/services/bitacora-actions'

export function ManualEntryForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const { data, error } = await createManualLogbookEntry({
        entry_date: formData.get('date') as string,
        activity_type: 'flight',
        check_in: formData.get('check_in') as string,
        flights: [
          {
            origin: formData.get('origin') as string,
            destination: formData.get('dest') as string,
            flight_number: formData.get('flight_num') as string,
            block_hours: parseFloat(formData.get('block') as string),
          }
        ]
      })

      if (error) {
        setError(error)
      } else {
        console.log('Created entry:', data?.id)
      }
    })
  }

  return (
    <form action={handleSubmit}>
      <input name="date" type="date" required />
      <input name="check_in" type="time" />
      <input name="origin" placeholder="MEX" maxLength={3} required />
      <input name="dest" placeholder="CUN" maxLength={3} required />
      <input name="flight_num" placeholder="AM0123" />
      <input name="block" type="number" step="0.1" />

      <button disabled={isPending}>
        {isPending ? 'Guardando...' : 'Crear Entrada'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  )
}
```

## Ejemplo de Roster JSON Esperado

Gemini debe responder con este formato:

```json
{
  "month": 1,
  "year": 2026,
  "entries": [
    {
      "date": "2026-01-15",
      "activity_type": "flight",
      "check_in": "08:00",
      "check_out": "16:30",
      "hotel": "Hampton Inn",
      "notes": null,
      "crew_captain": "Juan Perez",
      "crew_first_officer": "Maria Lopez",
      "crew_purser": "Ana Garcia",
      "flights": [
        {
          "flight_number": "AM0123",
          "aircraft_type": "A320",
          "aircraft_registration": "XA-ABC",
          "origin": "MEX",
          "destination": "CUN",
          "std": "10:00",
          "sta": "13:30",
          "block_hours": 3.5,
          "is_night": false
        },
        {
          "flight_number": "AM0124",
          "aircraft_type": "A320",
          "aircraft_registration": "XA-ABC",
          "origin": "CUN",
          "destination": "MEX",
          "std": "14:30",
          "sta": "17:00",
          "block_hours": 2.5,
          "is_night": false
        }
      ]
    },
    {
      "date": "2026-01-16",
      "activity_type": "off",
      "check_in": null,
      "check_out": null,
      "hotel": null,
      "notes": "Dia libre",
      "crew_captain": null,
      "crew_first_officer": null,
      "crew_purser": null,
      "flights": []
    }
  ]
}
```

## Verificar Base de Datos

### Via Supabase Dashboard

1. Ir a Table Editor
2. Verificar tablas:
   - `roster_uploads`
   - `logbook_entries`
   - `logbook_flights`

### Via SQL Editor

```sql
-- Ver uploads recientes
SELECT * FROM roster_uploads ORDER BY created_at DESC LIMIT 10;

-- Ver entradas del mes
SELECT * FROM logbook_entries
WHERE entry_date >= '2026-01-01' AND entry_date < '2026-02-01'
ORDER BY entry_date;

-- Ver vuelos de una entrada
SELECT * FROM logbook_flights
WHERE entry_id = 'uuid-de-entrada'
ORDER BY sort_order;

-- Ver estadisticas
SELECT * FROM logbook_user_stats;
```

## Troubleshooting

### Error: "No autenticado"
- Asegurar que el usuario esta logueado
- Verificar cookies de sesion de Supabase

### Error: "API key no configurada"
- Verificar `GOOGLE_GENERATIVE_AI_API_KEY` en `.env.local`
- Reiniciar servidor de desarrollo

### Error: "No se pudo interpretar el roster"
- Verificar que la imagen es clara y legible
- Probar con un roster mas simple primero
- Revisar el `raw_response` en `roster_uploads` para ver que respondio Gemini

### Error: "Tipo de archivo no soportado"
- Solo JPG, PNG, WebP, PDF son validos
- Verificar el MIME type del archivo

### Error: "Error guardando archivo"
- Verificar que las tablas existen en Supabase
- Verificar que RLS policies estan habilitadas
- Verificar que el usuario tiene permiso

## Datos de Prueba

Para probar manualmente sin AI:

```typescript
await createManualLogbookEntry({
  entry_date: '2026-01-29',
  activity_type: 'flight',
  check_in: '08:00',
  check_out: '14:00',
  flights: [
    {
      flight_number: 'TEST001',
      aircraft_type: 'A320',
      aircraft_registration: 'XA-TEST',
      origin: 'MEX',
      destination: 'GDL',
      std: '10:00',
      sta: '11:30',
      block_hours: 1.5,
      flight_hours: 1.4,
      is_pf: true,
      is_night: false,
    }
  ]
})
```

## Performance Monitoring

```sql
-- Query performance
EXPLAIN ANALYZE
SELECT e.*, f.*
FROM logbook_entries e
LEFT JOIN logbook_flights f ON f.entry_id = e.id
WHERE e.user_id = 'user-uuid'
AND e.entry_date >= '2026-01-01'
AND e.entry_date < '2026-02-01'
ORDER BY e.entry_date;

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename LIKE 'logbook%'
ORDER BY idx_scan DESC;
```

## Proximos Pasos

1. Crear componentes de UI
2. Implementar vista calendario
3. Agregar formularios de edicion
4. Dashboard de estadisticas con graficas
5. Export a PDF formato DGAC

---

Documentacion completa en: `src/features/bitacora/README.md`
