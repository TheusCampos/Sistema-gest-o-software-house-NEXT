import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function check() {
    try {
        const result = await db.execute(sql`
            SELECT enum_range(NULL::user_role_enum) as roles
        `);
        console.log("Valores do enum user_role_enum:", result.rows[0].roles);
    } catch (e) {
        console.error("Erro ao verificar enum:", e);
    }
    process.exit();
}

check();
