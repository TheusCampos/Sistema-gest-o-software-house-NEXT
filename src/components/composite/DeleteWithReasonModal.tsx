'use client';

import React from 'react';

interface DeleteWithReasonModalProps {
    isOpen: boolean;
    itemName: string;
    reason: string;
    onReasonChange: (reason: string) => void;
    onCancel: () => void;
    onConfirm: () => void;
    /** Texto customizável do título. Padrão: "Confirmar Exclusão" */
    title?: string;
    /** Texto customizável da mensagem. Padrão: "Você está prestes a excluir" */
    message?: string;
    /** Ícone do Material Symbols. Padrão: "delete" */
    icon?: string;
    /** Mínimo de caracteres no motivo. Padrão: 10 */
    minReasonLength?: number;
}

/**
 * Modal genérico de exclusão lógica com campo de motivo obrigatório.
 * Elimina código duplicado em sellers, service-types, users e outros módulos.
 */
export const DeleteWithReasonModal: React.FC<DeleteWithReasonModalProps> = ({
    isOpen,
    itemName,
    reason,
    onReasonChange,
    onCancel,
    onConfirm,
    title = 'Confirmar Exclusão',
    message,
    icon = 'delete',
    minReasonLength = 10,
}) => {
    if (!isOpen) return null;

    const isValid = reason.trim().length >= minReasonLength;
    const displayMessage = message ?? `Você está prestes a excluir`;

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-dropIn">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">{title}</h3>
                        <p className="text-[10px] text-slate-400 uppercase font-black mt-1 tracking-widest">
                            Protocolo de desativação
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl"
                    >
                        <span className="material-symbols-outlined text-[24px]">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center ring-4 ring-rose-50 dark:ring-rose-900/10">
                            <span className="material-symbols-outlined text-4xl text-rose-600 dark:text-rose-400">
                                {icon}
                            </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">
                            {displayMessage}{' '}
                            <strong className="text-slate-900 dark:text-white">{itemName}</strong>.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                            Motivo da Exclusão <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={e => onReasonChange(e.target.value)}
                            className="w-full h-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/50 resize-none transition-all shadow-inner"
                            placeholder="Justifique a exclusão (mín. 10 caracteres)..."
                            autoFocus
                        />
                        <div className="flex justify-end">
                            <p className={`text-[10px] font-bold transition-colors ${isValid ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {reason.trim().length}/{minReasonLength}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        disabled={!isValid}
                        onClick={onConfirm}
                        className="flex-[2] py-3 bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-rose-600/30 hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <span>Confirmar Exclusão</span>
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteWithReasonModal;
