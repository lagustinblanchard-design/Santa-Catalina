import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /v2, /v3, /v4/calibrar y /mapa-preview ya van noindex vía metadata (rediseños en
      // curso / vista interna) — reforzado acá para que ni se rastreen. /v4 (a secas) ya
      // NO va acá: ahora es un redirect 301 a / (ver next.config.ts) y tiene que poder
      // rastrearse para que Google transfiera el link juice de la URL vieja.
      disallow: ['/v2', '/v3', '/v4/calibrar', '/mapa-preview', '/api'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
