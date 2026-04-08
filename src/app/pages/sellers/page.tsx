'use client';

import React, { useState, useEffect } from 'react';
import { Seller } from '@/types';
import { useApp } from '@/context/AppContext';
import StatCard from '@/components/composite/StatCard';
import PageHeader from '@/components/composite/PageHeader';
import ListToolbar from '@/components/composite/ListToolbar';
import DeleteWithReasonModal from '@/components/composite/DeleteWithReasonModal';
import { useDeleteModal } from '@/hooks/useDeleteModal';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';

const SELLER_COLUMNS = [
    { id: 'photo', label: 'Foto' },
    { id: 'name', label: 'Vendedor' },
    { id: 'commission', label: 'Comissões' },
    { id: 'status', label: 'Status' },
    { id: 'actions', label: 'Ações' },
];

const SellersList: React.FC = () => {
    const { sellers, fetchSellers, saveSeller, removeSeller, currentUser } = useApp();
    const { deleteModal, openDeleteModal, closeDeleteModal, setReason, isReasonValid } = useDeleteModal();
    const { visibleColumns, toggleColumn } = useColumnVisibility({
        photo: true, name: true, commission: true, status: true, actions: true,
    });

    const role = currentUser?.role?.toLowerCase();
    const isAdmin = role === 'admin' || role === 'desenvolvedor';
    const canView = isAdmin || currentUser?.permissions?.sellers?.view;
    const canCreate = isAdmin || currentUser?.permissions?.sellers?.create;
    const canEdit = isAdmin || currentUser?.permissions?.sellers?.edit;
    const canDelete = isAdmin || currentUser?.permissions?.sellers?.delete;

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
    const [formData, setFormData] = useState({
        name: '', email: '', commissionImplementation: 0, commissionMonthly: 0, active: true,
    });

    useEffect(() => {
        if (!currentUser?.tenantId) return;
        fetchSellers(currentUser.tenantId);
    }, [currentUser, fetchSellers]);

    const metrics = {
        total: sellers.length,
        active: sellers.filter(s => s.active).length,
        inactive: sellers.filter(s => !s.active).length,
        avgImp: sellers.length > 0
            ? (sellers.reduce((acc, s) => acc + s.commissionImplementation, 0) / sellers.length).toFixed(1)
            : '0',
    };

    const metricCards = [
        { title: 'Total Registros', value: metrics.total, icon: 'badge', color: '#136dec' },
        { title: 'Vendedores Ativos', value: metrics.active, icon: 'verified', color: '#10b981' },
        { title: 'Excluídos / Inativos', value: metrics.inactive, icon: 'cancel', color: '#ef4444' },
        { title: 'Média Comis. Impl.', value: `${metrics.avgImp}%`, icon: 'payments', color: '#6366f1' },
    ];

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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: Seller = {
                ...formData,
                id: editingSeller ? editingSeller.id : '',
                tenantId: currentUser?.tenantId || '',
            };
            if (!payload.tenantId) { alert('Sessão inválida. Faça login novamente.'); return; }
            await saveSeller(payload);
            setIsModalOpen(false);
        } catch {
            alert('Erro ao salvar vendedor.');
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteModal.itemId || !isReasonValid) return;
        try {
            await removeSeller(deleteModal.itemId);
            closeDeleteModal();
        } catch {
            alert('Erro ao excluir vendedor.');
        }
    };

    const filteredSellers = sellers.filter(s => {
        const matchesSearch =
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all'
            ? s.active
            : statusFilter === 'active' ? s.active : !s.active;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 animate-fadeIn">
            <PageHeader title="Equipe Comercial" subtitle="Gestão de vendedores e comissionamentos.">
                {canCreate && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all active:scale-95 shrink-0"
                    >
                        <span className="material-symbols-outlined text-[22px]">person_add</span>
                        Novo Vendedor
                    </button>
                )}
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
                searchPlaceholder="Buscar vendedor por nome ou e-mail..."
                statusFilter={statusFilter}
                onStatusFilterChange={v => setStatusFilter(v as 'all' | 'active' | 'inactive')}
                columns={SELLER_COLUMNS}
                visibleColumns={visibleColumns}
                onToggleColumn={toggleColumn as (key: string) => void}
            />

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
                                                <span className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${seller.active ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-50 text-slate-500 ring-slate-600/20'}`}>
                                                    <span className={`h-2 w-2 rounded-full ${seller.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                    {seller.active ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.actions && (
                                            <td className="px-0 md:px-8 py-2 md:py-[6px] whitespace-nowrap text-right w-full md:w-32 md:shrink-0 flex items-center justify-end">
                                                <div className="flex items-center justify-end gap-1 w-full">
                                                    {canView && (
                                                        <button onClick={() => handleOpenModal(seller)} className="p-2 text-slate-400 hover:text-primary transition-colors" title="Visualizar">
                                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                        </button>
                                                    )}
                                                    {canEdit && (
                                                        <button onClick={() => handleOpenModal(seller)} className="p-2 text-slate-400 hover:text-amber-500 transition-colors" title="Editar">
                                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button onClick={() => openDeleteModal(seller.id, seller.name)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors" title="Excluir">
                                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                                        </button>
                                                    )}
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
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors bg-white dark:bg-slate-700 rounded-xl shadow-sm">
                                <span className="material-symbols-outlined text-[24px]">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 font-bold outline-none focus:ring-2 focus:ring-primary/50" placeholder="Ex: Ana Silva" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                                    <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 font-medium outline-none focus:ring-2 focus:ring-primary/50" placeholder="ana@empresa.com" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-indigo-500 uppercase tracking-widest ml-1">Comissão Implantação (%)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                        <input required type="number" min="0" max="100" value={formData.commissionImplementation} onChange={e => setFormData({ ...formData, commissionImplementation: Number(e.target.value) })} className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 text-indigo-600" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-emerald-500 uppercase tracking-widest ml-1">Comissão Mensal (%)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                        <input required type="number" min="0" max="100" value={formData.commissionMonthly} onChange={e => setFormData({ ...formData, commissionMonthly: Number(e.target.value) })} className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 text-emerald-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">Cancelar</button>
                                <button type="submit" className="px-8 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/30 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">save</span>
                                    Salvar Vendedor
                                </button>
                            </div>
                        </form>
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
            />
        </div>
    );
};

export default SellersList;
