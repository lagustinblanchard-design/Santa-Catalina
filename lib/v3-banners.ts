import { SITE, SERVICES, PROJECT_PHASES, LOT_TYPES, PRICES, FINANCING_36, NOTARIAL_COSTS, ZONING, SURROUNDINGS } from '@/lib/data'
import { countByStatus, type Lot } from '@/lib/lots'

export type V3SectionKey = 'proyecto' | 'lotes' | 'precios' | 'normativa'

export type V3Banner = {
  key: V3SectionKey
  index: string // '01'…'04'
  title: string
  hook: { value: string; unit?: string; caption: string }
  anchor: string // ancla de la sección completa, para "Ver sección completa"
  waMessage: string
  lead: string
  highlights: { value: string; label: string }[]
  bullets: string[]
}

const waLink = (message: string) =>
  `https://wa.me/${SITE.WA_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`

// Contenido resumido de cada viñeta — no son las secciones reales (esas siguen
// abajo en el scroll, esto es un índice ilustrado que reusa lib/data.ts como
// única fuente de verdad, más countByStatus(lots) para el conteo en vivo).
export function getV3Banners(lots: Lot[]): V3Banner[] {
  const disponibles = countByStatus(lots).DISPONIBLE ?? 0
  const zonaC2 = ZONING.find((z) => z.zone === 'C2')

  return [
    {
      key: 'proyecto',
      index: '01',
      title: 'El Proyecto',
      hook: { value: '90', unit: '%', caption: 'agua y cloaca ya ejecutadas' },
      anchor: '#proyecto',
      waMessage: 'Hola, quiero saber más sobre el avance de obra de Santa Catalina.',
      lead: 'No es un plano: es obra en marcha, con fechas y porcentajes reales.',
      highlights: [
        { value: SITE.stage, label: 'del desarrollo' },
        { value: `${SITE.totalBlocks}`, label: 'manzanas' },
      ],
      bullets: [
        ...SERVICES.map((s) => `${s.label}: ${s.detail ?? '—'}`),
        ...PROJECT_PHASES.filter((p) => p.status === 'en_curso' || p.status === 'proyectado')
          .map((p) => `${p.label}: ${p.detail}`),
      ],
    },
    {
      key: 'lotes',
      index: '02',
      title: 'Lotes y Ubicación',
      hook: { value: String(disponibles), caption: 'lotes disponibles hoy (actualizado desde la planilla de ventas)' },
      anchor: '#lotes',
      waMessage: 'Hola, quiero consultar disponibilidad de lotes en Santa Catalina.',
      lead: `De ${LOT_TYPES['12x26'].sqm} a ${LOT_TYPES['15.55x30'].sqm.toString().replace('.', ',')} m², junto a viviendas del PROCREAR — la zona ya está poblándose.`,
      highlights: SURROUNDINGS.travelTimes.slice(0, 2).map((t) => ({ value: t.time, label: t.label })),
      bullets: SURROUNDINGS.travelTimes.map((t) => `${t.label}: ${t.time}`),
    },
    {
      key: 'precios',
      index: '03',
      title: 'Precios y Financiación',
      hook: {
        value: `USD ${FINANCING_36['12x26']?.installmentUSD}`,
        caption: `por mes, con USD ${FINANCING_36['12x26']?.downUSD.toLocaleString('es-AR')} de entrega`,
      },
      anchor: '#precios',
      waMessage: 'Hola, quiero consultar precios y planes de financiación de Santa Catalina.',
      lead: `Lotes desde USD ${PRICES['12x26'].cashUSD.toLocaleString('es-AR')} hasta USD ${PRICES['15.55x30'].cashUSD.toLocaleString('es-AR')}, con 5% de descuento al contado.`,
      highlights: [
        { value: '12', label: 'cuotas en pesos o USD' },
        { value: '36', label: 'cuotas en USD' },
      ],
      bullets: [
        ...NOTARIAL_COSTS.map((c) => `${c.concept}: ${c.value}`),
        `Plan de 36 cuotas (12×26): ${FINANCING_36['12x26']?.availability}`,
      ],
    },
    {
      key: 'normativa',
      index: '04',
      title: 'Normativa y Galería',
      hook: {
        value: zonaC2?.maxHeight.split(' / ')[1]?.split(' ')[0] ?? '6',
        unit: ' plantas', // espacio inicial a propósito — "plantas" es palabra, no sufijo (a diferencia de "%")
        caption: `en los lotes sobre avenida (zona ${zonaC2?.zone})`,
      },
      anchor: '#zonificacion',
      waMessage: 'Hola, quiero consultar la normativa de zonificación de Santa Catalina.',
      lead: `${SITE.ordinance} aprobada: sabés hoy qué vas a poder construir mañana.`,
      highlights: ZONING.slice(0, 2).map((z) => ({ value: z.zone, label: z.desc })),
      bullets: ZONING.filter((z) => z.zone !== 'EVP').map((z) => `${z.zone}: FOT ${z.fot} · FOS ${z.fos} · ${z.maxHeight}`),
    },
  ]
}

export { waLink }
