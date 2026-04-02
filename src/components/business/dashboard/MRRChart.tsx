'use client';

import React from 'react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';

interface MRRChartProps {
    totalMRR: string;
    data: { name: string; mrr: number }[];
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-800 p-4 border border-[#f1f5f9] dark:border-slate-700 rounded-2xl shadow-xl">
                <p className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1">{label}</p>
                <p className="text-[16px] font-bold text-[#136dec] dark:text-blue-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value)}
                </p>
            </div>
        );
    }
    return null;
};

export const MRRChart: React.FC<MRRChartProps> = ({ totalMRR, data }) => {
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsMounted(true);
        }, 150);
        return () => clearTimeout(timer);
    }, []);

    const hasData = data && data.some(d => d.mrr > 0);

    return (
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-[#f1f5f9] dark:border-slate-800 p-10 rounded-[48px] shadow-[0_8px_30px_-6px_rgba(0,0,0,0.04)] flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-start mb-10 relative z-10">
                <div>
                    <h4 className="text-[20px] font-bold text-[#0d131b] dark:text-white tracking-tight">Crescimento de MRR</h4>
                    <p className="text-[14px] text-[#94a3b8] font-medium mt-1">Expansão líquida nos últimos 6 meses</p>
                </div>
                <div className="text-right">
                    <p className="text-[26px] font-bold text-[#0d131b] dark:text-white tracking-tight">
                        {totalMRR}
                    </p>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[320px] relative">
                {!hasData ? (
                    <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-800/20 rounded-[40px] border border-[#f1f5f9] dark:border-slate-700/50 flex items-center justify-center z-10">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-5 border border-white/50 dark:border-slate-700">
                                <span className="material-symbols-outlined text-[#cbd5e1] text-[32px]">query_stats</span>
                            </div>
                            <p className="text-[#94a3b8] font-bold text-[15px] max-w-[200px] leading-relaxed">Aguardando dados históricos...</p>
                        </div>
                    </div>
                ) : (
                    isMounted && (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <AreaChart
                                data={data}
                                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#136dec" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#136dec" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid 
                                    strokeDasharray="3 3" 
                                    vertical={false} 
                                    stroke="#f1f5f9" 
                                    className="dark:stroke-slate-800"
                                />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                                    hide={typeof window !== 'undefined' && window.innerWidth < 768}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area 
                                    type="monotone" 
                                    dataKey="mrr" 
                                    stroke="#136dec" 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#colorMrr)" 
                                    animationDuration={1500}
                                    animationEasing="ease-in-out"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )
                )}
            </div>
        </div>
    );
};
