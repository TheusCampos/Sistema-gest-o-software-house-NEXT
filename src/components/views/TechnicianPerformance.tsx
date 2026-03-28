'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUsersStore } from '@/stores/usersStore';
import { useTicketsStore } from '@/stores/ticketsStore';
import { useAuthStore } from '@/stores/authStore';
import { PerformanceKPIs } from '@/components/business/performance/PerformanceKPIs';
import { TechnicianTable } from '@/components/business/performance/TechnicianTable';

const TechnicianPerformance: React.FC = () => {
    // Stores atômicas do Zustand
    const { users, fetchUsers } = useUsersStore();
    const { tickets, fetchTickets } = useTicketsStore();
    const currentUser = useAuthStore((s) => s.currentUser);
    
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (currentUser?.tenantId) {
            fetchUsers(currentUser.tenantId);
            fetchTickets(currentUser.tenantId);
        }
    }, [currentUser, fetchUsers, fetchTickets]);

    // Cálculo das métricas dos técnicos memoizado para evitar re-cálculos a cada render
    const technicianMetrics = useMemo(() => {
        const techniciansList = users.filter(u => u.role === 'technician' || u.role === 'admin');

        return techniciansList.map(tech => {
            const myTasks = tickets.flatMap(t => t.tasks || []).filter(task => task.assignee === tech.name);
            const assigned = myTasks.length;
            const resolved = myTasks.filter(task => task.status === 'Done').length;
            const score = assigned > 0 ? Math.round((resolved / assigned) * 100) : 0;

            return {
                id: tech.id,
                name: tech.name,
                role: tech.role === 'admin' ? 'Administrador' : 'Técnico',
                avatar: tech.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(tech.name)}&background=random`,
                assigned,
                resolved,
                avgResponse: '-', // Placeholder seguro em vez de string vazia
                compliance: 100, // Placeholder seguro
                score
            };
        });
    }, [users, tickets]);

    // Filtra técnicos conforme busca
    const filteredTechnicians = useMemo(() => 
        technicianMetrics.filter(tech =>
            tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tech.role.toLowerCase().includes(searchTerm.toLowerCase())
        ),
    [technicianMetrics, searchTerm]);

    const globalMetrics = useMemo(() => ({
        resolvedTotal: technicianMetrics.reduce((acc, t) => acc + t.resolved, 0),
        activeTechnicians: technicianMetrics.length
    }), [technicianMetrics]);

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Painel de Desempenho</h1>
                    <p className="text-slate-500 font-medium">Métricas de produtividade e conformidade SLA da equipe técnica.</p>
                </div>
                <div className="flex gap-4">
                    <button className="bg-primary text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-blue-600 transition-all shadow-xl shadow-primary/20 active:scale-95">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        Exportar Relatório
                    </button>
                </div>
            </div>

            {/* KPI Row Componentizado */}
            <PerformanceKPIs metrics={globalMetrics} />

            {/* Table Componentizado */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap md:flex-nowrap items-center justify-between gap-4 bg-white dark:bg-slate-900">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Detalhamento por Técnico</h3>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64 pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                            placeholder="Buscar técnico..."
                            type="text"
                        />
                    </div>
                </div>
                <TechnicianTable technicians={filteredTechnicians} />
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default TechnicianPerformance;
