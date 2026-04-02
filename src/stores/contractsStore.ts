/**
 * Store de Gerenciamento de Contratos (Contracts Store)
 * ------------------------------------------------------------------
 * Gerencia o estado global dos contratos.
 * Implementa cache inteligente com invalidação automática.
 */
"use client";

import { create } from "zustand";
import type { Contract } from "@/types";

/**
 * Interface ContractsState
 */
type ContractsState = {
  contracts: Contract[];
  isLoading: boolean;
  isInitialized: boolean;
  lastFetchTime: number | null;
  isCacheDirty: boolean;
  error: string | null;
};

/**
 * Interface ContractsActions
 */
type ContractsActions = {
  fetchContracts: (tenantId?: string) => Promise<void>;
  forceRefresh: (tenantId?: string) => Promise<void>;
  saveContract: (contract: Contract) => Promise<void>;
  invalidateCache: () => void;
};

/**
 * Hook useContractsStore
 */
export const useContractsStore = create<ContractsState & ContractsActions>(
  (set, get) => ({
    clients: [],
    contracts: [],
    isLoading: false,
    isInitialized: false,
    lastFetchTime: null,
    isCacheDirty: false,
    error: null,

    fetchContracts: async (tenantId?: string) => {
      set({ isLoading: true, error: null });

      try {
        const url = tenantId
          ? `/api/contracts?tenantId=${tenantId}`
          : "/api/contracts";
        const response = await fetch(url, { cache: "no-store" });

        if (response.status === 401) {
          console.warn(
            "[ContractsStore] Sessão expirada (401). Redirecionando para login...",
          );
          if (typeof window !== "undefined") {
            localStorage.removeItem("softhouse_user");
            window.location.href = "/login";
          }
          return;
        }

        if (!response.ok)
          throw new Error(`Falha ao buscar contratos: ${response.status}`);
        const data = await response.json();

        set({
          contracts: data,
          isInitialized: true,
          lastFetchTime: Date.now(),
          isCacheDirty: false,
        });
      } catch (error) {
        console.error("[ContractsStore] Erro ao buscar contratos:", error);
        set({ error: "Erro ao carregar contratos", contracts: [] });
      } finally {
        set({ isLoading: false });
      }
    },

    forceRefresh: async (tenantId?: string) => {
      set({ isInitialized: false, lastFetchTime: null, isCacheDirty: false });
      return get().fetchContracts(tenantId);
    },

    saveContract: async (contract) => {
      set({ isLoading: true, error: null });
      try {
        const isUpdate = get().contracts.some((c) => c.id === contract.id);
        const method = isUpdate ? "PUT" : "POST";

        const response = await fetch("/api/contracts", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contract),
        });

        if (!response.ok) {
          let errorMessage = "Falha ao salvar contrato";
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            // Ignore JSON parse error
          }
          throw new Error(errorMessage);
        }

        const savedContract = await response.json();

        set((state) => ({
          contracts: isUpdate
            ? state.contracts.map((c) =>
                c.id === savedContract.id ? savedContract : c,
              )
            : [savedContract, ...state.contracts],
          isCacheDirty: true,
        }));
      } catch (error) {
        console.error("Erro ao salvar contrato:", error);
        set({ error: "Erro ao salvar contrato" });
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    invalidateCache: () => {
      set({ isCacheDirty: true });
    },
  }),
);
