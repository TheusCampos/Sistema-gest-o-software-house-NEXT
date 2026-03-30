'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useApp } from '@/context/AppContext';
import { useVirtualizer } from '@tanstack/react-virtual';

// Lazy loading do Delete Modal
const DeleteModal = dynamic(() => import('@/components/business/DeleteClientModal'), { ssr: false });
import StatCard from '@/components/composite/StatCard';

const ClientsList: React.FC = () => {
    const { clients, saveClient, fetchClients, isClientsLoading } = useApp();
    // ... (removed my previous comment block)
    // Carrega os clientes ao montar o componente
    useEffect(() => {
        fetchClients('default');
    }, [fetchClients]);



    // Busca:
    // - displaySearchTerm: valor imediato do input (digitação)
    // - searchTerm: valor "debounced" (evita filtrar a cada tecla)
    const [displaySearchTerm, setDisplaySearchTerm] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Controle de visibilidade das colunas da tabela
    const [visibleColumns, setVisibleColumns] = useState({ client: true, contact: true, status: true, actions: true });
    // Abre/fecha o menu de configuração de colunas
    const [showColumnMenu, setShowColumnMenu] = useState(false);

    // Modal de "exclusão lógica": desativa o cliente (active=false) sem apagar dados
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        clientId: null as string | null,
        clientName: ''
    });
    // Motivo obrigatório (mínimo de caracteres) para registrar a desativação
    const [deleteReason, setDeleteReason] = useState('');

    // Debounce da busca: aguarda 300ms após parar de digitar
    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchTerm(displaySearchTerm);
        }, 300);

        return () => clearTimeout(handler);
    }, [displaySearchTerm]);

    // Métricas rápidas exibidas nos cards do topo
    const metrics = {
        total: clients.filter(c => c.active).length,
        active: clients.filter(c => c.active && !c.status?.bloqueado && !c.status?.suspensoParado).length,
        blocked: clients.filter(c => c.active && (c.status?.bloqueado || c.status?.bloqueadoLiberacao)).length,
        deleted: clients.filter(c => !c.active).length
    };

    const metricCards = [
        { title: 'Base Total', value: metrics.total, icon: 'groups', color: '#136dec' },
        { title: 'Ativos', value: metrics.active, icon: 'verified', color: '#10b981' },
        { title: 'Bloqueios', value: metrics.blocked, icon: 'lock', color: '#ef4444' },
        { title: 'Excluídos', value: metrics.deleted, icon: 'delete_sweep', color: '#64748b' }
    ];

    // Abre o modal para confirmar a desativação do cliente
    const handleOpenDeleteModal = (client: (typeof clients)[number]) => {
        setDeleteReason('');
        setDeleteModal({
            isOpen: true,
            clientId: client.id,
            clientName: client.general.razao
        });
    };

    // Confirma a "exclusão lógica" (marca active=false)
    const confirmDelete = () => {
        if (deleteModal.clientId && deleteReason.trim().length >= 10) {
            console.info(`[DEACTIVATION] Client: ${deleteModal.clientId} | Reason: ${deleteReason}`);

            const existing = clients.find(c => c.id === deleteModal.clientId);
            if (existing) {
                saveClient({ ...existing, active: false });
            }

            setDeleteModal({ isOpen: false, clientId: null, clientName: '' });
        }
    };

    // Converte o status técnico (trial/blocked/active) em texto amigável
    const getClientStatusLabel = (client: (typeof clients)[number]) => {
        if (!client.active) return 'Excluído';
        if (client.status?.bloqueado || client.status?.bloqueadoLiberacao) return 'Bloqueado';
        if (client.status?.suspensoParado) return 'Suspenso';
        if (client.contract?.liberacao === false) return 'Trial';
        return 'Ativo';
    };

    // Define estilos do badge conforme o status
    const getClientStatusClasses = (client: (typeof clients)[number]) => {
        const label = getClientStatusLabel(client);
        switch (label) {
            case 'Trial':
            case 'Suspenso':
                return { badge: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' };
            case 'Bloqueado':
            case 'Excluído':
                return { badge: 'bg-rose-50 text-rose-700 ring-rose-600/20', dot: 'bg-rose-500' };
            default:
                return { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' };
        }
    };

    // Filtra apenas clientes ativos + aplica busca por razão social, id, documento e email
    const filteredClients = clients.filter(client =>
        client.active && (
            client.general.razao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.general.documento?.includes(searchTerm) ||
            client.general.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    // Ref e setup pro Virtualizer (React Virtual)
    const parentRef = useRef<HTMLDivElement>(null);
    const estimateSize = React.useCallback(() => 80, []);
    const rowVirtualizer = useVirtualizer({
        count: filteredClients.length,
        getScrollElement: () => parentRef.current,
        estimateSize,
        overscan: 5,
    });

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Base de Clientes</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">Gestão centralizada de contas e licenciamento técnico.</p>
                </div>
                <Link href="/clients/new" className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all active:scale-95 shrink-0">
                    <span className="material-symbols-outlined">person_add</span>
                    Novo Cliente
                </Link>
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

            <div className="px-4">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4 shadow-xl">
                    <div className="relative flex-1 w-full">
                        <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            value={displaySearchTerm}
                            onChange={(e) => setDisplaySearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none text-base font-medium"
                            placeholder="Buscar por empresa, CNPJ ou ID..."
                            type="text"
                        />
                        {displaySearchTerm !== searchTerm && (
                            <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                <span className="material-symbols-outlined animate-spin text-primary/40 text-[20px]">sync</span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 w-full md:w-auto relative">
                        <button onClick={() => setShowColumnMenu(!showColumnMenu)} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold border transition-all ${showColumnMenu ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'}`}>
                            <span className="material-symbols-outlined">settings_input_component</span>
                            Colunas
                        </button>
                        {showColumnMenu && (
                            <div className="absolute right-0 top-full mt-4 w-64 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-30 p-4 animate-fadeIn">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-3">Visibilidade da Tabela</p>
                                <div className="space-y-2">
                                    {['client', 'contact', 'status', 'actions'].map(col => (
                                        <label key={col} className="flex items-center gap-4 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors group">
                                            <input type="checkbox" checked={visibleColumns[col as keyof typeof visibleColumns]} onChange={() => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col as keyof typeof visibleColumns] }))} className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary" />
                                            <span className="text-sm font-bold capitalize text-slate-700 dark:text-slate-200">{col === 'client' ? 'Empresa' : col === 'contact' ? 'Responsável' : col}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="px-4 overflow-x-auto pb-12">
                <div className="min-w-full inline-block align-middle">
                    <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-none">

                        {/* Wrapper for Virtualization */}
                        <div ref={parentRef} className="max-h-[600px] overflow-auto relative custom-scrollbar">
                            <table className="w-full flex flex-col relative bg-white dark:bg-slate-900 text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-20 shadow-sm hidden md:flex w-full border-b border-slate-200 dark:border-slate-800">
                                    <tr className="flex w-full items-center">
                                        {visibleColumns.client && <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 flex-[2] min-w-[250px]">Empresa</th>}
                                        {visibleColumns.contact && <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 flex-[1.5] min-w-[200px]">Responsável</th>}
                                        {visibleColumns.status && <th className="px-8 py-6 text-center text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 w-40 shrink-0">Status</th>}
                                        {visibleColumns.actions && <th className="px-8 py-6 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 w-32 shrink-0">Ações</th>}
                                    </tr>
                                </thead>

                                {/* Skeleton UI durante carregamento sem cache */}
                                {isClientsLoading && clients.length === 0 ? (
                                    <tbody className="flex flex-col w-full divide-y divide-slate-100 dark:divide-slate-800">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <tr key={i} className="animate-pulse flex flex-col md:flex-row w-full items-start md:items-center p-4 md:p-0 gap-4 md:gap-0">
                                                {visibleColumns.client && <td className="px-0 md:px-8 py-2 md:py-6 w-full md:flex-[2] md:min-w-[250px]"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div></td>}
                                                {visibleColumns.contact && <td className="px-0 md:px-8 py-2 md:py-6 w-full md:flex-[1.5] md:min-w-[200px]"><div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div></td>}
                                                {visibleColumns.status && <td className="px-0 md:px-8 py-2 md:py-6 w-full md:w-40 md:shrink-0 text-left md:text-center"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-xl w-20 md:mx-auto"></div></td>}
                                                {visibleColumns.actions && <td className="px-0 md:px-8 py-2 md:py-6 w-full md:w-32 md:shrink-0"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24 ml-auto"></div></td>}
                                            </tr>
                                        ))}
                                    </tbody>
                                ) : (
                                    <tbody className="flex flex-col w-full divide-y divide-slate-100 dark:divide-slate-800 relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>

                                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                            const client = filteredClients[virtualRow.index];
                                            return (
                                                <tr
                                                    key={client.id}
                                                    data-index={virtualRow.index}
                                                    ref={rowVirtualizer.measureElement}
                                                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group absolute w-full top-0 left-0 flex flex-col md:flex-row items-start md:items-center border-b border-slate-100 dark:border-slate-800 p-4 md:p-0"
                                                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                                                >
                                                    {visibleColumns.client && (
                                                        <td className="w-full md:w-auto px-0 md:px-8 py-2 md:py-[6px] flex-[2] md:min-w-[250px] flex flex-col justify-center">
                                                            <div className="flex flex-col">
                                                                <span className="text-base font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{client.general.razao}</span>
                                                                <span className="text-xs text-slate-400 font-mono mt-0.5">ID: {client.id} • DOC: {client.general.documento}</span>
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.contact && (
                                                        <td className="w-full md:w-auto px-0 md:px-8 py-2 md:py-[6px] flex-[1.5] md:min-w-[200px] flex flex-col justify-center">
                                                            <div className="flex flex-col md:justify-center h-full">
                                                                <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Responsável</span>
                                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{client.general.contatoResponsavel || '-'}</span>
                                                                <span className="text-xs text-slate-500">{client.general.email}</span>
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.status && (
                                                        <td className="absolute top-4 right-4 md:static w-auto md:w-40 md:shrink-0 text-center flex items-center justify-center md:h-full">
                                                            <div className="flex items-center justify-center h-full w-full">
                                                                {(() => {
                                                                    const statusLabel = getClientStatusLabel(client);
                                                                    const statusClasses = getClientStatusClasses(client);
                                                                    return (
                                                                        <span className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${statusClasses.badge}`}>
                                                                            <span className={`w-2 h-2 rounded-full ${statusClasses.dot}`}></span>
                                                                            {statusLabel}
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.actions && (
                                                        <td className="w-full md:w-32 md:shrink-0 flex items-center justify-end md:h-full mt-2 md:mt-0 px-0 md:px-8 py-2 md:py-[6px]">
                                                            <div className="flex items-center justify-end gap-1 h-full w-full">
                                                                <Link href={`/clients/${client.id}?readonly=true`} className="p-2 text-slate-400 hover:text-primary transition-colors" title="Visualizar">
                                                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                                </Link>
                                                                <Link href={`/clients/${client.id}`} className="p-2 text-slate-400 hover:text-amber-500 transition-colors" title="Editar">
                                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                                </Link>
                                                                <button onClick={() => handleOpenDeleteModal(client)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors" title="Excluir">
                                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                )}
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logical Deletion Modal usando dynamic() */}
            <DeleteModal
                isOpen={deleteModal.isOpen}
                clientName={deleteModal.clientName}
                deleteReason={deleteReason}
                setDeleteReason={setDeleteReason}
                onCancel={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={confirmDelete}
            />




        </div>
    );
};

export default ClientsList;
