'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface LogbookEntry {
  id: string
  entry_date: string
  activity_type: string
  check_in: string | null
  check_out: string | null
  hotel: string | null
  notes: string | null
  crew_captain: string | null
  crew_first_officer: string | null
  crew_purser: string | null
  flights: LogbookFlight[]
}

interface LogbookFlight {
  id: string
  flight_number: string | null
  aircraft_type: string | null
  aircraft_registration: string | null
  origin: string
  destination: string
  std: string | null
  sta: string | null
  block_off: string | null
  block_on: string | null
  block_hours: number | null
  flight_hours: number | null
  is_pf: boolean
  is_night: boolean
  is_cat_ii_iii: boolean
  approach_type: string | null
  remarks: string | null
}

interface RosterUpload {
  id: string
  file_name: string
  file_type: string
  status: string
  month: number
  year: number
  error_message: string | null
  created_at: string
}

export async function getLogbookEntries(
  month: number,
  year: number
): Promise<{ data: LogbookEntry[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: [], error: 'No autenticado' }

  // Get entries for the month
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`

  const { data: entries, error } = await supabase
    .from('logbook_entries')
    .select('id, entry_date, activity_type, check_in, check_out, hotel, notes, crew_captain, crew_first_officer, crew_purser')
    .eq('user_id', user.id)
    .gte('entry_date', startDate)
    .lt('entry_date', endDate)
    .order('entry_date', { ascending: true })

  if (error) return { data: [], error: error.message }

  // Get flights for each entry
  const entriesWithFlights: LogbookEntry[] = await Promise.all(
    (entries || []).map(async (entry) => {
      const { data: flights } = await supabase
        .from('logbook_flights')
        .select('*')
        .eq('entry_id', entry.id)
        .order('sort_order', { ascending: true })

      return {
        ...entry,
        flights: (flights || []) as LogbookFlight[],
      }
    })
  )

  return { data: entriesWithFlights, error: null }
}

export async function getRosterUploads(): Promise<{ data: RosterUpload[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: [], error: 'No autenticado' }

  const { data, error } = await supabase
    .from('roster_uploads')
    .select('id, file_name, file_type, status, month, year, error_message, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) return { data: [], error: error.message }
  return { data: data as RosterUpload[], error: null }
}

export async function updateLogbookEntry(
  entryId: string,
  updates: Partial<Pick<LogbookEntry, 'activity_type' | 'check_in' | 'check_out' | 'hotel' | 'notes' | 'crew_captain' | 'crew_first_officer' | 'crew_purser'>>
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('logbook_entries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', entryId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/bitacora')
  return { error: null }
}

export async function deleteLogbookEntry(entryId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('logbook_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/bitacora')
  return { error: null }
}

export async function updateLogbookFlight(
  flightId: string,
  updates: Partial<Pick<LogbookFlight, 'flight_number' | 'aircraft_type' | 'aircraft_registration' | 'origin' | 'destination' | 'std' | 'sta' | 'block_off' | 'block_on' | 'block_hours' | 'flight_hours' | 'is_pf' | 'is_night' | 'is_cat_ii_iii' | 'approach_type' | 'remarks'>>
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  // Verify user owns this flight entry
  const { data: flight } = await supabase
    .from('logbook_flights')
    .select('entry_id')
    .eq('id', flightId)
    .single()

  if (!flight) return { error: 'Vuelo no encontrado' }

  const { data: entry } = await supabase
    .from('logbook_entries')
    .select('user_id')
    .eq('id', flight.entry_id)
    .single()

  if (!entry || entry.user_id !== user.id) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('logbook_flights')
    .update(updates)
    .eq('id', flightId)

  if (error) return { error: error.message }

  revalidatePath('/bitacora')
  return { error: null }
}

export async function getLogbookStats(userId?: string): Promise<{
  data: {
    totalFlights: number
    totalBlockHours: number
    totalFlightHours: number
    nightFlights: number
    pfFlights: number
  } | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: null, error: 'No autenticado' }

  const targetUserId = userId || user.id

  // Get all flights for user
  const { data: entries } = await supabase
    .from('logbook_entries')
    .select('id')
    .eq('user_id', targetUserId)

  if (!entries || entries.length === 0) {
    return {
      data: {
        totalFlights: 0,
        totalBlockHours: 0,
        totalFlightHours: 0,
        nightFlights: 0,
        pfFlights: 0,
      },
      error: null,
    }
  }

  const entryIds = entries.map((e) => e.id)

  const { data: flights, error } = await supabase
    .from('logbook_flights')
    .select('block_hours, flight_hours, is_night, is_pf')
    .in('entry_id', entryIds)

  if (error) return { data: null, error: error.message }

  const stats = (flights || []).reduce(
    (acc, flight) => ({
      totalFlights: acc.totalFlights + 1,
      totalBlockHours: acc.totalBlockHours + (flight.block_hours || 0),
      totalFlightHours: acc.totalFlightHours + (flight.flight_hours || 0),
      nightFlights: acc.nightFlights + (flight.is_night ? 1 : 0),
      pfFlights: acc.pfFlights + (flight.is_pf ? 1 : 0),
    }),
    {
      totalFlights: 0,
      totalBlockHours: 0,
      totalFlightHours: 0,
      nightFlights: 0,
      pfFlights: 0,
    }
  )

  return { data: stats, error: null }
}

export async function getMonthlyStats(
  month: number,
  year: number
): Promise<{
  data: {
    totalFlights: number
    totalBlockHours: number
    totalFlightHours: number
    totalDutyHours: number
    nightFlights: number
    pfFlights: number
  } | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: null, error: 'No autenticado' }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`

  const { data: entries } = await supabase
    .from('logbook_entries')
    .select('id, check_in, check_out')
    .eq('user_id', user.id)
    .gte('entry_date', startDate)
    .lt('entry_date', endDate)

  if (!entries || entries.length === 0) {
    return {
      data: { totalFlights: 0, totalBlockHours: 0, totalFlightHours: 0, totalDutyHours: 0, nightFlights: 0, pfFlights: 0 },
      error: null,
    }
  }

  // Calculate duty hours from check_in/check_out
  let totalDutyMinutes = 0
  for (const entry of entries) {
    if (entry.check_in && entry.check_out) {
      const [ciH, ciM] = entry.check_in.split(':').map(Number)
      const [coH, coM] = entry.check_out.split(':').map(Number)
      let dutyMin = (coH * 60 + coM) - (ciH * 60 + ciM)
      if (dutyMin < 0) dutyMin += 24 * 60 // overnight
      totalDutyMinutes += dutyMin
    }
  }

  const entryIds = entries.map((e) => e.id)

  const { data: flights } = await supabase
    .from('logbook_flights')
    .select('block_hours, flight_hours, is_night, is_pf')
    .in('entry_id', entryIds)

  const flightStats = (flights || []).reduce(
    (acc, f) => ({
      totalFlights: acc.totalFlights + 1,
      totalBlockHours: acc.totalBlockHours + (f.block_hours || 0),
      totalFlightHours: acc.totalFlightHours + (f.flight_hours || 0),
      nightFlights: acc.nightFlights + (f.is_night ? 1 : 0),
      pfFlights: acc.pfFlights + (f.is_pf ? 1 : 0),
    }),
    { totalFlights: 0, totalBlockHours: 0, totalFlightHours: 0, nightFlights: 0, pfFlights: 0 }
  )

  return {
    data: {
      ...flightStats,
      totalDutyHours: Math.round((totalDutyMinutes / 60) * 100) / 100,
    },
    error: null,
  }
}

export async function createManualLogbookEntry(data: {
  entry_date: string
  activity_type: 'flight' | 'sim' | 'ground' | 'standby' | 'off' | 'vacation' | 'training' | 'medical' | 'other'
  check_in?: string
  check_out?: string
  hotel?: string
  notes?: string
  crew_captain?: string
  crew_first_officer?: string
  crew_purser?: string
  flights?: Array<{
    flight_number?: string
    aircraft_type?: string
    aircraft_registration?: string
    origin: string
    destination: string
    std?: string
    sta?: string
    block_off?: string
    block_on?: string
    block_hours?: number
    flight_hours?: number
    is_pf?: boolean
    is_night?: boolean
    is_cat_ii_iii?: boolean
    approach_type?: string
    remarks?: string
  }>
}): Promise<{ data: { id: string } | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: null, error: 'No autenticado' }

  // Insert logbook entry
  const { data: entry, error: entryError } = await supabase
    .from('logbook_entries')
    .insert({
      user_id: user.id,
      entry_date: data.entry_date,
      activity_type: data.activity_type,
      check_in: data.check_in || null,
      check_out: data.check_out || null,
      hotel: data.hotel || null,
      notes: data.notes || null,
      crew_captain: data.crew_captain || null,
      crew_first_officer: data.crew_first_officer || null,
      crew_purser: data.crew_purser || null,
    })
    .select('id')
    .single()

  if (entryError) return { data: null, error: entryError.message }

  // Insert flights if provided
  if (data.flights && data.flights.length > 0) {
    const flightsToInsert = data.flights.map((flight, index) => ({
      entry_id: entry.id,
      flight_number: flight.flight_number || null,
      aircraft_type: flight.aircraft_type || null,
      aircraft_registration: flight.aircraft_registration || null,
      origin: flight.origin,
      destination: flight.destination,
      std: flight.std || null,
      sta: flight.sta || null,
      block_off: flight.block_off || null,
      block_on: flight.block_on || null,
      block_hours: flight.block_hours || null,
      flight_hours: flight.flight_hours || null,
      is_pf: flight.is_pf || false,
      is_night: flight.is_night || false,
      is_cat_ii_iii: flight.is_cat_ii_iii || false,
      approach_type: flight.approach_type || null,
      remarks: flight.remarks || null,
      sort_order: index,
    }))

    const { error: flightsError } = await supabase
      .from('logbook_flights')
      .insert(flightsToInsert)

    if (flightsError) {
      // Rollback entry
      await supabase.from('logbook_entries').delete().eq('id', entry.id)
      return { data: null, error: flightsError.message }
    }
  }

  revalidatePath('/bitacora')
  return { data: { id: entry.id }, error: null }
}

export interface YearlyMonthStats {
  month: number
  flightCount: number
  blockHours: number
  flightHours: number
  dutyHours: number
  nightFlights: number
  pfFlights: number
}

export async function getYearlyStats(year: number): Promise<{
  data: YearlyMonthStats[] | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: null, error: 'No autenticado' }

  const startDate = `${year}-01-01`
  const endDate = `${year + 1}-01-01`

  const { data: entries } = await supabase
    .from('logbook_entries')
    .select('id, entry_date, check_in, check_out')
    .eq('user_id', user.id)
    .gte('entry_date', startDate)
    .lt('entry_date', endDate)

  if (!entries || entries.length === 0) {
    return { data: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, flightCount: 0, blockHours: 0, flightHours: 0, dutyHours: 0, nightFlights: 0, pfFlights: 0 })), error: null }
  }

  // Group entries by month
  const entryIdsByMonth = new Map<number, string[]>()
  const dutyMinutesByMonth = new Map<number, number>()

  for (const entry of entries) {
    const m = parseInt(entry.entry_date.split('-')[1], 10)
    if (!entryIdsByMonth.has(m)) entryIdsByMonth.set(m, [])
    entryIdsByMonth.get(m)!.push(entry.id)

    if (entry.check_in && entry.check_out) {
      const [ciH, ciM] = entry.check_in.split(':').map(Number)
      const [coH, coM] = entry.check_out.split(':').map(Number)
      let dutyMin = (coH * 60 + coM) - (ciH * 60 + ciM)
      if (dutyMin < 0) dutyMin += 24 * 60
      dutyMinutesByMonth.set(m, (dutyMinutesByMonth.get(m) || 0) + dutyMin)
    }
  }

  const allEntryIds = entries.map((e) => e.id)
  const { data: flights } = await supabase
    .from('logbook_flights')
    .select('entry_id, block_hours, flight_hours, is_night, is_pf')
    .in('entry_id', allEntryIds)

  // Map flights to months via entry_id
  const entryToMonth = new Map<string, number>()
  for (const entry of entries) {
    entryToMonth.set(entry.id, parseInt(entry.entry_date.split('-')[1], 10))
  }

  const monthStats = new Map<number, { flightCount: number; blockHours: number; flightHours: number; nightFlights: number; pfFlights: number }>()

  for (const f of flights || []) {
    const m = entryToMonth.get(f.entry_id)
    if (!m) continue
    const s = monthStats.get(m) || { flightCount: 0, blockHours: 0, flightHours: 0, nightFlights: 0, pfFlights: 0 }
    s.flightCount += 1
    s.blockHours += f.block_hours || 0
    s.flightHours += f.flight_hours || 0
    s.nightFlights += f.is_night ? 1 : 0
    s.pfFlights += f.is_pf ? 1 : 0
    monthStats.set(m, s)
  }

  const result: YearlyMonthStats[] = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const s = monthStats.get(m)
    return {
      month: m,
      flightCount: s?.flightCount ?? 0,
      blockHours: Math.round((s?.blockHours ?? 0) * 100) / 100,
      flightHours: Math.round((s?.flightHours ?? 0) * 100) / 100,
      dutyHours: Math.round(((dutyMinutesByMonth.get(m) || 0) / 60) * 100) / 100,
      nightFlights: s?.nightFlights ?? 0,
      pfFlights: s?.pfFlights ?? 0,
    }
  })

  return { data: result, error: null }
}
