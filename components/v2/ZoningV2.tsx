import { ZONING, PERMITTED_USES } from '@/lib/data'
import SectionLabel from './SectionLabel'

const CINZEL  = "var(--font-cinzel), 'Cinzel', serif"
const JOSEFIN = "var(--font-josefin), 'Josefin Sans', sans-serif"

export default function ZoningV2() {
  return (
    <section id="zonificacion" style={{ background: '#0C0C0C', padding: '7rem 1.5rem' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto' }}>

        <SectionLabel>Normativa</SectionLabel>

        <h2 style={{ fontFamily: CINZEL, fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 700, color: '#F5F0EB', marginBottom: '0.5rem' }}>
          Zonificación
        </h2>
        <p style={{ fontFamily: JOSEFIN, fontSize: '0.7rem', color: '#888', letterSpacing: '0.15em', marginBottom: '3rem' }}>
          Ordenanza N.º 7403 — Municipalidad de Corrientes
        </p>

        <div style={{ overflowX: 'auto', marginBottom: '2.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#111' }}>
                {['Zona', 'Sup. mín.', 'Frente mín.', 'Altura máx.', 'FOT', 'FOS'].map(h => (
                  <th key={h} style={{
                    padding: '1rem', textAlign: 'left', borderBottom: '2px solid #FF1200',
                    fontFamily: JOSEFIN, fontSize: '0.55rem', letterSpacing: '0.2em',
                    color: '#888', textTransform: 'uppercase',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ZONING.map((zone, i) => (
                <tr key={zone.zone} style={{ background: i % 2 === 0 ? '#0C0C0C' : '#0e0e0e', borderBottom: '1px solid #141414' }}>
                  <td style={{ padding: '1.25rem 1rem' }}>
                    <div style={{ fontFamily: CINZEL, fontWeight: 700, color: '#F5F0EB', fontSize: '0.9rem' }}>{zone.zone}</div>
                    <div style={{ fontFamily: JOSEFIN, fontSize: '0.65rem', color: '#888', marginTop: '0.2rem' }}>{zone.desc}</div>
                  </td>
                  <td style={{ padding: '1.25rem 1rem', fontFamily: JOSEFIN, color: '#ccc', fontSize: '0.8rem' }}>{zone.minSqm}</td>
                  <td style={{ padding: '1.25rem 1rem', fontFamily: JOSEFIN, color: '#ccc', fontSize: '0.8rem' }}>{zone.minFront}</td>
                  <td style={{ padding: '1.25rem 1rem', fontFamily: JOSEFIN, color: '#ccc', fontSize: '0.8rem' }}>{zone.maxHeight}</td>
                  <td style={{ padding: '1.25rem 1rem', fontFamily: CINZEL, fontWeight: 600, color: '#F5F0EB', fontSize: '0.9rem' }}>{zone.fot}</td>
                  <td style={{ padding: '1.25rem 1rem', fontFamily: CINZEL, fontWeight: 600, color: '#F5F0EB', fontSize: '0.9rem' }}>{zone.fos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: '#111', border: '1px solid #1a1a1a', padding: '2rem' }}>
          <p style={{ fontFamily: JOSEFIN, fontSize: '0.55rem', color: '#FF1200', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Usos permitidos principales
          </p>
          <p style={{ fontFamily: JOSEFIN, fontSize: '0.85rem', color: '#bbb', lineHeight: 1.7 }}>
            {PERMITTED_USES}
          </p>
        </div>

      </div>
    </section>
  )
}
