// Rótulos de las calles principales del loteo, geolocalizados sobre el terreno
// real del recorrido 3D. Los puntos (x, y) NO son geometría nueva: son los
// mismos anclajes que ya usa el plano esquemático 2D (components/project/
// AvanceObraMap.tsx:166-169, derivado de lib/plano.ts, congelado contra el
// plano de mensura aprobado) — acá sólo se convierten a lat/lng real con la
// misma calibración que usan lotes y reservas (lib/geo/calibration.ts), para
// que el nombre de cada calle caiga sobre su posición real en el ortomosaico.
import { svgToLngLat } from '@/lib/geo/calibration'

export type MainStreet = {
  name: string
  position: [number, number] // [lng, lat]
}

const RAW: Array<{ name: string; x: number; y: number }> = [
  { name: 'Calle Pública (Norte)', x: 517, y: 252 },
  { name: 'Calle Pública (Sur)', x: 517, y: 1622 },
  { name: 'Av. Tito Aranda (ripio)', x: 517, y: 1822 },
  { name: 'Av. Dalmasio Esquivel (asfalto)', x: 912, y: 1020 },
]

export const MAIN_STREETS: MainStreet[] = RAW.map((s) => ({
  name: s.name,
  position: svgToLngLat(s.x, s.y),
}))
