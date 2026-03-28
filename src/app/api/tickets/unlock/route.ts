import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/api-wrapper";
import { verifyPassword } from "@/lib/password";
import { SupportComment } from "@/types";

export const POST = withAuth(async (request, session) => {
    // 1. Check if user is admin or desenvolvedor
    if (session.role !== 'admin' && session.role !== 'desenvolvedor') {
        return NextResponse.json({ message: "Apenas administradores podem desbloquear tickets." }, { status: 403 });
    }

    const body = await request.json();
    const { ticketId, password } = body;

    if (!ticketId || !password) {
        return NextResponse.json({ message: "Ticket ID e senha são obrigatórios." }, { status: 400 });
    }

    // 2. Fetch user to get password hash
    const userResult = await db.execute(sql`
        SELECT password FROM users WHERE id = ${session.id} AND tenant_id = ${session.tenantId}
    `);

    if (userResult.rows.length === 0) {
        return NextResponse.json({ message: "Usuário não encontrado." }, { status: 404 });
    }

    const userPasswordHash = userResult.rows[0].password as string;

    // 3. Verify password
    if (!verifyPassword(userPasswordHash, password)) {
        return NextResponse.json({ message: "Senha incorreta." }, { status: 401 });
    }

    // 4. Fetch current ticket to get comments and verify status
    const ticketResult = await db.execute(sql`
        SELECT comments, status FROM support_tickets WHERE id = ${ticketId} AND tenant_id = ${session.tenantId}
    `);

    if (ticketResult.rows.length === 0) {
        return NextResponse.json({ message: "Ticket não encontrado." }, { status: 404 });
    }

    const ticket = ticketResult.rows[0];
    
    if (ticket.status !== 'Closed') {
         return NextResponse.json({ message: "Este ticket não está fechado." }, { status: 400 });
    }

    const currentComments = (ticket.comments as SupportComment[]) || [];

    // 5. Create new comment logging the unlock
    const newComment: SupportComment = {
        id: crypto.randomUUID(),
        author: session.name,
        role: session.role,
        content: `Ticket desbloqueado pelo administrador ${session.name}.`,
        createdAt: new Date().toISOString(),
        isInternal: true
    };

    const updatedComments = [...currentComments, newComment];

    // 6. Update ticket
    await db.execute(sql`
        UPDATE support_tickets 
        SET status = 'Open', comments = ${JSON.stringify(updatedComments)}::jsonb, updated_at = NOW()
        WHERE id = ${ticketId} AND tenant_id = ${session.tenantId}
    `);

    return NextResponse.json({ message: "Ticket desbloqueado com sucesso." });
});
