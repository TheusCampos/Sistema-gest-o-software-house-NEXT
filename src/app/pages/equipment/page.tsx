'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Equipment, EquipmentType } from '@/types';
import StatCard from '@/components/composite/StatCard';

export default function EquipmentPage() {
    // Lista de equipamentos + action de persistência vêm do Context
    const { equipmentList, fetchEquipment, removeEquipment, currentUser } = useApp();

    React.useEffect(() => {
        if (!currentUser?.tenantId) return;
        fetchEquipment(currentUser.tenantId);
    }, [currentUser, fetchEquipment]);

    const role = currentUser?.role?.toLowerCase();
    const isAdmin = role === 'admin' || role === 'desenvolvedor';
    const canView = isAdmin || currentUser?.permissions?.equipment?.view;
    const canCreate = isAdmin || currentUser?.permissions?.equipment?.create;
    const canEdit = isAdmin || currentUser?.permissions?.equipment?.edit;
    const canDelete = isAdmin || currentUser?.permissions?.equipment?.delete;

    // Busca textual (nome, responsável, id)
    const [searchTerm, setSearchTerm] = useState('');
    // Filtro por tipo de ativo (Desktop/Notebook/Server/VM)
    const [typeFilter, setTypeFilter] = useState<EquipmentType | 'All'>('All');

    // Controle de visibilidade das colunas
    const [visibleColumns, setVisibleColumns] = useState({
        name: true,
        type: true,
        spec: true,
        location: true,
        status: true,
        actions: true
    });
    // Abre/fecha menu de colunas
    const [showColumnMenu, setShowColumnMenu] = useState(false);

    // Modal de descarte (tratado como "exclusão" aqui): status=Descartado e active=false
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; name: string; reason: string }>({
        isOpen: false,
        id: null,
        name: '',
        reason: ''
    });

    // Métricas exibidas nos cards do topo
    const metrics = {
        total: equipmentList.length,
        active: equipmentList.filter(e => e.active && e.status === 'Ativo').length,
        maintenance: equipmentList.filter(e => e.active && e.status === 'Em Manutenção').length,
        discarded: equipmentList.filter(e => !e.active || e.status === 'Descartado').length
    };

    const metricCards = [
        { title: 'Total Registros', value: metrics.total, icon: 'inventory_2', color: '#136dec' },
        { title: 'Ativos', value: metrics.active, icon: 'verified', color: '#10b981' },
        { title: 'Em Manutenção', value: metrics.maintenance, icon: 'build', color: '#f59e0b' },
        { title: 'Descartados', value: metrics.discarded, icon: 'delete_forever', color: '#ef4444' }
    ];

    // Abre modal de descarte para um item do inventário
    const handleDeleteClick = (item: Equipment) => {
        setDeleteModal({
            isOpen: true,
            id: item.id,
            name: item.name,
            reason: ''
        });
    };

    // Confirma descarte: marca como "Descartado" e remove do inventário ativo
    const confirmDelete = async () => {
        if (deleteModal.id && deleteModal.reason.trim().length >= 10) {
            try {
                // Remove logicamente (DELETE na API faz update active=false)
                await removeEquipment(deleteModal.id);
            } catch {
                alert('Erro ao excluir equipamento');
            }
            setDeleteModal({ isOpen: false, id: null, name: '', reason: '' });
        }
    };

    // Filtra apenas itens ativos, aplica filtro por tipo e busca textual
    const filteredEquipment = equipmentList.filter(item =>
        item.active &&
        (typeFilter === 'All' || item.type === typeFilter) &&
        (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.responsible.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.includes(searchTerm))
    );

    // Ícone exibido na coluna "Tipo" conforme o tipo de ativo
    const getTypeIcon = (type: EquipmentType) => {
        switch (type) {
            case 'Desktop': return 'desktop_windows';
            case 'Server': return 'dns';
            case 'Notebook': return 'laptop_chromebook';
            case 'VM': return 'cloud_queue';
            default: return 'devices';
        }
    };

    // Badge de status (cores) conforme status operacional do equipamento
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Ativo': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
            case 'Inativo': return 'bg-slate-100 text-slate-600 ring-slate-500/20';
            case 'Em Manutenção': return 'bg-amber-50 text-amber-700 ring-amber-600/20';
            case 'Descartado': return 'bg-rose-50 text-rose-700 ring-rose-600/20';
            default: return 'bg-slate-50 text-slate-700 ring-slate-600/20';
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-wrap justify-between items-end gap-3 px-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Inventário de TI</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base font-medium">Gerenciamento centralizado de hardware e máquinas virtuais.</p>
                </div>
                {canCreate && (
                    <Link href="/equipment/new" className="flex items-center justify-center rounded-xl h-12 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all gap-2 active:scale-95">
                        <span className="material-symbols-outlined">add_to_queue</span>
                        Cadastrar Equipamento
                    </Link>
                )}
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
                <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex-1 min-w-[300px] relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                            placeholder="Buscar por nome, responsável ou ID..."
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 relative">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as EquipmentType | 'All')}
                            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 outline-none focus:ring-4 focus:ring-primary/5 transition-all appearance-none custom-select-arrow pr-12"
                        >
                            <option value="All">Todos os Tipos</option>
                            <option value="Desktop">Desktops</option>
                            <option value="Notebook">Notebooks</option>
                            <option value="Server">Servidores Físicos</option>
                            <option value="VM">Máquinas Virtuais</option>
                        </select>

                        <button onClick={() => setShowColumnMenu(!showColumnMenu)} className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold border transition-all ${showColumnMenu ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                            <span className="material-symbols-outlined">view_column</span>
                            Colunas
                        </button>
                        {showColumnMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowColumnMenu(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-20 p-3 animate-fadeIn">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Exibir Colunas</p>
                                    {Object.keys(visibleColumns).map(col => (
                                        <label key={col} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors group">
                                            <input type="checkbox" checked={visibleColumns[col as keyof typeof visibleColumns]} onChange={() => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col as keyof typeof visibleColumns] }))} className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary" />
                                            <span className="text-sm font-semibold capitalize text-slate-700 dark:text-slate-300">{col}</span>
                                        </label>
                                    ))}
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
                                    {visibleColumns.name && <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 flex-[2]">Identificação</th>}
                                    {visibleColumns.type && <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 w-32 shrink-0">Tipo</th>}
                                    {visibleColumns.spec && <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 flex-[2]">Especificações</th>}
                                    {visibleColumns.location && <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 flex-1">Local / Host</th>}
                                    {visibleColumns.status && <th className="px-8 py-6 text-center text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 w-40 shrink-0">Status</th>}
                                    {visibleColumns.actions && <th className="px-8 py-6 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 w-32 shrink-0">Ações</th>}
                                </tr>
                            </thead>
                            <tbody className="flex flex-col w-full divide-y divide-slate-100 dark:divide-slate-800 relative">
                                {filteredEquipment.length > 0 ? filteredEquipment.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group flex flex-col md:flex-row items-start md:items-center border-b border-slate-100 dark:border-slate-800 p-4 md:p-0">
                                        {visibleColumns.name && (
                                            <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap flex-[2] w-full md:w-auto">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors">{item.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono mt-1">ID: {item.id}</span>
                                                    <span className="text-[10px] text-slate-500 font-medium">Resp: {item.responsible}</span>
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.type && (
                                            <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap w-full md:w-32 md:shrink-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-slate-400 text-lg">{getTypeIcon(item.type)}</span>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.type}</span>
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.spec && (
                                            <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap flex-[2] w-full md:w-auto">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Especificações</span>
                                                    {item.type === 'VM' ? (
                                                        <>
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.vCpu} vCPU • {item.vRam} RAM</span>
                                                            <span className="text-[10px] text-slate-500">{item.os || item.hypervisor}</span>
                                                            {item.ipAddress && (
                                                                <div className="flex items-center gap-1 mt-0.5">
                                                                    <span className="text-[10px] font-mono text-slate-400">{item.ipAddress}</span>
                                                                    {item.port && <span className="text-[10px] font-mono text-slate-400">: {item.port}</span>}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.model || 'Genérico'}</span>
                                                            <span className="text-[10px] text-slate-500">{item.processor} • {item.ram}</span>
                                                            {item.ipAddress && <span className="text-[10px] font-mono text-slate-400 block">{item.ipAddress}</span>}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.location && (
                                            <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 flex-1 w-full md:w-auto">
                                                <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Localização</span>
                                                {item.type === 'VM' ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] uppercase font-black text-slate-400 hidden md:block">Host Físico</span>
                                                        <Link href={`/equipment/${item.hostId}`} className="font-bold text-primary cursor-pointer hover:underline" title="Ver Host">
                                                            {equipmentList.find(e => e.id === item.hostId)?.name || 'Host Desconhecido'}
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[16px] text-slate-400">location_on</span>
                                                        <span>{item.location}</span>
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                        {visibleColumns.status && (
                                            <td className="absolute top-4 right-4 md:static px-0 md:px-8 py-0 md:py-[6px] whitespace-nowrap text-center w-auto md:w-40 md:shrink-0 flex items-center justify-center">
                                                <span className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${getStatusColor(item.status)}`}>
                                                    <span className={`w-2 h-2 rounded-full ${item.status === 'Ativo' ? 'bg-emerald-500' : item.status === 'Inativo' ? 'bg-slate-500' : 'bg-rose-500'}`}></span>
                                                    {item.status}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.actions && (
                                            <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap text-right w-full md:w-32 md:shrink-0 flex items-center justify-end">
                                                <div className="flex items-center justify-end gap-1 w-full">
                                                    {canView && (
                                                        <Link href={`/equipment/${item.id}?readOnly=true`} className="p-2 text-slate-400 hover:text-primary transition-colors" title="Visualizar">
                                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                        </Link>
                                                    )}
                                                    {canEdit && (
                                                        <Link href={`/equipment/${item.id}`} className="p-2 text-slate-400 hover:text-amber-500 transition-colors" title="Editar">
                                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                                        </Link>
                                                    )}
                                                    {canDelete && (
                                                        <button onClick={() => handleDeleteClick(item)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors" title="Excluir">
                                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-12 text-center text-slate-500 font-medium">Nenhum equipamento encontrado com os filtros atuais.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-160 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 rounded-4xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-dropIn">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Descartar Equipamento</h3>
                                <p className="text-[10px] text-slate-400 uppercase font-black mt-1 tracking-widest">Ação de inventário</p>
                            </div>
                            <button
                                onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl"
                            >
                                <span className="material-symbols-outlined text-[24px]">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center ring-4 ring-rose-50 dark:ring-rose-900/10">
                                    <span className="material-symbols-outlined text-4xl text-rose-600 dark:text-rose-400 filled">delete_forever</span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 font-medium">
                                    Você está prestes a remover o equipamento <br /><strong className="text-slate-900 dark:text-white">{deleteModal.name}</strong> do inventário ativo.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                    Motivo do Descarte <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={deleteModal.reason}
                                    onChange={(e) => setDeleteModal({ ...deleteModal, reason: e.target.value })}
                                    className="w-full h-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/50 resize-none transition-all"
                                    placeholder="Ex: Obsolescência, defeito irreparável, venda..."
                                />
                                <div className="flex justify-end">
                                    <p className={`text-[10px] font-bold ${deleteModal.reason.trim().length >= 10 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        {deleteModal.reason.trim().length}/10 caracteres
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                            <button
                                onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                                className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                disabled={deleteModal.reason.trim().length < 10}
                                onClick={confirmDelete}
                                className="flex-2 py-3 bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-rose-600/30 hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <span>Confirmar Descarte</span>
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
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
