import { SURROUNDINGS } from '@/lib/data'

export default function Surroundings() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#D8D2C7' }}>
        <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: '#8A6A47' }}>
          Tiempos de viaje
        </p>
        <div className="space-y-3">
          {SURROUNDINGS.travelTimes.map(({ label, time }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm" style={{ color: '#2E2A26' }}>{label}</span>
              <span className="text-sm font-bold" style={{ color: '#AA1120' }}>{time}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#D8D2C7' }}>
        <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: '#8A6A47' }}>
          Servicios cercanos
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SURROUNDINGS.nearbyServices.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: '#16a34a' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span className="text-sm" style={{ color: '#2E2A26' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
