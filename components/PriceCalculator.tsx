'use client'

import { useState } from 'react'
import { PRICES, FINANCING_12, FINANCING_36, LOT_TYPES, type LotSize } from '@/lib/data'

type Modality = 'contado' | '12_pesos' | '12_usd' | '36_usd'

const MODALITY_LABELS: Record<Modality, string> = {
  contado:    'Contado (5% desc.)',
  '12_pesos': 'Financiado 12 cuotas — Pesos',
  '12_usd':   'Financiado 12 cuotas — USD',
  '36_usd':   'Financiado 36 cuotas — USD',
}

function fmt(n: number, currency: 'USD' | 'ARS' = 'USD') {
  return currency === 'USD'
    ? `USD ${n.toLocaleString('es-AR')}`
    : `$ ${n.toLocaleString('es-AR')}`
}

export default function PriceCalculator() {
  const [size, setSize]         = useState<LotSize>('12x28')
  const [modality, setModality] = useState<Modality>('contado')

  const price = PRICES[size]
  const fin12 = FINANCING_12[size]
  const fin36 = FINANCING_36[size]

  const rowStyle = { borderBottom: '1px solid #D8D2C7', paddingBottom: '0.75rem', marginBottom: '0.75rem' }

  function renderResult() {
    if (modality === 'contado') {
      const withDiscount = price.cashUSD * (1 - price.discount)
      return (
        <div>
          <div className="flex items-center justify-between" style={rowStyle}>
            <span style={{ color: '#6B6660' }}>Precio lista</span>
            <span className="font-semibold" style={{ color: '#2E2A26' }}>{fmt(price.cashUSD)}</span>
          </div>
          <div className="flex items-center justify-between" style={rowStyle}>
            <span style={{ color: '#6B6660' }}>Descuento contado</span>
            <span className="font-semibold text-green-700">− {fmt(price.cashUSD * price.discount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold" style={{ color: '#2E2A26' }}>Total contado</span>
            <span className="text-2xl font-black" style={{ color: '#AA1120' }}>{fmt(withDiscount)}</span>
          </div>
        </div>
      )
    }

    if (modality === '12_pesos') {
      if (!fin12 || fin12.installmentPesos === 0) {
        return (
          <div className="rounded-xl p-4 text-center" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b' }}>
            <p className="font-semibold">Sin unidades disponibles</p>
            <p className="text-sm mt-1">Esta opción no tiene lotes disponibles en pesos para este tamaño.</p>
          </div>
        )
      }
      return (
        <div>
          <div className="flex items-center justify-between" style={rowStyle}>
            <span style={{ color: '#6B6660' }}>Entrega (30%)</span>
            <span className="font-semibold" style={{ color: '#2E2A26' }}>{fmt(fin12.downPesos, 'ARS')}</span>
          </div>
          <div className="flex items-center justify-between" style={rowStyle}>
            <span style={{ color: '#6B6660' }}>12 cuotas de</span>
            <span className="font-semibold" style={{ color: '#2E2A26' }}>{fmt(fin12.installmentPesos, 'ARS')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold" style={{ color: '#2E2A26' }}>Total financiado</span>
            <span className="text-2xl font-black" style={{ color: '#AA1120' }}>
              {fmt(fin12.downPesos + fin12.installmentPesos * 12, 'ARS')}
            </span>
          </div>
        </div>
      )
    }

    if (modality === '12_usd') {
      if (!fin12 || fin12.downUSD === 0) {
        return (
          <div className="rounded-xl p-4 text-center" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b' }}>
            <p className="font-semibold">Sin unidades disponibles en USD</p>
            <p className="text-sm mt-1">Esta tipología no tiene financiación en USD a 12 cuotas actualmente.</p>
          </div>
        )
      }
      return (
        <div>
          <div className="flex items-center justify-between" style={rowStyle}>
            <span style={{ color: '#6B6660' }}>Entrega (30%)</span>
            <span className="font-semibold" style={{ color: '#2E2A26' }}>{fmt(fin12.downUSD)}</span>
          </div>
          <div className="flex items-center justify-between" style={rowStyle}>
            <span style={{ color: '#6B6660' }}>12 cuotas de</span>
            <span className="font-semibold" style={{ color: '#2E2A26' }}>{fmt(fin12.installmentUSD)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold" style={{ color: '#2E2A26' }}>Total financiado</span>
            <span className="text-2xl font-black" style={{ color: '#AA1120' }}>
              {fmt(fin12.downUSD + fin12.installmentUSD * 12)}
            </span>
          </div>
        </div>
      )
    }

    if (modality === '36_usd') {
      if (!fin36) {
        return (
          <div className="rounded-xl p-4 text-center" style={{ background: '#fefce8', border: '1px solid #fde047', color: '#854d0e' }}>
            <p className="font-semibold">No disponible para esta tipología</p>
          </div>
        )
      }
      return (
        <div>
          <div className="flex items-center justify-between" style={rowStyle}>
            <span style={{ color: '#6B6660' }}>Entrega</span>
            <span className="font-semibold" style={{ color: '#2E2A26' }}>{fmt(fin36.downUSD)}</span>
          </div>
          <div className="flex items-center justify-between" style={rowStyle}>
            <span style={{ color: '#6B6660' }}>36 cuotas de</span>
            <span className="font-semibold" style={{ color: '#2E2A26' }}>{fmt(fin36.installmentUSD)}</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-bold" style={{ color: '#2E2A26' }}>Total financiado</span>
            <span className="text-2xl font-black" style={{ color: '#AA1120' }}>
              {fmt(fin36.downUSD + fin36.installmentUSD * 36)}
            </span>
          </div>
          <div className="rounded-xl p-3 text-sm" style={{ background: '#fefce8', border: '1px solid #fde047', color: '#854d0e' }}>
            <strong>Disponibilidad:</strong> {fin36.availability}. Confirmá antes de ofrecer al cliente.
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <section id="precios" className="py-20" style={{ background: '#fff' }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-white" style={{ backgroundColor: '#AA1120' }}>
            Precios
          </span>
          <h2 className="text-4xl font-black" style={{ color: '#2E2A26' }}>Calculadora de precios</h2>
          <p className="mt-4" style={{ color: '#6B6660' }}>Seleccioná el tamaño del lote y la modalidad de pago</p>
        </div>

        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl p-8 shadow-lg" style={{ border: '1px solid #D8D2C7', background: '#fff' }}>
            {/* Lot size selector */}
            <div className="mb-6">
              <label className="mb-3 block text-sm font-bold" style={{ color: '#2E2A26' }}>Tipología de lote</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(Object.keys(LOT_TYPES) as LotSize[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSize(key)}
                    className="rounded-xl p-3 text-center text-sm transition-all"
                    style={size === key
                      ? { border: '2px solid #AA1120', background: '#fdf2f2', color: '#AA1120', fontWeight: 700 }
                      : { border: '2px solid #D8D2C7', background: '#F2ECE0', color: '#2E2A26' }
                    }
                  >
                    <div className="font-bold">{LOT_TYPES[key].dims}</div>
                    <div className="text-xs opacity-70">{LOT_TYPES[key].sqm} m²</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Modality selector */}
            <div className="mb-8">
              <label className="mb-3 block text-sm font-bold" style={{ color: '#2E2A26' }}>Modalidad de pago</label>
              <div className="flex flex-col gap-2">
                {(Object.keys(MODALITY_LABELS) as Modality[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setModality(key)}
                    className="rounded-xl px-4 py-3 text-left text-sm transition-all"
                    style={modality === key
                      ? { border: '2px solid #AA1120', background: '#fdf2f2', color: '#AA1120', fontWeight: 600 }
                      : { border: '2px solid #D8D2C7', background: '#F2ECE0', color: '#2E2A26' }
                    }
                  >
                    {MODALITY_LABELS[key]}
                  </button>
                ))}
              </div>
            </div>

            {/* Result */}
            <div className="rounded-2xl p-6" style={{ background: '#F2ECE0' }}>
              {renderResult()}
            </div>

            <p className="mt-4 text-xs text-center" style={{ color: '#6B6660' }}>
              Precios en USD. Honorarios inmobiliarios (3% USD) no incluidos.{' '}
              <a href="#contacto" className="underline" style={{ color: '#AA1120' }}>Consultar disponibilidad real</a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
