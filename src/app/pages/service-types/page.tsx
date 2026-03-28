'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ServiceType } from '@/types';
import { useApp } from '@/context/AppContext';
import StatCard from '@/components/composite/StatCard';

export default function ServiceTypesPage() {
    // Templates de implantação disponíveis (para vincular um serviço a um roteiro)
    const { implementationTemplates: availableTemplates, currentUser } = useApp();
    // Lista local de serviços
    const [services, setServices] = useState<ServiceType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    // Busca por nome/categoria
    const [searchTerm, setSearchTerm] = useState('');
    // Modal de criar/editar/visualizar
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Controle de colunas visíveis na tabela
    const [visibleColumns, setVisibleColumns] = useState({
        image: true,
        name: true,
        category: true,
        description: true,
        sla: true,
        template: true,
        status: true,
        actions: true
    });
    const [showColumnMenu, setShowColumnMenu] = useState(false);

    // ID do serviço em edição (quando não nulo)
    const [editingId, setEditingId] = useState<string | null>(null);
    // Quando true, abre modal em modo somente leitura
    const [isReadOnly, setIsReadOnly] = useState(false);

    // Estado do formulário do serviço (sem o id)
    const [formData, setFormData] = useState<Omit<ServiceType, 'id'>>({
        tenantId: '',
        name: '',
        description: '',
        defaultSla: 4,
        active: true,
        category: 'Suporte',
        image: '',
        linkedTemplateId: ''
    });

    // Modal de exclusão lógica: marca active=false
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; serviceId: string | null; serviceName: string; reason: string }>({
        isOpen: false,
        serviceId: null,
        serviceName: '',
        reason: ''
    });

    // Métricas exibidas nos cards do topo
    const metrics = {
        total: services.length,
        active: services.filter(s => s.active).length,
        inactive: services.filter(s => !s.active).length,
        avgSla: services.length > 0 ? (services.reduce((acc, s) => acc + s.defaultSla, 0) / services.length).toFixed(1) : '0'
    };

    const metricCards = [
        { title: 'Total Registros', value: metrics.total, icon: 'list_alt', color: '#136dec' },
        { title: 'Ativos', value: metrics.active, icon: 'check_circle', color: '#10b981' },
        { title: 'Excluídos / Inativos', value: metrics.inactive, icon: 'cancel', color: '#ef4444' },
        { title: 'Média SLA', value: `${metrics.avgSla}h`, icon: 'timer', color: '#6366f1' }
    ];

    const categoryOptions: ServiceType['category'][] = [
        'Suporte',
        'Desenvolvimento',
        'Consultoria',
        'Infraestrutura',
        'Implantação'
    ];

    const toggleColumn = (column: keyof typeof visibleColumns) => {
        setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
    };

    useEffect(() => {
        const loadServiceTypes = async () => {
            try {
                const response = await fetch('/api/service-types');
                if (!response.ok) {
                    throw new Error('Falha ao carregar tipos de atendimento.');
                }
                const data = await response.json();
                setServices(Array.isArray(data) ? data : []);
                setLoadError('');
            } catch (error) {
                console.error('Erro ao carregar tipos de atendimento:', error);
                setServices([]);
                setLoadError('Não foi possível carregar os tipos de atendimento.');
            } finally {
                setIsLoading(false);
            }
        };

        loadServiceTypes();
    }, []);

    // Abre o modal para criar, editar ou visualizar um tipo de atendimento
    const handleOpenModal = (service?: ServiceType, readOnly: boolean = false) => {
        setIsReadOnly(readOnly);
        if (service) {
            setEditingId(service.id);
            setFormData({
                tenantId: service.tenantId,
                name: service.name,
                description: service.description,
                defaultSla: service.defaultSla,
                active: service.active,
                category: service.category,
                image: service.image || '',
                linkedTemplateId: service.linkedTemplateId || ''
            });
        } else {
            setEditingId(null);
            setFormData({
                tenantId: currentUser?.tenantId || '',
                name: '',
                description: '',
                defaultSla: 4,
                active: true,
                category: 'Suporte',
                image: '',
                linkedTemplateId: ''
            });
        }
        setIsModalOpen(true);
    };

    // Salva (cria/atualiza) o serviço via API
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;

        try {
            if (!currentUser?.tenantId) {
                alert('Sessão inválida. Faça login novamente.');
                return;
            }
            const tenantId = currentUser.tenantId;

            if (editingId) {
                const response = await fetch('/api/service-types', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...formData, id: editingId, tenantId })
                });
                if (!response.ok) throw new Error('Falha ao atualizar.');
                setServices(prev => prev.map(s => s.id === editingId ? { ...formData, id: editingId, tenantId } : s));
            } else {
                const response = await fetch('/api/service-types', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...formData, tenantId })
                });
                if (!response.ok) throw new Error('Falha ao criar.');
                const created = await response.json();
                setServices(prev => [...prev, created]);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar o tipo de atendimento.');
        }
    };

    // Abre modal de exclusão lógica
    const handleDeleteClick = (service: ServiceType) => {
        setDeleteModal({
            isOpen: true,
            serviceId: service.id,
            serviceName: service.name,
            reason: ''
        });
    };

    // Confirma exclusão lógica (active=false) via API quando motivo tem tamanho mínimo
    const confirmDelete = async () => {
        if (deleteModal.serviceId && deleteModal.reason.trim().length >= 10) {
            try {
                const response = await fetch(`/api/service-types?id=${deleteModal.serviceId}`, {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error('Falha ao desativar.');
                setServices(prev => prev.map(s =>
                    s.id === deleteModal.serviceId ? { ...s, active: false } : s
                ));
                setDeleteModal({ isOpen: false, serviceId: null, serviceName: '', reason: '' });
            } catch (error) {
                console.error('Erro ao desativar:', error);
                alert('Erro ao desativar o tipo de atendimento.');
            }
        }
    };

    // Filtro por busca
    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getCategoryStyle = (category: string) => {
        switch (category) {
            case 'Suporte': return 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-300 border-blue-100 dark:border-blue-800';
            case 'Desenvolvimento': return 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-900/20 dark:text-purple-300 border-purple-100 dark:border-purple-800';
            case 'Implantação': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800';
            case 'Consultoria': return 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-300 border-amber-100 dark:border-amber-800';
            default: return 'bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-wrap justify-between items-end gap-3 px-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Tipos de Atendimento</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base font-medium">Configure as categorias de tickets e seus SLAs padrão.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center rounded-2xl h-14 px-8 bg-primary text-white text-sm font-bold shadow-xl shadow-primary/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all gap-2 active:scale-95"
                >
                    <span className="material-symbols-outlined text-[24px]">add_circle</span>
                    Novo Tipo
                </button>
            </div>

            <div className="px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metricCards.map((card, idx) => (
                        <StatCard 
                            key={idx} 
                            title={card.title} 
                            value={card.value} 
                            icon={card.icon} 
                            color={card.color} 
                            index={idx}
                        />
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-2 px-4">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4 shadow-xl">
                    <div className="relative flex-1 w-full">
                        <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none text-base font-medium"
                            placeholder="Buscar por nome ou categoria..."
                            type="text"
                        />
                    </div>
                    <div className="flex gap-2 relative w-full md:w-auto">
                        <button
                            onClick={() => setShowColumnMenu(!showColumnMenu)}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold border transition-all ${showColumnMenu ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">view_column</span>
                            Colunas
                        </button>

                        {showColumnMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowColumnMenu(false)}></div>
                                <div className="absolute right-0 top-full mt-4 w-64 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-30 p-4 animate-fadeIn">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Exibir Colunas</p>
                                    <div className="space-y-1">
                                        {[
                                            { id: 'image', label: 'Imagem' },
                                            { id: 'name', label: 'Nome' },
                                            { id: 'category', label: 'Categoria' },
                                            { id: 'description', label: 'Descrição' },
                                            { id: 'sla', label: 'SLA' },
                                            { id: 'template', label: 'Template' },
                                            { id: 'status', label: 'Status' },
                                            { id: 'actions', label: 'Ações' }
                                        ].map((col) => (
                                            <label key={col.id} className="flex items-center gap-4 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors group">
                                                <input
                                                    type="checkbox"
                                                    checked={visibleColumns[col.id as keyof typeof visibleColumns]}
                                                    onChange={() => toggleColumn(col.id as keyof typeof visibleColumns)}
                                                    className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary transition-all"
                                                />
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">{col.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

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
                                        <td className="text-center text-slate-400 font-bold w-full">
                                            Carregando tipos de atendimento...
                                        </td>
                                    </tr>
                                ) : loadError ? (
                                    <tr className="flex p-8 items-center justify-center">
                                        <td className="text-center text-rose-500 font-bold w-full">
                                            {loadError}
                                        </td>
                                    </tr>
                                ) : filteredServices.length > 0 ? filteredServices.map((service) => {
                                    const templateName = availableTemplates.find(t => t.id === service.linkedTemplateId)?.name;

                                    return (
                                        <tr key={service.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group ${!service.active ? 'opacity-60' : ''} flex flex-col md:flex-row items-start md:items-center border-b border-slate-100 dark:border-slate-800 p-4 md:p-0`}>
                                            {visibleColumns.image && (
                                                <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap w-full md:w-24 shrink-0 flex justify-center md:justify-start">
                                                    <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm transition-transform group-hover:scale-110">
                                                        {service.image ? (
                                                            <Image
                                                                src={service.image}
                                                                alt={service.name}
                                                                className="h-full w-full object-cover"
                                                                width={48}
                                                                height={48}
                                                                unoptimized
                                                            />
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
                                                                <span className="material-symbols-outlined text-[16px] filled">verified</span>
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
                                                        <span className={`w-2 h-2 rounded-full ${service.active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
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
                                                        <button onClick={() => handleDeleteClick(service)} disabled={!service.active} className="p-2 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-30" title="Excluir">
                                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    )
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
                                <input
                                    disabled={isReadOnly}
                                    type="text"
                                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 outline-none text-base font-bold transition-all focus:ring-4 focus:ring-primary/10"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Suporte N1"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Categoria</label>
                                    <select
                                        disabled={isReadOnly}
                                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 outline-none appearance-none custom-select-arrow text-sm font-bold"
                                        value={formData.category}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            category: e.target.value as ServiceType['category']
                                        })}
                                    >
                                        {categoryOptions.map((category) => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-1 block">SLA (Horas)</label>
                                    <input
                                        disabled={isReadOnly}
                                        type="number"
                                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 outline-none text-base font-bold"
                                        value={formData.defaultSla}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            defaultSla: parseInt(e.target.value, 10) || 0
                                        })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Vínculo de Implantação (Checklist)</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">checklist</span>
                                    <select
                                        disabled={isReadOnly}
                                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-14 pr-5 py-4 outline-none appearance-none custom-select-arrow text-sm font-bold"
                                        value={formData.linkedTemplateId}
                                        onChange={(e) => setFormData({ ...formData, linkedTemplateId: e.target.value })}
                                    >
                                        <option value="">Nenhum vínculo (Padrão)</option>
                                        {availableTemplates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name} ({t.systemType})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Descrição do Tipo</label>
                                <textarea
                                    disabled={isReadOnly}
                                    className="w-full h-32 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 outline-none text-sm font-medium resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Instruções para a equipe técnica sobre este tipo de chamado..."
                                />
                            </div>
                        </div>
                        <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
                            <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all">{isReadOnly ? 'Fechar' : 'Cancelar'}</button>
                            {!isReadOnly && <button onClick={handleSave} className="px-10 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all active:scale-95">Salvar Registro</button>}
                        </div>
                    </div>
                </div>
            )}

            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-dropIn">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Inativar Serviço</h3>
                                <p className="text-[10px] text-slate-400 uppercase font-black mt-1 tracking-widest">Protocolo de desativação</p>
                            </div>
                            <button onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="material-symbols-outlined text-[24px]">close</span>
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center ring-4 ring-rose-50 dark:ring-rose-900/10">
                                    <span className="material-symbols-outlined text-4xl text-rose-600 dark:text-rose-400 filled">delete_forever</span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 font-medium">
                                    O serviço <strong className="text-slate-900 dark:text-white">{deleteModal.serviceName}</strong> será movido para os inativos.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Motivo da Exclusão <span className="text-rose-500">*</span></label>
                                <textarea
                                    value={deleteModal.reason}
                                    onChange={(e) => setDeleteModal({ ...deleteModal, reason: e.target.value })}
                                    className="w-full h-24 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 text-sm font-medium outline-none focus:ring-4 focus:ring-rose-500/10 resize-none transition-all shadow-inner"
                                    placeholder="Justifique por que este serviço não será mais oferecido..."
                                />
                                <div className="flex justify-end"><p className={`text-[10px] font-bold ${deleteModal.reason.trim().length >= 10 ? 'text-emerald-500' : 'text-slate-400'}`}>{deleteModal.reason.trim().length}/10</p></div>
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                            <button onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all">Cancelar</button>
                            <button disabled={deleteModal.reason.trim().length < 10} onClick={confirmDelete} className="flex-[2] py-4 bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-rose-600/30 hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"><span>Confirmar</span><span className="material-symbols-outlined text-[18px]">delete</span></button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dropIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-dropIn { animation: dropIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
        </div>
    );
}
