const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  distDir: isDev ? '.next-dev' : '.next',
  output: 'standalone',
  reactStrictMode: false,
  poweredByHeader: false,
  compress: true,
  images: {
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' }
    ]
  },
  async headers() {
    if (isDev) {
      return [
        {
          source: '/:all*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            },
            {
              key: 'Pragma',
              value: 'no-cache',
            },
            {
              key: 'Expires',
              value: '0',
            },
          ],
        },
      ];
    }
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff2|woff|ttf|css|js)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/oferta/:token', destination: '/o/:token' },
      { source: '/campanha/:token', destination: '/o/:token' },
      { source: '/presell/:slug', destination: '/p/:slug' },
      { source: '/presell/:slug/go', destination: '/p/:slug/go' },
    ];
  },
};

export default nextConfig;
