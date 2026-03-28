export type AppointmentStatus = 'Pendente' | 'Confirmado' | 'Concluído' | 'Cancelado' | 'No-show';
export type AppointmentType = 'Remoto' | 'Presencial';

export interface Appointment {
    id: string;
    tenantId: string;
    title: string;
    description?: string;
    date: string; // ISO String (Date + Time)
    durationHours: number;
    clientId?: string;
    clientName?: string;
    technicianId?: string; // ID do técnico/responsável
    technicianName?: string;
    ticketId?: string; // ID do Ticket (opcional)
    type: AppointmentType;
    status: AppointmentStatus;
    active: boolean; // Para exclusão lógica
    location?: string; // Link de reunião ou endereço físico
    createdAt: string;
    color?: string;
}
