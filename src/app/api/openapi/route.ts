/**
 * GET /api/openapi
 * ─────────────────────────────────────────────────────────────────
 * Serve o spec OpenAPI 3.0 em JSON.
 *
 * SEGURANÇA:
 *  1. Verificado por withAuth (sessão cookie real — não header fraco)
 *  2. Verificado DOCS_ENABLED env var antes de retornar o spec
 *     → Retorna 404 se desabilitado, evitando qualquer vazamento
 */
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";
import { getOpenApiSpec } from "@/lib/openapi-spec";

export const dynamic = "force-dynamic";

export const GET = withAuth(async () => {
  // Guard: desabilitado em produção por padrão
  if (process.env.DOCS_ENABLED !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const spec = getOpenApiSpec();

  return NextResponse.json(spec, {
    headers: {
      // Sem cache — spec sempre atualizado
      "Cache-Control": "no-store",
    },
  });
});
