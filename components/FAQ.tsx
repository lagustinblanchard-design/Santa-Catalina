import { FAQ } from '@/lib/faq'

// Server component sin JS: <details> abre y cierra solo. El texto está en el HTML aunque
// la pregunta esté cerrada, así que Google lo lee igual. El FAQPage (lib/structured-data.ts)
// sale de la misma lista.
export default function FAQSection() {
  return (
    <section id="preguntas" className="py-14 scroll-mt-20 sm:py-20" style={{ background: '#F2ECE0' }}>
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-10 text-center">
          <span className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-white" style={{ backgroundColor: '#AA1120' }}>
            Preguntas frecuentes
          </span>
          <h2 className="text-3xl font-black sm:text-4xl" style={{ color: '#2E2A26' }}>
            Lo que más nos preguntan sobre los terrenos
          </h2>
        </div>
        <div className="space-y-3">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group rounded-2xl border bg-white p-5" style={{ borderColor: '#D8D2C7' }}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold" style={{ color: '#2E2A26' }}>
                <h3 className="text-base">{q}</h3>
                <span aria-hidden className="text-xl transition-transform group-open:rotate-45" style={{ color: '#AA1120' }}>+</span>
              </summary>
              <p className="mt-3 text-sm" style={{ color: '#6B6660', lineHeight: 1.7 }}>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
