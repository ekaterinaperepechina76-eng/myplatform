/** @type {import('next').NextConfig} */
const nextConfig = {
  // Сжатие gzip/brotli
  compress: true,

  // Убираем заголовок X-Powered-By
  poweredByHeader: false,

  images: {
    // Современные форматы (WebP, AVIF)
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ikgztjqjlxqlyribicok.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Заголовки безопасности и кеширования для статики
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Статические ассеты Next.js кешируем на год
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

export default nextConfig
