/**
 * Chequeo diario de salud del Sheet de disponibilidad (Vercel Cron, ver vercel.json).
 *
 * fetchLotStatuses() (lib/sheets.ts), el que usa la página en cada carga, ya resuelve
 * cualquier falla en silencio — si una manzana no parsea bien, esa manzana cae al
 * fallback hardcodeado de lib/lots.ts y nadie se entera. Esta ruta corre el mismo
 * fetch por separado una vez al día sólo para levantar la mano si algo está roto:
 * si el total no da 306 lotes o alguna manzana quedó en 0, manda un mail (vía
 * lib/alert-email.ts). Si todo está bien, no manda nada — no hace falta un mail
 * diario de "todo ok".
 *
 * Protegida con CRON_SECRET: Vercel manda `Authorization: Bearer $CRON_SECRET` en
 * cada invocación programada (ver https://vercel.com/docs/cron-jobs/manage-cron-jobs).
 * Sin esa env var configurada, la ruta no exige el header — así funciona apenas se
 * despliega, sin bloquear nada, pero conviene setearla para que nadie más pueda
 * dispararla (y gastar la cuota de Resend) pegándole a la URL directamente.
 */
import { checkSheetHealth, EXPECTED_TOTAL_LOTS } from '@/lib/sheets'
import { sendAlertEmail } from '@/lib/alert-email'

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  let report
  try {
    report = await checkSheetHealth()
  } catch (err) {
    // El fetch mismo reventó (no sólo una manzana vacía) — es la falla más severa posible.
    const message = err instanceof Error ? err.message : String(err)
    const alert = await sendAlertEmail(
      '🔴 Santa Catalina — el chequeo de disponibilidad no pudo correr',
      `<p>El chequeo diario del Sheet de disponibilidad falló por completo (no una manzana puntual, el proceso entero):</p><pre>${message}</pre>`
    )
    return Response.json({ ok: false, error: message, alert }, { status: 500 })
  }

  if (report.ok) {
    return Response.json(report)
  }

  const html = `
    <p>El chequeo diario de disponibilidad de Santa Catalina encontró un problema:</p>
    <ul>
      <li><strong>Total de lotes encontrados:</strong> ${report.totalLots} (esperado: ${EXPECTED_TOTAL_LOTS})</li>
      <li><strong>Manzanas sin datos:</strong> ${report.emptyBlocks.length ? report.emptyBlocks.join(', ') : 'ninguna'}</li>
    </ul>
    <p>Mientras esto no se resuelva, esas manzanas se muestran en el sitio con el dato
    de respaldo (que puede estar desactualizado), no con el Excel real. Revisar el
    Google Sheet de disponibilidad — es posible que alguien haya cambiado el nombre de
    una hoja, reordenado columnas, o que el Sheet no esté publicado a la web.</p>
    <p style="color:#888;font-size:12px">Chequeado: ${report.checkedAt}</p>
  `
  const alert = await sendAlertEmail('🔴 Santa Catalina — disponibilidad desincronizada', html)

  return Response.json({ ...report, alert })
}
