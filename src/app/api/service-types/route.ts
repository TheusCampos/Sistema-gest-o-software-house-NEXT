import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { forbiddenResponse, SessionUser } from "@/lib/session";
import { withAuth } from "@/lib/api-wrapper";
import { checkModulePermission, getTenantFilter } from "@/lib/security";

export const dynamic = "force-dynamic";

interface ServiceTypePayload {
    name: string;
    description?: string;
    defaultSla: number;
    active: boolean;
    category: string;
    image?: string;
    linkedTemplateId?: string;
}



export const GET = withAuth(async (_request, session) => {
    const permissionError = await checkModulePermission(session, 'service-types', 'view');
    if (permissionError) return permissionError;

    const result = await db.execute(sql`
        SELECT
            id,
            tenant_id as "tenantId",
            name,
            COALESCE(description, '') as description,
            default_sla as "defaultSla",
            active,
            category,
            image,
            linked_template_id as "linkedTemplateId"
        FROM service_types t
        WHERE ${getTenantFilter(session)}
        ORDER BY name
    `);

    return NextResponse.json(result.rows ?? []);
});

export const POST = withAuth(async (request, session) => {
    const permissionError = await checkModulePermission(session, 'service-types', 'create');
    if (permissionError) return permissionError;

    const body = (await request.json()) as ServiceTypePayload;

    if (!body.name || !body.category) {
        return NextResponse.json(
            { message: "Campos obrigatórios: name e category." },
            { status: 400 },
        );
    }

    const id = `st-${crypto.randomUUID()}`;

    await db.execute(sql`
        INSERT INTO service_types (
            id, tenant_id, name, description,
            default_sla, active, category, image, linked_template_id
        ) VALUES (
            ${id},
            ${session.tenantId},
            ${body.name},
            ${body.description ?? ""},
            ${body.defaultSla ?? 4},
            ${body.active ?? true},
            ${body.category},
            ${body.image ?? null},
            ${body.linkedTemplateId ?? null}
        )
    `);

    return NextResponse.json({ id, tenantId: session.tenantId, ...body }, { status: 201 });
});

export const PUT = withAuth(async (request, session) => {
    const permissionError = await checkModulePermission(session, 'service-types', 'edit');
    if (permissionError) return permissionError;

    const body = (await request.json()) as ServiceTypePayload & { id?: string };

    if (!body.id) {
        return NextResponse.json({ message: "Campo obrigatório: id." }, { status: 400 });
    }

    await db.execute(sql`
        UPDATE service_types SET
            name = ${body.name},
            description = ${body.description ?? ""},
            default_sla = ${body.defaultSla ?? 4},
            active = ${body.active ?? true},
            category = ${body.category},
            image = ${body.image ?? null},
            linked_template_id = ${body.linkedTemplateId ?? null},
            updated_at = now()
        WHERE id = ${body.id}
          AND tenant_id = ${session.tenantId}
    `);

    return NextResponse.json({ ...body, tenantId: session.tenantId });
});

export const DELETE = withAuth(async (request, session) => {
    const permissionError = await checkModulePermission(session, 'service-types', 'delete');
    if (permissionError) return permissionError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ message: "Campo obrigatório: id." }, { status: 400 });
    }

    await db.execute(sql`
        UPDATE service_types SET
            active = false,
            updated_at = now()
        WHERE id = ${id}
          AND tenant_id = ${session.tenantId}
    `);

    return NextResponse.json({ id, active: false });
});
