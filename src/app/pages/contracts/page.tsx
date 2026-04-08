'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Contract as ContractType } from '@/types'; // Use type alias to avoid conflict
import { useApp } from '@/context/AppContext';
import StatCard from '@/components/composite/StatCard';


const ContractList: React.FC = () => {
    // Lista de contratos + action de persistência vêm do Context
    const { contracts, saveContract, sellers, fetchSellers, currentUser, fetchContracts } = useApp();

    useEffect(() => {
        if (currentUser?.tenantId) {
            fetchSellers(currentUser.tenantId);
            fetchContracts(currentUser.tenantId);
        }
    }, [currentUser, fetchSellers, fetchContracts]);

    const role = currentUser?.role?.toLowerCase();
    const isAdmin = role === 'admin' || role === 'desenvolvedor';
    const canView = isAdmin || currentUser?.permissions?.contracts?.view;
    const canCreate = isAdmin || currentUser?.permissions?.contracts?.create;
    const canEdit = isAdmin || currentUser?.permissions?.contracts?.edit;
    const canDelete = isAdmin || currentUser?.permissions?.contracts?.delete;

    // Busca textual (cliente, id interno, número do contrato)
    const [searchTerm, setSearchTerm] = useState('');
    // Filtro por vendedor responsável
    const [sellerFilter, setSellerFilter] = useState('');
    // Controle de visibilidade das colunas da tabela
    const [visibleColumns, setVisibleColumns] = useState({
        client: true, id: true, dates: true, mrr: true, status: true, actions: true
    });
    // Abre/fecha menu de colunas
    const [showColumnMenu, setShowColumnMenu] = useState(false);

    // Modal de cancelamento (tratado como "exclusão" aqui): altera status para Cancelado
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        contractId: null as string | null,
        contractName: '',
        reason: ''
    });

    // Métricas exibidas nos cards do topo
    const metrics = {
        total: contracts.length,
        active: contracts.filter(c => c.status === 'Ativo' || c.status === 'Em Renovação' || c.status === 'Vencendo em Breve').length,
        delayed: contracts.filter(c => c.status === 'Atrasado' || c.status === 'Vencido').length,
        cancelled: contracts.filter(c => c.status === 'Cancelado').length
    };

    const metricCards = [
        { title: 'Total Registros', value: metrics.total, icon: 'description', color: '#136dec' },
        { title: 'Contratos Ativos', value: metrics.active, icon: 'check_circle', color: '#10b981' },
        { title: 'Atrasados / Vencidos', value: metrics.delayed, icon: 'warning', color: '#ef4444' },
        { title: 'Cancelados', value: metrics.cancelled, icon: 'cancel', color: '#64748b' }
    ];

    // Define o badge (ícone/texto/cores) conforme o status do contrato
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Atrasado':
            case 'Vencido':
                return { icon: 'warning', label: status, classes: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-800' };
            case 'Vencendo em Breve':
                return { icon: 'schedule', label: 'Vencendo', classes: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800' };
            case 'Cancelado':
                return { icon: 'cancel', label: 'Cancelado', classes: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' };
            case 'Em Renovação':
                return { icon: 'sync', label: 'Renovação', classes: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800' };
            default:
                return { icon: 'check_circle', label: 'Ativo', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800' };
        }
    };

    // Abre modal de cancelamento para um contrato específico
    const handleDeleteClick = (contract: ContractType) => {
        setDeleteModal({
            isOpen: true,
            contractId: contract.id,
            contractName: contract.clientName,
            reason: ''
        });
    };

    // Confirma cancelamento: atualiza status para "Cancelado"
    const confirmDelete = () => {
        if (deleteModal.contractId && deleteModal.reason.trim().length >= 10) {
            const existing = contracts.find(c => c.id === deleteModal.contractId);
            if (existing) {
                saveContract({ ...existing, status: 'Cancelado' });
            }
            setDeleteModal({ isOpen: false, contractId: null, contractName: '', reason: '' });
        }
    };

    // Aplica filtros:
    // - busca textual (cliente/id/número)
    // - filtro por vendedor
    // - oculta contratos cancelados da listagem principal
    const filteredContracts = contracts.filter(contract => {
        const matchesSearch = contract.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contract.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSeller = sellerFilter === '' || contract.sellerId === sellerFilter;
        const isNotDeleted = contract.status !== 'Cancelado';
        return matchesSearch && matchesSeller && isNotDeleted;
    });

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-wrap justify-between items-end gap-3 px-4">
                <div>
                    <p className="text-slate-900 dark:text-slate-50 text-4xl font-black leading-tight tracking-tight">Gestão de Contratos</p>
                    <p className="text-slate-500 dark:text-slate-400 text-base">Monitore faturamento recorrente, tipos de acordo e renovações.</p>
                </div>
                {canCreate && (
                    <Link href="/contracts/new" className="flex items-center justify-center rounded-xl h-12 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all gap-2 active:scale-95">
                        <span className="material-symbols-outlined">add_task</span>
                        Novo Contrato
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
                            placeholder="Buscar contrato por cliente, ID ou nº..."
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 relative">
                        <select
                            value={sellerFilter}
                            onChange={(e) => setSellerFilter(e.target.value)}
                            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 outline-none focus:ring-4 focus:ring-primary/5 transition-all appearance-none custom-select-arrow pr-12"
                        >
                            <option value="">Todos Vendedores</option>
                            {sellers.map(seller => (
                                <option key={seller.id} value={seller.id}>{seller.name}</option>
                            ))}
                        </select>

                        <button onClick={() => setShowColumnMenu(!showColumnMenu)} className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold border transition-all ${showColumnMenu ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                            <span className="material-symbols-outlined">view_column</span>
                            Colunas
                        </button>
                        {showColumnMenu && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-20 p-3 animate-fadeIn">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Exibir Colunas</p>
                                {Object.keys(visibleColumns).map(col => (
                                    <label key={col} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors group">
                                        <input type="checkbox" checked={visibleColumns[col as keyof typeof visibleColumns]} onChange={() => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col as keyof typeof visibleColumns] }))} className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary" />
                                        <span className="text-sm font-semibold capitalize text-slate-700 dark:text-slate-300">{col === 'mrr' ? 'Mensalidade' : col === 'client' ? 'Cliente' : col === 'id' ? 'ID' : col}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                        {showColumnMenu && <div className="fixed inset-0 z-10" onClick={() => setShowColumnMenu(false)}></div>}
                    </div>
                </div>
            </div>

            <div className="px-4 overflow-x-auto pb-12">
                <div className="min-w-full inline-block align-middle">
                    <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                        <table className="w-full flex flex-col relative bg-white dark:bg-slate-900 text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-20 shadow-sm hidden md:flex w-full border-b border-slate-200 dark:border-slate-800">
                                <tr className="flex w-full items-center">
                                    {visibleColumns.client && <th className="px-4 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 flex-[2]">Cliente</th>}
                                    {visibleColumns.id && <th className="px-4 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 flex-1">Contrato</th>}
                                    {visibleColumns.dates && <th className="px-4 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 flex-1">Período</th>}
                                    {visibleColumns.mrr && <th className="px-4 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 flex-1 text-right">Recorrência</th>}
                                    {visibleColumns.status && <th className="px-4 py-6 text-center text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 w-44 shrink-0">Situação</th>}
                                    {visibleColumns.actions && <th className="px-4 py-6 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 w-40 shrink-0">Ações</th>}
                                </tr>
                            </thead>
                            <tbody className="flex flex-col w-full divide-y divide-slate-100 dark:divide-slate-800 relative">
                                {filteredContracts.map((contract) => {
                                    const badge = getStatusBadge(contract.status);
                                    return (
                                        <tr key={contract.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group flex flex-col md:flex-row items-start md:items-center border-b border-slate-100 dark:border-slate-800 p-4 md:p-0">
                                            {visibleColumns.client && (
                                                <td className="px-0 md:px-4 py-2 md:py-[6px] whitespace-nowrap flex-[2] w-full md:w-auto">
                                                    <div className="flex items-center">
                                                        <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm transition-transform group-hover:scale-105 shrink-0">
                                                            {contract.clientLogo ? (
                                                                <Image
                                                                    className="object-cover h-full w-full"
                                                                    src={contract.clientLogo}
                                                                    alt={contract.clientName}
                                                                    width={48}
                                                                    height={48}
                                                                    unoptimized
                                                                />
                                                            ) : (
                                                                <span className="material-symbols-outlined text-slate-400 text-xl">business</span>
                                                            )}
                                                        </div>
                                                        <div className="ml-4 overflow-hidden">
                                                            <div className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight truncate">{contract.clientName}</div>
                                                            <div className="text-[10px] text-primary uppercase font-black tracking-widest mt-1">{contract.type}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.id && (
                                                <td className="px-0 md:px-4 py-2 md:py-[6px] whitespace-nowrap flex-1 w-full md:w-auto">
                                                    <div className="flex flex-col">
                                                        <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contrato</span>
                                                        <span className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400">#{contract.contractNumber}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium">Interno: {contract.id}</span>
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.dates && (
                                                <td className="px-0 md:px-4 py-2 md:py-[6px] whitespace-nowrap flex-1 w-full md:w-auto">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vigência</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Início: {contract.startDate}</span>
                                                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">Fim: {contract.endDate}</span>
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.mrr && (
                                                <td className="px-0 md:px-4 py-2 md:py-[6px] whitespace-nowrap text-left md:text-right flex-1 w-full md:w-auto">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">MRR</div>
                                                    <span className="text-base font-black text-slate-900 dark:text-white">R$ {contract.mrr}</span>
                                                </td>
                                            )}
                                            {visibleColumns.status && (
                                                <td className="px-0 md:px-4 py-2 md:py-[6px] whitespace-nowrap text-center w-full md:w-44 md:shrink-0 flex items-center md:justify-center">
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all hover:scale-105 shadow-sm ${badge.classes}`}>
                                                        <span className="material-symbols-outlined text-[16px] filled">{badge.icon}</span>
                                                        <span className="text-[10px] font-black uppercase tracking-wider">{badge.label}</span>
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.actions && (
                                                <td className="px-0 md:px-4 py-2 md:py-[6px] whitespace-nowrap text-right w-full md:w-40 md:shrink-0 flex items-center justify-end">
                                                    <div className="flex items-center justify-end gap-2 w-full">
                                                        {canView && (
                                                            <Link href={`/contracts/${contract.id}?readonly=true`} className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg" title="Visualizar">
                                                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                            </Link>
                                                        )}
                                                        {canEdit && (
                                                            <Link href={`/contracts/${contract.id}`} className="p-2 text-slate-400 hover:text-amber-500 transition-colors hover:bg-amber-500/10 rounded-lg" title="Editar">
                                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                                            </Link>
                                                        )}
                                                        {canDelete && (
                                                            <button onClick={() => handleDeleteClick(contract)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors hover:bg-rose-600/10 rounded-lg" title="Excluir">
                                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-dropIn">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Confirmar Exclusão</h3>
                                <p className="text-[10px] text-slate-400 uppercase font-black mt-1 tracking-widest">Ação irreversível</p>
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
                                    <span className="material-symbols-outlined text-4xl text-rose-600 dark:text-rose-400 filled">delete</span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 font-medium">
                                    Você está prestes a excluir o contrato de <br /><strong className="text-slate-900 dark:text-white">{deleteModal.contractName}</strong>.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                    Motivo da Exclusão <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={deleteModal.reason}
                                    onChange={(e) => setDeleteModal({ ...deleteModal, reason: e.target.value })}
                                    className="w-full h-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/50 resize-none transition-all shadow-inner"
                                    placeholder="Justifique a exclusão deste registro..."
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
                                className="flex-[2] py-3 bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-rose-600/30 hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <span>Confirmar Exclusão</span>
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
        @keyframes dropIn {
          from { transform: scale(0.9) translateY(-20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-dropIn {
          animation: dropIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
        </div>
    );
};

export default ContractList;
