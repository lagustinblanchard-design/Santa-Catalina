# Pilu en la web — contrato con el CRM

Esta web (santa-catalina) pone **solo el chat**: `components/pilu/PiluChat.tsx` + `lib/pilu.ts`.
El cerebro de Pilu (IA, precios desde la planilla, escalación, alta del lead) vive en el backend
del CRM (`inmobiliaria/web/backend`). Definición de Pilu: `PROMPT-LEADS-WHATSAPP.md` sección 21
(repo del CRM). No se copian esas reglas acá: una sola fuente.

**Estado:** el widget está construido y **apagado**. El endpoint ya está construido y probado en el CRM (rama
`leads-whatsapp`: `api/routes/pilu.py`, `core/pilu.py`, migración `0038_pilu_web`). No se ve nada en la web hasta que:
1. se publique el CRM con ese endpoint y se prenda `pilu_web_activo=true` en `config_app` (sin eso responde 503),
2. el CRM permita el origen de esta web en CORS (`CORS_ORIGINS` en Railway),
3. se cargue `NEXT_PUBLIC_PILU_API_URL` en Vercel y se **vuelva a publicar** (la variable se
   incrusta en el build; también activa los párrafos de Pilu en `/privacidad` y `/terminos` y el
   origen en la CSP de `next.config.ts`).

## Endpoint

`POST {NEXT_PUBLIC_PILU_API_URL}/pilu/chat` — público (sin login), `Content-Type: application/json`.
El navegador llama directo (no pasa por esta web), `credentials: 'omit'`.

### Pedido

| Campo | Tipo | Notas |
|---|---|---|
| `conversation_id` | string | UUID aleatorio generado en el navegador (sessionStorage). Sin datos personales. El servidor guarda el historial **por este id**: el cliente manda solo el mensaje nuevo. |
| `message` | string (≤ 500) | Mensaje del visitante. Ausente cuando se manda `lead`. |
| `intent` | `"precios"` \| `"formas_pago"` \| `"visita"` | Solo cuando el visitante toca un botón rápido del saludo (el `message` trae el texto del botón). `"precios"` se responde con la lista armada por código desde la planilla — ver sección 21 del PROMPT del CRM, "Ver precios". Si el visitante lo escribe a mano no viene `intent`: el CRM lo detecta igual. |
| `lead` | objeto | Ausente en el chat normal. Ver abajo. |
| `ref` | string \| null | Código del agente cuyo link trajo al visitante (`?ref=fabricio`, ver `lib/agents.ts`). Si es válido, el lead se asigna **directo a ese agente** (si no, reparto normal). Puede traer un código que el CRM no conoce: validar. |
| `utm` | objeto | `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid` con los que llegó (los que existan). Es atribución de campaña: guardarla con el lead. |
| `page` | string | Ruta donde está el visitante (hoy siempre `/`). |

`lead` (se manda cuando el visitante completa el formulario, **siempre sin `message`**):

| Campo | Notas |
|---|---|
| `nombre` | ≤ 120. |
| `telefono` | Texto libre del visitante (≤ 40), 8–15 dígitos. **El CRM lo normaliza** (`core/leads/telefono.py`). |
| `consentimiento` | Siempre `true` (la casilla es obligatoria en la UI). **El servidor debe rechazar si no es `true`.** |
| `consent_text` | Texto exacto de la casilla que vio el visitante. **Guardarlo junto al lead** como constancia (Ley 25.326). |
| `hp` | Campo trampa invisible. **Si viene con algo, descartar el pedido** (responder 200 con `lead_ok: true` para no avisarle al bot). |

### Respuesta

Chat normal (200): `{ "reply": string, "ask_contact"?: boolean, "quick_replies"?: string[] }`
- `reply`: texto de Pilu (se muestra tal cual, texto plano, con saltos de línea). No vacío.
- `quick_replies`: botones de respuesta sugeridos bajo el último mensaje de Pilu (la web muestra hasta 4, de hasta 40
  caracteres). Al tocar uno se manda su texto como mensaje normal. Ej.: tras la lista de precios, `["De contado", "Financiado"]`.
- `ask_contact: true`: conviene pasar con una persona (el visitante la pidió, o escalación según la sección 21: humano, reclamo, abogado, estafa, cancelar, reservar, seña, quiero comprar, objeción fuera del playbook). La web muestra el formulario de contacto.

Alta del lead (200): `{ "lead_ok": true }` → el CRM hace `ingresar_lead(fuente="web", ...)` y entra al reparto.

Errores: `429` = rate limit (la web muestra "muchos mensajes seguidos"); cualquier otro no-2xx = "no pude responder" con opción de reintentar y botón de WhatsApp. La web no lee el cuerpo de los errores.

## Lo que tiene que hacer el servidor (la web NO lo puede garantizar)

- **Rate limit por IP** y **tope de mensajes por conversación** (la web corta en 30 mensajes solo por cortesía de UI).
- **CORS** solo para el origen de esta web (`https://santacatalina.payedesarrollos.com`). Responder el preflight `OPTIONS`.
- **Nunca inventar cifras**: precios solo de la planilla "LISTA DE PRECIOS SANTA CATALINA", precio de lista + "abonando al contado tiene un 5% de descuento" sin calcular el monto (sección 21).
- Sin datos sensibles ni de cobranzas en ninguna respuesta (sección 2 del PROMPT del CRM).
- Guardar cada conversación para el **aprendizaje supervisado** de la sección 21 (reporte semanal de preguntas y
  objeciones, respuestas nuevas solo con aprobación humana). Lo que diga `/privacidad` sobre guardar la charla depende de esto.
- Longitud de `message` y de cada campo del lead: validar del lado del servidor, no confiar en la web.
- Tiempo de respuesta: la web espera hasta **45 s** y después muestra error.

## Qué hace la web que conviene saber

- Se monta **solo en la home**; no en `/mapa-3d`, `/lote/*` ni las páginas legales.
- El formulario de contacto aparece cuando: el visitante toca "Hablar con una persona", el servidor responde `ask_contact: true`, o se le ofrece después de 4 mensajes (puede rechazarlo con "Seguir chateando").
- Al confirmar el lead dispara el evento `Lead` del píxel de Meta (solo si aceptó cookies) con `content_name: 'Pilu'`.
- Si Pilu falla, el visitante tiene un link a WhatsApp; ese link pasa por `AgentRef` y va al número del agente del `?ref=`.
- Texto de presentación y botones rápidos son texto fijo del widget (`PiluChat.tsx`): si cambia el tono de Pilu en el playbook, ajustarlo ahí.

## Pendiente antes de prender

- Publicar el CRM (rama de leads; la F2 está esperando OK) con `ANTHROPIC_API_KEY` cargada y la planilla de precios
  conectada (`/crm/precios/planilla`). Cargar en `pilu_refs` el agente del CRM de cada código `?ref=` (`lib/agents.ts`).
- Hernán aprueba los textos de Pilu y los párrafos nuevos de `/privacidad` y `/terminos` (nombran a Anthropic como proveedor de IA y dicen que se guarda la conversación: **tienen que coincidir con lo que haga el CRM de verdad**).
- Probar de punta a punta en producción con un `?ref=` real.
