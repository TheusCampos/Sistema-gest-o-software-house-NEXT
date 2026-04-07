/**
 * Store de Gerenciamento de Clientes (Clients Store)
 * ------------------------------------------------------------------
 * Gerencia o estado global da lista de clientes na aplicação.
 * Implementa cache inteligente com invalidação automática.
 */
"use client";

import { create } from "zustand";
import type { Client } from "@/types";

/**
 * Interface ClientsState
 * Define o estado que contém a lista de clientes.
 */
type ClientsState = {
  clients: Client[];
  isLoading: boolean;
  isInitialized: boolean;
  lastFetchTime: number | null;
  isCacheDirty: boolean; // Indica se dados foram modificados
};

/**
 * Interface ClientsActions
 * Define as ações para manipular a lista de clientes.
 */
type ClientsActions = {
  fetchClients: (tenantId?: string, allTenants?: boolean) => Promise<void>;
  forceRefresh: (tenantId?: string, allTenants?: boolean) => Promise<void>;
  saveClient: (client: Client) => Promise<void>;
  loadClientDetail: (id: string) => Promise<Client | null>;
  invalidateCache: () => void;
};

/**
 * Hook useClientsStore
 * Cria o store Zustand com dados iniciais e lógica de cache inteligente.
 */
export const useClientsStore = create<ClientsState & ClientsActions>(
  (set, get) => ({
    clients: [],
    isLoading: false,
    isInitialized: false,
    lastFetchTime: null,
    isCacheDirty: false,

    fetchClients: async (tenantId?: string, allTenants?: boolean) => {
      const now = Date.now();
      const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
      const isStale = !get().lastFetchTime || (now - get().lastFetchTime! > CACHE_TTL_MS);

      // Se há dados em cache que não estão sujos e não expirou, retorna sem requisitar nada
      if (get().isInitialized && !get().isCacheDirty && !isStale) {
        return;
      }

      // Evita piscar a tela usando carregamento em background (SWR pattern) se tiver cache existente
      const isBackgroundSync = get().isInitialized && get().clients.length > 0;
      if (!isBackgroundSync) {
        set({ isLoading: true });
      }

      try {
        const url = "/api/clients";

        // Removemos { cache: "no-store" } para usar cache HTTP padrão caso servidor retorne headers
        const response = await fetch(url);

        if (response.status === 401) {
          console.warn(
            "[ClientsStore] Sessão expirada (401). Redirecionando para login...",
          );
          if (typeof window !== "undefined") {
            localStorage.removeItem("softhouse_user");
            window.location.href = "/login";
          }
          return;
        }

        if (!response.ok) {
          throw new Error(`Falha ao buscar clientes: ${response.status}`);
        }

        const data = await response.json();

        set({
          clients: data,
          isInitialized: true,
          lastFetchTime: Date.now(),
          isCacheDirty: false,
        });
      } catch (error) {
        console.error("[ClientsStore] Erro ao buscar clientes:", error);
        // Em caso de erro, limpa a lista para evitar dados obsoletos
        set({ clients: [] });
      } finally {
        set({ isLoading: false });
      }
    },

    // Força atualização ignorando cache
    forceRefresh: async (tenantId?: string, allTenants?: boolean) => {
      set({ isInitialized: false, lastFetchTime: null, isCacheDirty: false });
      return get().fetchClients(tenantId, allTenants);
    },

    // Salva cliente e marca cache como sujo
    saveClient: async (client) => {
      try {
        const isUpdate = get().clients.some((c) => c.id === client.id);
        const method = isUpdate ? "PUT" : "POST";

        const response = await fetch("/api/clients", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(client),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || "Falha ao salvar cliente";
            
            // Se houver erros de validação detalhados (Zod)
            if (errorData.errors) {
                interface ZodIssue {
                  path: (string | number)[];
                  message: string;
                }
                const detailedErrors = (errorData.errors as ZodIssue[]).map((err) => 
                    `${err.path.join('.')}: ${err.message}`
                ).join('\n');
                throw new Error(`${errorMessage}\n${detailedErrors}`);
            }
            
            throw new Error(errorMessage);
        }

        const savedClient = await response.json();

        // Atualiza localmente E marca cache como dirty
        set((state) => ({
          clients: isUpdate
            ? state.clients.map((c) =>
              c.id === savedClient.id ? savedClient : c,
            )
            : [...state.clients, savedClient],
          isCacheDirty: true, // Invalida cache para recarregar na próxima navegação
        }));

      } catch (error) {
        console.error("Erro ao salvar cliente:", error);
        throw error;
      }
    },

    // Busca detalhes completos do cliente (todas as abas)
    loadClientDetail: async (id: string) => {
      try {
        const res = await fetch(`/api/clients/${id}`);
        if (!res.ok) throw new Error("Falha ao buscar detalhes do cliente");
        return await res.json();
      } catch (error) {
        console.error("Erro ao carregar detalhes do cliente:", error);
        return null;
      }
    },

    // Método para invalidar cache manualmente
    invalidateCache: () => {
      set({ isCacheDirty: true });
    },
  }),
);
