import React from 'react';
import Link from 'next/link';
import { User } from '@/types';

interface UserListTableProps {
    users: User[];
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onDelete: (user: User) => void;
    isLoading: boolean;
}

export const UserListTable: React.FC<UserListTableProps> = ({
    users,
    searchTerm,
    onSearchChange,
    onDelete,
    isLoading
}) => {
    const filteredUsers = users.filter(
        (u) =>
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden shadow-slate-200/50 dark:shadow-none">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-4 bg-white dark:bg-slate-900">
                <div className="relative flex-1 max-w-md">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        search
                    </span>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Buscar por nome ou e-mail..."
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                {isLoading ? (
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
                                    Nenhum usuário encontrado.
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
                                                    <Link
                                                        href={`/pages/users/${user.id}?readOnly=true`}
                                                        className="p-2 text-slate-400 hover:text-primary transition-colors flex items-center justify-center"
                                                        title="Visualizar"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">
                                                            visibility
                                                        </span>
                                                    </Link>
                                                    <Link
                                                        href={`/pages/users/${user.id}`}
                                                        className="p-2 text-slate-400 hover:text-amber-500 transition-colors flex items-center justify-center"
                                                        title="Editar"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">
                                                            edit
                                                        </span>
                                                    </Link>
                                                    <button
                                                        onClick={() => onDelete(user)}
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
    );
};
