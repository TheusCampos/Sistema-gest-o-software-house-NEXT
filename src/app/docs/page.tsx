/**
 * /docs — Server Component (sem "use client")
 * ─────────────────────────────────────────────────────────────────
 * Camada servidor: verifica DOCS_ENABLED e sessão ANTES de renderizar.
 *
 * SEGURANÇA (dupla camada):
 *  1. DOCS_ENABLED !== 'true' → redireciona para /  (não revela que /docs existe)
 *  2. Sem sessão válida         → redireciona para /login
 */
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { createHmac, timingSafeEqual } from "crypto";
import Link from "next/link";
import SwaggerClient from "./swagger-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Docs — Sistema Zeus",
  description: "Documentação interativa das rotas da API do Sistema Zeus.",
};

/** Lê e valida a sessão diretamente dos cookies — compatível com Server Components */
async function getSessionFromCookies() {
  try {
    const secret =
      process.env.AUTH_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      process.env.DATABASE_URL;
    if (!secret) return null;

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const [encodedPayload, tokenSignature] = token.split(".");
    if (!encodedPayload || !tokenSignature) return null;

    const expectedSignature = createHmac("sha256", secret)
      .update(encodedPayload)
      .digest("base64url");

    const sigBuf = Buffer.from(tokenSignature);
    const expBuf = Buffer.from(expectedSignature);
    if (
      sigBuf.length !== expBuf.length ||
      !timingSafeEqual(sigBuf, expBuf)
    ) {
      return null;
    }

    const parsed = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );
    if (!parsed?.id || !parsed?.role || !parsed?.tenantId) return null;
    if (parsed.exp <= Math.floor(Date.now() / 1000)) return null;

    return parsed as { id: string; name: string; role: string; tenantId: string };
  } catch {
    return null;
  }
}

export default async function DocsPage() {
  // Guard 1: variável de ambiente — desabilita completamente em produção
  if (process.env.DOCS_ENABLED !== "true") {
    redirect("/");
  }

  // Guard 2: sessão válida via cookies() — correto para Server Components App Router
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            Documentação da API — Sistema Zeus
          </h1>
          <p className="text-sm text-gray-500">
            Autenticado como{" "}
            <span className="font-medium text-gray-700">{session.name}</span>{" "}
            <span className="text-gray-400">({session.role})</span>
          </p>
        </div>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Voltar ao sistema
        </Link>
      </header>

      <SwaggerClient />
    </main>
  );
}
