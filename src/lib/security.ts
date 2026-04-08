import { sql } from "drizzle-orm";
import { db } from "./db";
import { SessionUser, forbiddenResponse } from "./session";
import { Module, CRUDPermissions } from "@/types/common";
import { ADMIN_PERMISSIONS } from "@/permissions";
import { NextResponse } from "next/server";

/**
 * Checks if a user has the required permission for a specific module and action.
 * Admins and Developers override all checks.
 */
export async function checkModulePermission(
    session: SessionUser,
    moduleName: Module,
    action: keyof CRUDPermissions
): Promise<NextResponse | null> {
    const role = (session.role || '').toLowerCase().trim();
    
    // Admins and Developers have full access
    if (role === "admin" || role === "desenvolvedor" || role === "administrador") {
        return null;
    }

    try {
        const columnName = `can_${action}`;
        const query = sql.raw(`
            SELECT ${columnName} as has_permission
            FROM user_permissions
            WHERE user_id = ${sql.placeholder('userId')} 
              AND tenant_id = ${sql.placeholder('tenantId')} 
              AND module_name = ${sql.placeholder('moduleName')}
        `);

        const result = await db.execute(sql`
            SELECT can_${sql.raw(action)} as has_permission
            FROM user_permissions
            WHERE user_id = ${session.id} 
              AND tenant_id = ${session.tenantId} 
              AND module_name = ${moduleName}
        `);

        if (result.rows.length > 0) {
            const hasPermission = (result.rows[0] as { has_permission: boolean }).has_permission;
            if (hasPermission) return null;
        }

        return forbiddenResponse(`Acesso negado. Você não tem permissão para ${action} no módulo ${moduleName}.`);
    } catch (error) {
        console.error(`Error checking permission for ${moduleName}:${action}`, error);
        return forbiddenResponse("Erro interno ao verificar permissões.");
    }
}

/**
 * Helper to check if a record belongs to the user's tenant or is a 'default' record.
 */
export function getTenantFilter(session: SessionUser, tableAlias: string = 't') {
    return sql`(${sql.raw(tableAlias)}.tenant_id = ${session.tenantId} OR ${sql.raw(tableAlias)}.tenant_id = 'default')`;
}
