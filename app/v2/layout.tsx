import { MotionConfig } from 'motion/react'

// Cinzel/Josefin ya cargan en app/layout.tsx (raíz) — de ahí salen las variables
// --font-cinzel/--font-josefin que este layout sólo consume. Se subieron ahí para que
// /mapa-3d (ruta hermana, no hija de app/v2/) también pueda usarlas.
export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "var(--font-josefin), 'Josefin Sans', sans-serif" }}>
      {/* reducedMotion="user": respeta prefers-reduced-motion del sistema para todo
          motion.* de /v2, sin que cada componente tenga que chequearlo por su cuenta. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </div>
  )
}
