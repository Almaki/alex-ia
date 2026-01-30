export type ActivityType = 'flight' | 'sim' | 'ground' | 'standby' | 'off' | 'vacation' | 'training' | 'medical' | 'other'

export interface LogbookEntry {
  id: string
  user_id: string
  roster_upload_id: string | null
  entry_date: string
  activity_type: ActivityType
  check_in: string | null
  check_out: string | null
  hotel: string | null
  notes: string | null
  crew_captain: string | null
  crew_first_officer: string | null
  crew_purser: string | null
  created_at: string
  updated_at: string
}

export interface LogbookFlight {
  id: string
  entry_id: string
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
  sort_order: number
  created_at: string
}

export interface RosterUpload {
  id: string
  user_id: string
  file_name: string
  file_type: 'image' | 'pdf'
  status: 'processing' | 'completed' | 'failed'
  month: number
  year: number
  error_message: string | null
  raw_response: Record<string, unknown> | null
  created_at: string
}

export interface LogbookEntryWithFlights extends LogbookEntry {
  flights: LogbookFlight[]
}

export interface LogbookStats {
  totalFlights: number
  totalBlockHours: number
  totalFlightHours: number
  nightFlights: number
  pfFlights: number
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  flight: 'Vuelo',
  sim: 'Simulador',
  ground: 'Tierra',
  standby: 'Standby',
  off: 'Libre',
  vacation: 'Vacaciones',
  training: 'Entrenamiento',
  medical: 'Medico',
  other: 'Otro',
}

export const APPROACH_TYPES = [
  'ILS',
  'RNAV',
  'VOR',
  'NDB',
  'Visual',
  'CATII',
  'CATIII',
] as const

export type ApproachType = typeof APPROACH_TYPES[number]
