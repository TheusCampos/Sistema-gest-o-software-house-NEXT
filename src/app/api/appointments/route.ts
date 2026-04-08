import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { Appointment } from "@/types";
import { withAuth } from "@/lib/api-wrapper";
import { checkModulePermission } from "@/lib/security";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (_request, session) => {
    const permissionError = await checkModulePermission(session, 'appointments', 'view');
    if (permissionError) return permissionError;

    const result = await db.execute(sql`
        SELECT
            id,
            tenant_id as "tenantId",
            title,
            description,
            date,
            duration_hours::float8 as "durationHours",
            client_id as "clientId",
            client_name as "clientName",
            technician_id as "technicianId",
            technician_name as "technicianName",
            ticket_id as "ticketId",
            type,
            status,
            active,
            location,
            color,
            created_at as "createdAt"
        FROM appointments
        WHERE tenant_id = ${session.tenantId} AND active = true
        ORDER BY date ASC
    `);

    return NextResponse.json(result.rows ?? []);
});

export const POST = withAuth(async (request, session) => {
    const permissionError = await checkModulePermission(session, 'appointments', 'create');
    if (permissionError) return permissionError;

    const body = (await request.json()) as Partial<Appointment>;

    if (!body.title || !body.date) {
        return NextResponse.json(
            { message: "Campos obrigatórios: title e date." },
            { status: 400 },
        );
    }

    const id = crypto.randomUUID();

    await db.execute(sql`
        INSERT INTO appointments (
            id, tenant_id, title, description, date, duration_hours,
            client_id, client_name, technician_id, technician_name,
            ticket_id, type, status, active, location, color
        ) VALUES (
            ${id},
            ${session.tenantId},
            ${body.title},
            ${body.description ?? null},
            ${body.date},
            ${body.durationHours ?? 1},
            ${body.clientId ?? null},
            ${body.clientName ?? null},
            ${body.technicianId ?? null},
            ${body.technicianName ?? null},
            ${body.ticketId ?? null},
            ${body.type ?? "Remoto"},
            ${body.status ?? "Pendente"},
            ${body.active ?? true},
            ${body.location ?? null},
            ${body.color ?? "bg-blue-100 text-blue-800 border-blue-200"}
        )
    `);

    return NextResponse.json(
        { ...body, id, tenantId: session.tenantId },
        { status: 201 },
    );
});

export const PUT = withAuth(async (request, session) => {
    const permissionError = await checkModulePermission(session, 'appointments', 'edit');
    if (permissionError) return permissionError;

    const body = (await request.json()) as Appointment;

    if (!body.id) {
        return NextResponse.json(
            { message: "Campo obrigatório: id." },
            { status: 400 },
        );
    }

    await db.execute(sql`
        UPDATE appointments SET
            title = ${body.title},
            description = ${body.description ?? null},
            date = ${body.date},
            duration_hours = ${body.durationHours ?? 1},
            client_id = ${body.clientId ?? null},
            client_name = ${body.clientName ?? null},
            technician_id = ${body.technicianId ?? null},
            technician_name = ${body.technicianName ?? null},
            ticket_id = ${body.ticketId ?? null},
            type = ${body.type ?? "Remoto"},
            status = ${body.status ?? "Pendente"},
            active = ${body.active ?? true},
            location = ${body.location ?? null},
            color = ${body.color ?? "bg-blue-100 text-blue-800 border-blue-200"},
            updated_at = now()
        WHERE id = ${body.id}
          AND tenant_id = ${session.tenantId}
    `);

    return NextResponse.json({ ...body, tenantId: session.tenantId });
});

export const DELETE = withAuth(async (request, session) => {
    const permissionError = await checkModulePermission(session, 'appointments', 'delete');
    if (permissionError) return permissionError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json(
            { message: "Campo obrigatório: id." },
            { status: 400 },
        );
    }

    await db.execute(sql`
        UPDATE appointments SET
            active = false,
            updated_at = now()
        WHERE id = ${id}
          AND tenant_id = ${session.tenantId}
    `);

    return NextResponse.json({ id, active: false });
});
