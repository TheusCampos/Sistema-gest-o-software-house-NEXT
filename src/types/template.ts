export interface ImplementationStep {
    id: string;
    label: string;
    required: boolean;
}

export interface ImplementationTemplate {
    id: string;
    tenantId: string;
    name: string;
    systemType: 'CRONOS' | 'ZEUS' | 'OUTROS';
    description: string;
    steps: ImplementationStep[];
    requiresBankConfig: boolean;
}
