import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { Equipment, EquipmentStatus, EquipmentType } from "@/types";
import { withAuth } from "@/lib/api-wrapper";
import { checkModulePermission, getTenantFilter } from "@/lib/security";

export const dynamic = "force-dynamic";

type EquipmentDbRow = {
    id: string;
    tenant_id: string;
    name: string;
    type: EquipmentType;
    status: EquipmentStatus;
    registration_date: string | null;
    responsible: string;
    notes: string | null;
    active: boolean;
    location: string | null;
    brand: string | null;
    model: string | null;
    serial_number: string | null;
    processor: string | null;
    ram: string | null;
    storage: string | null;
    os: string | null;
    ip_address: string | null;
    port: string | null;
    purchase_date: string | null;
    host_id: string | null;
    hypervisor: string | null;
    v_cpu: string | null;
    v_ram: string | null;
    v_storage: string | null;
    provisioning_date: string | null;
};

const toDate = (value: string | null): string | undefined =>
    value ? new Date(value).toISOString().split("T")[0] : undefined;

const mapEquipment = (row: EquipmentDbRow): Equipment => ({
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    type: row.type as EquipmentType,
    status: row.status as EquipmentStatus,
    registrationDate: row.registration_date ? new Date(row.registration_date).toISOString().split("T")[0] : "",
    responsible: row.responsible,
    notes: row.notes ?? undefined,
    active: row.active,
    location: row.location ?? undefined,
    brand: row.brand ?? undefined,
    model: row.model ?? undefined,
    serialNumber: row.serial_number ?? undefined,
    processor: row.processor ?? undefined,
    ram: row.ram ?? undefined,
    storage: row.storage ?? undefined,
    os: row.os ?? undefined,
    ipAddress: row.ip_address ?? undefined,
    port: row.port ?? undefined,
    purchaseDate: toDate(row.purchase_date),
    hostId: row.host_id ?? undefined,
    hypervisor: row.hypervisor ?? undefined,
    vCpu: row.v_cpu ?? undefined,
    vRam: row.v_ram ?? undefined,
    vStorage: row.v_storage ?? undefined,
    provisioningDate: toDate(row.provisioning_date),
});

export const GET = withAuth(async (request, session) => {
    const permissionError = await checkModulePermission(session, 'equipment', 'view');
    if (permissionError) return permissionError;

    const { searchParams } = new URL(request.url);
    const showInactive = searchParams.get("showInactive") === "true";

    const result = await db.execute(sql`
        SELECT * FROM equipment t
        WHERE ${getTenantFilter(session)}
          ${!showInactive ? sql`AND active = true` : sql``}
        ORDER BY registration_date DESC, name ASC
    `);

    return NextResponse.json((result.rows as EquipmentDbRow[]).map(mapEquipment));
});

export const POST = withAuth(async (request, session) => {
    const permissionError = await checkModulePermission(session, 'equipment', 'create');
    if (permissionError) return permissionError;

    const body = (await request.json()) as Equipment;

    const result = await db.execute(sql`
        INSERT INTO equipment (
            tenant_id, name, type, status, registration_date, responsible, notes, active,
            location, brand, model, serial_number, processor, ram, storage, os,
            ip_address, port, purchase_date, host_id, hypervisor,
            v_cpu, v_ram, v_storage, provisioning_date
        ) VALUES (
            ${session.tenantId}, ${body.name}, ${body.type}, ${body.status},
            ${body.registrationDate}, ${body.responsible}, ${body.notes || null}, ${body.active ?? true},
            ${body.location || null}, ${body.brand || null}, ${body.model || null}, ${body.serialNumber || null},
            ${body.processor || null}, ${body.ram || null}, ${body.storage || null}, ${body.os || null},
            ${body.ipAddress || null}, ${body.port || null}, ${body.purchaseDate || null},
            ${body.hostId?.trim() || null}, ${body.hypervisor || null},
            ${body.vCpu || null}, ${body.vRam || null}, ${body.vStorage || null}, ${body.provisioningDate || null}
        )
        RETURNING *
    `);

    return NextResponse.json(mapEquipment(result.rows[0] as EquipmentDbRow));
});

export const PUT = withAuth(async (request, session) => {
    const permissionError = await checkModulePermission(session, 'equipment', 'edit');
    if (permissionError) return permissionError;

    const body = (await request.json()) as Equipment;

    if (!body.id) {
        return NextResponse.json({ error: "ID é obrigatório para atualização." }, { status: 400 });
    }

    const result = await db.execute(sql`
        UPDATE equipment SET
            name = ${body.name},
            type = ${body.type},
            status = ${body.status},
            registration_date = ${body.registrationDate},
            responsible = ${body.responsible},
            notes = ${body.notes || null},
            active = ${body.active},
            location = ${body.location || null},
            brand = ${body.brand || null},
            model = ${body.model || null},
            serial_number = ${body.serialNumber || null},
            processor = ${body.processor || null},
            ram = ${body.ram || null},
            storage = ${body.storage || null},
            os = ${body.os || null},
            ip_address = ${body.ipAddress || null},
            port = ${body.port || null},
            purchase_date = ${body.purchaseDate || null},
            host_id = ${body.hostId?.trim() || null},
            hypervisor = ${body.hypervisor || null},
            v_cpu = ${body.vCpu || null},
            v_ram = ${body.vRam || null},
            v_storage = ${body.vStorage || null},
            provisioning_date = ${body.provisioningDate || null},
            updated_at = NOW()
        WHERE id = ${body.id} AND tenant_id = ${session.tenantId}
        RETURNING *
    `);

    if (result.rows.length === 0) {
        return NextResponse.json({ error: "Equipamento não encontrado ou acesso negado." }, { status: 404 });
    }

    return NextResponse.json(mapEquipment(result.rows[0] as EquipmentDbRow));
});

export const DELETE = withAuth(async (request, session) => {
    const permissionError = await checkModulePermission(session, 'equipment', 'delete');
    if (permissionError) return permissionError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "ID é obrigatório." }, { status: 400 });
    }

    const result = await db.execute(sql`
        UPDATE equipment SET
            active = false,
            status = 'Descartado',
            updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${session.tenantId}
        RETURNING *
    `);

    if (result.rows.length === 0) {
        return NextResponse.json({ error: "Equipamento não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
});
