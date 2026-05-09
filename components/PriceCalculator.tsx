'use client'

import { useState } from 'react'
import { PRICES, FINANCING_12, FINANCING_36, LOT_TYPES, type LotSize } from '@/lib/data'

type Modality = 'contado' | '12_pesos' | '12_usd' | '36_usd'

const MODALITY_LABELS: Record<Modality, string> = {
  contado:  'Contado (5% desc.)',
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
  const [size, setSize] = useState<LotSize>('12x28')
  const [modality, setModality] = useState<Modality>('contado')

  const price = PRICES[size]
  const fin12 = FINANCING_12[size]
  const fin36 = FINANCING_36[size]

  function renderResult() {
    if (modality === 'contado') {
      const withDiscount = price.cashUSD * (1 - price.discount)
      return (
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
            <span className="text-gray-600">Precio lista</span>
            <span className="font-semibold text-gray-900">{fmt(price.cashUSD)}</span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
            <span className="text-gray-600">Descuento contado</span>
            <span className="font-semibold text-green-600">− {fmt(price.cashUSD * price.discount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">Total contado</span>
            <span className="text-2xl font-black" style={{ color: '#FF1200' }}>{fmt(withDiscount)}</span>
          </div>
          {price.discount === 0 && (
            <p className="mt-3 text-xs text-gray-400">* Sin descuento disponible para esta tipología.</p>
          )}
        </div>
      )
    }

    if (modality === '12_pesos') {
      if (!fin12 || fin12.installmentPesos === 0) {
        return (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center text-red-700">
            <p className="font-semibold">Sin unidades disponibles</p>
            <p className="text-sm mt-1">Esta opción no tiene lotes disponibles actualmente en pesos para este tamaño.</p>
          </div>
        )
      }
      return (
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
            <span className="text-gray-600">Entrega (30%)</span>
            <span className="font-semibold text-gray-900">{fmt(fin12.downPesos, 'ARS')}</span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
            <span className="text-gray-600">12 cuotas de</span>
            <span className="font-semibold text-gray-900">{fmt(fin12.installmentPesos, 'ARS')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">Total financiado</span>
            <span className="text-2xl font-black" style={{ color: '#FF1200' }}>
              {fmt(fin12.downPesos + fin12.installmentPesos * 12, 'ARS')}
            </span>
          </div>
        </div>
      )
    }

    if (modality === '12_usd') {
      if (!fin12 || fin12.downUSD === 0) {
        return (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center text-red-700">
            <p className="font-semibold">Sin unidades disponibles en USD</p>
            <p className="text-sm mt-1">Esta tipología no tiene financiación en USD a 12 cuotas actualmente.</p>
          </div>
        )
      }
      return (
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
            <span className="text-gray-600">Entrega (30%)</span>
            <span className="font-semibold text-gray-900">{fmt(fin12.downUSD)}</span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
            <span className="text-gray-600">12 cuotas de</span>
            <span className="font-semibold text-gray-900">{fmt(fin12.installmentUSD)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">Total financiado</span>
            <span className="text-2xl font-black" style={{ color: '#FF1200' }}>
              {fmt(fin12.downUSD + fin12.installmentUSD * 12)}
            </span>
          </div>
        </div>
      )
    }

    if (modality === '36_usd') {
      if (!fin36) {
        return (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center text-amber-800">
            <p className="font-semibold">No disponible para esta tipología</p>
          </div>
        )
      }
      return (
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
            <span className="text-gray-600">Entrega</span>
            <span className="font-semibold text-gray-900">{fmt(fin36.downUSD)}</span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
            <span className="text-gray-600">36 cuotas de</span>
            <span className="font-semibold text-gray-900">{fmt(fin36.installmentUSD)}</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-bold text-gray-900">Total financiado</span>
            <span className="text-2xl font-black" style={{ color: '#FF1200' }}>
              {fmt(fin36.downUSD + fin36.installmentUSD * 36)}
            </span>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            ⚠️ <strong>Disponibilidad:</strong> {fin36.availability}. Confirmá disponibilidad antes de ofrecer al cliente.
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <section id="precios" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white" style={{ backgroundColor: '#FF1200' }}>
            Precios
          </span>
          <h2 className="text-4xl font-black text-gray-900">Calculadora de precios</h2>
          <p className="mt-4 text-gray-600">Seleccioná el tamaño del lote y la modalidad de pago</p>
        </div>

        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg">
            {/* Lot size selector */}
            <div className="mb-6">
              <label className="mb-3 block text-sm font-semibold text-gray-700">Tipología de lote</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(Object.keys(LOT_TYPES) as LotSize[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSize(key)}
                    className={`rounded-xl border-2 p-3 text-center text-sm transition-all ${
                      size === key
                        ? 'border-red-500 bg-red-50 text-red-700 font-bold'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-bold">{LOT_TYPES[key].dims}</div>
                    <div className="text-xs opacity-70">{LOT_TYPES[key].sqm} m²</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Modality selector */}
            <div className="mb-8">
              <label className="mb-3 block text-sm font-semibold text-gray-700">Modalidad de pago</label>
              <div className="flex flex-col gap-2">
                {(Object.keys(MODALITY_LABELS) as Modality[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setModality(key)}
                    className={`rounded-xl border-2 px-4 py-3 text-left text-sm transition-all ${
                      modality === key
                        ? 'border-red-500 bg-red-50 text-red-700 font-semibold'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {MODALITY_LABELS[key]}
                  </button>
                ))}
              </div>
            </div>

            {/* Result */}
            <div className="rounded-2xl bg-gray-50 p-6">
              {renderResult()}
            </div>

            <p className="mt-4 text-xs text-center text-gray-400">
              Precios en USD. Honorarios inmobiliarios (3% USD) no incluidos.{' '}
              <a href="#contacto" className="underline" style={{ color: '#FF1200' }}>Consultar disponibilidad real</a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
