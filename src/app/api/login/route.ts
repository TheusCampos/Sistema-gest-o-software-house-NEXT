import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { User, UserPermissions } from "@/types";
import { EMPTY_PERMISSIONS, ADMIN_PERMISSIONS } from "@/permissions";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { verifyPassword } from "@/lib/password";

type LoginPayload = {
    email?: string;
    password?: string;
    remember?: boolean;
};

type LoginRow = {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    role: User["role"];
    avatar: string | null;
    active: boolean;
    password: string;
};

type PermissionRow = {
    moduleName: keyof UserPermissions;
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
};

export async function POST(request: NextRequest) {
    try {
        const { email, password, remember = true } = (await request.json()) as LoginPayload;

        if (!email || !password) {
            return NextResponse.json(
                { message: "E-mail e senha são obrigatórios." },
                { status: 400 }
            );
        }

        const usersResult = await db.execute(sql`
            SELECT 
                id, tenant_id as "tenantId", name, email, role, avatar, active, password
            FROM users
            WHERE email = ${email} AND active = true
            LIMIT 1
        `);

        if (usersResult.rows.length === 0) {
            return NextResponse.json(
                { message: "Usuário não encontrado ou inativo." },
                { status: 401 }
            );
        }

        const userRow = usersResult.rows[0] as LoginRow;

        if (!verifyPassword(userRow.password, password)) {
            return NextResponse.json(
                { message: "Senha incorreta." },
                { status: 401 }
            );
        }

        const roleLower = userRow.role.toLowerCase();
        const isAdmin = roleLower === 'admin' || roleLower === 'desenvolvedor';
        
        let permissions: UserPermissions;

        if (isAdmin) {
            permissions = { ...ADMIN_PERMISSIONS };
        } else {
            permissions = { ...EMPTY_PERMISSIONS };
            const permsResult = await db.execute(sql`
                SELECT 
                    module_name as "moduleName",
                    can_view as "view",
                    can_create as "create",
                    can_edit as "edit",
                    can_delete as "delete"
                FROM user_permissions
                WHERE user_id = ${userRow.id} AND tenant_id = ${userRow.tenantId}
            `);

            for (const p of permsResult.rows as PermissionRow[]) {
                if (permissions[p.moduleName]) {
                    permissions[p.moduleName] = {
                        view: p.view,
                        create: p.create,
                        edit: p.edit,
                        delete: p.delete
                    };
                }
            }
        }

        const user: User = {
            id: userRow.id,
            tenantId: userRow.tenantId,
            name: userRow.name,
            email: userRow.email,
            role: userRow.role,
            avatar: userRow.avatar ?? undefined,
            active: userRow.active,
            permissions
        };

        const token = createSessionToken({
            id: userRow.id,
            tenantId: userRow.tenantId,
            role: userRow.role,
            name: userRow.name,
            email: userRow.email,
        });

        const response = NextResponse.json(user);
        setSessionCookie(response, token, remember);
        return response;
    } catch (error: unknown) {
        console.error("Erro no login:", error);
        return NextResponse.json(
            { message: "Erro interno no servidor." },
            { status: 500 }
        );
    }
}
