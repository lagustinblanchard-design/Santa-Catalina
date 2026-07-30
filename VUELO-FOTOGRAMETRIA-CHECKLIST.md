# Checklist de vuelo — captura para fotogrametría (Santa Catalina)

Compañero de `SHOWROOM-3D-NOTES.md`. Este documento es para **el campo**, no para la compu.

Objetivo: traer un set de fotos que WebODM pueda convertir en `odm_textured_model_geo.obj` →
Cesium ion → el toggle "🛰 Vista real (dron)" de `/mapa-3d` se prende solo.

Coordenadas del predio: **-27.5302, -58.8055** (Corrientes).

---

## ⛔ El error a NO repetir

Los 7 clips previos (DJI_0826-0833) eran **todos cinematográficos**: oblicuos, loops,
reveals, altura variable 2-114 m. Preciosos como B-roll. **Inservibles para fotogrametría.**

La fotogrametría necesita lo contrario de una toma linda:
**aburrida, sistemática, altura constante, cámara mirando 100% hacia abajo.**

> Hacé las dos cosas, pero **separadas**. Primero la grilla (aburrida). Después, con la
> batería que sobre, el B-roll lindo. Nunca mezcladas en el mismo vuelo.

---

## 🕐 Ventana horaria — leelo antes de salir

Hoy es **29 de julio: invierno en Corrientes**. El sol nunca pasa de ~44° de elevación,
ni siquiera al mediodía solar (~12:45). El atardecer es ~18:10.

| Hora | Sirve | Por qué |
|------|-------|---------|
| 11:30 – 15:00 | ✅ **Ventana buena** | Sombras lo más cortas que van a estar hoy |
| 15:00 – 16:00 | ⚠️ Aceptable | Sombras empezando a estirarse |
| Después de 16:00 | ❌ **No** | Sombras largas que se **hornean en la textura** del modelo, para siempre |
| Nublado parejo | ✅✅ **Ideal** | Luz difusa = cero sombras duras. Mejor que un día de sol. |

**Si llegás pasadas las 16:00 con sol pleno: hacé sólo el B-roll cinematográfico y dejá
la grilla para otro día.** Una malla con sombras largas quemadas no se arregla después.

---

## 📸 Parámetros de la grilla (pasada principal)

| Parámetro | Valor | Por qué |
|---|---|---|
| **Gimbal** | **-90° (nadir, recto hacia abajo)** | **Lo más importante de esta hoja.** Es lo que faltó la vez pasada. |
| Altura | **80 m AGL**, constante | GSD ≈ 3 cm/px. No cambiar de altura durante la grilla. |
| Solape frontal | 80% | |
| Solape lateral | 70% | |
| Separación entre líneas | **35 m** | Da el 70% lateral a 80 m de altura |
| Velocidad | **5 m/s** | |
| Intervalo de disparo | **cada 2 s** | A 5 m/s = foto cada 10 m = 87% de solape frontal |
| Formato | **FOTOS JPEG** (no video) | El video no tiene EXIF por frame ni geotag. WebODM necesita fotos. |
| Exposición | **MANUAL y fija** (ISO + obturador) | Auto = cada foto con brillo distinto = textura manchada |
| Balance de blancos | **Manual (Sunny/Daylight)** | Mismo motivo. Nunca AWB. |
| Geotag / GPS | **Encendido** | Sin esto no hay georreferenciado |

### Patrón de vuelo

Líneas rectas paralelas, tipo cortar el césped. Al terminar una línea, te corrés 35 m y
volvés en sentido contrario. Altura y velocidad constantes todo el tiempo.

```
  ──────────────────────────►
                             │ 35 m
  ◄──────────────────────────
  │ 35 m
  ──────────────────────────►
```

**Extendé la grilla ~50 m más allá del borde del predio** en los 4 lados. Los bordes de
un modelo fotogramétrico siempre salen deformados; querés que esa deformación caiga
afuera del loteo, no sobre los lotes.

---

## 🔄 Segunda pasada: oblicua (no la saltees)

Después de la grilla nadir, una órbita del perímetro:

- Gimbal a **-45°**
- Altura ~80 m
- Apuntando siempre al centro del predio
- Una vuelta completa, foto cada 2 s (~100-150 fotos)

Sin esto, las superficies verticales (cordones, postes, construcciones, taludes de las
zanjas) salen derretidas. Con esto, el modelo se para solo.

---

## 🔋 Logística

Predio estimado ~500 × 500 m:

- Grilla: ~14 líneas × 500 m = **~7 km de vuelo ≈ 23 min de aire** → **2 baterías**
- Órbita oblicua: **~1 batería**
- B-roll cinematográfico: **~1 batería**

→ **Llevá 4 baterías cargadas.** Con 2 no cerrás la grilla.

**Tarjeta SD:** ~850 fotos ≈ 9 GB. Formateala antes de salir (no confíes en el espacio libre).

**Antes de despegar:**
- [ ] Baterías cargadas (drone + control + teléfono/tablet)
- [ ] SD formateada
- [ ] Gimbal calibrado
- [ ] Brújula (IMU/compass) calibrada en el lugar
- [ ] Viento < 25 km/h (si el dron pelea contra el viento, la altura y el solape se van al carajo)
- [ ] Confirmado el espacio aéreo / autorización

---

## ✅ Antes de guardar el dron — verificación en el lugar

Revisá esto **parado en el predio**, no en tu casa. Volver es barato ahora, carísimo mañana.

- [ ] Todas las fotos de la grilla están **miradas hacia abajo** (se ve el piso, no el horizonte)
- [ ] Todas las fotos de la grilla tienen **el mismo brillo** entre sí
- [ ] Dos fotos consecutivas cualesquiera **comparten claramente la mitad de la escena**
- [ ] La cobertura llega **más allá** del borde del loteo en los 4 lados
- [ ] Existen las fotos de la órbita oblicua a -45°
- [ ] Las fotos tienen coordenadas GPS en el EXIF

---

## 📦 Después: qué hacer con el material

1. **Copiar TODO el original tal cual** a una carpeta con fecha. No editar, no recortar,
   no exportar, no pasar por Lightroom. WebODM quiere los JPEG crudos de la cámara con su EXIF.
2. Separar en dos carpetas: `grilla-nadir/` y `orbita-oblicua/` (las dos se procesan juntas
   en WebODM, pero conviene tenerlas identificadas).
3. El B-roll cinematográfico va aparte — ese no entra a WebODM.
4. Procesar en WebODM → `odm_texturing/` (`.obj` + `.mtl` + texturas).
5. Subir a Cesium ion → asset ID + token → `.env.local` → el toggle se prende.

**Nota de hardware:** WebODM es **CPU + RAM**, no GPU. La RX 6600 no ayuda acá (sí ayuda
después, en Twinmotion). Con ~850 fotos esperá **varias horas** de proceso y bastante RAM.
Si la máquina se queda sin memoria, bajá la calidad del punto de nube, no la de features.
