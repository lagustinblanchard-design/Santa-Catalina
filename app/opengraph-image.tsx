import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { SITE } from '@/lib/data'
import { LOTS } from '@/lib/lots'

// Tarjeta que ve el 100% del tráfico: el canal de venta es WhatsApp, y sin esta
// convención de archivo el link compartido sale sin imagen (og:image ausente).
export const alt = `${SITE.name} — ${SITE.tagline}`
export const size = { width: 1200, height: 630 }
// ImageResponse sólo emite PNG (sin opción `format`); un canvas full-bleed con foto
// pesa ~1,3MB en PNG sin comprimir. Se recomprime a JPEG con sharp antes de devolverlo
// (ver el `return` al final) — de ahí que contentType sea jpeg y no lo que ImageResponse genera.
export const contentType = 'image/jpeg'

export default async function Image() {
  // JPEG dedicado a 1200×630 exacto (no el poster webp del hero: next/og no soporta
  // decodificar WebP de forma confiable, y esto evita el crop/escala en runtime).
  const posterData = await readFile(join(process.cwd(), 'public/og-background.jpg'), 'base64')
  const posterSrc = `data:image/jpeg;base64,${posterData}`

  const response = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          position: 'relative',
          background: '#2E2A26',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterSrc}
          width={1200}
          height={630}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Mismo tratamiento que Hero.tsx: overlay + gradiente para legibilidad del texto */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex' }} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 75%)',
            display: 'flex',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', padding: '56px 64px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 20,
              fontSize: 22,
              color: 'rgba(242,236,224,0.8)',
            }}
          >
            <span>Comercializado por</span>
            <span style={{ color: '#FF4230', fontWeight: 700 }}>RE/MAX</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>PAYÉ</span>
          </div>

          <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color: '#fff', lineHeight: 1.05 }}>
            Extensión Urbana
          </div>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color: '#FF4230', lineHeight: 1.05, marginBottom: 24 }}>
            Santa Catalina
          </div>

          <div style={{ display: 'flex', fontSize: 30, color: 'rgba(242,236,224,0.92)' }}>
            {LOTS.length} lotes · {SITE.totalBlocks} manzanas · {SITE.stage}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )

  const png = await response.arrayBuffer()
  const jpeg = await sharp(Buffer.from(png)).jpeg({ quality: 82 }).toBuffer()
  return new Response(new Uint8Array(jpeg), { headers: { 'Content-Type': 'image/jpeg' } })
}
