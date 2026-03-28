'use client';

import EquipmentForm from '@/components/views/EquipmentForm';
import { useParams, useSearchParams } from 'next/navigation';

export default function EditEquipmentPage() {
    const params = useParams();
    // Página de edição/visualização de equipamento:
    // - `params.id` identifica o equipamento
    // - querystring `readOnly=true` ativa o modo somente leitura
    const searchParams = useSearchParams();
    const readOnly = searchParams.get('readOnly') === 'true';

    const equipmentId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : undefined;

    return <EquipmentForm equipmentId={equipmentId} readOnly={readOnly} />;
}
