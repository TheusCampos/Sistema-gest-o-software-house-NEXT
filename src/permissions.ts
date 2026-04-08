import { UserPermissions, CRUDPermissions } from './types';

const FULL: CRUDPermissions = {
    view: true,
    create: true,
    edit: true,
    delete: true,
};

const NONE: CRUDPermissions = {
    view: false,
    create: false,
    edit: false,
    delete: false,
};

export const EMPTY_PERMISSIONS: UserPermissions = {
    clients: NONE,
    contracts: NONE,
    tickets: NONE,
    settings: NONE,
    equipment: NONE,
    sellers: NONE,
    appointments: NONE,
    performance: NONE,
    templates: NONE,
    'service-types': NONE,
};

export const ADMIN_PERMISSIONS: UserPermissions = {
    clients: FULL,
    contracts: FULL,
    tickets: FULL,
    settings: FULL,
    equipment: FULL,
    sellers: FULL,
    appointments: FULL,
    performance: FULL,
    templates: FULL,
    'service-types': FULL,
};

export const DEFAULT_PERMISSIONS: UserPermissions = {
    clients: { ...NONE, view: true },
    contracts: NONE,
    tickets: { ...FULL, delete: false },
    settings: NONE,
    equipment: NONE,
    sellers: NONE,
    appointments: { ...NONE, view: true },
    performance: NONE,
    templates: { ...NONE, view: true },
    'service-types': { ...NONE, view: true },
};

export const VENDEDOR_PERMISSIONS: UserPermissions = {
    clients: { ...FULL, delete: false },
    contracts: FULL,
    tickets: NONE,
    settings: NONE,
    equipment: NONE,
    sellers: { ...FULL, delete: false },
    appointments: { ...FULL, delete: false },
    performance: { ...FULL, delete: false },
    templates: { ...FULL, delete: false },
    'service-types': { ...FULL, delete: false },
};

export const SUPORTE_PERMISSIONS: UserPermissions = {
    clients: { ...NONE, view: true },
    contracts: NONE,
    tickets: { ...FULL, delete: false },
    settings: NONE,
    equipment: { ...FULL, delete: false },
    sellers: NONE,
    appointments: { ...FULL, delete: false },
    performance: NONE,
    templates: { ...NONE, view: true },
    'service-types': { ...NONE, view: true },
};

export const CLIENT_PERMISSIONS: UserPermissions = {
    clients: NONE,
    contracts: NONE,
    tickets: { ...NONE, view: true, create: true },
    settings: NONE,
    equipment: NONE,
    sellers: NONE,
    appointments: { ...NONE, view: true, create: true },
    performance: NONE,
    templates: { ...NONE, view: true },
    'service-types': { ...NONE, view: true },
};

export const TECHNICIAN_PERMISSIONS: UserPermissions = {
    clients: { ...NONE, view: true },
    contracts: NONE,
    tickets: { ...FULL, delete: false },
    settings: NONE,
    equipment: { ...FULL, delete: false },
    sellers: NONE,
    appointments: { ...FULL, delete: false },
    performance: NONE,
    templates: { ...NONE, view: true },
    'service-types': { ...NONE, view: true },
};

export const PERMISSIONS_TEMPLATES: Record<string, UserPermissions> = {
    admin: ADMIN_PERMISSIONS,
    desenvolvedor: ADMIN_PERMISSIONS,
    vendedor: VENDEDOR_PERMISSIONS,
    suporte: SUPORTE_PERMISSIONS,
    client: CLIENT_PERMISSIONS,
    technician: TECHNICIAN_PERMISSIONS,
};
