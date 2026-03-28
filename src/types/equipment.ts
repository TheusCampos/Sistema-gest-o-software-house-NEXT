export type EquipmentType = 'Desktop' | 'Server' | 'Notebook' | 'VM';
export type EquipmentStatus = 'Ativo' | 'Inativo' | 'Em Manutenção' | 'Descartado';

export interface Equipment {
    id: string;
    tenantId: string;
    name: string;
    type: EquipmentType;
    status: EquipmentStatus;
    registrationDate: string;
    responsible: string;
    notes?: string | null;
    active: boolean;

    // Campos físicos (Desktop, Server, Notebook)
    location?: string | null;
    brand?: string | null;
    model?: string | null;
    serialNumber?: string | null;
    processor?: string | null;
    ram?: string | null;
    storage?: string | null;
    os?: string | null;
    ipAddress?: string | null;
    port?: string | null;
    purchaseDate?: string | null;

    // Campos específicos de VM
    hostId?: string | null;
    hypervisor?: string | null;
    vCpu?: string | null;
    vRam?: string | null;
    vStorage?: string | null;
    provisioningDate?: string | null;
}
