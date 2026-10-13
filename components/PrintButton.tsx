'use client'

// Ficha de lote (app/lote/[id]): el "PDF" es el diálogo de impresión del navegador
// → "Guardar como PDF". Evita sumar una librería de PDF para una sola página.
export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-xl px-5 py-3 text-sm font-bold text-white print:hidden"
      style={{ background: '#AA1120' }}
    >
      Descargar PDF
    </button>
  )
}
