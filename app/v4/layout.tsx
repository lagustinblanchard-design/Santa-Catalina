import { MotionConfig } from 'motion/react'

// reducedMotion="user": respeta prefers-reduced-motion del sistema para todo
// motion.* de /v4 (mismo patrón que app/v2/layout.tsx y app/v3/layout.tsx).
// El driver de la cámara 3D del sticky (useScrollCamera, Fase 3) es manual y
// NO pasa por acá — se gatea con useReducedMotion() explícito donde vive.
export default function V4Layout({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
