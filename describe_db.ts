import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./src/lib/db";

async function run() {
    try {
        const result = await db.execute(sql`
            SELECT table_name, column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name IN ('users', 'user_permissions') AND table_schema = 'public'
            ORDER BY table_name, ordinal_position
        `);
        console.log("--- SCHEMA START ---");
        result.rows.forEach(r => {
            console.log(`${r.table_name}.${r.column_name}: ${r.data_type} (Null: ${r.is_nullable}, Def: ${r.column_default})`);
        });
        console.log("--- SCHEMA END ---");
        process.exit(0);
    } catch (e: any) {
        console.error("Erro ao descrever banco:", e.message);
        process.exit(1);
    }
}

run();
