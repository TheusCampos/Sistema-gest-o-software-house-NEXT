import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function main() {

  try {
    // 1. Add requester_id and requester_name columns if they don't exist
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS requester_id VARCHAR(255);
        ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS requester_name VARCHAR(255);
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);
    

  } catch (error) {
    console.error("❌ Error running migration:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
