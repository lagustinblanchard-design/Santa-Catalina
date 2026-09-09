import Link from 'next/link'
import { SITE } from '@/lib/data'

export default function SiteFooter() {
  return (
    <footer className="py-10 text-center text-sm" style={{ background: '#2E2A26', color: '#6B6660' }}>
      <p className="font-bold text-white">RE/MAX PAYÉ · Corrientes Capital</p>
      <p className="mt-1" style={{ color: '#D8D2C7' }}>{SITE.name} — {SITE.stage} · Ord. N.º 7403</p>
      <p className="mt-3 text-xs" style={{ color: '#6B6660' }}>Precios en USD. Sujeto a disponibilidad. Honorarios no incluidos.</p>
      <p className="mt-4 text-xs">
        <Link href="/privacidad" className="underline" style={{ color: '#6B6660' }}>Política de privacidad</Link>
        <span style={{ color: '#6B6660' }}> · </span>
        <Link href="/terminos" className="underline" style={{ color: '#6B6660' }}>Términos y condiciones</Link>
      </p>
    </footer>
  )
}
