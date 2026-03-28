"use client";

import React, { useState } from "react";
import { User, UserPermissions, CRUDPermissions } from "@/types";
import { EMPTY_PERMISSIONS, PERMISSIONS_TEMPLATES } from "@/permissions";
import { useApp } from "@/context/AppContext";
import { UserPermissionsGrid } from "@/components/business/UserPermissionsGrid";
import StatCard from "@/components/composite/StatCard";

export default function UsersPage() {
  // Usuário logado e ações globais
  const {
    currentUser,
    users,
    fetchUsers,
    saveUser,
    removeUser,
    isUsersLoading,
  } = useApp();

  // Modal de criar/editar/visualizar usuário
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Busca por nome/email
  const [searchTerm, setSearchTerm] = useState("");

  // ID em edição (quando não nulo)
  const [editingId, setEditingId] = useState<string | null>(null);
  // Quando true, modal fica somente leitura
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Modal de exclusão lógica: marca active=false
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    userId: string | null;
    userName: string;
  }>({
    isOpen: false,
    userId: null,
    userName: "",
  });
  // Motivo obrigatório para desativação
  const [deleteReason, setDeleteReason] = useState("");

  // Carrega usuários ao montar do tenant atual
  React.useEffect(() => {
    if (!currentUser?.tenantId) return;
    fetchUsers(currentUser.tenantId);
  }, [currentUser, fetchUsers]);

  // Estado do formulário do usuário
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "technician" as User["role"],
    active: true,
    permissions: JSON.parse(
      JSON.stringify(EMPTY_PERMISSIONS),
    ) as UserPermissions,
  });

  // Apenas testando o arquivo para formatar
  const metrics = {
    total: users.length,
    active: users.filter((u) => u.active).length,
    inactive: users.filter((u) => !u.active).length,
    admins: users.filter((u) => u.role === "admin" && u.active).length,
  };

  const metricCards = [
    { title: "Total Usuários", value: metrics.total, icon: "groups", color: "#136dec" },
    { title: "Acessos Ativos", value: metrics.active, icon: "verified", color: "#10b981" },
    { title: "Excluídos / Bloqueados", value: metrics.inactive, icon: "lock", color: "#ef4444" },
    { title: "Administradores", value: metrics.admins, icon: "admin_panel_settings", color: "#8b5cf6" },
  ];

  // Prepara o modal carregando dados de um usuário existente ou inicializando vazio
  const prepareModal = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        name: user.name,
        email: user.email,
        password: user.password || "",
        role: user.role,
        active: user.active ?? true,
        permissions: user.permissions
          ? JSON.parse(JSON.stringify(user.permissions))
          : PERMISSIONS_TEMPLATES[user.role] || EMPTY_PERMISSIONS,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        email: "",
        password: "123456",
        role: "technician",
        active: true,
        permissions: JSON.parse(JSON.stringify(EMPTY_PERMISSIONS)),
      });
    }
    setIsModalOpen(true);
  };

  // Cria novo usuário
  const handleNewUser = () => {
    setIsReadOnly(false);
    prepareModal();
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as User["role"];
    setFormData({
      ...formData,
      role: newRole,
      permissions: JSON.parse(
        JSON.stringify(PERMISSIONS_TEMPLATES[newRole] || EMPTY_PERMISSIONS),
      ),
    });
  };

  // Visualiza usuário (somente leitura)
  const handleView = (user: User) => {
    setIsReadOnly(true);
    prepareModal(user);
  };

  // Edita usuário
  const handleEdit = (user: User) => {
    setIsReadOnly(false);
    prepareModal(user);
  };

  // Abre modal de exclusão lógica
  const handleDeleteClick = (user: User) => {
    setDeleteReason("");
    setDeleteModal({
      isOpen: true,
      userId: user.id,
      userName: user.name,
    });
  };

  // Confirma exclusão lógica (active=false) quando motivo tem tamanho mínimo
  const confirmDelete = async () => {
    if (deleteModal.userId && deleteReason.trim().length >= 10) {
      try {
        if (!currentUser?.tenantId) {
          alert("Sessão inválida. Faça login novamente.");
          return;
        }
        await removeUser(deleteModal.userId, currentUser.tenantId);
        setDeleteModal({ isOpen: false, userId: null, userName: "" });
      } catch {
        alert("Erro ao excluir usuário");
      }
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, userId: null, userName: "" });
  };

  // Salva (cria/atualiza) usuário; para admin, força permissões totais
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!currentUser?.tenantId) {
      alert("Sessão inválida. Faça login novamente.");
      return;
    }
    const finalPermissions =
      formData.role === "admin" || formData.role === "desenvolvedor"
        ? PERMISSIONS_TEMPLATES["admin"]
        : formData.permissions;

    try {
      const payload: User = {
        id: editingId || crypto.randomUUID(),
        tenantId: currentUser.tenantId,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`,
        ...formData,
        permissions: finalPermissions,
      };

      await saveUser(payload);
      setIsModalOpen(false);
    } catch {
      alert("Erro ao salvar usuário");
    }
  };

  // Alterna permissão específica de um módulo (view/create/edit/delete)
  const togglePermission = (
    module: keyof UserPermissions,
    action: keyof CRUDPermissions,
  ) => {
    if (
      isReadOnly ||
      formData.role === "admin" ||
      formData.role === "desenvolvedor"
    )
      return;
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [action]: !prev.permissions[module][action],
        },
      },
    }));
  };

  // Alterna "tudo" para um módulo
  const toggleModuleAll = (module: keyof UserPermissions) => {
    if (
      isReadOnly ||
      formData.role === "admin" ||
      formData.role === "desenvolvedor"
    )
      return;

    const isCurrentlyAll =
      formData.permissions[module].view &&
      formData.permissions[module].create &&
      formData.permissions[module].edit &&
      formData.permissions[module].delete;

    const newValue = !isCurrentlyAll;

    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          view: newValue,
          create: newValue,
          edit: newValue,
          delete: newValue,
        },
      },
    }));
  };

  // Filtra usuários ativos pelo termo de busca
  const filteredUsers = users.filter(
    (u) =>
      u.active &&
      (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-wrap justify-between items-end gap-3 px-4">
        <div className="flex flex-col gap-2">
          <p className="text-slate-900 dark:text-slate-50 text-4xl font-black leading-tight">
            Usuários e Permissões
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-base font-normal">
            Controle quem acessa a plataforma e seus níveis de privilégio.
          </p>
        </div>
        <button
          onClick={handleNewUser}
          className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-xl h-12 px-6 bg-primary text-white text-sm font-bold shadow-md hover:bg-blue-700 transition-all gap-2 active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Novo Usuário
        </button>
      </div>

      <div className="px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((card, idx) => (
            <StatCard
              key={idx}
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
              index={idx}
            />
          ))}
        </div>
      </div>

      <div className="px-4 overflow-x-auto pb-12">
        <div className="min-w-full inline-block align-middle">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden shadow-slate-200/50 dark:shadow-none">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-4 bg-white dark:bg-slate-900">
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  search
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome ou e-mail..."
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {isUsersLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <span className="material-symbols-outlined animate-spin text-primary text-5xl">
                    sync
                  </span>
                  <p className="text-slate-500 font-bold animate-pulse">
                    Carregando usuários...
                  </p>
                </div>
              ) : (
                <>
                  {filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <span className="material-symbols-outlined text-slate-300 text-6xl">
                        person_off
                      </span>
                      <p className="text-slate-500 font-bold font-mono">
                        Nenhum usuário ativo encontrado.
                      </p>
                      <p className="text-xs text-slate-400">
                        Total carregado: {users.length}
                      </p>
                    </div>
                  ) : (
                    <table className="w-full flex flex-col relative bg-white dark:bg-slate-900 text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-20 shadow-sm hidden md:flex w-full border-b border-slate-200 dark:border-slate-800">
                        <tr className="flex w-full items-center">
                          <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 flex-[2]">
                            Usuário
                          </th>
                          <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 text-center flex-1">
                            Função
                          </th>
                          <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 text-center w-40 shrink-0">
                            Status
                          </th>
                          <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 text-center flex-1">
                            Acesso Resumido
                          </th>
                          <th className="px-8 py-6 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest leading-4 w-32 shrink-0">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="flex flex-col w-full divide-y divide-slate-100 dark:divide-slate-800 relative">
                        {filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group flex flex-col md:flex-row items-start md:items-center border-b border-slate-100 dark:border-slate-800 p-4 md:p-0"
                          >
                            <td className="px-0 md:px-8 py-2 md:py-[6px] flex-[2] w-full md:w-auto">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 bg-cover bg-center border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
                                  style={{
                                    backgroundImage: `url('${user.avatar}')`,
                                  }}
                                ></div>
                                <div className="overflow-hidden">
                                  <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tighter truncate">
                                    {user.name}
                                  </p>
                                  <p className="text-[10px] text-slate-500 lowercase opacity-70 truncate">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-0 md:px-8 py-2 md:py-[6px] flex-1 w-full md:w-auto text-left md:text-center">
                              <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                                Função
                              </span>
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black capitalize tracking-wide
                                            ${
                                              user.role === "admin" ||
                                              user.role === "desenvolvedor"
                                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                : user.role === "suporte"
                                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                                  : user.role === "vendedor"
                                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                                    : user.role === "technician"
                                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                            }`}
                              >
                                {user.role === "admin" && (
                                  <span className="material-symbols-outlined text-[14px]">
                                    security
                                  </span>
                                )}
                                {user.role === "desenvolvedor" && (
                                  <span className="material-symbols-outlined text-[14px]">
                                    code
                                  </span>
                                )}
                                {user.role}
                              </span>
                            </td>
                            <td className="absolute top-4 right-4 md:static px-0 md:px-8 py-0 md:py-[6px] w-auto md:w-40 md:shrink-0 text-center flex items-center justify-center">
                              <span
                                className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] font-black tracking-wide
                                            ${user.active ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : "text-slate-500 bg-slate-100 dark:bg-slate-800"}`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${user.active ? "bg-emerald-500" : "bg-slate-400"}`}
                                ></span>
                                {user.active ? "Ativo" : "Inativo"}
                              </span>
                            </td>
                            <td className="px-0 md:px-8 py-2 md:py-[6px] flex-1 w-full md:w-auto">
                              <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                                Acessos
                              </span>
                              <div className="flex gap-2 md:justify-center">
                                {user.role === "admin" ||
                                user.role === "desenvolvedor" ? (
                                  <span
                                    title="Acesso Total"
                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">
                                      security
                                    </span>
                                  </span>
                                ) : (
                                  <>
                                    {user.permissions?.clients.view && (
                                      <span
                                        title="Clientes"
                                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary transition-colors"
                                      >
                                        <span className="material-symbols-outlined text-[16px]">
                                          groups
                                        </span>
                                      </span>
                                    )}
                                    {user.permissions?.contracts.view && (
                                      <span
                                        title="Contratos"
                                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary transition-colors"
                                      >
                                        <span className="material-symbols-outlined text-[16px]">
                                          description
                                        </span>
                                      </span>
                                    )}
                                    {user.permissions?.tickets.view && (
                                      <span
                                        title="Tickets"
                                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary transition-colors"
                                      >
                                        <span className="material-symbols-outlined text-[16px]">
                                          confirmation_number
                                        </span>
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-0 md:px-8 py-2 md:py-[6px] w-full md:w-32 md:shrink-0 text-right flex items-center justify-end">
                              <div className="flex items-center justify-end gap-1 w-full">
                                <button
                                  onClick={() => handleView(user)}
                                  className="p-2 text-slate-400 hover:text-primary transition-colors"
                                  title="Visualizar"
                                >
                                  <span className="material-symbols-outlined text-[20px]">
                                    visibility
                                  </span>
                                </button>
                                <button
                                  onClick={() => handleEdit(user)}
                                  className="p-2 text-slate-400 hover:text-amber-500 transition-colors"
                                  title="Editar"
                                >
                                  <span className="material-symbols-outlined text-[20px]">
                                    edit
                                  </span>
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(user)}
                                  className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                                  title="Excluir"
                                >
                                  <span className="material-symbols-outlined text-[20px]">
                                    delete
                                  </span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-dropIn">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                  <span className="material-symbols-outlined text-primary">
                    manage_accounts
                  </span>
                  {isReadOnly
                    ? "Detalhes do Usuário"
                    : editingId
                      ? "Editar Usuário & Permissões"
                      : "Novo Cadastro de Usuário"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <span className="material-symbols-outlined text-[24px]">
                    close
                  </span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <form id="userForm" onSubmit={handleSave} className="space-y-8">
                  {/* Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                        Nome Completo
                      </label>
                      <input
                        required
                        disabled={isReadOnly}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none text-base font-bold transition-all"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Ex: João da Silva"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                        E-mail de Acesso
                      </label>
                      <input
                        required
                        disabled={isReadOnly}
                        type="email"
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none text-base font-bold transition-all"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="email@empresa.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                        Função (Role)
                      </label>
                      <select
                        disabled={isReadOnly}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none custom-select-arrow appearance-none text-base font-bold transition-all"
                        value={formData.role}
                        onChange={handleRoleChange}
                      >
                        <option value="admin">
                          Administrador (Acesso Total)
                        </option>
                        <option value="desenvolvedor">
                          Desenvolvedor (Acesso Total Técnico)
                        </option>
                        <option value="suporte">Agente de Suporte</option>
                        <option value="vendedor">Vendedor</option>
                        <option value="technician">
                          Técnico Genérico / Setor Interno
                        </option>
                        <option value="client">Cliente Externo</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                        Senha de Acesso{" "}
                        {editingId ? "(opcional na edição)" : ""}
                      </label>
                      <input
                        required={!editingId}
                        disabled={isReadOnly}
                        type="password"
                        title="Mínimo 6 caracteres"
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none text-base font-bold transition-all"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder={
                          editingId ? "Deixe em branco para manter" : "••••••••"
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                        Status da Conta
                      </label>
                      <select
                        disabled={isReadOnly}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none custom-select-arrow appearance-none text-base font-bold transition-all"
                        value={formData.active ? "true" : "false"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            active: e.target.value === "true",
                          })
                        }
                      >
                        <option value="true">Ativo</option>
                        <option value="false">Inativo / Bloqueado</option>
                      </select>
                    </div>
                  </div>

                  <UserPermissionsGrid
                    permissions={formData.permissions}
                    role={formData.role}
                    isReadOnly={isReadOnly}
                    onToggle={togglePermission}
                    onToggleAll={toggleModuleAll}
                  />
                </form>
              </div>

              <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-[2rem]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  {isReadOnly ? "Fechar" : "Cancelar"}
                </button>
                {!isReadOnly && (
                  <button
                    type="submit"
                    form="userForm"
                    className="px-8 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors active:scale-95"
                  >
                    Salvar Usuário
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-dropIn">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Confirmar Exclusão
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase font-black mt-1 tracking-widest">
                    Protocolo de segurança
                  </p>
                </div>
                <button
                  onClick={cancelDelete}
                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl"
                >
                  <span className="material-symbols-outlined text-[24px]">
                    close
                  </span>
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center ring-4 ring-rose-50 dark:ring-rose-900/10">
                    <span className="material-symbols-outlined text-4xl text-rose-600 dark:text-rose-400 filled">
                      delete
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">
                    Você está prestes a excluir o acesso de <br />
                    <strong className="text-slate-900 dark:text-white">
                      {deleteModal.userName}
                    </strong>
                    .
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                    Motivo da Exclusão <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full h-24 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 text-sm font-medium outline-none focus:ring-4 focus:ring-rose-500/10 resize-none transition-all shadow-inner"
                    placeholder="Justifique a exclusão..."
                  />
                  <div className="flex justify-end">
                    <p
                      className={`text-[10px] font-bold ${deleteReason.trim().length >= 10 ? "text-emerald-500" : "text-slate-400"}`}
                    >
                      {deleteReason.trim().length}/10
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  disabled={deleteReason.trim().length < 10}
                  onClick={confirmDelete}
                  className="flex-[2] py-4 bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-rose-600/30 hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>Confirmar Exclusão</span>
                  <span className="material-symbols-outlined text-[18px]">
                    delete
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dropIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-dropIn { animation: dropIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}
