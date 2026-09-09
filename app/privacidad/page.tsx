import Link from 'next/link'
import { SITE } from '@/lib/data'

export const metadata = {
  title: `Política de privacidad | ${SITE.name}`,
}

const h2 = 'mt-10 text-xl font-bold'
const p = 'mt-3 leading-relaxed'

export default function Privacidad() {
  return (
    <main className="px-6 py-20" style={{ background: '#F2ECE0' }}>
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-medium" style={{ color: '#AA1120' }}>
          ← Volver al inicio
        </Link>

        <h1 className="mt-6 text-4xl font-black" style={{ color: '#2E2A26' }}>
          Política de privacidad
        </h1>
        <p className="mt-2 text-sm" style={{ color: '#6B6660' }}>
          Última actualización: septiembre de 2026
        </p>

        <div style={{ color: '#2E2A26' }}>
          <h2 className={h2}>1. Responsable del tratamiento</h2>
          <p className={p}>
            {SITE.broker} es responsable del tratamiento de los datos personales que se
            recopilan a través de este sitio, en representación de la comercialización de{' '}
            {SITE.name} ({SITE.stage}), desarrollado por {SITE.developer}. Ante cualquier
            consulta sobre esta política podés escribirnos a{' '}
            <a href={`mailto:${SITE.CONTACT_EMAIL}`} className="underline">
              {SITE.CONTACT_EMAIL}
            </a>.
          </p>

          <h2 className={h2}>2. Datos que recopilamos</h2>
          <p className={p}>
            Recopilamos los datos que nos proporcionás voluntariamente a través del formulario
            de contacto (nombre, teléfono, tipo de lote de interés y mensaje) y, cuando escribís
            por WhatsApp, el número desde el que nos contactás. También podemos recopilar datos
            técnicos de navegación (tipo de dispositivo, páginas visitadas) a través de cookies
            propias, según se detalla en la sección 6.
          </p>

          <h2 className={h2}>3. Finalidad</h2>
          <p className={p}>
            Usamos estos datos exclusivamente para responder tu consulta, brindarte información
            comercial sobre {SITE.name} y, si nos autorizás, contactarte con novedades sobre el
            proyecto. No vendemos ni cedemos tus datos a terceros con fines comerciales ajenos a
            esta operación.
          </p>

          <h2 className={h2}>4. Base legal</h2>
          <p className={p}>
            El tratamiento de tus datos se basa en tu consentimiento, otorgado al completar el
            formulario de contacto o al iniciar una conversación por WhatsApp, conforme a la Ley
            N.º 25.326 de Protección de Datos Personales de la República Argentina.
          </p>

          <h2 className={h2}>5. Servicios de terceros</h2>
          <p className={p}>
            Este sitio utiliza Google Maps para mostrar la ubicación del loteo y, en algunas
            secciones, un widget de chat (Botpress) para responder consultas. Estos proveedores
            pueden procesar datos técnicos de tu navegación conforme a sus propias políticas de
            privacidad.
          </p>

          <h2 className={h2}>6. Cookies</h2>
          <p className={p}>
            Usamos cookies propias para recordar tu preferencia sobre este aviso y para el
            funcionamiento básico del sitio. No usamos cookies de seguimiento publicitario. Podés
            eliminar las cookies almacenadas desde la configuración de tu navegador en cualquier
            momento.
          </p>

          <h2 className={h2}>7. Tus derechos</h2>
          <p className={p}>
            Podés solicitar en cualquier momento el acceso, la rectificación o la supresión de
            tus datos personales escribiéndonos a{' '}
            <a href={`mailto:${SITE.CONTACT_EMAIL}`} className="underline">
              {SITE.CONTACT_EMAIL}
            </a>. La Agencia de Acceso a la Información Pública, en su carácter de Órgano de
            Control de la Ley N.º 25.326, es la autoridad de aplicación para reclamos
            relacionados con el tratamiento de tus datos personales.
          </p>

          <h2 className={h2}>8. Contacto</h2>
          <p className={p}>
            Ante cualquier duda sobre esta política, escribinos a{' '}
            <a href={`mailto:${SITE.CONTACT_EMAIL}`} className="underline">
              {SITE.CONTACT_EMAIL}
            </a>{' '}
            o por WhatsApp desde el botón disponible en el sitio.
          </p>
        </div>
      </div>
    </main>
  )
}
