/**
 * Utility functions for date/time handling in logbook
 */

/**
 * Get month name in Spanish
 */
export function getMonthName(month: number): string {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return months[month - 1] || 'Desconocido'
}

/**
 * Format date as YYYY-MM-DD (SQL date format)
 */
export function formatDateSQL(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format time as HH:MM (24h format)
 */
export function formatTime24(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Parse HH:MM time to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Calculate duration between two HH:MM times
 * Handles overnight flights (returns negative if end < start)
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  let diff = end - start

  // Handle overnight
  if (diff < 0) {
    diff += 24 * 60
  }

  return diff / 60 // Return hours
}

/**
 * Check if a flight is considered night flight
 * Night flight: between sunset and sunrise (approx 18:00 - 06:00 local)
 */
export function isNightFlight(stdTime: string, staTime: string): boolean {
  const stdMinutes = timeToMinutes(stdTime)
  const staMinutes = timeToMinutes(staTime)

  const nightStart = 18 * 60 // 18:00
  const nightEnd = 6 * 60    // 06:00

  // Check if departure or arrival is during night
  const departureNight = stdMinutes >= nightStart || stdMinutes < nightEnd
  const arrivalNight = staMinutes >= nightStart || staMinutes < nightEnd

  return departureNight || arrivalNight
}

/**
 * Get date range for a month
 */
export function getMonthDateRange(month: number, year: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, '0')}-01`

  let endMonth = month + 1
  let endYear = year
  if (endMonth > 12) {
    endMonth = 1
    endYear += 1
  }

  const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

  return { start, end }
}

/**
 * Format hours to HH:MM
 */
export function formatHoursToTime(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Get current month and year
 */
export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date()
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  }
}

/**
 * Get previous month
 */
export function getPreviousMonth(month: number, year: number): { month: number; year: number } {
  let prevMonth = month - 1
  let prevYear = year

  if (prevMonth < 1) {
    prevMonth = 12
    prevYear -= 1
  }

  return { month: prevMonth, year: prevYear }
}

/**
 * Get next month
 */
export function getNextMonth(month: number, year: number): { month: number; year: number } {
  let nextMonth = month + 1
  let nextYear = year

  if (nextMonth > 12) {
    nextMonth = 1
    nextYear += 1
  }

  return { month: nextMonth, year: nextYear }
}

/**
 * Format date for display (DD MMM YYYY)
 */
export function formatDateDisplay(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00') // Avoid timezone issues
  const day = date.getDate()
  const month = getMonthName(date.getMonth() + 1).substring(0, 3)
  const year = date.getFullYear()

  return `${day} ${month} ${year}`
}

/**
 * Validate IATA airport code (3 letters)
 */
export function isValidIATA(code: string): boolean {
  return /^[A-Z]{3}$/.test(code.toUpperCase())
}

/**
 * Validate time format (HH:MM)
 */
export function isValidTime(time: string): boolean {
  return /^\d{2}:\d{2}$/.test(time)
}

/**
 * Calculate total block hours for a set of flights
 */
export function calculateTotalBlockHours(flights: Array<{ block_hours: number | null }>): number {
  return flights.reduce((total, flight) => total + (flight.block_hours || 0), 0)
}

/**
 * Calculate total flight hours for a set of flights
 */
export function calculateTotalFlightHours(flights: Array<{ flight_hours: number | null }>): number {
  return flights.reduce((total, flight) => total + (flight.flight_hours || 0), 0)
}

/**
 * Strip seconds from time strings: "HH:MM:SS" -> "HH:MM", "HH:MM" -> "HH:MM"
 */
export function formatHHMM(time: string | null): string {
  if (!time) return '--:--'
  const parts = time.split(':')
  if (parts.length < 2) return time
  const h = parts[0].padStart(2, '0')
  const m = String(Math.min(59, parseInt(parts[1], 10) || 0)).padStart(2, '0')
  return `${h}:${m}`
}

/**
 * Format decimal hours to H:MM display (no zero-pad on hours)
 */
export function formatDecimalHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}:${String(Math.min(59, m)).padStart(2, '0')}`
}

/**
 * Format time as Zulu: "HH:MMZ". Returns "--:--" for null/empty.
 */
export function formatZulu(time: string | null): string {
  if (!time) return '--:--'
  return `${formatHHMM(time)}Z`
}

/**
 * Detect overnight duty: check_out time < check_in time means duty spans 2 days
 */
export function isOvernightDuty(checkIn: string | null, checkOut: string | null): boolean {
  if (!checkIn || !checkOut) return false
  const ciMinutes = timeToMinutes(formatHHMM(checkIn))
  const coMinutes = timeToMinutes(formatHHMM(checkOut))
  return coMinutes < ciMinutes
}

/**
 * UTC offset (hours to ADD to local time to get Zulu) for Mexican airports.
 * Post-2022 DST reform: most of Mexico uses fixed offsets year-round.
 *  - Centro (UTC-6): most airports
 *  - Sureste (UTC-5): Quintana Roo
 *  - Pacifico (UTC-7): Sonora, Baja California Sur, Sinaloa, Nayarit
 *  - Noroeste (UTC-8): Baja California (follows US Pacific, simplified to -8)
 */
const AIRPORT_UTC_OFFSETS: Record<string, number> = {
  // UTC-5 (Quintana Roo)
  CUN: 5, CZM: 5,
  // UTC-7 (Pacifico / Sonora)
  HMO: 7, SJD: 7, PVR: 7, MZT: 7, LMM: 7, CUL: 7, CLQ: 7, LAP: 7, GYM: 7,
  // UTC-8 (Noroeste / Baja California)
  TIJ: 8, MXL: 8,
  // UTC-6 is default for everything else (Centro)
}
export const DEFAULT_MEXICO_UTC_OFFSET = 6
const DEFAULT_UTC_OFFSET = DEFAULT_MEXICO_UTC_OFFSET

/**
 * Get UTC offset (hours to add) for an IATA airport code.
 */
export function getAirportUtcOffset(iata: string): number {
  return AIRPORT_UTC_OFFSETS[iata.toUpperCase()] ?? DEFAULT_UTC_OFFSET
}

/**
 * Convert a local HH:MM time to Zulu HH:MM by adding the UTC offset.
 * Returns HH:MM string in 24h format (wraps past midnight).
 */
export function localToZulu(localTime: string | null, utcOffset: number): string | null {
  if (!localTime) return null
  const hhmm = formatHHMM(localTime)
  if (hhmm === '--:--') return null
  let minutes = timeToMinutes(hhmm) + utcOffset * 60
  if (minutes >= 24 * 60) minutes -= 24 * 60
  if (minutes < 0) minutes += 24 * 60
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Compute duty duration in hours using Zulu-aware conversion.
 * C/I is in origin local time, C/O is in destination local time.
 * Converts both to Zulu first, then computes the difference.
 * Returns hours (decimal) or null if inputs are missing.
 */
export function zuluDutyDuration(
  checkIn: string | null,
  checkOut: string | null,
  originIATA: string | null,
  destinationIATA: string | null
): number | null {
  if (!checkIn || !checkOut) return null
  const originOffset = originIATA ? getAirportUtcOffset(originIATA) : DEFAULT_UTC_OFFSET
  const destOffset = destinationIATA ? getAirportUtcOffset(destinationIATA) : DEFAULT_UTC_OFFSET
  const startZ = localToZulu(checkIn, originOffset)
  const endZ = localToZulu(checkOut, destOffset)
  if (!startZ || !endZ) return null
  return calculateDuration(startZ, endZ)
}
