'use client'

import { SITE, LOT_TYPES } from '@/lib/data'
import AnimateIn from './AnimateIn'
import ProjectPhases from './project/ProjectPhases'
import ServicesStatus from './project/ServicesStatus'
import Surroundings from './project/Surroundings'
import DeedInfo from './project/DeedInfo'

export default function ProjectInfo() {
  return (
    <section id="proyecto" className="py-20" style={{ background: '#F2ECE0' }}>
      <div className="mx-auto max-w-6xl px-6">

        <AnimateIn>
          <div className="mb-12 text-center">
            <span className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-white" style={{ backgroundColor: '#AA1120' }}>
              El proyecto
            </span>
            <h2 className="text-4xl font-black" style={{ color: '#2E2A26' }}>Barrio Santa Catalina</h2>
            <p className="mt-4 text-lg max-w-2xl mx-auto" style={{ color: '#6B6660', lineHeight: 1.7 }}>
              Loteo residencial y mixto comercializado por{' '}
              <strong style={{ color: '#2E2A26' }}>RE/MAX PAYÉ</strong> en Corrientes Capital.
            </p>
          </div>
        </AnimateIn>

        {/* Context cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
          {[
            { label: 'Desarrollador', value: SITE.developer },
            { label: 'Aprobación',    value: SITE.ordinance },
            { label: 'Manzanas',      value: `${SITE.totalBlocks} en total` },
            { label: 'Etapa actual',  value: SITE.stage },
          ].map((item, i) => (
            <AnimateIn key={item.label} delay={i * 0.08}>
              <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#D8D2C7' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#8A6A47' }}>{item.label}</p>
                <p className="text-lg font-bold" style={{ color: '#2E2A26' }}>{item.value}</p>
              </div>
            </AnimateIn>
          ))}
        </div>

        {/* Etapas y cronograma de obra */}
        <AnimateIn>
          <div className="mb-16">
            <h3 className="mb-6 text-2xl font-bold" style={{ color: '#2E2A26' }}>Etapas del desarrollo</h3>
            <ProjectPhases />
          </div>
        </AnimateIn>

        {/* Services */}
        <AnimateIn>
          <div className="mb-16">
            <h3 className="mb-6 text-2xl font-bold" style={{ color: '#2E2A26' }}>Servicios</h3>
            <ServicesStatus />
          </div>
        </AnimateIn>

        {/* Location */}
        <AnimateIn direction="left">
          <div className="mb-16 rounded-2xl p-8 text-white" style={{ background: '#2E2A26' }}>
            <h3 className="mb-3 text-xl font-bold">Ubicación</h3>
            <p style={{ color: '#D8D2C7' }}>{SITE.location}</p>
            <p className="mt-2 text-sm" style={{ color: '#6B6660' }}>
              Corrientes Capital — zona de expansión urbana con acceso a servicios y vías principales.
            </p>
          </div>
        </AnimateIn>

        {/* Entorno y accesos */}
        <AnimateIn>
          <div className="mb-16">
            <h3 className="mb-6 text-2xl font-bold" style={{ color: '#2E2A26' }}>Entorno y accesos</h3>
            <Surroundings />
          </div>
        </AnimateIn>

        {/* Escrituración y titularidad */}
        <AnimateIn>
          <div className="mb-16">
            <h3 className="mb-6 text-2xl font-bold" style={{ color: '#2E2A26' }}>Escrituración y titularidad</h3>
            <DeedInfo />
          </div>
        </AnimateIn>

        {/* Lot typologies */}
        <AnimateIn>
          <div>
            <h3 className="mb-6 text-2xl font-bold" style={{ color: '#2E2A26' }}>Tipologías de lotes</h3>
            <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: '#D8D2C7' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#fff' }}>
                    <th className="px-6 py-4 text-left font-semibold" style={{ color: '#2E2A26' }}>Tipología</th>
                    <th className="px-6 py-4 text-left font-semibold" style={{ color: '#2E2A26' }}>Medidas</th>
                    <th className="px-6 py-4 text-left font-semibold" style={{ color: '#2E2A26' }}>Superficie</th>
                    <th className="px-6 py-4 text-left font-semibold" style={{ color: '#2E2A26' }}>Uso</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(LOT_TYPES).map(([key, lot], i) => (
                    <tr key={key} style={{ background: i % 2 === 0 ? '#fff' : '#F2ECE0', borderTop: '1px solid #D8D2C7' }}>
                      <td className="px-6 py-4 font-medium" style={{ color: '#2E2A26' }}>{lot.label}</td>
                      <td className="px-6 py-4" style={{ color: '#6B6660' }}>{lot.dims}</td>
                      <td className="px-6 py-4" style={{ color: '#6B6660' }}>{lot.sqm.toLocaleString('es-AR')} m²</td>
                      <td className="px-6 py-4" style={{ color: '#6B6660' }}>{lot.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </AnimateIn>

      </div>
    </section>
  )
}
