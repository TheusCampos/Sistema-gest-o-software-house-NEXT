'use client';

import React, { useMemo } from 'react';
import { SupportTicket } from '@/types';
import { useTicketsStore } from '@/stores/ticketsStore';
import { useContractsStore } from '@/stores/contractsStore';
import { MetricCard } from '@/components/business/dashboard/MetricCard';
import { PriorityChart } from '@/components/business/dashboard/PriorityChart';
import { MRRChart } from '@/components/business/dashboard/MRRChart';

const AdminDashboard: React.FC = () => {
    // Injeção de dependências via stores atômicas (Zustand)
    // Melhora a performance ao evitar re-renderizações globais do useApp()
    const tickets = useTicketsStore((s) => s.tickets);
    const contracts = useContractsStore((s) => s.contracts);

    // Cálculos de métricas memoizados para evitar processamento pesado em cada render
    const activeContractsCount = useMemo(() => 
        contracts.filter(c => c.status === 'Ativo').length, 
    [contracts]);

    const totalMRR = useMemo(() => {
        const raw = contracts
            .filter(c => c.status === 'Ativo')
            .reduce((acc, curr) => {
                if (!curr.mrr) return acc;
                const val = parseFloat(curr.mrr.toString().replace(/[^0-9.-]+/g, ""));
                return acc + (isNaN(val) ? 0 : val);
            }, 0);
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(raw);
    }, [contracts]);

    const stats = useMemo(() => {
        const open = tickets.filter(t => t.status === 'Open' || t.status === 'Pending').length;
        const critical = tickets.filter(t => t.priority === 'Critical').length;
        const closed = tickets.filter(t => {
            const s = (t.status || '').toLowerCase();
            return ['arquivados', 'fechados', 'fechado', 'arquivado', 'closed'].includes(s);
        }).length;

        const total = tickets.length || 1; // Evitar divisão por zero

        return {
            open,
            critical,
            closed,
            openRate: Math.round((open / total) * 100),
            criticalRate: Math.round((critical / total) * 100),
            closedRate: Math.round((closed / total) * 100),
            activeContractsRate: contracts.length > 0 ? Math.round((activeContractsCount / contracts.length) * 100) : 0,
        };
    }, [tickets, contracts, activeContractsCount]);

    // Frequência de dados (Sparklines)
    const getSparklineData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        const filterFor = (filterFn: (t: SupportTicket) => boolean) => 
            last7Days.map(date => ({
                v: tickets.filter(t => (t.createdAt?.startsWith(date) || t.updatedAt?.startsWith(date)) && filterFn(t)).length
            }));

        return {
            general: filterFor(() => true),
            open: filterFor(t => t.status === 'Open' || t.status === 'Pending'),
            critical: filterFor(t => t.priority === 'Critical'),
            closed: filterFor(t => {
                const s = (t.status || '').toLowerCase();
                return ['arquivados', 'fechados', 'fechado', 'arquivado', 'closed'].includes(s);
            })
        };
    }, [tickets]);

    const ticketPriorityData = useMemo(() => [
        { name: 'Crítico', value: tickets.filter(t => t.priority === 'Critical').length, color: '#e11d48', percentage: '38%' },
        { name: 'Alto', value: tickets.filter(t => t.priority === 'High').length, color: '#f97316', percentage: '25%' },
        { name: 'Médio', value: tickets.filter(t => t.priority === 'Normal').length, color: '#3b82f6', percentage: '38%' },
    ].filter(d => d.value > 0), [tickets]);

    const mrrHistory = useMemo(() => {
        const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            return {
                month: d.toLocaleString('pt-BR', { month: 'short' }),
                year: d.getFullYear(),
                date: new Date(d.getFullYear(), d.getMonth(), 1)
            };
        });

        return last6Months.map(m => {
            const monthlySum = contracts
                .filter(c => {
                    const isActive = ['Ativo', 'Vencendo em Breve', 'Atrasado', 'Em Renovação'].includes(c.status);
                    if (!isActive) return false;
                    
                    const start = new Date(c.startDate);
                    const lastDayOfMonth = new Date(m.year, m.date.getMonth() + 1, 0);
                    return start <= lastDayOfMonth;
                })
                .reduce((acc, curr) => {
                    if (!curr.mrr) return acc;
                    const val = parseFloat(curr.mrr.toString().replace(/[^0-9.-]+/g, ""));
                    return acc + (isNaN(val) ? 0 : val);
                }, 0);
            
            return {
                name: m.month.charAt(0).toUpperCase() + m.month.slice(1),
                mrr: monthlySum
            };
        });
    }, [contracts]);

    return (
        <div className="space-y-10 animate-fadeIn max-w-[1600px] mx-auto p-4 md:p-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-[28px] font-bold text-[#0d131b] dark:text-white tracking-tight">Métricas Operacionais</h2>
                <span className="text-[11px] font-black text-[#94a3b8] px-4 py-1.5 bg-[#f1f5f9] dark:bg-slate-800 rounded-full tracking-wider uppercase">Atualizado agora</span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <MetricCard 
                    title="Contratos Ativos" value={activeContractsCount.toString()} percentage={`${stats.activeContractsRate}%`}
                    icon="description" color="#136dec" blob="from-[#136dec]/20" data={getSparklineData.general} index={0}
                />
                <MetricCard 
                    title="MRR" value={totalMRR} percentage="100%"
                    icon="account_balance_wallet" color="#f59e0b" blob="from-[#f59e0b]/20" data={getSparklineData.general} index={1}
                />
                <MetricCard 
                    title="Abertos" value={stats.open.toString()} percentage={`${stats.openRate}%`}
                    icon="confirmation_number" color="#8b5cf6" blob="from-[#8b5cf6]/20" data={getSparklineData.open} index={2}
                />
                <MetricCard 
                    title="Críticos" value={stats.critical.toString()} percentage={`${stats.criticalRate}%`}
                    icon="local_fire_department" color="#ef4444" blob="from-[#ef4444]/20" data={getSparklineData.critical} index={3}
                />
                <MetricCard 
                    title="Fechados" value={stats.closed.toString()} percentage={`${stats.closedRate}%`}
                    icon="task_alt" color="#10b981" blob="from-[#10b981]/20" data={getSparklineData.closed} index={4}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <MRRChart totalMRR={totalMRR} data={mrrHistory} />
                <PriorityChart data={ticketPriorityData} total={tickets.length} />
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

export default AdminDashboard;
