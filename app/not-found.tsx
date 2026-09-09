import Link from 'next/link'

export const metadata = {
  title: 'Página no encontrada | Distrito Payé',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ background: '#F2ECE0' }}
    >
      <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#AA1120' }}>
        Error 404
      </p>
      <h1 className="mt-4 text-4xl font-black" style={{ color: '#2E2A26' }}>
        Esta página no existe
      </h1>
      <p className="mt-4 max-w-md" style={{ color: '#6B6660' }}>
        Puede que el enlace esté roto o la página se haya movido. Volvé al inicio para ver los
        lotes disponibles en Distrito Payé.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#AA1120' }}
      >
        Volver al inicio
      </Link>
    </main>
  )
}
