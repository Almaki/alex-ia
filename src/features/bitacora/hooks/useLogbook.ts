'use client'

import { useState, useEffect, useCallback } from 'react'
import { getLogbookEntries, getRosterUploads, getMonthlyStats, getYearlyStats, updateLogbookFlight } from '../services/bitacora-actions'
import type { YearlyMonthStats } from '../services/bitacora-actions'

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

interface RosterUpload {
  id: string
  file_name: string
  status: string
  created_at: string
}

interface MonthlyStats {
  totalFlights: number
  totalBlockHours: number
  totalFlightHours: number
  totalDutyHours: number
  nightFlights: number
  pfFlights: number
}

export function useLogbook() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [entries, setEntries] = useState<LogbookEntry[]>([])
  const [uploads, setUploads] = useState<RosterUpload[]>([])
  const [stats, setStats] = useState<MonthlyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [yearlyCurrentData, setYearlyCurrentData] = useState<YearlyMonthStats[]>([])
  const [yearlyPreviousData, setYearlyPreviousData] = useState<YearlyMonthStats[]>([])
  const [yearlyLoading, setYearlyLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [entriesResult, uploadsResult, statsResult] = await Promise.all([
      getLogbookEntries(month, year),
      getRosterUploads(),
      getMonthlyStats(month, year),
    ])

    if (entriesResult.error) {
      setError(entriesResult.error)
    } else {
      setEntries(entriesResult.data as LogbookEntry[])
    }

    if (!uploadsResult.error) {
      setUploads(uploadsResult.data as RosterUpload[])
    }

    if (!statsResult.error && statsResult.data) {
      setStats(statsResult.data)
    }

    setLoading(false)
  }, [month, year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Fetch yearly comparison data
  useEffect(() => {
    let cancelled = false
    setYearlyLoading(true)
    Promise.all([getYearlyStats(year), getYearlyStats(year - 1)]).then(([current, previous]) => {
      if (cancelled) return
      if (current.data) setYearlyCurrentData(current.data)
      if (previous.data) setYearlyPreviousData(previous.data)
      setYearlyLoading(false)
    })
    return () => { cancelled = true }
  }, [year])

  const uploadRoster = useCallback(async (file: File) => {
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/roster', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al procesar el roster')
      } else {
        await fetchData()
      }
    } catch {
      setError('Error de conexion al subir el roster')
    }

    setUploading(false)
  }, [fetchData])

  const saveFlight = useCallback(async (
    flightId: string,
    updates: Partial<Pick<LogbookFlight, 'block_hours' | 'flight_hours' | 'aircraft_type' | 'aircraft_registration' | 'is_pf' | 'is_night' | 'is_cat_ii_iii' | 'approach_type' | 'remarks'>>
  ) => {
    const { error: err } = await updateLogbookFlight(flightId, updates)
    if (err) {
      setError(err)
      return false
    }
    // Update local state
    setEntries((prev) =>
      prev.map((entry) => ({
        ...entry,
        flights: entry.flights.map((f) =>
          f.id === flightId ? { ...f, ...updates } : f
        ),
      }))
    )
    // Refresh stats
    const statsResult = await getMonthlyStats(month, year)
    if (!statsResult.error && statsResult.data) {
      setStats(statsResult.data)
    }
    return true
  }, [month, year])

  return {
    entries,
    uploads,
    stats,
    loading,
    uploading,
    error,
    month,
    year,
    setMonth,
    setYear,
    uploadRoster,
    saveFlight,
    refresh: fetchData,
    yearlyCurrentData,
    yearlyPreviousData,
    yearlyLoading,
  }
}
