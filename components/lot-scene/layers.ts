// Construcción de las capas deck.gl del showroom 3D — extraído de components/LotMap3D.tsx
// sin cambiar valores ni comentarios de calibración (mismo criterio de no-regresión).
// Función pura: LotScene.tsx la llama dentro de su propio useMemo con las deps correctas.
import { PolygonLayer, BitmapLayer, TextLayer } from '@deck.gl/layers'
import { TileLayer, Tile3DLayer } from '@deck.gl/geo-layers'
import { ScenegraphLayer } from '@deck.gl/mesh-layers'
import { CesiumIonLoader } from '@loaders.gl/3d-tiles'
import type { LotStatus } from '@/lib/data'
import { ORTHO_URL, ORTHO_BOUNDS } from '@/lib/ortho'
import { FeatherExtension } from '@/lib/geo/feather-extension'
import { rectToPolygon, centroid, rectForLot, type LotFeature } from './geometry'
import {
  STATUS_RGB, RESERVES, MODELS, ION_ASSET_ID, ION_TOKEN, TERRAIN_BASE_ELEV, type DuplexModel,
} from './constants'
import { STATUS_ELEV } from './constants'
import { MAIN_STREETS, type MainStreet } from './streets'

const featherExtension = new FeatherExtension()

export type BuildLayersOptions = {
  features: LotFeature[]
  filter: LotStatus | 'ALL'
  spotlight: LotStatus | null
  zoomedIn: boolean
  showMesh: boolean
  onLotClick?: (f: LotFeature) => void
}

export function isDimStatus(s: LotStatus, filter: LotStatus | 'ALL', spotlight: LotStatus | null): boolean {
  return spotlight ? s !== spotlight : filter !== 'ALL' && s !== filter
}

export function buildLayers({ features, filter, spotlight, zoomedIn, showMesh, onLotClick }: BuildLayersOptions) {
  const isDim = (s: LotStatus) => isDimStatus(s, filter, spotlight)

  // Satélite Esri — capa base en modo disponibilidad, o fallback si no hay malla real todavía.
  const base = showMesh
    ? null
    : new TileLayer({
        id: 'esri-satellite',
        data: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        minZoom: 0,
        // 19 dejaba huecos rosa/malva en el horizonte lejano (se veía el <div> de cielo
        // detrás): @deck.gl/geo-layers, con pitch <= 60, fija la selección de tiles en
        // maxZoom sin permitir tiles más gruesos de respaldo (tile-2d-traversal.js:146),
        // así que el horizonte necesitaría una cantidad impracticable de tiles z19.
        // 17 ≈ 1,06 m/px, casi 1:1 con la vista por defecto (zoom 17,1) — nítido donde se
        // ve, y 16x menos tiles que z19 para cubrir el horizonte.
        maxZoom: 17,
        tileSize: 256,
        renderSubLayers: (props) => {
          // @ts-expect-error tile.bbox existe en modo geoespacial
          const { west, south, east, north } = props.tile.bbox
          return new BitmapLayer(props, {
            data: undefined,
            image: props.data,
            bounds: [west, south, east, north],
            // El satélite es el entorno, no el producto: algo desaturado para no competir
            // con el ortomosaico del dron.
            desaturate: 0.35,
          })
        },
      })

  // Ortomosaico real del vuelo (ver lib/ortho.ts) — se dibuja sobre el satélite Esri,
  // pero sólo cubre su propia huella de vuelo. Se apaga en modo 'fotorrealista'.
  const orthophoto = showMesh
    ? null
    : new BitmapLayer({
        id: 'ortho-dron',
        image: ORTHO_URL,
        bounds: ORTHO_BOUNDS,
        pickable: false,
        // Difumina el borde para que no corte duro contra el satélite de abajo
        // (ver lib/geo/feather-extension.ts).
        extensions: [featherExtension],
      })

  // Malla real capturada con dron (Cesium ion) — sólo si hay asset configurado y el
  // usuario prendió el toggle "Vista fotorrealista". Dormida (null) en el resto de los casos.
  const terrainMesh = showMesh
    ? new Tile3DLayer({
        id: 'terreno-dron',
        data: `https://assets.ion.cesium.com/${ION_ASSET_ID}/tileset.json`,
        loaders: [CesiumIonLoader],
        loadOptions: { 'cesium-ion': { accessToken: ION_TOKEN } },
        pickable: false,
      })
    : null

  const reserves = new PolygonLayer<{ name: string; coords: [number, number, number, number] }>({
    id: 'reservas',
    data: RESERVES,
    getPolygon: (d) => rectToPolygon(d.coords),
    extruded: true,
    getElevation: 1,
    getFillColor: [34, 197, 94, 90],
    getLineColor: [21, 128, 61, 200],
    getLineWidth: 1,
    lineWidthMinPixels: 1,
    stroked: true,
    pickable: false,
  })

  const lotsLayer = new PolygonLayer<LotFeature>({
    id: 'lotes',
    data: features,
    extruded: true,
    wireframe: true,
    getPolygon: (d) => d.polygon,
    // Sobre la malla real, sumar el offset de terreno para que los lotes se asienten
    // en el piso capturado en vez de flotar/enterrarse en el plano lat/lng.
    getElevation: (d) => STATUS_ELEV[d.status] + (showMesh ? TERRAIN_BASE_ELEV : 0),
    getFillColor: (d) => {
      const [r, g, b] = STATUS_RGB[d.status]
      // Más translúcido deja ver la textura real debajo del color. En vista
      // fotorrealista, aún más translúcido para no tapar la malla.
      const base = showMesh ? 90 : 130
      return [r, g, b, isDim(d.status) ? (showMesh ? 15 : 40) : base]
    },
    getLineColor: (d) => {
      const [r, g, b] = STATUS_RGB[d.status]
      return [r, g, b, isDim(d.status) ? 60 : 255]
    },
    getLineWidth: 0.5,
    lineWidthMinPixels: 1,
    stroked: true,
    material: { ambient: 0.45, diffuse: 0.85, shininess: 24, specularColor: [255, 224, 190] },
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 120],
    onClick: (info) => {
      const f = info.object as LotFeature | undefined
      if (f && !isDim(f.status)) onLotClick?.(f)
    },
    updateTriggers: {
      getFillColor: [filter, spotlight, showMesh],
      getLineColor: [filter, spotlight],
      getElevation: [showMesh],
    },
    // Transición de atributo nativa de deck.gl (GPU, sin costo de React) — 600ms, el
    // mismo orden de magnitud que --duration-panel/--duration-reveal del resto del sitio.
    transitions: { getFillColor: 600, getLineColor: 600 },
  })

  // Dúplex glTF — solo si hay modelos cargados
  const modelLayers = MODELS.length
    ? [
        new ScenegraphLayer<DuplexModel>({
          id: 'duplex-models',
          data: MODELS.filter((m) => rectForLot(m.lotId)),
          scenegraph: (d: DuplexModel) => d.url,
          getPosition: (d: DuplexModel) => centroid(rectForLot(d.lotId)!),
          getOrientation: (d: DuplexModel) => [0, d.heading ?? 0, 90],
          sizeScale: 1,
          _lighting: 'pbr',
          pickable: true,
        }),
      ]
    : []

  // Calles principales geolocalizadas (ver ./streets.ts) — a diferencia de las
  // etiquetas de lote de abajo, sin puerta de zoom: son sólo 4 y sirven
  // justamente para orientarse en las vistas amplias del recorrido (hay
  // waypoints en zoom 16.2-16.4, por debajo de LABEL_MIN_ZOOM). Un poco más
  // grandes/opacas que el número de lote para que lean como nombre de calle.
  const streetLabels = new TextLayer<MainStreet>({
    id: 'main-streets',
    data: MAIN_STREETS,
    getPosition: (d) => [...d.position, 0.8],
    getText: (d) => d.name,
    // El default de TextLayer es sólo ASCII imprimible (32-127) — sin esto, cada
    // tilde/Ñ de "Calle Pública", "Av. Tito Aranda" etc. se dibuja en blanco
    // ("Missing character: ú"). 'auto' arma el atlas a partir del texto real.
    characterSet: 'auto',
    getSize: 13,
    sizeUnits: 'pixels',
    fontWeight: 700,
    getColor: [255, 255, 255, 235],
    background: true,
    getBackgroundColor: [20, 20, 20, 130],
    backgroundPadding: [5, 3],
    billboard: true,
    pickable: false,
  })

  // Etiquetas de lote — sólo al acercarse (evita empapelar el plano en la vista general).
  const labels = zoomedIn
    ? [
        new TextLayer<LotFeature>({
          id: 'lot-labels',
          data: features.filter((f) => !isDim(f.status)),
          getPosition: (d) => [...d.position, STATUS_ELEV[d.status] + 1.2] as [number, number, number],
          getText: (d) => String(d.lot),
          getSize: 11,
          sizeUnits: 'pixels',
          getColor: [255, 255, 255, 230],
          background: true,
          getBackgroundColor: [20, 20, 20, 110],
          backgroundPadding: [3, 1],
          getPixelOffset: [0, -2],
          billboard: true,
          pickable: false,
        }),
      ]
    : []

  return [base, orthophoto, terrainMesh, reserves, lotsLayer, ...modelLayers, streetLabels, ...labels].filter(Boolean)
}
