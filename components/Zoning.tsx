import Image from 'next/image'
import { ZONING, PERMITTED_USES, PROHIBITED_USES } from '@/lib/data'

export default function Zoning() {
  return (
    <section id="zonificacion" className="py-20" style={{ background: '#fff' }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-white" style={{ backgroundColor: '#AA1120' }}>
            Normativa
          </span>
          <h2 className="text-4xl font-black" style={{ color: '#2E2A26' }}>Zonificación</h2>
          <p className="mt-4 text-sm" style={{ color: '#6B6660' }}>Ordenanza N.º 7403 — Municipalidad de Corrientes</p>
        </div>

        <div className="overflow-x-auto rounded-2xl shadow-sm mb-10" style={{ border: '1px solid #D8D2C7' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#2E2A26' }}>
                {['Zona', 'Sup. mín.', 'Frente mín.', 'Altura máx.', 'FOT máx.', 'FOS máx.'].map(h => (
                  <th key={h} className="px-6 py-4 text-left font-semibold text-white">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ZONING.map((zone, i) => (
                <tr key={zone.zone} style={{ background: i % 2 === 0 ? '#fff' : '#F2ECE0', borderTop: '1px solid #D8D2C7' }}>
                  <td className="px-6 py-4">
                    <div className="font-bold" style={{ color: '#2E2A26' }}>{zone.zone}</div>
                    <div className="text-xs" style={{ color: '#6B6660' }}>{zone.desc}</div>
                  </td>
                  <td className="px-6 py-4" style={{ color: '#2E2A26' }}>{zone.minSqm}</td>
                  <td className="px-6 py-4" style={{ color: '#2E2A26' }}>{zone.minFront}</td>
                  <td className="px-6 py-4" style={{ color: '#2E2A26' }}>{zone.maxHeight}</td>
                  <td className="px-6 py-4 font-semibold" style={{ color: '#2E2A26' }}>{zone.fot}</td>
                  <td className="px-6 py-4 font-semibold" style={{ color: '#2E2A26' }}>{zone.fos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-10 overflow-hidden rounded-2xl shadow-sm" style={{ border: '1px solid #D8D2C7' }}>
          <Image
            src="/zonificacion-mapa.webp"
            alt="Mapa de zonificación — Plan de Sector UG2, Plan Especial 2da Etapa de Urbanización"
            width={2200}
            height={1556}
            className="w-full h-auto"
          />
          <p className="px-6 py-4 text-xs" style={{ color: '#6B6660', background: '#F2ECE0' }}>
            Mapa de zonificación — Plan de Sector UG2, Ordenanza N.º 7403.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl p-6" style={{ background: '#F2ECE0', border: '1px solid #D8D2C7' }}>
            <h3 className="mb-3 font-bold" style={{ color: '#2E2A26' }}>Usos permitidos principales</h3>
            <p style={{ color: '#6B6660' }}>{PERMITTED_USES}</p>
          </div>
          <div className="rounded-2xl p-6" style={{ background: '#fef2f2', border: '1px solid #fca5a5' }}>
            <h3 className="mb-3 font-bold" style={{ color: '#991b1b' }}>Usos no admitidos</h3>
            <p style={{ color: '#991b1b' }}>{PROHIBITED_USES}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
