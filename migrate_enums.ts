import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./src/lib/db";

async function run() {
    console.log("Iniciando verificação e atualização de Enums...");
    
    try {
        // Tenta obter os valores atuais do enum
        const currentEnums = await db.execute(sql`
            SELECT enumlabel 
            FROM pg_enum 
            WHERE enumtypid = 'public.user_role_enum'::regtype
        `);
        
        console.log("Valores atuais do enum:", currentEnums.rows.map(r => r.enumlabel));
        
        const rolesToAdd = ['vendedor', 'suporte', 'desenvolvedor'];
        console.log("Verificando se novos papéis precisam ser adicionados:", rolesToAdd);
        
        for (const role of rolesToAdd) {
            try {
                // ALTER TYPE não pode rodar dentro de transação, por isso fazemos individualmente
                await db.execute(sql`
                    ALTER TYPE public.user_role_enum ADD VALUE IF NOT EXISTS ${role};
                `);
                console.log(`- Papel '${role}' verificado/adicionado.`);
            } catch (e: unknown) {
                const error = e as { message?: string };
                if (error.message?.includes('already exists')) {
                    console.log(`- Papel '${role}' já existe.`);
                } else {
                    console.error(`- Erro ao adicionar papel '${role}':`, error.message);
                }
            }
        }
        
        console.log("Migração de Enums finalizada com sucesso.");
        process.exit(0);
    } catch (err: unknown) {
        const error = err as { message?: string; detail?: string };
        console.error("Erro crítico na migração de Enums:", error.message);
        if (error.detail) console.error("Detalhes:", error.detail);
        process.exit(1);
    }
}

run();
