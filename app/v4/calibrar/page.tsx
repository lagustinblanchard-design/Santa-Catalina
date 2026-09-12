import CalibradorClient from './CalibradorClient'
import { LOTS, applyStatuses } from '@/lib/lots'
import { fetchLotStatuses } from '@/lib/sheets'

// Herramienta dev para calibrar HANDOFF_VIEW (ver plan de /v4). No linkeada,
// noindex, se puede borrar una vez que el valor quede fijado en el código.
export const metadata = { robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function CalibrarPage() {
  let lots = LOTS
  try {
    const statuses = await fetchLotStatuses()
    lots = applyStatuses(statuses)
  } catch {}
  return <CalibradorClient lots={lots} />
}
