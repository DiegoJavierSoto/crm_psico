/**
 * Date/Timezone utility functions for PsicoCRM
 * All date operations use UTC consistently to avoid timezone offset issues.
 * Dates are stored as ISO strings (yyyy-MM-dd) in the database.
 */

const MONTHS_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
]

/**
 * Returns yyyy-MM-dd from a Date object using UTC
 */
export function formatDateISO(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Returns HH:mm from a Date object using UTC
 */
export function formatTimeHHMM(date: Date): string {
  const h = String(date.getUTCHours()).padStart(2, '0')
  const m = String(date.getUTCMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

/**
 * Parses a yyyy-MM-dd string to a Date at UTC noon
 */
export function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
}

/**
 * Returns "15 Ene 2025" style display in Spanish
 */
export function formatDateDisplay(dateStr: string): string {
  const date = parseISODate(dateStr)
  const day = date.getUTCDate()
  const month = MONTHS_ES[date.getUTCMonth()]
  const year = date.getUTCFullYear()
  return `${day} ${month} ${year}`
}

/**
 * Combined display: "15 Ene 2025 - 10:00"
 */
export function formatDateTimeDisplay(dateStr: string, time: string): string {
  return `${formatDateDisplay(dateStr)} - ${time}`
}

/**
 * Returns array of 7 ISO dates for the week containing the given date.
 * Week starts on Monday.
 */
export function getWeekDates(date: Date): string[] {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0))
  const dayOfWeek = d.getUTCDay() // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() + mondayOffset)

  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday)
    day.setUTCDate(monday.getUTCDate() + i)
    dates.push(formatDateISO(day))
  }
  return dates
}

/**
 * Returns all ISO dates in a given month (1-indexed month)
 */
export function getMonthDates(year: number, month: number): string[] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const dates: string[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
  }
  return dates
}

/**
 * Days between two ISO date strings (date2 - date1)
 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = parseISODate(date1)
  const d2 = parseISODate(date2)
  const diffMs = d2.getTime() - d1.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Add days to an ISO date string, returns new ISO date string
 */
export function addDays(dateStr: string, days: number): string {
  const date = parseISODate(dateStr)
  date.setUTCDate(date.getUTCDate() + days)
  return formatDateISO(date)
}

/**
 * Check if an ISO date string is today (UTC)
 */
export function isToday(dateStr: string): boolean {
  return dateStr === formatDateISO(new Date())
}

/**
 * Check if an ISO date string is in the past (before today)
 */
export function isPast(dateStr: string): boolean {
  return daysBetween(dateStr, formatDateISO(new Date())) > 0
}

/**
 * Check if an ISO date string is in the future (after today)
 */
export function isFuture(dateStr: string): boolean {
  return daysBetween(formatDateISO(new Date()), dateStr) > 0
}

/**
 * Get today's date as ISO string (using local timezone to match user's perspective)
 */
export function todayISO(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
