// Alerta por email para el cron de salud del Sheet (app/api/cron/check-lot-sync).
// Vía la API REST de Resend con fetch directo — sin sumar el SDK como dependencia,
// mismo criterio que lib/sheets.ts (fetch crudo en vez de la librería oficial de Sheets).
//
// No hace nada si falta RESEND_API_KEY o ALERT_EMAIL_TO (mismo patrón que
// components/Analytics.tsx: dormido hasta tener las env vars reales, nunca rompe).
const RESEND_API_KEY = process.env.RESEND_API_KEY
const ALERT_EMAIL_TO = process.env.ALERT_EMAIL_TO
// onboarding@resend.dev: remitente de sandbox de Resend — funciona sin verificar un
// dominio propio, ideal para una alerta interna de bajo volumen como ésta.
const ALERT_EMAIL_FROM = process.env.ALERT_EMAIL_FROM ?? 'onboarding@resend.dev'

export async function sendAlertEmail(subject: string, html: string): Promise<{ sent: boolean; reason?: string }> {
  if (!RESEND_API_KEY || !ALERT_EMAIL_TO) {
    return { sent: false, reason: 'RESEND_API_KEY o ALERT_EMAIL_TO no configurados' }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Santa Catalina <${ALERT_EMAIL_FROM}>`,
      to: [ALERT_EMAIL_TO],
      subject,
      html,
    }),
  })

  if (!res.ok) {
    return { sent: false, reason: `Resend respondió ${res.status}: ${await res.text()}` }
  }
  return { sent: true }
}
