import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  experimental: {
    ppr: true,
  },

  /**
   * Attach COOP/COEP headers to every route so the runtime checker
   * receives the expected values instead of a 404, eliminating the
   * console warning about missing Cross-Origin-Opener-Policy.
   *
   * NOTE: Coinbase Wallet SDK requires COOP not to be set to `same-origin`.
   * Using `same-origin-allow-popups` keeps most isolation benefits while
   * allowing the popup bridge necessary for the Smart Wallet flow.
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ]
  },
}

export default nextConfig