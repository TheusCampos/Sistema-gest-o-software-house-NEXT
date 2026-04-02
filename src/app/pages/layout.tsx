'use client';
import { useApp } from '@/context/AppContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const {
        currentUser, isSidebarOpen, setIsSidebarOpen,
        fetchClients, fetchContracts, fetchTickets, fetchEquipment
    } = useApp();
    const router = useRouter();
    const pathname = usePathname();
    const hasFetched = useRef(false);

    // Verifica autenticação e aplica guards de rota por permissão
    useEffect(() => {
        const savedUser = localStorage.getItem('softhouse_user');
        if (!savedUser && !currentUser) {
            router.push('/login');
            return;
        }

        if (currentUser) {
            const role = currentUser.role;
            const accessDenied = () => router.replace('/dashboard');

            if (role !== 'admin' && role !== 'desenvolvedor') {
                const p = currentUser.permissions;
                if (p) {
                    if (pathname.startsWith('/tickets') && !p.tickets.view) accessDenied();
                    if (pathname.startsWith('/equipment') && !p.equipment.view) accessDenied();
                    if (pathname.startsWith('/contracts') && !p.contracts.view) accessDenied();
                    if (pathname.startsWith('/sellers') && !p.sellers.view) accessDenied();
                    if (pathname.startsWith('/performance') && !p.performance.view) accessDenied();
                    if (pathname.startsWith('/appointments') && !p.appointments.view) accessDenied();
                    if (pathname.startsWith('/clients') && !p.clients.view) accessDenied();
                    if ((pathname.startsWith('/service-types') || pathname.startsWith('/templates') || pathname.startsWith('/users')) && !p.settings.view) accessDenied();
                }
            }
        }
    }, [currentUser, router, pathname]);

    // Carrega dados globais uma única vez após o login
    useEffect(() => {
        if (!currentUser?.tenantId || hasFetched.current) return;
        hasFetched.current = true;
        const tenantId = currentUser.tenantId;

        fetchClients('default');
        fetchContracts(tenantId);
        fetchTickets(tenantId);
        fetchEquipment(tenantId);
    }, [currentUser, fetchClients, fetchContracts, fetchTickets, fetchEquipment]);

    return (
        <div className="flex h-screen bg-[#fdfdfe] dark:bg-background-dark text-slate-900 dark:text-white font-display transition-colors duration-200 overflow-hidden">
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-90 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <Sidebar />

            <div className="flex-1 flex flex-col w-full h-full transition-all duration-300 md:pl-72">
                <TopBar />
                <main className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
}
