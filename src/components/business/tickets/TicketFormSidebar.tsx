'use client';

import React from 'react';

export const TicketFormSidebar: React.FC = () => {
    return (
        <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm sticky top-24">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-[20px]">info</span>
                    Fluxo de Abertura
                </h3>
                <div className="space-y-6 relative">
                    <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800"></div>

                    <div className="relative flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold z-10 shadow-md shadow-primary/30">1</div>
                        <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">Descreva o Problema</p>
                            <p className="text-[10px] text-slate-500 leading-tight mt-1">Detalhe o erro e anexe evidências.</p>
                        </div>
                    </div>

                    <div className="relative flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold z-10 shadow-md shadow-purple-600/30">2</div>
                        <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">Use a IA</p>
                            <p className="text-[10px] text-slate-500 leading-tight mt-1">Gere um diagnóstico prévio com um clique.</p>
                        </div>
                    </div>

                    <div className="relative flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold z-10 shadow-md shadow-emerald-600/30">3</div>
                        <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">Finalize</p>
                            <p className="text-[10px] text-slate-500 leading-tight mt-1">Revise e envie para nossa equipe.</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};
