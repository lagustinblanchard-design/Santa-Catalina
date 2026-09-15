'use client'

import { SITE, LOT_TYPES } from '@/lib/data'
import AnimateIn from './AnimateIn'
import ResponsiveTable from './ResponsiveTable'
import ProjectPhases from './project/ProjectPhases'
import ServicesStatus from './project/ServicesStatus'
import Surroundings from './project/Surroundings'
import DeedInfo from './project/DeedInfo'

export default function ProjectInfo() {
  return (
    <section id="proyecto" className="py-14 scroll-mt-20 sm:py-20" style={{ background: '#F2ECE0' }}>
      <div className="mx-auto max-w-6xl px-6">

        <AnimateIn>
          <div className="mb-12 text-center">
            <span className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-white" style={{ backgroundColor: '#AA1120' }}>
              El proyecto
            </span>
            <h2 className="text-3xl font-black sm:text-4xl" style={{ color: '#2E2A26' }}>Barrio Santa Catalina</h2>
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
              <div className="rounded-2xl border p-4 sm:p-6" style={{ background: '#fff', borderColor: '#D8D2C7' }}>
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
          <div className="mb-16 rounded-2xl p-5 text-white sm:p-8" style={{ background: '#2E2A26' }}>
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
            {(() => {
              // Las dos tipologías Mixto se muestran como una sola fila, con
              // sus medidas y superficies listadas — son lotes distintos
              // (450 y 466,5 m²), no una sola tipología con dos nombres.
              const mixtoKeys = ['15x30', '15.55x30'] as const
              const mixto = mixtoKeys.map((key) => LOT_TYPES[key])
              const rows = [
                ...(Object.entries(LOT_TYPES).filter(([key]) => !mixtoKeys.includes(key as typeof mixtoKeys[number])) as [string, typeof LOT_TYPES[keyof typeof LOT_TYPES]][])
                  .map(([key, lot]) => ({ key, label: lot.label, dims: lot.dims, sqm: `${lot.sqm.toLocaleString('es-AR')} m²`, use: lot.use })),
                {
                  key: 'mixto',
                  label: 'Mixto',
                  dims: mixto.map((lot) => lot.dims).join(' / '),
                  sqm: mixto.map((lot) => `${lot.sqm.toLocaleString('es-AR')} m²`).join(' / '),
                  use: mixto[0].use,
                },
              ]
              return (
                <ResponsiveTable
                  columns={[
                    { key: 'label', label: 'Tipología' },
                    { key: 'dims', label: 'Medidas' },
                    { key: 'sqm', label: 'Superficie' },
                    { key: 'use', label: 'Uso' },
                  ]}
                  rows={rows.map((r) => ({ key: r.key, cells: r }))}
                />
              )
            })()}
          </div>
        </AnimateIn>

      </div>
    </section>
  )
}
