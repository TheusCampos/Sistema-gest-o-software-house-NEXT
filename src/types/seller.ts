export interface Seller {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    commissionImplementation: number;
    commissionMonthly: number;
    active: boolean;
}
