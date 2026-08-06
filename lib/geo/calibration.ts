// Calibración georreferenciada del loteo: coordenadas del plano (SVG) -> lat/lng real.
//
// Corregida contra el ortomosaico real del vuelo del 29/07 (ver public/ortho-2607.webp).
// La calibración anterior usaba un solo punto de referencia (M1-L1) y dejaba un
// desfasaje sistemático de ~11 m (medido con 5 cruces de calle reales como puntos de
// control) — visible como manzanas "corridas" pisando la calle. Este ajuste corrige
// traslación y escala; no es una rotación que crezca con la distancia.
//
// Única fuente de estas constantes. GoogleMapsLotMap.tsx y LotMap3D.tsx importan de acá
// — antes las tenían duplicadas literal, lo que permitía que se desincronizaran.
export const REF_SVG_X = 860.5 // M1-L1 center x
export const REF_SVG_Y = 303.4 // M1-L1 center y
export const REF_LAT = -27.5283803
export const REF_LNG = -58.8082423
export const A = 0.06351723 // m per SVG px
export const B = 0.42557488 // m per SVG px

const M_PER_DEG_LNG = 111320 * Math.cos((REF_LAT * Math.PI) / 180)

export function svgToLngLat(x: number, y: number): [number, number] {
  const dx = x - REF_SVG_X
  const dy = y - REF_SVG_Y
  const dE = A * dx + B * dy
  const dN = B * dx - A * dy
  return [REF_LNG + dE / M_PER_DEG_LNG, REF_LAT + dN / 111320]
}
