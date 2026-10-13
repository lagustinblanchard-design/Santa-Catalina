import { notFound } from 'next/navigation'
import { LOTS, applyStatuses } from '@/lib/lots'
import { fetchLotStatuses } from '@/lib/sheets'
import {
  SITE, STATUS_LABELS, STATUS_PRINT, LOT_TYPES, PRICES, FINANCING_12, FINANCING_36, type LotSize,
} from '@/lib/data'
import { buildFeatures } from '@/components/lot-scene/geometry'
import PrintButton from '@/components/PrintButton'
import { headers } from 'next/headers'
import QRCode from 'qrcode'
import { AGENTS } from '@/lib/agents'

// Ficha imprimible de un lote (/lote/M7-L12). Se abre desde la ficha del mapa 3D y se
// guarda como PDF con el diálogo de impresión del navegador (PrintButton).
// Disponibilidad en vivo, igual que /mapa-3d.
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lot = LOTS.find((l) => l.id === id)
  return {
    title: lot ? `Manzana ${lot.block} · Lote ${lot.lot} · ${SITE.name}` : SITE.name,
    robots: { index: false },
  }
}

const fmt = (n: number) => `USD ${Math.round(n).toLocaleString('es-AR')}`

// Plano chico del loteo con el lote resaltado: proyección equirectangular de los
// polígonos geo de lot-scene (a esta escala, ~700 m, la distorsión no se nota).
function MiniPlan({ lots, id }: { lots: ReturnType<typeof buildFeatures>; id: string }) {
  const lat0 = lots[0].position[1] * (Math.PI / 180)
  const pts = lots.flatMap((f) => f.polygon)
  const xs = pts.map(([lon]) => lon * Math.cos(lat0))
  const ys = pts.map(([, lat]) => -lat)
  const minX = Math.min(...xs), minY = Math.min(...ys)
  const w = Math.max(...xs) - minX, h = Math.max(...ys) - minY
  const S = 1000 / Math.max(w, h)
  const toPath = (poly: [number, number][]) =>
    poly.map(([lon, lat], i) => `${i ? 'L' : 'M'}${((lon * Math.cos(lat0) - minX) * S).toFixed(1)},${((-lat - minY) * S).toFixed(1)}`).join('') + 'Z'
  const target = lots.find((f) => f.id === id)

  return (
    <svg viewBox={`-20 -20 ${w * S + 40} ${h * S + 40}`} className="h-auto w-full" role="img" aria-label="Ubicación del lote en el loteo">
      {lots.map((f) => (
        <path key={f.id} d={toPath(f.polygon)} fill={f.id === id ? '#AA1120' : STATUS_PRINT[f.status].fill} stroke="#fff" strokeWidth={1} />
      ))}
      {target && <circle cx={(target.position[0] * Math.cos(lat0) - minX) * S} cy={(-target.position[1] - minY) * S} r={28} fill="none" stroke="#AA1120" strokeWidth={5} />}
    </svg>
  )
}

export default async function LotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ref?: string }>
}) {
  const { id } = await params
  // ?ref= lo agrega el botón "Ficha PDF" del mapa 3D si el visitante vino por un agente:
  // el QR y el WhatsApp impresos quedan de ese agente.
  const refParam = (await searchParams).ref?.toLowerCase()
  const ref = refParam && Object.hasOwn(AGENTS, refParam) ? refParam : null
  const waNumber = (ref && AGENTS[ref].phone) || SITE.WA_NUMBER
  let lots = LOTS
  try {
    lots = applyStatuses(await fetchLotStatuses())
  } catch {
    // sheet no disponible — usa datos hardcodeados
  }
  const lot = lots.find((l) => l.id === id)
  if (!lot) notFound()

  const size = lot.dims.replace('×', 'x') as LotSize
  const type = LOT_TYPES[size]
  const price = lot.status === 'DISPONIBLE' ? PRICES[size] : undefined
  const fin12 = price ? FINANCING_12[size] : undefined
  const fin36 = price ? FINANCING_36[size] : undefined
  const features = buildFeatures(lots)
  // Host del pedido y no SITE_URL: en Vercel, sin NEXT_PUBLIC_SITE_URL, SITE_URL es la URL
  // interna del deploy, no el dominio por el que entró el cliente.
  const h = await headers()
  const host = h.get('host') ?? ''
  const lotUrl = `${h.get('x-forwarded-proto') ?? 'https'}://${host}/mapa-3d?lote=${lot.id}${ref ? `&ref=${ref}` : ''}`
  const qrSvg = await QRCode.toString(lotUrl, { type: 'svg', margin: 0, color: { dark: '#2E2A26', light: '#0000' } })
  const waHref = `https://wa.me/${waNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Hola, me interesa el Lote ${lot.lot} de la Manzana ${lot.block} — Santa Catalina.`,
  )}`

  const row = 'flex justify-between border-b py-2 text-sm'
  return (
    <main className="mx-auto max-w-3xl bg-white px-4 py-8 text-[#2E2A26] sm:px-8 print:max-w-none print:p-0">
      <style>{`@page { size: A4; margin: 14mm } @media print { body { background: #fff } }`}</style>

      <header className="flex items-center justify-between border-b-2 pb-4" style={{ borderColor: '#AA1120' }}>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#AA1120' }}>{SITE.name} · Ficha de lote</p>
          <h1 className="mt-1 text-3xl font-black">Manzana {lot.block} · Lote {lot.lot}</h1>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-paye.png" alt="Payé" className="h-12 w-auto" />
      </header>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 print:grid-cols-2">
        <section>
          <div className={row}><span>Estado</span><strong>{STATUS_LABELS[lot.status]}</strong></div>
          <div className={row}><span>Medidas</span><strong>{lot.dims} m</strong></div>
          <div className={row}><span>Superficie</span><strong>{lot.sqm} m²</strong></div>
          {type && <div className={row}><span>Tipología</span><strong>{type.label}</strong></div>}
          {type && <div className={row}><span>Uso permitido</span><strong className="text-right">{type.use}</strong></div>}

          {price && (
            <>
              <h2 className="mt-6 text-sm font-bold uppercase tracking-wider" style={{ color: '#AA1120' }}>Precio</h2>
              <div className={row}><span>Precio de lista</span><strong>{fmt(price.cashUSD)}</strong></div>
              <div className={row}><span>Contado ({price.discount * 100}% desc.)</span><strong>{fmt(price.cashUSD * (1 - price.discount))}</strong></div>
              {fin12 && (
                <div className={row}><span>12 cuotas</span><strong>{fmt(fin12.downUSD)} + 12 × {fmt(fin12.installmentUSD)}</strong></div>
              )}
              {fin36 && (
                <div className={row}><span>36 cuotas</span><strong>{fmt(fin36.downUSD)} + 36 × {fmt(fin36.installmentUSD)}</strong></div>
              )}
              <p className="mt-2 text-xs text-[#6B6660]">Valores de referencia sujetos a disponibilidad. Consultá condiciones vigentes con un asesor.</p>
            </>
          )}
        </section>

        <section>
          <MiniPlan lots={features} id={lot.id} />
          <p className="mt-1 text-center text-xs text-[#6B6660]">Ubicación del lote dentro del loteo (norte arriba)</p>
        </section>
      </div>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-4 text-sm">
        <div>
          <p className="font-bold">{SITE.developer}</p>
          <p className="text-[#6B6660]">WhatsApp {waNumber}</p>
          <p className="text-[#6B6660]">Ver en 3D: {host}/mapa-3d?lote={lot.id}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* SVG generado en el servidor por la librería qrcode, a partir de una URL propia — no hay input de usuario sin validar */}
          <div className="h-24 w-24" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <p className="max-w-[9rem] text-xs text-[#6B6660]">Escaneá para ver el lote en el recorrido 3D</p>
        </div>
        <div className="flex gap-3 print:hidden">
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="rounded-xl px-5 py-3 text-sm font-bold text-white" style={{ background: '#25D366' }}>
            Consultar
          </a>
          <PrintButton />
        </div>
      </footer>
    </main>
  )
}
