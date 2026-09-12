import type { MapViewState } from '@deck.gl/core'

// Calibrado a mano con /v4/calibrar (ver ese archivo — se puede borrar una vez
// que este valor esté afinado del todo) para que calce con el recorte del
// ortomosaico real que usa la etapa "hoy" del sticky: el handoff foto→3D
// tiene que sentirse como el mismo dibujo, no un salto de cámara.
export const HANDOFF_VIEW: MapViewState = {
  longitude: -58.8052705,
  latitude: -27.5297,
  zoom: 16.75,
  pitch: 0,
  bearing: 0,
}

// Vista final del beat "3D en vivo": misma posición, más retirada e
// inclinada, para leer el conjunto de manzanas antes de soltar el sticky.
export const REVEAL_VIEW: MapViewState = {
  ...HANDOFF_VIEW,
  zoom: HANDOFF_VIEW.zoom! - 0.35,
  pitch: 45,
  bearing: -12,
}
