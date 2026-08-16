export const SITE = {
  name: 'Distrito Payé',
  tagline: 'Segunda Preventa — Corrientes Capital',
  developer: 'PAYÉ',
  broker: 'RE/MAX PAYÉ',
  ordinance: 'Ord. N.º 7403',
  location: 'Junto a viviendas del PROCREAR, zona de expansión urbana de Corrientes',
  stage: 'Etapa 1 de 3',
  totalBlocks: 14,
  WA_NUMBER: '+5493794000000', // ← REEMPLAZAR con número real
  WA_MESSAGE: 'Hola, me interesa información sobre Santa Catalina.',
  CONTACT_EMAIL: 'paye@remax.com.ar',
}

// ---------- Servicios de infraestructura ----------
// Estado real de ejecución de cada servicio, según el reporte de avance de
// obra de Payé Desarrollos (avance-2026-07.pdf, julio 2026). Luz eléctrica no
// aparece en ese reporte — dato aparte, confirmado directamente por el usuario.
export type ServiceStatus = 'ejecutado' | 'en_obra' | 'proyectado'

export const SERVICES: Array<{ label: string; status: ServiceStatus | null; detail: string | null }> = [
  { label: 'Agua corriente',  status: 'en_obra',    detail: '90% ejecutado' },
  { label: 'Luz eléctrica',   status: 'proyectado', detail: 'Esperando aprobación de DPEC' },
  { label: 'Cloaca',          status: 'en_obra',    detail: '90% ejecutado' },
  { label: 'Ripio',           status: 'en_obra',    detail: 'Apertura de calles en ejecución — sector oeste (jul. 2026)' },
  { label: 'Cordón cuneta',   status: 'en_obra',    detail: '7 de 14 manzanas ejecutadas (Mz 8–14 y Reserva Municipal 2)' },
]

// ---------- Entorno y accesos ----------
// Movido desde components/GoogleMapsLotMap.tsx (antes hardcodeado ahí, sin
// fuente única) — mismo contenido, ahora consumido también por #proyecto.
export const SURROUNDINGS = {
  travelTimes: [
    { label: 'Centro de Corrientes', time: '10 min' },
    { label: 'Terminal de Ómnibus', time: '7 min' },
    { label: 'Av. Maipú (acceso principal)', time: '2 min' },
    { label: 'Hospital Llano', time: '12 min' },
  ],
  nearbyServices: [
    'Colegios primarios',
    'Centros de salud',
    'Supermercados',
    'Transporte público',
    'Plazas y espacios verdes',
    'Bancos y cajeros',
  ],
}

// ---------- Etapas y cronograma de obra ----------
// PLANTILLA a completar con los datos reales del proyecto — las etapas de
// abajo son un punto de partida habitual para un loteo, renombrar/reordenar
// según corresponda. `status: null` se muestra en la página como "Por
// confirmar", nunca como si la etapa ya estuviera resuelta.
export type PhaseStatus = 'completado' | 'en_curso' | 'proyectado'

export const PROJECT_PHASES: Array<{
  label: string
  detail: string | null
  status: PhaseStatus | null
}> = [
  { label: 'Aprobación municipal',         detail: SITE.ordinance, status: 'completado' },
  { label: 'Apertura de calles y mensura', detail: 'Mensura aprobada por el Catastro de la Provincia de Corrientes; apertura de calles en ejecución (ver Servicios)', status: 'en_curso' },
  { label: 'Infraestructura de servicios', detail: 'Agua y cloaca 90% ejecutadas; cordón cuneta en 7 de 14 manzanas (jul. 2026)', status: 'en_curso' },
  { label: 'Escrituración',                detail: null, status: null },
]

// ---------- Escrituración y titularidad ----------
// Confirmado por el usuario, sin datos inventados.
export const DEED_INFO: {
  reservation: string | null
  timing: string | null
  titleStatus: string | null
} = {
  reservation: 'Cesión de derechos',
  timing: 'Al entregarse los lotes, en el acto de amojonamiento — la empresa notifica a cada cliente cuando esto suceda.',
  titleStatus: 'Escrituran los clientes que ya tengan libre de deuda emitido por la desarrolladora, presentando cesión de derechos, acta de amojonamiento y libre de deuda.',
}

export type LotSize = '12x26' | '12x28' | '12x30' | '15x30' | '15.55x30'

// Precios vigentes al 31/07/2026 (lista de precios PAYÉ). Las dos tipologías
// "Mixto" son lotes distintos (450 m² y 466,5 m²), no una sola con dos nombres.
export const LOT_TYPES: Record<LotSize, { label: string; dims: string; sqm: number; use: string }> = {
  '12x26':    { label: 'Residencial chico',   dims: '12 × 26 m',    sqm: 312,   use: 'Vivienda' },
  '12x28':    { label: 'Residencial mediano', dims: '12 × 28 m',    sqm: 336,   use: 'Vivienda' },
  '12x30':    { label: 'Residencial grande',  dims: '12 × 30 m',    sqm: 360,   use: 'Vivienda' },
  '15x30':    { label: 'Mixto chico',         dims: '15 × 30 m',    sqm: 450,   use: 'Vivienda + Comercio' },
  '15.55x30': { label: 'Mixto grande',        dims: '15,55 × 30 m', sqm: 466.5, use: 'Vivienda + Comercio' },
}

// El 5% de descuento al contado aplica a las 5 tipologías.
export const PRICES: Record<LotSize, { cashUSD: number; discount: number }> = {
  '12x26':    { cashUSD: 17160, discount: 0.05 },
  '12x28':    { cashUSD: 18480, discount: 0.05 },
  '12x30':    { cashUSD: 19800, discount: 0.05 },
  '15x30':    { cashUSD: 24750, discount: 0.05 },
  '15.55x30': { cashUSD: 25650, discount: 0.05 },
}

// Opción 1 — 12 cuotas, 30% de entrega. Sólo residencial (Mixto no tiene esta opción).
export const FINANCING_12: Partial<Record<LotSize, {
  downPesos: number; installmentPesos: number
  downUSD: number;   installmentUSD: number
}>> = {
  '12x26': { downPesos: 8236800, installmentPesos: 1601600, downUSD: 5150, installmentUSD: 1000 },
  '12x28': { downPesos: 8870400, installmentPesos: 1724800, downUSD: 5550, installmentUSD: 1080 },
  '12x30': { downPesos: 9504000, installmentPesos: 1848000, downUSD: 5940, installmentUSD: 1150 },
}

// Opción 2 — 18 cuotas en USD, 30% de entrega. Sólo Mixto (residencial no tiene esta opción).
export const FINANCING_18: Partial<Record<LotSize, {
  downUSD: number; installmentUSD: number; availability: string
}>> = {
  '15x30':    { downUSD: 7425, installmentUSD: 960,  availability: '9 lotes disponibles' },
  '15.55x30': { downUSD: 7695, installmentUSD: 1500, availability: '4 lotes disponibles' },
}

// Opción 3 — 36 cuotas en USD
export const FINANCING_36: Partial<Record<LotSize, {
  downUSD: number; installmentUSD: number; availability: string
}>> = {
  '12x26': { downUSD: 2000, installmentUSD: 590, availability: '2 lotes disponibles' },
  '12x28': { downUSD: 2000, installmentUSD: 650, availability: 'Consultar' },
  '12x30': { downUSD: 2000, installmentUSD: 700, availability: 'Consultar' },
  '15x30': { downUSD: 3000, installmentUSD: 920, availability: '9 lotes disponibles' },
}

// Confirmado por el usuario: los gastos de la operación son únicamente estos 3.
export const NOTARIAL_COSTS: Array<{ concept: string; value: string | null }> = [
  { concept: 'Honorarios escribanía',    value: '$645.000 pesos' },
  { concept: 'Impuesto de sellos',        value: '1% (calculado al dólar oficial)' },
  { concept: 'Honorarios inmobiliarios',  value: '3% en dólares (no incluido en precio)' },
]

// Fuente: Ordenanza N.º 7403 (09/11/2023) — "Plan de Sector 2, Áreas Residenciales
// y Mixtas", Unidad de Gestión N.º 2 del Plan Especial 2da Etapa de Urbanización
// Predios Santa Catalina. Anexo III (Normativa de Zonificación).
export const ZONING = [
  {
    zone: 'AI-1',
    desc: 'Área Interior — densidad media baja',
    minSqm: '300 m²',
    minFront: '12 m',
    maxHeight: '13 m / 4 plantas',
    fot: '2.8',
    fos: '0.70',
  },
  {
    zone: 'AI-2',
    desc: 'Área Interior — densidad baja',
    minSqm: '300 m²',
    minFront: '12 m',
    maxHeight: '10 m / 3 plantas',
    fot: '2.0',
    fos: '0.65',
  },
  {
    zone: 'C2',
    desc: 'Corredor densidad 2 — frentista a avenidas',
    minSqm: '450 m²',
    minFront: '15 m',
    maxHeight: '19 m / 6 plantas',
    fot: '4.0',
    fos: '0.70',
  },
  {
    zone: 'EP',
    desc: 'Equipamiento público',
    minSqm: '600 m²',
    minFront: '20 m',
    maxHeight: '19 m / 6 plantas',
    fot: '3.6',
    fos: '0.60',
  },
  {
    zone: 'EVP',
    desc: 'Espacio verde público — Parque Metropolitano',
    minSqm: '—',
    minFront: '—',
    maxHeight: '—',
    fot: '—',
    fos: '—',
  },
]

export const PERMITTED_USES =
  'Vivienda individual y colectiva, consultorios, gastronomía, comercio minorista, oficinas, gimnasio, salud, educación, servicios.'

// Usos no admitidos en toda la Unidad de Gestión 2 (Ordenanza N.º 7403, Anexo IV, 1.2).
export const PROHIBITED_USES =
  'Hipermercados; playas de estacionamiento para vehículos de gran porte (ómnibus, camiones); depósitos exclusivos (cuando no sean complementarios de otra actividad); cualquier actividad que manipule productos químicos, tóxicos, peligrosos, inflamables o explosivos.'

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
