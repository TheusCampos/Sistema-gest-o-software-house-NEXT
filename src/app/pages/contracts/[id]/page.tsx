'use client';
import ContractForm from '@/components/views/ContractForm';
import { useSearchParams } from 'next/navigation';
import { use } from 'react';

export default function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
    // Página de edição/visualização de contrato:
    // - `params.id` identifica o contrato
    // - querystring `readonly=true` ativa o modo somente leitura
    const resolvedParams = use(params);
    const searchParams = useSearchParams();
    const isReadOnly = searchParams.get('readonly') === 'true';

    return <ContractForm contractId={resolvedParams.id} readOnly={isReadOnly} />;
}
