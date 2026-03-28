'use client';
import ClientForm from '@/components/views/ClientForm';
import { useSearchParams, useParams } from 'next/navigation';

export default function EditClientPage() {
    // Página de edição/visualização de cliente:
    // - `params.id` identifica o cliente
    // - querystring `readonly=true` ativa o modo somente leitura
    const params = useParams();
    const searchParams = useSearchParams();
    const isReadOnly = searchParams.get('readonly') === 'true';

    // Se params.id for undefined/null ou for um array, podemos extrair a string. No App Router normal, é string.
    const clientId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;

    return <ClientForm clientId={clientId} readOnly={isReadOnly} />;
}
