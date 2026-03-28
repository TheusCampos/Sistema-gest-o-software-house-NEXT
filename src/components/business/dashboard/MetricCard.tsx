'use client';

import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

interface MetricCardProps {
    title: string;
    value: string;
    percentage: string;
    icon: string;
    color: string;
    blob: string;
    data: { v: number }[];
    index: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    title, value, percentage, icon, color, blob, data, index
}) => {
    return (
        <div className="bg-white dark:bg-slate-900 border border-[#f1f5f9] dark:border-slate-800 p-6 rounded-[32px] shadow-[0_8px_30px_-6px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_45px_-10px_rgba(0,0,0,0.08)] transition-all relative overflow-hidden group min-h-[175px] flex flex-col justify-between">
            {/* Blob decoration */}
            <div className={`absolute -top-6 -left-6 w-32 h-32 rounded-full bg-gradient-to-br ${blob} to-transparent blur-xl opacity-80 group-hover:scale-125 transition-transform duration-1000 rotate-12`}></div>

            <div className="flex items-start justify-between relative z-10 w-full">
                <div className="w-10 h-10 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[20px]" style={{ color }}>{icon}</span>
                </div>

                <div className="w-10 h-10 rounded-full border border-[#f1f5f9] dark:border-slate-800 flex items-center justify-center bg-white/50 dark:bg-slate-800/50">
                    <span className="text-[9px] font-black text-[#64748b] dark:text-white">{percentage}</span>
                </div>
            </div>

            <div className="relative z-10 mt-4 flex items-end justify-between">
                <div className="flex-1">
                    <p className="text-[#94a3b8] text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
                    <p className="text-[26px] font-bold text-[#0d131b] dark:text-white leading-none tracking-tight">{value}</p>
                </div>

                <div className="w-20 h-10 opacity-70 group-hover:opacity-100 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id={`colorSpark-${index}`} x1="0" y1="0" x2="0" y2="100%">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2.5} fillOpacity={1} fill={`url(#colorSpark-${index})`} animationDuration={1500} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
