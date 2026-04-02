"use client";

import React, { useState, useEffect } from "react";
import { User } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { useUsersStore } from "@/stores/usersStore";
import PageHeader from "@/components/composite/PageHeader";
import DeleteWithReasonModal from "@/components/composite/DeleteWithReasonModal";
import { useDeleteModal } from "@/hooks/useDeleteModal";

// Novos Componentes Modulares
import { UserMetrics } from "@/components/business/users/UserMetrics";
import { UserListTable } from "@/components/business/users/UserListTable";
import { UserFormModal } from "@/components/business/users/UserFormModal";

export default function UsersPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const {
    users,
    fetchUsers,
    saveUser,
    removeUser,
    isLoading: isUsersLoading,
  } = useUsersStore();

  const { deleteModal, openDeleteModal, closeDeleteModal, setReason, isReasonValid } = useDeleteModal();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Carrega usuários ao montar ou quando o tenantId mudar
  useEffect(() => {
    if (currentUser?.tenantId) {
      fetchUsers(currentUser.tenantId);
    }
  }, [currentUser?.tenantId, fetchUsers]);

  const handleNewUser = () => {
    setEditingUser(null);
    setIsReadOnly(false);
    setIsModalOpen(true);
  };

  const handleView = (user: User) => {
    setEditingUser(user);
    setIsReadOnly(true);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsReadOnly(false);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    openDeleteModal(user.id, user.name);
  };

  const confirmDelete = async () => {
    if (!deleteModal.itemId || !isReasonValid || !currentUser?.tenantId) return;
    try {
      await removeUser(deleteModal.itemId, currentUser.tenantId);
      closeDeleteModal();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      alert("Erro ao excluir usuário");
    }
  };

  const handleSave = async (payload: User) => {
    if (!currentUser?.tenantId) {
      alert("Sessão inválida. Faça login novamente.");
      return;
    }

    // Garantir que o tenantId esteja no payload
    const finalPayload = {
      ...payload,
      tenantId: currentUser.tenantId,
    };

    await saveUser(finalPayload);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader 
        title="Usuários e Permissões" 
        subtitle="Controle quem acessa a plataforma e seus níveis de privilégio."
      >
        <button
          onClick={handleNewUser}
          className="flex cursor-pointer items-center justify-center rounded-xl h-12 px-6 bg-primary text-white text-sm font-bold shadow-md hover:bg-blue-700 transition-all gap-2 active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Novo Usuário
        </button>
      </PageHeader>

      <UserMetrics users={users} />

      <div className="px-4 pb-12">
        <UserListTable 
          users={users}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          isLoading={isUsersLoading}
        />
      </div>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingUser={editingUser}
        isReadOnly={isReadOnly}
      />

      <DeleteWithReasonModal
        isOpen={deleteModal.isOpen}
        itemName={deleteModal.itemName}
        reason={deleteModal.reason}
        onReasonChange={setReason}
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
