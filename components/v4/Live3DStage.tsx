'use client'

import { useRef } from 'react'
import { motion, useTransform, type MotionValue } from 'motion/react'
import type { Lot } from '@/lib/lots'
import LotScene, { type LotSceneHandle } from '@/components/lot-scene/LotScene'
import { useScrollCamera } from './useScrollCamera'
import { HANDOFF_VIEW, REVEAL_VIEW } from './scroll-stages'
import { useStageOpacity } from './useStageOpacity'

// Última etapa del sticky: el mapa 3D en vivo (deck.gl, mismos datos que
// /mapa-3d) tomando la posta de la foto real. `spotlight` lo controla
// TimelineStage (no vive acá) para que el texto de la etapa y lo que se ve
// en pantalla nunca se desincronicen.
export default function Live3DStage({
  lots,
  scrollYProgress,
  bounds,
  index,
  spotlight,
  active,
  live,
}: {
  lots: Lot[]
  scrollYProgress: MotionValue<number>
  bounds: { start: number; end: number }
  index: number
  spotlight: 'DISPONIBLE' | null
  /** Gatea el montaje del canvas deck.gl y el rAF de cámara — sin esto ambos
   * quedaban vivos para siempre apenas se hidrataba /v4 (ver plan: era la
   * causa del negro/trabado al volver al Hero). */
  active: boolean
  /** Saca la capa del compositor cuando esta etapa no es la que se ve. */
  live: boolean
}) {
  const sceneRef = useRef<LotSceneHandle>(null)
  const opacity = useStageOpacity(scrollYProgress, bounds, index, true)
  const localProgress = useTransform(scrollYProgress, [bounds.start, bounds.end], [0, 1])

  useScrollCamera(sceneRef, localProgress, HANDOFF_VIEW, REVEAL_VIEW, active)

  return (
    <motion.div
      className="absolute inset-0"
      style={{ opacity, background: '#2E2A26', visibility: live ? 'visible' : 'hidden' }}
    >
      {active && (
        <LotScene
          ref={sceneRef}
          lots={lots}
          initialViewState={HANDOFF_VIEW}
          controller={false}
          spotlight={spotlight}
        />
      )}
    </motion.div>
  )
}
