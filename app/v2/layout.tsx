import { Cinzel, Josefin_Sans } from 'next/font/google'

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const josefin = Josefin_Sans({
  subsets: ['latin'],
  variable: '--font-josefin',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${cinzel.variable} ${josefin.variable}`}
      style={{ fontFamily: "var(--font-josefin), 'Josefin Sans', sans-serif" }}
    >
      {children}
    </div>
  )
}
