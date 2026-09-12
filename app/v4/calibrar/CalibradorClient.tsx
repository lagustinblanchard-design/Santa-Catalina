'use client'

/**
 * Herramienta de calibración del handoff "hoy" (imagen plana) → mapa 3D en vivo.
 * Página dev, noindex, no linkeada desde ningún lado — se borra o se deja sin
 * usar una vez que HANDOFF_VIEW quede fijado en components/v4/scroll-stages.ts.
 *
 * Superpone el recorte del ortomosaico (el mismo que usa la etapa "hoy" del
 * sticky) al 50% sobre el LotScene real, con sliders de zoom/pitch/bearing/
 * longitud/latitud — así se ajusta a ojo hasta que ambos calcen.
 */

import { useState } from 'react'
import type { Lot } from '@/lib/lots'
import LotScene from '@/components/lot-scene/LotScene'

const INITIAL = {
  longitude: -58.8052705,
  latitude: -27.5299805,
  zoom: 16.6,
  pitch: 0,
  bearing: 0,
}

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-xs text-white">
      <div className="mb-1 flex justify-between">
        <span>{label}</span>
        <span className="tabular-nums">{value.toFixed(4)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  )
}

export default function CalibradorClient({ lots }: { lots: Lot[] }) {
  const [view, setView] = useState(INITIAL)
  const [overlayOpacity, setOverlayOpacity] = useState(0.5)

  function set<K extends keyof typeof INITIAL>(key: K, value: number) {
    setView((v) => ({ ...v, [key]: value }))
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <LotScene lots={lots} initialViewState={view} controller={false} />

      {/* Overlay: el mismo recorte que usa la etapa "hoy" */}
      <img
        src="/timeline/hoy.webp"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{ opacity: overlayOpacity }}
      />

      <div className="absolute right-4 top-4 z-10 w-80 space-y-3 rounded-lg bg-black/80 p-4 backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-widest text-red-500">Calibrador — hoy → 3D</p>
        <Slider label="longitude" value={view.longitude} min={-58.815} max={-58.797} step={0.0001} onChange={(v) => set('longitude', v)} />
        <Slider label="latitude" value={view.latitude} min={-27.538} max={-27.523} step={0.0001} onChange={(v) => set('latitude', v)} />
        <Slider label="zoom" value={view.zoom} min={14} max={19.5} step={0.05} onChange={(v) => set('zoom', v)} />
        <Slider label="pitch" value={view.pitch} min={0} max={70} step={1} onChange={(v) => set('pitch', v)} />
        <Slider label="bearing" value={view.bearing} min={-180} max={180} step={1} onChange={(v) => set('bearing', v)} />
        <Slider label="overlay opacity" value={overlayOpacity} min={0} max={1} step={0.05} onChange={setOverlayOpacity} />
        <pre className="whitespace-pre-wrap break-all rounded bg-black/60 p-2 text-[10px] text-green-400">
          {JSON.stringify(view, null, 2)}
        </pre>
      </div>
    </div>
  )
}
