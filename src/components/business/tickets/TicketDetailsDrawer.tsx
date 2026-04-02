'use client';

import React from 'react';
import Link from 'next/link';
import { SupportTicket, User } from '@/types';

interface TicketDetailsDrawerProps {
    isOpen: boolean;
    ticket: SupportTicket;
    onClose: () => void;
    isTicketClosed: boolean;
    activeTab: 'info' | 'tasks' | 'history';
    setActiveTab: (tab: 'info' | 'tasks' | 'history') => void;
    currentUser: User | null;
    setIsUnlockModalOpen: (open: boolean) => void;
    replyText: string;
    setReplyText: (text: string) => void;
    handleSendComment: () => void;
    isAddingTask: boolean;
    newTaskTitle: string;
    setNewTaskTitle: (title: string) => void;
    handleCreateTask: () => void;
    confirmAddTask: () => void;
    cancelAddTask: () => void;
    editingTaskId: string | null;
    editingTitle: string;
    setEditingTitle: (title: string) => void;
    startEditTask: (id: string, title: string) => void;
    confirmEditTask: () => void;
    cancelEditTask: () => void;
    handleToggleTask: (id: string, completed: boolean) => void;
    handleDeleteTask: (id: string) => void;
    kanbanColumns: Array<{ id: SupportTicket['status']; label: string; color: string; bg: string }>;
}

export const TicketDetailsDrawer: React.FC<TicketDetailsDrawerProps> = ({
    isOpen,
    ticket,
    onClose,
    isTicketClosed,
    activeTab,
    setActiveTab,
    currentUser,
    setIsUnlockModalOpen,
    replyText,
    setReplyText,
    handleSendComment,
    isAddingTask,
    newTaskTitle,
    setNewTaskTitle,
    handleCreateTask,
    confirmAddTask,
    cancelAddTask,
    editingTaskId,
    editingTitle,
    setEditingTitle,
    startEditTask,
    confirmEditTask,
    cancelEditTask,
    handleToggleTask,
    handleDeleteTask,
    kanbanColumns
}) => {
    if (!isOpen || !ticket) return null;

    const currentColumn = kanbanColumns.find(c => c.id === ticket.status);

    return (
        <div className="fixed inset-0 z-[200] flex justify-end animate-fadeIn">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 h-full sm:h-full h-[100dvh] shadow-2xl flex flex-col animate-slideInRight border-l border-slate-200 dark:border-slate-800">

                {/* Faixa de Status no Cabeçalho */}
                <div className={`h-1.5 w-full ${isTicketClosed ? 'bg-slate-400' : ticket.priority === 'Critical' ? 'bg-rose-500' : ticket.priority === 'High' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>

                {/* Cabeçalho */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex-1 pr-6">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                #{ticket.id}
                            </span>
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${currentColumn?.bg.replace('/50', '')} ${currentColumn?.color.replace('bg-', 'text-')}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${currentColumn?.color}`}></div>
                                {currentColumn?.label}
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                                {ticket.subject}
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
                        <Link href={`/tickets/${ticket.id}`} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                            Editar Ticket
                        </Link>
                        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                            <span className="material-symbols-outlined text-[24px]">close</span>
                        </button>
                    </div>
                </div>

                {/* Abas */}
                <div className="flex px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 shrink-0">
                    {([
                        { id: 'info', label: 'Visão Geral', icon: 'dashboard' },
                        { id: 'tasks', label: `Tarefas (${ticket.tasks?.length || 0})`, icon: 'check_box' },
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
                                            {ticket.clientName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{ticket.clientName}</p>
                                            <p className="text-xs text-slate-500">Contrato Enterprise • SLA 4h</p>
                                        </div>
                                    </div>
                                    <button className="text-xs font-bold text-primary hover:underline">Ver Contrato</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Categoria</p>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-block">{ticket.category}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Prioridade</p>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`material-symbols-outlined text-[16px] ${ticket.priority === 'Critical' ? 'text-rose-500' : 'text-amber-500'}`}>flag</span>
                                            <span className={`text-xs font-bold ${ticket.priority === 'Critical' ? 'text-rose-600' : 'text-amber-600'}`}>{ticket.priority}</span>
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
                                        dangerouslySetInnerHTML={{ __html: ticket.description || '<p class="italic text-slate-400">Nenhuma descrição fornecida.</p>' }}
                                    />
                                </div>
                            </div>

                            {/* Grid de Metadados */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Aberto Por</p>
                                    <p className="text-sm font-bold text-primary truncate" title={ticket.requesterName || 'N/A'}>
                                        <span className="material-symbols-outlined text-[14px] align-text-bottom mr-1">shield_person</span>
                                        {ticket.requesterName || 'Sistema'}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Data de Abertura</p>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{ticket.createdAt}</p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Última Atualização</p>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{ticket.updatedAt}</p>
                                </div>
                                {ticket.closedAt && (
                                    <div className="col-span-1 sm:col-span-3 bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Encerrado em</p>
                                        <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">{ticket.closedAt}</p>
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
                                    {(ticket.tasks && ticket.tasks.length > 0 ? ticket.tasks : []).map((task, idx) => (
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
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ticket.createdAt}</span>
                                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm group-hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-sm text-blue-500">fiber_new</span>
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Sistema</span>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">Ticket criado.</p>
                                        </div>
                                    </div>
                                </div>
                                {ticket.comments?.map((comment) => (
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
    );
};
