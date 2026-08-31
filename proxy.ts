import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Gate público mientras se termina de armar el contenido nuevo.
// Para volver a publicar: poner esta constante en false (o borrar el archivo).
const UNDER_CONSTRUCTION = true

const PAGE = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Distrito Payé — Próximamente</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F2ECE0;
    color: #2E2A26;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    text-align: center;
    padding: 2rem;
  }
  main { max-width: 32rem; }
  h1 {
    margin: 0 0 .75rem;
    font-size: 1.75rem;
    letter-spacing: .02em;
    color: #8A6A47;
  }
  p { margin: 0; font-size: 1.05rem; line-height: 1.6; color: #6B6660; }
</style>
</head>
<body>
  <main>
    <h1>Distrito Payé</h1>
    <p>Estamos actualizando el sitio. Volvé a visitarnos en breve.</p>
  </main>
</body>
</html>`

export function proxy(request: NextRequest) {
  if (!UNDER_CONSTRUCTION) return NextResponse.next()

  return new NextResponse(PAGE, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Retry-After': '3600',
    },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
