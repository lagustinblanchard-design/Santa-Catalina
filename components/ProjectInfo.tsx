import { SITE, LOT_TYPES } from '@/lib/data'

export default function ProjectInfo() {
  return (
    <section id="proyecto" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white" style={{ backgroundColor: '#FF1200' }}>
            El proyecto
          </span>
          <h2 className="text-4xl font-black text-gray-900">Predios Santa Catalina</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Sistema de gestión y desarrollo inmobiliario comercializado por{' '}
            <strong>RE/MAX PAYÉ</strong> en Corrientes Capital.
          </p>
        </div>

        {/* Context cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
          {[
            { label: 'Desarrollador', value: SITE.developer, icon: '🏗️' },
            { label: 'Aprobación', value: SITE.ordinance, icon: '📋' },
            { label: 'Manzanas', value: `${SITE.totalBlocks} en total`, icon: '🗺️' },
            { label: 'Etapa actual', value: SITE.stage, icon: '📍' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <div className="mb-3 text-2xl">{item.icon}</div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{item.label}</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Location */}
        <div className="mb-16 rounded-2xl bg-gray-900 p-8 text-white">
          <h3 className="mb-3 text-xl font-bold">📍 Ubicación</h3>
          <p className="text-gray-300">{SITE.location}</p>
          <p className="mt-2 text-sm text-gray-400">
            Corrientes Capital — zona de expansión urbana con acceso a servicios y vías principales.
          </p>
        </div>

        {/* Lot typologies */}
        <div>
          <h3 className="mb-6 text-2xl font-bold text-gray-900">Tipologías de lotes</h3>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Tipología</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Medidas</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Superficie</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Uso</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(LOT_TYPES).map(([key, lot], i) => (
                  <tr key={key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 font-medium text-gray-900">{lot.label}</td>
                    <td className="px-6 py-4 text-gray-600">{lot.dims}</td>
                    <td className="px-6 py-4 text-gray-600">{lot.sqm} m²</td>
                    <td className="px-6 py-4 text-gray-600">{lot.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
