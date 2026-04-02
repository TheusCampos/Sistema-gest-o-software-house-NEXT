'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useClientsStore } from '@/stores/clientsStore';
import { useEquipmentStore } from '@/stores/equipmentStore';
import { clientPayloadSchema } from '@/schemas/client.schema';
import type {
    Client,
    ClientGeneralInfo,
    ClientAddressInfo,
    ClientContractInfo,
    ClientModulesInfo,
    ClientStatusInfo
} from '@/types';
import { defaultContractInfo, defaultModulesInfo, defaultStatusInfo } from '@/types';

import { ClientBasicForm } from './clients/ClientBasicForm';
import { ClientContractForm } from './clients/ClientContractForm';
import { ClientModulesForm } from './clients/ClientModulesForm';
import { ClientStatusForm } from './clients/ClientStatusForm';

interface ClientFormProps {
    clientId?: string | null;
    readOnly?: boolean;
}

type TabType = 'Dados Básicos' | 'Contrato' | 'Módulos' | 'Status';
const TABS: TabType[] = ['Dados Básicos', 'Contrato', 'Módulos', 'Status'];

export default function ClientForm({ clientId, readOnly = false }: ClientFormProps) {
    const { currentUser, saveClient } = useApp();
    const loadClientDetail = useClientsStore(s => s.loadClientDetail);
    const { equipmentList, fetchEquipment } = useEquipmentStore();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<TabType>('Dados Básicos');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const isEditing = !!clientId;

    const [generalData, setGeneralData] = useState<ClientGeneralInfo>({
        razao: '', fantasia: '', tipoPessoa: 'Juridica', documento: '',
        inscricaoEstadualRg: '', dataAbertura: '', email: '',
        telefone1: '', telefone2: '', homePage: '', contatoResponsavel: ''
    });

    const [addressData, setAddressData] = useState<ClientAddressInfo>({
        cep: '', logradouro: '', numero: '', complemento: '',
        bairro: '', cidade: '', uf: ''
    });

    const [contractData, setContractData] = useState<ClientContractInfo>({ ...defaultContractInfo });
    const [modulesData, setModulesData] = useState<ClientModulesInfo>({ ...defaultModulesInfo });
    const [statusData, setStatusData] = useState<ClientStatusInfo>({ ...defaultStatusInfo });

    useEffect(() => {
        if (currentUser?.tenantId) {
            fetchEquipment(currentUser.tenantId);
        }
    }, [currentUser, fetchEquipment]);

    useEffect(() => {
        async function fetchDetail() {
            if (!clientId) return;
            setLoading(true);
            const detail = await loadClientDetail(clientId);
            if (detail) {
                setGeneralData(detail.general);
                setAddressData(detail.address);
                setContractData({ ...defaultContractInfo, ...detail.contract });
                setModulesData({ ...defaultModulesInfo, ...detail.modules });
                setStatusData({ ...defaultStatusInfo, ...detail.status });
            }
            setLoading(false);
        }
        fetchDetail();
    }, [clientId, loadClientDetail]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) return;

        setErrorMsg('');
        const id = isEditing && clientId ? clientId : undefined;

        const payload = {
            id,
            active: true,
            general: generalData,
            address: addressData,
            contract: contractData,
            modules: modulesData,
            status: statusData
        };

        // Zod Validation
        const result = clientPayloadSchema.safeParse(payload);
        if (!result.success) {
            console.error(result.error);
            const firstError = result.error.issues[0]?.message;
            setErrorMsg(`Erro de validação: ${firstError}`);
            return;
        }

        try {
            setLoading(true);
            // O saveClient aguarda um Client formatado
            const clientObj: Client = {
                ...result.data,
                id: id || `temporary-id-${Date.now()}`,
                tenantId: currentUser?.tenantId || '',
            };

            await saveClient(clientObj);
            router.push('/clients');
        } catch (error: any) {
            console.error("Failed to save client:", error);
            const data = error.response?.data;
            const apiMessage = data?.message || error.message || "Falha ao salvar.";
            const detail = data?.detail ? `\nDetalhe: ${data.detail}` : "";
            const hint = data?.hint ? `\nDica: ${data.hint}` : "";
            
            setErrorMsg(`Erro ao salvar cliente: ${apiMessage}${detail}${hint}`);
        } finally {
            setLoading(false);
        }
    };

    const tabClass = (tab: TabType) =>
        `px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === tab
            ? 'border-primary text-primary'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        }`;

    const renderTabIcon = (tab: TabType) => {
        switch (tab) {
            case 'Dados Básicos': return 'domain';
            case 'Contrato': return 'description';
            case 'Módulos': return 'extension';
            case 'Status': return 'flag';
            default: return 'circle';
        }
    };

    return (
        <div className="w-full max-w-[1000px] mx-auto flex flex-col gap-6 animate-fadeIn">
            <nav className="flex items-center gap-2 text-sm px-2">
                <Link href="/dashboard" className="text-[#4c6c9a] dark:text-slate-400 hover:text-primary font-medium">Dashboard</Link>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <Link href="/clients" className="text-[#4c6c9a] dark:text-slate-400 hover:text-primary font-medium">Clientes</Link>
                <span className="text-primary font-bold">/ {isEditing ? (readOnly ? 'Visualizar' : 'Editar') : 'Novo'}</span>
            </nav>

            {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-3">
                    <span className="material-symbols-outlined">error</span>
                    <span>{errorMsg}</span>
                </div>
            )}

            {loading && !isEditing ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-[#e7ecf3] dark:border-slate-800 overflow-hidden">
                    <div className="flex items-center border-b border-[#e7ecf3] dark:border-slate-800 px-6 pt-2 overflow-x-auto">
                        {TABS.map(tab => (
                            <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={tabClass(tab)}>
                                <span className="material-symbols-outlined text-[20px]">{renderTabIcon(tab)}</span> {tab}
                            </button>
                        ))}
                    </div>

                    <form className="p-8 min-h-[400px]" onSubmit={handleSave}>
                        <div className={activeTab === 'Dados Básicos' ? 'block' : 'hidden'}>
                            <ClientBasicForm
                                data={generalData}
                                address={addressData}
                                onChangeGeneral={(key, val) => setGeneralData(prev => ({ ...prev, [key]: val }))}
                                onChangeAddress={(key, val) => setAddressData(prev => ({ ...prev, [key]: val }))}
                                readOnly={readOnly || loading}
                                equipmentList={equipmentList}
                            />
                        </div>

                        <div className={activeTab === 'Contrato' ? 'block' : 'hidden'}>
                            <ClientContractForm
                                data={contractData}
                                onChange={(key, val) => setContractData(prev => ({ ...prev, [key]: val }))}
                                readOnly={readOnly || loading}
                                clientId={clientId}
                            />
                        </div>

                        <div className={activeTab === 'Módulos' ? 'block' : 'hidden'}>
                            <ClientModulesForm
                                data={modulesData}
                                onChange={(key, val) => setModulesData(prev => ({ ...prev, [key]: val }))}
                                readOnly={readOnly || loading}
                            />
                        </div>

                        <div className={activeTab === 'Status' ? 'block' : 'hidden'}>
                            <ClientStatusForm
                                data={statusData}
                                onChange={(key, val) => setStatusData(prev => ({ ...prev, [key]: val }))}
                                readOnly={readOnly || loading}
                            />
                        </div>

                        <div className="mt-8 pt-6 border-t border-[#e7ecf3] dark:border-slate-800 flex justify-end gap-4">
                            <Link href="/clients" className="px-6 py-2 text-slate-500 font-bold flex items-center justify-center hover:bg-slate-50 rounded-lg">
                                Voltar
                            </Link>
                            {!readOnly && (
                                <button type="submit" disabled={loading} className="px-8 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                    {loading && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
                                    Salvar Cliente
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
