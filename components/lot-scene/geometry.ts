// Geometría de los 306 lotes — extraído de components/LotMap3D.tsx sin cambiar la
// lógica (mismo criterio de no-regresión que constants.ts/camera.ts).
import { type Lot } from '@/lib/lots'
import type { LotStatus } from '@/lib/data'
import GEO from '@/lib/lot_geometry.json'
import { svgToLngLat } from '@/lib/geo/calibration'

const LOTS_GEO = GEO.lots as unknown as Record<string, [number, number, number, number]>

export function rectToPolygon(c: [number, number, number, number]): [number, number][] {
  const [x0, y0, x1, y1] = c
  return [svgToLngLat(x0, y0), svgToLngLat(x1, y0), svgToLngLat(x1, y1), svgToLngLat(x0, y1)]
}

export function centroid(c: [number, number, number, number]): [number, number] {
  return svgToLngLat((c[0] + c[2]) / 2, (c[1] + c[3]) / 2)
}

export function rectForLot(lotId: string): [number, number, number, number] | undefined {
  return LOTS_GEO[lotId]
}

export type LotFeature = {
  id: string
  block: number
  lot: number
  dims: string
  sqm: number
  status: LotStatus
  price?: number
  polygon: [number, number][]
  position: [number, number]
}

export function buildFeatures(lots: Lot[]): LotFeature[] {
  return lots
    .map((l) => {
      const rect = LOTS_GEO[l.id]
      if (!rect) return null
      return {
        id: l.id,
        block: l.block,
        lot: l.lot,
        dims: l.dims,
        sqm: l.sqm,
        status: l.status,
        price: l.price,
        polygon: rectToPolygon(rect),
        position: centroid(rect),
      } as LotFeature
    })
    .filter(Boolean) as LotFeature[]
}
