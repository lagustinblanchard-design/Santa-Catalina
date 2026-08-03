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
