import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function main() {
  console.log("🛠️ Running User Roles Enum Migration...");

  try {
    // Adicionar novos valores ao Enum de roles usando IF NOT EXISTS
    try {
      await db.execute(sql`ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'vendedor';`);
    } catch (e) {
      console.log('vendedor já existe ou erro: ', e);
    }
    try {
      await db.execute(sql`ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'suporte';`);
    } catch (e) {
      console.log('suporte já existe ou erro: ', e);
    }
    try {
      await db.execute(sql`ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'desenvolvedor';`);
    } catch (e) {
      console.log('desenvolvedor já existe ou erro: ', e);
    }

    console.log("✅ Novos perfis 'vendedor', 'suporte' e 'desenvolvedor' adicionados com sucesso ao Enum user_role_enum!");

  } catch (error) {
    console.error("❌ Erro ao atualizar os tipos de usuário:", error);
    process.exit(1);
  }
  
  console.log("🚀 Migração concluída com sucesso.");
  process.exit(0);
}

main();
