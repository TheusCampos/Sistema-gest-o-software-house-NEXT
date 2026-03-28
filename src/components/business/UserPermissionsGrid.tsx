import React from 'react';
import { UserPermissions, CRUDPermissions, User } from '@/types';

interface UserPermissionsGridProps {
    permissions: UserPermissions;
    role: User['role'];
    isReadOnly: boolean;
    onToggle: (module: keyof UserPermissions, action: keyof CRUDPermissions) => void;
    onToggleAll: (module: keyof UserPermissions) => void;
}

const moduleLabels: Record<keyof UserPermissions, string> = {
    clients: 'Base de Clientes',
    contracts: 'Gestão de Contratos',
    tickets: 'Tickets de Suporte',
    settings: 'Configurações do Sistema',
    equipment: 'Inventário de Equipamentos',
    sellers: 'Painel de Vendedores',
    appointments: 'Agendamentos',
    performance: 'Métricas e Desempenho'
};

export const UserPermissionsGrid: React.FC<UserPermissionsGridProps> = ({
    permissions,
    role,
    isReadOnly,
    onToggle,
    onToggleAll
}) => {
    if (role === 'admin' || role === 'desenvolvedor') {
        return (
            <div className="p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-2xl flex items-start gap-4">
                <span className="material-symbols-outlined text-amber-500 text-3xl mt-0.5">verified_user</span>
                <div>
                    <h4 className="text-base font-bold text-amber-800 dark:text-amber-400">Acesso de Administrador</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-500 mt-1 leading-relaxed">
                        Usuários com a função <strong>{role === 'admin' ? 'Administrador' : 'Desenvolvedor'}</strong> possuem acesso total a todos os módulos, não sendo necessário configurar permissões granulares.
                    </p>
                </div>
            </div>
        );
    }

    const isModuleFullAccess = (module: keyof UserPermissions) => {
        const p = permissions[module];
        return p.view && p.create && p.edit && p.delete;
    };

    return (
        <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">lock_person</span>
                    Permissões de Acesso
                </h4>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 uppercase tracking-wide">
                    Definição granular por módulo
                </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/50">
                    <div className="col-span-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Módulo</div>
                    <div className="col-span-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Ver</div>
                    <div className="col-span-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Criar</div>
                    <div className="col-span-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Editar</div>
                    <div className="col-span-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Excluir</div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(Object.keys(permissions) as Array<keyof UserPermissions>).map((module) => (
                        <div key={module} className="grid grid-cols-12 gap-2 p-4 items-center hover:bg-white dark:hover:bg-slate-800 transition-colors">
                            <div className="col-span-4">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{moduleLabels[module]}</p>
                                <button
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() => onToggleAll(module)}
                                    className="text-[10px] font-bold text-primary hover:underline disabled:opacity-50 disabled:no-underline uppercase tracking-wide mt-1"
                                >
                                    {isModuleFullAccess(module) ? 'Remover Todos' : 'Selecionar Todos'}
                                </button>
                            </div>
                            {(['view', 'create', 'edit', 'delete'] as const).map((action) => (
                                <div key={action} className="col-span-2 flex justify-center">
                                    <label className="relative flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="peer sr-only"
                                            disabled={isReadOnly}
                                            checked={permissions[module][action]}
                                            onChange={() => onToggle(module, action)}
                                        />
                                        <div className={`w-6 h-6 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                            <span className="material-symbols-outlined text-white text-[16px] scale-0 peer-checked:scale-100 transition-transform">check</span>
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
