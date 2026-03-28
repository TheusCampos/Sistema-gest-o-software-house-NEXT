export interface ServiceType {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    defaultSla: number;
    active: boolean;
    category: 'Suporte' | 'Consultoria' | 'Desenvolvimento' | 'Infraestrutura' | 'Implantação';
    image?: string;
    linkedTemplateId?: string;
}
