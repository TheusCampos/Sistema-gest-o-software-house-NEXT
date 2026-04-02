'use client';

import React, { useState } from 'react';

interface ColumnConfig {
    id: string;
    label: string;
}

interface ListToolbarProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    /** Filtro de status opcional (all/active/inactive) */
    statusFilter?: string;
    onStatusFilterChange?: (value: string) => void;
    /** Configuração de colunas para o menu de visibilidade */
    columns?: ColumnConfig[];
    visibleColumns?: Record<string, boolean>;
    onToggleColumn?: (key: string) => void;
    /** Slot para filtros extras (ex: selects customizados) */
    extraFilters?: React.ReactNode;
}

/**
 * Toolbar reutilizável para páginas de lista.
 * Inclui busca, filtro de status e menu de visibilidade de colunas.
 * Elimina o pattern duplicado em sellers, service-types, equipment, clients, etc.
 */
export const ListToolbar: React.FC<ListToolbarProps> = ({
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Buscar...',
    statusFilter,
    onStatusFilterChange,
    columns,
    visibleColumns,
    onToggleColumn,
    extraFilters,
}) => {
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const hasColumnMenu = columns && columns.length > 0 && visibleColumns && onToggleColumn;

    return (
        <div className="px-4">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4 shadow-xl">

                {/* Search Input */}
                <div className="relative flex-1 w-full">
                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                        search
                    </span>
                    <input
                        type="text"
                        value={searchValue}
                        onChange={e => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none text-base font-medium"
                    />
                </div>

                <div className="flex gap-3 w-full md:w-auto relative">
                    {/* Status Filter */}
                    {onStatusFilterChange && (
                        <select
                            value={statusFilter}
                            onChange={e => onStatusFilterChange(e.target.value)}
                            className="flex-1 md:flex-none pl-6 pr-12 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-4 focus:ring-primary/5 transition-all appearance-none custom-select-arrow cursor-pointer"
                        >
                            <option value="all">Status: Ativos</option>
                            <option value="inactive">Status: Inativos</option>
                        </select>
                    )}

                    {/* Extra Filters Slot */}
                    {extraFilters}

                    {/* Column Visibility Menu */}
                    {hasColumnMenu && (
                        <>
                            <button
                                onClick={() => setShowColumnMenu(prev => !prev)}
                                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold border transition-all ${
                                    showColumnMenu
                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[20px]">view_column</span>
                                Colunas
                            </button>
                            {showColumnMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowColumnMenu(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-4 w-64 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-30 p-4 animate-fadeIn">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-3">
                                            Visibilidade
                                        </p>
                                        <div className="space-y-2">
                                            {columns!.map(col => (
                                                <label
                                                    key={col.id}
                                                    className="flex items-center gap-4 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors group"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={visibleColumns![col.id] ?? true}
                                                        onChange={() => onToggleColumn!(col.id)}
                                                        className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary"
                                                    />
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">
                                                        {col.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ListToolbar;
