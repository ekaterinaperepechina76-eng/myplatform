import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDateMoscow, formatShortDateMoscow } from '@/lib/tz'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'RUB'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Длинная дата по московскому времени */
export function formatDate(date: string | Date): string {
  return formatDateMoscow(date)
}

/** Короткая дата по московскому времени */
export function formatShortDate(date: string | Date): string {
  return formatShortDateMoscow(date)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const HABIT_COLORS = [
  '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#3b82f6', '#84cc16',
]

export const HABIT_ICONS = [
  '💪', '📚', '🏃', '🧘', '💧', '🥗', '😴', '✍️',
  '🎯', '🎨', '🎵', '💻', '🌿', '☀️', '🧠', '❤️',
]

export const WISHLIST_CATEGORIES = [
  'Техника', 'Одежда', 'Книги', 'Путешествия',
  'Дом', 'Здоровье', 'Развлечения', 'Другое',
]

export const BLOG_PLATFORMS = [
  'Instagram', 'TikTok', 'YouTube', 'Telegram', 'VK', 'Другое',
]
