import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-wrapper';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { forbiddenResponse } from '@/lib/session';

export const dynamic = "force-dynamic";

export const GET = withAuth(async (_request, session) => {
    if (session.role !== "admin") {
        return forbiddenResponse("Apenas administradores podem acessar diagnóstico.");
    }

    // 1. Contagem de registros filtrada pelo Tenant ID
    const counts = await db.execute(sql`
        SELECT 
            (SELECT count(*) FROM equipment WHERE tenant_id = ${session.tenantId}) as equipment_count,
            (SELECT count(*) FROM clients WHERE tenant_id = ${session.tenantId}) as clients_count,
            (SELECT count(*) FROM support_tickets WHERE tenant_id = ${session.tenantId}) as tickets_count,
            (SELECT count(*) FROM contracts WHERE tenant_id = ${session.tenantId}) as contracts_count,
            (SELECT count(*) FROM sellers WHERE tenant_id = ${session.tenantId}) as sellers_count,
            (SELECT count(*) FROM users WHERE tenant_id = ${session.tenantId}) as users_count
    `);

    // 2. Agrupamento por Tabela para o Tenant atual
    const tenantSummary = await db.execute(sql`
        SELECT count(*) as qty, 'equipment' as table_name FROM equipment WHERE tenant_id = ${session.tenantId}
        UNION ALL
        SELECT count(*) as qty, 'clients' as table_name FROM clients WHERE tenant_id = ${session.tenantId}
        UNION ALL
        SELECT count(*) as qty, 'support_tickets' as table_name FROM support_tickets WHERE tenant_id = ${session.tenantId}
    `);

    // 3. Listar usuários do próprio tenant
    const users = await db.execute(sql`
        SELECT id, email, tenant_id, name
        FROM users
        WHERE tenant_id = ${session.tenantId}
        LIMIT 10
    `);

    return NextResponse.json({
        summary: counts.rows[0],
        tenant_data: tenantSummary.rows,
        users_sample: users.rows
    });
});
