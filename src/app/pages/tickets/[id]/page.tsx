'use client';
import TicketForm from '@/components/views/TicketForm';
import { useParams } from 'next/navigation';

export default function EditTicketPage() {
    // Página de edição de ticket:
    // - `params.id` identifica o ticket que será carregado no formulário
    const params = useParams();
    const ticketId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : undefined;
    return <TicketForm ticketId={ticketId} />;
}
