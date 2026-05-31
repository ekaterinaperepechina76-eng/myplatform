// Простой in-memory кэш для Supabase запросов
// TTL: 60 сек для пользовательских данных, сбрасывается при мутациях

interface CacheEntry<T> {
  data: T
  ts: number
}

const store = new Map<string, CacheEntry<unknown>>()
const DEFAULT_TTL = 60_000 // 60 секунд

export function getCache<T>(key: string, ttl = DEFAULT_TTL): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() - entry.ts > ttl) { store.delete(key); return null }
  return entry.data
}

export function setCache<T>(key: string, data: T): void {
  store.set(key, { data, ts: Date.now() })
}

export function invalidate(...prefixes: string[]): void {
  const allKeys = Array.from(store.keys())
  prefixes.forEach(prefix => {
    allKeys.forEach(key => {
      if (key.startsWith(prefix)) store.delete(key)
    })
  })
}

export function clearAll(): void {
  store.clear()
}

// Хелпер: оборачивает async функцию в кэш
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = DEFAULT_TTL
): Promise<T> {
  const hit = getCache<T>(key, ttl)
  if (hit !== null) return hit
  const data = await fetcher()
  setCache(key, data)
  return data
}
