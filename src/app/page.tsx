'use client';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  // Lê o usuário logado do estado global (Context)
  const { currentUser } = useApp();
  // Navegação client-side do Next.js
  const router = useRouter();

  useEffect(() => {
    // Landing page: redireciona automaticamente para a área correta
    // - Logado: vai para o dashboard
    // - Não logado: vai para a tela de login
    if (currentUser) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [currentUser, router]);

  return (
    // Loader simples enquanto o redirecionamento acontece
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}
