import { promises as fs } from 'fs'
import path from 'path'
import { LOTS, applyStatuses, BLOCK_LETTER } from '@/lib/lots'
import { fetchLotStatuses } from '@/lib/sheets'
import { STATUS_LABELS } from '@/lib/data'

// Ruta de uso puntual: genera el CSV para importar en Google My Maps
// (un pin por lote, estilo el video). Se puede borrar después de generar el archivo.
// Uso: abrir /api/export-mymaps → descarga mymaps-santacatalina.csv

type Geo = {
  features: {
    properties: { id: string }
    geometry: { coordinates: number[][][] }
  }[]
}

// centroide simple = promedio del anillo exterior (sin repetir el vértice de cierre)
function centroid(ring: number[][]): { lng: number; lat: number } {
  const pts = ring.slice(0, -1) // el último vértice repite el primero
  const sum = pts.reduce((a, [lng, lat]) => ({ lng: a.lng + lng, lat: a.lat + lat }), { lng: 0, lat: 0 })
  return { lng: sum.lng / pts.length, lat: sum.lat / pts.length }
}

function csvCell(v: string | number): string {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET() {
  // estados en vivo desde Sheets (fallback a hardcodeados)
  let lots = LOTS
  try {
    lots = applyStatuses(await fetchLotStatuses())
  } catch {
    // sheet no disponible
  }
  const byId = new Map(lots.map(l => [l.id, l]))

  const raw = await fs.readFile(path.join(process.cwd(), 'public', 'lots.geojson'), 'utf8')
  const geo = JSON.parse(raw) as Geo

  const header = ['Nombre', 'latitud', 'longitud', 'Manzana', 'Lote', 'Estado', 'Dimensiones', 'm2', 'PrecioUSD']
  const rows = [header.join(',')]

  for (const f of geo.features) {
    const lot = byId.get(f.properties.id)
    if (!lot) continue
    const { lat, lng } = centroid(f.geometry.coordinates[0])
    rows.push([
      `L${lot.lot}`,
      lat.toFixed(7),
      lng.toFixed(7),
      `MZ ${lot.block} (${BLOCK_LETTER[lot.block] ?? ''})`,
      lot.lot,
      STATUS_LABELS[lot.status],
      lot.dims,
      lot.sqm,
      lot.price ?? '',
    ].map(csvCell).join(','))
  }

  return new Response('﻿' + rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="mymaps-santacatalina.csv"',
    },
  })
}
