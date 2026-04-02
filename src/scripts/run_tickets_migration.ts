import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function main() {

  try {
    // 1. Create Enums if not exist
    try {
      await db.execute(sql`
        DO $$ BEGIN
          CREATE TYPE public.ticket_priority AS ENUM ('Low', 'Normal', 'High', 'Critical');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
    } catch {
    }

    try {
      await db.execute(sql`
        DO $$ BEGIN
          CREATE TYPE public.ticket_status AS ENUM ('Open', 'Pending', 'Resolved', 'Closed');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
    } catch {
    }

    // 2. Create Table support_tickets
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS public.support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id text NOT NULL,
        client_id text,
        client_name text,
        subject text NOT NULL,
        description text NOT NULL,
        category text,
        priority ticket_priority DEFAULT 'Normal',
        status ticket_status DEFAULT 'Open',
        solution text,
        service_type text,
        image_url text,
        tasks jsonb DEFAULT '[]'::jsonb,
        comments jsonb DEFAULT '[]'::jsonb,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        closed_at timestamp with time zone
      );
    `);
    

    // 3. Create Index for performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_id ON public.support_tickets (tenant_id);
    `);

  } catch (error) {
    console.error(" Error running migration:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
