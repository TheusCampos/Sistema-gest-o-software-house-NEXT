import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { Contract } from "@/types";
import { withAuth } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

type ContractRow = {
    id: string;
    tenantId: string;
    contractNumber: string;
    clientId: string | null;
    clientName: string;
    clientLogo: string;
    plan: string;
    type: Contract["type"];
    status: Contract["status"];
    startDate: string;
    endDate: string;
    mrr: string;
    totalValue: string;
    implementationValue: string | null;
    billingDay: string | null;
    notes: string | null;
    sellerId: string | null;
    legalText: string | null;
};

type ContractItemRow = {
    id: string;
    contractId: string;
    description: string;
    quantity: string | number;
    unitValue: string | number;
};

export const GET = withAuth(async (_request, session) => {
    const contractsResult = await db.execute(sql`
        SELECT
            id,
            tenant_id as "tenantId",
            contract_number as "contractNumber",
            client_id as "clientId",
            client_name as "clientName",
            client_logo as "clientLogo",
            plan,
            type,
            status,
            to_char(start_date, 'YYYY-MM-DD') as "startDate",
            to_char(end_date, 'YYYY-MM-DD') as "endDate",
            mrr::text,
            total_value::text as "totalValue",
            implementation_value::text as "implementationValue",
            billing_day::text as "billingDay",
            notes,
            seller_id as "sellerId",
            legal_text as "legalText"
        FROM contracts
        WHERE tenant_id = ${session.tenantId}
        ORDER BY created_at DESC
    `);

    const contracts = contractsResult.rows as ContractRow[];
    if (contracts.length === 0) {
        return NextResponse.json([]);
    }

    const contractIds = contracts.map((c) => sql`${c.id}::uuid`);
    const itemsResult = await db.execute(sql`
        SELECT
            id,
            contract_id as "contractId",
            description,
            quantity::numeric,
            unit_value::numeric as "unitValue"
        FROM contract_items
        WHERE tenant_id = ${session.tenantId}
          AND contract_id IN (${sql.join(contractIds, sql`, `)})
    `);

    const allItems = itemsResult.rows as ContractItemRow[];
    const contractsWithItems = contracts.map((contract) => ({
        ...contract,
        items: allItems
            .filter((item) => item.contractId === contract.id)
            .map((item) => ({
                id: item.id,
                description: item.description,
                quantity: Number(item.quantity),
                unitValue: Number(item.unitValue),
            })),
        billingDay: contract.billingDay ? String(contract.billingDay) : undefined,
    }));

    return NextResponse.json(contractsWithItems);
});

export const POST = withAuth(async (request, session) => {
    const body = (await request.json()) as Contract;

    if (!body.contractNumber || !body.clientName) {
        return NextResponse.json(
            { message: "Campos obrigatórios faltando." },
            { status: 400 },
        );
    }

    const contractId = body.id || crypto.randomUUID();

    const parseNumeric = (val: string | number | null | undefined) => {
        if (val === null || val === undefined || val === '') return 0;
        if (typeof val === 'number') return val;
        // Limpar pontos de milhar e trocar virgula decimal por ponto
        const cleaned = String(val).replace(/\./g, '').replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    };

    try {
        await db.transaction(async (tx) => {
            await tx.execute(sql`
                INSERT INTO contracts (
                    id, tenant_id, contract_number, client_id, client_name, client_logo,
                    plan, type, status, start_date, end_date,
                    mrr, total_value, implementation_value, billing_day, notes, seller_id, legal_text
                ) VALUES (
                    ${contractId},
                    ${session.tenantId},
                    ${body.contractNumber},
                    ${body.clientId || null},
                    ${body.clientName},
                    ${body.clientLogo},
                    ${body.plan},
                    ${body.type}::contract_type,
                    ${body.status}::contract_status,
                    ${body.startDate && body.startDate !== '' ? body.startDate : null}::date,
                    ${body.endDate && body.endDate !== '' ? body.endDate : null}::date,
                    ${parseNumeric(body.mrr)},
                    ${parseNumeric(body.totalValue)},
                    ${parseNumeric(body.implementationValue)},
                    ${body.billingDay ? Number(body.billingDay) : null},
                    ${body.notes || null},
                    ${body.sellerId || null},
                    ${body.legalText || null}
                )
            `);

            if (body.items && body.items.length > 0) {
                for (const item of body.items) {
                    await tx.execute(sql`
                        INSERT INTO contract_items (
                            id, tenant_id, contract_id, description, quantity, unit_value
                        ) VALUES (
                            ${item.id || crypto.randomUUID()},
                            ${session.tenantId},
                            ${contractId},
                            ${item.description},
                            ${parseNumeric(item.quantity)},
                            ${parseNumeric(item.unitValue)}
                        )
                    `);
                }
            }
        });

        return NextResponse.json(
            { ...body, id: contractId, tenantId: session.tenantId },
            { status: 201 },
        );
    } catch (error: unknown) {
        console.error("DEBUG CONTRACT ERROR:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        const detail = (error as { detail?: string }).detail || "";
        return NextResponse.json({ 
            message: "Erro no banco de dados: " + (detail || errorMessage)
        }, { status: 500 });
    }
});

export const PUT = withAuth(async (request, session) => {
    const body = (await request.json()) as Contract;

    if (!body.id) {
        return NextResponse.json(
            { message: "ID do contrato obrigatório." },
            { status: 400 },
        );
    }

    const parseNumeric = (val: string | number | null | undefined) => {
        if (val === null || val === undefined || val === '') return 0;
        if (typeof val === 'number') return val;
        const cleaned = String(val).replace(/\./g, '').replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    };

    try {
        await db.transaction(async (tx) => {
            await tx.execute(sql`
                UPDATE contracts SET
                    client_name = ${body.clientName},
                    client_id = ${body.clientId || null},
                    plan = ${body.plan},
                    type = ${body.type}::contract_type,
                    status = ${body.status}::contract_status,
                    start_date = ${body.startDate && body.startDate !== '' ? body.startDate : null}::date,
                    end_date = ${body.endDate && body.endDate !== '' ? body.endDate : null}::date,
                    mrr = ${parseNumeric(body.mrr)},
                    total_value = ${parseNumeric(body.totalValue)},
                    implementation_value = ${parseNumeric(body.implementationValue)},
                    billing_day = ${body.billingDay ? Number(body.billingDay) : null},
                    notes = ${body.notes || null},
                    seller_id = ${body.sellerId || null},
                    legal_text = ${body.legalText || null},
                    updated_at = now()
                WHERE id = ${body.id} AND tenant_id = ${session.tenantId}
            `);

            await tx.execute(sql`
                DELETE FROM contract_items
                WHERE contract_id = ${body.id} AND tenant_id = ${session.tenantId}
            `);

            if (body.items && body.items.length > 0) {
                for (const item of body.items) {
                    await tx.execute(sql`
                        INSERT INTO contract_items (
                            id, tenant_id, contract_id, description, quantity, unit_value
                        ) VALUES (
                            ${item.id || crypto.randomUUID()},
                            ${session.tenantId},
                            ${body.id},
                            ${item.description},
                            ${parseNumeric(item.quantity)},
                            ${parseNumeric(item.unitValue)}
                        )
                    `);
                }
            }
        });

        return NextResponse.json({ ...body, tenantId: session.tenantId });
    } catch (error: unknown) {
        console.error("DEBUG CONTRACT ERROR:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        const detail = (error as { detail?: string }).detail || "";
        return NextResponse.json({ 
            message: "Erro no banco de dados: " + (detail || errorMessage)
        }, { status: 500 });
    }
});

export const DELETE = withAuth(async (request, session) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ message: "ID obrigatório." }, { status: 400 });
    }

    await db.execute(sql`
        UPDATE contracts
        SET status = 'Cancelado'::contract_status, updated_at = now()
        WHERE id = ${id} AND tenant_id = ${session.tenantId}
    `);

    return NextResponse.json({ id, status: "Cancelado" });
});
