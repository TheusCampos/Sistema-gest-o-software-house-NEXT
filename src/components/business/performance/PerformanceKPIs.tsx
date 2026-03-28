'use client';

import React from 'react';
import StatCard from '@/components/composite/StatCard';

interface PerformanceKPIsProps {
    metrics: {
        resolvedTotal: number;
        activeTechnicians: number;
    };
}

export const PerformanceKPIs: React.FC<PerformanceKPIsProps> = ({ metrics }) => {
    const kpis = [
        { 
            title: 'Conformidade Global de SLA', 
            value: '100%', 
            trend: '0%', 
            icon: 'verified', 
            color: '#10b981' 
        },
        { 
            title: 'Tempo Médio de Resolução', 
            value: '-', 
            trend: '-', 
            icon: 'schedule', 
            color: '#136dec' 
        },
        { 
            title: 'Resolvidos (Total)', 
            value: metrics.resolvedTotal.toString(), 
            trend: 'Tarefas', 
            icon: 'task_alt', 
            color: '#10b981' 
        },
        { 
            title: 'Técnicos Ativos', 
            value: metrics.activeTechnicians.toString(), 
            trend: 'Equipe', 
            icon: 'group', 
            color: '#f59e0b' 
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, idx) => (
                <StatCard 
                    key={idx} 
                    title={kpi.title} 
                    value={kpi.value} 
                    icon={kpi.icon} 
                    color={kpi.color} 
                    trend={kpi.trend}
                    index={idx}
                />
            ))}
        </div>
    );
};
