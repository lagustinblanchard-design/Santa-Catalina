// Ortomosaico real del loteo, procesado con OpenDroneMap (--fast-orthophoto) a partir
// del vuelo del 29/07. Reemplaza al satélite de Esri/Google (desactualizado, muestra el
// campo antes del loteo) dentro de su huella de cobertura.
export const ORTHO_URL = '/ortho-2607.webp'
export const ORTHO_DATE = '2026-07-29'

// [west, south, east, north] en grados WGS84 — de gdalwarp -t_srs EPSG:4326 sobre el
// odm_orthophoto.tif original, no recalculado a mano.
export const ORTHO_BOUNDS: [number, number, number, number] = [
  -58.809258, -27.5322673, -58.8012783, -27.5278509,
]
