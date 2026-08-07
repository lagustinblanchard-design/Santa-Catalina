import { DEED_INFO } from '@/lib/data'

const FIELDS: Array<{ key: keyof typeof DEED_INFO; label: string }> = [
  { key: 'reservation', label: 'Al reservar se firma' },
  { key: 'timing',      label: 'Escrituración' },
  { key: 'titleStatus', label: 'Estado dominial' },
]

export default function DeedInfo() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {FIELDS.map(({ key, label }) => {
        const value = DEED_INFO[key]
        return (
          <div key={key} className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#D8D2C7' }}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: '#8A6A47' }}>{label}</p>
            {value ? (
              <p className="text-sm" style={{ color: '#2E2A26' }}>{value}</p>
            ) : (
              <p className="text-sm italic" style={{ color: '#B08968' }}>Por confirmar</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
