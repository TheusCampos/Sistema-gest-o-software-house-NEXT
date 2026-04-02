'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Equipment, EquipmentType, EquipmentStatus } from '@/types';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EquipmentBasicSection } from './equipment/EquipmentBasicSection';
import { EquipmentVMSection } from './equipment/EquipmentVMSection';
import { EquipmentHardwareSection } from './equipment/EquipmentHardwareSection';

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
                <EquipmentBasicSection formData={formData} handleChange={handleChange} readOnly={readOnly} />

                {formData.type === 'VM' ? (
                    <EquipmentVMSection formData={formData} handleChange={handleChange} availableHosts={availableHosts} readOnly={readOnly} />
                ) : (
                    <EquipmentHardwareSection formData={formData} handleChange={handleChange} availableHosts={availableHosts} readOnly={readOnly} />
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
