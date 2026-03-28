'use client';

import React from 'react';
import Image from 'next/image';

interface TechnicianData {
    id: string;
    name: string;
    role: string;
    avatar: string;
    assigned: number;
    resolved: number;
    avgResponse: string;
    compliance: number;
    score: number;
}

interface TechnicianTableProps {
    technicians: TechnicianData[];
}

export const TechnicianTable: React.FC<TechnicianTableProps> = ({ technicians }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full flex flex-col relative bg-white dark:bg-slate-900 text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-20 shadow-sm hidden md:flex w-full border-b border-slate-200 dark:border-slate-800">
                        <tr className="flex w-full items-center">
                            <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-500 flex-[2]">Técnico</th>
                            <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-500 flex-1 text-center">Atribuídos / Resolvidos</th>
                            <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-500 flex-1">Resp. Média</th>
                            <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-500 flex-1">Conformidade</th>
                            <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-500 flex-[1.5]">Pontuação</th>
                        </tr>
                    </thead>
                    <tbody className="flex flex-col w-full divide-y divide-slate-100 dark:divide-slate-800 relative">
                        {technicians.map((tech) => (
                            <tr key={tech.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group flex flex-col md:flex-row items-start md:items-center border-b border-slate-100 dark:border-slate-800 p-4 md:p-0">
                                <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap flex-[2] w-full md:w-auto">
                                    <span className="md:hidden font-bold text-slate-500 text-[10px] uppercase tracking-widest mb-2 block">Técnico</span>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm group-hover:scale-105 transition-transform">
                                            <Image
                                                src={tech.avatar}
                                                alt={tech.name}
                                                className="w-full h-full object-cover"
                                                width={40}
                                                height={40}
                                                unoptimized
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{tech.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{tech.role}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-0 md:px-8 py-2 md:py-[6px] text-left md:text-center flex-1 w-full md:w-auto">
                                    <span className="md:hidden font-bold text-slate-500 text-[10px] uppercase tracking-widest mb-2 block">Atribuídos / Resolvidos</span>
                                    <div className="flex flex-col items-start md:items-center">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{tech.assigned} / {tech.resolved}</span>
                                        <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                            <div className={`h-full ${tech.score > 80 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${(tech.assigned > 0) ? (tech.resolved / tech.assigned) * 100 : 0}%` }}></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap flex-1 w-full md:w-auto">
                                    <span className="md:hidden font-bold text-slate-500 text-[10px] uppercase tracking-widest mb-2 block">Resp. Média</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">{tech.avgResponse}</span>
                                </td>
                                <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap flex-1 w-full md:w-auto">
                                    <span className="md:hidden font-bold text-slate-500 text-[10px] uppercase tracking-widest mb-2 block">Conformidade</span>
                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest w-fit ring-1 ring-inset ${tech.compliance > 90 ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-900/20 dark:text-rose-400'}`}>{tech.compliance}%</span>
                                </td>
                                <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap flex-[1.5] w-full md:w-auto">
                                    <span className="md:hidden font-bold text-slate-500 text-[10px] uppercase tracking-widest mb-2 block">Pontuação</span>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-xl font-black ${tech.score > 90 ? 'text-primary' : tech.score > 70 ? 'text-amber-500' : 'text-rose-500'}`}>{tech.score}</span>
                                        <div className="flex-1 min-w-[80px] h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${tech.score > 90 ? 'bg-primary' : tech.score > 70 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${tech.score}%` }}></div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
