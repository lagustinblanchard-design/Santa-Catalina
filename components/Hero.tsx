import { SITE } from '@/lib/data'

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{ background: '#2E2A26' }}
    >
      {/* Warm dark gradient overlay */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #2E2A26 0%, #3d342e 50%, #2E2A26 100%)' }} />
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)' }} />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center text-white">
        {/* Badge — comercialización */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
          <span style={{ color: 'rgba(242,236,224,0.65)' }}>Comercializado por</span>
          <span className="font-bold" style={{ color: '#FF1200' }}>RE/MAX</span>
          <span className="font-semibold text-white">PAYÉ</span>
          <span style={{ color: 'rgba(242,236,224,0.5)' }}>·</span>
          <span style={{ color: 'rgba(242,236,224,0.65)' }}>Corrientes Capital</span>
        </div>

        <h1 className="mb-4 text-5xl font-black tracking-tight md:text-7xl" style={{ letterSpacing: '-0.025em' }}>
          Predios
          <br />
          <span style={{ color: '#AA1120' }}>Santa Catalina</span>
        </h1>

        <p className="mb-2 text-xl font-semibold text-white/90 md:text-2xl">
          {SITE.stage}
        </p>

        <p className="mb-10 text-base md:text-lg" style={{ color: 'rgba(242,236,224,0.75)' }}>
          {SITE.location}
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="#lotes"
            className="rounded-full px-8 py-4 text-base font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#AA1120' }}
          >
            Ver lotes disponibles
          </a>
          <a
            href="#precios"
            className="rounded-full border border-white/40 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-white/10"
          >
            Ver precios
          </a>
        </div>

        {/* Quick stats */}
        <div className="mt-16 grid grid-cols-3 gap-6 border-t pt-10" style={{ borderColor: 'rgba(242,236,224,0.15)' }}>
          <div>
            <p className="text-3xl font-black" style={{ color: '#AA1120' }}>14</p>
            <p className="text-sm" style={{ color: 'rgba(242,236,224,0.65)' }}>Manzanas</p>
          </div>
          <div>
            <p className="text-3xl font-black text-white">312–467</p>
            <p className="text-sm" style={{ color: 'rgba(242,236,224,0.65)' }}>m² por lote</p>
          </div>
          <div>
            <p className="text-3xl font-black text-white">USD</p>
            <p className="text-sm" style={{ color: 'rgba(242,236,224,0.65)' }}>Financiación disponible</p>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" style={{ color: 'rgba(242,236,224,0.4)' }}>
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  )
}
