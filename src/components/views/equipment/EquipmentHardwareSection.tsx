'use client';

import React from 'react';
import { Equipment } from '@/types';
import DatePickerField from '@/components/composite/DatePickerField';

interface EquipmentHardwareSectionProps {
    formData: Equipment;
    handleChange: <K extends keyof Equipment>(field: K, value: Equipment[K]) => void;
    availableHosts: Equipment[];
    readOnly: boolean;
}

const inputClass = "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed";
const labelClass = "text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-1 block";

export const EquipmentHardwareSection: React.FC<EquipmentHardwareSectionProps> = ({ formData, handleChange, availableHosts, readOnly }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 space-y-6 animate-fadeIn">
            <h2 className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
                <span className="material-symbols-outlined text-primary">memory</span>
                Especificações de Hardware
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={labelClass}>Localização Física</label>
                    <input disabled={readOnly} type="text" value={formData.location || ''} onChange={e => handleChange('location', e.target.value)} className={inputClass} placeholder="Ex: Matriz - Sala TI, Andar 2" />
                </div>
                <DatePickerField
                    label="Data de Aquisição"
                    value={formData.purchaseDate || ''}
                    onChange={val => handleChange('purchaseDate', val)}
                    disabled={readOnly}
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DatePickerField
                    label="Data de Provisionamento"
                    value={formData.provisioningDate || ''}
                    onChange={val => handleChange('provisioningDate', val)}
                    disabled={readOnly}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className={labelClass}>Marca</label>
                    <input disabled={readOnly} type="text" value={formData.brand || ''} onChange={e => handleChange('brand', e.target.value)} className={inputClass} placeholder="Ex: Dell, HP" />
                </div>
                <div>
                    <label className={labelClass}>Modelo</label>
                    <input disabled={readOnly} type="text" value={formData.model || ''} onChange={e => handleChange('model', e.target.value)} className={inputClass} placeholder="Ex: PowerEdge R740" />
                </div>
                <div>
                    <label className={labelClass}>Número de Série (S/N)</label>
                    <input disabled={readOnly} type="text" value={formData.serialNumber || ''} onChange={e => handleChange('serialNumber', e.target.value)} className={inputClass} placeholder="Identificador único" />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className={labelClass}>Processador</label>
                    <input disabled={readOnly} type="text" value={formData.processor || ''} onChange={e => handleChange('processor', e.target.value)} className={inputClass} placeholder="Ex: Intel Xeon Gold" />
                </div>
                <div>
                    <label className={labelClass}>Memória RAM</label>
                    <input disabled={readOnly} type="text" value={formData.ram || ''} onChange={e => handleChange('ram', e.target.value)} className={inputClass} placeholder="Ex: 64GB DDR4" />
                </div>
                <div>
                    <label className={labelClass}>Armazenamento</label>
                    <input disabled={readOnly} type="text" value={formData.storage || ''} onChange={e => handleChange('storage', e.target.value)} className={inputClass} placeholder="Ex: 2x 1TB SSD RAID 1" />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5">
                    <label className={labelClass}>Sistema Operacional</label>
                    <input disabled={readOnly} type="text" value={formData.os || ''} onChange={e => handleChange('os', e.target.value)} className={inputClass} placeholder="Ex: Ubuntu 22.04 LTS" />
                </div>
                <div className="md:col-span-4">
                    <label className={labelClass}>Endereço IP / MAC</label>
                    <input disabled={readOnly} type="text" value={formData.ipAddress || ''} onChange={e => handleChange('ipAddress', e.target.value)} className={inputClass} placeholder="Ex: 192.168.0.50" />
                </div>
                <div className="md:col-span-3">
                    <label className={labelClass}>Porta</label>
                    <input disabled={readOnly} type="text" value={formData.port || ''} onChange={e => handleChange('port', e.target.value)} className={inputClass} placeholder="Ex: 5432" />
                </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-2">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">settings_extension</span>
                    Detalhes de Virtualização / Host
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className={labelClass}>Host ID (Vínculo)</label>
                        <select disabled={readOnly} value={formData.hostId || ''} onChange={e => handleChange('hostId', e.target.value)} className={`${inputClass} appearance-none custom-select-arrow`}>
                            <option value="">Nenhum (Standalone/Host)</option>
                            {availableHosts.map(host => (
                                <option key={host.id} value={host.id}>{host.name} ({host.ipAddress})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Hypervisor</label>
                        <input disabled={readOnly} type="text" value={formData.hypervisor || ''} onChange={e => handleChange('hypervisor', e.target.value)} className={inputClass} placeholder="Ex: VMware, Proxmox" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className={labelClass}>vCPU</label>
                        <input disabled={readOnly} type="text" value={formData.vCpu || ''} onChange={e => handleChange('vCpu', e.target.value)} className={inputClass} placeholder="Ex: 4 vCores" />
                    </div>
                    <div>
                        <label className={labelClass}>vRAM</label>
                        <input disabled={readOnly} type="text" value={formData.vRam || ''} onChange={e => handleChange('vRam', e.target.value)} className={inputClass} placeholder="Ex: 16GB" />
                    </div>
                    <div>
                        <label className={labelClass}>vStorage</label>
                        <input disabled={readOnly} type="text" value={formData.vStorage || ''} onChange={e => handleChange('vStorage', e.target.value)} className={inputClass} placeholder="Ex: 100GB" />
                    </div>
                </div>
            </div>
        </div>
    );
};
