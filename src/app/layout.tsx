import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Toaster } from 'react-hot-toast'

// next/font загружает шрифт на этапе сборки, без блокирующего сетевого запроса
const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'MyPlatform — Личное пространство',
  description: 'Личная платформа для управления бизнесом, привычками и целями',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning className={inter.variable}>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                fontSize: '14px',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
