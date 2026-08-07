import { PROJECT_PHASES, type PhaseStatus } from '@/lib/data'

const STATUS_LABEL: Record<PhaseStatus, string> = {
  completado: 'Completado',
  en_curso: 'En curso',
  proyectado: 'Proyectado',
}

const STATUS_COLOR: Record<PhaseStatus, string> = {
  completado: '#16a34a',
  en_curso: '#ca8a04',
  proyectado: '#6B6660',
}

export default function ProjectPhases() {
  return (
    <ol className="space-y-3">
      {PROJECT_PHASES.map((phase, i) => (
        <li
          key={phase.label}
          className="flex gap-4 rounded-2xl border p-5"
          style={{ background: '#fff', borderColor: '#D8D2C7' }}
        >
          <span
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ background: '#F2ECE0', color: '#8A6A47' }}
          >
            {i + 1}
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold" style={{ color: '#2E2A26' }}>{phase.label}</p>
              {phase.status ? (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide"
                  style={{ background: `${STATUS_COLOR[phase.status]}1A`, color: STATUS_COLOR[phase.status] }}
                >
                  {STATUS_LABEL[phase.status]}
                </span>
              ) : (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide italic"
                  style={{ background: '#F2ECE0', color: '#B08968' }}
                >
                  Por confirmar
                </span>
              )}
            </div>
            {phase.detail && (
              <p className="mt-1 text-sm" style={{ color: '#6B6660' }}>{phase.detail}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
