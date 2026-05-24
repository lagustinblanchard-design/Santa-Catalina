'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import { type Lot } from '@/lib/lots'
import { STATUS_LABELS, type LotStatus } from '@/lib/data'

const STATUS_COLOR: Record<LotStatus, { fill: string; stroke: string }> = {
  DISPONIBLE:         { fill: '#bbf7d0', stroke: '#16a34a' },
  RESERVADO:          { fill: '#fef08a', stroke: '#ca8a04' },
  VENDIDO:            { fill: '#fecaca', stroke: '#dc2626' },
  FIDEICOMISO:        { fill: '#e9d5ff', stroke: '#9333ea' },
  NO_COMERCIALIZABLE: { fill: '#e5e7eb', stroke: '#9ca3af' },
}
const STATUS_HOVER: Record<LotStatus, string> = {
  DISPONIBLE:         '#4ade80',
  RESERVADO:          '#fde047',
  VENDIDO:            '#f87171',
  FIDEICOMISO:        '#c084fc',
  NO_COMERCIALIZABLE: '#d1d5db',
}

const STATUSES = Object.keys(STATUS_LABELS) as LotStatus[]

// Georeferencing: SVG → lat/lng
const REF_SVG_X = 860.5       // M1-L1 center x
const REF_SVG_Y = 303.4       // M1-L1 center y
const REF_LAT   = -27.528473
const REF_LNG   = -58.808283
const A =  0.06245549         // m per SVG px — four-point conformal transform
const B =  0.41846104         // m per SVG px
const M_PER_DEG_LNG = 111320 * Math.cos((REF_LAT * Math.PI) / 180)

function svgToLatLng(x: number, y: number): google.maps.LatLngLiteral {
  const dx = x - REF_SVG_X
  const dy = y - REF_SVG_Y
  const dE = A * dx + B * dy
  const dN = B * dx - A * dy
  return {
    lat: REF_LAT + dN / 111320,
    lng: REF_LNG + dE / M_PER_DEG_LNG,
  }
}

function lotToPolygon(coords: [number, number, number, number]): google.maps.LatLngLiteral[] {
  const [x0, y0, x1, y1] = coords
  return [
    svgToLatLng(x0, y0),
    svgToLatLng(x1, y0),
    svgToLatLng(x1, y1),
    svgToLatLng(x0, y1),
  ]
}

import GEO from '@/lib/lot_geometry.json'
const lots_GEO = GEO.lots as unknown as Record<string, [number, number, number, number]>

const RESERVES = [
  { name: 'Reserva Municipal 1', coords: [537.7, 1447.2, 879.9, 1592.4] as [number,number,number,number] },
  { name: 'Reserva Municipal 2', coords: [153.5, 1446.5, 489.7, 1591.7] as [number,number,number,number] },
]

export default function GoogleMapsLotMap({ lots }: { lots: Lot[] }) {
  const mapRef    = useRef<HTMLDivElement>(null)
  const mapObj    = useRef<google.maps.Map | null>(null)
  const polygons  = useRef<Map<string, google.maps.Polygon>>(new Map())
  const infoWin   = useRef<google.maps.InfoWindow | null>(null)

  const [activeFilter, setFilter] = useState<LotStatus | 'ALL'>('ALL')
  const [loaded, setLoaded]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const totalCounts = Object.fromEntries(
    STATUSES.map(s => [s, lots.filter(l => l.status === s).length])
  ) as Record<LotStatus, number>

  // Init Google Maps
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey || apiKey === 'TU_API_KEY_AQUI') {
      setError('Falta la API key de Google Maps en .env.local')
      return
    }
    setOptions({ key: apiKey, v: 'weekly' })
    importLibrary('maps').then(() => setLoaded(true)).catch(() => setError('No se pudo cargar Google Maps'))
  }, [])

  // Build map + polygons once loaded
  useEffect(() => {
    if (!loaded || !mapRef.current) return

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: -27.530160, lng: -58.805462 },
      zoom: 16,
      mapTypeId: 'satellite',
      tilt: 0,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    })
    mapObj.current = map
    infoWin.current = new google.maps.InfoWindow()

    lots.forEach(lot => {
      const coords = lots_GEO[lot.id]
      if (!coords) return
      const path = lotToPolygon(coords)
      const { fill, stroke } = STATUS_COLOR[lot.status]

      const poly = new google.maps.Polygon({
        paths: path,
        fillColor: fill,
        fillOpacity: 0.7,
        strokeColor: stroke,
        strokeWeight: 1,
        map,
      })

      poly.addListener('click', (e: google.maps.MapMouseEvent) => {
        const content = `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;width:210px;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.15)">
            <div style="background:${stroke};padding:12px 14px 10px">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.75);margin-bottom:2px">Manzana ${lot.block} · Lote ${lot.lot}</div>
              <div style="font-size:15px;font-weight:700;color:#fff">${STATUS_LABELS[lot.status]}</div>
            </div>
            <div style="background:#fff;padding:12px 14px">
              <div style="display:flex;gap:10px;margin-bottom:${lot.status === 'DISPONIBLE' && lot.price ? '10px' : '0'}">
                <div style="flex:1;background:#f8fafc;border-radius:7px;padding:8px 10px">
                  <div style="font-size:10px;color:#94a3b8;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:2px">Frente</div>
                  <div style="font-size:13px;font-weight:700;color:#1e293b">${lot.dims.split('×')[0]?.trim() ?? lot.dims} m</div>
                </div>
                <div style="flex:1;background:#f8fafc;border-radius:7px;padding:8px 10px">
                  <div style="font-size:10px;color:#94a3b8;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:2px">Superficie</div>
                  <div style="font-size:13px;font-weight:700;color:#1e293b">${lot.sqm} m²</div>
                </div>
              </div>
              ${lot.status === 'DISPONIBLE' && lot.price ? `
              <div style="background:#fff7f7;border:1.5px solid #fecaca;border-radius:7px;padding:8px 10px;margin-bottom:10px">
                <div style="font-size:10px;color:#94a3b8;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:2px">Precio</div>
                <div style="font-size:18px;font-weight:800;color:#dc2626">USD ${lot.price.toLocaleString('es-AR')}</div>
              </div>` : ''}
              ${lot.status === 'DISPONIBLE' ? `
              <a href="#contacto" style="display:block;text-align:center;background:#dc2626;color:#fff;font-size:13px;font-weight:700;padding:9px;border-radius:7px;text-decoration:none;letter-spacing:0.03em">Consultar disponibilidad →</a>` : ''}
            </div>
          </div>`
        infoWin.current?.setContent(content)
        infoWin.current?.setPosition(e.latLng)
        infoWin.current?.open(map)
      })

      poly.addListener('mouseover', () => {
        poly.setOptions({ fillColor: STATUS_HOVER[lot.status], fillOpacity: 0.9 })
      })
      poly.addListener('mouseout', () => {
        poly.setOptions({ fillColor: fill, fillOpacity: 0.7 })
      })

      polygons.current.set(lot.id, poly)
    })

    // Draw municipal reserves
    RESERVES.forEach(reserve => {
      const path = lotToPolygon(reserve.coords)
      const poly = new google.maps.Polygon({
        paths: path,
        fillColor: '#bbf7d0',
        fillOpacity: 0.5,
        strokeColor: '#15803d',
        strokeWeight: 2,
        map,
        zIndex: 0,
      })
      poly.addListener('click', (e: google.maps.MapMouseEvent) => {
        infoWin.current?.setContent(
          `<div style="font-family:inherit;font-size:13px;font-weight:600;color:#15803d">${reserve.name}</div>`
        )
        infoWin.current?.setPosition(e.latLng)
        infoWin.current?.open(map)
      })
    })
  }, [loaded, lots])

  // Apply filter
  useEffect(() => {
    polygons.current.forEach((poly, id) => {
      const lot = lots.find(l => l.id === id)
      if (!lot) return
      const filtered = activeFilter !== 'ALL' && lot.status !== activeFilter
      const { fill, stroke } = STATUS_COLOR[lot.status]
      poly.setOptions({
        fillColor:   filtered ? '#e2e8f0' : fill,
        fillOpacity: filtered ? 0.3 : 0.7,
        strokeColor: filtered ? '#cbd5e1' : stroke,
        clickable:   !filtered,
      })
    })
  }, [activeFilter, lots])

  const handleFilterClick = useCallback((s: LotStatus) => {
    setFilter(prev => prev === s ? 'ALL' : s)
  }, [])

  return (
    <section id="lotes" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-6xl px-6">

        <div className="mb-10 text-center">
          <span className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white" style={{ backgroundColor: '#FF1200' }}>
            Disponibilidad
          </span>
          <h2 className="text-4xl font-black text-gray-900">Mapa interactivo del loteo</h2>
          <p className="mt-3 text-gray-500 text-sm">
            Hacé clic en cada lote para ver su estado y precio
          </p>
        </div>

        {/* Filter buttons */}
        <div className="mb-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setFilter('ALL')}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              activeFilter === 'ALL'
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Todos
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-700">{lots.length}</span>
          </button>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => handleFilterClick(s)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                activeFilter === s
                  ? 'border-gray-700 bg-gray-700 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="inline-block h-3 w-3 rounded-full border"
                style={{ backgroundColor: STATUS_COLOR[s].fill, borderColor: STATUS_COLOR[s].stroke }} />
              {STATUS_LABELS[s]}
              {(totalCounts[s] ?? 0) > 0 && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">{totalCounts[s]}</span>
              )}
            </button>
          ))}
        </div>

        {/* Map */}
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 560 }}>
          {error ? (
            <div className="flex h-full items-center justify-center bg-gray-100">
              <div className="text-center">
                <p className="text-sm font-medium text-red-600">{error}</p>
                <p className="mt-2 text-xs text-gray-500">Agregá NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en .env.local</p>
              </div>
            </div>
          ) : !loaded ? (
            <div className="flex h-full items-center justify-center bg-gray-100">
              <p className="text-sm text-gray-400">Cargando mapa…</p>
            </div>
          ) : null}
          <div ref={mapRef} className="h-full w-full" />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Disponibilidad orientativa.{' '}
            <a href="#contacto" className="font-medium underline" style={{ color: '#FF1200' }}>Consultá disponibilidad exacta</a>.
          </p>
          <a
            href="/Loteo Sta. Catalina.pdf"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Ver plano original
          </a>
        </div>
      </div>
    </section>
  )
}
