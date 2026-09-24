/**
 * Recibe el formulario de contacto (components/ContactForm.tsx) y lo manda por
 * mail vía Resend a SITE.CONTACT_EMAIL. Antes esto era un link `mailto:` que
 * dependía de que el visitante tuviera un cliente de correo configurado —
 * si no lo tenía, no pasaba nada y el formulario igual mostraba "enviado".
 * Esta ruta confirma la entrega real antes de mostrar éxito.
 */
import { sendAlertEmail } from '@/lib/alert-email'
import { SITE } from '@/lib/data'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function POST(request: Request) {
  let body: { name?: unknown; phone?: unknown; interest?: unknown; message?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ ok: false, error: 'JSON inválido' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const interest = typeof body.interest === 'string' ? body.interest.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!name || !phone) {
    return Response.json({ ok: false, error: 'Nombre y teléfono son obligatorios' }, { status: 400 })
  }

  const html = `
    <p><strong>Nueva consulta desde el sitio de ${escapeHtml(SITE.name)}</strong></p>
    <ul>
      <li><strong>Nombre:</strong> ${escapeHtml(name)}</li>
      <li><strong>Teléfono:</strong> ${escapeHtml(phone)}</li>
      <li><strong>Interés:</strong> ${escapeHtml(interest) || '—'}</li>
    </ul>
    ${message ? `<p><strong>Mensaje:</strong><br>${escapeHtml(message).replace(/\n/g, '<br>')}</p>` : ''}
  `.trim()

  const result = await sendAlertEmail(
    `Consulta ${SITE.name} — ${interest || name}`,
    html,
    SITE.CONTACT_EMAIL
  )

  if (!result.sent) {
    return Response.json({ ok: false, error: result.reason }, { status: 502 })
  }
  return Response.json({ ok: true })
}
