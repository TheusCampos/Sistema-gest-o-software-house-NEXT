import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./src/lib/db";

async function test_insert() {
    console.log("Testando inserção de usuário direto via Drizzle...");
    
    // Usamos um tenant fictício para o teste
    const testTenant = "test_tenant_" + Date.now();
    const testId = "00000000-0000-0000-0000-000000000001";
    
    try {
        const result = await db.execute(sql`
            INSERT INTO users (
                tenant_id, id, name, email, password, role, avatar, active
            ) VALUES (
                ${testTenant},
                ${testId},
                'Test User',
                'test@example.com',
                'invalid_hash',
                'suporte'::user_role_enum,
                '',
                true
            ) RETURNING id
        `);
        
        console.log("Inserção bem sucedida! ID:", result.rows[0].id);
        
        // Limpa o teste
        await db.execute(sql`DELETE FROM users WHERE id = ${testId} AND tenant_id = ${testTenant}`);
        console.log("Teste limpo com sucesso.");
        process.exit(0);
    } catch (e: unknown) {
        const error = e as { message?: string; detail?: string; hint?: string };
        console.error("ERRO NA INSERÇÃO DE TESTE:");
        console.error("Mensagem:", error.message || "Unknown error");
        if (error.detail) console.error("Detalhe PG:", error.detail);
        if (error.hint) console.error("Dica PG:", error.hint);
        process.exit(1);
    }
}

test_insert();
