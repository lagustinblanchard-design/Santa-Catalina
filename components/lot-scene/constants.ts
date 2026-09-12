// Constantes visuales del showroom 3D — compartidas por LotMap3D (/mapa-3d, con todo
// el chrome) y LotScene (canvas puro, sin chrome, usado también por /v4). Extraído de
// components/LotMap3D.tsx sin cambiar ningún valor: el criterio de no-regresión es que
// /mapa-3d y la captura ?reel=1 salgan idénticas a como salían antes de este refactor.
import { LightingEffect, AmbientLight, DirectionalLight } from '@deck.gl/core'
import type { LotStatus } from '@/lib/data'

export const STATUS_RGB: Record<LotStatus, [number, number, number]> = {
  DISPONIBLE: [22, 163, 74],
  RESERVADO: [202, 138, 4],
  VENDIDO: [220, 38, 38],
  FIDEICOMISO: [147, 51, 234],
  NO_COMERCIALIZABLE: [156, 163, 175],
}
export const STATUS_HEX: Record<LotStatus, string> = {
  DISPONIBLE: '#16a34a',
  RESERVADO: '#ca8a04',
  VENDIDO: '#dc2626',
  FIDEICOMISO: '#9333ea',
  NO_COMERCIALIZABLE: '#9ca3af',
}
export const STATUS_ELEV: Record<LotStatus, number> = {
  DISPONIBLE: 4,
  RESERVADO: 3,
  VENDIDO: 2,
  FIDEICOMISO: 2,
  NO_COMERCIALIZABLE: 1.5,
}

export const RESERVES: { name: string; coords: [number, number, number, number] }[] = [
  { name: 'Reserva Municipal 1', coords: [537.7, 1447.2, 879.9, 1592.4] },
  { name: 'Reserva Municipal 2', coords: [153.5, 1446.5, 489.7, 1591.7] },
]

// ---------- Terreno fotorrealista (malla de dron, vía Cesium ion) ----------
// Dormido hasta que exista la captura real. Con las env vars vacías, HAS_TERRAIN_MESH
// es false y todo lo demás se comporta exactamente igual que sin esta rama.
export const ION_ASSET_ID = process.env.NEXT_PUBLIC_CESIUM_ION_ASSET_ID
export const ION_TOKEN = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN
export const HAS_TERRAIN_MESH = Boolean(ION_ASSET_ID && ION_TOKEN)
// Offset de cota para asentar los lotes sobre la malla real (Corrientes es muy plano;
// alcanza con una constante — afinar a ojo cuando la malla esté cargada).
export const TERRAIN_BASE_ELEV = Number(process.env.NEXT_PUBLIC_TERRAIN_BASE_ELEV ?? 0)

// ---------- Dúplex futuros (se completa cuando lleguen los modelos) ----------
export type DuplexModel = { lotId: string; url: string; heading?: number; sizeScale?: number; tipologia?: string }
export const MODELS: DuplexModel[] = []

export const LABEL_MIN_ZOOM = 16.4 // etiquetas de lote sólo al acercarse

// Iluminación "hora dorada": luz cálida rasante + relleno frío tenue + sombra proyectada.
// Función, no singleton: un Effect de deck.gl hace setup(context)/cleanup(context) por
// instancia de Deck, y /v4 y /mapa-3d pueden convivir montados a la vez tras una
// navegación client-side — compartir un objeto haría que el cleanup de uno le
// desarmara los recursos al otro. Cada LotScene crea la suya con useMemo.
export function createLightingEffect() {
  return new LightingEffect({
    ambient: new AmbientLight({ color: [180, 200, 230], intensity: 0.55 }),
    sun: new DirectionalLight({
      color: [255, 190, 130],
      intensity: 1.0,
      direction: [-0.75, -0.55, -0.25],
    }),
  })
}
