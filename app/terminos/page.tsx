import Link from 'next/link'
import { SITE } from '@/lib/data'

export const metadata = {
  title: `Términos y condiciones | ${SITE.name}`,
}

const h2 = 'mt-10 text-xl font-bold'
const p = 'mt-3 leading-relaxed'

export default function Terminos() {
  return (
    <main className="px-6 py-20" style={{ background: '#F2ECE0' }}>
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-medium" style={{ color: '#AA1120' }}>
          ← Volver al inicio
        </Link>

        <h1 className="mt-6 text-4xl font-black" style={{ color: '#2E2A26' }}>
          Términos y condiciones
        </h1>
        <p className="mt-2 text-sm" style={{ color: '#6B6660' }}>
          Última actualización: septiembre de 2026
        </p>

        <div style={{ color: '#2E2A26' }}>
          <h2 className={h2}>1. Objeto</h2>
          <p className={p}>
            Este sitio brinda información comercial sobre {SITE.name} ({SITE.stage}),
            desarrollado por {SITE.developer} y comercializado por {SITE.broker}, aprobado por{' '}
            {SITE.ordinance}. Al navegarlo aceptás estos términos.
          </p>

          <h2 className={h2}>2. Carácter informativo</h2>
          <p className={p}>
            La información publicada (precios, planes de financiación, disponibilidad de lotes,
            planos y renders) es de carácter informativo y no constituye una oferta vinculante de
            venta. Los precios están expresados en dólares estadounidenses (USD), no incluyen
            honorarios y están sujetos a disponibilidad y a modificación sin previo aviso. La
            operación se perfecciona únicamente mediante la documentación contractual
            correspondiente, suscripta con {SITE.broker}.
          </p>

          <h2 className={h2}>3. Disponibilidad de lotes</h2>
          <p className={p}>
            El estado de cada lote (disponible, reservado o vendido) se actualiza de forma
            periódica pero puede no reflejar cambios en tiempo real. Te recomendamos confirmar la
            disponibilidad con un asesor antes de tomar una decisión.
          </p>

          <h2 className={h2}>4. Propiedad intelectual</h2>
          <p className={p}>
            Los textos, imágenes, planos, renders y demás contenidos de este sitio son propiedad
            de {SITE.developer} y/o {SITE.broker}, o se utilizan con la debida autorización. No
            está permitida su reproducción total o parcial sin autorización previa.
          </p>

          <h2 className={h2}>5. Uso del sitio</h2>
          <p className={p}>
            Te comprometés a usar este sitio de forma lícita, sin realizar acciones que puedan
            dañar, sobrecargar o afectar su funcionamiento ni el de terceros.
          </p>

          <h2 className={h2}>6. Enlaces y servicios de terceros</h2>
          <p className={p}>
            El sitio integra servicios de terceros (Google Maps, WhatsApp, y en algunas secciones
            un widget de chat) sobre los cuales {SITE.broker} no tiene control ni responsabilidad
            respecto de su disponibilidad o funcionamiento.
          </p>

          <h2 className={h2}>7. Limitación de responsabilidad</h2>
          <p className={p}>
            {SITE.broker} no se responsabiliza por errores u omisiones en la información
            publicada, ni por la imposibilidad temporal de acceso al sitio. La información legal
            y técnica definitiva es la que consta en la documentación contractual del proyecto.
          </p>

          <h2 className={h2}>8. Modificaciones</h2>
          <p className={p}>
            Podemos actualizar estos términos en cualquier momento. La versión vigente es siempre
            la publicada en esta página.
          </p>

          <h2 className={h2}>9. Legislación aplicable</h2>
          <p className={p}>
            Estos términos se rigen por las leyes de la República Argentina. Para cualquier
            controversia derivada de su interpretación o aplicación, las partes se someten a los
            tribunales ordinarios de la Provincia de Corrientes.
          </p>

          <h2 className={h2}>10. Contacto</h2>
          <p className={p}>
            Consultas sobre estos términos:{' '}
            <a href={`mailto:${SITE.CONTACT_EMAIL}`} className="underline">
              {SITE.CONTACT_EMAIL}
            </a>.
          </p>
        </div>
      </div>
    </main>
  )
}
