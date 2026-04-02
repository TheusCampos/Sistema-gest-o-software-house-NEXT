'use client';

import React, { useEffect, type ReactNode } from 'react';
import type { User, ImplementationTemplate, SupportTicket, Equipment, Client, Contract, Appointment, Seller } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useClientsStore } from '@/stores/clientsStore';
import { useContractsStore } from '@/stores/contractsStore';
import { useTicketsStore } from '@/stores/ticketsStore';
import { useEquipmentStore } from '@/stores/equipmentStore';
import { useTemplatesStore } from '@/stores/templatesStore';
import { useSellersStore } from '@/stores/sellersStore';
import { useUsersStore } from '@/stores/usersStore';
import { useAppointmentsStore } from '@/stores/appointmentsStore';


interface AppContextType {
    currentUser: User | null;
    login: (user: User, remember?: boolean) => void;
    logout: () => void;

    // Data
    clients: Client[];
    saveClient: (client: Client) => Promise<void>;
    fetchClients: (tenantId?: string, allTenants?: boolean) => Promise<void>;
    forceRefreshClients: (tenantId?: string, allTenants?: boolean) => Promise<void>;
    isClientsLoading: boolean;

    sellers: Seller[];
    fetchSellers: (tenantId?: string) => Promise<void>;
    forceRefreshSellers: (tenantId?: string) => Promise<void>;
    saveSeller: (seller: Seller) => Promise<void>;
    removeSeller: (id: string) => Promise<void>;
    isSellersLoading: boolean;

    contracts: Contract[];
    saveContract: (contract: Contract) => void;
    fetchContracts: (tenantId?: string) => Promise<void>;
    forceRefreshContracts: (tenantId?: string) => Promise<void>;

    tickets: SupportTicket[];
    fetchTickets: (tenantId?: string) => Promise<void>;
    forceRefreshTickets: (tenantId?: string) => Promise<void>;
    addTicket: (ticket: SupportTicket) => Promise<void>;
    updateTicket: (ticket: SupportTicket) => Promise<void>;

    equipmentList: Equipment[];
    fetchEquipment: (tenantId: string) => Promise<void>;
    forceRefreshEquipment: (tenantId: string) => Promise<void>;
    saveEquipment: (equipment: Equipment) => Promise<void>;
    removeEquipment: (id: string) => Promise<void>;
    isEquipmentLoading: boolean;

    users: User[];
    fetchUsers: (tenantId: string) => Promise<void>;
    forceRefreshUsers: (tenantId: string) => Promise<void>;
    saveUser: (user: User) => Promise<void>;
    removeUser: (id: string, tenantId: string) => Promise<void>;
    isUsersLoading: boolean;
    userError: string | null;

    appointments: Appointment[];
    fetchAppointments: () => void;
    saveAppointment: (appointment: Partial<Appointment>) => void;
    removeAppointment: (id: string) => void;
    isAppointmentsLoading: boolean;

    implementationTemplates: ImplementationTemplate[];
    fetchTemplates: (tenantId: string) => Promise<void>;
    forceRefreshTemplates: (tenantId: string) => Promise<void>;
    saveTemplate: (template: ImplementationTemplate) => Promise<void>;
    removeTemplate: (id: string, tenantId: string) => Promise<void>;
    isTemplatesLoading: boolean;

    // UI State
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    isDark: boolean;
    toggleTheme: () => void;
}

export function AppProvider({ children }: { children: ReactNode }) {
    const hydrateTheme = useUIStore((s) => s.hydrateTheme);
    const hydrateUser = useAuthStore((s) => s.hydrateFromStorage);

    useEffect(() => {
        hydrateTheme();
        hydrateUser();
    }, [hydrateTheme, hydrateUser]);

    return <>{children}</>;
}

export function useApp(): AppContextType {
    const currentUser = useAuthStore((s) => s.currentUser);
    const login = useAuthStore((s) => s.login);
    const logout = useAuthStore((s) => s.logout);

    const clients = useClientsStore((s) => s.clients);
    const saveClient = useClientsStore((s) => s.saveClient);
    const fetchClients = useClientsStore((s) => s.fetchClients);
    const forceRefreshClients = useClientsStore((s) => s.forceRefresh);
    const isClientsLoading = useClientsStore((s) => s.isLoading);

    const contracts = useContractsStore((s) => s.contracts);
    const saveContract = useContractsStore((s) => s.saveContract);
    const fetchContracts = useContractsStore((s) => s.fetchContracts);
    const forceRefreshContracts = useContractsStore((s) => s.forceRefresh);

    const tickets = useTicketsStore((s) => s.tickets);
    const fetchTickets = useTicketsStore((s) => s.fetchTickets);
    const forceRefreshTickets = useTicketsStore((s) => s.forceRefresh);
    const addTicket = useTicketsStore((s) => s.addTicket);
    const updateTicket = useTicketsStore((s) => s.updateTicket);

    const equipmentList = useEquipmentStore((s) => s.equipmentList);
    const fetchEquipment = useEquipmentStore((s) => s.fetchEquipment);
    const forceRefreshEquipment = useEquipmentStore((s) => s.forceRefresh);
    const saveEquipment = useEquipmentStore((s) => s.saveEquipment);
    const removeEquipment = useEquipmentStore((s) => s.removeEquipment);
    const isEquipmentLoading = useEquipmentStore((s) => s.isLoading);

    const implementationTemplates = useTemplatesStore((s) => s.implementationTemplates);
    const fetchTemplates = useTemplatesStore((s) => s.fetchTemplates);
    const forceRefreshTemplates = useTemplatesStore((s) => s.forceRefresh);
    const saveTemplate = useTemplatesStore((s) => s.saveTemplate);
    const removeTemplate = useTemplatesStore((s) => s.removeTemplate);
    const isTemplatesLoading = useTemplatesStore((s) => s.isLoading);

    const isSidebarOpen = useUIStore((s) => s.isSidebarOpen);
    const setIsSidebarOpen = useUIStore((s) => s.setIsSidebarOpen);
    const isDark = useUIStore((s) => s.isDark);
    const toggleTheme = useUIStore((s) => s.toggleTheme);

    // Users
    const users = useUsersStore((s) => s.users);
    const fetchUsers = useUsersStore((s) => s.fetchUsers);
    const forceRefreshUsers = useUsersStore((s) => s.forceRefresh);
    const saveUser = useUsersStore((s) => s.saveUser);
    const removeUser = useUsersStore((s) => s.removeUser);
    const isUsersLoading = useUsersStore((s) => s.isLoading);
    const userError = useUsersStore((s) => s.error);

    // Sellers
    const sellers = useSellersStore((s) => s.sellers);
    const fetchSellers = useSellersStore((s) => s.fetchSellers);
    const forceRefreshSellers = useSellersStore((s) => s.forceRefresh);
    const saveSeller = useSellersStore((s) => s.saveSeller);
    const removeSeller = useSellersStore((s) => s.removeSeller);
    const isSellersLoading = useSellersStore((s) => s.isLoading);

    // Appointments
    const appointments = useAppointmentsStore((s) => s.appointments);
    const fetchAppointments = useAppointmentsStore((s) => s.fetchAppointments);
    const saveAppointment = useAppointmentsStore((s) => s.saveAppointment);
    const removeAppointment = useAppointmentsStore((s) => s.removeAppointment);
    const isAppointmentsLoading = useAppointmentsStore((s) => s.isLoading);

    return {
        currentUser,
        login,
        logout,

        clients,
        saveClient,
        fetchClients,
        forceRefreshClients,
        isClientsLoading,

        sellers,
        fetchSellers,
        forceRefreshSellers,
        saveSeller,
        removeSeller,
        isSellersLoading,

        contracts,
        saveContract,
        fetchContracts,
        forceRefreshContracts,

        tickets,
        fetchTickets,
        forceRefreshTickets,
        addTicket,
        updateTicket,

        equipmentList,
        fetchEquipment,
        forceRefreshEquipment,
        saveEquipment,
        removeEquipment,
        isEquipmentLoading,

        implementationTemplates,
        fetchTemplates,
        forceRefreshTemplates,
        saveTemplate,
        removeTemplate,
        isTemplatesLoading,

        isSidebarOpen,
        setIsSidebarOpen,
        isDark,
        toggleTheme,

        users,
        fetchUsers,
        forceRefreshUsers,
        saveUser,
        removeUser,
        isUsersLoading,
        userError,

        appointments,
        fetchAppointments,
        saveAppointment,
        removeAppointment,
        isAppointmentsLoading,
    };
}
