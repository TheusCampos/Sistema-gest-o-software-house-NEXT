'use client';
import React from 'react';
import { useApp } from '@/context/AppContext';

const TopBar: React.FC = () => {
    // Controle de UI global
    const { toggleTheme, isDark, setIsSidebarOpen } = useApp();

    return (
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#f1f5f9] dark:border-slate-800 bg-[#fdfdfe]/80 dark:bg-slate-900/80 backdrop-blur-md px-6 md:px-10 py-5 transition-colors">
            <div className="flex items-center gap-6">
                {/* Botão de menu no mobile (abre a sidebar) */}
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>

                {/* Campo de busca (atualmente apenas visual / placeholder) */}
                <div className="relative w-full max-w-[280px]">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[20px]">search</span>
                    <input
                        className="w-full h-11 pl-12 pr-4 bg-[#f1f5f9] dark:bg-slate-800 border-none rounded-2xl text-[14px] font-medium placeholder:text-[#94a3b8] dark:text-slate-200 focus:ring-2 focus:ring-[#e2e8f0] focus:outline-none transition-all"
                        placeholder="Buscar..."
                        type="text"
                    />
                </div>
            </div>
            <div className="flex items-center gap-3">
                {/* Alterna tema claro/escuro */}
                <button
                    onClick={toggleTheme}
                    className="w-11 h-11 flex items-center justify-center rounded-2xl text-[#64748b] dark:text-slate-400 hover:bg-[#f1f5f9] dark:hover:bg-slate-800 transition-all"
                    title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
                >
                    <span className="material-symbols-outlined text-[22px]">
                        {isDark ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>
                {/* Botão de notificações (placeholder visual) */}
                <button className="w-11 h-11 flex items-center justify-center rounded-2xl text-[#64748b] dark:text-slate-400 hover:bg-[#f1f5f9] dark:hover:bg-slate-800 transition-all">
                    <span className="material-symbols-outlined text-[22px]">notifications</span>
                </button>
            </div>
        </header>
    );
};

export default TopBar;
