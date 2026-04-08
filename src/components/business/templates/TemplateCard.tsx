'use client';

import React from 'react';
import { ImplementationTemplate } from '@/types';

interface TemplateCardProps {
    template: ImplementationTemplate;
    onEdit: (template: ImplementationTemplate) => void;
    onDelete: (id: string) => void;
    onPrint: (template: ImplementationTemplate) => void;
    canView?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
}

/**
 * Componente de Card para visualização de Modelos de Implantação.
 * Extraído da TemplatesPage para melhorar a organização e legibilidade.
 */
export const TemplateCard: React.FC<TemplateCardProps> = ({
    template,
    onEdit,
    onDelete,
    onPrint,
    canView = false,
    canEdit = false,
    canDelete = false
}) => {
    return (
        <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all relative group animate-slideUp"
        >
            {/* Ações Rápidas (visíveis no hover) */}
            <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => onPrint(template)} 
                    title="Imprimir Roteiro" 
                    className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:text-primary transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">print</span>
                </button>
                {canEdit && (
                    <button 
                        onClick={() => onEdit(template)} 
                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:text-primary transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                )}
                {!canEdit && canView && (
                    <button 
                        onClick={() => onEdit(template)} 
                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:text-primary transition-colors"
                        title="Visualizar"
                    >
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                    </button>
                )}
                {canDelete && (
                    <button 
                        onClick={() => onDelete(template.id)} 
                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:text-rose-600 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                )}
            </div>

            {/* Cabeçalho do Card */}
            <div className="flex items-center gap-4 mb-4">
                <div 
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg ${
                        template.systemType === 'CRONOS' 
                        ? 'bg-indigo-500 shadow-lg shadow-indigo-500/20' 
                        : 'bg-emerald-500 shadow-lg shadow-emerald-500/20'
                    }`}
                >
                    {template.systemType[0]}
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{template.name}</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                        {template.steps.length} Passos • Sistema {template.systemType}
                    </p>
                </div>
            </div>

            {/* Descrição */}
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 line-clamp-2 h-10">
                {template.description}
            </p>

            {/* Badges de Requisitos */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {template.requiresBankConfig && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 rounded-xl text-[10px] font-black border border-amber-100 dark:border-amber-800 shrink-0 uppercase tracking-wide">
                        <span className="material-symbols-outlined text-[16px]">account_balance</span> Boleto
                    </span>
                )}
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-[10px] font-black border border-slate-200 dark:border-slate-700 shrink-0 uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[16px]">checklist</span> Checklist
                </span>
            </div>

            {/* Preview das Etapas */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Prévia dos Passos</p>
                <ul className="space-y-2">
                    {template.steps.slice(0, 3).map((step, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <span className="material-symbols-outlined text-slate-400 text-[18px]">check_box_outline_blank</span>
                            <span className="truncate font-medium">{step.label}</span>
                        </li>
                    ))}
                    {template.steps.length > 3 && (
                        <li className="text-xs text-slate-400 pl-7 italic font-medium">+ mais {template.steps.length - 3} itens...</li>
                    )}
                </ul>
            </div>
        </div>
    );
};
