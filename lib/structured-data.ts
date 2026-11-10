// Datos estructurados (schema.org) — nada de esto cambia lo que ve un usuario;
// es sólo lo que leen Google y los buscadores/IA para entender de qué trata la
// página (quién vende, dónde está, desde qué precio). Sin esto no hay nada
// machine-readable en todo el sitio.
import { SITE, PRICES } from './data'
import { SITE_URL } from './site-url'
import { FAQ } from './faq'

// Punto central del loteo — mismo valor que components/v4/scroll-stages.ts
// (HANDOFF_VIEW), calibrado a ojo contra el ortomosaico real.
const GEO = { latitude: -27.5297, longitude: -58.8052705 }

// Organización/agencia — va en cada página (app/layout.tsx). Es la entidad
// detrás del sitio, independiente de qué se esté mostrando.
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: SITE.broker,
    url: SITE_URL,
    logo: `${SITE_URL}/logo-paye.png`,
    email: SITE.CONTACT_EMAIL,
    telephone: SITE.WA_NUMBER,
    areaServed: {
      '@type': 'City',
      name: 'Corrientes',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Corrientes',
      addressRegion: 'Corrientes',
      addressCountry: 'AR',
    },
  }
}

// El loteo en sí — sólo en la home (app/page.tsx), que es donde efectivamente
// se vende. Rango de precios de LISTA (lo mismo que muestra la página); antes declaraba
// el de contado con descuento, que no aparece escrito en ningún lado de la página.
export function listingJsonLd() {
  const lista = Object.values(PRICES).map((p) => p.cashUSD)

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: `${SITE.name} — ${SITE.stage}`,
    description:
      `Lotes residenciales y mixtos en Corrientes Capital. ${SITE.totalBlocks} manzanas, ` +
      `financiación en pesos y dólares. Comercializado por ${SITE.broker}.`,
    url: SITE_URL,
    image: `${SITE_URL}/hero-poster.webp`,
    // Sin `datePosted`: tenía '2025-01-01' fijo (una fecha inventada, nunca actualizada) y
    // no es obligatorio para RealEstateListing. Mejor omitirlo que declarar una fecha falsa.
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Corrientes',
      addressRegion: 'Corrientes',
      addressCountry: 'AR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: GEO.latitude,
      longitude: GEO.longitude,
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: Math.min(...lista),
      highPrice: Math.max(...lista),
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/#lotes`,
    },
    seller: {
      '@type': 'RealEstateAgent',
      name: SITE.broker,
    },
  }
}

// Preguntas frecuentes de la home — mismo texto que components/FAQ.tsx (lib/faq.ts).
export function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}
