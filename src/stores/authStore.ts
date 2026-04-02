/**
 * Store de Gerenciamento de Autenticação (Auth Store)
 * ------------------------------------------------------------------
 * Este arquivo é responsável por gerenciar o estado global de autenticação
 * da aplicação usando a biblioteca Zustand.
 *
 * Funcionalidades principais:
 * - Login: Autentica o usuário e persiste a sessão no LocalStorage.
 * - Logout: Encerra a sessão e limpa os dados armazenados.
 * - Hidratação: Recupera a sessão do usuário ao recarregar a página.
 */
'use client';

import { create } from 'zustand';
import type { User } from '@/types';

/**
 * Interface AuthState
 * Define os dados de estado para a autenticação.
 * - currentUser: O objeto do usuário autenticado ou null se não houver ninguém logado.
 */
type AuthState = {
  currentUser: User | null;
};

/**
 * Interface AuthActions
 * Define as funções (ações) disponíveis para manipular o estado de autenticação.
 */
type AuthActions = {
  // Autentica o usuário e permite lembrar a sessão
  login: (user: User, remember?: boolean) => void;
  // Encerra a sessão do usuário
  logout: () => void;
  // Restaura o usuário do armazenamento local
  hydrateFromStorage: () => void;
  // Atualiza os dados do usuário atual (para trocar avatar/nome em tempo real)
  updateCurrentUser: (userData: Partial<User>) => void;
};

// Chave utilizada no LocalStorage para salvar os dados do usuário
const STORAGE_KEY = 'softhouse_user';

/**
 * Função Auxiliar: readStoredUser
 * Tenta ler e analisar o usuário salvo no LocalStorage.
 * Retorna null se não houver dados ou se ocorrer erro no parse.
 * Verifica 'window' para evitar erros no servidor (SSR).
 */
function readStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const savedUser = localStorage.getItem(STORAGE_KEY);
  if (!savedUser) return null;
  try {
    return JSON.parse(savedUser) as User;
  } catch {
    // Se o JSON estiver inválido, removemos a entrada corrompida
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * Hook useAuthStore
 * Cria e exporta o store do Zustand combinando estado e ações.
 */
export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  // Estado inicial
  currentUser: null,

  // Implementação da ação de Login
  login: (user, remember = true) => {
    // Atualiza o estado na memória
    set({ currentUser: user });

    // Persistência no LocalStorage (apenas no cliente)
    if (typeof window !== 'undefined') {
      if (remember) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        // Se 'remember' for falso, garantimos que não haja dados antigos salvos
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  },

  // Implementação da ação de Logout
  logout: () => {
    // Encerra sessão server-side (cookie httpOnly)
    if (typeof window !== 'undefined') {
      void fetch('/api/logout', { method: 'POST' }).catch(() => {
        // No-op: mesmo em falha de rede, limpamos sessão local.
      });
    }

    // Limpa o estado na memória
    set({ currentUser: null });

    // Remove do LocalStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  // Implementação da Hidratação
  hydrateFromStorage: () => {
    set({ currentUser: readStoredUser() });
  },

  updateCurrentUser: (userData) => {
    set((state) => {
      if (!state.currentUser) return state;
      const updated = { ...state.currentUser, ...userData };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return { currentUser: updated };
    });
  },
}));
