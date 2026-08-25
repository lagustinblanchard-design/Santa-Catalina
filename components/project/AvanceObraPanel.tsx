'use client'

import type { AvanceLayerId, ServiceStatus } from '@/lib/data'
import { AVANCE_LAYERS, AVANCE_MES } from '@/lib/avance'
import AvanceObraMap from './AvanceObraMap'

type Service = { label: string; status: ServiceStatus | null; detail: string | null; layer: AvanceLayerId | null }

const REF_SWATCH_STYLE: Record<string, React.CSSProperties> = {
  fill: {},
  hatch: {
    backgroundImage: 'repeating-linear-gradient(45deg, currentColor, currentColor 4px, transparent 4px, transparent 8px)',
  },
  line: { height: 3, alignSelf: 'center' },
  dashed: { height: 3, alignSelf: 'center', backgroundImage: 'repeating-linear-gradient(90deg, currentColor, currentColor 4px, transparent 4px, transparent 8px)' },
  dot: { borderRadius: '9999px' },
}

export default function AvanceObraPanel({ service, onClose }: { service: Service; onClose: () => void }) {
  return (
    <div
      id="avance-mapa"
      role="region"
      aria-label={`Mapa de avance de obra — ${service.label}`}
      className="mt-6 rounded-2xl border p-6"
      style={{ background: '#fff', borderColor: '#D8D2C7' }}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <h4 className="text-lg font-bold" style={{ color: '#2E2A26' }}>
          Avance de obra — {service.label}
        </h4>
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50"
          style={{ borderColor: '#D8D2C7', color: '#6B6660' }}
        >
          Cerrar
        </button>
      </div>

      {service.layer ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
          <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-xl border" style={{ borderColor: '#D8D2C7' }}>
            <AvanceObraMap layer={service.layer} />
          </div>
          <div>
            <p className="text-2xl font-black" style={{ color: '#AA1120' }}>
              {AVANCE_LAYERS[service.layer].resumen}
            </p>
            <p className="mt-2 text-sm" style={{ color: '#6B6660' }}>
              {AVANCE_LAYERS[service.layer].descripcionSvg}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {AVANCE_LAYERS[service.layer].referencias.map((ref) => (
                <div key={ref.label} className="flex items-center gap-2 text-sm" style={{ color: '#2E2A26' }}>
                  <span
                    className="inline-block h-3 w-3 flex-shrink-0"
                    style={{ color: ref.color, background: ref.kind === 'fill' || ref.kind === 'hatch' || ref.kind === 'dot' ? ref.color : undefined, ...REF_SWATCH_STYLE[ref.kind] }}
                  />
                  {ref.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-5 text-sm" style={{ background: '#F2ECE0', color: '#6B6660' }}>
          <p className="font-semibold" style={{ color: '#2E2A26' }}>Sin avance de obra para mostrar</p>
          <p className="mt-1">
            La red eléctrica está <strong>proyectada</strong>. La obra comienza una vez que la DPEC
            (Dirección Provincial de Energía de Corrientes) apruebe el proyecto — todavía no forma
            parte del reporte de avance mensual.
          </p>
        </div>
      )}

      <p className="mt-4 text-xs italic" style={{ color: '#6B6660' }}>
        Esquema informativo sobre el plano de mensura aprobado — no es un relevamiento topográfico.
        Datos del reporte de avance de {AVANCE_MES}.
      </p>
    </div>
  )
}
