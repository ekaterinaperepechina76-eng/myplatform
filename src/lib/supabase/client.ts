import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Singleton — одна инстанция на всё приложение
let _client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // В SSR-контексте (Node.js) не создаём реальный клиент — useEffect всё равно не запускается
  if (typeof window === 'undefined') {
    return createSsrStub()
  }
  if (!_client) {
    _client = createBrowserClient(SUPABASE_URL, SUPABASE_KEY)
  }
  return _client
}

// Минимальная заглушка для SSR — методы никогда не вызываются в этом контексте
function createSsrStub() {
  const noop = () => ({})
  const asyncNoop = async () => ({ data: { user: null, session: null }, error: null })
  return {
    auth: {
      getUser: asyncNoop,
      getSession: asyncNoop,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: noop } } }),
      signInWithPassword: asyncNoop,
      signUp: asyncNoop,
      signOut: asyncNoop,
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: asyncNoop, order: () => asyncNoop(), limit: () => asyncNoop() }) }),
      insert: () => ({ select: () => ({ single: asyncNoop }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: asyncNoop }) }) }),
      delete: () => ({ eq: asyncNoop }),
      upsert: () => ({ select: () => ({ single: asyncNoop }) }),
    }),
    storage: {
      from: () => ({
        upload: asyncNoop,
        remove: asyncNoop,
        createSignedUrl: asyncNoop,
      }),
    },
  } as unknown as ReturnType<typeof createBrowserClient>
}
