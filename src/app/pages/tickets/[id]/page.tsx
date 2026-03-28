'use client';
import TicketForm from '@/components/views/TicketForm';
import { use } from 'react';

export default function EditTicketPage({ params }: { params: Promise<{ id: string }> }) {
    // Página de edição de ticket:
    // - `params.id` identifica o ticket que será carregado no formulário
    const resolvedParams = use(params);
    return <TicketForm ticketId={resolvedParams.id} />;
}
