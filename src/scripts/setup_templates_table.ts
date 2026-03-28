import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function main() {
  console.log(" Iniciando configuração das tabelas de Roteiros de Implantação...");

  try {
    // 1. Criar Tipo Enum (se não existir)
    try {
      await db.execute(sql`
        DO $$ BEGIN
          CREATE TYPE public.system_type_enum AS ENUM ('CRONOS', 'ZEUS', 'OUTROS');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      console.log(" Tipo system_type_enum verificado/criado.");
    } catch {
      console.log(" Nota: Tipo enum pode já existir ou erro ao criar.");
    }

    // 2. Criar tabela implementation_templates
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS public.implementation_templates
      (
        tenant_id text NOT NULL,
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        name text NOT NULL,
        system_type system_type_enum NOT NULL DEFAULT 'CRONOS',
        description text,
        requires_bank_config boolean NOT NULL DEFAULT true,
        active boolean NOT NULL DEFAULT true,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT implementation_templates_pkey PRIMARY KEY (tenant_id, id)
      );
    `);
    console.log(" Tabela implementation_templates verificada/criada.");

    // 3. Criar tabela implementation_steps
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS public.implementation_steps
      (
        tenant_id text NOT NULL,
        template_id uuid NOT NULL,
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        label text NOT NULL,
        required boolean NOT NULL DEFAULT true,
        position integer NOT NULL,
        CONSTRAINT implementation_steps_pkey PRIMARY KEY (tenant_id, id),
        CONSTRAINT implementation_steps_template_fkey FOREIGN KEY (tenant_id, template_id)
            REFERENCES public.implementation_templates (tenant_id, id) MATCH SIMPLE
            ON UPDATE NO ACTION ON DELETE CASCADE
      );
    `);
    console.log(" Tabela implementation_steps verificada/criada.");

    console.log(" Configuração concluída com sucesso!");
  } catch (error) {
    console.error(" Erro durante a configuração:", error);
    process.exit(1);
  }
}

main();
