'use client';

import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    trend?: string;
    data?: { v: number }[];
    index?: number;
    className?: string;
}

/**
 * StatCard component that replicates the premium dashboard indicator design.
 * Features: rounded 32px, blob decoration, backdrop-blur icon container, and optional sparklines.
 */
const StatCard: React.FC<StatCardProps> = ({ 
    title, value, icon, color, trend, data, index = 0, className = '' 
}) => {
    // If color is a tailwind class like 'text-primary', we might need to handle it.
    // However, the standard style uses specific hex for gradients/blobs.
    const isHex = color.startsWith('#');
    const iconColor = isHex ? color : 'currentColor';
    const blobColor = isHex ? color : 'rgb(59, 130, 246)'; // Default to blue if not hex

    return (
        <div className={`bg-white dark:bg-slate-900 border border-[#f1f5f9] dark:border-slate-800 p-6 rounded-[32px] shadow-[0_8px_30px_-6px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_45px_-10px_rgba(0,0,0,0.08)] transition-all relative overflow-hidden group min-h-[160px] flex flex-col justify-between ${className}`}>
            {/* Blob decoration */}
            <div 
                className="absolute -top-6 -left-6 w-32 h-32 rounded-full blur-xl opacity-20 group-hover:scale-125 transition-transform duration-1000 rotate-12 pointer-events-none"
                style={{ background: `linear-gradient(to bottom right, ${blobColor}, transparent)` }}
            ></div>

            <div className="flex items-start justify-between relative z-10 w-full">
                <div className="w-10 h-10 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[20px]" style={{ color: iconColor }}>{icon}</span>
                </div>

                {trend && (
                    <div className="px-2.5 py-1 rounded-full border border-[#f1f5f9] dark:border-slate-800 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                        <span className="text-[9px] font-black text-[#64748b] dark:text-white uppercase tracking-wider">{trend}</span>
                    </div>
                )}
            </div>

            <div className="relative z-10 mt-4 flex items-end justify-between">
                <div className="flex-1 min-w-0">
                    <p className="text-[#94a3b8] text-[10px] font-black uppercase tracking-widest mb-1 truncate">{title}</p>
                    <p className="text-[26px] font-bold text-[#0d131b] dark:text-white leading-none tracking-tight truncate">{value}</p>
                </div>

                {data && data.length > 0 && (
                    <div className="w-20 h-10 opacity-70 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id={`colorSpark-${index}-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="100%">
                                        <stop offset="5%" stopColor={iconColor} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={iconColor} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area 
                                    type="monotone" 
                                    dataKey="v" 
                                    stroke={iconColor} 
                                    strokeWidth={2.5} 
                                    fillOpacity={1} 
                                    fill={`url(#colorSpark-${index}-${title.replace(/\s+/g, '')})`} 
                                    animationDuration={1500} 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;
