'use client';

import React from 'react';
import { Equipment } from '@/types';

interface EquipmentVMSectionProps {
    formData: Equipment;
    handleChange: <K extends keyof Equipment>(field: K, value: Equipment[K]) => void;
    availableHosts: Equipment[];
    readOnly: boolean;
}

const inputClass = "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed";
const labelClass = "text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-1 block";

export const EquipmentVMSection: React.FC<EquipmentVMSectionProps> = ({ formData, handleChange, availableHosts, readOnly }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 space-y-8 animate-fadeIn">
            <h2 className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
                <span className="material-symbols-outlined text-primary">cloud</span>
                Especificações de Virtualização
            </h2>

            <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">dns</span>
                    Infraestrutura & Host
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                        <label className={labelClass}>Host Físico (Servidor) <span className="text-rose-500">*</span></label>
                        <select disabled={readOnly} required value={formData.hostId || ''} onChange={e => handleChange('hostId', e.target.value)} className={`${inputClass} appearance-none custom-select-arrow`}>
                            <option value="">Selecione o Servidor Host...</option>
                            {availableHosts.map(host => (
                                <option key={host.id} value={host.id}>{host.name} ({host.ipAddress})</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1 italic">A VM deve estar vinculada a um servidor físico cadastrado.</p>
                    </div>
                    <div>
                        <label className={labelClass}>Hypervisor</label>
                        <input disabled={readOnly} type="text" value={formData.hypervisor || ''} onChange={e => handleChange('hypervisor', e.target.value)} className={inputClass} placeholder="Ex: VMware ESXi, Hyper-V, Proxmox" />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">settings_system_daydream</span>
                    Recursos Alocados (Guest)
                </h3>
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className={labelClass}>vCPU Alocada</label>
                            <input disabled={readOnly} type="text" value={formData.vCpu || ''} onChange={e => handleChange('vCpu', e.target.value)} className={inputClass} placeholder="Ex: 4 Cores" />
                        </div>
                        <div>
                            <label className={labelClass}>vRAM Alocada</label>
                            <input disabled={readOnly} type="text" value={formData.vRam || ''} onChange={e => handleChange('vRam', e.target.value)} className={inputClass} placeholder="Ex: 16GB" />
                        </div>
                        <div>
                            <label className={labelClass}>Storage Virtual</label>
                            <input disabled={readOnly} type="text" value={formData.vStorage || ''} onChange={e => handleChange('vStorage', e.target.value)} className={inputClass} placeholder="Ex: 100GB Thin Provision" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-5">
                            <label className={labelClass}>Sistema Operacional Guest</label>
                            <input disabled={readOnly} type="text" value={formData.os || ''} onChange={e => handleChange('os', e.target.value)} className={inputClass} placeholder="Ex: Windows Server 2022" />
                        </div>
                        <div className="md:col-span-4">
                            <label className={labelClass}>IP Virtual</label>
                            <input disabled={readOnly} type="text" value={formData.ipAddress || ''} onChange={e => handleChange('ipAddress', e.target.value)} className={inputClass} placeholder="Ex: 192.168.1.100" />
                        </div>
                        <div className="md:col-span-3">
                            <label className={labelClass}>Porta <span className="text-rose-500">*</span></label>
                            <input disabled={readOnly} required type="text" value={formData.port || ''} onChange={e => handleChange('port', e.target.value)} className={inputClass} placeholder="Ex: 5432" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
