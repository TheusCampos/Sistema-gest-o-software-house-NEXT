'use client';

import React, { useState, useEffect } from 'react';
import { Seller } from '@/types';
import { useApp } from '@/context/AppContext';
import StatCard from '@/components/composite/StatCard';

const SellersList: React.FC = () => {
    const { sellers, fetchSellers, saveSeller, removeSeller, currentUser } = useApp();

    // Busca vendedores ao carregar
    useEffect(() => {
        if (!currentUser?.tenantId) return;
        fetchSellers(currentUser.tenantId);
    }, [currentUser, fetchSellers]);

    // Busca por nome/email
    const [searchTerm, setSearchTerm] = useState('');
    // Filtro de status (ativos vs. inativos)
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    // Modal de criar/editar
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Vendedor em edição (quando não nulo)
    const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
    // Abre/fecha menu de colunas
    const [showColumnMenu, setShowColumnMenu] = useState(false);

    // Modal de exclusão lógica: marca active=false
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        sellerId: null as string | null,
        sellerName: '',
        reason: ''
    });

    const [visibleColumns, setVisibleColumns] = useState({
        photo: true,
        name: true,
        commission: true,
        status: true,
        actions: true
    });

    // Estado do formulário (dados do vendedor)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        commissionImplementation: 0,
        commissionMonthly: 0,
        active: true
    });

    // Métricas exibidas nos cards do topo
    const metrics = {
        total: sellers.length,
        active: sellers.filter(s => s.active).length,
        inactive: sellers.filter(s => !s.active).length,
        avgImp: sellers.length > 0 ? (sellers.reduce((acc, s) => acc + s.commissionImplementation, 0) / sellers.length).toFixed(1) : '0',
    };

    const metricCards = [
        { title: 'Total Registros', value: metrics.total, icon: 'badge', color: '#136dec' },
        { title: 'Vendedores Ativos', value: metrics.active, icon: 'verified', color: '#10b981' },
        { title: 'Excluídos / Inativos', value: metrics.inactive, icon: 'cancel', color: '#ef4444' },
        { title: 'Média Comis. Impl.', value: `${metrics.avgImp}%`, icon: 'payments', color: '#6366f1' }
    ];

    // Abre modal para criar ou editar vendedor
    const handleOpenModal = (seller?: Seller) => {
        if (seller) {
            setEditingSeller(seller);
            setFormData({ ...seller });
        } else {
            setEditingSeller(null);
            setFormData({ name: '', email: '', commissionImplementation: 0, commissionMonthly: 0, active: true });
        }
        setIsModalOpen(true);
    };

    // Abre modal de exclusão lógica
    const handleDeleteClick = (seller: Seller) => {
        setDeleteModal({
            isOpen: true,
            sellerId: seller.id,
            sellerName: seller.name,
            reason: ''
        });
    };

    // Confirma exclusão lógica (active=false) quando motivo tem tamanho mínimo
    const confirmDelete = async () => {
        if (deleteModal.sellerId && deleteModal.reason.trim().length >= 10) {
            try {
                await removeSeller(deleteModal.sellerId);
                setDeleteModal({ isOpen: false, sellerId: null, sellerName: '', reason: '' });
            } catch {
                alert('Erro ao excluir vendedor.');
            }
        }
    };

    // Salva (cria/atualiza) vendedor
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload: Seller = {
                ...formData,
                id: editingSeller ? editingSeller.id : '', // ID vazio para criar novo, backend ignora/gera
                tenantId: currentUser?.tenantId || ''
            };

            if (!payload.tenantId) {
                alert('Sessão inválida. Faça login novamente.');
                return;
            }

            await saveSeller(payload);
            setIsModalOpen(false);
        } catch {
            alert('Erro ao salvar vendedor.');
        }
    };

    // Filtra vendedores por busca e por status
    const filteredSellers = sellers.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase());

        // Exclusão Lógica: Apenas mostra ativos a não ser que o filtro peça inativos
        const matchesStatus = statusFilter === 'all'
            ? s.active
            : statusFilter === 'active' ? s.active : !s.active;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-4">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Equipe Comercial</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium">Gestão de vendedores e comissionamentos.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all active:scale-95 shrink-0"
                >
                    <span className="material-symbols-outlined text-[22px]">person_add</span>
                    Novo Vendedor
                </button>
            </div>

            {/* Metrics Grid */}
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

            {/* Toolbar */}
            <div className="px-4">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4 shadow-xl">
                    <div className="relative flex-1 w-full">
                        <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none text-base font-medium"
                            placeholder="Buscar vendedor por nome ou e-mail..."
                            type="text"
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                            className="flex-1 md:flex-none pl-6 pr-12 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-4 focus:ring-primary/5 transition-all appearance-none custom-select-arrow cursor-pointer"
                        >
                            <option value="all">Status: Ativos</option>
                            <option value="inactive">Status: Inativos</option>
                        </select>

                        <button
                            onClick={() => setShowColumnMenu(!showColumnMenu)}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold border transition-all ${showColumnMenu ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">view_column</span>
                            Colunas
                        </button>
                        {showColumnMenu && (
                            <div className="absolute right-0 top-full mt-4 w-64 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-30 p-4 animate-fadeIn">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-3">Visibilidade</p>
                                <div className="space-y-2">
                                    {Object.entries(visibleColumns).map(([key, val]) => (
                                        <label key={key} className="flex items-center gap-4 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors group">
                                            <input
                                                type="checkbox"
                                                checked={val}
                                                onChange={() => setVisibleColumns(prev => ({ ...prev, [key]: !val }))}
                                                className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm font-bold capitalize text-slate-700 dark:text-slate-200">
                                                {key === 'photo' ? 'Foto' : key === 'commission' ? 'Comissões' : key === 'name' ? 'Vendedor' : key}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        {showColumnMenu && <div className="fixed inset-0 z-10" onClick={() => setShowColumnMenu(false)}></div>}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="px-4 overflow-x-auto pb-12">
                <div className="min-w-full inline-block align-middle">
                    <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                        <table className="w-full flex flex-col relative bg-white dark:bg-slate-900 text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-20 shadow-sm hidden md:flex w-full border-b border-slate-200 dark:border-slate-800">
                                <tr className="flex w-full items-center">
                                    {visibleColumns.photo && <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 w-24 shrink-0">Avatar</th>}
                                    {visibleColumns.name && <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 flex-[2]">Vendedor</th>}
                                    {visibleColumns.commission && (
                                        <>
                                            <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 flex-1 text-center">Impl.</th>
                                            <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 flex-1 text-center">Recorr.</th>
                                        </>
                                    )}
                                    {visibleColumns.status && <th className="px-8 py-6 text-center text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 w-40 shrink-0">Status</th>}
                                    {visibleColumns.actions && <th className="px-8 py-6 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 w-32 shrink-0">Ações</th>}
                                </tr>
                            </thead>
                            <tbody className="flex flex-col w-full divide-y divide-slate-100 dark:divide-slate-800 relative">
                                {filteredSellers.length > 0 ? filteredSellers.map((seller) => (
                                    <tr key={seller.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group flex flex-col md:flex-row items-start md:items-center border-b border-slate-100 dark:border-slate-800 p-4 md:p-0">
                                        {visibleColumns.photo && (
                                            <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap w-full md:w-24 shrink-0 flex justify-center md:justify-start">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-lg font-black border border-primary/20 shadow-sm transition-transform group-hover:scale-105">
                                                    {seller.name[0]}
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.name && (
                                            <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap flex-[2] w-full md:w-auto">
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{seller.name}</span>
                                                    <span className="text-xs text-slate-400 font-mono mt-0.5">{seller.email}</span>
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.commission && (
                                            <>
                                                <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap text-left md:text-center flex-1 w-full md:w-auto">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Venda</div>
                                                    <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{seller.commissionImplementation}%</span>
                                                </td>
                                                <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap text-left md:text-center flex-1 w-full md:w-auto">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Mensal</div>
                                                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{seller.commissionMonthly}%</span>
                                                </td>
                                            </>
                                        )}
                                        {visibleColumns.status && (
                                            <td className="absolute top-4 right-4 md:static px-0 md:px-8 py-0 md:py-[6px] whitespace-nowrap text-center w-auto md:w-40 md:shrink-0 flex items-center justify-center">
                                                <span className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset 
                                                    ${seller.active ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-50 text-slate-500 ring-slate-600/20'}`}>
                                                    <span className={`h-2 w-2 rounded-full ${seller.active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                    {seller.active ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.actions && (
                                            <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap text-right w-full md:w-32 md:shrink-0 flex items-center justify-end">
                                                <div className="flex items-center justify-end gap-1 w-full">
                                                    <button
                                                        onClick={() => handleOpenModal(seller)}
                                                        className="p-2 text-slate-400 hover:text-primary transition-colors"
                                                        title="Visualizar"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(seller)}
                                                        className="p-2 text-slate-400 hover:text-amber-500 transition-colors"
                                                        title="Editar"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(seller)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-16 text-center text-slate-400 font-bold">
                                            Nenhum vendedor encontrado com os filtros atuais.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Cadastro/Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-dropIn">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">{editingSeller ? 'Editar Vendedor' : 'Novo Vendedor'}</h3>
                                <p className="text-[10px] text-slate-400 uppercase font-black mt-1 tracking-widest">Ficha Cadastral</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors bg-white dark:bg-slate-700 rounded-xl shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[24px]">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 font-bold outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="Ex: Ana Silva"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 font-medium outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="ana@empresa.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-indigo-500 uppercase tracking-widest ml-1">Comissão Implantação (%)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                        <input
                                            required
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.commissionImplementation}
                                            onChange={(e) => setFormData({ ...formData, commissionImplementation: Number(e.target.value) })}
                                            className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 text-indigo-600"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-emerald-500 uppercase tracking-widest ml-1">Comissão Mensal (%)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                        <input
                                            required
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.commissionMonthly}
                                            onChange={(e) => setFormData({ ...formData, commissionMonthly: Number(e.target.value) })}
                                            className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 text-emerald-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/30 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">save</span>
                                    Salvar Vendedor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-dropIn">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Confirmar Exclusão</h3>
                                <p className="text-[10px] text-slate-400 uppercase font-black mt-1 tracking-widest">Protocolo de desativação</p>
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
                                    Você está prestes a excluir o vendedor <br /><strong className="text-slate-900 dark:text-white">{deleteModal.sellerName}</strong>.
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
                                    placeholder="Justifique a exclusão..."
                                />
                                <div className="flex justify-end">
                                    <p className={`text-[10px] font-bold ${deleteModal.reason.trim().length >= 10 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        {deleteModal.reason.trim().length}/10
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

export default SellersList;
