import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Frame-Options',        value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // 'wasm-unsafe-eval': @loaders.gl/draco instancia WebAssembly para decodificar mallas
      // Draco (los 3D Tiles de Cesium ion vienen comprimidos así). unpkg.com: fallback de CDN
      // de @loaders.gl para los workers cuando no hay build local de los mismos.
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://maps.googleapis.com https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // *.cesium.com / assets.ion.cesium.com: terreno fotorrealista (malla de dron vía Cesium ion).
      // Dormido hasta que haya un asset real — ver NEXT_PUBLIC_CESIUM_ION_* en .env.example.
      // files.bpcontent.cloud / cdn.botpress.cloud: avatares y media del widget de chat (app/v2).
      "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.arcgisonline.com https://*.cesium.com https://assets.ion.cesium.com https://files.bpcontent.cloud https://cdn.botpress.cloud",
      // Botpress Cloud (webchat en /v2): API + eventos en tiempo real del chat.
      // Lista fundada en el código fuente (defaultBaseApiUrl en @botpress/chat), no en doc oficial de CSP de Botpress —
      // confirmar contra la consola del navegador (Refused to connect/load) y ajustar si aparecen más orígenes.
      "connect-src 'self' https://*.googleapis.com https://docs.google.com https://*.arcgisonline.com https://*.cesium.com https://assets.ion.cesium.com https://api.cesium.com https://unpkg.com https://chat.botpress.cloud https://webchat.botpress.cloud https://api.botpress.cloud https://files.bpcontent.cloud wss://*.botpress.cloud",
      // blob:: @loaders.gl crea los web workers de decodificación (Tile3DLayer/CesiumIonLoader)
      // desde blob URLs. Sin esto caen a default-src 'self' y quedan bloqueados en silencio.
      "worker-src 'self' blob:",
      "frame-src 'none'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
};

export default nextConfig;
