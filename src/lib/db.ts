import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL não configurada.");
}

/**
 * Padrão Global Client para Next.js:
 * Reutiliza a instância do banco durante o Hot Module Replacement (HMR) em desenvolvimento.
 */
declare global {
    // eslint-disable-next-line no-var
    var db: ReturnType<typeof drizzle> | undefined;
}

let dbInstance: ReturnType<typeof drizzle>;

if (process.env.NODE_ENV === "production") {
    const pool = new Pool({
        connectionString: databaseUrl,
    });
    dbInstance = drizzle(pool);
} else {
    if (!global.db) {
        const pool = new Pool({
            connectionString: databaseUrl,
        });
        global.db = drizzle(pool);
    }
    dbInstance = global.db;
}

export const db = dbInstance;

