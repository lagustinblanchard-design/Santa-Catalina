'use client'

/**
 * Pilu, el asistente virtual de RE/MAX Payé (y mascota de Desarrollos Payé), como chat
 * flotante en la web. Este componente es solo la cara: el cerebro (IA, precios desde la
 * planilla, escalación, alta del lead) vive en el CRM — ver lib/pilu.ts y docs/PILU-CONTRATO.md.
 *
 * Apagado por defecto: sin NEXT_PUBLIC_PILU_API_URL devuelve null y no se ve nada.
 *
 * Decisiones de diseño:
 * - Los datos de contacto NO se piden al abrir. Pilu conversa primero; el formulario aparece
 *   cuando el visitante pide una persona, cuando el servidor lo indica (ask_contact), o se
 *   ofrece después de unos mensajes. Siempre con casilla de consentimiento (Ley 25.326).
 * - Se monta solo en la home: /mapa-3d es una pantalla completa con su propia ficha de lote
 *   abajo, y las fichas /lote y las páginas legales no son lugar para un chat.
 * - Se apila arriba del botón de WhatsApp (que sigue siendo la salida directa si Pilu falla).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { SITE } from '@/lib/data'
import { trackMeta } from '@/components/MetaPixel'
import {
  PILU_ENABLED,
  MAX_MESSAGE_CHARS,
  MAX_USER_MESSAGES,
  OFFER_ADVISOR_AFTER,
  CONSENT_TEXT,
  PiluError,
  loadMessages,
  makeMessage,
  saveMessages,
  sendChat,
  sendLead,
  type PiluMessage,
} from '@/lib/pilu'

const INTRO =
  '¡Hola! 🐆 Soy Pilu, asistente virtual de RE/MAX Payé. Puedo contarle sobre los lotes de Santa Catalina, precios y formas de pago. Si prefiere hablar con una persona, avíseme.'

const QUICK_REPLIES = ['Ver precios', 'Formas de pago', 'Quiero visitar el loteo'] as const
const HUMAN_CHIP = 'Hablar con una persona'

const LEAD_KEY = 'pilu_lead'
const NUDGE_KEY = 'pilu_nudged'

type Contact = 'none' | 'offer' | 'form' | 'sent' | 'dismissed'
type ChatError = null | 'rate_limit' | 'network' | 'server'

const waHref = `https://wa.me/${SITE.WA_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(SITE.WA_MESSAGE)}`

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#fff',
  border: '1px solid #D8D2C7',
  borderRadius: '0.75rem',
  padding: '0.6rem 0.85rem',
  color: '#2E2A26',
  outline: 'none',
  // 16px: iOS Safari hace zoom automático al enfocar un campo con menos y desarma la página.
  fontSize: '1rem',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

function Avatar({ size }: { size: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/pilu/pilu-avatar.webp"
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full"
      style={{ width: size, height: size, background: '#fff', objectFit: 'cover' }}
    />
  )
}

export default function PiluChat() {
  if (!PILU_ENABLED) return null
  return <PiluChatInner />
}

function PiluChatInner() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<PiluMessage[]>([])
  const [text, setText] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ChatError>(null)
  const [lastText, setLastText] = useState('')
  const [contact, setContact] = useState<Contact>('none')
  const [nudge, setNudge] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [honey, setHoney] = useState('')
  const [consent, setConsent] = useState(false)
  const [leadError, setLeadError] = useState<string | null>(null)
  const [leadSending, setLeadSending] = useState(false)

  const launcherRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  // Restaurar la charla de esta pestaña (y si ya dejó sus datos) — después de montar, para no
  // desfasar el HTML del servidor.
  useEffect(() => {
    setMsgs(loadMessages())
    try {
      if (sessionStorage.getItem(LEAD_KEY) === 'sent') setContact('sent')
    } catch {
      // sin sessionStorage: no pasa nada, solo no recuerda
    }
  }, [])

  // Globito de saludo: una vez por sesión, solo en pantallas anchas, sin tapar el CTA del Hero en celular.
  useEffect(() => {
    let seen = false
    try {
      seen = sessionStorage.getItem(NUDGE_KEY) === '1'
    } catch {
      seen = true
    }
    if (seen || !window.matchMedia('(min-width: 640px)').matches) return
    const t = setTimeout(() => setNudge(true), 8000)
    return () => clearTimeout(t)
  }, [])

  const userCount = msgs.filter((m) => m.role === 'user').length

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: 'end' })
  }, [open, msgs, pending, contact, error])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const push = useCallback((m: PiluMessage) => {
    setMsgs((prev) => {
      const next = [...prev, m]
      saveMessages(next)
      return next
    })
  }, [])

  function openChat() {
    setNudge(false)
    try {
      sessionStorage.setItem(NUDGE_KEY, '1')
    } catch {
      // idem
    }
    setOpen(true)
  }

  function closeChat() {
    setOpen(false)
  }

  // Al cerrar, devolver el foco al botón de Pilu (accesibilidad por teclado). Tiene que ser un
  // efecto y no una línea en closeChat(): el botón solo existe mientras el chat está cerrado, así
  // que en ese mismo instante todavía no está montado.
  const wasOpen = useRef(false)
  useEffect(() => {
    if (wasOpen.current && !open) launcherRef.current?.focus()
    wasOpen.current = open
  }, [open])

  function askForPerson() {
    if (contact === 'sent') {
      push(makeMessage('pilu', 'Ya tengo sus datos: un asesor le va a escribir por WhatsApp. Si quiere, mientras tanto sigo ayudándolo por acá.'))
      return
    }
    push(makeMessage('pilu', 'Con gusto. Déjeme su nombre y su WhatsApp y un asesor le escribe.'))
    setContact('form')
  }

  async function send(raw: string, retry = false) {
    const t = raw.trim().slice(0, MAX_MESSAGE_CHARS)
    if (!t || pending) return
    if (!retry && userCount >= MAX_USER_MESSAGES) {
      push(makeMessage('pilu', 'Para seguir con su consulta prefiero pasarlo con una persona.'))
      if (contact !== 'sent') setContact('form')
      return
    }
    if (!retry) push(makeMessage('user', t))
    setText('')
    setLastText(t)
    setError(null)
    setPending(true)
    try {
      const r = await sendChat(t)
      push(makeMessage('pilu', r.reply))
      if (r.ask_contact && contact !== 'sent') setContact('form')
      else if (contact === 'none' && userCount + (retry ? 0 : 1) >= OFFER_ADVISOR_AFTER) setContact('offer')
    } catch (e) {
      setError(e instanceof PiluError ? e.kind : 'server')
    } finally {
      setPending(false)
      inputRef.current?.focus()
    }
  }

  function onChip(label: string) {
    if (label === HUMAN_CHIP) {
      push(makeMessage('user', label))
      askForPerson()
    } else {
      void send(label)
    }
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault()
    setLeadError(null)
    const digits = phone.replace(/\D/g, '')
    if (name.trim().length < 2) return setLeadError('Escriba su nombre.')
    if (digits.length < 8 || digits.length > 15) return setLeadError('Revise el número de WhatsApp (con código de área).')
    if (!consent) return setLeadError('Para continuar, acepte que un asesor le escriba por WhatsApp.')
    setLeadSending(true)
    try {
      await sendLead({ nombre: name, telefono: phone, hp: honey })
      trackMeta('Lead', { content_name: 'Pilu' })
      try {
        sessionStorage.setItem(LEAD_KEY, 'sent')
      } catch {
        // idem
      }
      setContact('sent')
      push(makeMessage('pilu', '¡Listo! Un asesor de RE/MAX Payé le va a escribir por WhatsApp. Mientras tanto puede seguir preguntándome. 🐆'))
    } catch (err) {
      setLeadError(
        err instanceof PiluError && err.kind === 'rate_limit'
          ? 'Hubo muchos intentos seguidos. Espere un momento y vuelva a probar.'
          : 'No pudimos enviar sus datos. Pruebe de nuevo o escríbanos directo por WhatsApp.',
      )
    } finally {
      setLeadSending(false)
    }
  }

  return (
    <div className="print:hidden">
      {!open && (
        <div className="fixed bottom-[88px] right-6 z-[55] flex items-end gap-3">
          {nudge && (
            <div
              className="relative mb-2 hidden max-w-[220px] rounded-2xl px-4 py-3 text-sm shadow-lg sm:block"
              style={{ background: '#fff', color: '#2E2A26', border: '1px solid #D8D2C7' }}
              role="status"
            >
              ¿Lo ayudo con algo? 🐆
              <button
                type="button"
                onClick={() => {
                  setNudge(false)
                  try {
                    sessionStorage.setItem(NUDGE_KEY, '1')
                  } catch {
                    // idem
                  }
                }}
                aria-label="Cerrar saludo"
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs"
                style={{ background: '#2E2A26', color: '#fff' }}
              >
                ×
              </button>
            </div>
          )}
          <button
            ref={launcherRef}
            type="button"
            onClick={openChat}
            aria-label="Abrir chat con Pilu, asistente virtual"
            aria-expanded={false}
            className="relative flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
            style={{ background: '#fff', border: '3px solid #AA1120' }}
          >
            <Avatar size={52} />
            <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-white" style={{ background: '#22c55e' }} />
          </button>
        </div>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Chat con Pilu, asistente virtual de RE/MAX Payé"
          onKeyDown={(e) => e.key === 'Escape' && closeChat()}
          className="fixed inset-x-0 bottom-0 z-[60] flex h-[min(85dvh,640px)] flex-col overflow-hidden rounded-t-2xl shadow-2xl sm:inset-x-auto sm:bottom-[88px] sm:right-6 sm:h-[min(70dvh,580px)] sm:w-[380px] sm:rounded-2xl"
          style={{ background: '#fff', border: '1px solid #D8D2C7' }}
        >
          <div className="flex items-center gap-3 px-4 py-3" style={{ background: '#2E2A26', color: '#F2ECE0' }}>
            <Avatar size={40} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight">Pilu</p>
              <p className="flex items-center gap-1.5 text-xs leading-tight" style={{ color: 'rgba(242,236,224,0.75)' }}>
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#22c55e' }} />
                Asistente virtual de RE/MAX Payé
              </p>
            </div>
            <button
              type="button"
              onClick={closeChat}
              aria-label="Cerrar chat"
              className="flex h-9 w-9 items-center justify-center rounded-full text-xl leading-none"
              style={{ color: '#F2ECE0' }}
            >
              ×
            </button>
          </div>

          <div
            className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4"
            style={{ background: '#FBF8F2' }}
            aria-live="polite"
          >
            <Bubble role="pilu" text={INTRO} />
            {msgs.map((m) => (
              <Bubble key={m.id} role={m.role} text={m.text} />
            ))}

            {userCount === 0 && contact === 'none' && (
              <div className="flex flex-wrap gap-2 pt-1">
                {[...QUICK_REPLIES, HUMAN_CHIP].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onChip(c)}
                    disabled={pending}
                    className="rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-white"
                    style={{ border: '1px solid #AA1120', color: '#AA1120', background: 'transparent' }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {pending && (
              <p className="animate-pulse text-sm italic" style={{ color: '#6B6660' }}>
                Pilu está escribiendo…
              </p>
            )}

            {error && (
              <div className="rounded-xl p-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b' }}>
                <p>
                  {error === 'rate_limit'
                    ? 'Recibimos muchos mensajes seguidos. Espere un momento y vuelva a probar, o escríbanos por WhatsApp.'
                    : 'No pude responder en este momento.'}
                </p>
                <div className="mt-2 flex flex-wrap gap-3">
                  {error !== 'rate_limit' && lastText && (
                    <button type="button" onClick={() => void send(lastText, true)} className="font-bold underline">
                      Reintentar
                    </button>
                  )}
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className="font-bold underline">
                    Escribir por WhatsApp
                  </a>
                </div>
              </div>
            )}

            {contact === 'offer' && (
              <div className="rounded-xl p-3 text-sm" style={{ background: '#F2ECE0', color: '#2E2A26' }}>
                <p>¿Quiere que un asesor de RE/MAX Payé le escriba por WhatsApp?</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setContact('form')}
                    className="rounded-full px-4 py-2 text-sm font-bold text-white"
                    style={{ background: '#AA1120' }}
                  >
                    Sí, dejar mis datos
                  </button>
                  <button
                    type="button"
                    onClick={() => setContact('dismissed')}
                    className="rounded-full px-4 py-2 text-sm font-medium"
                    style={{ border: '1px solid #D8D2C7', background: '#fff' }}
                  >
                    Seguir chateando
                  </button>
                </div>
              </div>
            )}

            {contact === 'form' && (
              <form onSubmit={submitLead} className="space-y-2.5 rounded-xl p-3" style={{ background: '#fff', border: '1px solid #D8D2C7' }} noValidate>
                <p className="text-sm font-bold" style={{ color: '#2E2A26' }}>
                  Un asesor le escribe por WhatsApp
                </p>
                <input
                  style={inputStyle}
                  name="nombre"
                  autoComplete="name"
                  placeholder="Su nombre"
                  value={name}
                  maxLength={120}
                  onChange={(e) => setName(e.target.value)}
                  aria-label="Su nombre"
                />
                <input
                  style={inputStyle}
                  name="telefono"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Su WhatsApp (con código de área)"
                  value={phone}
                  maxLength={40}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-label="Su número de WhatsApp"
                />
                {/* Campo trampa para bots: invisible y fuera del orden de tabulación. Si llega lleno, el CRM descarta el pedido. */}
                <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
                  <input name="sitio_web" tabIndex={-1} autoComplete="off" value={honey} onChange={(e) => setHoney(e.target.value)} />
                </div>
                <label className="flex items-start gap-2 text-xs leading-snug" style={{ color: '#2E2A26' }}>
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {CONSENT_TEXT}{' '}
                    <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#AA1120' }}>
                      Política de privacidad
                    </a>
                  </span>
                </label>
                {leadError && (
                  <p className="text-xs" style={{ color: '#991b1b' }} role="alert">
                    {leadError}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={leadSending}
                    className="flex-1 rounded-full px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                    style={{ background: '#AA1120' }}
                  >
                    {leadSending ? 'Enviando…' : 'Enviar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setContact('dismissed')}
                    className="rounded-full px-4 py-2.5 text-sm font-medium"
                    style={{ border: '1px solid #D8D2C7', background: '#fff', color: '#2E2A26' }}
                  >
                    Ahora no
                  </button>
                </div>
              </form>
            )}

            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void send(text)
            }}
            className="px-3 pt-3"
            style={{ background: '#fff', borderTop: '1px solid #D8D2C7', paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                style={{ ...inputStyle, borderRadius: '9999px' }}
                value={text}
                maxLength={MAX_MESSAGE_CHARS}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escriba su mensaje…"
                aria-label="Escriba su mensaje"
                enterKeyHint="send"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={pending || !text.trim()}
                aria-label="Enviar mensaje"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40"
                style={{ background: '#AA1120' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M3.4 20.4 21 12 3.4 3.6l.01 6.5L15 12 3.41 13.9z" />
                </svg>
              </button>
            </div>
            <p className="px-1 pb-1 pt-2 text-[11px] leading-tight" style={{ color: '#6B6660' }}>
              Asistente virtual. La información es orientativa: un asesor la confirma.
            </p>
          </form>
        </div>
      )}
    </div>
  )
}

function Bubble({ role, text }: { role: 'user' | 'pilu'; text: string }) {
  const mine = role === 'user'
  return (
    <div className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
      {!mine && <Avatar size={28} />}
      <p
        className="max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
        style={
          mine
            ? { background: '#AA1120', color: '#fff', borderBottomRightRadius: '0.25rem' }
            : { background: '#F2ECE0', color: '#2E2A26', borderBottomLeftRadius: '0.25rem' }
        }
      >
        {text}
      </p>
    </div>
  )
}
