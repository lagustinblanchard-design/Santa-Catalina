import { MotionConfig } from 'motion/react'

// reducedMotion="user": respeta prefers-reduced-motion del sistema para todo
// motion.* de /v3, sin que cada componente tenga que chequearlo por su cuenta
// (mismo patrón que app/v2/layout.tsx).
export default function V3Layout({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
