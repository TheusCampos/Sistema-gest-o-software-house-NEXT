'use client';

import React from 'react';
import { Equipment, EquipmentType, EquipmentStatus } from '@/types';
import DatePickerField from '@/components/composite/DatePickerField';

interface EquipmentBasicSectionProps {
    formData: Equipment;
    handleChange: <K extends keyof Equipment>(field: K, value: Equipment[K]) => void;
    readOnly: boolean;
}

const inputClass = "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed";
const labelClass = "text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-1 block";

export const EquipmentBasicSection: React.FC<EquipmentBasicSectionProps> = ({ formData, handleChange, readOnly }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 space-y-6 animate-fadeIn">
            <h2 className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
                <span className="material-symbols-outlined text-primary">info</span>
                Informações Básicas
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={labelClass}>Nome / Identificador <span className="text-rose-500">*</span></label>
                    <input disabled={readOnly} required type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} className={inputClass} placeholder="Ex: SRV-APP-01 ou NB-JOAO" />
                </div>
                <div>
                    <label className={labelClass}>Tipo de Equipamento</label>
                    <select disabled={readOnly} value={formData.type} onChange={e => handleChange('type', e.target.value as EquipmentType)} className={`${inputClass} appearance-none custom-select-arrow`}>
                        <option value="Desktop">Microcomputador (Desktop)</option>
                        <option value="Notebook">Notebook Corporativo</option>
                        <option value="Server">Servidor Físico</option>
                        <option value="VM">Máquina Virtual (VM)</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className={labelClass}>Status Atual</label>
                    <select disabled={readOnly} value={formData.status} onChange={e => handleChange('status', e.target.value as EquipmentStatus)} className={`${inputClass} appearance-none custom-select-arrow`}>
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                        <option value="Em Manutenção">Em Manutenção</option>
                        <option value="Descartado">Descartado</option>
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Responsável Técnico</label>
                    <input disabled={readOnly} type="text" value={formData.responsible} onChange={e => handleChange('responsible', e.target.value)} className={inputClass} placeholder="Nome do responsável" />
                </div>
                <DatePickerField
                    label="Data de Cadastro"
                    value={formData.registrationDate}
                    onChange={val => handleChange('registrationDate', val)}
                    disabled={readOnly}
                />
            </div>

            <div className="grid grid-cols-1">
                <div>
                    <label className={labelClass}>Observações Gerais</label>
                    <textarea disabled={readOnly} value={formData.notes || ''} onChange={e => handleChange('notes', e.target.value)} className={`${inputClass} h-24 resize-none`} placeholder="Detalhes adicionais, histórico, etc..." />
                </div>
            </div>
        </div>
    );
};
