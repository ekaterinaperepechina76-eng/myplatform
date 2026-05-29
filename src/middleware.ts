import { NextResponse, type NextRequest } from 'next/server'

// Supabase хранит auth токен в cookie с ключом вида sb-<ref>-auth-token
// Проверяем наличие токена без верификации — клиент проверяет подпись сам
function hasAuthToken(request: NextRequest): boolean {
  const cookies = request.cookies.getAll()
  return cookies.some(
    (c) =>
      (c.name.startsWith('sb-') && c.name.endsWith('-auth-token')) ||
      c.name === 'myplatform-auth'
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthPage = pathname === '/login' || pathname === '/register'

  // Статические маршруты и API пропускаем
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const authenticated = hasAuthToken(request)

  // Не авторизован — перенаправляем на логин (кроме самих auth-страниц)
  if (!authenticated && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Авторизован — не пускаем обратно на логин/регистрацию
  if (authenticated && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
