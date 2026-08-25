'use client'

import type { ReactElement } from 'react'
import { useState } from 'react'
import { SERVICES, type ServiceStatus } from '@/lib/data'
import AvanceObraPanel from './AvanceObraPanel'

const ICONS: Record<string, ReactElement> = {
  'Agua corriente': <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-1.5 3-4.5 6-4.5 9a4.5 4.5 0 009 0c0-3-3-6-4.5-9z" />,
  'Luz eléctrica':  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />,
  'Cloaca':         <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />,
  'Ripio':          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20H5a2 2 0 01-2-2V6a2 2 0 012-2h4m6 16h4a2 2 0 002-2V6a2 2 0 00-2-2h-4m-6 16V4m6 16V4" />,
  'Cordón cuneta':  <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16M4 16h16M4 4h16v8H4z" />,
}

const STATUS_LABEL: Record<ServiceStatus, string> = {
  ejecutado: 'Ejecutado',
  en_obra: 'En obra',
  proyectado: 'Proyectado',
}

const STATUS_COLOR: Record<ServiceStatus, string> = {
  ejecutado: '#16a34a',
  en_obra: '#ca8a04',
  proyectado: '#6B6660',
}

export default function ServicesStatus() {
  const [selected, setSelected] = useState<string | null>(null)
  const active = SERVICES.find((s) => s.label === selected) ?? null

  return (
    <div onKeyDown={(e) => { if (e.key === 'Escape') setSelected(null) }}>
      <p className="mb-4 text-sm" style={{ color: '#6B6660' }}>
        Tocá un servicio para ver el mapa de avance de obra.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {SERVICES.map((s) => {
          const isSelected = s.label === selected
          return (
            <button
              key={s.label}
              type="button"
              aria-pressed={isSelected}
              aria-controls="avance-mapa"
              onClick={() => setSelected((prev) => (prev === s.label ? null : s.label))}
              className="flex h-full w-full cursor-pointer flex-col gap-3 rounded-2xl border p-5 text-left transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                background: '#fff',
                borderColor: isSelected ? '#AA1120' : '#D8D2C7',
                boxShadow: isSelected ? '0 0 0 3px rgba(170, 17, 32, 0.12)' : undefined,
                outlineColor: '#AA1120',
              }}
            >
              <div className="flex items-center gap-3">
                <svg className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: '#AA1120' }}>
                  {ICONS[s.label]}
                </svg>
                <span className="text-sm font-semibold" style={{ color: '#2E2A26' }}>{s.label}</span>
              </div>
              {s.status ? (
                <span
                  className="w-fit rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide"
                  style={{ background: `${STATUS_COLOR[s.status]}1A`, color: STATUS_COLOR[s.status] }}
                >
                  {STATUS_LABEL[s.status]}
                </span>
              ) : (
                <span
                  className="w-fit rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide italic"
                  style={{ background: '#F2ECE0', color: '#B08968' }}
                >
                  Por confirmar
                </span>
              )}
              {s.detail && (
                <p className="text-xs" style={{ color: '#6B6660' }}>{s.detail}</p>
              )}
            </button>
          )
        })}
      </div>

      {active && <AvanceObraPanel service={active} onClose={() => setSelected(null)} />}
    </div>
  )
}
