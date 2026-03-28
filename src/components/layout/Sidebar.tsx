'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';

const Sidebar: React.FC = () => {
    const { currentUser, logout, isSidebarOpen, setIsSidebarOpen, isDark, toggleTheme } = useApp();
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/dashboard' && pathname === '/dashboard') return true;
        if (path !== '/dashboard' && pathname.startsWith(path)) return true;
        return false;
    };

    const navItemClass = (path: string) =>
        `flex items-center gap-3 px-4 py-3 rounded-[14px] transition-all cursor-pointer ${isActive(path)
            ? 'bg-[#e2e8f0] dark:bg-slate-800 text-[#0d131b] dark:text-white font-bold shadow-sm'
            : 'text-[#4c6c9a] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium hover:translate-x-1'
        }`;

    const sidebarClasses = `w-72 border-r border-[#e7ecf3] dark:border-slate-800 bg-[#fdfdfe] dark:bg-slate-900 flex flex-col fixed h-full z-[100] transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } md:translate-x-0`;


    return (
        <aside className={sidebarClasses}>
            {/* Header */}
            <div className="p-8 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="shrink-0 w-10 flex items-center justify-center">
                        <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#0d131b] dark:text-white">
                            <path d="M30 20H80L20 80H70" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M30 35H80L20 95H70" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                        </svg>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-[#0d131b] dark:text-white text-[15px] font-bold leading-tight truncate">
                            {currentUser?.company || 'Zeus Enterprise Manager'}
                        </h1>
                        <p className="text-[#94a3b8] text-[10px] font-medium truncate tracking-tight">
                            Controle Operacional
                        </p>
                    </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="md:hidden w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            <div className="px-5 mb-4 flex-1 overflow-y-auto custom-scrollbar space-y-8 mt-4">
                <div>
                    <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mb-4 px-4">Operacional</p>
                    <nav className="space-y-1">
                        <Link href="/dashboard" className={navItemClass('/dashboard')}>
                            <span className="material-symbols-outlined text-[22px]">grid_view</span>
                            <span className="text-[13px]">Visão Geral</span>
                        </Link>
                        {(currentUser?.role === 'admin' || currentUser?.role === 'desenvolvedor' || currentUser?.permissions?.tickets?.view) && (
                            <Link href="/tickets" className={navItemClass('/tickets')}>
                                <span className="material-symbols-outlined text-[22px]">confirmation_number</span>
                                <span className="text-[13px]">Mesa de Suporte</span>
                            </Link>
                        )}
                        {(currentUser?.role === 'admin' || currentUser?.role === 'desenvolvedor' || currentUser?.permissions?.equipment?.view) && (
                            <Link href="/equipment" className={navItemClass('/equipment')}>
                                <span className="material-symbols-outlined text-[22px]">devices</span>
                                <span className="text-[13px]">Inventário de TI</span>
                            </Link>
                        )}
                        <Link href="/clients" className={navItemClass('/clients')}>
                            <span className="material-symbols-outlined text-[22px]">groups</span>
                            <span className="text-[13px]">Base de Clientes</span>
                        </Link>
                        {(currentUser?.role === 'admin' || currentUser?.role === 'desenvolvedor' || currentUser?.permissions?.sellers?.view) && (
                            <Link href="/sellers" className={navItemClass('/sellers')}>
                                <span className="material-symbols-outlined text-[22px]">sell</span>
                                <span className="text-[13px]">Vendedores</span>
                            </Link>
                        )}
                        {(currentUser?.role === 'admin' || currentUser?.role === 'desenvolvedor' || currentUser?.permissions?.contracts?.view) && (
                            <Link href="/contracts" className={navItemClass('/contracts')}>
                                <span className="material-symbols-outlined text-[22px]">description</span>
                                <span className="text-[13px]">Contratos</span>
                            </Link>
                        )}
                        {(currentUser?.role === 'admin' || currentUser?.role === 'desenvolvedor' || currentUser?.permissions?.appointments?.view) && (
                            <Link href="/appointments" className={navItemClass('/appointments')}>
                                <span className="material-symbols-outlined text-[22px]">calendar_month</span>
                                <span className="text-[13px]">Agendamentos</span>
                            </Link>
                        )}
                        {(currentUser?.role === 'admin' || currentUser?.role === 'desenvolvedor' || currentUser?.permissions?.performance?.view) && (
                            <Link href="/performance" className={navItemClass('/performance')}>
                                <span className="material-symbols-outlined text-[22px]">monitoring</span>
                                <span className="text-[13px]">Desempenho</span>
                            </Link>
                        )}
                    </nav>
                </div>

                {(currentUser?.role === 'admin' || currentUser?.role === 'desenvolvedor' || currentUser?.permissions?.settings?.view) && (
                    <div>
                        <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mb-4 px-4">Configurações</p>
                        <nav className="space-y-1">
                            <Link href="/service-types" className={navItemClass('/service-types')}>
                                <span className="material-symbols-outlined text-[22px]">category</span>
                                <span className="text-[13px]">Tipos Atendimento</span>
                            </Link>
                            <Link href="/templates" className={navItemClass('/templates')}>
                                <span className="material-symbols-outlined text-[22px]">assignment_turned_in</span>
                                <span className="text-[13px]">Templates Implantação</span>
                            </Link>
                            <Link href="/users" className={navItemClass('/users')}>
                                <span className="material-symbols-outlined text-[22px]">manage_accounts</span>
                                <span className="text-[13px]">Equipe & Permissões</span>
                            </Link>
                        </nav>
                    </div>
                )}
            </div>

            <div className="p-4 mt-auto shrink-0 border-t border-[#f1f5f9] dark:border-slate-800">
                {/* User card matching image */}
                <div className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800 border border-[#f1f5f9] dark:border-slate-700 rounded-2xl shadow-sm mb-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div 
                            className="shrink-0 w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 bg-cover bg-center border border-slate-100 dark:border-slate-600" 
                            style={{ backgroundImage: `url("${currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || '')}&background=random`}")` }}
                        ></div>
                        <div className="flex flex-col min-w-0">
                            <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{currentUser?.name || 'Usuário'}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">
                                {currentUser?.role || 'Colaborador'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#0d131b] dark:hover:text-white transition-all"
                    >
                        <span className="material-symbols-outlined text-[20px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
                    </button>
                </div>

                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[#64748b] bg-[#f8fafc] dark:bg-slate-800/50 hover:bg-[#f1f5f9] dark:hover:bg-slate-800 text-[13px] font-bold transition-all"
                >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sair do Sistema
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
