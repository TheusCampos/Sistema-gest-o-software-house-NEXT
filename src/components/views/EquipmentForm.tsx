'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Equipment, EquipmentType, EquipmentStatus } from '@/types';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface EquipmentFormProps {
    // Se informado, o formulário abre em modo de edição/visualização do equipamento.
    equipmentId?: string;
    // Quando true, desabilita inputs e impede submit (modo "detalhes").
    readOnly?: boolean;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({ equipmentId, readOnly = false }) => {
    // Lista de equipamentos + action de persistência (Context)
    const { equipmentList, saveEquipment, currentUser } = useApp();
    const router = useRouter();
    // Se existe equipmentId, estamos editando/visualizando um registro existente
    const isEditing = !!equipmentId;

    const inputClass = "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed";
    const labelClass = "text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-1 block";

    // Filtra apenas servidores físicos ativos para serem Hosts de VMs
    const availableHosts = equipmentList.filter(e => e.type === 'Server' && e.status === 'Ativo' && e.active);


    // Estado inicial padrão
    const initialFormState = useMemo<Equipment>(() => ({
        id: '',
        tenantId: currentUser?.tenantId || '',
        name: '',
        type: 'Desktop',
        status: 'Ativo',
        registrationDate: new Date().toISOString().split('T')[0],
        responsible: '',
        active: true,
        location: '',
        brand: '',
        model: '',
        serialNumber: '',
        processor: '',
        ram: '',
        storage: '',
        os: '',
        ipAddress: '',
        port: '',
        purchaseDate: '',
        hostId: '',
        hypervisor: '',
        vCpu: '',
        vRam: '',
        vStorage: '',
        provisioningDate: ''
    }), [currentUser?.tenantId]);

    const [formData, setFormData] = useState<Equipment>(() => initialFormState);



    useEffect(() => {
        // Ao editar: carrega o equipamento da lista e faz merge com o estado inicial
        if (equipmentId) {
            const found = equipmentList.find(e => e.id === equipmentId);
            if (found) {
                const timer = window.setTimeout(() => {
                    setFormData({ ...initialFormState, ...found });
                }, 0);
                return () => window.clearTimeout(timer);
            }
        }
    }, [equipmentId, equipmentList, initialFormState]);

    const handleChange = <K extends keyof Equipment>(field: K, value: Equipment[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Modo detalhes/visualização: não salva
        if (readOnly) return;

        // Validação Manual Rigorosa para VM e Server
        if (formData.type === 'VM' || formData.type === 'Server') {
            if (!formData.port || formData.port.trim() === '') {
                alert(`O campo Porta é obrigatório para ${formData.type === 'VM' ? 'Máquinas Virtuais' : 'Servidores'}.`);
                return;
            }
        }

        const finalData = {
            ...formData,
            tenantId: currentUser?.tenantId || formData.tenantId,
            // ID é gerado no backend, aqui mantemos vazio ou o existente
            id: isEditing ? formData.id : ''
        };

        if (!finalData.tenantId) {
            alert('Sessão inválida. Faça login novamente.');
            return;
        }

        // Se for novo, ID deve ser string vazia para o backend entender que é criação? 
        // Na store, verificamos se começa com EQ- ou é vazio.
        // Se isEditing, mantemos o ID.

        await saveEquipment(finalData);
        router.push('/equipment');
    };

    const openDatePicker = (e: React.MouseEvent) => {
        const input = e.currentTarget.parentElement?.querySelector('input') as (HTMLInputElement & { showPicker?: () => void }) | null;
        if (!input || readOnly) return;

        try {
            if (typeof input.showPicker === "function") {
                input.showPicker();
            } else {
                input.focus();
            }
        } catch {
            input.focus();
        }
    };


    return (
        <div className="w-full max-w-[960px] mx-auto flex flex-col gap-6 pb-12">
            <nav className="flex items-center gap-2 text-sm">
                <Link href="/equipment" className="text-[#4c6c9a] dark:text-slate-400 hover:text-primary font-medium">Inventário</Link>
                <span className="material-symbols-outlined text-slate-400 text-xs">chevron_right</span>
                <span className="text-primary font-bold">{readOnly ? 'Detalhes' : isEditing ? 'Editar Equipamento' : 'Novo Equipamento'}</span>
            </nav>

            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {readOnly ? formData.name : isEditing ? `Editando: ${formData.name}` : 'Cadastro de Ativo de TI'}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Seção 1: Dados Gerais */}
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
                        <div>
                            <label className={labelClass}>Data de Cadastro</label>
                            <div className="relative group">
                                <input
                                    disabled={readOnly}
                                    type="date"
                                    value={formData.registrationDate}
                                    onChange={e => handleChange('registrationDate', e.target.value)}
                                    className={`${inputClass} pr-12 cursor-pointer focus:bg-white dark:focus:bg-slate-900 transition-colors`}
                                />
                                <button
                                    type="button"
                                    onClick={openDatePicker}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-all p-1 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                                >
                                    <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1">
                        <div>
                            <label className={labelClass}>Observações Gerais</label>
                            <textarea disabled={readOnly} value={formData.notes || ''} onChange={e => handleChange('notes', e.target.value)} className={`${inputClass} h-24 resize-none`} placeholder="Detalhes adicionais, histórico, etc..." />
                        </div>
                    </div>
                </div>

                {/* Seção 2: Específico (Condicional) */}
                {formData.type === 'VM' ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 space-y-8 animate-fadeIn">
                        <h2 className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
                            <span className="material-symbols-outlined text-primary">cloud</span>
                            Especificações de Virtualização
                        </h2>

                        {/* Sub-bloco: Infraestrutura */}
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

                        {/* Sub-bloco: Recursos Guest */}
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
                ) : (
                    // CAMPOS PARA HARDWARE FÍSICO
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
                            <div>
                                <label className={labelClass}>Data de Aquisição</label>
                                <div className="relative group">
                                    <input
                                        disabled={readOnly}
                                        type="date"
                                        value={formData.purchaseDate || ''}
                                        onChange={e => handleChange('purchaseDate', e.target.value)}
                                        className={`${inputClass} pr-12 cursor-pointer focus:bg-white dark:focus:bg-slate-900 transition-colors`}
                                    />
                                    <button
                                        type="button"
                                        onClick={openDatePicker}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-all p-1 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* New Provisioning Date Field */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Data de Provisionamento</label>
                                <div className="relative group">
                                    <input
                                        disabled={readOnly}
                                        type="date"
                                        value={formData.provisioningDate || ''}
                                        onChange={e => handleChange('provisioningDate', e.target.value)}
                                        className={`${inputClass} pr-12 cursor-pointer focus:bg-white dark:focus:bg-slate-900 transition-colors`}
                                    />
                                    <button
                                        type="button"
                                        onClick={openDatePicker}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-all p-1 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                                    </button>
                                </div>
                            </div>
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

                        {/* Extra Fields requested by user: host_id, hypervisor, v_cpu, v_ram, v_storage */}
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
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Link href="/equipment" className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center justify-center">
                        Cancelar
                    </Link>
                    {!readOnly && (
                        <button type="submit" className="px-10 py-3.5 text-sm font-black bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all active:scale-95">
                            {isEditing ? 'Atualizar Equipamento' : 'Cadastrar Equipamento'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default EquipmentForm;
