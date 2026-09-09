import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-url'

// Sólo rutas indexables — /v2 y /mapa-preview llevan noindex (ver metadata de cada una).
const ROUTES = ['', '/mapa-3d', '/privacidad', '/terminos']

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }))
}
