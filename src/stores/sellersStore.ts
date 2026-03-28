/**
 * Store de Gerenciamento de Equipe Comercial (Sellers Store)
 * ------------------------------------------------------------------
 * Gerencia vendedores e comissões com cache inteligente.
 */
'use client';

import { create } from 'zustand';
import type { Seller } from '@/types';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

type SellersState = {
    sellers: Seller[];
    isLoading: boolean;
    isInitialized: boolean;
    lastFetchTime: number | null;
    isCacheDirty: boolean;
};

type SellersActions = {
    fetchSellers: (tenantId?: string) => Promise<void>;
    forceRefresh: (tenantId?: string) => Promise<void>;
    saveSeller: (seller: Seller) => Promise<void>;
    removeSeller: (id: string) => Promise<void>;
    invalidateCache: () => void;
};

export const useSellersStore = create<SellersState & SellersActions>((set, get) => ({
    sellers: [],
    isLoading: false,
    isInitialized: false,
    lastFetchTime: null,
    isCacheDirty: false,

    fetchSellers: async (tenantId) => {
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
            const url = tenantId ? `/api/sellers?tenantId=${tenantId}` : '/api/sellers';
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) throw new Error(`Falha ao buscar vendedores: ${response.status}`);
            const data = await response.json();

            set({
                sellers: data,
                isInitialized: true,
                lastFetchTime: Date.now(),
                isCacheDirty: false
            });
        } catch (error) {
            console.error('Erro ao buscar vendedores:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    forceRefresh: async (tenantId?: string) => {
        set({ isInitialized: false, lastFetchTime: null, isCacheDirty: false });
        return get().fetchSellers(tenantId);
    },

    saveSeller: async (seller) => {
        try {
            const isUpdate = get().sellers.some((s) => s.id === seller.id);
            const method = isUpdate ? 'PUT' : 'POST';

            const response = await fetch('/api/sellers', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(seller),
            });

            if (!response.ok) throw new Error('Falha ao salvar vendedor');

            const savedSeller = await response.json();

            set((state) => ({
                sellers: isUpdate
                    ? state.sellers.map((s) => (s.id === savedSeller.id ? savedSeller : s))
                    : [...state.sellers, savedSeller],
                isCacheDirty: true
            }));

        } catch (error) {
            console.error('Erro ao salvar vendedor:', error);
            throw error;
        }
    },

    removeSeller: async (id) => {
        try {
            const response = await fetch(`/api/sellers?id=${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Falha ao remover vendedor');

            set((state) => ({
                sellers: state.sellers.filter(s => s.id !== id),
                isCacheDirty: true
            }));

        } catch (error) {
            console.error('Erro ao remover vendedor:', error);
            throw error;
        }
    },

    invalidateCache: () => {
        set({ isCacheDirty: true });
    }
}));
