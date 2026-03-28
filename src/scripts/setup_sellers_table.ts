import 'dotenv/config';
import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function main() {
    console.log(" Creating sellers table...");

    try {
        // Ensure pgcrypto extension for gen_random_uuid()
        try {
            await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
            console.log(" Extension 'pgcrypto' verified/created.");
        } catch {
            console.log(" Note: Failed to ensure 'pgcrypto', gen_random_uuid() might already be available.");
        }

        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sellers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id text NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        commission_implementation DECIMAL(5,2) DEFAULT 0,
        commission_monthly DECIMAL(5,2) DEFAULT 0,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
        console.log(" Table 'sellers' created or already exists.");
    } catch (err) {
        console.error(" Error creating table:", err);
        process.exit(1);
    }

    console.log(" Done.");
    process.exit(0);
}

main();
