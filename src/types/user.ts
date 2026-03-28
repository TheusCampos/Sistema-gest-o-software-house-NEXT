import { UserPermissions } from './common';

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string;
    role: 'admin' | 'vendedor' | 'suporte' | 'desenvolvedor' | 'client' | 'technician';
    company?: string;
    tenantId?: string;
    avatar?: string | null;
    active?: boolean;
    permissions?: UserPermissions;
}
