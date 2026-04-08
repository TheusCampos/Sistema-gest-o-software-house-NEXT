'use client';

import React from 'react';
import { SupportTicket } from '@/types';

interface TicketCardProps {
    ticket: SupportTicket;
    colId: SupportTicket['status'];
    draggingTicketId: string | null;
    onDragStart: (e: React.DragEvent, ticket: SupportTicket) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onCardDrop: (e: React.DragEvent, colStatus: SupportTicket['status'], ticketId: string) => void;
    onClick: (ticket: SupportTicket) => void;
    canEdit?: boolean;
}

export const TicketCard: React.FC<TicketCardProps> = ({
    ticket,
    colId: colStatus,
    draggingTicketId,
    onDragStart,
    onDragEnd,
    onCardDrop,
    onClick,
    canEdit = false
}) => {
    return (
        <div
            draggable={canEdit && ticket.status !== 'Closed'}
            onDragStart={(e) => canEdit && onDragStart(e, ticket)}
            onDragEnd={(e) => canEdit && onDragEnd(e)}
            onDragOver={(e) => {
                if (canEdit && draggingTicketId && draggingTicketId !== ticket.id) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                }
            }}
            onDrop={(e) => canEdit && onCardDrop(e, colStatus, ticket.id)}
            onClick={() => onClick(ticket)}
            className={`bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all group relative overflow-hidden ${
                draggingTicketId === ticket.id ? 'opacity-40 rotate-1 scale-95' : 'opacity-100'
            } ${
                ticket.status === 'Closed' || !canEdit
                ? 'cursor-not-allowed opacity-80' 
                : 'cursor-grab active:cursor-grabbing hover:shadow-md hover:border-primary/30 dark:hover:border-primary/30'
            }`}
        >
            {/* Faixa Indicadora de Prioridade */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                ticket.priority === 'Critical' ? 'bg-rose-500' :
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
    );
};
