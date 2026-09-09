import ProjectInfo from '@/components/ProjectInfo'
import GoogleMapsLotMap from '@/components/GoogleMapsLotMap'
import PriceCalculator from '@/components/PriceCalculator'
import Financing from '@/components/Financing'
import Zoning from '@/components/Zoning'
import Gallery from '@/components/Gallery'
import ContactForm from '@/components/ContactForm'
import type { Lot } from '@/lib/lots'

// Cuerpo de secciones compartido por `/` y `/v3` — lo único que cambia entre
// ambas rutas es el Hero, así que las secciones no se forkean (ver el fork de
// components/v2/*, que hoy es contenido duplicado que deriva).
//
// NO lleva 'use client' a propósito: Financing y Zoning son server components
// sin estado. Este componente tiene que importarse desde la página server como
// hermano del Hero cliente; si queda dentro de un árbol cliente, esos dos pasan
// a cliente en silencio y empiezan a mandar JS sin que nada falle a la vista.
export default function PageSections({ lots }: { lots: Lot[] }) {
  return (
    <>
      <ProjectInfo />
      <GoogleMapsLotMap lots={lots} />
      <PriceCalculator />
      <Financing />
      <Zoning />
      <Gallery />
      <ContactForm />
    </>
  )
}
