'use client'

import { useState } from 'react'
import { PRICES, FINANCING_12, FINANCING_18, FINANCING_36, LOT_TYPES, type LotSize } from '@/lib/data'

type Modality = 'contado' | '12_pesos' | '12_usd' | '18_usd' | '36_usd'

const MODALITY_LABELS: Record<Modality, string> = {
  contado:    'Contado · 5% desc.',
  '12_pesos': '12 cuotas · Pesos',
  '12_usd':   '12 cuotas · USD',
  '18_usd':   '18 cuotas · USD (Mixto)',
  '36_usd':   '36 cuotas · USD',
}

const CINZEL  = "var(--font-cinzel), 'Cinzel', serif"
const JOSEFIN = "var(--font-josefin), 'Josefin Sans', sans-serif"

function fmt(n: number, currency: 'USD' | 'ARS' = 'USD') {
  return currency === 'USD' ? `USD ${n.toLocaleString('es-AR')}` : `$ ${n.toLocaleString('es-AR')}`
}

export default function PriceCalculatorV2() {
  const [size, setSize]       = useState<LotSize>('12x28')
  const [modality, setModality] = useState<Modality>('contado')

  const price = PRICES[size]
  const fin12 = FINANCING_12[size]
  const fin18 = FINANCING_18[size]
  const fin36 = FINANCING_36[size]

  function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid #1a1a1a' }}>
        <span style={{ fontFamily: JOSEFIN, fontSize: '0.7rem', color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontFamily: CINZEL, fontSize: highlight ? '1.6rem' : '0.9rem', fontWeight: highlight ? 700 : 500, color: highlight ? '#FF1200' : '#F5F0EB' }}>{value}</span>
      </div>
    )
  }

  function renderResult() {
    if (modality === 'contado') {
      const disc = price.cashUSD * (1 - price.discount)
      return (
        <>
          <Row label="Precio lista" value={fmt(price.cashUSD)} />
          <Row label="Descuento contado" value={`− ${fmt(price.cashUSD * price.discount)}`} />
          <Row label="Total contado" value={fmt(disc)} highlight />
        </>
      )
    }
    if (modality === '12_pesos') {
      if (!fin12 || fin12.installmentPesos === 0) return (
        <div style={{ padding: '1.5rem', border: '1px solid #2a1010', background: '#150808', fontFamily: JOSEFIN, fontSize: '0.75rem', color: '#cc4444', letterSpacing: '0.05em' }}>
          Sin unidades disponibles para esta tipología en pesos.
        </div>
      )
      return (
        <>
          <Row label="Entrega (30%)" value={fmt(fin12.downPesos, 'ARS')} />
          <Row label="12 cuotas de" value={fmt(fin12.installmentPesos, 'ARS')} />
          <Row label="Total financiado" value={fmt(fin12.downPesos + fin12.installmentPesos * 12, 'ARS')} highlight />
        </>
      )
    }
    if (modality === '12_usd') {
      if (!fin12 || fin12.downUSD === 0) return (
        <div style={{ padding: '1.5rem', border: '1px solid #2a1010', background: '#150808', fontFamily: JOSEFIN, fontSize: '0.75rem', color: '#cc4444', letterSpacing: '0.05em' }}>
          Sin unidades disponibles en USD a 12 cuotas.
        </div>
      )
      return (
        <>
          <Row label="Entrega (30%)" value={fmt(fin12.downUSD)} />
          <Row label="12 cuotas de" value={fmt(fin12.installmentUSD)} />
          <Row label="Total financiado" value={fmt(fin12.downUSD + fin12.installmentUSD * 12)} highlight />
        </>
      )
    }
    if (modality === '18_usd') {
      if (!fin18) return (
        <div style={{ padding: '1.5rem', border: '1px solid #2a2000', background: '#141000', fontFamily: JOSEFIN, fontSize: '0.75rem', color: '#cc8800', letterSpacing: '0.05em' }}>
          No disponible para esta tipología — 18 cuotas es sólo para lotes mixtos.
        </div>
      )
      return (
        <>
          <Row label="Entrega (30%)" value={fmt(fin18.downUSD)} />
          <Row label="18 cuotas de" value={fmt(fin18.installmentUSD)} />
          <Row label="Total financiado" value={fmt(fin18.downUSD + fin18.installmentUSD * 18)} highlight />
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', border: '1px solid #2a2000', background: '#141000', fontFamily: JOSEFIN, fontSize: '0.65rem', color: '#cc8800', letterSpacing: '0.1em' }}>
            Disponibilidad: {fin18.availability} — Confirmar antes de ofrecer
          </div>
        </>
      )
    }
    if (modality === '36_usd') {
      if (!fin36) return (
        <div style={{ padding: '1.5rem', border: '1px solid #2a2000', background: '#141000', fontFamily: JOSEFIN, fontSize: '0.75rem', color: '#cc8800', letterSpacing: '0.05em' }}>
          No disponible para esta tipología.
        </div>
      )
      return (
        <>
          <Row label="Entrega" value={fmt(fin36.downUSD)} />
          <Row label="36 cuotas de" value={fmt(fin36.installmentUSD)} />
          <Row label="Total financiado" value={fmt(fin36.downUSD + fin36.installmentUSD * 36)} highlight />
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', border: '1px solid #2a2000', background: '#141000', fontFamily: JOSEFIN, fontSize: '0.65rem', color: '#cc8800', letterSpacing: '0.1em' }}>
            Disponibilidad: {fin36.availability} — Confirmar antes de ofrecer
          </div>
        </>
      )
    }
    return null
  }

  return (
    <section id="precios" style={{ background: '#0C0C0C', padding: '7rem 1.5rem' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
          <div style={{ width: 32, height: 1, background: '#FF1200' }} />
          <span style={{ fontFamily: JOSEFIN, fontSize: '0.58rem', letterSpacing: '0.3em', color: '#FF1200', textTransform: 'uppercase' }}>
            Precios
          </span>
        </div>

        <h2 style={{ fontFamily: CINZEL, fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 700, color: '#F5F0EB', marginBottom: '4rem' }}>
          Calculadora de precios
        </h2>

        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* Lot size */}
          <div style={{ marginBottom: '2.5rem' }}>
            <p style={{ fontFamily: JOSEFIN, fontSize: '0.58rem', letterSpacing: '0.2em', color: '#888', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Tipología de lote
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px' }}>
              {(Object.keys(LOT_TYPES) as LotSize[]).map(key => (
                <button key={key} onClick={() => setSize(key)} style={{
                  background: size === key ? '#FF1200' : '#111',
                  border: 'none', cursor: 'pointer', padding: '1rem 0.5rem',
                  color: size === key ? '#fff' : '#aaa',
                  fontFamily: CINZEL, fontSize: '0.75rem', fontWeight: 600,
                  transition: 'all 0.15s',
                }}>
                  <div>{LOT_TYPES[key].dims}</div>
                  <div style={{ fontSize: '0.55rem', marginTop: '0.3rem', opacity: 0.7, fontFamily: JOSEFIN }}>
                    {LOT_TYPES[key].sqm.toLocaleString('es-AR')} m²
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Modality */}
          <div style={{ marginBottom: '2.5rem' }}>
            <p style={{ fontFamily: JOSEFIN, fontSize: '0.58rem', letterSpacing: '0.2em', color: '#888', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Modalidad de pago
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {(Object.keys(MODALITY_LABELS) as Modality[]).map(key => (
                <button key={key} onClick={() => setModality(key)} style={{
                  background: modality === key ? '#161616' : '#0e0e0e',
                  borderLeft: modality === key ? '2px solid #FF1200' : '2px solid transparent',
                  borderTop: 'none', borderRight: 'none', borderBottom: 'none',
                  cursor: 'pointer', padding: '0.875rem 1.25rem',
                  color: modality === key ? '#F5F0EB' : '#999',
                  fontFamily: JOSEFIN, fontSize: '0.75rem', letterSpacing: '0.1em',
                  textAlign: 'left', transition: 'all 0.15s',
                }}>
                  {MODALITY_LABELS[key]}
                </button>
              ))}
            </div>
          </div>

          {/* Result */}
          <div style={{ background: '#111', border: '1px solid #1a1a1a', padding: '2rem' }}>
            {renderResult()}
          </div>

          <p style={{ fontFamily: JOSEFIN, fontSize: '0.58rem', color: '#777', letterSpacing: '0.1em', textAlign: 'center', marginTop: '1.5rem' }}>
            Precios en USD · Honorarios 3% USD no incluidos ·{' '}
            <a href="#contacto" style={{ color: '#FF1200', textDecoration: 'none' }}>Consultar disponibilidad real</a>
          </p>
        </div>
      </div>
    </section>
  )
}
