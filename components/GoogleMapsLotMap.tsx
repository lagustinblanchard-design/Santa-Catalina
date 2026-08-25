'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import type { ReactElement } from 'react'
import { type Lot } from '@/lib/lots'
import { STATUS_LABELS, SURROUNDINGS, type LotStatus } from '@/lib/data'
import { svgToLngLat } from '@/lib/geo/calibration'

// Iconos por tiempo de viaje, keyeados por label — el contenido (SURROUNDINGS)
// vive en lib/data.ts, esto es sólo la parte visual de este componente.
const TRAVEL_ICONS: Record<string, ReactElement> = {
  'Centro de Corrientes': <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />,
  'Terminal de Ómnibus': <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />,
  'Av. Maipú (acceso principal)': <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />,
  'Hospital Llano': <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
}

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

// Georeferencing: SVG → lat/lng (ver lib/geo/calibration.ts)
function svgToLatLng(x: number, y: number): google.maps.LatLngLiteral {
  const [lng, lat] = svgToLngLat(x, y)
  return { lat, lng }
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

  const [activeFilter, setFilter]   = useState<LotStatus | 'ALL'>('ALL')
  const [loaded, setLoaded]         = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [mapType, setMapType]       = useState<'satellite' | 'hybrid' | 'roadmap'>('satellite')

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
      zoom: 17,
      mapTypeId: 'satellite',
      tilt: 0,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      maxZoom: 21,
      // 'cooperative': un dedo scrollea la página, dos dedos mueven el mapa (con overlay
      // "Usá dos dedos"). Con 'greedy' el mapa capturaba el scroll de la landing en mobile.
      gestureHandling: 'cooperative',
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

  const handleMapType = useCallback((type: 'satellite' | 'hybrid' | 'roadmap') => {
    setMapType(type)
    mapObj.current?.setMapTypeId(type)
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

        {/* Split: map + connectivity */}
        <div className="grid gap-6 lg:grid-cols-5" style={{ minHeight: 560 }}>

          {/* Map — 3/5 */}
          <div className="lg:col-span-3 flex flex-col gap-3">

            {/* Layer switcher */}
            <div className="flex gap-2">
              {([
                { id: 'satellite', label: 'Satélite' },
                { id: 'hybrid',    label: 'Geolocalización' },
                { id: 'roadmap',   label: 'Mapa' },
              ] as const).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => handleMapType(id)}
                  className="rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors"
                  style={{
                    background:   mapType === id ? '#2E2A26' : '#fff',
                    color:        mapType === id ? '#fff'    : '#2E2A26',
                    borderColor:  mapType === id ? '#2E2A26' : '#D8D2C7',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm flex-1" style={{ minHeight: 500 }}>
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                Disponibilidad orientativa.{' '}
                <a href="#contacto" className="font-medium underline" style={{ color: '#FF1200' }}>Consultá disponibilidad exacta</a>.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/mapa-3d"
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#AA1120' }}
                >
                  Ver en 3D →
                </Link>
                <a
                  href="/Loteo Sta. Catalina.pdf"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Ver plano de Mensura
                </a>
              </div>
            </div>
          </div>

          {/* Connectivity panel — 2/5 */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Address */}
            <div className="rounded-2xl p-5 text-white" style={{ background: '#2E2A26' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#AA1120' }}>Ubicación</p>
              <p className="font-bold text-lg leading-snug">Barrio Santa Catalina</p>
              <p className="text-sm mt-1" style={{ color: '#D8D2C7' }}>Zona de expansión urbana — Corrientes Capital</p>
              <p className="text-xs mt-2" style={{ color: '#6B6660' }}>Junto a viviendas del PROCREAR · Ord. N.º 7403</p>
            </div>

            {/* Key distances */}
            <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#D8D2C7' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#8A6A47' }}>Tiempos de viaje</p>
              <div className="space-y-3">
                {SURROUNDINGS.travelTimes.map(({ label, time }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: '#AA1120' }}>
                        {TRAVEL_ICONS[label]}
                      </svg>
                      <span className="text-sm" style={{ color: '#2E2A26' }}>{label}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: '#AA1120' }}>{time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nearby services */}
            <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#D8D2C7' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#8A6A47' }}>Servicios cercanos</p>
              <div className="grid grid-cols-2 gap-2">
                {SURROUNDINGS.nearbyServices.map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: '#16a34a' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="text-xs" style={{ color: '#6B6660' }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
