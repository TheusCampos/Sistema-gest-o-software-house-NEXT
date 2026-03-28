/**
 * Store de Gerenciamento de Equipamentos (Equipment Store)
 * ------------------------------------------------------------------
 * Gerencia o estado global de equipamentos de TI.
 * Implementa cache inteligente com invalidação automática.
 */
"use client";

import { create } from "zustand";
import type { Equipment } from "@/types";

type EquipmentState = {
  equipmentList: Equipment[];
  isLoading: boolean;
  isInitialized: boolean;
  lastFetchTime: number | null;
  isCacheDirty: boolean;
};

type EquipmentActions = {
  fetchEquipment: (tenantId: string) => Promise<void>;
  forceRefresh: (tenantId: string) => Promise<void>;
  saveEquipment: (equipment: Equipment) => Promise<void>;
  removeEquipment: (id: string) => Promise<void>;
  invalidateCache: () => void;
};

export const useEquipmentStore = create<EquipmentState & EquipmentActions>(
  (set, get) => ({
    equipmentList: [],
    isLoading: false,
    isInitialized: false,
    lastFetchTime: null,
    isCacheDirty: false,

    fetchEquipment: async (tenantId) => {
      set({ isLoading: true });

      try {
        const url = `/api/equipment?tenantId=${tenantId}`;
        const response = await fetch(url, { cache: "no-store" });

        if (response.status === 401) {
          console.warn(
            "[EquipmentStore] Sessão expirada (401). Redirecionando para login...",
          );
          if (typeof window !== "undefined") {
            localStorage.removeItem("softhouse_user");
            window.location.href = "/login";
          }
          return;
        }

        if (!response.ok)
          throw new Error(`Falha ao buscar equipamentos: ${response.status}`);
        const data = await response.json();

        set({
          equipmentList: data,
          isInitialized: true,
          lastFetchTime: Date.now(),
          isCacheDirty: false,
        });
      } catch (error) {
        console.error("[EquipmentStore] Erro ao buscar equipamentos:", error);
        set({ equipmentList: [] });
      } finally {
        set({ isLoading: false });
      }
    },

    forceRefresh: async (tenantId: string) => {
      set({ isInitialized: false, lastFetchTime: null, isCacheDirty: false });
      return get().fetchEquipment(tenantId);
    },

    saveEquipment: async (equipment) => {
      try {
        const isTempId = equipment.id.startsWith("EQ-") || equipment.id === "";
        const method = isTempId ? "POST" : "PUT";

        const response = await fetch("/api/equipment", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(equipment),
        });

        if (!response.ok) throw new Error("Falha ao salvar equipamento");

        const savedEquipment = await response.json();

        set((state) => {
          if (isTempId) {
            return {
              equipmentList: [savedEquipment, ...state.equipmentList],
              isCacheDirty: true,
            };
          } else {
            return {
              equipmentList: state.equipmentList.map((e) =>
                e.id === savedEquipment.id ? savedEquipment : e,
              ),
              isCacheDirty: true,
            };
          }
        });

      } catch (error) {
        console.error("Erro ao salvar equipamento:", error);
        throw error;
      }
    },

    removeEquipment: async (id) => {
      try {
        const response = await fetch(`/api/equipment?id=${id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Falha ao remover equipamento");

        set((state) => ({
          equipmentList: state.equipmentList.filter((e) => e.id !== id),
          isCacheDirty: true,
        }));

      } catch (error) {
        console.error("Erro ao remover equipamento:", error);
        throw error;
      }
    },

    invalidateCache: () => {
      set({ isCacheDirty: true });
    },
  }),
);
