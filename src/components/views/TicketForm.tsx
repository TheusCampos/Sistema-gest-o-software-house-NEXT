'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useTicketsStore } from '@/stores/ticketsStore';
import { useClientsStore } from '@/stores/clientsStore';
import { useAuthStore } from '@/stores/authStore';
import { analyzeTicket, generateTicketSolution } from '@/services/geminiService';
import { RichTextEditor } from '@/components/business/tickets/RichTextEditor';
import { TicketFormSidebar } from '@/components/business/tickets/TicketFormSidebar';
import type { SupportTicket, ServiceType } from '@/types';

interface TicketFormProps {
    ticketId?: string;
}

const TicketForm: React.FC<TicketFormProps> = ({ ticketId }) => {
    // Stores atômicas do Zustand
    const { tickets, addTicket, updateTicket, fetchTickets } = useTicketsStore();
    const { clients, fetchClients } = useClientsStore();
    const currentUser = useAuthStore((s) => s.currentUser);
    const router = useRouter();

    // Estados locais do formulário
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [solution, setSolution] = useState('');
    const [category, setCategory] = useState('Erro de Sistema');
    const [priority, setPriority] = useState<SupportTicket['priority']>('Normal');
    const [serviceType, setServiceType] = useState('');
    const [serviceOptions, setServiceOptions] = useState<ServiceType[]>([]);
    const [selectedClientId, setSelectedClientId] = useState('');

    // Estados de UI e IA
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGeneratingSolution, setIsGeneratingSolution] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<{ reasoning?: string } | null>(null);

    const isInternalUser = useMemo(() => 
        currentUser?.role === 'admin' || currentUser?.role === 'technician' || currentUser?.role === 'desenvolvedor', 
    [currentUser]);

    // Carregar dados iniciais
    useEffect(() => {
        async function loadData() {
            if (currentUser?.tenantId) {
                fetchClients(currentUser.tenantId);
                const response = await fetch('/api/service-types');
                if (response.ok) {
                    const data = await response.json();
                    setServiceOptions(data.filter((s: ServiceType) => s.active));
                }
            }
        }
        loadData();
    }, [currentUser, fetchClients]);

    // Preencher dados ao editar
    useEffect(() => {
        if (!ticketId) {
            if (currentUser && !isInternalUser) setSelectedClientId(currentUser.id);
            return;
        }

        const existing = tickets.find(t => t.id === ticketId);
        if (existing) {
            setSubject(existing.subject || '');
            setCategory(existing.category || 'Erro de Sistema');
            setPriority(existing.priority || 'Normal');
            setServiceType(existing.serviceType || '');
            setSelectedClientId(existing.clientId || '');
            setDescription(existing.description || '');
            setSolution(existing.solution || '');
        }
    }, [ticketId, tickets, currentUser, isInternalUser]);

    const handleAnalyze = async () => {
        const textOnly = description.replace(/<[^>]*>/g, '').trim();
        if (textOnly.length < 10) return alert("Descreva o problema com mais detalhes.");

        setIsAnalyzing(true);
        try {
            const result = await analyzeTicket(textOnly);
            if (result) {
                if (result.category) setCategory(result.category);
                if (result.priority) {
                    const p = result.priority.toLowerCase();
                    if (p.includes('crítico') || p.includes('p1')) setPriority('Critical');
                    else if (p.includes('alto') || p.includes('p2')) setPriority('High');
                    else if (p.includes('baixo') || p.includes('p4')) setPriority('Low');
                    else setPriority('Normal');
                }
                setAiAnalysis(result);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerateSolution = async () => {
        const textOnly = description.replace(/<[^>]*>/g, '').trim();
        if (textOnly.length < 10) return alert("Descreva o problema para gerar solução.");

        setIsGeneratingSolution(true);
        try {
            const result = await generateTicketSolution(textOnly);
            if (result) setSolution(result);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGeneratingSolution(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.tenantId) return;

        let clientName = 'Cliente Desconhecido';
        if (isInternalUser) {
            const selected = clients.find(c => c.id === selectedClientId);
            if (selected) clientName = selected.general.fantasia || selected.general.razao;
        } else {
            clientName = currentUser.company || currentUser.name || 'Cliente';
        }

        setIsSubmitting(true);
        try {
            const commonData = {
                clientId: selectedClientId,
                clientName,
                subject,
                description,
                solution,
                category,
                serviceType,
                priority,
                updatedAt: new Date().toLocaleString('pt-BR'),
            };

            if (ticketId) {
                const existing = tickets.find(t => t.id === ticketId);
                if (existing) await updateTicket({ ...existing, ...commonData });
            } else {
                await addTicket({
                    id: '',
                    tenantId: currentUser.tenantId,
                    requesterId: currentUser.id,
                    requesterName: currentUser.name || 'Sistema',
                    status: 'Open',
                    createdAt: new Date().toLocaleString('pt-BR'),
                    tasks: [],
                    ...commonData
                } as SupportTicket);
            }
            fetchTickets(currentUser.tenantId);
            router.push('/tickets');
        } catch {
            alert("Erro ao salvar ticket.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
            <nav className="flex items-center gap-2 mb-6 text-sm">
                <Link href="/tickets" className="text-slate-500 font-medium hover:text-primary">Help Desk</Link>
                <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
                <span className="text-slate-900 dark:text-white font-bold underline underline-offset-4 decoration-primary">
                    {ticketId ? 'Editar Ticket' : 'Novo Ticket'}
                </span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                <div className="lg:col-span-3 space-y-6">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Registro de Chamado</h1>

                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                        <form className="p-8 space-y-8" onSubmit={handleSubmit}>
                            {/* Campos principais */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Cliente Solicitante</label>
                                    {isInternalUser ? (
                                        <select required value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="w-full h-14 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer">
                                            <option value="">Selecione o Cliente...</option>
                                            {clients.map(c => <option key={c.id} value={c.id}>{c.general.fantasia || c.general.razao}</option>)}
                                        </select>
                                    ) : (
                                        <input disabled type="text" value={currentUser?.company || currentUser?.name || 'Cliente'} className="w-full h-14 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-6 text-base font-bold text-slate-500 cursor-not-allowed" />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Título</label>
                                    <input required value={subject} onChange={e => setSubject(e.target.value)} className="w-full h-14 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-6 focus:ring-4 focus:ring-primary/10 outline-none text-base font-medium transition-all" placeholder="Ex: Erro ao emitir NFe" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Tipo Atendimento</label>
                                        <select required value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full h-14 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-5 text-sm font-bold">
                                            <option value="">Selecione...</option>
                                            {serviceOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Categoria</label>
                                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full h-14 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-5 text-sm font-bold">
                                            <option value="Erro de Sistema">Erro de Sistema</option>
                                            <option value="Dúvida de Utilização">Dúvida de Utilização</option>
                                            <option value="Melhoria">Melhoria</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Prioridade</label>
                                        <select value={priority} onChange={e => setPriority(e.target.value as SupportTicket['priority'])} className="w-full h-14 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-5 text-sm font-bold">
                                            <option value="Low">Baixa</option>
                                            <option value="Normal">Normal</option>
                                            <option value="High">Alta</option>
                                            <option value="Critical">Crítica</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Editors */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500">1. Descrição do Problema</label>
                                        <button type="button" onClick={handleAnalyze} disabled={isAnalyzing || !description} className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-1.5 hover:underline disabled:opacity-50">
                                            <span className="material-symbols-outlined text-[20px]">{isAnalyzing ? 'sync' : 'analytics'}</span>
                                            {isAnalyzing ? 'Analisando...' : 'Analisar Impacto'}
                                        </button>
                                    </div>
                                    <RichTextEditor 
                                        value={description} 
                                        onChange={val => setDescription(val)} 
                                        placeholder="Descreva o erro de forma clara..." 
                                    />
                                    {aiAnalysis?.reasoning && (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 flex gap-3 animate-slideUp">
                                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">info</span>
                                            <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed"><span className="font-bold">IA:</span> {aiAnalysis.reasoning}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 py-2 opacity-50">
                                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                                    <button type="button" onClick={handleGenerateSolution} disabled={isGeneratingSolution || !description} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all">
                                        <span className="material-symbols-outlined text-[18px]">{isGeneratingSolution ? 'sync' : 'auto_awesome'}</span>
                                        Gerar Sugestão de IA
                                    </button>
                                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500">2. Solução Recomendada (Ajustável)</label>
                                    <RichTextEditor 
                                        value={solution} 
                                        onChange={val => setSolution(val)} 
                                        placeholder="Caso já tenha a correção, registre aqui..." 
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <Link href="/tickets" className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Cancelar</Link>
                                <button type="submit" disabled={isSubmitting || !subject || !description} className="px-10 py-3.5 text-sm font-black bg-primary text-white rounded-xl shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50">
                                    <span>{isSubmitting ? 'Gravando...' : 'Registrar Chamado'}</span>
                                    <span className="material-symbols-outlined text-lg">send</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Sidebar Componentizada */}
                <TicketFormSidebar />
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
                @keyframes slideUp { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .animate-slideUp { animation: slideUp 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default TicketForm;
