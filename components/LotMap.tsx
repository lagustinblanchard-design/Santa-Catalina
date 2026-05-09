'use client'

import { useState } from 'react'
import { STATUS_COLORS, STATUS_LABELS, type LotStatus } from '@/lib/data'

const STATUSES = Object.keys(STATUS_LABELS) as LotStatus[]

const BLOCK_NOTES: Record<number, { status: 'full' | 'partial' | 'available'; note: string }> = {
  4:  { status: 'full',    note: '100% vendida' },
  11: { status: 'partial', note: 'Lotes 7, 8, 13 y 14 disponibles (mixtos)' },
}

const PLANO_PDF = '/Loteo Sta. Catalina.pdf'

export default function LotMap() {
  const [activeFilter, setActiveFilter] = useState<LotStatus | 'ALL'>('ALL')

  return (
    <section id="lotes" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <span
            className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white"
            style={{ backgroundColor: '#E31837' }}
          >
            Disponibilidad
          </span>
          <h2 className="text-4xl font-black text-gray-900">Plano del loteo</h2>
          <p className="mt-4 text-gray-600">14 manzanas · Manzana 4 vendida al 100%</p>
        </div>

        {/* PDF viewer */}
        <div className="mb-10 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Desktop: embedded PDF */}
          <div className="hidden md:block">
            <object
              data={PLANO_PDF}
              type="application/pdf"
              className="w-full"
              style={{ height: '720px' }}
              aria-label="Plano del loteo Predios Santa Catalina"
            >
              {/* Fallback if browser can't render PDF */}
              <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                <p className="mb-4 text-lg font-medium">Tu navegador no puede mostrar el PDF</p>
                <a
                  href={PLANO_PDF}
                  download
                  className="rounded-xl px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#E31837' }}
                >
                  Descargar plano
                </a>
              </div>
            </object>
          </div>

          {/* Mobile: preview + button */}
          <div className="flex flex-col items-center gap-4 p-8 text-center md:hidden">
            <svg className="h-14 w-14 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <p className="font-semibold text-gray-900">Plano del loteo Santa Catalina</p>
              <p className="text-sm text-gray-500">RE/MAX PAYÉ — 14 manzanas</p>
            </div>
            <div className="flex gap-3">
              <a
                href={PLANO_PDF}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#E31837' }}
              >
                Ver plano
              </a>
              <a
                href={PLANO_PDF}
                download
                className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Descargar
              </a>
            </div>
          </div>
        </div>

        {/* Open in new tab button (desktop) */}
        <div className="mb-10 hidden justify-center md:flex">
          <a
            href={PLANO_PDF}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Abrir plano en pantalla completa
          </a>
        </div>

        {/* Filter buttons */}
        <div className="mb-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              activeFilter === 'ALL'
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Todas las manzanas
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setActiveFilter(s === activeFilter ? 'ALL' : s)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                activeFilter === s
                  ? STATUS_COLORS[s] + ' font-bold'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Blocks grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: 14 }, (_, i) => i + 1).map((block) => {
            const info = BLOCK_NOTES[block]
            const isSold = info?.status === 'full'
            const isPartial = info?.status === 'partial'

            return (
              <div
                key={block}
                className={`rounded-xl border-2 p-4 text-center transition-shadow hover:shadow-md ${
                  isSold
                    ? 'border-red-200 bg-red-50'
                    : isPartial
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Manzana</p>
                <p className="my-1 text-3xl font-black text-gray-900">{block}</p>
                {isSold ? (
                  <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                    Vendida
                  </span>
                ) : isPartial ? (
                  <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                    Disponible
                  </span>
                ) : (
                  <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                    Consultar
                  </span>
                )}
                {info?.note && (
                  <p className="mt-2 text-xs text-gray-500 leading-tight">{info.note}</p>
                )}
              </div>
            )
          })}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          Disponibilidad actualizada periódicamente. Para consultar un lote específico,{' '}
          <a href="#contacto" className="font-medium underline" style={{ color: '#E31837' }}>
            contactanos
          </a>.
        </p>
      </div>
    </section>
  )
}
