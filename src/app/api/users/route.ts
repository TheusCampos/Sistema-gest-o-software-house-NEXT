import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { User, UserPermissions } from "@/types";
import { EMPTY_PERMISSIONS, ADMIN_PERMISSIONS } from "@/permissions";
import { forbiddenResponse, SessionUser } from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { withAuth } from "@/lib/api-wrapper";

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

async function ensureAdmin(session: SessionUser): Promise<NextResponse | null> {
    if (!session.role) {
        return forbiddenResponse("Acesso negado. Sessão inválida.");
    }

    const currentRole = session.role.trim().toLowerCase();
    if (currentRole === "admin" || currentRole === "desenvolvedor") {
        return null;
    }

    try {
        const permsResult = await db.execute(sql`
            SELECT can_edit, can_create, can_delete
            FROM user_permissions
            WHERE user_id = ${session.id} AND tenant_id = ${session.tenantId} AND module_name = 'settings'
        `);

        if (permsResult.rows.length > 0) {
            const row = permsResult.rows[0] as { can_edit: boolean; can_create: boolean; can_delete: boolean };
            if (row.can_edit || row.can_create || row.can_delete) {
                return null;
            }
        }
    } catch (e) {
        console.error("Erro ao verificar permissões:", e);
    }

    return forbiddenResponse(
        `Apenas administradores ou perfis com acesso às Configurações podem gerenciar usuários. (Perfil atual: ${session.role})`,
    );
}

function isAdminRole(role: string): boolean {
    const r = role.toLowerCase();
    return r === "admin" || r === "desenvolvedor";
}

function mapPermissionsByUser(rows: PermissionRow[]) {
    const permissionsMap = new Map<string, UserPermissions>();

    for (const row of rows) {
        if (!permissionsMap.has(row.userId)) {
            permissionsMap.set(row.userId, JSON.parse(JSON.stringify(EMPTY_PERMISSIONS)));
        }
        const current = permissionsMap.get(row.userId);
        if (!current || !current[row.moduleName]) continue;
        current[row.moduleName] = {
            view: row.view,
            create: row.create,
            edit: row.edit,
            delete: row.delete,
        };
    }

    return permissionsMap;
}

export const GET = withAuth(async (_request, session) => {
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

export const POST = withAuth(async (request, session) => {
    const adminError = await ensureAdmin(session);
    if (adminError) return adminError;

    const body = (await request.json()) as Partial<User>;
    const role = body.role as User["role"] | undefined;

    if (!body.name || !body.email || !role) {
        return NextResponse.json(
            { message: "Nome, e-mail e função são obrigatórios." },
            { status: 400 },
        );
    }

    if (!body.password || body.password.length < 6) {
        return NextResponse.json(
            { message: "Senha obrigatória com mínimo de 6 caracteres." },
            { status: 400 },
        );
    }

    const hashedPassword = hashPassword(body.password);

    const result = await db.transaction(async (tx) => {
        const userInsert = await tx.execute(sql`
            INSERT INTO users (
                tenant_id, id, name, email, password, role, avatar, active
            ) VALUES (
                ${session.tenantId},
                ${body.id && body.id.includes("-") && body.id.length >= 36 ? body.id : sql`gen_random_uuid()`},
                ${body.name},
                ${body.email},
                ${hashedPassword},
                ${role.toLowerCase()}::user_role_enum,
                ${body.avatar || ""},
                ${body.active ?? true}
            ) RETURNING id
        `);

        const userId = String(userInsert.rows[0].id);

        if (!isAdminRole(role)) {
            const payloadPermissions = body.permissions || EMPTY_PERMISSIONS;
            const modules = Object.keys(payloadPermissions) as Array<keyof UserPermissions>;

            for (const permissionModule of modules) {
                const p = payloadPermissions[permissionModule];
                await tx.execute(sql`
                    INSERT INTO user_permissions (
                        tenant_id, user_id, module_name, can_view, can_create, can_edit, can_delete
                    ) VALUES (
                        ${session.tenantId}, ${userId}, ${permissionModule},
                        ${p.view}, ${p.create}, ${p.edit}, ${p.delete}
                    )
                `);
            }
        }

        return {
            id: userId,
            tenantId: session.tenantId,
            name: body.name,
            email: body.email,
            role,
            avatar: body.avatar || "",
            active: body.active ?? true,
            permissions: isAdminRole(role) ? ADMIN_PERMISSIONS : body.permissions || EMPTY_PERMISSIONS,
        } as User;
    });

    return NextResponse.json(result, { status: 201 });
});

export const PUT = withAuth(async (request, session) => {
    const body = (await request.json()) as Partial<User>;
    const role = body.role as User["role"] | undefined;

    const adminError = await ensureAdmin(session);
    if (adminError && body.id !== session.id) {
        return adminError;
    }

    if (!body.id || !role) {
        return NextResponse.json({ message: "ID e função são obrigatórios." }, { status: 400 });
    }

    await db.transaction(async (tx) => {
        if (body.password && body.password.trim().length > 0) {
            await tx.execute(sql`
                UPDATE users SET
                    name = ${body.name},
                    email = ${body.email},
                    password = ${hashPassword(body.password.trim())},
                    role = ${role.toLowerCase()}::user_role_enum,
                    avatar = ${body.avatar || ""},
                    active = ${body.active ?? true},
                    updated_at = NOW()
                WHERE id = ${body.id} AND tenant_id = ${session.tenantId}
            `);
        } else {
            await tx.execute(sql`
                UPDATE users SET
                    name = ${body.name},
                    email = ${body.email},
                    role = ${role.toLowerCase()}::user_role_enum,
                    avatar = ${body.avatar || ""},
                    active = ${body.active ?? true},
                    updated_at = NOW()
                WHERE id = ${body.id} AND tenant_id = ${session.tenantId}
            `);
        }

        await tx.execute(sql`
            DELETE FROM user_permissions
            WHERE user_id = ${body.id} AND tenant_id = ${session.tenantId}
        `);

        if (!isAdminRole(role)) {
            const payloadPermissions = body.permissions || EMPTY_PERMISSIONS;
            const modules = Object.keys(payloadPermissions) as Array<keyof UserPermissions>;

            for (const permissionModule of modules) {
                const p = payloadPermissions[permissionModule];
                await tx.execute(sql`
                    INSERT INTO user_permissions (
                        tenant_id, user_id, module_name, can_view, can_create, can_edit, can_delete
                    ) VALUES (
                        ${session.tenantId}, ${body.id}, ${permissionModule},
                        ${p.view}, ${p.create}, ${p.edit}, ${p.delete}
                    )
                `);
            }
        }
    });

    return NextResponse.json({
        id: body.id,
        tenantId: session.tenantId,
        name: body.name,
        email: body.email,
        role,
        avatar: body.avatar || "",
        active: body.active ?? true,
        permissions: isAdminRole(role) ? ADMIN_PERMISSIONS : body.permissions || EMPTY_PERMISSIONS,
    } as User);
});

export const DELETE = withAuth(async (request, session) => {
    const adminError = await ensureAdmin(session);
    if (adminError) return adminError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ message: "ID é obrigatório." }, { status: 400 });
    }

    await db.execute(sql`
        UPDATE users SET
            active = false,
            updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${session.tenantId}
    `);

    return NextResponse.json({ id, success: true });
});
