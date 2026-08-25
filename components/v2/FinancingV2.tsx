'use client'

import { Fragment } from 'react'
import { motion } from 'motion/react'
import { FINANCING_12, FINANCING_36, LOT_TYPES, NOTARIAL_COSTS, SITE, type LotSize } from '@/lib/data'
import { EASE_OUT, DURATION } from '@/lib/motion'
import SectionLabel from './SectionLabel'

const CINZEL  = "var(--font-cinzel), 'Cinzel', serif"
const JOSEFIN = "var(--font-josefin), 'Josefin Sans', sans-serif"
const SIZES   = Object.keys(LOT_TYPES) as LotSize[]

function fmt(n: number, currency: 'USD' | 'ARS' = 'USD') {
  return currency === 'USD' ? `USD ${n.toLocaleString('es-AR')}` : `$ ${n.toLocaleString('es-AR')}`
}

export default function FinancingV2() {
  return (
    <section id="financiacion" style={{ background: '#161616', padding: '7rem 1.5rem' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto' }}>

        <SectionLabel>Financiación</SectionLabel>

        <h2 style={{ fontFamily: CINZEL, fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 700, color: '#F5F0EB', marginBottom: '4rem' }}>
          Opciones de pago
        </h2>

        <div className="grid gap-px lg:grid-cols-2" style={{ marginBottom: '1px' }}>

          {/* Opción 1 — 12 cuotas */}
          <div style={{ background: '#0C0C0C', padding: '2.5rem' }}>
            <div style={{ marginBottom: '2rem' }}>
              <span style={{ fontFamily: JOSEFIN, fontSize: '0.55rem', letterSpacing: '0.2em', color: '#0043FF', textTransform: 'uppercase', background: 'rgba(0,67,255,0.12)', padding: '0.3rem 0.75rem' }}>
                Opción 01
              </span>
              <h3 style={{ fontFamily: CINZEL, fontSize: '1.5rem', fontWeight: 700, color: '#F5F0EB', marginTop: '1rem', marginBottom: '0.25rem' }}>
                12 cuotas
              </h3>
              <p style={{ fontFamily: JOSEFIN, fontSize: '0.75rem', color: '#999' }}>
                30% de entrega + 12 cuotas mensuales
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Lote', 'Moneda', 'Entrega', 'Cuota'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 0.5rem', textAlign: 'left', borderBottom: '1px solid #1a1a1a', fontFamily: JOSEFIN, fontSize: '0.55rem', letterSpacing: '0.15em', color: '#888', textTransform: 'uppercase' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SIZES.filter(s => FINANCING_12[s]).map((size) => {
                    const f = FINANCING_12[size]!
                    return (
                      <Fragment key={size}>
                        {f.downPesos > 0 && (
                          <tr key={`${size}-pesos`} style={{ borderBottom: '1px solid #111' }}>
                            <td style={{ padding: '0.875rem 0.5rem', fontFamily: JOSEFIN, fontWeight: 500, color: '#F5F0EB', fontSize: '0.8rem' }}>{LOT_TYPES[size].dims}</td>
                            <td style={{ padding: '0.875rem 0.5rem', fontFamily: JOSEFIN, color: '#bbb', fontSize: '0.8rem' }}>Pesos</td>
                            <td style={{ padding: '0.875rem 0.5rem', fontFamily: JOSEFIN, color: '#ccc', fontSize: '0.8rem' }}>{fmt(f.downPesos, 'ARS')}</td>
                            <td style={{ padding: '0.875rem 0.5rem', fontFamily: JOSEFIN, fontSize: '0.8rem', color: f.installmentPesos === 0 ? '#FF1200' : '#888' }}>
                              {f.installmentPesos === 0 ? 'Sin unidades' : fmt(f.installmentPesos, 'ARS')}
                            </td>
                          </tr>
                        )}
                        {f.downUSD > 0 && (
                          <tr key={`${size}-usd`} style={{ borderBottom: '1px solid #111' }}>
                            <td style={{ padding: '0.875rem 0.5rem', fontFamily: JOSEFIN, fontWeight: 500, color: '#F5F0EB', fontSize: '0.8rem' }}>{LOT_TYPES[size].dims}</td>
                            <td style={{ padding: '0.875rem 0.5rem', fontFamily: JOSEFIN, color: '#bbb', fontSize: '0.8rem' }}>USD</td>
                            <td style={{ padding: '0.875rem 0.5rem', fontFamily: JOSEFIN, color: '#ccc', fontSize: '0.8rem' }}>{fmt(f.downUSD)}</td>
                            <td style={{ padding: '0.875rem 0.5rem', fontFamily: JOSEFIN, color: '#ccc', fontSize: '0.8rem' }}>{fmt(f.installmentUSD)}</td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Opción 2 — 36 cuotas */}
          <div style={{ background: '#0C0C0C', padding: '2.5rem' }}>
            <div style={{ marginBottom: '2rem' }}>
              <span style={{ fontFamily: JOSEFIN, fontSize: '0.55rem', letterSpacing: '0.2em', color: '#0043FF', textTransform: 'uppercase', background: 'rgba(0,67,255,0.12)', padding: '0.3rem 0.75rem' }}>
                Opción 02
              </span>
              <h3 style={{ fontFamily: CINZEL, fontSize: '1.5rem', fontWeight: 700, color: '#F5F0EB', marginTop: '1rem', marginBottom: '0.25rem' }}>
                36 cuotas
              </h3>
              <p style={{ fontFamily: JOSEFIN, fontSize: '0.75rem', color: '#999' }}>
                Entrega + 36 cuotas mensuales en USD
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Lote', 'Entrega', 'Cuota', 'Disponibilidad'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 0.5rem', textAlign: 'left', borderBottom: '1px solid #1a1a1a', fontFamily: JOSEFIN, fontSize: '0.55rem', letterSpacing: '0.15em', color: '#888', textTransform: 'uppercase' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SIZES.filter(s => FINANCING_36[s]).map((size) => {
                    const f = FINANCING_36[size]!
                    const avail = f.availability
                    const color = avail === 'SIN UNIDADES' ? '#FF1200' : avail === 'Consultar' ? '#cc8800' : '#4ade80'
                    return (
                      <tr key={size} style={{ borderBottom: '1px solid #111' }}>
                        <td style={{ padding: '0.875rem 0.5rem', fontFamily: JOSEFIN, fontWeight: 500, color: '#F5F0EB', fontSize: '0.8rem' }}>{LOT_TYPES[size].dims}</td>
                        <td style={{ padding: '0.875rem 0.5rem', fontFamily: JOSEFIN, color: '#ccc', fontSize: '0.8rem' }}>{fmt(f.downUSD)}</td>
                        <td style={{ padding: '0.875rem 0.5rem', fontFamily: JOSEFIN, color: '#ccc', fontSize: '0.8rem' }}>{fmt(f.installmentUSD)}</td>
                        <td style={{ padding: '0.875rem 0.5rem', fontFamily: JOSEFIN, fontSize: '0.7rem', color }}>{avail}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #2a2000', background: '#141000', fontFamily: JOSEFIN, fontSize: '0.65rem', color: '#cc8800', letterSpacing: '0.1em' }}>
              Confirmar disponibilidad de financiación a 36 cuotas antes de ofrecer al cliente.
            </div>
          </div>
        </div>

        {/* Financiación personalizada — vía de escape para lo que no entra en las opciones fijas */}
        <div style={{ background: '#0C0C0C', padding: '2.5rem', marginTop: '1px', textAlign: 'center' }}>
          <span style={{ fontFamily: JOSEFIN, fontSize: '0.55rem', letterSpacing: '0.2em', color: '#0043FF', textTransform: 'uppercase', background: 'rgba(0,67,255,0.12)', padding: '0.3rem 0.75rem' }}>
            Financiación a medida
          </span>
          <h3 style={{ fontFamily: CINZEL, fontSize: '1.5rem', fontWeight: 700, color: '#F5F0EB', marginTop: '1rem', marginBottom: '1.5rem' }}>
            Para consultar una financiación personalizada contacte un asesor
          </h3>
          <a
            href={`https://wa.me/${SITE.WA_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, quiero consultar una financiación personalizada para un lote en Santa Catalina.')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#25D366', color: '#0C0C0C', fontFamily: JOSEFIN, fontWeight: 700, fontSize: '0.8rem', padding: '0.875rem 1.75rem', borderRadius: '2px' }}
          >
            Hablar con un asesor
          </a>
        </div>

        {/* Costos adicionales */}
        <div style={{ background: '#0C0C0C', padding: '2.5rem', marginTop: '1px' }}>
          <h3 style={{ fontFamily: CINZEL, fontSize: '1.1rem', color: '#F5F0EB', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>
            Costos adicionales
          </h3>
          <div className="grid gap-px sm:grid-cols-3">
            {NOTARIAL_COSTS.map((item, i) => (
              <motion.div
                key={item.concept}
                style={{ background: '#111', padding: '1.5rem' }}
                initial={{ opacity: 0, transform: 'translateY(12px)' }}
                whileInView={{ opacity: 1, transform: 'translateY(0px)' }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: DURATION.reveal, delay: i * 0.06, ease: EASE_OUT }}
              >
                <p style={{ fontFamily: JOSEFIN, fontSize: '0.65rem', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  {item.concept}
                </p>
                <p style={{ fontFamily: CINZEL, fontSize: item.value ? '0.9rem' : '0.75rem', fontWeight: 500, fontStyle: item.value ? 'normal' : 'italic', color: item.value ? '#F5F0EB' : '#8A6A47' }}>
                  {item.value ?? 'Por confirmar'}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
