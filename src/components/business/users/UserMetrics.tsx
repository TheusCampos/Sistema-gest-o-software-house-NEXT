import React from 'react';
import StatCard from "@/components/composite/StatCard";
import { User } from '@/types';

interface UserMetricsProps {
    users: User[];
}

export const UserMetrics: React.FC<UserMetricsProps> = ({ users }) => {
    const metrics = {
        total: users.length,
        active: users.filter((u) => u.active).length,
        inactive: users.filter((u) => !u.active).length,
        admins: users.filter((u) => (u.role === "admin" || u.role === "desenvolvedor") && u.active).length,
    };

    const metricCards = [
        { title: "Total Usuários", value: metrics.total, icon: "groups", color: "#136dec" },
        { title: "Acessos Ativos", value: metrics.active, icon: "verified", color: "#10b981" },
        { title: "Excluídos / Bloqueados", value: metrics.inactive, icon: "lock", color: "#ef4444" },
        { title: "Administradores", value: metrics.admins, icon: "admin_panel_settings", color: "#8b5cf6" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
            {metricCards.map((card, idx) => (
                <StatCard
                    key={idx}
                    title={card.title}
                    value={card.value}
                    icon={card.icon}
                    color={card.color}
                    index={idx}
                />
            ))}
        </div>
    );
};
