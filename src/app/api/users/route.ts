import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { User, UserPermissions } from "@/types";
import { EMPTY_PERMISSIONS, ADMIN_PERMISSIONS } from "@/permissions";
import { forbiddenResponse, SessionUser } from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { withAuth } from "@/lib/api-wrapper";
import { 
  userCreationSchema, 
  userUpdateSchema, 
} from "@/schemas/user.schema";
import { checkModulePermission } from "@/lib/security";

export const dynamic = "force-dynamic";

type UserRow = {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    role: User["role"];
    avatar: string | null;
    active: boolean;
};

type PermissionRow = {
    userId: string;
    moduleName: keyof UserPermissions;
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
};

/**
 * Verifica se o usuário da sessão tem permissão de administrador ou acesso às configurações.
 */


function isAdminRole(role: string): boolean {
    const r = role?.toLowerCase();
    return r === "admin" || r === "desenvolvedor";
}

/**
 * Agrupa permissões do banco para o formato de objeto do sistema.
 */
function mapPermissionsByUser(rows: PermissionRow[]) {
    const permissionsMap = new Map<string, UserPermissions>();

    for (const row of rows) {
        if (!permissionsMap.has(row.userId)) {
            // Point 10: Use structuredClone ou spread em vez de JSON.parse(JSON.stringify)
            permissionsMap.set(row.userId, { ...EMPTY_PERMISSIONS });
        }
        const current = permissionsMap.get(row.userId);
        if (!current || !current[row.moduleName]) continue;
        
        current[row.moduleName] = {
            view: !!row.view,
            create: !!row.create,
            edit: !!row.edit,
            delete: !!row.delete,
        };
    }

    return permissionsMap;
}

// GET /api/users
export const GET = withAuth(async (_request, session) => {
    // Point 3: Filtra por usuários ativos para não listar deletados/inativos
    const usersResult = await db.execute(sql`
        SELECT
            id,
            tenant_id as "tenantId",
            name,
            email,
            role,
            avatar,
            active
        FROM users
        WHERE tenant_id = ${session.tenantId}
          AND active = true
        ORDER BY created_at DESC
    `);

    if (usersResult.rows.length === 0) {
        return NextResponse.json([]);
    }

    const permissionsResult = await db.execute(sql`
        SELECT
            user_id as "userId",
            module_name as "moduleName",
            can_view as "view",
            can_create as "create",
            can_edit as "edit",
            can_delete as "delete"
        FROM user_permissions
        WHERE tenant_id = ${session.tenantId}
    `);

    const permissionsMap = mapPermissionsByUser(permissionsResult.rows as PermissionRow[]);

    const users: User[] = (usersResult.rows as UserRow[]).map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        name: row.name,
        email: row.email,
        role: row.role,
        avatar: row.avatar ?? "",
        active: row.active,
        permissions: isAdminRole(row.role)
            ? ADMIN_PERMISSIONS
            : permissionsMap.get(row.id) || EMPTY_PERMISSIONS,
    }));

    return NextResponse.json(users);
});

// POST /api/users
export const POST = withAuth(async (request, session) => {
    const permissionError = await checkModulePermission(session, 'settings', 'create');
    if (permissionError) return permissionError;

    const rawBody = await request.json();
    
    // Point 13: Validação centralizada com Zod (Garante e-mail válido e UUID correto)
    const validation = userCreationSchema.safeParse(rawBody);
    if (!validation.success) {
        return NextResponse.json({ 
            message: "Dados de entrada inválidos", 
            errors: validation.error.format() 
        }, { status: 400 });
    }

    const data = validation.data;
    const hashedPassword = hashPassword(data.password);
    
    try {
        const result = await db.transaction(async (tx) => {
            // 1. Inserir usuário
            const userInsert = await tx.execute(sql`
                INSERT INTO users (
                    tenant_id, id, name, email, password, role, avatar, active
                ) VALUES (
                    ${session.tenantId},
                    ${data.id ? data.id : sql`gen_random_uuid()`},
                    ${data.name},
                    ${data.email},
                    ${hashedPassword},
                    ${data.role}::user_role_enum,
                    ${data.avatar || null},
                    ${data.active}
                ) RETURNING id
            `);

            const insertedId = String(userInsert.rows[0].id);

            // 2. Inserir permissões (Se não for admin, insere as permissões do payload)
            if (!isAdminRole(data.role)) {
                const perms = (data.permissions || EMPTY_PERMISSIONS) as UserPermissions;
                const modules = Object.keys(perms) as Array<keyof UserPermissions>;

                if (modules.length > 0) {
                    for (const moduleName of modules) {
                        const p = perms[moduleName];
                        await tx.execute(sql`
                            INSERT INTO user_permissions (
                                tenant_id, user_id, module_name, can_view, can_create, can_edit, can_delete
                            ) VALUES (
                                ${session.tenantId}, ${insertedId}, ${moduleName},
                                ${!!p.view}, ${!!p.create}, ${!!p.edit}, ${!!p.delete}
                            )
                        `);
                    }
                }
            }

            return {
                id: insertedId,
                tenantId: session.tenantId,
                name: data.name,
                email: data.email,
                role: data.role as User["role"],
                avatar: data.avatar || "",
                active: data.active,
                permissions: isAdminRole(data.role) ? ADMIN_PERMISSIONS : data.permissions || EMPTY_PERMISSIONS,
            } as User;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (e: unknown) {
        const error = e as { detail?: string; cause?: { detail?: string; message?: string; code?: string }; message?: string; code?: string };
        console.error("CRITICAL USER SAVE ERROR:", error);
        
        const pgDetail = error.detail || error.cause?.detail || "";
        const message = error.message || error.cause?.message || "Erro desconhecido";
        const pgCode = error.code || error.cause?.code;
        
        const isDuplicate = 
            pgCode === '23505' ||
            message.toLowerCase().includes("unique") || 
            message.toLowerCase().includes("unicidade") ||
            pgDetail.toLowerCase().includes("already exists") ||
            pgDetail.toLowerCase().includes("já existe");

        if (isDuplicate) {
            return NextResponse.json({ 
                message: "Este e-mail já está em uso neste sistema.", 
                detail: pgDetail
            }, { status: 409 });
        }
        
        return NextResponse.json({ 
            message: "Falha ao salvar no banco: " + message,
            hint: "Verifique se o banco suporta 'gen_random_uuid()' e se o enum 'user_role_enum' está atualizado."
        }, { status: 500 });
    }
});

// PUT /api/users
export const PUT = withAuth(async (request, session) => {
    const rawBody = await request.json();
    
    // Validação inicial com Zod
    const validation = userUpdateSchema.safeParse(rawBody);
    if (!validation.success) {
        return NextResponse.json({ 
            message: "Dados de atualização inválidos", 
            errors: validation.error.format() 
        }, { status: 400 });
    }

    const data = validation.data;

    // Point 2: Segurança - Se não for admin e tentar editar outro usuário, nega.
    const canManageUsers = (await checkModulePermission(session, 'settings', 'edit')) === null;
    const isSelfEdit = data.id === session.id;

    if (!canManageUsers && !isSelfEdit) {
        return forbiddenResponse("Você não tem permissão para editar outros usuários.");
    }

    try {
        const updatedUser = await db.transaction(async (tx) => {
            // Verifica existência
            const currentResult = await tx.execute(sql`
                SELECT role, active, name, email, avatar FROM users 
                WHERE id = ${data.id} AND tenant_id = ${session.tenantId}
            `);

            if (currentResult.rows.length === 0) {
                throw new Error("NOT_FOUND");
            }

            const current = currentResult.rows[0] as { role: string; active: boolean; name: string, email: string, avatar: string };

            // Point 2 & 16: Se for Self-Edit mas não Admin, impede mudança de Role/Permissions/Active
            const finalRole = (canManageUsers && data.role) ? data.role : current.role;
            const finalActive = (canManageUsers && data.active !== undefined) ? data.active : current.active;

            const hasValidNewPassword = data.password && data.password.trim().length >= 6;
            
            // 1. Update dos dados básicos do usuário
            await tx.execute(sql`
                UPDATE users SET
                    name = ${data.name || current.name},
                    email = ${data.email || current.email},
                    password = ${hasValidNewPassword ? hashPassword(data.password!) : sql`password`},
                    role = ${finalRole}::user_role_enum,
                    avatar = ${data.avatar !== undefined ? data.avatar : current.avatar},
                    active = ${finalActive},
                    updated_at = NOW()
                WHERE id = ${data.id} AND tenant_id = ${session.tenantId}
            `);

            // 2. Atualização de Permissões (Apenas Admin/Configurator pode mudar isso)
            if (canManageUsers && data.permissions && !isAdminRole(finalRole)) {
                await tx.execute(sql`
                    DELETE FROM user_permissions
                    WHERE user_id = ${data.id} AND tenant_id = ${session.tenantId}
                `);

                const perms = data.permissions as UserPermissions;
                const modules = Object.keys(perms) as Array<keyof UserPermissions>;

                for (const moduleName of modules) {
                    const p = perms[moduleName];
                    await tx.execute(sql`
                        INSERT INTO user_permissions (
                            tenant_id, user_id, module_name, can_view, can_create, can_edit, can_delete
                        ) VALUES (
                            ${session.tenantId}, ${data.id}, ${moduleName},
                            ${!!p.view}, ${!!p.create}, ${!!p.edit}, ${!!p.delete}
                        )
                    `);
                }
            }

            return {
                id: data.id,
                tenantId: session.tenantId,
                name: data.name || current.name,
                email: data.email || current.email,
                role: finalRole as User["role"],
                avatar: data.avatar || current.avatar || "",
                active: finalActive,
                permissions: isAdminRole(finalRole) ? ADMIN_PERMISSIONS : data.permissions || EMPTY_PERMISSIONS,
            } as User;
        });

        return NextResponse.json(updatedUser);
    } catch (e: unknown) {
        const error = e as { detail?: string; cause?: { detail?: string; message?: string; code?: string }; message?: string; code?: string };
        if (error.message === "NOT_FOUND") {
            return NextResponse.json({ message: "Usuário não encontrado." }, { status: 404 });
        }

        const pgDetail = error.detail || error.cause?.detail || "";
        const message = error.message || error.cause?.message || "Erro desconhecido";
        const pgCode = error.code || error.cause?.code;

        const isDuplicate = 
            pgCode === '23505' ||
            message.toLowerCase().includes("unique") || 
            message.toLowerCase().includes("unicidade") ||
            pgDetail.toLowerCase().includes("already exists") ||
            pgDetail.toLowerCase().includes("já existe");

        if (isDuplicate) {
            return NextResponse.json({ 
                message: "A atualização falhou, este e-mail já está em uso por outro usuário.", 
                detail: pgDetail
            }, { status: 409 });
        }

        console.error("DEBUG USER UPDATE ERROR:", error);
        return NextResponse.json({ message: "Erro ao atualizar: " + message }, { status: 500 });
    }
});

// DELETE /api/users
export const DELETE = withAuth(async (request, session) => {
    const permissionError = await checkModulePermission(session, 'settings', 'delete');
    if (permissionError) return permissionError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ message: "ID é obrigatório." }, { status: 400 });
    }

    // Point 15: Retornar 404 se o usuário não existir ou já estiver inativo
    const result = await db.execute(sql`
        UPDATE users SET
            active = false,
            updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${session.tenantId} AND active = true
    `);

    if (result.rowCount === 0) {
        return NextResponse.json({ message: "Usuário não encontrado ou já desativado." }, { status: 404 });
    }

    return NextResponse.json({ id, success: true });
});
