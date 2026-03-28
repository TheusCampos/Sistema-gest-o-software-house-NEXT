/**
 * Store de Modelos de Implementação (Templates Store)
 * ------------------------------------------------------------------
 * Gerencia templates utilizados nos processos de implementação.
 * Implementa cache inteligente com invalidação automática.
 */
'use client';

import { create } from 'zustand';
import type { ImplementationTemplate } from '@/types';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Interface TemplatesState
 */
type TemplatesState = {
  implementationTemplates: ImplementationTemplate[];
  isLoading: boolean;
  isInitialized: boolean;
  lastFetchTime: number | null;
  isCacheDirty: boolean;
};

/**
 * Interface TemplatesActions
 */
type TemplatesActions = {
  fetchTemplates: (tenantId: string) => Promise<void>;
  forceRefresh: (tenantId: string) => Promise<void>;
  saveTemplate: (template: ImplementationTemplate) => Promise<void>;
  removeTemplate: (id: string, tenantId: string) => Promise<void>;
  invalidateCache: () => void;
};

/**
 * Hook useTemplatesStore
 */
export const useTemplatesStore = create<TemplatesState & TemplatesActions>((set, get) => ({
  implementationTemplates: [],
  isLoading: false,
  isInitialized: false,
  lastFetchTime: null,
  isCacheDirty: false,

  // Carrega templates do banco (Cache First)
  fetchTemplates: async (tenantId: string) => {
    const state = get();
    const now = Date.now();

    const isCacheValid =
      state.isInitialized &&
      !state.isCacheDirty &&
      state.lastFetchTime !== null &&
      (now - state.lastFetchTime < CACHE_TTL_MS);

    if (isCacheValid) {
      return;
    }

    set({ isLoading: true });

    try {
      const response = await fetch(`/api/templates?tenantId=${tenantId}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Falha ao buscar templates: ${response.status}`);
      const data = await response.json();

      set({
        implementationTemplates: data,
        isInitialized: true,
        lastFetchTime: Date.now(),
        isCacheDirty: false
      });
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  forceRefresh: async (tenantId: string) => {
    set({ isInitialized: false, lastFetchTime: null, isCacheDirty: false });
    return get().fetchTemplates(tenantId);
  },

  // Salva template (POST ou PUT)
  saveTemplate: async (template: ImplementationTemplate) => {
    try {
      const isNew = template.id.length < 20 || template.id.includes('temp');
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch('/api/templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });

      if (!response.ok) throw new Error('Falha ao salvar template');
      const saved = await response.json();

      set((state) => ({
        implementationTemplates: isNew
          ? [saved, ...state.implementationTemplates]
          : state.implementationTemplates.map(t => t.id === saved.id ? saved : t),
        isCacheDirty: true
      }));

      console.log('[TemplatesStore] Template salvo, cache marcado como dirty');
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      throw error;
    }
  },

  // Remove template (Lógico)
  removeTemplate: async (id: string, tenantId: string) => {
    try {
      const response = await fetch(`/api/templates?id=${id}&tenantId=${tenantId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Falha ao excluir template');

      set((state) => ({
        implementationTemplates: state.implementationTemplates.filter(t => t.id !== id),
        isCacheDirty: true
      }));

      console.log('[TemplatesStore] Template removido, cache marcado como dirty');
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      throw error;
    }
  },

  invalidateCache: () => {
    set({ isCacheDirty: true });
    console.log('[TemplatesStore] Cache invalidado manualmente');
  }
}));
