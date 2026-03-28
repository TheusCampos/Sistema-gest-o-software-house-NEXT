'use client';

import EquipmentForm from '@/components/views/EquipmentForm';
import { use } from 'react';
import { useSearchParams } from 'next/navigation';

export default function EditEquipmentPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    // Página de edição/visualização de equipamento:
    // - `params.id` identifica o equipamento
    // - querystring `readOnly=true` ativa o modo somente leitura
    const searchParams = useSearchParams();
    const readOnly = searchParams.get('readOnly') === 'true';

    return <EquipmentForm equipmentId={resolvedParams.id} readOnly={readOnly} />;
}
