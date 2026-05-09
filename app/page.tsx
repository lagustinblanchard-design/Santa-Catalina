import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import ProjectInfo from '@/components/ProjectInfo'
import InteractiveLotMap from '@/components/InteractiveLotMap'
import PriceCalculator from '@/components/PriceCalculator'
import Financing from '@/components/Financing'
import Zoning from '@/components/Zoning'
import Gallery from '@/components/Gallery'
import ContactForm from '@/components/ContactForm'
import WhatsAppButton from '@/components/WhatsAppButton'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ProjectInfo />
        <InteractiveLotMap />
        <PriceCalculator />
        <Financing />
        <Zoning />
        <Gallery />
        <ContactForm />
      </main>
      <footer className="bg-gray-900 py-10 text-center text-sm text-gray-400">
        <p className="font-semibold text-white">RE/MAX PAYÉ · Corrientes Capital</p>
        <p className="mt-1">Predios Santa Catalina — Segunda Preventa · Ord. N.º 7403</p>
        <p className="mt-3 text-xs text-gray-600">Precios en USD. Sujeto a disponibilidad. Honorarios no incluidos.</p>
      </footer>
      <WhatsAppButton />
    </>
  )
}
