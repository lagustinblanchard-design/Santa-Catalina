import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-url'

// Sólo rutas indexables — /v2, /v3 y /mapa-preview llevan noindex (ver metadata de cada una);
// /lote/[id] también (son fichas para imprimir, no páginas para buscar).
//
// Sin `lastModified` a propósito: antes era `new Date()`, o sea "hoy" en cada consulta,
// y Google aprende a ignorar la fecha de un sitemap que siempre dice que cambió ahora.
// Una fecha falsa es peor que ninguna.
const ROUTES = ['', '/mapa-3d', '/privacidad', '/terminos']

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({ url: `${SITE_URL}${route}` }))
}
