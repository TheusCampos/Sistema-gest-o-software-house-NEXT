import { useState } from 'react';

/**
 * Hook reutilizável para controlar quais colunas estão visíveis em uma tabela.
 * Elimina o padrão duplicado em sellers, service-types, equipment, clients, etc.
 */
export function useColumnVisibility<T extends Record<string, boolean>>(initialColumns: T) {
    const [visibleColumns, setVisibleColumns] = useState<T>(initialColumns);

    const toggleColumn = (key: keyof T) => {
        setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const setColumn = (key: keyof T, value: boolean) => {
        setVisibleColumns(prev => ({ ...prev, [key]: value }));
    };

    return { visibleColumns, toggleColumn, setColumn };
}
