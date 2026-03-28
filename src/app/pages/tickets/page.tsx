'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { SupportTicket } from '@/types';
import UnlockTicketModal from '@/components/business/UnlockTicketModal';
import StatCard from '@/components/composite/StatCard';

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
                                                <div
                                                    key={ticket.id}
                                                    draggable={ticket.status !== 'Closed'}
                                                    onDragStart={(e) => handleDragStart(e, ticket)}
                                                    onDragEnd={handleDragEnd}
                                                    onDragOver={(e) => {
                                                        if (draggingTicketId && draggingTicketId !== ticket.id) {
                                                            e.preventDefault();
                                                            e.dataTransfer.dropEffect = "move";
                                                        }
                                                    }}
                                                    onDrop={(e) => handleCardDrop(e, col.id, ticket.id)}
                                                    onClick={() => openTicketDetails(ticket)}
                                                    className={`bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all group relative overflow-hidden ${draggingTicketId === ticket.id ? 'opacity-40 rotate-1 scale-95' : 'opacity-100'
                                                        } ${ticket.status === 'Closed' ? 'cursor-not-allowed opacity-80' : 'cursor-grab active:cursor-grabbing hover:shadow-md hover:border-primary/30 dark:hover:border-primary/30'}`}
                                                >
                                                    {/* Faixa Indicadora de Prioridade */}
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${ticket.priority === 'Critical' ? 'bg-rose-500' :
                                                        ticket.priority === 'High' ? 'bg-orange-500' :
                                                            ticket.priority === 'Normal' ? 'bg-blue-500' : 'bg-emerald-500'
                                                        }`}></div>

                                                    <div className="pl-3">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-[10px] font-mono font-bold text-slate-400">#{ticket.id}</span>
                                                            {ticket.priority === 'Critical' && ticket.status !== 'Closed' && (
                                                                <span className="flex h-2 w-2 relative">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                                                </span>
                                                            )}
                                                            {ticket.status === 'Closed' && (
                                                                <span className="material-symbols-outlined text-[14px] text-slate-400">lock</span>
                                                            )}
                                                        </div>

                                                        <h4 className={`text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug mb-3 line-clamp-2 ${ticket.status !== 'Closed' ? 'group-hover:text-primary' : ''} transition-colors`}>
                                                            {ticket.subject}
                                                        </h4>

                                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 truncate max-w-[120px]">
                                                                {ticket.serviceType}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-50 dark:border-slate-700/50">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-5 h-5 rounded bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                                    {ticket.clientName.charAt(0)}
                                                                </div>
                                                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{ticket.clientName}</span>
                                                            </div>
                                                            {ticket.requesterName && (
                                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded" title={`Aberto por: ${ticket.requesterName}`}>
                                                                    <span className="material-symbols-outlined text-[12px]">shield_person</span>
                                                                    <span className="truncate max-w-[60px]">{ticket.requesterName}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
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

            {/* Modal de Detalhes - Slide Over */}
            {isDetailOpen && selectedTicket && (
                <div className="fixed inset-0 z-[200] flex justify-end animate-fadeIn">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsDetailOpen(false)}></div>
                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 h-full sm:h-full h-[100dvh] shadow-2xl flex flex-col animate-slideInRight border-l border-slate-200 dark:border-slate-800">

                        {/* Faixa de Status no Cabeçalho */}
                        <div className={`h-1.5 w-full ${isTicketClosed ? 'bg-slate-400' : selectedTicket.priority === 'Critical' ? 'bg-rose-500' : selectedTicket.priority === 'High' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>

                        {/* Cabeçalho */}
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-white dark:bg-slate-900 shrink-0">
                            <div className="flex-1 pr-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                        #{selectedTicket.id}
                                    </span>
                                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${KANBAN_COLUMNS.find(c => c.id === selectedTicket.status)?.bg.replace('/50', '')} ${KANBAN_COLUMNS.find(c => c.id === selectedTicket.status)?.color.replace('bg-', 'text-')}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${KANBAN_COLUMNS.find(c => c.id === selectedTicket.status)?.color}`}></div>
                                        {KANBAN_COLUMNS.find(c => c.id === selectedTicket.status)?.label}
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                                        {selectedTicket.subject}
                                    </h2>
                                    {isTicketClosed && (
                                        <span className="shrink-0 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-[10px] font-bold uppercase text-slate-500 border border-slate-200 dark:border-slate-700 mt-1">
                                            <span className="material-symbols-outlined text-[16px]">lock</span>
                                            Arquivado
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {isTicketClosed && currentUser?.role === 'admin' && (
                                    <button
                                        onClick={() => setIsUnlockModalOpen(true)}
                                        className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">lock_open</span>
                                        Desbloquear
                                    </button>
                                )}
                                <Link href={`/tickets/${selectedTicket.id}`} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                    Editar Ticket
                                </Link>
                                <button onClick={() => setIsDetailOpen(false)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                                    <span className="material-symbols-outlined text-[24px]">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Abas */}
                        <div className="flex px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 shrink-0">
                            {([
                                { id: 'info', label: 'Visão Geral', icon: 'dashboard' },
                                { id: 'tasks', label: `Tarefas (${selectedTicket.tasks?.length || 0})`, icon: 'check_box' },
                                { id: 'history', label: 'Timeline', icon: 'history' }
                            ] as const).map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-5 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/50 ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Conteúdo Rolável */}
                        <div className="flex-1 overflow-y-auto bg-slate-50/30 dark:bg-[#0b111a]">
                            {activeTab === 'info' && (
                                <div className="p-6 space-y-8 animate-fadeIn">

                                    {/* Cartão do Cliente */}
                                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
                                                    {selectedTicket.clientName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedTicket.clientName}</p>
                                                    <p className="text-xs text-slate-500">Contrato Enterprise • SLA 4h</p>
                                                </div>
                                            </div>
                                            <button className="text-xs font-bold text-primary hover:underline">Ver Contrato</button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Categoria</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-block">{selectedTicket.category}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Prioridade</p>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`material-symbols-outlined text-[16px] ${selectedTicket.priority === 'Critical' ? 'text-rose-500' : 'text-amber-500'}`}>flag</span>
                                                    <span className={`text-xs font-bold ${selectedTicket.priority === 'Critical' ? 'text-rose-600' : 'text-amber-600'}`}>{selectedTicket.priority}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Descrição */}
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-slate-400 text-[20px]">description</span>
                                            Descrição do Problema
                                        </h3>
                                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <div
                                                className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: selectedTicket.description || '<p class="italic text-slate-400">Nenhuma descrição fornecida.</p>' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Grid de Metadados */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Aberto Por</p>
                                            <p className="text-sm font-bold text-primary truncate" title={selectedTicket.requesterName || 'N/A'}>
                                                <span className="material-symbols-outlined text-[14px] align-text-bottom mr-1">shield_person</span>
                                                {selectedTicket.requesterName || 'Sistema'}
                                            </p>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Data de Abertura</p>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedTicket.createdAt}</p>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Última Atualização</p>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedTicket.updatedAt}</p>
                                        </div>
                                        {selectedTicket.closedAt && (
                                            <div className="col-span-1 sm:col-span-3 bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Encerrado em</p>
                                                <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">{selectedTicket.closedAt}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'tasks' && (
                                <div className="p-6 space-y-6 animate-fadeIn">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">Checklist de Resolução</h3>
                                        {!isTicketClosed && (
                                            <button onClick={handleCreateTask} className="text-xs font-bold text-primary hover:underline">+ Adicionar Item</button>
                                        )}
                                    </div>
                                    {isAddingTask && !isTicketClosed && (
                                        <div className="flex items-center gap-2">
                                            <input
                                                value={newTaskTitle}
                                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                                placeholder="Digite a nova tarefa..."
                                                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-primary"
                                            />
                                            <button onClick={confirmAddTask} className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors">Salvar</button>
                                            <button onClick={cancelAddTask} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
                                        </div>
                                    )}

                                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {(selectedTicket.tasks && selectedTicket.tasks.length > 0 ? selectedTicket.tasks : []).map((task, idx) => (
                                                <div key={idx} className={`flex items-start gap-3 p-4 transition-colors group ${isTicketClosed ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                                    <div className="relative flex items-center mt-0.5">
                                                        <input
                                                            type="checkbox"
                                                            disabled={isTicketClosed}
                                                            checked={task.status === 'Done'}
                                                            onChange={(e) => handleToggleTask(task.id, e.target.checked)}
                                                            className="peer h-5 w-5 appearance-none rounded-md border border-slate-300 dark:border-slate-600 checked:border-emerald-500 checked:bg-emerald-500 transition-all disabled:cursor-not-allowed cursor-pointer"
                                                        />
                                                        <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-[16px] opacity-0 peer-checked:opacity-100 pointer-events-none">check</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        {editingTaskId === task.id ? (
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    value={editingTitle}
                                                                    onChange={(e) => setEditingTitle(e.target.value)}
                                                                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-primary"
                                                                />
                                                                <button onClick={confirmEditTask} className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors">Salvar</button>
                                                                <button onClick={cancelEditTask} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 peer-checked:line-through decoration-slate-400">{task.title}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{task.assignee}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                    {!isTicketClosed && (
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <button
                                                                onClick={() => startEditTask(task.id, task.title)}
                                                                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                                                title="Editar tarefa"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteTask(task.id)}
                                                                className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                                                title="Excluir tarefa"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="p-6 animate-fadeIn">
                                    <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-800 space-y-8">
                                        <div className="relative group">
                                            <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 bg-blue-500"></div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedTicket.createdAt}</span>
                                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm group-hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="material-symbols-outlined text-sm text-blue-500">fiber_new</span>
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Sistema</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">Ticket criado.</p>
                                                </div>
                                            </div>
                                        </div>
                                        {selectedTicket.comments?.map((comment) => (
                                            <div key={comment.id} className="relative group">
                                                <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500"></div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{comment.createdAt}</span>
                                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm group-hover:shadow-md transition-shadow">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                                {comment.author.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{comment.author}</span>
                                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider">{comment.role}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{comment.content}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Ações do Rodapé */}
                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                            {isTicketClosed ? (
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-3 text-slate-500">
                                    <span className="material-symbols-outlined text-2xl">lock</span>
                                    <span className="text-sm font-bold">Este ticket foi encerrado e não pode ser alterado.</span>
                                </div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Escreva uma resposta interna ou para o cliente..."
                                            className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none resize-none h-12 focus:h-24 transition-all"
                                        />
                                        <button onClick={handleSendComment} className="absolute right-2 bottom-2 p-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" disabled={!replyText.trim()}>
                                            <span className="material-symbols-outlined text-[20px]">send</span>
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center mt-3 px-1">
                                        <div className="flex gap-2">
                                            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title="Anexar Arquivo"><span className="material-symbols-outlined text-[20px]">attach_file</span></button>
                                            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title="Inserir Template"><span className="material-symbols-outlined text-[20px]">bolt</span></button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Ações:</span>
                                            <button className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors">Resolver</button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
