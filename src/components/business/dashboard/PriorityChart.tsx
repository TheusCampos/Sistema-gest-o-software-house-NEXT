'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface PriorityData {
    name: string;
    value: number;
    color: string;
    percentage: string;
}

interface PriorityChartProps {
    data: PriorityData[];
    total: number;
}

export const PriorityChart: React.FC<PriorityChartProps> = ({ data, total }) => {
    return (
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-[#f1f5f9] dark:border-slate-800 p-10 rounded-[48px] shadow-[0_8px_30px_-6px_rgba(0,0,0,0.04)] flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h4 className="text-[20px] font-bold text-[#0d131b] dark:text-white tracking-tight">Tickets por Prioridade</h4>
                    <p className="text-[14px] text-[#94a3b8] font-medium mt-1">Distribuição da fila de suporte atual</p>
                </div>
                <div className="px-4 py-1.5 bg-[#f1f5f9] dark:bg-slate-800 text-[#64748b] dark:text-slate-300 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm">
                    Total: {total}
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Chart Container */}
                <div className="relative w-full aspect-square max-w-[280px] flex items-center justify-center">
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                        <span className="text-[52px] font-bold text-[#0d131b] dark:text-white leading-none tracking-tighter">
                            {total}
                        </span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius="65%"
                                outerRadius="95%"
                                paddingAngle={8}
                                dataKey="value"
                                cornerRadius={12}
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', backgroundColor: 'rgba(255, 255, 255, 0.98)', padding: '16px 24px' }}
                                itemStyle={{ color: '#0f172a', fontWeight: 'bold', fontSize: '14px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Custom Legend */}
                <div className="flex flex-col gap-4 min-w-[140px]">
                    {data.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4 group">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-[14px] font-bold text-[#64748b] dark:text-slate-300 group-hover:text-[#0d131b] dark:group-hover:text-white transition-colors">
                                    {item.name}
                                </span>
                            </div>
                            <div className="px-2.5 py-1 bg-[#f8fafc] dark:bg-slate-800 rounded-lg border border-[#f1f5f9] dark:border-slate-700">
                                <span className="text-[11px] font-bold text-[#94a3b8] tracking-tight">
                                    {item.percentage}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
