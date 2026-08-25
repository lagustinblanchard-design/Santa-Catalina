# Showroom 3D — notas de continuidad

Contexto técnico del showroom 3D del loteo (`/mapa-3d`), para retomar en cualquier máquina sin perder el hilo. Si estás leyendo esto en una sesión nueva de Claude Code: esto te da el 100% del contexto de lo construido hasta acá.

## Qué existe hoy

- **`components/LotMap3D.tsx`** — showroom 3D: deck.gl standalone sobre satélite Esri (gratis, sin API key de Google). Reusa el georreferenciado ya calibrado (`svgToLngLat`, transformación conforme de 4 puntos anclada a M1-L1) y `lib/lot_geometry.json` (306 lotes).
- **`app/mapa-3d/page.tsx`** — ruta indexable, enlazada desde `Navbar.tsx` («Recorrido 3D») y desde la sección de lotes de la home («Ver en 3D →», junto al mapa de Google).
- Máquina de estados `portada → tour → free`:
  - **Portada**: logo Payé sobre satélite rotando + "Ver presentación" / "Explorar directo".
  - **Tour guiado**: 4 waypoints con `FlyToInterpolator` (intro, overview 306 lotes, disponibles con spotlight, "a 10 min del centro"), captions animadas, dots de progreso, botón Saltar. Tocar la pantalla corta el tour a modo libre.
  - **Free**: filtros por estado, click en lote → ficha con precio real, botón Recorrido, Reencuadrar.
- **Cámara cinemática**: vuelo de entrada (picada desde arriba → encuadre final), rotación automática lenta tras inactividad (pausa si hay lote seleccionado o durante el tour).
- **Iluminación "hora dorada"**: `DirectionalLight` cálida + `AmbientLight` fría tenue, cielo gradiente + viñeta.
- **Etiquetas de lote** (número) sólo al acercar zoom.

## Arquitectura de cámara — reescrita para sacarla del ciclo de render de React

Antes, `viewState` vivía en `useState`: cada tick de la rotación automática y cada frame
de un `flyTo` llamaba `setViewState`, re-renderizando el componente completo (10 bloques
de overlay) hasta 60 veces por segundo. Medible con el profiler de React DevTools.

**Fix:** `viewState` ya no es estado de React. Vive en `viewStateRef` (un `useRef`) y se
empuja al canvas con `deckRef.current.deck.setProps({ viewState })` — directo sobre la
instancia de `Deck`, sin pasar por React. `<DeckGL>` usa `initialViewState` (modo
"uncontrolled" de deck.gl), no `viewState` controlado.

- `flyCamera(view, durationMs)` — reemplaza todos los `setViewState(flyTo(...))` de antes.
  Elige `FlyToInterpolator` (arco de Van Wijk) sólo cuando el centro se traslada; si dos
  paradas comparten centro (`isSameCenter`, ~11m de margen), usa `LinearInterpolator` +
  un ease-in-out cúbico — el arco de Van Wijk degenera sin traslación.
- El loop de rotación automática y `startHoldDrift` (drift suave durante el margen entre
  paradas del tour, `HOLD_MS = 400`) escriben `viewStateRef.current` y llaman
  `deck.setProps` directo, en un `requestAnimationFrame` — cero `setState`.
- El `onViewStateChange` de `<DeckGL>` sigue existiendo, pero ya NO llama `setViewState`:
  actualiza `viewStateRef`, hace un eco defensivo a `deck.setProps` (necesario una vez que
  cualquier `setProps({viewState})` explícito ocurrió — ver comentario en el código,
  `Deck._onViewStateChange` deja de auto-aplicar en ese caso), y deriva `zoomedIn` y
  `hazeOpacity` (bruma de horizonte) como estado de React, pero throttleados: sólo
  cuando el valor redondeado cambia, así que no re-renderizan en cada frame.
- **`prefers-reduced-motion`** ahora sí se respeta acá (antes el comentario de
  `globals.css` decía que sí pero era falso — ninguna regla CSS llega a esta cámara,
  que corre en JS/WebGL): sin rotación automática, sin drift, `flyCamera` salta directo
  al encuadre final sin transición.
- **Si algo de esto se toca:** no reintroducir `setViewState`/`useState<MapViewState>`
  para la posición de cámara sin volver a leer esta sección — es la causa raíz que se
  arregló, no un detalle de implementación intercambiable.

**Pendiente de verificar interactivamente** (no se pudo en la sesión que hizo este
cambio — sin Playwright/chromium-cli instalado en esa máquina): que arrastrar/rotar con
el mouse siga andando bien tras el cambio a modo "uncontrolled", y medir con el profiler
que la rotación automática ya no dispara commits de React. Verificado sin navegador real:
`tsc --noEmit` y `next build` limpios, y un dev server con un navegador real adjunto (vía
la extensión de VS Code) mostrando compilaciones limpias y consola sin errores nuevos.

## Overlay del showroom — pasado al vocabulario de /v2

El chrome de UI (título, filtros, controles, caption del tour, portada, ficha del lote)
usaba el vocabulario de v1 (`rounded-full`, `bg-black/40`, `font-black`, Tailwind puro).
Se llevó a la gramática de `/v2`: Cinzel para títulos/números (`CINZEL` const, arriba del
archivo), Josefin en caja alta para microetiquetas (`JOSEFIN` const), bordes rectos con
hairline de 1px en vez de píldoras redondeadas, `#FF1200` como único acento (antes
mezclaba `#FF4230`/`#dc2626`/`#AA1120`). Los chips de filtro/toggle comparten un helper,
`chipStyle(active)`, para no repetir el mismo objeto de estilo seis veces.

Cinzel/Josefin cargaban sólo en `app/v2/layout.tsx`, acotadas a ese subárbol — `/mapa-3d`
es ruta hermana, no hija, así que no las recibía. Se subieron a `app/layout.tsx` (raíz);
`app/v2/layout.tsx` ahora sólo consume las variables, no vuelve a cargar las fuentes.

`/mapa-3d` dejó de ser un callejón sin salida desde `/v2`: `NavbarV2.tsx` (`LINKS`) y
`InteractiveLotMap.tsx` (usado sólo por `app/v2/page.tsx`) ahora enlazan a él, replicando
el patrón `Ver en 3D →` que ya existía en `GoogleMapsLotMap.tsx` (v1).

## Terreno fotorrealista (malla de dron) — hook dormido, ya implementado

Plan completo (capturas, specs de vuelo) en `~/.claude/plans/para-el-terreno-fotorrealista-tranquil-newell.md` de la máquina donde se escribió — si no lo tenés a mano, acá el resumen:

**Pipeline:** dron (grilla nadir, 80% frontal / 70% lateral, ~80-100m AGL, + 1 pasada oblicua ~45° de borde) → **WebODM** (fotogrametría, gratis, obtiene `odm_textured_model_geo.obj` + `.mtl` + texturas) → **Cesium ion** (tilea a 3D Tiles, free tier) → deck.gl `Tile3DLayer`.

> **Para el día del vuelo: ver `VUELO-FOTOGRAMETRIA-CHECKLIST.md`** — checklist de campo con
> parámetros exactos, ventana horaria, cálculo de baterías y verificación in situ.

**Ya implementado en `LotMap3D.tsx` (dormido, sin regresión):**
- `Tile3DLayer` + `CesiumIonLoader` (de `@loaders.gl/3d-tiles`, ya instalado, sin deps nuevas).
- Gateado por `HAS_TERRAIN_MESH = Boolean(NEXT_PUBLIC_CESIUM_ION_ASSET_ID && NEXT_PUBLIC_CESIUM_ION_TOKEN)`. Sin esas env vars, el toggle "🛰 Vista real (dron)" ni aparece — validado con capturas + 0 errores de consola, comportamiento idéntico a antes.
- Toggle `photoMode: 'disponibilidad' | 'fotorrealista'`: en fotorrealista se apaga Esri, entra la malla, los lotes bajan opacidad y suman `NEXT_PUBLIC_TERRAIN_BASE_ELEV` (offset de cota, default 0, ajustar a ojo — Corrientes es plano, alcanza una constante).
- CSP (`next.config.ts`): sumados `*.cesium.com`, `assets.ion.cesium.com`, `api.cesium.com`.
- `.env.example`: documentadas las 3 vars (vacías, no son secretos reales).

**Pendiente físico (no es código):** volar el dron (ya coordinado con el piloto, RX 6600/8GB confirmado para lo que sigue), procesar en WebODM, subir a Cesium ion, cargar las env vars reales en `.env.local` local (nunca commitear) → el toggle se prende solo.

**Videos de dron ya recibidos (2026-07-2X):** 7 clips (DJI_0826-0833) analizados — **todos cinematográficos** (oblicuos, loops/reveals/ascensos, altura 2-114m variable), **ninguno sirve para fotogrametría** (falta grilla nadir con solape sistemático). Sirven como B-roll de avance de obra. El predio está en plena obra de infraestructura (calles/zanjas de desagüe en curso) al momento de esos videos — dato real, no vacío/prolijo.

## Render cinematográfico complementario — Twinmotion (decisión tomada)

Para un video/reel pulido tipo el de `joan.urbania3d` (DOCTA) + posible experiencia interactiva "Presenter", se evaluó Blender vs Twinmotion vs BlenderGIS. **Decisión: Twinmotion.**

- Gratis para nosotros (empresa <US$1M facturación anual, sin marca de agua ni límites).
- Mucho más rápido de aprender que Blender para este tipo de escena (vegetación/terreno con drag-and-drop, no shaders por nodos).
- Importa directo el `.obj` que sale de WebODM (mismo insumo del pipeline de arriba).
- **Modo Presenter**: exporta un ejecutable standalone interactivo — post probablemente lo que usó `urbania3d` (no era un video de Blender, era una app interactiva grabada en pantalla).
- Hardware confirmado: **AMD RX 6600 / 8GB VRAM** — cumple el mínimo de Twinmotion (Passmark ~15k vs piso de 10k) y entra en la lista de tarjetas habilitadas para Path Tracer (serie RX 6000+, 8GB), aunque AMD rinde peor que NVIDIA ahí. No es un problema: el día a día y el Presenter corren sobre **Lumen** (tiempo real), no sobre Path Tracer — eso sólo se reserva para una imagen fija de altísima calidad más adelante (afiche/print), no hace falta para el video ni el Presenter.

**Paso a paso Twinmotion** (para cuando exista la malla real):
1. Instalar vía Epic Games Launcher (licencia gratis, confirmar facturación <$1M).
2. Procesar el vuelo en WebODM → carpeta `odm_texturing/` (`.obj` + `.mtl` + texturas juntas).
3. Twinmotion → Nuevo proyecto → Importar → el `.obj`.
4. Corregir escala/rotación si entra mal (gotcha conocido de WebODM→Twinmotion).
5. Geolocalizar el proyecto con las coordenadas reales (`-27.5302, -58.8055` aprox) para sol/sombras correctos.
6. Vestir el terreno: carpeta "Vegetation and Landscape" de la librería, herramientas Paint/Scatter sobre las zonas de tierra pelada.
7. (Cuando estén los dúplex) importar esos modelos y ubicarlos sobre los lotes.
8. Armar cámara con la herramienta Path/Secuencia — se puede reusar el mismo guion de 4 paradas del tour web.
9. Exportar: **Video** (Export → Movie, motor Lumen) para redes, y **Presenter** (Export → Presenter) para reuniones de venta.
10. Path Tracer sólo si se quiere una imagen fija de máxima calidad más adelante.

## Calidad visual del entorno (fondo Esri) — diagnóstico medido, no repetir el análisis

El dron sólo cubre 788 x 492 m (el loteo mide 693 x 406 m); todo lo demás en el tour es
satélite Esri plano y sin iluminar. Medido antes del fix: en la portada (zoom 13.6) el
ortomosaico ocupaba **5%** del cuadro, en la vista principal (zoom 16.2) **30%**, en el
waypoint más cercano (zoom 17) **52%** — el resto era Esri.

**Descartado con evidencia, no reintentar:**
- *Datos de elevación/terreno* — Corrientes es la llanura del Paraná, es plano de verdad.
- *Extruir edificios de OpenStreetMap* — Overpass sobre 2x3 km alrededor del predio devolvió
  **15 edificios**. No hay dato que extruir.

**Fix aplicado (código, sin assets nuevos ni API keys):**
- `desaturate: 0.45` + `tintColor: [225, 190, 165]` en el `BitmapLayer` de `esri-satellite`
  (`renderSubLayers`) — el satélite pasa a leerse como telón atmosférico, no como protagonista.
- Reencuadre completo de cámara: `minZoom` 14→15.3 (tope ~4.9 km, corta el vacío plano
  conservando el centro de Corrientes), `maxZoom` 20→19.5 (empareja con la resolución real
  del ortomosaico, 19.2 cm/px, evita el borroneo por acercarse más de lo que el dato entrega).
  Los 4 waypoints del tour se reajustaron zoom/pitch para que el ortomosaico domine el cuadro
  en las paradas cercanas, y quede en pitch bajo en las paradas amplias (menos pitch = menos
  plano lejano feo expuesto).
- Bruma de horizonte reactiva al `pitch` (`horizonHaze` en `LotMap3D.tsx`) + viñeta entibiada,
  reemplazando la viñeta fría original.
- `FeatherExtension` (`lib/geo/feather-extension.ts`) — desvanece el borde del *rectángulo*
  de `bounds` del `ortho-dron` vía `DECKGL_FILTER_COLOR`. Queda como red de seguridad extra,
  pero **no alcanza la costura real** — ver el punto siguiente.
- **La costura visible no era el rectángulo, era el canal alfa de la imagen.** Confirmado con
  una captura real del usuario + muestreo de píxeles: el alfa de `public/ortho-2607.webp`
  tenía un escalón de **1 píxel** (0→255) exactamente en el borde real del vuelo, que cae bien
  *adentro* del margen de 39-56 m del rectángulo — ahí es donde `FeatherExtension` nunca llega,
  porque sólo opera sobre el borde del rectángulo, no sobre la forma real. Fix: difuminado
  offline del canal alfa (no del RGB, para no perder nitidez) con `sharp` — `blur(30)` sobre el
  canal alfa extraído, recombinado con el RGB original, re-encodeado a WebP. Sin Docker/GDAL:
  el archivo fuente (`ortho-2607.webp`) ya tiene el alfa real embebido, no hace falta el GeoTIFF
  de 259 MB para esto. Bounds sin cambios (mismas dimensiones de imagen). Backup del original
  en el scratchpad de la sesión por si hay que comparar o revertir.
  **Lección:** si se re-exporta el ortomosaico en el futuro (Fase 2, mayor resolución), hornear
  este mismo difuminado de alfa en ese paso — no asumir que el `FeatherExtension` en shader lo
  cubre, porque no cubre la huella real, sólo el rectángulo de `bounds`.

## Volúmenes de contexto (edificios) — dos rondas hasta llegar a algo honesto y sin bugs

- **Por qué:** con la costura del ortomosaico ya arreglada, la queja pasó a ser color/textura —
  a la izquierda foto de dron nítida y verde, a la derecha satélite Esri chato y oscuro (medido:
  dron RGB 103,102,85 vs Esri 52,64,34 — Esri es ~2x más oscuro, y el `tintColor` cálido que
  había antes sólo puede oscurecer más, nunca aclarar — estaba agrandando la brecha).
- **Ronda 1:** volúmenes de edificios reales como maqueta (`edificios-contexto`,
  `SolidPolygonLayer`) + satélite bajado a piso casi monocromo. Datos de
  microsoft/GlobalMLBuildingFootprints (CDLA-Permissive-2.0), horneados por
  `scripts/fetch-buildings.mjs` a `public/edificios-corrientes.json` (14.821 edificios, 1,7 MB /
  0,43 MB gzip). OSM tenía sólo 15 edificios en la misma zona — inservible, de ahí la elección.
- **Causa raíz encontrada del hueco rosa/malva en el horizonte** (antes documentado como "sin
  resolver"): **`node_modules/@deck.gl/geo-layers/dist/tileset-2d/tile-2d-traversal.js:146`** —
  `const minZ = viewport.pitch <= 60 ? maxZ : 0`. Con nuestro pitch (40-55, siempre ≤60), la
  librería fija la selección de tiles en `maxZoom` sin permitir tiles más gruesos de respaldo;
  el horizonte lejano necesitaría una cantidad impracticable de tiles z19 y la mayoría no llega
  a pedirse, dejando ver el `<div>` de cielo detrás del canvas. Confirmado que NO era el
  `desaturate` (idéntico a 0.8 y a 0.6) ni tiles caídos (sin requests fallidos). **Fix:** bajar
  `maxZoom` de la capa `esri-satellite` (19→15) — con tiles más grandes, el horizonte se cubre
  con muchos menos, y como el satélite ya es sólo telón desaturado, perder nitidez lejana no
  cuesta nada.
- **Ronda 2, feedback del usuario:** "se nota que no son edificios reales/precisos" — no era el
  bug, era que TODOS los volúmenes eran bloques idénticos de 3 m, patrón repetido y genérico.
  El dataset no trae altura (0% de los registros) — inventar una altura específica por edificio
  sería fabricar un dato, así que en vez de eso: `SolidPolygonLayer` → `PolygonLayer` con altura
  variable en un RANGO chico (2.5-4 m, según el tamaño real de cada huella vía
  `footprintAreaM2`), tono ±8% por hash determinístico del índice (`hash01`), y contorno
  (`getLineColor`/`stroked`). Sigue siendo convención de maqueta, no relevamiento — documentado
  en el propio código, no sólo acá.
- **Ronda 3 — revertido por completo.** El usuario mandó una captura: *"PREFIERO QUE SEA UN MAPA
  PLANO 2D A QUE SE VEA ASI"*. El problema no era la monotonía (lo de la Ronda 2) — era la
  **geometría**. En ese barrio, `GlobalMLBuildingFootprints` trae huellas de manzana entera y
  tiras de vivienda contigua, no casas sueltas; extruidas quedan como tiras largas marrones sin
  relación con las casas reales de la foto satelital debajo. Más variación (altura/tono/contorno)
  sobre geometría equivocada no arregla nada — se sacó la capa entera, `edificios-contexto`,
  `scripts/fetch-buildings.mjs` y `public/edificios-corrientes.json`, todo borrado.
  **Lección para no repetir:** cantidad de registros no es lo que importa (14.821 de Microsoft
  vs 15 de OSM) — hay que mirar la geometría real superpuesta al satélite ANTES de extruir, no
  sólo contar cuántos hay.
  Con los volúmenes afuera, el satélite volvió a ser protagonista visual (ya no "piso detrás de
  algo"), así que se le devolvió nitidez: `maxZoom` de `esri-satellite` 15→**17** (1,06 m/px,
  casi 1:1 con la vista por defecto; 16× menos tiles que z19 para el horizonte, así que el hueco
  rosa de la Ronda 1 no debería volver — probado en la vista general sin que reaparezca) y
  `desaturate` 0.6→**0.35** (ya no necesita aplanarse tanto para no competir con nada). Si el
  hueco volviera a aparecer en algún ángulo no probado, la Nota 2 de esta sección tiene la causa
  raíz exacta y un plan B (plano de suelo neutro bajo los tiles) sin necesidad de re-investigar.

**Pendiente opcional, no iniciado:**
- *Ortomosaico de mayor resolución* — el TIFF fuente (`vuelo-santa-catalina/full-run/…`) es
  15628x9561 px @ 5 cm/px; el WebP publicado es 4096 px @ 19.2 cm/px (4x menos). Sólo vale la
  pena si se quiere subir el `maxZoom` por encima de 19.5. Requiere Docker + GDAL del
  contenedor `opendronemap/odm` (recordar: `docker run -v` siempre desde PowerShell, nunca
  Git-Bash — MSYS rompe las rutas).
- *Google Photorealistic 3D Tiles* — **verificar cobertura de superficie real en Google Earth
  sobre el predio antes de escribir código.** El terreno global no ayuda (ya es plano); lo que
  aportaría es la malla de superficie (edificios/árboles), que cubre ~2500 ciudades — Corrientes
  es ciudad media y el predio está en zona de expansión (campo + PROCREAR), así que es probable
  que quede fuera de cobertura. Sin cobertura de superficie se vería igual que hoy, pagando.

## Gotchas ya resueltos (no repetir)

- **Iluminación sobreexpuesta**: `DirectionalLight` con `intensity: 2.4` + specular casi blanco + `_shadow: true` dejaba TODOS los lotes blancos (bug real, encontrado con captura). Fix: `intensity: 1.0`, sin `_shadow` (la sombra proyectada de deck.gl es experimental y frágil). No subir la intensidad de nuevo sin verificar con screenshot.
- **Tour 2× más rápido de lo esperado**: un `useEffect` por-paso (dependiente de `tourStep`) se re-ejecutaba y adelantaba el tiempo. Fix: un solo efecto secuenciador con timer encadenado, dependiente de `[mode, WAYPOINTS]` únicamente.
- **CSP bloqueaba los tiles de Esri** al principio (`connect-src`/`img-src` no tenían `*.arcgisonline.com`) — ya agregado.
- **`Tile3DLayer.loader` está deprecado** — usar `loaders: [CesiumIonLoader]` (array), no `loader:` singular, si no tira error de tipos.

## Archivos que NO son de esta sesión (no tocar sin avisar)

Al hacer este commit encontramos sueltos, sin commitear, y **no los tocamos**:
- `lib/lot_geometry.json` — coordenadas de manzanas 7/10/14 completamente distintas al último commit. Parece un fix en curso de otra persona.
- `components/GoogleMapsLotMapGeo.tsx` y `app/mapa-preview/` — vista previa con geolocalización en tiempo real, preexistente al inicio de esta sesión.

Si alguien pregunta por esto, avisar — no es nuestro y no sabemos si está terminado.

## Cómo verificar que todo sigue andando

```
cd santa-catalina
npx tsc --noEmit && npm run build
npm run dev   # → http://localhost:3001/mapa-3d (o el puerto libre)
```
Sin `.env.local` con las vars de Cesium ion, el toggle de terreno real no aparece — es esperado.
