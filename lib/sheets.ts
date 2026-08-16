import type { LotStatus } from './data'

const SHEET_ID = process.env.GOOGLE_SHEETS_ID ?? '1lpt7vGJRwPf_xgW-xisHj-xShxyivt91surRRKfXb7c'

function mapStatus(raw: string): LotStatus {
  const s = raw.toUpperCase().trim()
  if (s.includes('FIDEICOMISO')) return 'FIDEICOMISO'
  if (s.includes('NO COMERCIALIZABLE')) return 'NO_COMERCIALIZABLE'
  if (s === 'RESERVADO') return 'RESERVADO'
  if (s === 'DISPONIBLE') return 'DISPONIBLE'
  return 'VENDIDO' // VENDIDO, NO DISPONIBLE, desconocido
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') { inQuotes = false }
      else { cell += ch }
    } else {
      if (ch === '"') { inQuotes = true }
      else if (ch === ',') { row.push(cell); cell = '' }
      else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
      else if (ch !== '\r') { cell += ch }
    }
  }
  if (row.length || cell) { row.push(cell); rows.push(row) }
  return rows
}

async function fetchManzana(mz: number): Promise<Record<string, LotStatus>> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=MZ+${mz}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return {}

  const statuses: Record<string, LotStatus> = {}
  for (const row of parseCSV(await res.text())) {
    const c10 = row[10] ?? ''
    const c12 = (row[12] ?? '').trim()
    const lotMatch = c10.match(/LOTE\s+(\d+)/i)
    if (lotMatch && c12) {
      statuses[`M${mz}-L${parseInt(lotMatch[1])}`] = mapStatus(c12)
    }
  }
  return statuses
}

export async function fetchLotStatuses(): Promise<Record<string, LotStatus>> {
  const results = await Promise.all(
    Array.from({ length: 14 }, (_, i) => fetchManzana(i + 1))
  )
  return Object.assign({}, ...results)
}
