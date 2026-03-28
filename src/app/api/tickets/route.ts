import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { SupportTicket } from "@/types";
import { withAuth } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

const TICKET_SELECT = sql`
    SELECT
        t.id,
        t.tenant_id as "tenantId",
        t.client_id as "clientId",
        COALESCE(t.client_name, 'Cliente Desconhecido') as "clientName",
        t.requester_id as "requesterId",
        t.requester_name as "requesterName",
        t.subject,
        t.description,
        t.category,
        t.priority,
        t.status,
        t.solution,
        t.service_type as "serviceType",
        t.image_url as "imageUrl",
        to_char(t.created_at, 'DD/MM/YYYY HH24:MI:SS') as "createdAt",
        to_char(t.updated_at, 'DD/MM/YYYY HH24:MI:SS') as "updatedAt",
        to_char(t.closed_at, 'DD/MM/YYYY HH24:MI:SS') as "closedAt",
        COALESCE(t.tasks, '[]'::jsonb) as tasks,
        COALESCE(t.comments, '[]'::jsonb) as comments
    FROM support_tickets t
`;

export const GET = withAuth(async (_request, session) => {
    const result = await db.execute(sql`
        ${TICKET_SELECT}
        WHERE t.tenant_id = ${session.tenantId}
        ORDER BY t.created_at DESC
    `);

    return NextResponse.json(result.rows);
});

export const POST = withAuth(async (request, session) => {
    const body = (await request.json()) as SupportTicket;

    if (!body.clientId || !body.subject || !body.description) {
        return NextResponse.json(
            { message: "Campos obrigatórios faltando: clientId, subject e description." },
            { status: 400 },
        );
    }

    const clientCheck = await db.execute(sql`
        SELECT id FROM clients
        WHERE tenant_id = ${session.tenantId} AND id = ${body.clientId}
        LIMIT 1
    `);

    if (clientCheck.rows.length === 0) {
        return NextResponse.json(
            { message: "Cliente não encontrado para este tenant." },
            { status: 400 },
        );
    }

    const id = body.id && body.id.length > 0 ? body.id : crypto.randomUUID();

    const insertResult = await db.execute(sql`
        INSERT INTO support_tickets (
            id, tenant_id, client_id, client_name,
            requester_id, requester_name,
            subject, description, category, service_type,
            priority, status, solution, image_url,
            tasks, comments
        ) VALUES (
            ${id},
            ${session.tenantId},
            ${body.clientId},
            ${body.clientName ?? null},
            ${body.requesterId ?? session.id},
            ${body.requesterName ?? session.name},
            ${body.subject},
            ${body.description},
            ${body.category ?? null},
            ${body.serviceType ?? null},
            ${body.priority ?? "Normal"},
            ${body.status ?? "Open"},
            ${body.solution ?? null},
            ${body.imageUrl ?? null},
            ${JSON.stringify(body.tasks ?? [])}::jsonb,
            ${JSON.stringify(body.comments ?? [])}::jsonb
        )
        RETURNING id
    `);

    const insertedId = (insertResult.rows[0] as { id: string }).id;

    return NextResponse.json(
        { ...body, id: insertedId, tenantId: session.tenantId, status: body.status ?? "Open" },
        { status: 201 },
    );
});

export const PUT = withAuth(async (request, session) => {
    const body = (await request.json()) as Partial<SupportTicket>;

    if (!body.id) {
        return NextResponse.json({ message: "ID obrigatório" }, { status: 400 });
    }

    const existingResult = await db.execute(sql`
        SELECT subject, description, category, priority, status
        FROM support_tickets
        WHERE id = ${body.id} AND tenant_id = ${session.tenantId}
        LIMIT 1
    `);

    if (existingResult.rows.length === 0) {
        return NextResponse.json({ message: "Ticket não encontrado" }, { status: 404 });
    }

    type ExistingRow = {
        subject: string;
        description: string | null;
        category: string;
        priority: SupportTicket["priority"];
        status: SupportTicket["status"];
    };
    const existing = existingResult.rows[0] as ExistingRow;

    const priority =
        body.priority && ["Low", "Normal", "High", "Critical"].includes(body.priority)
            ? body.priority
            : existing.priority;

    const status =
        body.status && ["Open", "Pending", "Resolved", "Closed"].includes(body.status)
            ? body.status
            : existing.status;

    await db.execute(sql`
        UPDATE support_tickets SET
            subject = ${body.subject ?? existing.subject},
            description = ${body.description ?? existing.description},
            category = ${body.category ?? existing.category},
            priority = ${priority}::ticket_priority,
            status = ${status}::ticket_status,
            solution = ${body.solution ?? null},
            service_type = ${body.serviceType ?? null},
            image_url = ${body.imageUrl ?? null},
            tasks = ${JSON.stringify(body.tasks ?? [])}::jsonb,
            comments = ${JSON.stringify(body.comments ?? [])}::jsonb,
            updated_at = now()
        WHERE id = ${body.id} AND tenant_id = ${session.tenantId}
    `);

    const resultAfterUpdate = await db.execute(sql`
        ${TICKET_SELECT}
        WHERE t.id = ${body.id} AND t.tenant_id = ${session.tenantId}
        LIMIT 1
    `);

    return NextResponse.json(resultAfterUpdate.rows[0]);
});
