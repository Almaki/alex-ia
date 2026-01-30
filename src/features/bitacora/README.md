# Bitacora Digital (Digital Logbook)

Feature para gestion de bitacora de vuelo digital para pilotos.

## Descripcion

La Bitacora Digital permite a los pilotos:
- Subir rosters en imagen/PDF y extraer automaticamente la informacion con Gemini Vision
- Llevar un registro detallado de vuelos, simuladores y otras actividades
- Ver estadisticas de horas de vuelo, vuelos nocturnos, etc.
- Editar manualmente entradas para corregir o agregar detalles

## Arquitectura

### Backend

#### API Routes
- `POST /api/roster` - Sube y procesa un roster con Gemini Vision

#### Server Actions (`services/bitacora-actions.ts`)
- `getLogbookEntries(month, year)` - Obtiene entradas de bitacora por mes
- `getRosterUploads()` - Lista ultimos rosters subidos
- `updateLogbookEntry(entryId, updates)` - Actualiza una entrada
- `deleteLogbookEntry(entryId)` - Elimina una entrada
- `updateLogbookFlight(flightId, updates)` - Actualiza un vuelo
- `getLogbookStats(userId?)` - Obtiene estadisticas totales
- `createManualLogbookEntry(data)` - Crea entrada manual

### Database Schema

#### Tables

**roster_uploads**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `file_name` (TEXT)
- `file_type` ('image' | 'pdf')
- `status` ('processing' | 'completed' | 'failed')
- `month` (INTEGER 1-12)
- `year` (INTEGER)
- `error_message` (TEXT, nullable)
- `raw_response` (JSONB, nullable)
- `created_at` (TIMESTAMPTZ)

**logbook_entries**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `roster_upload_id` (UUID, FK → roster_uploads, nullable)
- `entry_date` (DATE)
- `activity_type` (activity_type ENUM)
- `check_in` (TIME, nullable)
- `check_out` (TIME, nullable)
- `hotel` (TEXT, nullable)
- `notes` (TEXT, nullable)
- `crew_captain` (TEXT, nullable)
- `crew_first_officer` (TEXT, nullable)
- `crew_purser` (TEXT, nullable)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- UNIQUE constraint on (user_id, entry_date)

**logbook_flights**
- `id` (UUID, PK)
- `entry_id` (UUID, FK → logbook_entries)
- `flight_number` (TEXT, nullable)
- `aircraft_type` (TEXT, nullable)
- `aircraft_registration` (TEXT, nullable)
- `origin` (TEXT, IATA code)
- `destination` (TEXT, IATA code)
- `std` (TIME, nullable)
- `sta` (TIME, nullable)
- `block_off` (TIME, nullable)
- `block_on` (TIME, nullable)
- `block_hours` (NUMERIC, nullable)
- `flight_hours` (NUMERIC, nullable)
- `is_pf` (BOOLEAN, Pilot Flying)
- `is_night` (BOOLEAN)
- `is_cat_ii_iii` (BOOLEAN)
- `approach_type` (TEXT, nullable)
- `remarks` (TEXT, nullable)
- `sort_order` (INTEGER, para multiples vuelos en un dia)
- `created_at` (TIMESTAMPTZ)

#### Activity Types
- `flight` - Vuelo comercial
- `sim` - Sesion de simulador
- `ground` - Actividad en tierra
- `standby` - Standby/guardia
- `off` - Dia libre
- `vacation` - Vacaciones
- `training` - Entrenamiento/recurrente
- `medical` - Cita medica
- `other` - Otro

### Flujo de Roster Upload

1. Usuario sube imagen/PDF del roster
2. API `/api/roster` recibe archivo
3. Convierte a base64
4. Crea registro en `roster_uploads` con status 'processing'
5. Llama a Gemini Vision con system prompt especializado
6. Gemini responde con JSON estructurado
7. Se parsea JSON y valida
8. Se crean/actualizan entradas en `logbook_entries` y `logbook_flights`
9. Se actualiza `roster_uploads` con status 'completed' o 'failed'
10. Retorna resultado al frontend

### Security

**Row Level Security (RLS)**
- Todos los usuarios solo pueden ver/editar sus propias entradas
- Las policies aseguran que los vuelos solo se accedan via entries del usuario
- Constraint UNIQUE evita duplicados de fecha por usuario

### Gemini Vision System Prompt

El prompt en `api/roster/system-prompt.ts` esta especializado para:
- Reconocer codigos comunes de rosters de aerolineas
- Interpretar columnas estandar (C/I, STD, STA, etc.)
- Extraer informacion de tripulacion
- Manejar multiples vuelos por dia
- Inferir mes/ano del roster
- Devolver JSON estrictamente tipado

### Performance Optimizations

**Indexes creados:**
- `roster_uploads`: user_id, status, (month, year)
- `logbook_entries`: user_id, entry_date, (user_id, entry_date), activity_type
- `logbook_flights`: entry_id, aircraft_type, origin, destination

**View materializada:**
- `logbook_user_stats` - Estadisticas pre-calculadas por usuario

## Uso

### Subir Roster

```typescript
const formData = new FormData()
formData.append('file', file) // File object

const response = await fetch('/api/roster', {
  method: 'POST',
  body: formData,
})

const result = await response.json()
// { success: true, uploadId: '...', entriesCount: 30, data: {...} }
```

### Obtener Entradas del Mes

```typescript
import { getLogbookEntries } from '@/features/bitacora/services/bitacora-actions'

const { data, error } = await getLogbookEntries(1, 2026) // Enero 2026
```

### Crear Entrada Manual

```typescript
import { createManualLogbookEntry } from '@/features/bitacora/services/bitacora-actions'

const { data, error } = await createManualLogbookEntry({
  entry_date: '2026-01-29',
  activity_type: 'flight',
  check_in: '08:00',
  check_out: '16:30',
  flights: [
    {
      flight_number: 'AM0123',
      aircraft_type: 'A320',
      aircraft_registration: 'XA-ABC',
      origin: 'MEX',
      destination: 'CUN',
      std: '10:00',
      sta: '13:30',
      block_hours: 3.5,
      is_pf: true,
      is_night: false,
    }
  ]
})
```

### Obtener Estadisticas

```typescript
import { getLogbookStats } from '@/features/bitacora/services/bitacora-actions'

const { data, error } = await getLogbookStats()
// { totalFlights: 245, totalBlockHours: 856.5, totalFlightHours: 820.2, ... }
```

## TODO

- [ ] Frontend components para UI de bitacora
- [ ] Export a PDF (formato DGAC Mexico)
- [ ] Validacion de limites regulatorios (duty time, flight time)
- [ ] Integracion con backend para auto-backup
- [ ] Sincronizacion offline
- [ ] Graficas de tendencias (horas por mes, etc.)
