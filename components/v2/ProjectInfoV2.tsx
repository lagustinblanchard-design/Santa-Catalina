'use client'

import { motion } from 'motion/react'
import { SITE, LOT_TYPES } from '@/lib/data'
import { EASE_OUT, DURATION } from '@/lib/motion'
import SectionLabel from './SectionLabel'

const CINZEL  = "var(--font-cinzel), 'Cinzel', serif"
const JOSEFIN = "var(--font-josefin), 'Josefin Sans', sans-serif"

export default function ProjectInfoV2() {
  const facts = [
    { num: '01', label: 'Desarrollador', value: SITE.developer },
    { num: '02', label: 'Ordenanza',     value: SITE.ordinance },
    { num: '03', label: 'Manzanas',      value: `${SITE.totalBlocks} en total` },
    { num: '04', label: 'Etapa actual',  value: SITE.stage },
  ]

  return (
    <section id="proyecto" style={{ background: '#161616', padding: '7rem 1.5rem' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto' }}>

        <SectionLabel>El proyecto</SectionLabel>

        <h2 style={{ fontFamily: CINZEL, fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 700, color: '#F5F0EB', letterSpacing: '-0.02em', marginBottom: '4rem' }}>
          Predios Santa Catalina
        </h2>

        <p style={{ fontFamily: JOSEFIN, fontSize: '1rem', color: '#aaa', lineHeight: 1.7, maxWidth: 520, marginBottom: '4rem' }}>
          Sistema de gestión y desarrollo inmobiliario comercializado por <span style={{ color: '#F5F0EB' }}>RE/MAX PAYÉ</span> en Corrientes Capital.
        </p>

        {/* Facts — stagger decorativo (60ms), no bloquea nada */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1px', marginBottom: '4rem' }}>
          {facts.map((f, i) => (
            <motion.div
              key={f.num}
              style={{ background: '#0C0C0C', padding: '2rem 1.5rem' }}
              initial={{ opacity: 0, transform: 'translateY(12px)' }}
              whileInView={{ opacity: 1, transform: 'translateY(0px)' }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: DURATION.reveal, delay: i * 0.06, ease: EASE_OUT }}
            >
              <p style={{ fontFamily: CINZEL, fontSize: '0.7rem', color: '#FF1200', letterSpacing: '0.15em', marginBottom: '1.25rem' }}>
                {f.num}
              </p>
              <p style={{ fontFamily: JOSEFIN, fontSize: '0.55rem', color: '#888', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                {f.label}
              </p>
              <p style={{ fontFamily: CINZEL, fontSize: '1.05rem', fontWeight: 600, color: '#F5F0EB' }}>
                {f.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Location */}
        <div style={{ background: '#0C0C0C', border: '1px solid #1a1a1a', padding: '2.5rem', marginBottom: '4rem' }}>
          <p style={{ fontFamily: JOSEFIN, fontSize: '0.55rem', color: '#FF1200', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Ubicación
          </p>
          <p style={{ fontFamily: JOSEFIN, fontSize: '0.95rem', color: '#bbb', lineHeight: 1.7 }}>
            {SITE.location}
          </p>
          <p style={{ fontFamily: JOSEFIN, fontSize: '0.75rem', color: '#888', marginTop: '0.5rem' }}>
            Corrientes Capital — zona de expansión urbana con acceso a servicios y vías principales.
          </p>
        </div>

        {/* Lot typologies */}
        <h3 style={{ fontFamily: CINZEL, fontSize: '1.2rem', color: '#F5F0EB', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>
          Tipologías de lotes
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Tipología', 'Medidas', 'Superficie', 'Uso'].map(h => (
                  <th key={h} style={{
                    padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #1a1a1a',
                    fontFamily: JOSEFIN, fontSize: '0.55rem', letterSpacing: '0.2em',
                    color: '#888', textTransform: 'uppercase',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(LOT_TYPES).map(([key, lot]) => (
                <tr key={key} style={{ borderBottom: '1px solid #141414' }}>
                  <td style={{ padding: '1rem', fontFamily: JOSEFIN, fontWeight: 500, color: '#F5F0EB', fontSize: '0.85rem' }}>{lot.label}</td>
                  <td style={{ padding: '1rem', fontFamily: JOSEFIN, color: '#bbb', fontSize: '0.85rem' }}>{lot.dims}</td>
                  <td style={{ padding: '1rem', fontFamily: JOSEFIN, color: '#bbb', fontSize: '0.85rem' }}>{lot.sqm.toLocaleString('es-AR')} m²</td>
                  <td style={{ padding: '1rem', fontFamily: JOSEFIN, color: '#bbb', fontSize: '0.85rem' }}>{lot.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
