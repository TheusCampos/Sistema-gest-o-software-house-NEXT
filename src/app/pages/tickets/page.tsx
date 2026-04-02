'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { SupportTicket } from '@/types';
import UnlockTicketModal from '@/components/business/UnlockTicketModal';
import StatCard from '@/components/composite/StatCard';
import { TicketCard } from '@/components/business/tickets/TicketCard';
import { TicketDetailsDrawer } from '@/components/business/tickets/TicketDetailsDrawer';

// Colunas do Kanban (cada uma representa um status do ticket)
const KANBAN_COLUMNS: Array<{
    id: SupportTicket['status'];
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: string;
}> = [
        { id: 'Open', label: 'Aberto', color: 'bg-blue-500', bg: 'bg-blue-50/50', border: 'border-blue-100', icon: 'fiber_new' },
        { id: 'Pending', label: 'Em Andamento', color: 'bg-amber-500', bg: 'bg-amber-50/50', border: 'border-amber-100', icon: 'pending_actions' },
        { id: 'Resolved', label: 'Resolvido', color: 'bg-emerald-500', bg: 'bg-emerald-50/50', border: 'border-emerald-100', icon: 'task_alt' },
        { id: 'Closed', label: 'Fechado', color: 'bg-slate-500', bg: 'bg-slate-50/50', border: 'border-slate-100', icon: 'archive' },
    ];

import { useApp } from '@/context/AppContext';

export default function TicketsPage() {
    // Tickets e action de update vêm do Context (estado global)
    const { tickets, updateTicket, fetchTickets, currentUser } = useApp();
    // Ref para controlar scroll horizontal do Kanban no mobile
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    // Índice aproximado do scroll (usado para navegação/indicadores)
    const [currentScrollIndex, setCurrentScrollIndex] = useState(0);
    // Coluna atualmente "destacada" durante drag
    const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
    // Ticket atualmente sendo arrastado
    const [draggingTicketId, setDraggingTicketId] = useState<string | null>(null);
    const [orderMapByTenant, setOrderMapByTenant] = useState<Record<string, Record<SupportTicket['status'], string[]>>>(() => {
        if (typeof window === 'undefined') return {};
        try {
            const stored = localStorage.getItem('tickets_order_map');
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });

    // Drawer/modal de detalhes do ticket
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);

    // Aba ativa dentro do painel de detalhes
    const [activeTab, setActiveTab] = useState<'info' | 'tasks' | 'history'>('info');
    // Texto de resposta/comentário (mock)
    const [replyText, setReplyText] = useState('');
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');

    useEffect(() => {
        // Listener de scroll para estimar qual coluna está em foco (mobile)
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (container.offsetWidth > 0) {
                // Adjust calculation for new gap and width
                const scrollLeft = container.scrollLeft;
                const totalWidth = container.scrollWidth;
                const visibleWidth = container.offsetWidth;
                
                const percentage = scrollLeft / (totalWidth - visibleWidth);
                const index = Math.round(percentage * (KANBAN_COLUMNS.length - 1));

                if (index >= 0 && index < KANBAN_COLUMNS.length) {
                    setCurrentScrollIndex(index);
                }
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const tenantKey = currentUser?.tenantId || 'default';
    const currentOrderMap = orderMapByTenant[tenantKey] || {
        Open: [],
        Pending: [],
        Resolved: [],
        Closed: [],
    };

    const getMergedOrder = (status: SupportTicket['status']) => {
        const ids = tickets.filter(t => t.status === status).map(t => t.id);
        const existing = currentOrderMap[status] || [];
        return [
            ...existing.filter(id => ids.includes(id)),
            ...ids.filter(id => !existing.includes(id)),
        ];
    };

    // Buscar tickets ao carregar a página
    useEffect(() => {
        if (currentUser?.tenantId) {
            fetchTickets(currentUser.tenantId);
        }
    }, [currentUser, fetchTickets]);

    // Métricas exibidas nos cards do topo
    const metrics = {
        total: tickets.length,
        active: tickets.filter(t => t.status === 'Open' || t.status === 'Pending').length,
        resolved: tickets.filter(t => t.status === 'Resolved').length,
        closed: tickets.filter(t => t.status === 'Closed').length
    };

    const metricCards = [
        { title: 'Total de Chamados', value: metrics.total, icon: 'confirmation_number', color: '#136dec' },
        { title: 'Ativos / Pendentes', value: metrics.active, icon: 'notification_important', color: '#f59e0b' },
        { title: 'Resolvidos', value: metrics.resolved, icon: 'verified', color: '#10b981' },
        { title: 'Arquivados / Fechados', value: metrics.closed, icon: 'archive', color: '#64748b' }
    ];

    // Drag start: inicia arraste do card do ticket
    const handleDragStart = (e: React.DragEvent, ticket: SupportTicket) => {
        if (ticket.status === 'Closed') {
            e.preventDefault();
            return;
        }

        setDraggingTicketId(ticket.id);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", ticket.id);
        e.dataTransfer.setData("application/x-ticket-status", ticket.status);
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '0.5';
    };

    // Drag end: limpa estados visuais/temporários
    const handleDragEnd = (e: React.DragEvent) => {
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '1';
        setDraggingTicketId(null);
        setDraggedOverColumn(null);
    };

    // Drag over: destaca a coluna alvo
    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (draggedOverColumn !== columnId) {
            setDraggedOverColumn(columnId);
        }
    };

    const handleDrop = (e: React.DragEvent, targetStatus: SupportTicket['status']) => {
        e.preventDefault();
        const ticketId = e.dataTransfer.getData("text/plain");
        const sourceStatus = e.dataTransfer.getData("application/x-ticket-status") as SupportTicket['status'] | '';

        if (ticketId) {
            const ticket = tickets.find(t => t.id === ticketId);
            if (ticket && ticket.status !== 'Closed' && ticket.status !== targetStatus) {
                const now = new Date().toLocaleString('pt-BR');
                const updates: Partial<SupportTicket> = {
                    status: targetStatus,
                    updatedAt: now
                };

                if (targetStatus === 'Closed') {
                    updates.closedAt = now;
                }

                updateTicket({ ...ticket, ...updates });
                setOrderMapByTenant(prev => {
                    const next = { ...prev };
                    const current = next[tenantKey] || { Open: [], Pending: [], Resolved: [], Closed: [] };
                    if (sourceStatus && current[sourceStatus]) {
                        current[sourceStatus] = current[sourceStatus].filter(id => id !== ticketId);
                    }
                    current[targetStatus] = [...(current[targetStatus] || []).filter(id => id !== ticketId), ticketId];
                    next[tenantKey] = current;
                    try {
                        localStorage.setItem('tickets_order_map', JSON.stringify(next));
                    } catch { }
                    return next;
                });
            }
            if (ticket && ticket.status === targetStatus && sourceStatus === targetStatus) {
                setOrderMapByTenant(prev => {
                    const next = { ...prev };
                    const current = next[tenantKey] || { Open: [], Pending: [], Resolved: [], Closed: [] };
                    const list = current[targetStatus] && current[targetStatus].length > 0
                        ? [...current[targetStatus]]
                        : tickets.filter(t => t.status === targetStatus).map(t => t.id);
                    const filtered = list.filter(id => id !== ticketId);
                    filtered.push(ticketId);
                    current[targetStatus] = filtered;
                    next[tenantKey] = current;
                    try {
                        localStorage.setItem('tickets_order_map', JSON.stringify(next));
                    } catch { }
                    return next;
                });
            }
        }

        setDraggedOverColumn(null);
        setDraggingTicketId(null);
    };

    const handleCardDrop = (e: React.DragEvent, targetStatus: SupportTicket['status'], targetId: string) => {
        e.preventDefault();
        const ticketId = e.dataTransfer.getData("text/plain");
        const sourceStatus = e.dataTransfer.getData("application/x-ticket-status") as SupportTicket['status'] | '';
        if (!ticketId || !sourceStatus || sourceStatus !== targetStatus || ticketId === targetId) return;

        setOrderMapByTenant(prev => {
            const next = { ...prev };
            const current = next[tenantKey] || { Open: [], Pending: [], Resolved: [], Closed: [] };
            const base = current[targetStatus] && current[targetStatus].length > 0
                ? [...current[targetStatus]]
                : tickets.filter(t => t.status === targetStatus).map(t => t.id);
            const without = base.filter(id => id !== ticketId);
            const targetIndex = without.indexOf(targetId);
            const insertIndex = targetIndex === -1 ? without.length : targetIndex;
            without.splice(insertIndex, 0, ticketId);
            current[targetStatus] = without;
            next[tenantKey] = current;
            try {
                localStorage.setItem('tickets_order_map', JSON.stringify(next));
            } catch { }
            return next;
        });
    };

    const openTicketDetails = (ticket: SupportTicket) => {
        setSelectedTicket(ticket);
        setIsDetailOpen(true);
        setActiveTab('info');
    };

    const scrollToColumn = (index: number) => {
        const container = scrollContainerRef.current;
        if (container) {
            // Find the column element
            const columns = container.children;
            if (columns[index]) {
                columns[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    };

    const isTicketClosed = selectedTicket?.status === 'Closed';

    const handleCreateTask = () => {
        if (!selectedTicket || isTicketClosed) return;
        setIsAddingTask(true);
        setNewTaskTitle('');
    };
    const confirmAddTask = () => {
        if (!selectedTicket || isTicketClosed) return;
        const title = newTaskTitle.trim();
        if (!title) return;
        const newTask = {
            id: crypto.randomUUID(),
            ticketId: selectedTicket.id,
            title,
            assignee: currentUser?.name || 'Sistema',
            dueDate: new Date().toLocaleDateString('pt-BR'),
            status: 'Pending' as const
        };
        const updatedTasks = [...(selectedTicket.tasks || []), newTask];
        const updatedTicket = { ...selectedTicket, tasks: updatedTasks };
        updateTicket(updatedTicket);
        setSelectedTicket(updatedTicket);
        setIsAddingTask(false);
        setNewTaskTitle('');
    };
    const cancelAddTask = () => {
        setIsAddingTask(false);
        setNewTaskTitle('');
    };

    const handleToggleTask = (taskId: string, checked: boolean) => {
        if (!selectedTicket || isTicketClosed) return;

        const updatedTasks = (selectedTicket.tasks || []).map(t =>
            t.id === taskId ? { ...t, status: (checked ? 'Done' : 'Pending') as 'Done' | 'Pending' } : t
        );
        const updatedTicket = { ...selectedTicket, tasks: updatedTasks };

        updateTicket(updatedTicket);
        setSelectedTicket(updatedTicket);
    };
    const startEditTask = (taskId: string, currentTitle: string) => {
        if (isTicketClosed) return;
        setEditingTaskId(taskId);
        setEditingTitle(currentTitle);
    };
    const confirmEditTask = () => {
        if (!selectedTicket || isTicketClosed || !editingTaskId) return;
        const title = editingTitle.trim();
        if (!title) return;
        const updatedTasks = (selectedTicket.tasks || []).map(t =>
            t.id === editingTaskId ? { ...t, title } : t
        );
        const updatedTicket = { ...selectedTicket, tasks: updatedTasks };
        updateTicket(updatedTicket);
        setSelectedTicket(updatedTicket);
        setEditingTaskId(null);
        setEditingTitle('');
    };
    const cancelEditTask = () => {
        setEditingTaskId(null);
        setEditingTitle('');
    };
    const handleDeleteTask = (taskId: string) => {
        if (!selectedTicket || isTicketClosed) return;
        const updatedTasks = (selectedTicket.tasks || []).filter(t => t.id !== taskId);
        const updatedTicket = { ...selectedTicket, tasks: updatedTasks };
        updateTicket(updatedTicket);
        setSelectedTicket(updatedTicket);
    };

    const handleSendComment = () => {
        if (!selectedTicket || isTicketClosed || !replyText.trim()) return;

        const newComment = {
            id: crypto.randomUUID(),
            author: currentUser?.name || 'Desconhecido',
            role: currentUser?.role || 'user',
            content: replyText.trim(),
            createdAt: new Date().toLocaleString('pt-BR'),
            isInternal: false
        };

        const updatedComments = [...(selectedTicket.comments || []), newComment];
        const updatedTicket = { ...selectedTicket, comments: updatedComments };

        updateTicket(updatedTicket);
        setSelectedTicket(updatedTicket);
        setReplyText('');
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] w-full overflow-hidden">
            <div className="flex flex-col w-full h-full space-y-6 animate-fadeIn">
                {/* Header com Filtros e Ações */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Mesa de Atendimento</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Gerencie o fluxo de trabalho da equipe técnica.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                            <input type="text" placeholder="Filtrar tickets..." className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-primary w-full sm:w-64" />
                        </div>
                        <Link
                            href="/tickets/new"
                            className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-primary/20 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            <span className="hidden sm:inline">Novo Ticket</span>
                        </Link>
                    </div>
                </div>

                {/* Grid de Métricas KPI */}
                <div className="px-4 shrink-0">
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

                {/* Pontos de Navegação Mobile */}
                <div className="flex md:hidden justify-center gap-2 px-4 shrink-0">
                    {KANBAN_COLUMNS.map((col, idx) => (
                        <button
                            key={col.id}
                            onClick={() => scrollToColumn(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${currentScrollIndex === idx ? `w-6 ${col.color}` : 'w-1.5 bg-slate-300 dark:bg-slate-700'}`}
                            aria-label={`Ir para coluna ${col.label}`}
                        />
                    ))}
                </div>

                {/* Container do Kanban Board */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-x-auto overflow-y-hidden pb-4 px-4 snap-x snap-mandatory scroll-smooth flex gap-4 sm:gap-6"
                >
                    {KANBAN_COLUMNS.map((col) => {
                        const colTickets = tickets.filter(t => t.status === col.id);
                        const mergedOrder = getMergedOrder(col.id);
                            const orderedTickets = [...colTickets].sort((a, b) => {
                                const ia = mergedOrder.indexOf(a.id);
                                const ib = mergedOrder.indexOf(b.id);
                                const ai = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
                                const bi = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;
                                return ai - bi;
                            });
                            const isOver = draggedOverColumn === col.id;

                            return (
                                <div
                                    key={col.id}
                                    onDragOver={(e) => handleDragOver(e, col.id)}
                                    onDragLeave={() => setDraggedOverColumn(null)}
                                    onDrop={(e) => handleDrop(e, col.id)}
                                    className={`flex flex-col w-[90vw] sm:w-[340px] shrink-0 rounded-2xl border transition-all duration-200 h-full max-h-full snap-center ${isOver
                                        ? 'bg-primary/5 border-primary/50 ring-2 ring-primary/20'
                                        : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800'
                                        }`}
                                >
                                    {/* Cabeçalho da Coluna */}
                                    <div className="p-4 flex items-center justify-between shrink-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2.5 h-2.5 rounded-full ${col.color} shadow-sm`}></div>
                                            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wide">{col.label}</h3>
                                        </div>
                                        <span className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700 min-w-[28px] text-center shadow-sm">
                                            {colTickets.length}
                                        </span>
                                    </div>

                                    {/* Conteúdo da Coluna (Tickets) */}
                                    <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3 custom-scrollbar">
                                        {orderedTickets.length > 0 ? (
                                            orderedTickets.map(ticket => (
                                                <TicketCard
                                                    key={ticket.id}
                                                    ticket={ticket}
                                                    colId={col.id}
                                                    draggingTicketId={draggingTicketId}
                                                    onDragStart={handleDragStart}
                                                    onDragEnd={handleDragEnd}
                                                    onCardDrop={handleCardDrop}
                                                    onClick={openTicketDetails}
                                                />
                                            ))
                                        ) : (
                                            <div className="h-full min-h-[150px] flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 opacity-60">
                                                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-2">
                                                    <span className="material-symbols-outlined text-[24px]">{col.icon}</span>
                                                </div>
                                                <p className="text-xs font-bold uppercase tracking-widest">Sem Tickets</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                        );
                    })}
                </div>
            </div>

            <TicketDetailsDrawer
                isOpen={isDetailOpen}
                ticket={selectedTicket as SupportTicket}
                onClose={() => setIsDetailOpen(false)}
                isTicketClosed={isTicketClosed}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                currentUser={currentUser}
                setIsUnlockModalOpen={setIsUnlockModalOpen}
                replyText={replyText}
                setReplyText={setReplyText}
                handleSendComment={handleSendComment}
                isAddingTask={isAddingTask}
                newTaskTitle={newTaskTitle}
                setNewTaskTitle={setNewTaskTitle}
                handleCreateTask={handleCreateTask}
                confirmAddTask={confirmAddTask}
                cancelAddTask={cancelAddTask}
                editingTaskId={editingTaskId}
                editingTitle={editingTitle}
                setEditingTitle={setEditingTitle}
                startEditTask={startEditTask}
                confirmEditTask={confirmEditTask}
                cancelEditTask={cancelEditTask}
                handleToggleTask={handleToggleTask}
                handleDeleteTask={handleDeleteTask}
                kanbanColumns={KANBAN_COLUMNS}
            />

            {selectedTicket && (
                <UnlockTicketModal
                    isOpen={isUnlockModalOpen}
                    onClose={() => setIsUnlockModalOpen(false)}
                    ticketId={selectedTicket.id}
                    onSuccess={() => {
                        setIsUnlockModalOpen(false);
                        setIsDetailOpen(false);
                        if (currentUser?.tenantId) {
                            fetchTickets(currentUser.tenantId);
                        }
                    }}
                />
            )}
        </div>
    );
};
