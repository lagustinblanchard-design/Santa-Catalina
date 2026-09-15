import type { ReactNode } from 'react'

/**
 * Tabla en desktop, tarjetas apiladas en celular — no un scroll horizontal.
 *
 * Las 4 tablas del sitio (Financiación ×2, Tipologías de lote, Zonificación)
 * compartían el mismo bug: `<table className="w-full">` dentro de un
 * `overflow-x-auto` nunca scrollea porque `w-full` fija el ancho al del
 * contenedor — las columnas se comprimen hasta partir palabras en vez de
 * activar el scroll. En vez de arreglar eso 4 veces, en mobile cada fila se
 * vuelve una tarjeta con la primera columna como título y el resto como
 * pares etiqueta/valor; de `sm:` para arriba es la tabla de siempre, sin
 * cambios visuales.
 */

export type ResponsiveTableColumn = {
  key: string
  label: string
  /** La primera columna se usa como título de la tarjeta en mobile — no se repite como par etiqueta/valor. */
}

export type ResponsiveTableRow = {
  key: string
  cells: Record<string, ReactNode>
}

export default function ResponsiveTable({
  columns,
  rows,
  zebra = true,
  headStyle,
}: {
  columns: ResponsiveTableColumn[]
  rows: ResponsiveTableRow[]
  /** Fondo alternado por fila (el default de todas las tablas actuales). */
  zebra?: boolean
  /** Estilo del <thead>/<tr> — por defecto no lleva (fondo blanco), Zoning lo usa oscuro. */
  headStyle?: React.CSSProperties
}) {
  const [titleCol, ...restCols] = columns

  return (
    <>
      {/* Desktop / tablet: la tabla de siempre, sin cambios. */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr style={headStyle}>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="px-6 py-4 text-left font-semibold"
                  style={{ color: headStyle ? '#fff' : '#2E2A26' }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.key}
                style={{ background: zebra ? (i % 2 === 0 ? '#fff' : '#F2ECE0') : undefined, borderTop: '1px solid #D8D2C7' }}
              >
                {columns.map((c) => (
                  <td key={c.key} className="px-6 py-4" style={{ color: '#2E2A26' }}>
                    {row.cells[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: una tarjeta por fila — la 1ª columna es el título, el resto pares etiqueta/valor. */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((row) => (
          <div key={row.key} className="rounded-2xl border p-4" style={{ borderColor: '#D8D2C7', background: '#fff' }}>
            <div className="mb-2 font-bold" style={{ color: '#2E2A26' }}>{row.cells[titleCol.key]}</div>
            <div className="flex flex-col gap-1.5">
              {restCols.map((c) => (
                <div key={c.key} className="flex items-baseline justify-between gap-3 text-sm">
                  <span style={{ color: '#6B6660' }}>{c.label}</span>
                  <span className="text-right" style={{ color: '#2E2A26' }}>{row.cells[c.key]}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
