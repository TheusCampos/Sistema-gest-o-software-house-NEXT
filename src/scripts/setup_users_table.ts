import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function main() {

  try {
    // 0. Garantir extensão pgcrypto para gen_random_uuid()
    try {
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    } catch {
    }

    // 1. Criar Tipo Enum para Roles
    try {
      await db.execute(sql`
        DO $$ BEGIN
          CREATE TYPE public.user_role_enum AS ENUM ('admin', 'technician', 'client');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
    } catch {
    }

    // 2. Criar tabela users
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS public.users
      (
        tenant_id text NOT NULL,
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        name text NOT NULL,
        email text NOT NULL,
        role user_role_enum NOT NULL DEFAULT 'technician',
        avatar text,
        active boolean NOT NULL DEFAULT true,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT users_pkey PRIMARY KEY (tenant_id, id),
        CONSTRAINT users_email_key UNIQUE (tenant_id, email)
      );
    `);

    // 3. Criar tabela user_permissions
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS public.user_permissions
      (
        tenant_id text NOT NULL,
        user_id uuid NOT NULL,
        module_name text NOT NULL,
        can_view boolean NOT NULL DEFAULT false,
        can_create boolean NOT NULL DEFAULT false,
        can_edit boolean NOT NULL DEFAULT false,
        can_delete boolean NOT NULL DEFAULT false,
        CONSTRAINT user_permissions_pkey PRIMARY KEY (tenant_id, user_id, module_name),
        CONSTRAINT user_permissions_user_fkey FOREIGN KEY (tenant_id, user_id)
            REFERENCES public.users (tenant_id, id) MATCH SIMPLE
            ON UPDATE NO ACTION ON DELETE CASCADE
      );
    `);

  } catch (error) {
    console.error(" Erro durante a configuração:", error);
    process.exit(1);
  }
}

main();
