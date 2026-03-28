export interface CRUDPermissions {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
}

export type Module =
    | 'clients'
    | 'contracts'
    | 'tickets'
    | 'settings'
    | 'equipment'
    | 'sellers'
    | 'appointments'
    | 'performance';

export type UserPermissions = Record<Module, CRUDPermissions>;

export interface Metric {
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down';
    icon: string;
    color: string;
}

export interface StatusHistory {
    status: string;
    date: string;
    reason?: string;
    author: string;
}
