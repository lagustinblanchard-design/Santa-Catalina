export const SITE = {
  name: 'Predios Santa Catalina',
  tagline: 'Segunda Preventa — Corrientes Capital',
  developer: 'PAYÉ',
  broker: 'RE/MAX PAYÉ',
  ordinance: 'Ord. N.º 7403',
  location: 'Junto a viviendas del PROCREAR, zona de expansión urbana de Corrientes',
  stage: 'Segunda Preventa',
  totalBlocks: 14,
  WA_NUMBER: '+5493794000000', // ← REEMPLAZAR con número real
  WA_MESSAGE: 'Hola, me interesa información sobre Predios Santa Catalina.',
  CONTACT_EMAIL: 'info@remaxpaye.com.ar', // ← REEMPLAZAR
}

export type LotSize = '12x26' | '12x28' | '12x30' | 'mixto'

export const LOT_TYPES: Record<LotSize, { label: string; dims: string; sqm: number; use: string }> = {
  '12x26': { label: 'Residencial chico',   dims: '12 × 26 m', sqm: 312, use: 'Vivienda' },
  '12x28': { label: 'Residencial mediano', dims: '12 × 28 m', sqm: 336, use: 'Vivienda' },
  '12x30': { label: 'Residencial grande',  dims: '12 × 30 m', sqm: 360, use: 'Vivienda' },
  mixto:   { label: 'Mixto',               dims: '15,55 × 30 m', sqm: 450, use: 'Vivienda + Comercio' },
}

export const PRICES: Record<LotSize, { cashUSD: number; discount: number }> = {
  '12x26': { cashUSD: 15288, discount: 0.05 },
  '12x28': { cashUSD: 16450, discount: 0.05 },
  '12x30': { cashUSD: 17650, discount: 0.05 },
  mixto:   { cashUSD: 22050, discount: 0    },
}

// Opción 1 — 12 cuotas (30% de entrega)
export const FINANCING_12: Partial<Record<LotSize, {
  downPesos: number; installmentPesos: number
  downUSD: number;   installmentUSD: number
}>> = {
  '12x26': { downPesos: 6885000, installmentPesos: 1338750, downUSD: 0, installmentUSD: 0 }, // SIN UNIDADES en pesos
  '12x28': { downPesos: 7402500, installmentPesos: 1439370, downUSD: 4935, installmentUSD: 960  },
  '12x30': { downPesos: 7942500, installmentPesos: 1544375, downUSD: 5295, installmentUSD: 1030 },
}

// Opción 2 — 36 cuotas en USD
export const FINANCING_36: Partial<Record<LotSize, {
  downUSD: number; installmentUSD: number; availability: string
}>> = {
  '12x26': { downUSD: 1500, installmentUSD: 640, availability: 'SIN UNIDADES' },
  '12x28': { downUSD: 2000, installmentUSD: 670, availability: '4 lotes disponibles' },
  '12x30': { downUSD: 2000, installmentUSD: 730, availability: 'Consultar' },
}

export const NOTARIAL_COSTS = [
  { concept: 'Honorarios escribanía',   value: '$645.000 pesos' },
  { concept: 'Impuesto de sellos',       value: '1% (calculado al dólar oficial)' },
  { concept: 'Honorarios inmobiliarios', value: '3% en dólares (no incluido en precio)' },
]

export const ZONING = [
  {
    zone: 'AI-1',
    desc: 'Densidad media baja',
    minSqm: '300 m²',
    minFront: '12 m',
    maxHeight: '13 m / 4 plantas',
    fot: '2.8',
    fos: '0.70',
  },
  {
    zone: 'AI-2',
    desc: 'Densidad baja',
    minSqm: '300 m²',
    minFront: '12 m',
    maxHeight: '10 m / 3 plantas',
    fot: '2.0',
    fos: '0.65',
  },
  {
    zone: 'C2',
    desc: 'Corredor densidad 2',
    minSqm: '450 m²',
    minFront: '15 m',
    maxHeight: '19 m / 6 plantas',
    fot: '4.0',
    fos: '0.70',
  },
]

export const PERMITTED_USES =
  'Vivienda individual y colectiva, consultorios, gastronomía, comercio minorista, oficinas, gimnasio, salud, educación, servicios.'

export type LotStatus = 'DISPONIBLE' | 'RESERVADO' | 'VENDIDO' | 'FIDEICOMISO' | 'NO_COMERCIALIZABLE'

export const STATUS_LABELS: Record<LotStatus, string> = {
  DISPONIBLE:        'Disponible',
  RESERVADO:         'Reservado',
  VENDIDO:           'Vendido',
  FIDEICOMISO:       'Acuerdo privado',
  NO_COMERCIALIZABLE: 'No comercializable',
}

export const STATUS_COLORS: Record<LotStatus, string> = {
  DISPONIBLE:        'bg-green-100 text-green-800 border-green-300',
  RESERVADO:         'bg-yellow-100 text-yellow-800 border-yellow-300',
  VENDIDO:           'bg-red-100 text-red-800 border-red-300',
  FIDEICOMISO:       'bg-purple-100 text-purple-800 border-purple-300',
  NO_COMERCIALIZABLE: 'bg-gray-100 text-gray-500 border-gray-300',
}

// Nota: estos datos son de referencia estática.
// La disponibilidad real se gestiona en la planilla de Google Drive.
export const BLOCKS_SUMMARY = [
  { block: 4,  note: '100% vendida' },
  { block: 11, note: 'Lotes 7 y 8 mixtos disponibles + L13 y L14' },
]
