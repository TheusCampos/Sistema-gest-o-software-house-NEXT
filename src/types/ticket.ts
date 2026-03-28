export interface SupportTask {
    id: string;
    ticketId: string;
    title: string;
    assignee: string;
    dueDate: string;
    status: 'Pending' | 'In Progress' | 'Done';
}

export interface SupportComment {
    id: string;
    author: string;
    role: string;
    content: string;
    createdAt: string;
    isInternal: boolean;
}

export interface SupportTicket {
    id: string;
    tenantId: string;
    clientId: string;
    clientName: string;
    requesterId?: string | null;
    requesterName?: string | null;
    subject: string;
    description?: string | null;
    solution?: string | null;
    category: string;
    serviceType: string;
    priority: 'Low' | 'Normal' | 'High' | 'Critical';
    status: 'Open' | 'Pending' | 'Resolved' | 'Closed';
    createdAt: string;
    updatedAt: string;
    closedAt?: string | null;
    tasks?: SupportTask[];
    comments?: SupportComment[];
    imageUrl?: string | null;
}
