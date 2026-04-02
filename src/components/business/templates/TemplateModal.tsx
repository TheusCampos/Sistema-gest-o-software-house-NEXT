'use client';

import React from 'react';
import { ImplementationTemplate } from '@/types';

interface TemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingId: string | null;
    formData: Omit<ImplementationTemplate, 'id'>;
    setFormData: React.Dispatch<React.SetStateAction<Omit<ImplementationTemplate, 'id'>>>;
    handleSave: (e: React.FormEvent) => Promise<void>;
    addStep: () => void;
    removeStep: (index: number) => void;
    updateStep: (index: number, label: string) => void;
    toggleStepRequired: (index: number) => void;
}

/**
 * Componente de Modal para Criar/Editar Roteiros de Implantação.
 * Extraído da TemplatesPage para organizar melhor o formulário e a lógica de checklist.
 */
export const TemplateModal: React.FC<TemplateModalProps> = ({
    isOpen,
    onClose,
    editingId,
    formData,
    setFormData,
    handleSave,
    addStep,
    removeStep,
    updateStep,
    toggleStepRequired
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] flex flex-col animate-dropIn overflow-hidden">
                {/* Cabeçalho */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {editingId ? 'Editar Roteiro' : 'Novo Roteiro'}
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            Configuração de passos e requisitos
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[24px]">close</span>
                    </button>
                </div>

                {/* Conteúdo do Formulário */}
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    <form id="templateForm" onSubmit={handleSave} className="space-y-8">
                        {/* Nome do Roteiro */}
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                    Nome do Modelo
                                </label>
                                <input
                                    required
                                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 text-base font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all text-slate-900 dark:text-white"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Implantação Completa CRONOS"
                                />
                            </div>
                        </div>

                        {/* Descrição */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                Descrição
                            </label>
                            <textarea
                                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 resize-none h-24 transition-all text-slate-900 dark:text-white"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Descreva o objetivo deste checklist..."
                            />
                        </div>

                        {/* Toggle Dados Bancários */}
                        <div className="p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-2xl flex items-center justify-between">
                            <div className="flex gap-4 items-center">
                                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                                    <span className="material-symbols-outlined">account_balance</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-900 dark:text-amber-300">Dados Bancários (Boleto)</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-500 font-medium">
                                        Incluir formulário para Agência, Conta, Carteira, Convênio.
                                    </p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={formData.requiresBankConfig} 
                                    onChange={e => setFormData({ ...formData, requiresBankConfig: e.target.checked })} 
                                />
                                <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
                            </label>
                        </div>

                        {/* Seção das Etapas */}
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                            <div className="flex justify-between items-center mb-6">
                                <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">checklist</span>
                                    Etapas do Checklist ({formData.steps.length})
                                </label>
                                <button 
                                    type="button" 
                                    onClick={addStep} 
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    + Adicionar Passo
                                </button>
                            </div>

                            <div className="space-y-3">
                                {formData.steps.map((step, idx) => (
                                    <div key={idx} className="flex items-center gap-3 group bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                                        <span className="text-xs font-mono text-slate-400 w-6 text-right font-bold shrink-0">{idx + 1}.</span>
                                        <input
                                            type="text"
                                            className="flex-1 rounded-lg border-none bg-transparent px-2 py-1.5 text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-0 outline-none placeholder:font-normal"
                                            value={step.label}
                                            onChange={e => updateStep(idx, e.target.value)}
                                            placeholder="Descreva a etapa..."
                                        />
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => toggleStepRequired(idx)}
                                                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide transition-colors ${
                                                    step.required 
                                                    ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' 
                                                    : 'text-slate-400 bg-slate-200 dark:bg-slate-700'
                                                }`}
                                                title={step.required ? "Obrigatório" : "Opcional"}
                                            >
                                                {step.required ? 'Req' : 'Opc'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeStep(idx)}
                                                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">close</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Rodapé fixo do Modal */}
                <div className="p-8 border-t border-slate-100 dark:border-slate-800 shrink-0 flex justify-end gap-4 bg-slate-50 dark:bg-slate-900/50 rounded-b-[2rem]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors rounded-xl font-bold"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="templateForm"
                        className="px-8 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all active:scale-95 font-bold"
                    >
                        Salvar Roteiro
                    </button>
                </div>
            </div>
        </div>
    );
};
