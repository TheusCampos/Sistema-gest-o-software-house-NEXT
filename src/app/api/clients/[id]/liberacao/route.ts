import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { withAuth, ApiContext } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const PATCH = withAuth(async (request, session, { params }: ApiContext<{ id: string }>) => {
    const idValue = (await params).id;
    const body = await request.json();

    if (typeof body.liberacao !== 'boolean') {
        return NextResponse.json({ message: "O campo 'liberacao' deve ser um booleano." }, { status: 400 });
    }

    await db.execute(sql`
        UPDATE client_contract_info 
        SET liberacao = ${body.liberacao}
        WHERE client_id = ${idValue} AND tenant_id = ${session.tenantId}
    `);

    return NextResponse.json({ success: true, liberacao: body.liberacao });
});
