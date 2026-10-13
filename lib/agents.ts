/**
 * Agentes con link propio de campaña: santacatalina…/?ref=<código>.
 * El visitante que entra con ?ref= queda asociado a ese agente por REF_TTL_DAYS
 * (components/AgentRef.tsx): todo link a wa.me del sitio sale con "(Ref: CÓDIGO)"
 * al final del mensaje, y si el agente tiene `phone`, va a su WhatsApp en vez
 * del de la oficina. El formulario de contacto también manda el código en el mail.
 *
 * Para sumar un agente: agregar una entrada acá. El código va en minúsculas,
 * sin espacios (es lo que se pone en el link).
 */
export type Agent = {
  name: string
  /** Formato internacional, ej. '+5493794000000'. Sin phone → WhatsApp de la oficina con el ref marcado. */
  phone?: string
}

export const AGENTS: Record<string, Agent> = {
  leandro: { name: 'Leandro Blanchard', phone: '+5493794339447' },
}

export const REF_STORAGE_KEY = 'sc_ref'
export const REF_TTL_DAYS = 30

/** Ref vigente guardado en este navegador, o null. Solo cliente. */
export function getStoredRef(): string | null {
  try {
    const raw = localStorage.getItem(REF_STORAGE_KEY)
    if (!raw) return null
    const { code, ts } = JSON.parse(raw) as { code: string; ts: number }
    if (!Object.hasOwn(AGENTS, code) || Date.now() - ts > REF_TTL_DAYS * 86_400_000) return null
    return code
  } catch {
    return null
  }
}
