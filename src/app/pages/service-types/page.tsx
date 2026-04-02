'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ServiceType } from '@/types';
import { useApp } from '@/context/AppContext';
import StatCard from '@/components/composite/StatCard';
import PageHeader from '@/components/composite/PageHeader';
import ListToolbar from '@/components/composite/ListToolbar';
import DeleteWithReasonModal from '@/components/composite/DeleteWithReasonModal';
import { useDeleteModal } from '@/hooks/useDeleteModal';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';

const SERVICE_COLUMNS = [
    { id: 'image', label: 'Imagem' },
    { id: 'name', label: 'Nome' },
    { id: 'category', label: 'Categoria' },
    { id: 'description', label: 'Descrição' },
    { id: 'sla', label: 'SLA' },
    { id: 'template', label: 'Template' },
    { id: 'status', label: 'Status' },
    { id: 'actions', label: 'Ações' },
];

const CATEGORY_OPTIONS: ServiceType['category'][] = [
    'Suporte', 'Desenvolvimento', 'Consultoria', 'Infraestrutura', 'Implantação',
];

const getCategoryStyle = (category: string) => {
    const map: Record<string, string> = {
        'Suporte': 'bg-blue-50 text-blue-700 ring-blue-600/20',
        'Desenvolvimento': 'bg-purple-50 text-purple-700 ring-purple-600/20',
        'Implantação': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
        'Consultoria': 'bg-amber-50 text-amber-700 ring-amber-600/20',
    };
    return map[category] ?? 'bg-slate-50 text-slate-700 ring-slate-600/20';
};

export default function ServiceTypesPage() {
    const { implementationTemplates: availableTemplates, currentUser } = useApp();
    const { deleteModal, openDeleteModal, closeDeleteModal, setReason, isReasonValid } = useDeleteModal();
    const { visibleColumns, toggleColumn } = useColumnVisibility({
        image: true, name: true, category: true, description: true,
        sla: true, template: true, status: true, actions: true,
    });

    const [services, setServices] = useState<ServiceType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [formData, setFormData] = useState<Omit<ServiceType, 'id'>>({
        tenantId: '', name: '', description: '', defaultSla: 4,
        active: true, category: 'Suporte', image: '', linkedTemplateId: '',
    });

    const metrics = {
        total: services.length,
        active: services.filter(s => s.active).length,
        inactive: services.filter(s => !s.active).length,
        avgSla: services.length > 0 ? (services.reduce((acc, s) => acc + s.defaultSla, 0) / services.length).toFixed(1) : '0',
    };

    const metricCards = [
        { title: 'Total Registros', value: metrics.total, icon: 'list_alt', color: '#136dec' },
        { title: 'Ativos', value: metrics.active, icon: 'check_circle', color: '#10b981' },
        { title: 'Excluídos / Inativos', value: metrics.inactive, icon: 'cancel', color: '#ef4444' },
        { title: 'Média SLA', value: `${metrics.avgSla}h`, icon: 'timer', color: '#6366f1' },
    ];

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/service-types');
                if (!res.ok) throw new Error('Falha ao carregar.');
                const data = await res.json();
                setServices(Array.isArray(data) ? data : []);
            } catch {
                setLoadError('Não foi possível carregar os tipos de atendimento.');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const handleOpenModal = (service?: ServiceType, readOnly = false) => {
        setIsReadOnly(readOnly);
        if (service) {
            setEditingId(service.id);
            setFormData({
                tenantId: service.tenantId, name: service.name, description: service.description,
                defaultSla: service.defaultSla, active: service.active, category: service.category,
                image: service.image || '', linkedTemplateId: service.linkedTemplateId || '',
            });
        } else {
            setEditingId(null);
            setFormData({
                tenantId: currentUser?.tenantId || '', name: '', description: '',
                defaultSla: 4, active: true, category: 'Suporte', image: '', linkedTemplateId: '',
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly || !currentUser?.tenantId) { alert('Sessão inválida.'); return; }
        const tenantId = currentUser.tenantId;
        try {
            if (editingId) {
                const res = await fetch('/api/service-types', {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...formData, id: editingId, tenantId }),
                });
                if (!res.ok) throw new Error();
                setServices(prev => prev.map(s => s.id === editingId ? { ...formData, id: editingId, tenantId } : s));
            } else {
                const res = await fetch('/api/service-types', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...formData, tenantId }),
                });
                if (!res.ok) throw new Error();
                const created = await res.json();
                setServices(prev => [...prev, created]);
            }
            setIsModalOpen(false);
        } catch {
            alert('Erro ao salvar o tipo de atendimento.');
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteModal.itemId || !isReasonValid) return;
        try {
            const res = await fetch(`/api/service-types?id=${deleteModal.itemId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            setServices(prev => prev.map(s => s.id === deleteModal.itemId ? { ...s, active: false } : s));
            closeDeleteModal();
        } catch {
            alert('Erro ao desativar o tipo de atendimento.');
        }
    };

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fadeIn">
            <PageHeader title="Tipos de Atendimento" subtitle="Configure as categorias de tickets e seus SLAs padrão.">
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center rounded-2xl h-14 px-8 bg-primary text-white text-sm font-bold shadow-xl shadow-primary/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all gap-2 active:scale-95"
                >
                    <span className="material-symbols-outlined text-[24px]">add_circle</span>
                    Novo Tipo
                </button>
            </PageHeader>

            <div className="px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metricCards.map((card, idx) => (
                        <StatCard key={idx} title={card.title} value={card.value} icon={card.icon} color={card.color} index={idx} />
                    ))}
                </div>
            </div>

            <ListToolbar
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Buscar por nome ou categoria..."
                columns={SERVICE_COLUMNS}
                visibleColumns={visibleColumns}
                onToggleColumn={toggleColumn as (key: string) => void}
            />

            {/* Table */}
            <div className="px-4 overflow-x-auto pb-12">
                <div className="min-w-full inline-block align-middle">
                    <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                        <table className="w-full flex flex-col relative bg-white dark:bg-slate-900 text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-20 shadow-sm hidden md:flex w-full border-b border-slate-200 dark:border-slate-800">
                                <tr className="flex w-full items-center">
                                    {visibleColumns.image && <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 w-24 shrink-0">Capa</th>}
                                    {visibleColumns.name && <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 flex-[2]">Serviço</th>}
                                    {visibleColumns.category && <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 flex-1">Categoria</th>}
                                    {visibleColumns.description && <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 flex-[2]">Descrição</th>}
                                    {visibleColumns.sla && <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 flex-1 text-center">SLA</th>}
                                    {visibleColumns.template && <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 flex-[1.5]">Vínculo</th>}
                                    {visibleColumns.status && <th className="px-8 py-6 text-center text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 w-40 shrink-0">Status</th>}
                                    {visibleColumns.actions && <th className="px-8 py-6 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 w-32 shrink-0">Ações</th>}
                                </tr>
                            </thead>
                            <tbody className="flex flex-col w-full divide-y divide-slate-100 dark:divide-slate-800 relative">
                                {isLoading ? (
                                    <tr className="flex p-8 items-center justify-center">
                                        <td className="text-center text-slate-400 font-bold w-full">Carregando...</td>
                                    </tr>
                                ) : loadError ? (
                                    <tr className="flex p-8 items-center justify-center">
                                        <td className="text-center text-rose-500 font-bold w-full">{loadError}</td>
                                    </tr>
                                ) : filteredServices.length > 0 ? filteredServices.map(service => {
                                    const templateName = availableTemplates.find(t => t.id === service.linkedTemplateId)?.name;
                                    return (
                                        <tr key={service.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group ${!service.active ? 'opacity-60' : ''} flex flex-col md:flex-row items-start md:items-center border-b border-slate-100 dark:border-slate-800 p-4 md:p-0`}>
                                            {visibleColumns.image && (
                                                <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap w-full md:w-24 shrink-0 flex justify-center md:justify-start">
                                                    <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm transition-transform group-hover:scale-110">
                                                        {service.image ? (
                                                            <Image src={service.image} alt={service.name} className="h-full w-full object-cover" width={48} height={48} unoptimized />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-slate-400">
                                                                <span className="material-symbols-outlined text-lg">image</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.name && (
                                                <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap flex-[2] w-full md:w-auto">
                                                    <span className="text-base font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{service.name}</span>
                                                </td>
                                            )}
                                            {visibleColumns.category && (
                                                <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap flex-1 w-full md:w-auto">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[10px] font-black uppercase ring-1 ring-inset tracking-widest w-fit ${getCategoryStyle(service.category)}`}>
                                                        {service.category}
                                                    </span>
                                                </td>
                                            )}
                                            {visibleColumns.description && (
                                                <td className="px-0 md:px-8 py-2 md:py-[6px] text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate flex-[2] w-full md:w-auto">
                                                    {service.description}
                                                </td>
                                            )}
                                            {visibleColumns.sla && (
                                                <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap text-left md:text-center text-sm text-slate-900 dark:text-white font-mono font-bold flex-1 w-full md:w-auto">
                                                    {service.defaultSla}h
                                                </td>
                                            )}
                                            {visibleColumns.template && (
                                                <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 flex-[1.5] w-full md:w-auto">
                                                    {service.linkedTemplateId ? (
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                                                                <span className="material-symbols-outlined text-[16px]">verified</span>
                                                                <span className="font-black text-[10px] uppercase tracking-widest">Vinculado</span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-500 truncate max-w-[150px] font-bold" title={templateName}>
                                                                {templateName || 'Template ID: ' + service.linkedTemplateId}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs italic">Sem vínculo</span>
                                                    )}
                                                </td>
                                            )}
                                            {visibleColumns.status && (
                                                <td className="absolute top-4 right-4 md:static px-0 md:px-8 py-0 md:py-[6px] whitespace-nowrap text-center w-auto md:w-40 md:shrink-0 flex items-center justify-center">
                                                    <span className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset w-fit ${service.active ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-100 text-slate-600 ring-slate-600/20'}`}>
                                                        <span className={`w-2 h-2 rounded-full ${service.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                        {service.active ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </td>
                                            )}
                                            {visibleColumns.actions && (
                                                <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap text-right w-full md:w-32 md:shrink-0 flex items-center justify-end">
                                                    <div className="flex items-center justify-end gap-1 w-full">
                                                        <button onClick={() => handleOpenModal(service, true)} className="p-2 text-slate-400 hover:text-primary transition-colors" title="Visualizar">
                                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                        </button>
                                                        <button onClick={() => handleOpenModal(service, false)} disabled={!service.active} className="p-2 text-slate-400 hover:text-amber-500 transition-colors disabled:opacity-30" title="Editar">
                                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                                        </button>
                                                        <button onClick={() => openDeleteModal(service.id, service.name)} disabled={!service.active} className="p-2 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-30" title="Excluir">
                                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                }) : (
                                    <tr className="flex p-8 items-center justify-center">
                                        <td className="text-center text-slate-400 font-bold w-full">Nenhum tipo de serviço encontrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-dropIn">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {isReadOnly ? 'Detalhes do Serviço' : (editingId ? 'Editar Tipo' : 'Novo Tipo')}
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configuração de categoria e SLA</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="material-symbols-outlined text-[24px]">close</span>
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Nome do Atendimento</label>
                                <input disabled={isReadOnly} type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 outline-none text-base font-bold transition-all focus:ring-4 focus:ring-primary/10" placeholder="Ex: Suporte N1" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Categoria</label>
                                    <select disabled={isReadOnly} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as ServiceType['category'] })} className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 outline-none appearance-none custom-select-arrow text-sm font-bold">
                                        {CATEGORY_OPTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-1 block">SLA (Horas)</label>
                                    <input disabled={isReadOnly} type="number" value={formData.defaultSla} onChange={e => setFormData({ ...formData, defaultSla: parseInt(e.target.value, 10) || 0 })} className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 outline-none text-base font-bold" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Vínculo de Implantação (Checklist)</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">checklist</span>
                                    <select disabled={isReadOnly} value={formData.linkedTemplateId} onChange={e => setFormData({ ...formData, linkedTemplateId: e.target.value })} className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-14 pr-5 py-4 outline-none appearance-none custom-select-arrow text-sm font-bold">
                                        <option value="">Nenhum vínculo (Padrão)</option>
                                        {availableTemplates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.systemType})</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Descrição do Tipo</label>
                                <textarea disabled={isReadOnly} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full h-32 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 outline-none text-sm font-medium resize-none" placeholder="Instruções para a equipe técnica..." />
                            </div>
                        </div>
                        <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
                            <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all">{isReadOnly ? 'Fechar' : 'Cancelar'}</button>
                            {!isReadOnly && <button onClick={handleSave} className="px-10 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all active:scale-95">Salvar Registro</button>}
                        </div>
                    </div>
                </div>
            )}

            <DeleteWithReasonModal
                isOpen={deleteModal.isOpen}
                itemName={deleteModal.itemName}
                reason={deleteModal.reason}
                onReasonChange={setReason}
                onCancel={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                title="Inativar Serviço"
                message="O serviço será movido para os inativos:"
                icon="delete_forever"
            />
        </div>
    );
}
