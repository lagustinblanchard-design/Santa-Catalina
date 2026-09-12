'use client'

import { useTransform, type MotionValue } from 'motion/react'

// Fade in/out de una etapa del sticky — dos transforms de 2 puntos en vez de
// uno de 4, y siempre adentro de [0,1]: Motion linkea useTransform(scrollY,...)
// a una animación WAAPI nativa (ScrollTimeline) cuando puede, y esa API exige
// offsets monótonos no-decrecientes — un rango fuera de [0,1] (o invertido)
// tira "Offsets must be monotonically non-decreasing" en vez de sólo clampear.
// Compartido por StageFrame (imágenes) y Live3DStage (mapa en vivo).
export function useStageOpacity(
  scrollYProgress: MotionValue<number>,
  bounds: { start: number; end: number },
  index: number,
  isLast: boolean
) {
  const span = bounds.end - bounds.start
  const fw = Math.max(span * 0.35, 0.01)

  const fadeIn = useTransform(
    scrollYProgress,
    [Math.max(bounds.start - fw, 0), Math.min(bounds.start + fw, 1)],
    index === 0 ? [1, 1] : [0, 1]
  )
  const fadeOut = useTransform(
    scrollYProgress,
    [Math.max(bounds.end - fw, 0), Math.min(bounds.end + fw, 1)],
    isLast ? [1, 1] : [1, 0]
  )
  return useTransform([fadeIn, fadeOut], (v: number[]) => Math.min(v[0], v[1]))
}
