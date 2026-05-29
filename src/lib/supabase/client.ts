import { createBrowserClient } from '@supabase/ssr'

// Fallback-плейсхолдеры нужны чтобы сборка не падала когда env vars не заданы.
// При реальной работе всегда используются настоящие значения из окружения.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY)
}
