'use client';

import React from 'react';

interface AppointmentSidebarProps {
    onNewAppointment: () => void;
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    viewMode: 'Day' | 'Week' | 'Month';
    setViewMode: (mode: 'Day' | 'Week' | 'Month') => void;
    monthDays: Date[];
    navigateCalendar: (dir: number) => void;
    filterSync: boolean;
    setFilterSync: (v: boolean) => void;
    filterDeploy: boolean;
    setFilterDeploy: (v: boolean) => void;
    filterTask: boolean;
    setFilterTask: (v: boolean) => void;
    canCreate?: boolean;
}

/**
 * Componente de Barra Lateral da Agenda.
 * Contém o mini-calendário e filtros de visualização.
 */
export const AppointmentSidebar: React.FC<AppointmentSidebarProps> = ({
    onNewAppointment,
    currentDate,
    setCurrentDate,
    viewMode,
    setViewMode,
    monthDays,
    navigateCalendar,
    filterSync,
    setFilterSync,
    filterDeploy,
    setFilterDeploy,
    filterTask,
    setFilterTask,
    canCreate = false
}) => {
    return (
        <aside className="w-64 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-8 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 hidden lg:flex shrink-0">
            {/* Botão de Criação */}
            {canCreate && (
                <button 
                    onClick={onNewAppointment} 
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white p-3 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined">add</span>
                    Novo Agendamento
                </button>
            )}

            {/* Mini Calendário */}
            <div className="animate-fadeIn">
                <div className="flex items-center w-full justify-between mb-4">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white capitalize truncate">
                        {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
                    </h2>
                    <div className="flex gap-1 shrink-0">
                        <span 
                            onClick={() => { setViewMode('Month'); navigateCalendar(-1); }} 
                            className="material-symbols-outlined text-[18px] text-slate-400 cursor-pointer hover:text-primary transition bg-slate-100 dark:bg-slate-800 p-0.5 rounded"
                        >
                            chevron_left
                        </span>
                        <span 
                            onClick={() => { setViewMode('Month'); navigateCalendar(1); }} 
                            className="material-symbols-outlined text-[18px] text-slate-400 cursor-pointer hover:text-primary transition bg-slate-100 dark:bg-slate-800 p-0.5 rounded"
                        >
                            chevron_right
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
                    <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                    {monthDays.map((md, i) => {
                        const isCurrentSideMonth = md.getMonth() === currentDate.getMonth();
                        const now = new Date();
                        const isToday = md.getDate() === now.getDate() && md.getMonth() === now.getMonth() && md.getFullYear() === now.getFullYear();
                        
                        return (
                            <div
                                key={i}
                                onClick={() => { setViewMode('Day'); setCurrentDate(md); }}
                                className={`p-1.5 rounded-full cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center 
                                ${isCurrentSideMonth ? '' : 'text-slate-300 dark:text-slate-600'}
                                ${isToday ? 'bg-primary text-white font-bold hover:bg-primary' : ''}`}
                            >
                                {md.getDate()}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Filtros de Agenda */}
            <div className="animate-fadeIn">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between">
                    Minhas Agendas 
                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </h3>
                <div className="space-y-3">
                    <label className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={filterSync} 
                            onChange={(e) => setFilterSync(e.target.checked)} 
                            className="w-4 h-4 rounded text-blue-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-blue-500" 
                        />
                        <span className="group-hover:text-primary transition">Sincronização Diária</span>
                    </label>
                    <label className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={filterDeploy} 
                            onChange={(e) => setFilterDeploy(e.target.checked)} 
                            className="w-4 h-4 rounded text-emerald-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-emerald-500" 
                        />
                        <span className="group-hover:text-primary transition">Implantações</span>
                    </label>
                    <label className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={filterTask} 
                            onChange={(e) => setFilterTask(e.target.checked)} 
                            className="w-4 h-4 rounded text-purple-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-purple-500" 
                        />
                        <span className="group-hover:text-primary transition">Tarefas Internas</span>
                    </label>
                </div>
            </div>
        </aside>
    );
};
