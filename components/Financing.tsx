import { FINANCING_12, FINANCING_36, LOT_TYPES, NOTARIAL_COSTS, type LotSize } from '@/lib/data'

const SIZES = Object.keys(LOT_TYPES) as LotSize[]

function fmt(n: number, currency: 'USD' | 'ARS' = 'USD') {
  return currency === 'USD'
    ? `USD ${n.toLocaleString('es-AR')}`
    : `$ ${n.toLocaleString('es-AR')}`
}

export default function Financing() {
  return (
    <section id="financiacion" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white" style={{ backgroundColor: '#FF1200' }}>
            Financiación
          </span>
          <h2 className="text-4xl font-black text-gray-900">Opciones de pago</h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Opción 1 — 12 cuotas */}
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <span className="rounded-full px-3 py-1 text-xs font-bold uppercase text-white" style={{ backgroundColor: '#0043FF' }}>
                Opción 1
              </span>
              <h3 className="mt-3 text-2xl font-bold text-gray-900">12 cuotas</h3>
              <p className="text-gray-500">30% de entrega + 12 cuotas mensuales</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-left font-semibold text-gray-600">Lote</th>
                    <th className="pb-3 text-left font-semibold text-gray-600">Moneda</th>
                    <th className="pb-3 text-left font-semibold text-gray-600">Entrega</th>
                    <th className="pb-3 text-left font-semibold text-gray-600">Cuota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {SIZES.filter(s => FINANCING_12[s]).map((size) => {
                    const f = FINANCING_12[size]!
                    return (
                      <>
                        {f.downPesos > 0 && (
                          <tr key={`${size}-pesos`} className="hover:bg-gray-50">
                            <td className="py-3 font-medium text-gray-900">{LOT_TYPES[size].dims}</td>
                            <td className="py-3 text-gray-600">Pesos</td>
                            <td className="py-3 text-gray-700">{fmt(f.downPesos, 'ARS')}</td>
                            <td className="py-3 text-gray-700">
                              {f.installmentPesos === 0
                                ? <span className="text-red-500 font-medium">Sin unidades</span>
                                : fmt(f.installmentPesos, 'ARS')
                              }
                            </td>
                          </tr>
                        )}
                        {f.downUSD > 0 && (
                          <tr key={`${size}-usd`} className="hover:bg-gray-50">
                            <td className="py-3 font-medium text-gray-900">{LOT_TYPES[size].dims}</td>
                            <td className="py-3 text-gray-600">USD</td>
                            <td className="py-3 text-gray-700">{fmt(f.downUSD)}</td>
                            <td className="py-3 text-gray-700">{fmt(f.installmentUSD)}</td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Opción 2 — 36 cuotas */}
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <span className="rounded-full px-3 py-1 text-xs font-bold uppercase text-white" style={{ backgroundColor: '#0043FF' }}>
                Opción 2
              </span>
              <h3 className="mt-3 text-2xl font-bold text-gray-900">36 cuotas</h3>
              <p className="text-gray-500">Entrega + 36 cuotas mensuales en USD</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-left font-semibold text-gray-600">Lote</th>
                    <th className="pb-3 text-left font-semibold text-gray-600">Entrega</th>
                    <th className="pb-3 text-left font-semibold text-gray-600">Cuota</th>
                    <th className="pb-3 text-left font-semibold text-gray-600">Disponibilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {SIZES.filter(s => FINANCING_36[s]).map((size) => {
                    const f = FINANCING_36[size]!
                    return (
                      <tr key={size} className="hover:bg-gray-50">
                        <td className="py-3 font-medium text-gray-900">{LOT_TYPES[size].dims}</td>
                        <td className="py-3 text-gray-700">{fmt(f.downUSD)}</td>
                        <td className="py-3 text-gray-700">{fmt(f.installmentUSD)}</td>
                        <td className="py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            f.availability === 'SIN UNIDADES'
                              ? 'bg-red-100 text-red-700'
                              : f.availability === 'Consultar'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {f.availability}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              ⚠️ Confirmar disponibilidad de la financiación a 36 cuotas <strong>antes</strong> de ofrecer al cliente.
            </div>
          </div>
        </div>

        {/* Notarial costs */}
        <div className="mt-10 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h3 className="mb-6 text-xl font-bold text-gray-900">Costos adicionales</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {NOTARIAL_COSTS.map((item) => (
              <div key={item.concept} className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">{item.concept}</p>
                <p className="mt-1 font-semibold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
