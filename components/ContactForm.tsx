'use client'

import { useState } from 'react'
import { SITE } from '@/lib/data'
import AnimateIn from './AnimateIn'

type Field = 'name' | 'phone' | 'interest' | 'message'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#fff',
  border: '1px solid #D8D2C7',
  borderRadius: '0.75rem',
  padding: '0.75rem 1rem',
  color: '#2E2A26',
  outline: 'none',
  fontSize: '0.875rem',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', phone: '', interest: '', message: '' })
  const [sent, setSent]  = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name as Field]: e.target.value })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const subject = encodeURIComponent(`Consulta Santa Catalina — ${form.interest || 'Interesado'}`)
    const body    = encodeURIComponent(
      `Nombre: ${form.name}\nTeléfono: ${form.phone}\nInterés: ${form.interest}\n\n${form.message}`
    )
    window.location.href = `mailto:${SITE.CONTACT_EMAIL}?subject=${subject}&body=${body}`
    setSent(true)
  }

  if (sent) {
    return (
      <section id="contacto" className="py-20 scroll-mt-20" style={{ background: '#F2ECE0' }}>
        <div className="mx-auto max-w-lg px-6 text-center">
          <div className="rounded-3xl p-12" style={{ border: '1px solid #D8D2C7', background: '#fff' }}>
            <div className="mb-4 flex justify-center">
              <svg className="h-14 w-14 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold" style={{ color: '#2E2A26' }}>Consulta enviada</h3>
            <p className="mt-3" style={{ color: '#6B6660' }}>Un asesor de RE/MAX PAYÉ se va a comunicar con vos a la brevedad.</p>
            <button
              onClick={() => setSent(false)}
              className="mt-6 text-sm underline"
              style={{ color: '#6B6660' }}
            >
              Enviar otra consulta
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="contacto" className="py-20 scroll-mt-20" style={{ background: '#F2ECE0' }}>
      <div className="mx-auto max-w-6xl px-6">
        <AnimateIn>
          <div className="mb-12 text-center">
            <span className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-white" style={{ backgroundColor: '#AA1120' }}>
              Contacto
            </span>
            <h2 className="text-4xl font-black" style={{ color: '#2E2A26' }}>¿Te interesa un lote?</h2>
            <p className="mt-4" style={{ color: '#6B6660' }}>Completá el formulario y un asesor te va a contactar.</p>
          </div>
        </AnimateIn>

        <div className="grid gap-12 lg:grid-cols-2 max-w-5xl mx-auto">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { name: 'name',  label: 'Nombre completo *',     type: 'text', placeholder: 'Juan Pérez',         required: true },
              { name: 'phone', label: 'Teléfono / WhatsApp *', type: 'tel',  placeholder: '+54 9 379 4 000000', required: true, pattern: '[\\+\\d\\s\\(\\)\\-]{7,20}' },
            ].map(f => (
              <div key={f.name}>
                <label className="mb-2 block text-sm font-bold" style={{ color: '#2E2A26' }}>{f.label}</label>
                <input
                  type={f.type} name={f.name} required={f.required}
                  value={form[f.name as Field]} onChange={handleChange}
                  placeholder={f.placeholder}
                  pattern={'pattern' in f ? f.pattern : undefined}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#AA1120')}
                  onBlur={e  => (e.currentTarget.style.borderColor = '#D8D2C7')}
                />
              </div>
            ))}

            <div>
              <label className="mb-2 block text-sm font-bold" style={{ color: '#2E2A26' }}>Tipo de lote de interés</label>
              <select
                name="interest" value={form.interest} onChange={handleChange}
                style={{ ...inputStyle, appearance: 'none' as const }}
              >
                <option value="">Seleccionar...</option>
                <option value="12x26 — 312 m²">12×26 — 312 m² (Residencial chico)</option>
                <option value="12x28 — 336 m²">12×28 — 336 m² (Residencial mediano)</option>
                <option value="12x30 — 360 m²">12×30 — 360 m² (Residencial grande)</option>
                <option value="Mixto 15x30 — 450 m²">Mixto 15×30 — 450 m² (Vivienda + Comercio)</option>
                <option value="Mixto 15,55x30 — 466,5 m²">Mixto 15,55×30 — 466,5 m² (Vivienda + Comercio)</option>
                <option value="No definido">No definido aún</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold" style={{ color: '#2E2A26' }}>Mensaje (opcional)</label>
              <textarea
                name="message" value={form.message} onChange={handleChange} rows={4}
                placeholder="¿Tenés alguna pregunta sobre el proyecto?"
                style={{ ...inputStyle, resize: 'none' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#AA1120')}
                onBlur={e  => (e.currentTarget.style.borderColor = '#D8D2C7')}
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl py-4 text-base font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#AA1120' }}
            >
              Enviar consulta
            </button>

            <p className="text-xs text-center" style={{ color: '#6B6660' }}>
              También podés escribirnos directamente por WhatsApp
            </p>
          </form>

          {/* Contact info */}
          <div className="space-y-4">
            <div className="rounded-2xl p-6" style={{ background: '#fff', border: '1px solid #D8D2C7' }}>
              <h3 className="mb-4 font-bold" style={{ color: '#2E2A26' }}>RE/MAX PAYÉ</h3>
              <div className="space-y-3 text-sm" style={{ color: '#6B6660' }}>
                <div>
                  <p className="font-medium" style={{ color: '#2E2A26' }}>Corrientes Capital, Argentina</p>
                </div>
                <div>
                  <p className="font-medium" style={{ color: '#2E2A26' }}>Desarrollador: PAYÉ</p>
                  <p>Ordenanza N.º 7403</p>
                </div>
                <div>
                  <p className="font-medium" style={{ color: '#2E2A26' }}>Etapa: {SITE.stage}</p>
                  <p>Precios actualizados mayo 2026</p>
                </div>
              </div>
            </div>

            <a
              href={`https://wa.me/${SITE.WA_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(SITE.WA_MESSAGE)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 rounded-2xl p-5 font-semibold transition-colors hover:opacity-90"
              style={{ background: '#25D366', color: '#fff', textDecoration: 'none' }}
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Escribir por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
