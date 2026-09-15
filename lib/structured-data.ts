// Datos estructurados (schema.org) — nada de esto cambia lo que ve un usuario;
// es sólo lo que leen Google y los buscadores/IA para entender de qué trata la
// página (quién vende, dónde está, desde qué precio). Sin esto no hay nada
// machine-readable en todo el sitio.
import { SITE, PRICES } from './data'
import { SITE_URL } from './site-url'

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
// se vende. cashUSD más bajo, con su descuento, como precio "desde".
export function listingJsonLd() {
  const lowest = Object.values(PRICES).reduce((min, p) => {
    const net = p.cashUSD * (1 - p.discount)
    return net < min ? net : min
  }, Infinity)

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: `${SITE.name} — ${SITE.stage}`,
    description:
      `Lotes residenciales y mixtos en Corrientes Capital. ${SITE.totalBlocks} manzanas, ` +
      `financiación en pesos y dólares. Comercializado por ${SITE.broker}.`,
    url: SITE_URL,
    image: `${SITE_URL}/hero-poster.webp`,
    datePosted: '2025-01-01',
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
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: Math.round(lowest),
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/#lotes`,
    },
    seller: {
      '@type': 'RealEstateAgent',
      name: SITE.broker,
    },
  }
}
