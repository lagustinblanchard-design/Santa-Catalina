import type { LotStatus } from './data'

export type Lot = {
  id: string      // 'M1-L1'
  block: number   // 1–14
  lot: number     // número dentro de la manzana
  dims: string    // e.g. "12×30"
  sqm: number     // m²
  status: LotStatus
  price?: number  // USD contado (solo DISPONIBLE con precio publicado)
}

// Layout del plano (norte → sur):
//   Calle Pública (norte)
//   MZ 12  MZ  8  MZ  5  MZ  1   ← fila 1 (letras I J K L)
//   MZ 13  MZ  9  MZ  6  MZ  2   ← fila 2 (letras E F G H)
//   MZ 14  MZ 10  MZ  7  MZ  3   ← fila 3 (letras A B C D)
//   Calle Pública (sur)
//   Reserva Municipal 2 | Reserva Municipal 1
//   MZ 11 (ancha)       | MZ  4 (ancha)         ← letras N M
//   Av. Tito Aranda (ripio)
export const BLOCK_LETTER: Record<number, string> = {
   1: 'L',  2: 'H',  3: 'D',  4: 'M',
   5: 'K',  6: 'G',  7: 'C',  8: 'J',
   9: 'F', 10: 'B', 11: 'N', 12: 'I',
  13: 'E', 14: 'A',
}

// ---- helpers ----
type S = LotStatus
const V: S = 'VENDIDO', D: S = 'DISPONIBLE', R: S = 'RESERVADO',
      F: S = 'FIDEICOMISO', NC: S = 'NO_COMERCIALIZABLE'

// Precio de lista USD por dims crudo (mismo valor que PRICES[size].cashUSD en lib/data.ts,
// keyed sin el reemplazo 'x'→'×'). Única fuente: la usan lot() y priceForDims() más abajo,
// para no repetir estos 5 números en dos lugares que puedan desincronizarse.
const DIMS_PRICE_USD: Record<string, number> = {
  '12x26':    17160,
  '12x28':    18480,
  '12x30':    19800,
  '15x30':    24750,
  '15.55x30': 25650,
}

function lot(d: string, s: S): { dims: string; sqm: number; status: S; price?: number } {
  const [w, h] = d.split('x').map(Number)
  const sqm = Math.round(w * h)
  const price = s === 'DISPONIBLE' ? DIMS_PRICE_USD[d] : undefined
  return { dims: d.replace('x', '×'), sqm, status: s, price }
}

// ---- datos por manzana (fuente: planilla DISPONIBILIDAD LOTES - Drive) ----
const MZ: Record<number, ReturnType<typeof lot>[]> = {
  1: [
    lot('16.25x32',V), lot('15.5x32',D),  lot('15.5x32',D),  lot('15.5x32',F),
    lot('15.5x32',F),  lot('15.5x32',V),  lot('15.5x32',V),  lot('15.5x32',V),
    lot('12x30',V),    lot('12x30',D),    lot('12x30',D),    lot('12x30',D),
    lot('12x30',D),    lot('12x30',D),    lot('12x30',D),    lot('12x30',D),
    lot('12x30',V),    lot('15x32',V),    lot('15x32',D),    lot('15x32',D),
  ],
  2: [
    lot('16x32.5',V),   lot('15.5x32.5',V), lot('15.5x32.5',D), lot('15.5x32.5',V),
    lot('15x32.5',D),   lot('15.5x32.5',F), lot('15.5x32.5',F), lot('15.5x32.5',V),
    lot('16x32.5',V),   lot('16x30',V),     lot('12x30',V),     lot('12x30',D),
    lot('12x30',D),     lot('12x30',D),     lot('12x30',D),     lot('12x30',D),
    lot('12x30',D),     lot('12x30',V),     lot('12x30',V),     lot('16x30',V),
  ],
  3: [
    lot('15.5x32.5',V), lot('15.5x32.5',V), lot('15.5x32.5',V), lot('15.5x32.5',V),
    lot('15.5x32.5',V), lot('15.5x32.5',V), lot('15.5x32.5',V), lot('16.25x32',V),
    lot('16.25x32',V),  lot('15x32',V),     lot('15x32',V),     lot('12x30',V),
    lot('12x30',V),     lot('12x30',V),     lot('12x30',D),     lot('12x30',D),
    lot('12x30',V),     lot('12x30',R),     lot('12x30',V),     lot('12x30',V),
  ],
  4: [
    lot('15x30',V),     lot('15x30',V),     lot('15x30',V),     lot('15x30',V),
    lot('16.07x30',V),  lot('16.07x30',V),  lot('16.07x30',V),  lot('16.07x30',V),
    lot('16.07x30',V),  lot('16.07x30',V),  lot('16.08x30',V),  lot('16.08x30',V),
    lot('16.07x30',V),  lot('16.07x30',V),  lot('16.07x30',V),  lot('16.07x30',V),
    lot('16.07x30',V),  lot('16.07x30',V),
  ],
  5: [
    lot('15x30',V),  lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('12x30',D),  lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('12x26',V),  lot('12x26',V),  lot('12x26',V),  lot('12x26',V),
    lot('12x26',V),  lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('12x30',D),  lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('15x30',V),  lot('15x30',D),  lot('15x30',D),
  ],
  6: [
    lot('12x28',V),  lot('12x30',V),  lot('12x30',V),  lot('12x30',V),
    lot('12x30',V),  lot('12x30',V),  lot('12x30',V),  lot('12x30',V),
    lot('12x28',V),  lot('12x28',V),  lot('12x28',V),  lot('12x28',V),
    lot('12x28',V),  lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('12x30',D),  lot('12x30',V),  lot('12x30',D),  lot('12x30',D),
    lot('12x28',V),  lot('12x28',V),  lot('12x28',V),  lot('12x28',V),
  ],
  7: [
    lot('12x26',V),  lot('12x30',V),  lot('12x30',V),  lot('12x30',V),
    lot('12x30',V),  lot('12x30',V),  lot('12x30',V),  lot('12x30',V),
    lot('15x30',V),  lot('15x30',V),  lot('15x30',V),  lot('15x30',V),
    lot('12x30',NC), lot('12x30',NC), lot('12x30',NC), lot('12x30',NC),
    lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('12x26',V),  lot('12x26',V),  lot('12x26',V),  lot('12x26',V),
  ],
  8: [
    lot('15x30',V),  lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('12x30',D),  lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('12x26',V),  lot('12x26',V),  lot('12x26',V),  lot('12x26',V),
    lot('12x26',V),  lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('12x30',D),  lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('15x30',D),  lot('15x30',D),  lot('15x30',D),
  ],
  9: [
    lot('12x28',V),  lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('12x30',D),  lot('12x30',D),  lot('12x30',NC), lot('12x30',D),
    lot('12x28',V),  lot('12x28',V),  lot('12x28',V),  lot('12x28',V),
    lot('12x28',V),  lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('12x30',D),  lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('12x28',V),  lot('12x28',D),  lot('12x28',D),  lot('12x28',D),
  ],
  10: [
    lot('12x26',V),  lot('12x30',D),  lot('12x30',NC), lot('12x30',NC),
    lot('12x30',NC), lot('12x30',NC), lot('12x30',D),  lot('12x30',V),
    lot('15x30',V),  lot('15x30',D),  lot('15x30',V),  lot('15x30',V),
    lot('12x30',V),  lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('12x26',V),  lot('12x26',V),  lot('12x26',V),  lot('12x26',V),
  ],
  11: [
    lot('15.55x30',V), lot('15.55x30',V), lot('15.55x30',V), lot('15.55x30',V),
    lot('15.55x30',V), lot('15.55x30',V), lot('15.55x30',D), lot('15.55x30',D),
    lot('15.55x30',F), lot('15.55x30',F), lot('15.55x30',F), lot('15.55x30',F),
    lot('15.55x30',D), lot('15.55x30',D), lot('15.55x30',V), lot('15.55x30',V),
    lot('15.55x30',V), lot('15.55x30',V),
  ],
  12: [
    lot('15x30',V),  lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('12x30',D),  lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('12x26',R),  lot('12x26',V),  lot('12x26',V),  lot('12x26',V),
    lot('12x26',NC), lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('12x30',D),  lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('15x30',V),  lot('15x30',D),  lot('15x30',D),
  ],
  13: [
    lot('12x28',V),  lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('12x30',D),  lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('12x28',V),  lot('12x28',D),  lot('12x28',V),  lot('12x28',V),
    lot('12x28',V),  lot('12x30',NC), lot('12x30',NC), lot('12x30',D),
    lot('12x30',V),  lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('12x28',V),  lot('12x28',V),  lot('12x28',D),  lot('12x28',D),
  ],
  14: [
    lot('12x26',V),  lot('12x30',D),  lot('12x30',D),  lot('12x30',D),
    lot('12x30',V),  lot('12x30',D),  lot('12x30',D),  lot('12x30',V),
    lot('15x30',V),  lot('15x30',D),  lot('15x30',D),  lot('15x30',V),
    lot('12x30',NC), lot('12x30',NC), lot('12x30',F),  lot('12x30',NC),
    lot('12x30',D),  lot('12x30',V),  lot('12x30',D),
    lot('12x26',V),  lot('12x26',V),  lot('12x26',V),  lot('12x26',V),
  ],
}

export const LOTS: Lot[] = Object.entries(MZ).flatMap(([blockStr, defs]) => {
  const block = Number(blockStr)
  return defs.map((def, i) => ({
    id: `M${block}-L${i + 1}`,
    block,
    lot: i + 1,
    dims: def.dims,
    sqm: def.sqm,
    status: def.status,
    price: def.price,
  }))
})

function priceForDims(dims: string): number | undefined {
  return DIMS_PRICE_USD[dims.replace('×', 'x')]
}

export function applyStatuses(overrides: Record<string, import('./data').LotStatus>): Lot[] {
  return LOTS.map(lot => {
    const status = overrides[lot.id] ?? lot.status
    const price = status === 'DISPONIBLE' ? priceForDims(lot.dims) : undefined
    return { ...lot, status, price }
  })
}

export function getBlockLots(block: number): Lot[] {
  return LOTS.filter(l => l.block === block)
}

export function countByStatus(lots: Lot[]) {
  return lots.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1
    return acc
  }, {} as Record<LotStatus, number>)
}
