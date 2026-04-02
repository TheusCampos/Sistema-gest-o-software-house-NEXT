import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function main() {

  try {
    // Adicionar novos valores ao Enum de roles usando IF NOT EXISTS
    try {
      await db.execute(sql`ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'vendedor';`);
    } catch (e) {
    }
    try {
      await db.execute(sql`ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'suporte';`);
    } catch (e) {
    }
    try {
      await db.execute(sql`ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'desenvolvedor';`);
    } catch (e) {
    }


  } catch (error) {
    console.error("❌ Erro ao atualizar os tipos de usuário:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
