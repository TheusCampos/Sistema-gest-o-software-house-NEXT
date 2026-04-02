import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function main() {

    try {
        await db.execute(sql`
        CREATE TABLE IF NOT EXISTS public.appointments (
            id               text PRIMARY KEY,
            tenant_id        text NOT NULL,
            title            text NOT NULL,
            description      text,
            date             timestamptz NOT NULL,
            duration_hours   numeric(5,2) NOT NULL DEFAULT 1.0,
            client_id        text,
            client_name      text,
            technician_id    text,
            technician_name  text,
            type             text NOT NULL,
            status           text NOT NULL DEFAULT 'Pendente',
            active           boolean NOT NULL DEFAULT true,
            location         text,
            color            text,
            created_at       timestamptz NOT NULL DEFAULT now(),
            updated_at       timestamptz NOT NULL DEFAULT now()
        );
        `);

        await db.execute(sql`
        COMMENT ON TABLE public.appointments IS 'Agendamentos do calendário';
        `);

        await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_appointments_tenant_date
          ON public.appointments (tenant_id, date);
        `);

    } catch (e) {
        console.error(" Erro na migration:", e);
        process.exit(1);
    }
    
    process.exit(0);
}

main();
