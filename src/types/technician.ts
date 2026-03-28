export interface Technician {
    id: string;
    tenantId: string;
    name: string;
    role: string;
    avatar: string;
    assigned: number;
    resolved: number;
    avgResponse: string;
    compliance: number;
    score: number;
}
