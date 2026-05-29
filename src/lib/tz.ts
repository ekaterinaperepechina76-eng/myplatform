import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

export const TZ = 'Europe/Moscow'

/** Сегодняшняя дата в формате YYYY-MM-DD по московскому времени */
export function todayMoscow(): string {
  return formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd')
}

/** Текущий момент в московском времени как Date */
export function nowMoscow(): Date {
  return toZonedTime(new Date(), TZ)
}

/** Форматирует дату/строку с учётом московского часового пояса */
export function formatMoscow(date: string | Date, fmt: string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatInTimeZone(d, TZ, fmt, { locale: ru })
}

/** Длинная дата: «28 мая 2026» */
export function formatDateMoscow(date: string | Date): string {
  return formatMoscow(date, 'd MMMM yyyy')
}

/** Короткая дата: «28 мая» */
export function formatShortDateMoscow(date: string | Date): string {
  return formatMoscow(date, 'd MMM')
}

/** Время: «23:31» */
export function formatTimeMoscow(date: string | Date): string {
  return formatMoscow(date, 'HH:mm')
}

/** Дата + время: «28 мая, 23:31» */
export function formatDateTimeMoscow(date: string | Date): string {
  return formatMoscow(date, 'd MMM, HH:mm')
}

/** Месяц + год: «Май 2026» */
export function formatMonthYearMoscow(date: Date): string {
  return formatInTimeZone(date, TZ, 'LLLL yyyy', { locale: ru })
}

/**
 * Преобразует локальное значение datetime-local input (без зоны)
 * в ISO-строку с учётом московского смещения.
 * Например: "2026-05-28T15:00" → "2026-05-28T12:00:00.000Z"
 */
export function localInputToUtc(localDatetime: string): string {
  if (!localDatetime) return ''
  const d = fromZonedTime(localDatetime, TZ)
  return d.toISOString()
}

/**
 * Преобразует UTC ISO-строку в формат datetime-local input
 * по московскому времени: "2026-05-28T12:00:00.000Z" → "2026-05-28T15:00"
 */
export function utcToLocalInput(utcString: string): string {
  if (!utcString) return ''
  return formatInTimeZone(parseISO(utcString), TZ, "yyyy-MM-dd'T'HH:mm")
}
