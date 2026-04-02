import 'dotenv/config';
import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function main() {

    try {
        // 1. Create Enums if not exist
        try {
            await db.execute(sql`
                DO $$ BEGIN
                    CREATE TYPE equipment_type AS ENUM ('Desktop', 'Server', 'Notebook', 'VM');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);
        } catch {
        }

        try {
            await db.execute(sql`
                DO $$ BEGIN
                    CREATE TYPE equipment_status AS ENUM ('Ativo', 'Inativo', 'Em Manutenção', 'Descartado');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);
        } catch {
        }

        // 2. Create Table
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS equipment (
        tenant_id text NOT NULL,
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        name text NOT NULL,
        type equipment_type NOT NULL,
        status equipment_status NOT NULL,
        registration_date date NOT NULL,
        responsible text NOT NULL,
        notes text,
        active boolean NOT NULL DEFAULT true,
        location text,
        brand text,
        model text,
        serial_number text,
        processor text,
        ram text,
        storage text,
        os text,
        ip_address text,
        port text,
        purchase_date date,
        host_id uuid,
        hypervisor text,
        v_cpu text,
        v_ram text,
        v_storage text,
        provisioning_date date,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT equipment_pkey PRIMARY KEY (tenant_id, id),
        CONSTRAINT equipment_tenant_id_fkey FOREIGN KEY (tenant_id, host_id)
            REFERENCES public.equipment (tenant_id, id) MATCH SIMPLE
            ON UPDATE NO ACTION ON DELETE SET NULL
      );
    `);

    } catch (err) {
        console.error(" Error creating table:", err);
        process.exit(1);
    }

    process.exit(0);
}

main();
