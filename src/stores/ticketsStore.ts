/**
 * Store de Tickets de Suporte (Tickets Store)
 * ------------------------------------------------------------------
 * Gerencia chamados de suporte com cache inteligente.
 */
"use client";

import { create } from "zustand";
import type { SupportComment, SupportTask, SupportTicket } from "@/types";

type TicketsState = {
  tickets: SupportTicket[];
  isLoading: boolean;
  isInitialized: boolean;
  lastFetchTime: number | null;
  isCacheDirty: boolean;
  error: string | null;
};

type TicketsActions = {
  fetchTickets: (tenantId?: string) => Promise<void>;
  forceRefresh: (tenantId?: string) => Promise<void>;
  addTicket: (ticket: SupportTicket) => Promise<void>;
  updateTicket: (ticket: SupportTicket) => Promise<void>;
  invalidateCache: () => void;
};

export const useTicketsStore = create<TicketsState & TicketsActions>(
  (set, get) => ({
    tickets: [],
    isLoading: false,
    isInitialized: false,
    lastFetchTime: null,
    isCacheDirty: false,
    error: null,

    fetchTickets: async (tenantId?: string) => {
      set({ isLoading: true, error: null });

      try {
        const url = tenantId
          ? `/api/tickets?tenantId=${tenantId}`
          : "/api/tickets";
        const response = await fetch(url, { cache: "no-store" });

        if (response.status === 401) {
          console.warn(
            "[TicketsStore] Sessão expirada (401). Redirecionando para login...",
          );
          if (typeof window !== "undefined") {
            localStorage.removeItem("softhouse_user");
            window.location.href = "/login";
          }
          return;
        }

        if (!response.ok) {
          // Tenta extrair uma mensagem de erro mais detalhada do corpo da resposta
          let errorPayload;
          try {
            errorPayload = await response.json();
          } catch {
            // O corpo da resposta não é JSON ou está vazio
            errorPayload = null;
          }

          // Constrói uma mensagem de erro mais completa, incluindo os detalhes da API
          let errorMessage = `Falha na requisição: ${response.status} ${response.statusText}`;
          if (errorPayload && errorPayload.message) {
            errorMessage = errorPayload.details
              ? `${errorPayload.message} - Detalhes: ${errorPayload.details}`
              : errorPayload.message;
          }

          throw new Error(errorMessage);
        }
        const data = (await response.json()) as SupportTicket[];

        let localData: Record<
          string,
          { tasks?: SupportTask[]; comments?: SupportComment[] }
        > = {};
        try {
          const stored = localStorage.getItem("tickets_local_data");
          if (stored) localData = JSON.parse(stored);
        } catch {
          console.warn("Erro ao ler localStorage");
        }

        const enrichedTickets = data.map((t) => ({
          ...t,
          tasks: localData[t.id]?.tasks ?? t.tasks ?? [],
          comments: localData[t.id]?.comments ?? t.comments ?? [],
        }));

        set({
          tickets: enrichedTickets,
          isInitialized: true,
          lastFetchTime: Date.now(),
          isCacheDirty: false,
        });
      } catch (error) {
        // Garante que estamos passando uma mensagem de erro em string para o estado
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao buscar tickets";
        console.error("[TicketsStore] Erro ao buscar tickets:", error);
        set({ error: errorMessage, tickets: [] });
      } finally {
        set({ isLoading: false });
      }
    },

    forceRefresh: async (tenantId?: string) => {
      set({ isInitialized: false, lastFetchTime: null, isCacheDirty: false });
      return get().fetchTickets(tenantId);
    },

    addTicket: async (ticket) => {
      set({ isLoading: true, error: null });
      try {
        const response = await fetch("/api/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ticket),
        });

        if (!response.ok) {
          let errorPayload;
          try {
            errorPayload = await response.json();
         } catch {
            errorPayload = null;
          }

          let errorMessage = "Falha ao criar ticket";
          if (errorPayload && errorPayload.message) {
            errorMessage = errorPayload.details
              ? `${errorPayload.message} - Detalhes: ${errorPayload.details}`
              : errorPayload.message;
          }
          throw new Error(errorMessage);
        }
        const savedTicket = await response.json();

        set((state) => ({
          tickets: [savedTicket, ...state.tickets],
          isCacheDirty: true,
        }));

      } catch (error) {
        console.error("Erro ao criar ticket:", error);
        set({ error: "Erro ao criar ticket" });
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    updateTicket: async (ticket) => {
      set({ isLoading: true, error: null });
      try {
        const response = await fetch("/api/tickets", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ticket),
        });

        if (!response.ok) {
          let errorPayload;
          try {
            errorPayload = await response.json();
         } catch {
            errorPayload = null;
          }

          let errorMessage = "Falha ao atualizar ticket";
          if (errorPayload && errorPayload.message) {
            errorMessage = errorPayload.details
              ? `${errorPayload.message} - Detalhes: ${errorPayload.details}`
              : errorPayload.message;
          }
          throw new Error(errorMessage);
        }
        const updatedTicketFromServer = await response.json();

        // MANTÉM OS DADOS LOCAIS QUE O BACKEND IGNOROU (Tasks e Comments)
        // Isso permite que o usuário veja o que digitou durante a sessão atual,
        // mesmo que o backend não esteja persistindo esses campos específicos.
        const mergedTicket = {
          ...updatedTicketFromServer,
          tasks: ticket.tasks || [],
          comments: ticket.comments || [],
        };

        // SALVA NO LOCALSTORAGE PARA PERSISTÊNCIA (WORKAROUND)
        try {
          const stored = localStorage.getItem("tickets_local_data");
          const localData = stored ? JSON.parse(stored) : {};
          localData[mergedTicket.id] = {
            tasks: mergedTicket.tasks,
            comments: mergedTicket.comments,
          };
          localStorage.setItem("tickets_local_data", JSON.stringify(localData));
        } catch {
          console.warn("Erro ao salvar no localStorage");
        }

        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === mergedTicket.id ? mergedTicket : t,
          ),
          isCacheDirty: true,
        }));

      } catch (error) {
        console.error("Erro ao atualizar ticket:", error);
        set({ error: "Erro ao atualizar ticket" });
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
