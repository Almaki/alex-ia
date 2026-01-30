'use client'

import { useState, useEffect, useCallback } from 'react'
import { getLogbookEntries, getRosterUploads } from '../services/bitacora-actions'

interface LogbookFlight {
  id: string
  flight_number: string | null
  aircraft_type: string | null
  aircraft_registration: string | null
  origin: string
  destination: string
  std: string | null
  sta: string | null
  block_hours: number | null
  is_night: boolean
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

export function useLogbook() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [entries, setEntries] = useState<LogbookEntry[]>([])
  const [uploads, setUploads] = useState<RosterUpload[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [entriesResult, uploadsResult] = await Promise.all([
      getLogbookEntries(month, year),
      getRosterUploads(),
    ])

    if (entriesResult.error) {
      setError(entriesResult.error)
    } else {
      setEntries(entriesResult.data as LogbookEntry[])
    }

    if (!uploadsResult.error) {
      setUploads(uploadsResult.data as RosterUpload[])
    }

    setLoading(false)
  }, [month, year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
        // Refresh data to show new entries
        await fetchData()
      }
    } catch {
      setError('Error de conexion al subir el roster')
    }

    setUploading(false)
  }, [fetchData])

  return {
    entries,
    uploads,
    loading,
    uploading,
    error,
    month,
    year,
    setMonth,
    setYear,
    uploadRoster,
    refresh: fetchData,
  }
}
