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

// Corrección local de la banda inferior (Reservas Municipales + manzanas 4 y 11).
//
// El ortomosaico se generó con ODM sin puntos de control en tierra (GCP/RTK), así que
// arrastra ~3,3% de error de escala: el plano dice manzanas de 60 m y 142,5 m, y la
// calibración las dibuja de 62 m y 147 m. Ese error se acumula con la distancia al punto
// de referencia (M1-L1, esquina noreste), así que es imperceptible en las filas 1-3 pero
// llega a ~10 m en la banda inferior — que es la más alejada. Efecto visible: las reservas
// y las manzanas 4 y 11 se dibujaban encima de la Calle Proyectada.
//
// El valor sale de medir sobre el ortomosaico, optimizando cada franja por separado:
// reservas -22 u y manzanas 4/11 -24 u (coinciden ⇒ es un corrimiento rígido de la banda,
// no una deformación). El salto cae dentro de la calle de 30 m que separa la fila 3 de las
// reservas, donde no se dibuja nada, así que no produce ninguna discontinuidad visible.
//
// NO se corrige lib/lot_geometry.json: ese archivo coincide exactamente con el plano de
// mensura (verificado contra las coordenadas vectoriales de public/Loteo Sta. Catalina.pdf)
// y de él salen también los planos SVG esquemáticos (InteractiveLotMap.tsx,
// scripts/avance-images/plano.mjs), que no van georreferenciados y deben seguir fieles al
// plano aprobado. La corrección vive acá, que es la capa plano → terreno.
const BOTTOM_BAND_Y = 1400
const BOTTOM_BAND_OFFSET_Y = -24

export function svgToLngLat(x: number, y: number): [number, number] {
  const dx = x - REF_SVG_X
  const dy = (y > BOTTOM_BAND_Y ? y + BOTTOM_BAND_OFFSET_Y : y) - REF_SVG_Y
  const dE = A * dx + B * dy
  const dN = B * dx - A * dy
  return [REF_LNG + dE / M_PER_DEG_LNG, REF_LAT + dN / 111320]
}
