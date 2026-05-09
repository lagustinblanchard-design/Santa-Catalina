import { ZONING, PERMITTED_USES } from '@/lib/data'

export default function Zoning() {
  return (
    <section id="zonificacion" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white" style={{ backgroundColor: '#FF1200' }}>
            Normativa
          </span>
          <h2 className="text-4xl font-black text-gray-900">Zonificación</h2>
          <p className="mt-4 text-gray-500 text-sm">Ordenanza N.º 7403 — Municipalidad de Corrientes</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm mb-10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="px-6 py-4 text-left font-semibold">Zona</th>
                <th className="px-6 py-4 text-left font-semibold">Sup. mín.</th>
                <th className="px-6 py-4 text-left font-semibold">Frente mín.</th>
                <th className="px-6 py-4 text-left font-semibold">Altura máx.</th>
                <th className="px-6 py-4 text-left font-semibold">FOT máx.</th>
                <th className="px-6 py-4 text-left font-semibold">FOS máx.</th>
              </tr>
            </thead>
            <tbody>
              {ZONING.map((zone, i) => (
                <tr key={zone.zone} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{zone.zone}</div>
                    <div className="text-xs text-gray-500">{zone.desc}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{zone.minSqm}</td>
                  <td className="px-6 py-4 text-gray-700">{zone.minFront}</td>
                  <td className="px-6 py-4 text-gray-700">{zone.maxHeight}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{zone.fot}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{zone.fos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-6">
          <h3 className="mb-3 font-bold text-gray-900">Usos permitidos principales</h3>
          <p className="text-gray-700">{PERMITTED_USES}</p>
        </div>
      </div>
    </section>
  )
}
