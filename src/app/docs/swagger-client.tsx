"use client";

/**
 * SwaggerClient — Client Component separado
 * ─────────────────────────────────────────────────────────────────
 * Responsável APENAS por renderizar o Swagger UI no browser.
 * A verificação de sessão e de DOCS_ENABLED é feita no Server Component
 * pai (page.tsx) antes de este componente ser renderizado.
 *
 * withCredentials: true → garante que o cookie zeus_session seja
 * enviado ao chamar /api/openapi, autenticando a requisição.
 */
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function SwaggerClient() {
  return (
    <div className="swagger-wrapper">
      <SwaggerUI
        url="/api/openapi"
        withCredentials
        docExpansion="list"
        defaultModelsExpandDepth={1}
        displayRequestDuration
        tryItOutEnabled={false} // Desabilita "Try it out" por padrão — habilite se quiser testar direto na UI
      />
    </div>
  );
}
