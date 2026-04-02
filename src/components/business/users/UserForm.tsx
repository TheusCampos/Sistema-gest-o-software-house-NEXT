import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, UserPermissions, CRUDPermissions } from "@/types";
import { EMPTY_PERMISSIONS, PERMISSIONS_TEMPLATES } from "@/permissions";
import { UserPermissionsGrid } from "@/components/business/UserPermissionsGrid";
import { userSchema, UserFormData } from "@/resources/users/schemas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

interface UserFormProps {
  onSave: (data: User) => Promise<void>;
  editingUser?: User | null;
  isReadOnly?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  onSave,
  editingUser,
  isReadOnly = false,
}) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(editingUser?.avatar || null);
  const { currentUser: authUser, updateCurrentUser } = useAuthStore();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "technician",
      active: true,
      permissions: JSON.parse(JSON.stringify(EMPTY_PERMISSIONS)),
    },
  });

  const formData = watch();

  useEffect(() => {
    if (editingUser) {
      setAvatarBase64(editingUser.avatar || null);
      reset({
        name: editingUser.name,
        email: editingUser.email,
        password: "", // Não carregar senha por segurança
        role: editingUser.role,
        active: editingUser.active ?? true,
        permissions: editingUser.permissions
          ? JSON.parse(JSON.stringify(editingUser.permissions))
          : PERMISSIONS_TEMPLATES[editingUser.role] || EMPTY_PERMISSIONS,
      });
    } else {
      setAvatarBase64(null);
      reset({
        name: "",
        email: "",
        password: "123456", // Senha padrão para novos usuários
        role: "technician",
        active: true,
        permissions: JSON.parse(JSON.stringify(EMPTY_PERMISSIONS)),
      });
    }
  }, [editingUser, reset]);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as User["role"];
    setValue("role", newRole);
    setValue("permissions", JSON.parse(
        JSON.stringify(PERMISSIONS_TEMPLATES[newRole] || EMPTY_PERMISSIONS)
    ));
  };

  const togglePermission = (
    module: keyof UserPermissions,
    action: keyof CRUDPermissions,
  ) => {
    if (isReadOnly || formData.role === "admin" || formData.role === "desenvolvedor") return;
    
    const currentPermissions = { ...formData.permissions };
    currentPermissions[module] = {
      ...currentPermissions[module],
      [action]: !currentPermissions[module][action],
    };
    setValue("permissions", currentPermissions);
  };

  const toggleModuleAll = (module: keyof UserPermissions) => {
    if (isReadOnly || formData.role === "admin" || formData.role === "desenvolvedor") return;

    const isCurrentlyAll =
      formData.permissions[module].view &&
      formData.permissions[module].create &&
      formData.permissions[module].edit &&
      formData.permissions[module].delete;

    const newValue = !isCurrentlyAll;
    const currentPermissions = { ...formData.permissions };
    currentPermissions[module] = {
      view: newValue,
      create: newValue,
      edit: newValue,
      delete: newValue,
    };
    setValue("permissions", currentPermissions);
  };

  const onFormSubmit = async (data: UserFormData) => {
    if (isReadOnly) return;

    const finalPermissions =
      data.role === "admin" || data.role === "desenvolvedor"
        ? PERMISSIONS_TEMPLATES["admin"]
        : data.permissions;

    const payload: User = {
      id: editingUser?.id || crypto.randomUUID(),
      tenantId: editingUser?.tenantId || "", // Será preenchido pelo store/page
      avatar: avatarBase64 || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
      ...data,
      permissions: finalPermissions,
    };

    // Se senha estiver vazia na edição, não enviar para não sobrescrever
    if (editingUser && !data.password) {
      delete payload.password;
    }

    try {
      await onSave(payload);
      
      // Se estiver editando o PRÓPRIO perfil, atualiza a sessão local
      if (authUser && authUser.id === payload.id) {
        updateCurrentUser({
          name: payload.name,
          avatar: payload.avatar,
          role: payload.role // Caso o role mude mas ele continue admin/dev
        });
      }

      router.push("/pages/users");
    } catch (error: any) {
      console.error("Erro ao salvar usuário:", error);
      const apiMessage = error.response?.data?.message || error.message || "Erro desconhecido";
      alert("Erro ao salvar usuário: " + apiMessage);
    }
  };

  return (
    <div className="w-full max-w-[1000px] mx-auto flex flex-col gap-6 animate-fadeIn pb-12">
      <nav className="flex items-center gap-2 text-sm px-2">
        <Link href="/dashboard" className="text-[#4c6c9a] dark:text-slate-400 hover:text-primary font-medium">Dashboard</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link href="/pages/users" className="text-[#4c6c9a] dark:text-slate-400 hover:text-primary font-medium">Usuários</Link>
        <span className="text-primary font-bold">/ {editingUser ? (isReadOnly ? 'Visualizar' : 'Editar') : 'Novo'}</span>
      </nav>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-dropIn">
        <div className="p-4 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <span className="material-symbols-outlined text-primary">
              manage_accounts
            </span>
            {isReadOnly
              ? "Detalhes do Usuário"
              : editingUser
                ? "Editar Usuário & Permissões"
                : "Novo Cadastro de Usuário"}
          </h3>
          <Link
            href="/pages/users"
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl"
          >
            <span className="material-symbols-outlined text-[24px]">
              close
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <form id="userForm" onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
            <div className="flex flex-col md:flex-row items-center gap-8 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
               <div className="relative group">
                  <div 
                    className="w-32 h-32 rounded-[2.5rem] bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden flex items-center justify-center bg-cover bg-center"
                  >
                    {avatarBase64 ? (
                        <img src={avatarBase64} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                         <span className="material-symbols-outlined text-slate-400 text-3xl font-light">add_a_photo</span>
                    )}
                  </div>
                  {!isReadOnly && (
                    <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]">
                      <span className="text-white text-[10px] font-black uppercase tracking-widest">Alterar Foto</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    </label>
                  )}
               </div>
               <div className="flex-1">
                  <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-tight text-xl mb-1">Foto do Perfil</h4>
                  <p className="text-slate-500 text-sm">Clique na moldura para selecionar uma imagem do seu computador.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                  Nome Completo
                </label>
                <input
                  {...register("name")}
                  disabled={isReadOnly}
                  className={`w-full rounded-2xl border ${errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800 px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none text-base font-bold transition-all`}
                  placeholder="Ex: João da Silva"
                />
                {errors.name && <p className="text-red-500 text-[10px] ml-1">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                  E-mail de Acesso
                </label>
                <input
                  {...register("email")}
                  disabled={isReadOnly}
                  type="email"
                  className={`w-full rounded-2xl border ${errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800 px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none text-base font-bold transition-all`}
                  placeholder="email@empresa.com"
                />
                {errors.email && <p className="text-red-500 text-[10px] ml-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                  Função (Role)
                </label>
                <select
                  {...register("role")}
                  disabled={isReadOnly}
                  onChange={handleRoleChange}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none custom-select-arrow appearance-none text-base font-bold transition-all"
                >
                  <option value="admin">Administrador (Acesso Total)</option>
                  <option value="desenvolvedor">Desenvolvedor (Acesso Total Técnico)</option>
                  <option value="suporte">Agente de Suporte</option>
                  <option value="vendedor">Vendedor</option>
                  <option value="technician">Técnico Genérico / Setor Interno</option>
                  <option value="client">Cliente Externo</option>
                </select>
              </div>

              <div className="space-y-1 relative">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                  Senha de Acesso {editingUser ? "(opcional)" : ""}
                </label>
                <div className="relative">
                  <input
                    {...register("password")}
                    disabled={isReadOnly}
                    type={showPassword ? "text" : "password"}
                    className={`w-full rounded-2xl border ${errors.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800 px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none text-base font-bold transition-all pr-12`}
                    placeholder={editingUser ? "Deixe em branco para manter" : "••••••••"}
                  />
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  )}
                </div>
                {errors.password && <p className="text-red-500 text-[10px] ml-1">{errors.password.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                  Status da Conta
                </label>
                <select
                  disabled={isReadOnly}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none custom-select-arrow appearance-none text-base font-bold transition-all"
                  value={formData.active ? "true" : "false"}
                  onChange={(e) => setValue("active", e.target.value === "true")}
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

        <div className="p-4 sm:p-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-[2rem]">
          <Link
            href="/pages/users"
            className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center"
          >
            {isReadOnly ? "Voltar" : "Cancelar"}
          </Link>
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
  );
};
