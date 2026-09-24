import AnimateIn from './AnimateIn'
import ResponsiveTable from './ResponsiveTable'
import { FINANCING_12, FINANCING_36, LOT_TYPES, NOTARIAL_COSTS, SITE, type LotSize } from '@/lib/data'

const SIZES = Object.keys(LOT_TYPES) as LotSize[]

// Espacio duro ( ) entre el símbolo de moneda y el número — con un espacio
// normal, un flex angosto en mobile puede partir la línea justo ahí y dejar el
// "$" solo arriba y el importe abajo (el bug de la captura del usuario).
function fmt(n: number, currency: 'USD' | 'ARS' = 'USD') {
  return currency === 'USD'
    ? `USD ${n.toLocaleString('es-AR')}`
    : `$ ${n.toLocaleString('es-AR')}`
}

export default function Financing() {
  // Opción 1 — hasta 2 filas por tamaño (Pesos / USD), cada una condicionada
  // a que exista ese tramo de financiación (mismo criterio que el loop original).
  const rows12 = SIZES.filter((s) => FINANCING_12[s]).flatMap((size) => {
    const f = FINANCING_12[size]!
    const out = []
    if (f.downPesos > 0) {
      out.push({
        key: `${size}-pesos`,
        cells: {
          lote: LOT_TYPES[size].dims,
          moneda: 'Pesos',
          entrega: fmt(f.downPesos, 'ARS'),
          cuota:
            f.installmentPesos === 0
              ? <span className="font-medium" style={{ color: '#AA1120' }}>Sin unidades</span>
              : fmt(f.installmentPesos, 'ARS'),
        },
      })
    }
    if (f.downUSD > 0) {
      out.push({
        key: `${size}-usd`,
        cells: { lote: LOT_TYPES[size].dims, moneda: 'USD', entrega: fmt(f.downUSD), cuota: fmt(f.installmentUSD) },
      })
    }
    return out
  })

  const rows36 = SIZES.filter((s) => FINANCING_36[s]).map((size) => {
    const f = FINANCING_36[size]!
    return {
      key: size,
      cells: {
        lote: LOT_TYPES[size].dims,
        entrega: fmt(f.downUSD),
        cuota: fmt(f.installmentUSD),
        disponibilidad: (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={
              f.availability === 'SIN UNIDADES'
                ? { background: '#fef2f2', color: '#AA1120' }
                : f.availability === 'Consultar'
                ? { background: '#fefce8', color: '#854d0e' }
                : { background: '#f0fdf4', color: '#166534' }
            }
          >
            {f.availability}
          </span>
        ),
      },
    }
  })

  return (
    <section id="financiacion" className="py-14 scroll-mt-20 sm:py-20" style={{ background: '#F2ECE0' }}>
      <div className="mx-auto max-w-6xl px-6">
        <AnimateIn>
          <div className="mb-12 text-center">
            <span className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-white" style={{ backgroundColor: '#AA1120' }}>
              Financiación
            </span>
            <h2 className="text-3xl font-black sm:text-4xl" style={{ color: '#2E2A26' }}>Opciones de pago</h2>
          </div>
        </AnimateIn>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Opción 1 — 12 cuotas */}
          <div className="rounded-3xl p-5 shadow-sm sm:p-8" style={{ background: '#fff', border: '1px solid #D8D2C7' }}>
            <div className="mb-6">
              <span className="rounded-full px-3 py-1 text-xs font-bold uppercase text-white" style={{ backgroundColor: '#8A6A47' }}>
                Opción 1
              </span>
              <h3 className="mt-3 text-2xl font-bold" style={{ color: '#2E2A26' }}>12 cuotas</h3>
              <p style={{ color: '#6B6660' }}>30% de entrega + 12 cuotas mensuales</p>
            </div>

            <ResponsiveTable
              columns={[
                { key: 'lote', label: 'Lote' },
                { key: 'moneda', label: 'Moneda' },
                { key: 'entrega', label: 'Entrega' },
                { key: 'cuota', label: 'Cuota' },
              ]}
              rows={rows12}
            />
          </div>

          {/* Opción 2 — 36 cuotas */}
          <div className="rounded-3xl p-5 shadow-sm sm:p-8" style={{ background: '#fff', border: '1px solid #D8D2C7' }}>
            <div className="mb-6">
              <span className="rounded-full px-3 py-1 text-xs font-bold uppercase text-white" style={{ backgroundColor: '#8A6A47' }}>
                Opción 2
              </span>
              <h3 className="mt-3 text-2xl font-bold" style={{ color: '#2E2A26' }}>36 cuotas</h3>
              <p style={{ color: '#6B6660' }}>Entrega + 36 cuotas mensuales en USD</p>
            </div>

            <ResponsiveTable
              columns={[
                { key: 'lote', label: 'Lote' },
                { key: 'entrega', label: 'Entrega' },
                { key: 'cuota', label: 'Cuota' },
                { key: 'disponibilidad', label: 'Disponibilidad' },
              ]}
              rows={rows36}
            />

            <div className="mt-6 rounded-xl p-4 text-sm" style={{ background: '#fefce8', border: '1px solid #fde047', color: '#854d0e' }}>
              Confirmar disponibilidad de la financiación a 36 cuotas <strong>antes</strong> de ofrecer al cliente.
            </div>
          </div>
        </div>

        {/* Financiación personalizada — vía de escape para lo que no entra en las opciones fijas */}
        <div className="mt-8 rounded-3xl p-5 text-center shadow-sm sm:p-8" style={{ background: '#fff', border: '1px solid #D8D2C7' }}>
          <span className="rounded-full px-3 py-1 text-xs font-bold uppercase text-white" style={{ backgroundColor: '#AA1120' }}>
            Financiación a medida
          </span>
          <h3 className="mt-3 text-2xl font-bold" style={{ color: '#2E2A26' }}>
            Para consultar la financiación que más se ajuste a tu presupuesto contactá a un asesor
          </h3>
          <a
            href={`https://wa.me/${SITE.WA_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, quiero consultar una financiación personalizada para un lote en Santa Catalina.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#25D366' }}
          >
            Hablar con un asesor
          </a>
        </div>

        {/* Notarial costs */}
        <div className="mt-10 rounded-3xl p-5 shadow-sm sm:p-8" style={{ background: '#fff', border: '1px solid #D8D2C7' }}>
          <h3 className="mb-6 text-xl font-bold" style={{ color: '#2E2A26' }}>Costos adicionales estimados</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Sólo se muestran los costos ya confirmados — los que siguen en null en
                NOTARIAL_COSTS (lib/data.ts) no se publican como "Por confirmar". */}
            {NOTARIAL_COSTS.filter((item) => item.value).map((item) => (
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
