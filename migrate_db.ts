
import "dotenv/config";
import { db } from "./src/lib/db";
import { sql } from "drizzle-orm";

async function migrate() {
    try {
        console.log("Adding legal_text column to contracts table...");
        await db.execute(sql`
            ALTER TABLE contracts ADD COLUMN IF NOT EXISTS legal_text TEXT;
        `);
        console.log("Column added successfully.");
    } catch (e) {
        console.error("Error adding column:", e);
    }
    process.exit(0);
}
migrate();
