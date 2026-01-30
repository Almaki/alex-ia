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
