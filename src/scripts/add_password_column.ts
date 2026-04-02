import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";
import { hashPassword } from "../lib/password";

async function main() {

    try {
        await db.execute(sql`
      ALTER TABLE public.users 
      ADD COLUMN IF NOT EXISTS password text DEFAULT '123456';
    `);

        // Atualizar usuários existentes com uma senha padrão se estiver nula
        // Segurança: Usar hash ao invés de texto plano
        const defaultPasswordHash = hashPassword("123456");
        await db.execute(sql`
      UPDATE public.users SET password = ${defaultPasswordHash} WHERE password IS NULL;
    `);

        process.exit(0);
    } catch (error) {
        console.error(" Erro durante a migração:", error);
        process.exit(1);
    }
}

main();
