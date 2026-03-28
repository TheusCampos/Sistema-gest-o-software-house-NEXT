import { NextRequest, NextResponse } from "next/server";
import { requireSession, SessionUser } from "@/lib/session";
import { ZodError } from "zod";

export type ApiContext<T = Record<string, string | string[]>> = { params: Promise<T> };

type AuthenticatedHandler<T = Record<string, string | string[]>> = (
    request: NextRequest,
    session: SessionUser,
    context: ApiContext<T>
) => Promise<NextResponse> | NextResponse;

export function withAuth<T = Record<string, string | string[]>>(handler: AuthenticatedHandler<T>, options?: { roles?: string[] }) {
    return async (request: NextRequest, context: ApiContext<T>) => {
        try {
            // 1. Check Session
            const sessionOrResponse = requireSession(request);
            if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;
            const session = sessionOrResponse;

            // 1b. Check Required Roles (if applied)
            if (options?.roles && options.roles.length > 0) {
                if (!options.roles.includes(session.role)) {
                    return NextResponse.json({ message: "Acesso não autorizado para esta role." }, { status: 403 });
                }
            }

            // 2. Execute Handler
            return await handler(request, session, context);
        } catch (error: unknown) {
            console.error(`[API Error] at ${request.nextUrl.pathname}:`, error);

            // Handle Zod Validation Errors
            if (error instanceof ZodError) {
                return NextResponse.json(
                    { message: "Dados inválidos", errors: error.issues },
                    { status: 400 }
                );
            }
            
            // Check by name if instance check fails (sometimes happens with different library versions/contexts)
            if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
                 return NextResponse.json(
                    { message: "Dados inválidos", errors: (error as ZodError).issues },
                    { status: 400 }
                );
            }

            // Handle Database / Generic Errors
            // Segurança: Não expor detalhes de erros do banco de dados (Information Disclosure)
            console.error(`[CRITICAL SERVER ERROR] at ${request.nextUrl.pathname}:`, error);

            return NextResponse.json(
                {
                    message: "Ocorreu um erro interno ao processar sua solicitação.",
                },
                { status: 500 }
            );
        }
    };
}
