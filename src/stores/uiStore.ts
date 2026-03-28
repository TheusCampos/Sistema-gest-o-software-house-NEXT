/**
 * Store de Interface do Usuário (UI Store)
 * ------------------------------------------------------------------
 * Gerencia o estado visual global da aplicação.
 * Controla elementos como a visibilidade da barra lateral (sidebar)
 * e o tema da aplicação (claro/escuro).
 */
'use client';

import { create } from 'zustand';

/**
 * Interface UIState
 * Estado visual da aplicação.
 * - isSidebarOpen: Se a barra lateral está expandida ou não.
 * - isDark: Se o modo escuro (Dark Mode) está ativo.
 */
type UIState = {
  isSidebarOpen: boolean;
  isDark: boolean;
};

/**
 * Interface UIActions
 * Ações para controlar o comportamento da UI.
 */
type UIActions = {
  // Define explicitamente se a sidebar está aberta
  setIsSidebarOpen: (isOpen: boolean) => void;
  // Alterna o tema atual (Light <-> Dark)
  toggleTheme: () => void;
  // Define um tema específico
  setTheme: (isDark: boolean) => void;
  // Lê e aplica o tema salvo ou preferência do sistema ao iniciar
  hydrateTheme: () => void;
};

// Chave para persistência do tema no LocalStorage
const THEME_KEY = 'theme';

/**
 * Função Auxiliar: readInitialTheme
 * Determina qual deve ser o tema inicial.
 * Prioridade: 1. LocalStorage, 2. Preferência do Sistema (prefers-color-scheme).
 */
function readInitialTheme(): boolean {
  // Prevenção para SSR
  if (typeof window === 'undefined') return false;

  const savedTheme = localStorage.getItem(THEME_KEY);
  
  // Retorna true APENAS se o usuário tiver escolhido e salvo explicitamente 'dark'
  return savedTheme === 'dark';
}

/**
 * Função Auxiliar: applyThemeToRoot
 * Aplica ou remove a classe 'dark' no elemento raiz (html) e salva a preferência.
 */
function applyThemeToRoot(isDark: boolean) {
  if (typeof window === 'undefined') return;
  const root = window.document.documentElement;
  if (isDark) {
    root.classList.add('dark');
    localStorage.setItem(THEME_KEY, 'dark');
  } else {
    root.classList.remove('dark');
    localStorage.setItem(THEME_KEY, 'light');
  }
}

/**
 * Hook useUIStore
 * Cria o store Zustand para configurações globais de UI.
 */
export const useUIStore = create<UIState & UIActions>((set, get) => ({
  // Estado Inicial
  isSidebarOpen: false,
  isDark: false, // Será atualizado pelo hydrateTheme

  // Ação: Define visibilidade da sidebar
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  // Ação: Define tema específico
  setTheme: (nextIsDark) => {
    set({ isDark: nextIsDark });
    applyThemeToRoot(nextIsDark);
  },

  // Ação: Alterna o tema
  toggleTheme: () => {
    const next = !get().isDark;
    set({ isDark: next });
    applyThemeToRoot(next);
  },

  // Ação: Hidratação do tema
  hydrateTheme: () => {
    const nextIsDark = readInitialTheme();
    set({ isDark: nextIsDark });
    applyThemeToRoot(nextIsDark);
  },
}));
