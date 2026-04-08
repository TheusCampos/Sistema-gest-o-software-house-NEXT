import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { ImplementationTemplate } from "@/types";
import { forbiddenResponse } from "@/lib/session";
import { withAuth } from "@/lib/api-wrapper";
import { checkModulePermission, getTenantFilter } from "@/lib/security";

export const dynamic = "force-dynamic";

type TemplateRow = {
    id: string;
    tenant_id: string;
    name: string;
    system_type: ImplementationTemplate["systemType"];
    description: string | null;
    requires_bank_config: boolean;
};

type StepRow = {
    id: string;
    template_id: string;
    label: string;
    required: boolean;
};

import { SessionUser } from "@/lib/session";



export const GET = withAuth(async (_request, session) => {
    const permissionError = await checkModulePermission(session, 'templates', 'view');
    if (permissionError) return permissionError;

    const templatesResult = await db.execute(sql`
        SELECT
            id,
            tenant_id,
            name,
            system_type,
            description,
            requires_bank_config
        FROM implementation_templates t
        WHERE ${getTenantFilter(session)} AND active = true
        ORDER BY created_at DESC
    `);

    const templates = templatesResult.rows as TemplateRow[];

    if (templates.length === 0) {
        return NextResponse.json([]);
    }

    const templateIds = templates.map((t) => t.id);
    const stepsResult = await db.execute(sql`
        SELECT
            id,
            template_id,
            label,
            required
        FROM implementation_steps t
        WHERE template_id IN (${sql.join(templateIds.map(id => sql`${id}`), sql`, `)}) AND ${getTenantFilter(session)}
        ORDER BY position ASC
    `);

    const stepsByTemplate = new Map<string, StepRow[]>();
    for (const step of stepsResult.rows as StepRow[]) {
        const list = stepsByTemplate.get(step.template_id) ?? [];
        list.push(step);
        stepsByTemplate.set(step.template_id, list);
    }

    const result: ImplementationTemplate[] = templates.map((row) => ({
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        systemType: row.system_type,
        description: row.description || "",
        requiresBankConfig: !!row.requires_bank_config,
        steps: (stepsByTemplate.get(row.id) ?? []).map((s) => ({
            id: s.id,
            label: s.label,
            required: !!s.required,
        })),
    }));

    return NextResponse.json(result);
});

export const POST = withAuth(async (request, session) => {
    const permissionError = await checkModulePermission(session, 'templates', 'create');
    if (permissionError) return permissionError;

    const body = (await request.json()) as ImplementationTemplate;

    if (!body.name) {
        return NextResponse.json({ message: "Nome é obrigatório." }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
        const templateInsert = await tx.execute(sql`
            INSERT INTO implementation_templates (
                tenant_id, name, system_type, description, requires_bank_config, active
            ) VALUES (
                ${session.tenantId}, ${body.name}, ${body.systemType}::system_type_enum,
                ${body.description || ""}, ${body.requiresBankConfig}, true
            ) RETURNING id
        `);

        const templateId = String(templateInsert.rows[0].id);

        if (body.steps && body.steps.length > 0) {
            for (let i = 0; i < body.steps.length; i++) {
                const step = body.steps[i];
                await tx.execute(sql`
                    INSERT INTO implementation_steps (
                        tenant_id, template_id, label, required, position
                    ) VALUES (
                        ${session.tenantId}, ${templateId}, ${step.label}, ${step.required}, ${i}
                    )
                `);
            }
        }

        return { ...body, id: templateId, tenantId: session.tenantId };
    });

    return NextResponse.json(result, { status: 201 });
});

export const PUT = withAuth(async (request, session) => {
    const permissionError = await checkModulePermission(session, 'templates', 'edit');
    if (permissionError) return permissionError;

    const body = (await request.json()) as ImplementationTemplate;

    if (!body.id) {
        return NextResponse.json({ message: "ID é obrigatório." }, { status: 400 });
    }

    await db.transaction(async (tx) => {
        await tx.execute(sql`
            UPDATE implementation_templates SET
                name = ${body.name},
                system_type = ${body.systemType}::system_type_enum,
                description = ${body.description || ""},
                requires_bank_config = ${body.requiresBankConfig},
                updated_at = NOW()
            WHERE id = ${body.id} AND tenant_id = ${session.tenantId}
        `);

        await tx.execute(sql`
            DELETE FROM implementation_steps
            WHERE template_id = ${body.id} AND tenant_id = ${session.tenantId}
        `);

        if (body.steps && body.steps.length > 0) {
            for (let i = 0; i < body.steps.length; i++) {
                const step = body.steps[i];
                await tx.execute(sql`
                    INSERT INTO implementation_steps (
                        tenant_id, template_id, label, required, position
                    ) VALUES (
                        ${session.tenantId}, ${body.id}, ${step.label}, ${step.required}, ${i}
                    )
                `);
            }
        }
    });

    return NextResponse.json({ ...body, tenantId: session.tenantId });
});

export const DELETE = withAuth(async (request, session) => {
    const permissionError = await checkModulePermission(session, 'templates', 'delete');
    if (permissionError) return permissionError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ message: "ID é obrigatório." }, { status: 400 });
    }

    await db.execute(sql`
        UPDATE implementation_templates SET
            active = false,
            updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${session.tenantId}
    `);

    return NextResponse.json({ id, success: true });
});
