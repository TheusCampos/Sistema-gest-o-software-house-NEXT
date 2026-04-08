import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { Seller } from "@/types";
import { forbiddenResponse, SessionUser } from "@/lib/session";
import { withAuth } from "@/lib/api-wrapper";
import { checkModulePermission, getTenantFilter } from "@/lib/security";

export const dynamic = "force-dynamic";

type SellerRow = {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    commissionImplementation: string | number | null;
    commissionMonthly: string | number | null;
    active: boolean;
};

function mapSellerRow(row: SellerRow): Seller {
    return {
        id: row.id,
        tenantId: row.tenantId,
        name: row.name,
        email: row.email,
        commissionImplementation: row.commissionImplementation ? Number(row.commissionImplementation) : 0,
        commissionMonthly: row.commissionMonthly ? Number(row.commissionMonthly) : 0,
        active: row.active,
    };
}



export const GET = withAuth(async (_request, session) => {
    const permissionError = await checkModulePermission(session, 'sellers', 'view');
    if (permissionError) return permissionError;

    const result = await db.execute(sql`
        SELECT
            id,
            tenant_id as "tenantId",
            name,
            email,
            commission_implementation as "commissionImplementation",
            commission_monthly as "commissionMonthly",
            active
        FROM sellers t
        WHERE ${getTenantFilter(session)}
        ORDER BY name
    `);

    return NextResponse.json((result.rows as SellerRow[]).map(mapSellerRow));
});

export const POST = withAuth(async (request, session) => {
    const permissionError = await checkModulePermission(session, 'sellers', 'create');
    if (permissionError) return permissionError;

    const body = (await request.json()) as Seller;

    if (!body.name || !body.email) {
        return NextResponse.json(
            { message: "Campos obrigatórios: Nome e Email." },
            { status: 400 },
        );
    }

    const result = await db.execute(sql`
        INSERT INTO sellers (
            tenant_id, name, email,
            commission_implementation, commission_monthly, active
        ) VALUES (
            ${session.tenantId},
            ${body.name},
            ${body.email},
            ${body.commissionImplementation ?? 0},
            ${body.commissionMonthly ?? 0},
            ${body.active ?? true}
        )
        RETURNING
            id,
            tenant_id as "tenantId",
            name,
            email,
            commission_implementation as "commissionImplementation",
            commission_monthly as "commissionMonthly",
            active
    `);

    return NextResponse.json(mapSellerRow(result.rows[0] as SellerRow), { status: 201 });
});

export const PUT = withAuth(async (request, session) => {
    const permissionError = await checkModulePermission(session, 'sellers', 'edit');
    if (permissionError) return permissionError;

    const body = (await request.json()) as Seller;

    if (!body.id) {
        return NextResponse.json(
            { message: "ID do vendedor é obrigatório." },
            { status: 400 },
        );
    }

    const result = await db.execute(sql`
        UPDATE sellers SET
            name = ${body.name},
            email = ${body.email},
            commission_implementation = ${body.commissionImplementation},
            commission_monthly = ${body.commissionMonthly},
            active = ${body.active ?? true},
            updated_at = NOW()
        WHERE id = ${body.id}
          AND tenant_id = ${session.tenantId}
        RETURNING
            id,
            tenant_id as "tenantId",
            name,
            email,
            commission_implementation as "commissionImplementation",
            commission_monthly as "commissionMonthly",
            active
    `);

    if (result.rows.length === 0) {
        return NextResponse.json({ message: "Vendedor não encontrado." }, { status: 404 });
    }

    return NextResponse.json(mapSellerRow(result.rows[0] as SellerRow));
});

export const DELETE = withAuth(async (request, session) => {
    const permissionError = await checkModulePermission(session, 'sellers', 'delete');
    if (permissionError) return permissionError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ message: "ID obrigatório." }, { status: 400 });
    }

    await db.execute(sql`
        UPDATE sellers SET
            active = false,
            updated_at = NOW()
        WHERE id = ${id}
          AND tenant_id = ${session.tenantId}
    `);

    return NextResponse.json({ id, active: false });
});
