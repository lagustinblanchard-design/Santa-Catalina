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
      "script-src 'self' 'unsafe-inline' https://maps.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // *.cesium.com / assets.ion.cesium.com: terreno fotorrealista (malla de dron vía Cesium ion).
      // Dormido hasta que haya un asset real — ver NEXT_PUBLIC_CESIUM_ION_* en .env.example.
      "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.arcgisonline.com https://*.cesium.com https://assets.ion.cesium.com",
      "connect-src 'self' https://*.googleapis.com https://docs.google.com https://*.arcgisonline.com https://*.cesium.com https://assets.ion.cesium.com https://api.cesium.com",
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
