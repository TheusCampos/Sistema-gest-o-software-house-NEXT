import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      }
    ],
  },
  async rewrites() {
    // As rotas da aplicação foram organizadas em `src/app/pages/*`.
    // Para manter URLs amigáveis (ex.: /dashboard, /tickets, /clients, etc.),
    // mapeamos as rotas "de topo" para o prefixo /pages.
    return [
      { source: '/dashboard', destination: '/pages/dashboard' },
      { source: '/client-portal', destination: '/pages/client-portal' },

      // Rotas com subpaths (new, [id], etc.)
      { source: '/tickets/:path*', destination: '/pages/tickets/:path*' },
      { source: '/equipment/:path*', destination: '/pages/equipment/:path*' },
      { source: '/clients/:path*', destination: '/pages/clients/:path*' },
      { source: '/contracts/:path*', destination: '/pages/contracts/:path*' },
      { source: '/appointments/:path*', destination: '/pages/appointments/:path*' },

      // Rotas simples
      { source: '/sellers', destination: '/pages/sellers' },
      { source: '/performance', destination: '/pages/performance' },
      { source: '/service-types', destination: '/pages/service-types' },
      { source: '/templates', destination: '/pages/templates' },
      { source: '/users', destination: '/pages/users' },
    ];
  },
};

export default nextConfig;
