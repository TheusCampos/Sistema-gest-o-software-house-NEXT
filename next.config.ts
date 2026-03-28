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

      // Rotas exatas para as listagens (evita trailing slash que quebra o RSC no App Router)
      { source: '/tickets', destination: '/pages/tickets' },
      { source: '/tickets/:path+', destination: '/pages/tickets/:path+' },
      
      { source: '/equipment', destination: '/pages/equipment' },
      { source: '/equipment/:path+', destination: '/pages/equipment/:path+' },
      
      { source: '/clients', destination: '/pages/clients' },
      { source: '/clients/:path+', destination: '/pages/clients/:path+' },
      
      { source: '/contracts', destination: '/pages/contracts' },
      { source: '/contracts/:path+', destination: '/pages/contracts/:path+' },
      
      { source: '/appointments', destination: '/pages/appointments' },
      { source: '/appointments/:path+', destination: '/pages/appointments/:path+' },

      // Rotas simples
      { source: '/sellers', destination: '/pages/sellers' },
      { source: '/sellers/:path+', destination: '/pages/sellers/:path+' },

      { source: '/performance', destination: '/pages/performance' },
      { source: '/service-types', destination: '/pages/service-types' },
      { source: '/service-types/:path+', destination: '/pages/service-types/:path+' },

      { source: '/templates', destination: '/pages/templates' },
      { source: '/templates/:path+', destination: '/pages/templates/:path+' },

      { source: '/users', destination: '/pages/users' },
      { source: '/users/:path+', destination: '/pages/users/:path+' },

    ];
  },
};

export default nextConfig;
