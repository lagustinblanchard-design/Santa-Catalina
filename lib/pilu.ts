/**
 * Cliente del chat de Pilu (asistente de RE/MAX Payé). El cerebro NO vive en esta web:
 * está en el CRM (endpoint público POST /pilu/chat). Acá solo se arma el pedido y se
 * interpreta la respuesta. Contrato completo en docs/PILU-CONTRATO.md — si cambiás
 * algo de acá, cambialo ahí también (lo lee la sesión que construye el endpoint).
 *
 * Apagado por defecto: sin NEXT_PUBLIC_PILU_API_URL el widget no se monta. La variable
 * se incrusta en el build, así que prenderlo requiere volver a publicar.
 */
import { getStoredRef } from '@/lib/agents'

export const PILU_API = (process.env.NEXT_PUBLIC_PILU_API_URL ?? '').replace(/\/+$/, '')
export const PILU_ENABLED = PILU_API !== ''

/** Tope de un mensaje y de mensajes por conversación (el servidor aplica los suyos; esto es solo cortesía de UI). */
export const MAX_MESSAGE_CHARS = 500
export const MAX_USER_MESSAGES = 30
/** Con esta cantidad de mensajes del visitante y sin datos de contacto, Pilu ofrece pasar con un asesor. */
export const OFFER_ADVISOR_AFTER = 4

/** Texto exacto de la casilla de consentimiento: se manda al CRM junto con el lead para dejar constancia de qué aceptó. */
export const CONSENT_TEXT = 'Acepto que un asesor de RE/MAX Payé me escriba por WhatsApp.'

const CID_KEY = 'pilu_cid'
const MSGS_KEY = 'pilu_msgs'
const UTM_KEY = 'pilu_utm'
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'] as const

export type PiluRole = 'user' | 'pilu'
export type PiluMessage = { id: string; role: PiluRole; text: string }

export type PiluChatReply = {
  reply: string
  /** El servidor detectó que conviene pasar con una persona (o el visitante la pidió): mostrar el formulario. */
  ask_contact?: boolean
}

export class PiluError extends Error {
  constructor(public kind: 'rate_limit' | 'network' | 'server', message: string) {
    super(message)
  }
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function makeMessage(role: PiluRole, text: string): PiluMessage {
  return { id: newId(), role, text }
}

function ss(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

/** Id aleatorio de la conversación (sin datos personales). Vive en la pestaña: cerrar la pestaña = charla nueva. */
export function getConversationId(): string {
  const s = ss()
  const existing = s?.getItem(CID_KEY)
  if (existing) return existing
  const id = newId()
  s?.setItem(CID_KEY, id)
  return id
}

export function loadMessages(): PiluMessage[] {
  try {
    const raw = ss()?.getItem(MSGS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.filter((m) => m && (m.role === 'user' || m.role === 'pilu') && typeof m.text === 'string').slice(-60)
      : []
  } catch {
    return []
  }
}

export function saveMessages(msgs: PiluMessage[]) {
  try {
    ss()?.setItem(MSGS_KEY, JSON.stringify(msgs.slice(-60)))
  } catch {
    // sin sessionStorage: la charla sigue, solo no sobrevive a recargar
  }
}

/** Parámetros de campaña con los que el visitante llegó (se guardan la primera vez que aparecen). */
function getUtm(): Record<string, string> {
  const s = ss()
  try {
    const stored = s?.getItem(UTM_KEY)
    if (stored) return JSON.parse(stored)
    const qs = new URLSearchParams(window.location.search)
    const found: Record<string, string> = {}
    for (const k of UTM_PARAMS) {
      const v = qs.get(k)
      if (v) found[k] = v.slice(0, 200)
    }
    if (Object.keys(found).length) s?.setItem(UTM_KEY, JSON.stringify(found))
    return found
  } catch {
    return {}
  }
}

function context() {
  return {
    conversation_id: getConversationId(),
    // Código del agente cuyo link trajo al visitante (?ref=fabricio): el CRM le asigna el lead a ese agente.
    ref: getStoredRef(),
    utm: getUtm(),
    page: window.location.pathname,
  }
}

async function post<T>(body: Record<string, unknown>): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${PILU_API}/pilu/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...context(), ...body }),
      // La IA puede tardar; más de esto es una falla, no una espera.
      signal: AbortSignal.timeout(45_000),
      credentials: 'omit',
    })
  } catch {
    throw new PiluError('network', 'Sin conexión con Pilu')
  }
  if (res.status === 429) throw new PiluError('rate_limit', 'Demasiados mensajes')
  if (!res.ok) throw new PiluError('server', `Pilu respondió ${res.status}`)
  try {
    return (await res.json()) as T
  } catch {
    throw new PiluError('server', 'Respuesta ilegible')
  }
}

export async function sendChat(message: string): Promise<PiluChatReply> {
  const data = await post<Partial<PiluChatReply>>({ message: message.slice(0, MAX_MESSAGE_CHARS) })
  if (typeof data.reply !== 'string' || !data.reply.trim()) throw new PiluError('server', 'Respuesta vacía')
  return { reply: data.reply, ask_contact: data.ask_contact === true }
}

export type LeadInput = { nombre: string; telefono: string; hp: string }

/** Alta del lead. `hp` es un campo trampa invisible: si un bot lo llena, el servidor descarta el pedido. */
export async function sendLead(lead: LeadInput): Promise<void> {
  const data = await post<{ lead_ok?: boolean }>({
    lead: {
      nombre: lead.nombre.trim().slice(0, 120),
      telefono: lead.telefono.trim().slice(0, 40),
      consentimiento: true,
      consent_text: CONSENT_TEXT,
      hp: lead.hp,
    },
  })
  if (data.lead_ok !== true) throw new PiluError('server', 'No se pudo guardar el contacto')
}
