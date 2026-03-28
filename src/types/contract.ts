import { StatusHistory } from './common';

export type ContractStatus = 'Ativo' | 'Vencendo em Breve' | 'Atrasado' | 'Cancelado' | 'Em Renovação' | 'Vencido';
export type ContractType = 'Manutenção' | 'Locação' | 'Projeto Específico' | 'Licenciamento SaaS';

export interface ContractItem {
    id: string;
    description: string;
    quantity: number;
    unitValue: number;
}

export interface Contract {
    id: string;
    contractNumber: string;
    tenantId: string;
    clientId?: string | null;
    clientName: string;
    clientLogo: string;
    plan: string;
    type: ContractType;
    startDate: string;
    endDate: string;
    mrr: string;
    totalValue: string;
    implementationValue?: string;
    billingDay?: string;
    notes?: string | null;
    sellerId?: string | null;
    status: ContractStatus;
    legalText?: string;
    items: ContractItem[];
    statusHistory?: StatusHistory[];
}
