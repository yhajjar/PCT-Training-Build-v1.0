/**
 * Safely parse a date that may be a Date object or ISO string
 */
export function safeDate(date: Date | string): Date {
  if (date instanceof Date) return date;
  return new Date(date);
}

/**
 * Format time from 24-hour format to 12-hour format with AM/PM
 */
export function formatTime(time: string | undefined): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format a time range (from - to) with optional duration
 */
export function formatTimeRange(timeFrom?: string, timeTo?: string, duration?: string): string {
  if (timeFrom && timeTo) {
    const fromFormatted = formatTime(timeFrom);
    const toFormatted = formatTime(timeTo);
    return duration 
      ? `${fromFormatted} - ${toFormatted} (${duration})`
      : `${fromFormatted} - ${toFormatted}`;
  }
  if (timeFrom) return formatTime(timeFrom);
  return '';
}

/**
 * Convert a date to ISO string for storage
 */
export function toDateString(date: Date | string): string {
  const d = safeDate(date);
  return d.toISOString();
}
