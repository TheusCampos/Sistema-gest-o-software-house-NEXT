/**
 * Store de Gerenciamento de Usuários (Users Store)
 * ------------------------------------------------------------------
 * Gerencia usuários e permissões com cache inteligente.
 */
'use client';

import { create } from 'zustand';
import type { User } from '@/types';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

type UsersState = {
    users: User[];
    isLoading: boolean;
    isInitialized: boolean;
    lastFetchTime: number | null;
    isCacheDirty: boolean;
    error: string | null;
};

type UsersActions = {
    fetchUsers: (tenantId: string) => Promise<void>;
    forceRefresh: (tenantId: string) => Promise<void>;
    saveUser: (user: User) => Promise<void>;
    removeUser: (id: string, tenantId: string) => Promise<void>;
    invalidateCache: () => void;
};

export const useUsersStore = create<UsersState & UsersActions>((set, get) => ({
    users: [],
    isLoading: false,
    isInitialized: false,
    lastFetchTime: null,
    isCacheDirty: false,
    error: null,

    fetchUsers: async (tenantId: string) => {
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

        set({ isLoading: true, error: null });

        try {
            const response = await fetch(`/api/users?tenantId=${tenantId}`, { cache: 'no-store' });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Falha ao buscar usuários: ${response.status} ${errorText}`);
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error('API retornou um formato inválido (não é array)');
            }

            set({
                users: data,
                isInitialized: true,
                lastFetchTime: Date.now(),
                isCacheDirty: false
            });
        } catch (error: unknown) {
            const fetchError = error as { message?: string };
            console.error('[UsersStore] Erro ao buscar usuários:', fetchError);
            set({ error: fetchError.message || 'Erro desconhecido' });
        } finally {
            set({ isLoading: false });
        }
    },

    forceRefresh: async (tenantId: string) => {
        set({ isInitialized: false, lastFetchTime: null, isCacheDirty: false });
        return get().fetchUsers(tenantId);
    },

    saveUser: async (user: User) => {
        try {
            const isNew = !get().users.some(u => u.id === user.id);
            const method = isNew ? 'POST' : 'PUT';

            const response = await fetch('/api/users', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Falha ao salvar usuário');
            }
            const saved = data;

            set((state) => ({
                users: isNew
                    ? [saved, ...state.users]
                    : state.users.map(u => u.id === saved.id ? saved : u),
                isCacheDirty: true
            }));

        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            throw error;
        }
    },

    removeUser: async (id: string, tenantId: string) => {
        try {
            const response = await fetch(`/api/users?id=${id}&tenantId=${tenantId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Falha ao excluir usuário');

            set((state) => ({
                users: state.users.filter(u => u.id !== id),
                isCacheDirty: true
            }));

        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            throw error;
        }
    },

    invalidateCache: () => {
        set({ isCacheDirty: true });
    }
}));
