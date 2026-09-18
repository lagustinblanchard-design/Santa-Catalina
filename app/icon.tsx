import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  // Isotipo recortado (sin el texto "DESARROLLOS PAYÉ") — a 32px el logo completo
  // con texto se lee como una manchita de color, esto se lee como un símbolo.
  const mark = readFileSync(join(process.cwd(), 'public', 'logo-paye-mark-bold.png')).toString('base64')

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFFFFF',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/png;base64,${mark}`} width={28} height={11} />
      </div>
    ),
    { ...size }
  )
}
