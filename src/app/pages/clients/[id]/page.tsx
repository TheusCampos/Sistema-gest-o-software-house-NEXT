'use client';
import ClientForm from '@/components/views/ClientForm';
import { useSearchParams } from 'next/navigation';
import { use } from 'react';

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
    // Página de edição/visualização de cliente:
    // - `params.id` identifica o cliente
    // - querystring `readonly=true` ativa o modo somente leitura
    const resolvedParams = use(params);
    const searchParams = useSearchParams();
    const isReadOnly = searchParams.get('readonly') === 'true';

    return <ClientForm clientId={resolvedParams.id} readOnly={isReadOnly} />;
}
