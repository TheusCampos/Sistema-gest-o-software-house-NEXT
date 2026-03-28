
import "dotenv/config";
import { db } from "./src/lib/db";
import { sql } from "drizzle-orm";

async function check() {
    try {
        const res = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'contracts' AND column_name = 'legal_text';
        `);
        console.log(res.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
check();
