// '08:30' or '08:30:00' → 510
export function toMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// An end time earlier than the start time is on the next day
export function endsNextDay(start: string, end: string): boolean {
  return toMinutes(end) < toMinutes(start)
}

// '18:15' → '00:35' = 380 minutes
export function durationMinutes(start: string, end: string): number {
  return (toMinutes(end) - toMinutes(start) + 1440) % 1440
}

// 510 → '08:30'
export function fromMinutes(totalMinutes: number): string {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
  const minutes = String(totalMinutes % 60).padStart(2, '0')
  return `${hours}:${minutes}`
}

// Current time rounded down, e.g. 16:38 with step 15 → '16:30'
export function currentTimeRounded(stepMinutes: number): string {
  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes()
  return fromMinutes(Math.floor(minutes / stepMinutes) * stepMinutes)
}

// 7.7 → '7.70 h'
export function formatHours(hours: number): string {
  return `${hours.toFixed(2)} h`
}

// 1.5 → '+1.50 h', -1.45 → '−1.45 h'
export function formatSignedHours(hours: number): string {
  const rounded = Math.round(hours * 100) / 100
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : ''
  return `${sign}${Math.abs(rounded).toFixed(2)} h`
}

// 7.7 → '7:42', -1.45 → '-1:27'
export function formatHoursMinutes(hours: number): string {
  const totalMinutes = Math.round(Math.abs(hours) * 60)
  const sign = hours < 0 ? '-' : ''
  const minutes = String(totalMinutes % 60).padStart(2, '0')
  return `${sign}${Math.floor(totalMinutes / 60)}:${minutes}`
}
