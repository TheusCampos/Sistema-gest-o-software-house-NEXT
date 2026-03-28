'use client';
import ContractForm from '@/components/views/ContractForm';
import { useSearchParams, useParams } from 'next/navigation';

export default function EditContractPage() {
    // Página de edição/visualização de contrato:
    // - `params.id` identifica o contrato
    // - querystring `readonly=true` ativa o modo somente leitura
    const params = useParams();
    const searchParams = useSearchParams();
    const isReadOnly = searchParams.get('readonly') === 'true';

    const contractId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : undefined;

    return <ContractForm contractId={contractId} readOnly={isReadOnly} />;
}
