// Preferí NEXT_PUBLIC_SITE_URL en Vercel (dominio custom estable) una vez confirmado.
// VERCEL_URL lo inyecta Vercel automáticamente en cada deploy (preview o producción) —
// sin eso, las URLs (Open Graph, sitemap, robots) salen relativas o apuntan a localhost.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
