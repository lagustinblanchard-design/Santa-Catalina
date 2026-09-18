import type { LotStatus } from './data'

const SHEET_ID = process.env.GOOGLE_SHEETS_ID ?? '1lpt7vGJRwPf_xgW-xisHj-xShxyivt91surRRKfXb7c'

function mapStatus(raw: string, note: string): LotStatus {
  const s = raw.toUpperCase().trim()
  if (s.includes('FIDEICOMISO')) return 'FIDEICOMISO'
  if (s.includes('NO COMERCIALIZABLE')) return 'NO_COMERCIALIZABLE'
  if (s === 'RESERVADO') return 'RESERVADO'
  if (s === 'DISPONIBLE') return 'DISPONIBLE'
  // "VENDIDO" con nota "TERCEROS" = vendido fuera del canal de comercialización
  // (acuerdo privado), mismo tratamiento que FIDEICOMISO — no un vendido normal.
  if (s === 'VENDIDO' && note.toUpperCase().includes('TERCEROS')) return 'FIDEICOMISO'
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
  let res: Response
  try {
    // Timeout corto: si Sheets se cuelga para esta manzana, no debe trabar la página
    // entera — se resuelve como {} y esa manzana cae al dato hardcodeado de fallback.
    res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(6000) })
  } catch {
    return {}
  }
  if (!res.ok) return {}

  const statuses: Record<string, LotStatus> = {}
  for (const row of parseCSV(await res.text())) {
    const c10 = row[10] ?? ''
    const c12 = (row[12] ?? '').trim()
    const c13 = row[13] ?? ''
    const lotMatch = c10.match(/LOTE\s+(\d+)/i)
    if (lotMatch && c12) {
      statuses[`M${mz}-L${parseInt(lotMatch[1])}`] = mapStatus(c12, c13)
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

// ---------- Chequeo de salud (usado por el cron diario, ver app/api/cron/check-lot-sync) ----------
// fetchLotStatuses() no distingue "esta manzana no tiene lotes hoy" de "el fetch/parseo
// falló para esta manzana" — ambos casos devuelven {} y la manzana cae al fallback
// hardcodeado de lib/lots.ts en silencio. Este chequeo existe para que ESO deje de ser
// silencioso: si algún día el Sheet cambia de formato o Google tiene una caída, alguien
// se entera por mail en vez de que un cliente vea disponibilidad vieja.
export const EXPECTED_TOTAL_LOTS = 306

export type SheetHealthReport = {
  ok: boolean
  totalLots: number
  perBlock: Record<number, number>
  emptyBlocks: number[]
  checkedAt: string
}

export async function checkSheetHealth(): Promise<SheetHealthReport> {
  const perBlock: Record<number, number> = {}
  const emptyBlocks: number[] = []

  await Promise.all(
    Array.from({ length: 14 }, async (_, i) => {
      const mz = i + 1
      const statuses = await fetchManzana(mz)
      const count = Object.keys(statuses).length
      perBlock[mz] = count
      if (count === 0) emptyBlocks.push(mz)
    })
  )

  const totalLots = Object.values(perBlock).reduce((a, b) => a + b, 0)

  return {
    ok: emptyBlocks.length === 0 && totalLots === EXPECTED_TOTAL_LOTS,
    totalLots,
    perBlock,
    emptyBlocks,
    checkedAt: new Date().toISOString(),
  }
}
