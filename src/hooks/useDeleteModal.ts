import { useState } from 'react';

interface DeleteModalState {
    isOpen: boolean;
    itemId: string | null;
    itemName: string;
    reason: string;
}

const INITIAL_STATE: DeleteModalState = {
    isOpen: false,
    itemId: null,
    itemName: '',
    reason: '',
};

/**
 * Hook reutilizável para o modal de exclusão lógica com motivo obrigatório.
 * Elimina a duplicação de estado presente em sellers, service-types, users, etc.
 */
export function useDeleteModal() {
    const [deleteModal, setDeleteModal] = useState<DeleteModalState>(INITIAL_STATE);

    const openDeleteModal = (id: string, name: string) => {
        setDeleteModal({ isOpen: true, itemId: id, itemName: name, reason: '' });
    };

    const closeDeleteModal = () => {
        setDeleteModal(INITIAL_STATE);
    };

    const setReason = (reason: string) => {
        setDeleteModal(prev => ({ ...prev, reason }));
    };

    const isReasonValid = deleteModal.reason.trim().length >= 10;

    return {
        deleteModal,
        openDeleteModal,
        closeDeleteModal,
        setReason,
        isReasonValid,
    };
}
