import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { User } from "@/types";

export const SESSION_COOKIE_NAME = "zeus_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type SessionUser = {
  id: string;
  tenantId: string;
  role: User["role"];
  name: string;
  email: string;
  iat: number;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET não configurado. Defina um valor forte em .env para assinatura de sessão.",
    );
  }
  return secret;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionToken(
  payload: Omit<SessionUser, "iat" | "exp">,
): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const sessionPayload: SessionUser = {
    ...payload,
    iat: nowSeconds,
    exp: nowSeconds + SESSION_MAX_AGE_SECONDS,
  };

  const encoded = base64UrlEncode(JSON.stringify(sessionPayload));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function readSessionFromRequest(request: NextRequest): SessionUser | null {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const [encodedPayload, tokenSignature] = token.split(".");
  if (!encodedPayload || !tokenSignature) return null;

  const expectedSignature = sign(encodedPayload);
  const signatureBuffer = Buffer.from(tokenSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as SessionUser;
    if (!parsed?.id || !parsed?.role || !parsed?.tenantId) return null;
    if (parsed.exp <= Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function unauthorizedResponse(message = "Não autenticado.") {
  return NextResponse.json({ message }, { status: 401 });
}

export function forbiddenResponse(message = "Acesso negado.") {
  return NextResponse.json({ message }, { status: 403 });
}

export function setSessionCookie(
  response: NextResponse,
  token: string,
  remember: boolean,
) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: remember ? SESSION_MAX_AGE_SECONDS : undefined,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function requireSession(request: NextRequest): SessionUser | NextResponse {
  const session = readSessionFromRequest(request);
  if (!session) return unauthorizedResponse();
  return session;
}
