import { LayerExtension } from '@deck.gl/core'

/**
 * Desvanece el borde de un BitmapLayer para que no corte duro contra la capa de abajo.
 *
 * Se usa en la capa `ortho-dron` de LotMap3D.tsx: el ortomosaico del vuelo (788 x 492 m)
 * se dibuja sobre el satélite Esri y, sin esto, tiene una costura rectangular visible
 * donde termina. El desvanecido cae sobre el margen de 39-56 m que sobra entre los lotes
 * (693 x 406 m) y el borde de la imagen, así que ningún lote pierde nitidez.
 *
 * Verificado contra el fragment shader instalado de @deck.gl/layers 9.3.7
 * (bitmap-layer-fragment.js): `geometry.uv` se asigna justo antes de invocar
 * DECKGL_FILTER_COLOR, así que el hook puede leerlo sin uniforms propios.
 */
export class FeatherExtension extends LayerExtension {
  static get componentName() {
    return 'FeatherExtension'
  }

  getShaders() {
    return {
      inject: {
        'fs:DECKGL_FILTER_COLOR': `
          // ~39 m en x y ~34 m en y sobre una huella de ~788 x 492 m.
          vec2 d = min(geometry.uv, 1.0 - geometry.uv) / vec2(0.05, 0.07);
          color.a *= smoothstep(0.0, 1.0, min(d.x, d.y));
        `,
      },
    }
  }
}
