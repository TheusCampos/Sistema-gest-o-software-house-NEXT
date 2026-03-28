"use client";

import { create } from 'zustand';
import type { Appointment } from '@/types';

interface AppointmentsState {
    appointments: Appointment[];
    isLoading: boolean;
    isInitialized: boolean;
    lastFetchTime: number | null;
    isCacheDirty: boolean;
}

interface AppointmentsActions {
    fetchAppointments: () => Promise<void>;
    saveAppointment: (appointment: Partial<Appointment>) => Promise<void>;
    removeAppointment: (id: string) => Promise<void>;
    invalidateCache: () => void;
}

type AppointmentsStore = AppointmentsState & AppointmentsActions;

export const useAppointmentsStore = create<AppointmentsStore>()(
    (set, get) => ({
        appointments: [],
        isLoading: false,
        isInitialized: false,
        lastFetchTime: null,
        isCacheDirty: false,

        fetchAppointments: async () => {
            const now = Date.now();
            const CACHE_TTL_MS = 5 * 60 * 1000;
            const isStale = !get().lastFetchTime || (now - get().lastFetchTime! > CACHE_TTL_MS);

            // If we have cached and clean data, return it
            if (get().isInitialized && !get().isCacheDirty && !isStale) {
                return;
            }

            set({ isLoading: true });

            try {
                const response = await fetch('/api/appointments', { cache: 'no-store' });

                if (response.status === 401) {
                    if (typeof window !== "undefined") {
                        localStorage.removeItem("softhouse_user");
                        window.location.href = "/login";
                    }
                    return;
                }

                if (!response.ok) {
                    throw new Error(`Falha ao buscar agendamentos: ${response.status}`);
                }

                const data = await response.json();

                set({
                    appointments: data,
                    isInitialized: true,
                    lastFetchTime: Date.now(),
                    isCacheDirty: false,
                });
            } catch (error) {
                console.error("Erro ao buscar agendamentos:", error);
                set({ appointments: [] });
            } finally {
                set({ isLoading: false });
            }
        },

        saveAppointment: async (appointment) => {
            try {
                // If ID is missing, we consider it a POST (new record)
                // If it exists, but might be a local generated ID prefix (from mock), API will handle or overwrite.
                // Ideally, PUT if it has an ID, POST otherwise. 
                const isUpdate = appointment.id && get().appointments.some(a => a.id === appointment.id);
                const method = isUpdate ? 'PUT' : 'POST';

                const response = await fetch('/api/appointments', {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(appointment),
                });

                if (!response.ok) throw new Error("Falha ao salvar agendamento");

                const savedAppointment = await response.json();

                set((state) => ({
                    appointments: isUpdate
                        ? state.appointments.map(a => a.id === savedAppointment.id ? savedAppointment : a)
                        : [...state.appointments, savedAppointment],
                    isCacheDirty: true,
                }));
            } catch (error) {
                console.error("Erro ao salvar agendamento:", error);
                throw error;
            }
        },

        removeAppointment: async (id) => {
            try {
                const response = await fetch(`/api/appointments?id=${id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) throw new Error("Falha ao remover agendamento");

                set((state) => ({
                    appointments: state.appointments.filter(a => a.id !== id),
                    isCacheDirty: true,
                }));
            } catch (error) {
                console.error("Erro ao remover agendamento:", error);
                throw error;
            }
        },

        invalidateCache: () => {
            set({ isCacheDirty: true });
        }
    })
);
