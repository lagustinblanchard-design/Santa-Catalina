// Preguntas frecuentes de la home. Se arman SOLO con datos que ya están en lib/data.ts
// (mismos que muestra el resto de la página): si cambia un dato allá, cambia acá solo.
// No agregar respuestas con datos que no estén en lib/data.ts — nada inventado.
// Las usan components/FAQ.tsx (lo que se ve) y lib/structured-data.ts (FAQPage para
// Google): tienen que decir exactamente lo mismo.
import {
  SITE, SURROUNDINGS, LOT_TYPES, PRICES, SERVICES, DEED_INFO, NOTARIAL_COSTS, PERMITTED_USES,
} from './data'

const usd = (n: number) => `USD ${n.toLocaleString('es-AR')}`
const lista = (xs: string[]) => xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1]
const tiempo = (label: string) => SURROUNDINGS.travelTimes.find((t) => t.label.startsWith(label))?.time

const precios = Object.values(PRICES).map((p) => p.cashUSD)
const estado: Record<string, string> = { ejecutado: 'ejecutado', en_obra: 'en obra', proyectado: 'proyectado' }

export const FAQ: Array<{ q: string; a: string }> = [
  {
    q: '¿Dónde están los lotes de Distrito Payé?',
    a: `En el barrio Santa Catalina, Corrientes Capital, en la zona de expansión urbana junto a las viviendas del PROCREAR. ` +
      `Están a ${tiempo('Av. Maipú')} de Av. Maipú, ${tiempo('Terminal')} de la Terminal de Ómnibus y ${tiempo('Centro')} del centro de Corrientes.`,
  },
  {
    q: '¿Qué medidas tienen los terrenos?',
    a: `Hay ${Object.keys(LOT_TYPES).length} medidas: ` +
      lista(Object.values(LOT_TYPES).map((t) => `${t.dims} (${t.sqm.toLocaleString('es-AR')} m²)`)) +
      '. Los de 12 m de frente son residenciales y los de 15 m son mixtos, para vivienda y comercio.',
  },
  {
    q: '¿Cuánto cuesta un lote?',
    a: `El precio de lista va de ${usd(Math.min(...precios))} a ${usd(Math.max(...precios))} según la medida. ` +
      'Abonando al contado tiene un 5% de descuento. El detalle por medida está en la calculadora de precios de esta página.',
  },
  {
    q: '¿Se pueden comprar en cuotas?',
    a: 'Sí, hay financiación en pesos y en dólares: 30% de entrega y 12 cuotas mensuales en los lotes residenciales, ' +
      'o una entrega y 36 cuotas mensuales en dólares, sujeto a disponibilidad según la medida. ' +
      'Para un plan a medida, consultá por WhatsApp.',
  },
  {
    q: '¿Qué servicios tiene el loteo?',
    a: SERVICES.map((s) => `${s.label}: ${s.status ? estado[s.status] : 'por confirmar'}${s.detail ? `, ${s.detail.charAt(0).toLowerCase()}${s.detail.slice(1)}` : ''}`).join('. ') + '.',
  },
  {
    q: '¿Está aprobado el loteo?',
    a: `Sí. Está aprobado por la ${SITE.ordinance.replace('Ord.', 'Ordenanza')} de la Municipalidad de Corrientes y la mensura está aprobada por el Catastro de la Provincia de Corrientes.`,
  },
  {
    q: '¿Cómo es la escrituración?',
    a: `Al reservar se firma una ${DEED_INFO.reservation?.toLowerCase()}. La escrituración es ${DEED_INFO.timing?.charAt(0).toLowerCase()}${DEED_INFO.timing?.slice(1)} ${DEED_INFO.titleStatus}`,
  },
  {
    q: '¿Qué gastos hay además del precio del lote?',
    a: 'Además del precio se pagan estos gastos: ' +
      NOTARIAL_COSTS.filter((c) => c.value).map((c) => `${c.concept.toLowerCase()}, ${c.value}`).join('; ') + '.',
  },
  {
    q: '¿Qué se puede construir?',
    a: `Los usos permitidos son: ${PERMITTED_USES.charAt(0).toLowerCase()}${PERMITTED_USES.slice(1)} ` +
      'La altura y la superficie máximas dependen de la zona del lote; el detalle está en la sección de uso de suelo.',
  },
  {
    q: '¿Quién vende los lotes?',
    a: `Los desarrolla ${SITE.developer} y los comercializa ${SITE.broker}. Podés consultar por WhatsApp o dejar tus datos en el formulario de contacto.`,
  },
]
