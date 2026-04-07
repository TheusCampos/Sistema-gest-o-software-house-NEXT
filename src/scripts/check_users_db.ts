
import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error("DATABASE_URL não configurada.");
    process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(pool);

async function check() {
    console.log("Checking users table...");
    try {
        const users = await db.execute(sql`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position;
        `);
        console.log("Users Table Columns:");
        console.table(users.rows);

        console.log("Checking user_permissions table...");
        const perms = await db.execute(sql`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'user_permissions' 
            ORDER BY ordinal_position;
        `);
        console.log("User Permissions Table Columns:");
        console.table(perms.rows);

        const enums = await db.execute(sql`
            SELECT enumlabel FROM pg_enum 
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
            WHERE typname = 'user_role_enum';
        `);
        console.log("User Role Enum Labels:");
        console.table(enums.rows);

    } catch (e: unknown) {
        console.error("Error checking DB:", e instanceof Error ? e.message : String(e));
    }
    await pool.end();
    process.exit(0);
}
check();
