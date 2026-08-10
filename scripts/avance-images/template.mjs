/**
 * Plantillas HTML de las piezas de avance de obra.
 * Paleta y tipografía tomadas de app/globals.css (tokens --color-paye-*).
 */

import { planoVial, planoRed, PALETTE as P } from './plano.mjs'

export const FORMATS = {
  '4x5':  { w: 1080, h: 1350, layout: 'wide', s: 1.00 },
  '9x16': { w: 1080, h: 1920, layout: 'tall', s: 1.05 },
  '16x9': { w: 1600, h: 900,  layout: 'wide', s: 0.92, landscape: true },
  'a4':   { w: 794,  h: 1123, layout: 'wide', s: 0.70, print: true },
}

export const PIEZAS = ['resumen', 'vial', 'redes']

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function css(f) {
  return `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap');
  ${f.print ? '@page { size: A4; margin: 0 }' : ''}
  * { box-sizing: border-box; margin: 0; padding: 0 }
  html, body {
    width: ${f.w}px; height: ${f.h}px; overflow: hidden;
    font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
    color: ${P.graphite}; background: ${P.bone};
    -webkit-font-smoothing: antialiased;
  }
  .sheet { width: ${f.w}px; height: ${f.h}px; display: flex; flex-direction: column }

  header {
    background: ${P.graphite}; color: #fff;
    padding: ${28 * f.s}px ${40 * f.s}px;
    display: flex; align-items: center; justify-content: space-between; gap: ${20 * f.s}px;
  }
  .brand { font-size: ${26 * f.s}px; font-weight: 900; letter-spacing: ${1.5 * f.s}px }
  .brand span { font-weight: 400; letter-spacing: ${3 * f.s}px; opacity: .75; font-size: ${15 * f.s}px }
  .hmeta { text-align: right; line-height: 1.35 }
  .hmeta b { display: block; font-size: ${17 * f.s}px; font-weight: 700 }
  .hmeta i { font-style: normal; font-size: ${15 * f.s}px; opacity: .7 }

  main { flex: 1; padding: ${34 * f.s}px ${40 * f.s}px; display: flex; flex-direction: column; min-height: 0 }

  .kicker {
    display: inline-block; align-self: flex-start;
    background: ${P.payeRed}; color: #fff;
    font-size: ${14 * f.s}px; font-weight: 800; letter-spacing: ${2 * f.s}px;
    padding: ${8 * f.s}px ${16 * f.s}px; border-radius: 999px;
  }
  h1 { font-size: ${46 * f.s}px; font-weight: 900; letter-spacing: ${-1 * f.s}px; margin-top: ${16 * f.s}px; line-height: 1.05 }
  .bajada { font-size: ${18 * f.s}px; color: ${P.grayMid}; margin-top: ${12 * f.s}px; line-height: 1.5; max-width: ${900 * f.s}px }

  .body { flex: 1; display: flex; gap: ${28 * f.s}px; margin-top: ${24 * f.s}px; min-height: 0;
          flex-direction: ${f.layout === 'wide' ? 'row' : 'column'} }
  .mapa { background: #fff; border: ${2 * f.s}px solid ${P.grayLight}; border-radius: ${16 * f.s}px;
          padding: ${14 * f.s}px; display: flex; min-height: 0; aspect-ratio: 830 / 1660;
          ${f.layout === 'wide' ? 'height: 100%;' : 'flex: 1; margin: 0 auto;'} }
  .mapa > svg { height: 100%; width: auto }
  .cols { flex: 1; display: flex; flex-direction: column; gap: ${16 * f.s}px; min-height: 0;
          ${f.layout === 'tall' ? 'flex: 0 0 auto;' : 'justify-content: space-between;'} }

  .card { background: #fff; border: ${2 * f.s}px solid ${P.grayLight}; border-radius: ${16 * f.s}px; padding: ${20 * f.s}px ${22 * f.s}px }
  .card h3 { font-size: ${19 * f.s}px; font-weight: 800 }
  .card .estado { font-size: ${17 * f.s}px; font-weight: 800; color: ${P.payeRed}; margin-top: ${4 * f.s}px }
  .card p { font-size: ${15 * f.s}px; color: ${P.grayMid}; margin-top: ${8 * f.s}px; line-height: 1.45 }

  .refs h4 { font-size: ${13 * f.s}px; font-weight: 800; letter-spacing: ${1.5 * f.s}px; color: ${P.brown}; margin-bottom: ${10 * f.s}px }
  .ref { display: flex; align-items: center; gap: ${10 * f.s}px; font-size: ${15 * f.s}px; margin-bottom: ${9 * f.s}px }
  .sw { width: ${26 * f.s}px; height: ${18 * f.s}px; border-radius: ${4 * f.s}px; flex: 0 0 auto }

  /* En 9:16 (pantalla de celular) una sola columna de 4 tarjetas llena el alto;
     en los formatos más anchos, 2x2. */
  .grid { display: grid; gap: ${18 * f.s}px; flex: 1; margin-top: ${24 * f.s}px;
          ${f.layout === 'tall'
            ? 'grid-template-columns: 1fr; grid-template-rows: repeat(4, 1fr);'
            : 'grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr;'} }
  .stat { background: #fff; border: ${2 * f.s}px solid ${P.grayLight}; border-radius: ${20 * f.s}px;
          padding: ${28 * f.s}px; display: flex; flex-direction: column; justify-content: center }
  .stat .lb { font-size: ${18 * f.s}px; font-weight: 700; color: ${P.grayMid} }
  .stat .vl { font-size: ${72 * f.s}px; font-weight: 900; color: ${P.payeRed}; line-height: 1; margin-top: ${10 * f.s}px; letter-spacing: ${-2 * f.s}px }
  .stat .vl.sm { font-size: ${38 * f.s}px }
  .stat .un { font-size: ${16 * f.s}px; color: ${P.grayMid}; margin-top: ${8 * f.s}px; font-weight: 600 }

  .redes { display: flex; gap: ${24 * f.s}px; flex: 1; min-height: 0;
           flex-direction: ${f.layout === 'wide' ? 'row' : 'column'} }
  .red { flex: 1; background: #fff; border: ${2 * f.s}px solid ${P.grayLight}; border-radius: ${18 * f.s}px;
         padding: ${20 * f.s}px; display: flex; min-height: 0; gap: ${18 * f.s}px;
         flex-direction: ${f.landscape ? 'row' : 'column'} }
  .redinfo { flex: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0 }
  .redhead { display: flex; align-items: center; justify-content: space-between; margin-bottom: ${14 * f.s}px }
  .redhead b { font-size: ${22 * f.s}px; font-weight: 800 }
  .pill { color: #fff; font-size: ${18 * f.s}px; font-weight: 900; padding: ${6 * f.s}px ${16 * f.s}px; border-radius: 999px }
  .redmap { flex: 1; min-height: 0; display: flex; justify-content: center; align-items: center }
  .redmap > svg { height: 100%; width: auto }
  .bar { height: ${14 * f.s}px; background: ${P.grayLight}; border-radius: 999px; overflow: hidden; margin-top: ${14 * f.s}px }
  .bar i { display: block; height: 100%; border-radius: 999px }
  .barlb { display: flex; justify-content: space-between; font-size: ${14 * f.s}px; font-weight: 700; color: ${P.grayMid}; margin-top: ${8 * f.s}px }
  .leg { display: flex; flex-wrap: wrap; gap: ${14 * f.s}px; margin-top: ${12 * f.s}px; font-size: ${13 * f.s}px; color: ${P.grayMid}; font-weight: 600 }
  .leg span { display: flex; align-items: center; gap: ${6 * f.s}px }
  .leg .ln { width: ${20 * f.s}px; height: 0; border-top: ${4 * f.s}px solid }
  .leg .dot { width: ${11 * f.s}px; height: ${11 * f.s}px; border-radius: 50%; background: #fff; border: ${3 * f.s}px solid }
  .pie { font-size: ${13 * f.s}px; color: ${P.grayMid}; margin-top: ${14 * f.s}px; line-height: 1.45; font-style: italic }

  footer {
    background: ${P.graphite}; color: #fff;
    padding: ${20 * f.s}px ${40 * f.s}px;
    display: flex; align-items: center; justify-content: space-between; gap: ${16 * f.s}px;
  }
  footer b { font-size: ${19 * f.s}px; font-weight: 800 }
  footer i { font-style: normal; font-size: ${14 * f.s}px; opacity: .7 }
  `
}

function shell(f, d, inner) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${css(f)}</style></head>
<body><div class="sheet">
  <header>
    <div class="brand">${esc(d.desarrollador)} <span>${esc(d.desarrolladorSufijo)}</span></div>
    <div class="hmeta"><b>Avance de obra · ${esc(d.proyecto)}</b><i>${esc(d.titulo)}</i></div>
  </header>
  ${inner}
  <footer><b>${esc(d.footer.lema)}</b><i>${esc(d.footer.credito)}</i></footer>
</div></body></html>`
}

function piezaResumen(f, d) {
  const cards = d.resumen.tarjetas.map(t => {
    const largo = t.valor.length > 3
    return `<div class="stat">
      <div class="lb">${esc(t.label)}</div>
      <div class="vl ${largo ? 'sm' : ''}">${esc(t.valor)}</div>
      <div class="un">${esc(t.unidad)}</div>
    </div>`
  }).join('')

  return shell(f, d, `<main>
    <span class="kicker">${esc(d.resumen.kicker)}</span>
    <h1>${esc(d.titulo)}</h1>
    <p class="bajada">Así avanza la obra del ${esc(d.proyecto)}. Estos son los números del mes.</p>
    <div class="grid">${cards}</div>
  </main>`)
}

function piezaVial(f, d) {
  const v = d.vial
  const svg = planoVial({
    manzanas: v.cordonCuneta.manzanas,
    reservas: v.cordonCuneta.reservas,
    sector: v.aperturaCalles.sector,
  })
  const r = v.referencias

  return shell(f, d, `<main>
    <span class="kicker">${esc(v.kicker)}</span>
    <h1>${esc(v.titulo)}</h1>
    <p class="bajada">${esc(v.bajada)}</p>
    <div class="body">
      <div class="mapa">${svg}</div>
      <div class="cols">
        <div class="card refs">
          <h4>REFERENCIAS</h4>
          <div class="ref"><span class="sw" style="background:${P.greenFill};border:2px solid ${P.greenStroke}"></span>${esc(r.manzana)}</div>
          <div class="ref"><span class="sw" style="background:repeating-linear-gradient(45deg,${P.orange},${P.orange} 5px,#F6E3CE 5px,#F6E3CE 10px);border:1px solid ${P.orange}"></span>${esc(r.apertura)}</div>
          <div class="ref"><span class="sw" style="background:${P.street};border:1px solid ${P.neutralStroke}"></span>${esc(r.enripiado)}</div>
          <div class="ref"><span class="sw" style="background:${P.neutralFill};border:1px solid ${P.neutralStroke}"></span>${esc(r.obraEnAvance)}</div>
        </div>
        <div class="card">
          <h3>${esc(v.aperturaCalles.label)}</h3>
          <div class="estado">${esc(v.aperturaCalles.estado)}</div>
          <p>${esc(v.aperturaCalles.detalle)}</p>
        </div>
        <div class="card">
          <h3>${esc(v.cordonCuneta.label)}</h3>
          <div class="estado">${esc(v.cordonCuneta.estado)}</div>
          <p>${esc(v.cordonCuneta.detalle)}</p>
        </div>
      </div>
    </div>
  </main>`)
}

function piezaRedes(f, d) {
  const n = d.redes
  const panel = (cfg, color) => {
    const [ejec, pend, nodo] = cfg.leyenda
    const mapa = `<div class="redmap">${planoRed({ color })}</div>`
    const head = `<div class="redhead"><b>${esc(cfg.label)}</b><span class="pill" style="background:${color}">${cfg.pct}%</span></div>`
    const barra = `<div class="bar"><i style="width:${cfg.pct}%;background:${color}"></i></div>
      <div class="barlb"><span>${esc(ejec)}</span><span>${cfg.pct}%</span></div>
      <div class="leg">
        <span><i class="ln" style="border-color:${color}"></i>${esc(ejec)}</span>
        <span><i class="ln" style="border-top-style:dashed;border-color:${color}"></i>${esc(pend)}</span>
        <span><i class="dot" style="border-color:${color}"></i>${esc(nodo)}</span>
      </div>`

    // En apaisado el plano va al costado; si no, apilado bajo el título.
    return f.landscape
      ? `<div class="red">${mapa}<div class="redinfo">${head}${barra}</div></div>`
      : `<div class="red">${head}${mapa}${barra}</div>`
  }

  return shell(f, d, `<main>
    <span class="kicker">${esc(n.kicker)}</span>
    <h1>${esc(n.titulo)}</h1>
    <p class="bajada">${esc(n.bajada)}</p>
    <div class="body"><div class="redes">
      ${panel(n.agua, P.water)}
      ${panel(n.cloaca, P.brown)}
    </div></div>
    <p class="pie">${esc(n.pie)}</p>
  </main>`)
}

export function renderPieza(pieza, formatKey, d) {
  const f = FORMATS[formatKey]
  if (!f) throw new Error(`Formato desconocido: ${formatKey}`)
  if (pieza === 'resumen') return piezaResumen(f, d)
  if (pieza === 'vial') return piezaVial(f, d)
  if (pieza === 'redes') return piezaRedes(f, d)
  throw new Error(`Pieza desconocida: ${pieza}`)
}
