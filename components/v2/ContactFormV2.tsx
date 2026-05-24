'use client'

import { useState } from 'react'
import { SITE } from '@/lib/data'

const CINZEL  = "var(--font-cinzel), 'Cinzel', serif"
const JOSEFIN = "var(--font-josefin), 'Josefin Sans', sans-serif"

type Field = 'name' | 'phone' | 'interest' | 'message'

const inputStyle = {
  width: '100%', background: '#111', border: '1px solid #1a1a1a',
  padding: '0.875rem 1rem', color: '#F5F0EB', outline: 'none',
  fontFamily: JOSEFIN, fontSize: '0.85rem', boxSizing: 'border-box' as const,
  transition: 'border-color 0.2s',
}

export default function ContactFormV2() {
  const [form, setForm] = useState({ name: '', phone: '', interest: '', message: '' })
  const [sent, setSent]  = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name as Field]: e.target.value })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const subject = encodeURIComponent(`Consulta Santa Catalina — ${form.interest || 'Interesado'}`)
    const body    = encodeURIComponent(`Nombre: ${form.name}\nTeléfono: ${form.phone}\nInterés: ${form.interest}\n\n${form.message}`)
    window.location.href = `mailto:${SITE.CONTACT_EMAIL}?subject=${subject}&body=${body}`
    setSent(true)
  }

  if (sent) {
    return (
      <section id="contacto" style={{ background: '#0C0C0C', padding: '7rem 1.5rem' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ border: '1px solid #1a3a1a', background: '#0a140a', padding: '4rem 2rem' }}>
            <svg width={48} height={48} fill="none" viewBox="0 0 24 24" stroke="#4ade80" strokeWidth={1} style={{ margin: '0 auto 1.5rem', display: 'block' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <h3 style={{ fontFamily: CINZEL, fontSize: '1.5rem', fontWeight: 700, color: '#F5F0EB', marginBottom: '0.75rem' }}>
              Consulta enviada
            </h3>
            <p style={{ fontFamily: JOSEFIN, fontSize: '0.8rem', color: '#999', lineHeight: 1.7 }}>
              Un asesor de RE/MAX PAYÉ se va a comunicar con vos a la brevedad.
            </p>
            <button onClick={() => setSent(false)} style={{
              marginTop: '2rem', fontFamily: JOSEFIN, fontSize: '0.65rem',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline',
            }}>
              Enviar otra consulta
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="contacto" style={{ background: '#0C0C0C', padding: '7rem 1.5rem' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
          <div style={{ width: 32, height: 1, background: '#FF1200' }} />
          <span style={{ fontFamily: JOSEFIN, fontSize: '0.58rem', letterSpacing: '0.3em', color: '#FF1200', textTransform: 'uppercase' }}>
            Contacto
          </span>
        </div>

        <h2 style={{ fontFamily: CINZEL, fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 700, color: '#F5F0EB', marginBottom: '4rem' }}>
          ¿Te interesa un lote?
        </h2>

        <div className="grid gap-12 lg:grid-cols-2" style={{ maxWidth: 1000, margin: '0 auto' }}>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[
              { name: 'name',  label: 'Nombre completo *',       type: 'text', placeholder: 'Juan Pérez',         required: true },
              { name: 'phone', label: 'Teléfono / WhatsApp *',   type: 'tel',  placeholder: '+54 9 379 4 000000', required: true },
            ].map(f => (
              <div key={f.name}>
                <label style={{ display: 'block', fontFamily: JOSEFIN, fontSize: '0.6rem', letterSpacing: '0.2em', color: '#888', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  {f.label}
                </label>
                <input
                  type={f.type} name={f.name} required={f.required}
                  value={form[f.name as Field]} onChange={handleChange}
                  placeholder={f.placeholder}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#FF1200')}
                  onBlur={e  => (e.currentTarget.style.borderColor = '#1a1a1a')}
                />
              </div>
            ))}

            <div>
              <label style={{ display: 'block', fontFamily: JOSEFIN, fontSize: '0.6rem', letterSpacing: '0.2em', color: '#888', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Tipo de lote de interés
              </label>
              <select name="interest" value={form.interest} onChange={handleChange} style={{ ...inputStyle, appearance: 'none' as const }}>
                <option value="">Seleccionar...</option>
                <option value="12x26 — 312 m²">12×26 — 312 m² (Residencial chico)</option>
                <option value="12x28 — 336 m²">12×28 — 336 m² (Residencial mediano)</option>
                <option value="12x30 — 360 m²">12×30 — 360 m² (Residencial grande)</option>
                <option value="Mixto — ~450 m²">Mixto — ~450 m² (Vivienda + Comercio)</option>
                <option value="No definido">No definido aún</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: JOSEFIN, fontSize: '0.6rem', letterSpacing: '0.2em', color: '#888', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Mensaje (opcional)
              </label>
              <textarea
                name="message" value={form.message} onChange={handleChange} rows={4}
                placeholder="¿Tenés alguna pregunta sobre el proyecto?"
                style={{ ...inputStyle, resize: 'none' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#FF1200')}
                onBlur={e  => (e.currentTarget.style.borderColor = '#1a1a1a')}
              />
            </div>

            <button type="submit" style={{
              fontFamily: JOSEFIN, fontSize: '0.7rem', letterSpacing: '0.2em',
              textTransform: 'uppercase', background: '#FF1200', color: '#fff',
              border: 'none', padding: '1.1rem', cursor: 'pointer', transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Enviar consulta
            </button>

            <p style={{ fontFamily: JOSEFIN, fontSize: '0.6rem', color: '#888', textAlign: 'center', letterSpacing: '0.1em' }}>
              También podés escribirnos directamente por WhatsApp
            </p>
          </form>

          {/* Contact info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {[
              { label: 'Oficina', value: 'Corrientes Capital, Argentina' },
              { label: 'Desarrollador', value: `${SITE.developer} · ${SITE.ordinance}` },
              { label: 'Etapa', value: `${SITE.stage} · Mayo 2026` },
            ].map(item => (
              <div key={item.label} style={{ background: '#111', padding: '1.5rem 2rem' }}>
                <p style={{ fontFamily: JOSEFIN, fontSize: '0.55rem', color: '#888', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  {item.label}
                </p>
                <p style={{ fontFamily: CINZEL, fontSize: '0.9rem', color: '#F5F0EB' }}>
                  {item.value}
                </p>
              </div>
            ))}

            <a
              href={`https://wa.me/${SITE.WA_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(SITE.WA_MESSAGE)}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                background: '#0d1a0d', border: '1px solid #1a3a1a', padding: '1.5rem',
                textDecoration: 'none', marginTop: '1px',
                fontFamily: JOSEFIN, fontSize: '0.7rem', letterSpacing: '0.15em',
                textTransform: 'uppercase', color: '#4ade80', transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#111f11')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0d1a0d')}
            >
              <svg width={20} height={20} fill="currentColor" viewBox="0 0 24 24">
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
