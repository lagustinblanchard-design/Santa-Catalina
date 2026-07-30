import { Fragment } from 'react'
import AnimateIn from './AnimateIn'
import { FINANCING_12, FINANCING_36, LOT_TYPES, NOTARIAL_COSTS, type LotSize } from '@/lib/data'

const SIZES = Object.keys(LOT_TYPES) as LotSize[]

function fmt(n: number, currency: 'USD' | 'ARS' = 'USD') {
  return currency === 'USD'
    ? `USD ${n.toLocaleString('es-AR')}`
    : `$ ${n.toLocaleString('es-AR')}`
}

export default function Financing() {
  return (
    <section id="financiacion" className="py-20" style={{ background: '#F2ECE0' }}>
      <div className="mx-auto max-w-6xl px-6">
        <AnimateIn>
          <div className="mb-12 text-center">
            <span className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-white" style={{ backgroundColor: '#AA1120' }}>
              Financiación
            </span>
            <h2 className="text-4xl font-black" style={{ color: '#2E2A26' }}>Opciones de pago</h2>
          </div>
        </AnimateIn>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Opción 1 — 12 cuotas */}
          <div className="rounded-3xl p-8 shadow-sm" style={{ background: '#fff', border: '1px solid #D8D2C7' }}>
            <div className="mb-6">
              <span className="rounded-full px-3 py-1 text-xs font-bold uppercase text-white" style={{ backgroundColor: '#8A6A47' }}>
                Opción 1
              </span>
              <h3 className="mt-3 text-2xl font-bold" style={{ color: '#2E2A26' }}>12 cuotas</h3>
              <p style={{ color: '#6B6660' }}>30% de entrega + 12 cuotas mensuales</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #D8D2C7' }}>
                    <th className="pb-3 text-left font-semibold" style={{ color: '#6B6660' }}>Lote</th>
                    <th className="pb-3 text-left font-semibold" style={{ color: '#6B6660' }}>Moneda</th>
                    <th className="pb-3 text-left font-semibold" style={{ color: '#6B6660' }}>Entrega</th>
                    <th className="pb-3 text-left font-semibold" style={{ color: '#6B6660' }}>Cuota</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZES.filter(s => FINANCING_12[s]).map((size) => {
                    const f = FINANCING_12[size]!
                    return (
                      <Fragment key={size}>
                        {f.downPesos > 0 && (
                          <tr key={`${size}-pesos`} style={{ borderBottom: '1px solid #F2ECE0' }}>
                            <td className="py-3 font-medium" style={{ color: '#2E2A26' }}>{LOT_TYPES[size].dims}</td>
                            <td className="py-3" style={{ color: '#6B6660' }}>Pesos</td>
                            <td className="py-3" style={{ color: '#2E2A26' }}>{fmt(f.downPesos, 'ARS')}</td>
                            <td className="py-3">
                              {f.installmentPesos === 0
                                ? <span className="font-medium" style={{ color: '#AA1120' }}>Sin unidades</span>
                                : <span style={{ color: '#2E2A26' }}>{fmt(f.installmentPesos, 'ARS')}</span>
                              }
                            </td>
                          </tr>
                        )}
                        {f.downUSD > 0 && (
                          <tr key={`${size}-usd`} style={{ borderBottom: '1px solid #F2ECE0' }}>
                            <td className="py-3 font-medium" style={{ color: '#2E2A26' }}>{LOT_TYPES[size].dims}</td>
                            <td className="py-3" style={{ color: '#6B6660' }}>USD</td>
                            <td className="py-3" style={{ color: '#2E2A26' }}>{fmt(f.downUSD)}</td>
                            <td className="py-3" style={{ color: '#2E2A26' }}>{fmt(f.installmentUSD)}</td>
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
          <div className="rounded-3xl p-8 shadow-sm" style={{ background: '#fff', border: '1px solid #D8D2C7' }}>
            <div className="mb-6">
              <span className="rounded-full px-3 py-1 text-xs font-bold uppercase text-white" style={{ backgroundColor: '#8A6A47' }}>
                Opción 2
              </span>
              <h3 className="mt-3 text-2xl font-bold" style={{ color: '#2E2A26' }}>36 cuotas</h3>
              <p style={{ color: '#6B6660' }}>Entrega + 36 cuotas mensuales en USD</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #D8D2C7' }}>
                    <th className="pb-3 text-left font-semibold" style={{ color: '#6B6660' }}>Lote</th>
                    <th className="pb-3 text-left font-semibold" style={{ color: '#6B6660' }}>Entrega</th>
                    <th className="pb-3 text-left font-semibold" style={{ color: '#6B6660' }}>Cuota</th>
                    <th className="pb-3 text-left font-semibold" style={{ color: '#6B6660' }}>Disponibilidad</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZES.filter(s => FINANCING_36[s]).map((size) => {
                    const f = FINANCING_36[size]!
                    return (
                      <tr key={size} style={{ borderBottom: '1px solid #F2ECE0' }}>
                        <td className="py-3 font-medium" style={{ color: '#2E2A26' }}>{LOT_TYPES[size].dims}</td>
                        <td className="py-3" style={{ color: '#2E2A26' }}>{fmt(f.downUSD)}</td>
                        <td className="py-3" style={{ color: '#2E2A26' }}>{fmt(f.installmentUSD)}</td>
                        <td className="py-3">
                          <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={
                            f.availability === 'SIN UNIDADES'
                              ? { background: '#fef2f2', color: '#AA1120' }
                              : f.availability === 'Consultar'
                              ? { background: '#fefce8', color: '#854d0e' }
                              : { background: '#f0fdf4', color: '#166534' }
                          }>
                            {f.availability}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 rounded-xl p-4 text-sm" style={{ background: '#fefce8', border: '1px solid #fde047', color: '#854d0e' }}>
              Confirmar disponibilidad de la financiación a 36 cuotas <strong>antes</strong> de ofrecer al cliente.
            </div>
          </div>
        </div>

        {/* Notarial costs */}
        <div className="mt-10 rounded-3xl p-8 shadow-sm" style={{ background: '#fff', border: '1px solid #D8D2C7' }}>
          <h3 className="mb-6 text-xl font-bold" style={{ color: '#2E2A26' }}>Costos adicionales</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {NOTARIAL_COSTS.map((item) => (
              <div key={item.concept} className="rounded-xl p-4" style={{ background: '#F2ECE0' }}>
                <p className="text-sm" style={{ color: '#6B6660' }}>{item.concept}</p>
                <p className="mt-1 font-semibold" style={{ color: '#2E2A26' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
