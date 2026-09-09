import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /v2, /v3 y /mapa-preview ya van noindex vía metadata (rediseños en curso / vista
      // interna) — reforzado acá para que ni se rastreen.
      disallow: ['/v2', '/v3', '/mapa-preview', '/api'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
