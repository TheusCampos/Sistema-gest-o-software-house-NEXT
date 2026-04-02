'use client';

import React from 'react';
import { Appointment, SupportTicket } from '@/types';

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    formData: Partial<Appointment>;
    setFormData: (data: Partial<Appointment>) => void;
    onSave: () => void;
    onDelete: (id: string) => void;
    tickets: SupportTicket[];
}

/**
 * Componente de Modal para Criar ou Editar Agendamentos.
 * Extraído da AppointmentsPage para melhorar a manutenibilidade.
 */
export const AppointmentModal: React.FC<AppointmentModalProps> = ({
    isOpen,
    onClose,
    formData,
    setFormData,
    onSave,
    onDelete,
    tickets
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center lg:items-end lg:justify-end lg:pr-12 lg:pb-12 bg-slate-900/20 backdrop-blur-sm animate-fadeIn p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-[400px] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-dropIn">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                    <h3 className="font-black text-slate-800 dark:text-white">
                        {formData.id ? 'Editar Agendamento' : 'Novo Agendamento'}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Título */}
                    <div>
                        <input
                            className="w-full text-lg font-bold text-slate-800 dark:text-white bg-transparent border-0 border-b-2 border-slate-200 dark:border-slate-700 focus:ring-0 focus:border-primary px-0 py-2 placeholder-slate-300 outline-none"
                            placeholder="Adicionar título"
                            value={formData.title || ''}
                            autoFocus
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* Data e Hora */}
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                        <span className="material-symbols-outlined text-slate-400">calendar_month</span>
                        <input
                            type="datetime-local"
                            className="bg-transparent border-none p-0 focus:ring-0 w-full text-sm font-bold outline-none"
                            value={formData.date ? formData.date.slice(0, 16) : ''}
                            onChange={e => {
                                if (e.target.value) {
                                    const d = new Date(e.target.value);
                                    setFormData({ ...formData, date: d.toISOString() });
                                }
                            }}
                        />
                    </div>

                    {/* Duração e Status */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Duração (hs)</label>
                            <input
                                type="number" 
                                step="0.5"
                                className="bg-transparent border-none p-0 focus:ring-0 w-full text-sm font-bold h-6 outline-none"
                                value={formData.durationHours || ''}
                                onChange={e => setFormData({ ...formData, durationHours: Number(e.target.value) })}
                            />
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Status</label>
                            <select
                                className="bg-transparent border-none p-0 focus:ring-0 w-full text-sm font-bold h-6 appearance-none outline-none"
                                value={formData.status || ''}
                                onChange={e => setFormData({ ...formData, status: e.target.value as Appointment['status'] })}
                            >
                                <option className="bg-white dark:bg-slate-900">Pendente</option>
                                <option className="bg-white dark:bg-slate-900">Confirmado</option>
                                <option className="bg-white dark:bg-slate-900">Concluído</option>
                                <option className="bg-white dark:bg-slate-900">Cancelado</option>
                            </select>
                        </div>
                    </div>

                    {/* Cliente / Convidado */}
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <span className="material-symbols-outlined text-slate-400">person_add</span>
                        <input
                            type="text"
                            className="bg-transparent border-none p-0 focus:ring-0 w-full outline-none"
                            placeholder="Adicionar cliente convidado"
                            value={formData.clientName || ''}
                            onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                        />
                    </div>

                    {/* Localização / Link */}
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <span className="material-symbols-outlined text-slate-400">link</span>
                        <input
                            type="text"
                            className="bg-transparent border-none p-0 focus:ring-0 w-full text-blue-500 font-medium outline-none"
                            placeholder="Adicionar link de vídeo ou local..."
                            value={formData.location || ''}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>

                    {/* Vincular a Ticket */}
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <span className="material-symbols-outlined text-slate-400">confirmation_number</span>
                        <select
                            className="bg-transparent border-none p-0 focus:ring-0 w-full font-medium appearance-none text-ellipsis overflow-hidden whitespace-nowrap outline-none"
                            value={formData.ticketId || ''}
                            onChange={e => setFormData({ ...formData, ticketId: e.target.value })}
                        >
                            <option value="" className="bg-white dark:bg-slate-900">(Opcional) Vincular a um Ticket Existent</option>
                            {tickets?.filter(t => t.status !== 'Closed').map(t => {
                                const displaySubject = t.subject.length > 20 ? t.subject.substring(0, 20) + '...' : t.subject;
                                const displayClient = t.clientName.length > 15 ? t.clientName.substring(0, 15) + '...' : t.clientName;
                                return (
                                    <option key={t.id} value={t.id} className="bg-white dark:bg-slate-900">
                                        [{t.id.slice(0, 6)}] {displaySubject} - {displayClient}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Descrição */}
                    <div className="flex gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 h-20">
                        <span className="material-symbols-outlined text-slate-400 mt-1">notes</span>
                        <textarea
                            className="bg-transparent border-none p-0 focus:ring-0 w-full resize-none text-sm h-full outline-none"
                            placeholder="Adicionar descrição"
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    {/* Seleção de Cor */}
                    <div className="flex gap-2">
                        {[
                            { id: 'emerald', bg: 'bg-emerald-400', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                            { id: 'blue', bg: 'bg-blue-400', color: 'bg-blue-100 text-blue-800 border-blue-200' },
                            { id: 'indigo', bg: 'bg-indigo-400', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
                            { id: 'purple', bg: 'bg-purple-400', color: 'bg-purple-100 text-purple-800 border-purple-200' },
                            { id: 'rose', bg: 'bg-rose-400', color: 'bg-rose-100 text-rose-800 border-rose-200' }
                        ].map(c => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, color: c.color })}
                                className={`w-6 h-6 rounded-full ${c.bg} focus:ring-2 ring-offset-2 transition-all ${formData.color?.includes(c.id) ? 'ring-2' : ''}`}
                            ></button>
                        ))}
                    </div>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-3 shrink-0">
                    {formData.id ? (
                        <button 
                            onClick={() => onDelete(formData.id!)} 
                            className="px-4 py-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 font-bold text-sm transition mr-auto active:scale-95"
                        >
                            Excluir
                        </button>
                    ) : (
                        <div />
                    )}
                    <div className="flex gap-2">
                        <button 
                            onClick={onClose} 
                            className="px-6 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm transition active:scale-95"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={onSave} 
                            disabled={!formData.title}
                            className="px-8 py-2.5 rounded-xl text-white bg-slate-900 dark:bg-primary hover:bg-slate-800 dark:hover:bg-blue-600 shadow-xl shadow-slate-900/10 font-bold text-sm transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Salvar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
