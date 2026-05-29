import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// В Node.js (SSR) нет нативного WebSocket — предоставляем заглушку.
// Auth и DB запросы идут через fetch (REST), WebSocket нужен только для Realtime
// которое в приложении не используется.
class NoopWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  readyState = NoopWebSocket.CLOSED
  close() {}
  send() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return false }
}

type AnyClient = SupabaseClient<any, any, any> // eslint-disable-line

let _client: AnyClient | null = null

export function createClient(): AnyClient {
  if (_client) return _client

  const isServer = typeof window === 'undefined'

  _client = createSupabaseClient<any, any, any>(SUPABASE_URL, SUPABASE_KEY, { // eslint-disable-line
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'myplatform-auth',
    },
    realtime: {
      transport: isServer
        ? (NoopWebSocket as unknown as typeof WebSocket)
        : undefined,
    },
  })

  return _client
}
