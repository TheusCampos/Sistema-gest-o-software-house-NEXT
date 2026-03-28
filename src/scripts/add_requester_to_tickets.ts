import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function main() {
  console.log("🛠️ Running Support Tickets Migration (Add Requester)...");

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
    
    console.log("✅ Columns 'requester_id' and 'requester_name' verified/created successfully!");

  } catch (error) {
    console.error("❌ Error running migration:", error);
    process.exit(1);
  }
  
  console.log("🚀 Migration completed successfully.");
  process.exit(0);
}

main();
