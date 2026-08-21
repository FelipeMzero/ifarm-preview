import { NextRequest, NextResponse } from "next/server";
import { getCookieCache, getSessionCookie } from "better-auth/cookies";
import { RESOURCE_ACCESS } from "@/lib/permissions";

const PUBLIC_ROUTES = ["/login"];

// Dev only: libera CORS com credenciais para o app mobile (outra origem: Metro bundler /
// navegador do celular) conseguir chamar a API pela rede local. Desligado em produção.
const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

function isLocalDevOrigin(origin: string) {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
    );
  } catch {
    return false;
  }
}

function withCors(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const isAllowedOrigin =
    process.env.NODE_ENV !== "production" && isLocalDevOrigin(origin);

  if (request.method === "OPTIONS") {
    return NextResponse.json(
      {},
      {
        headers: {
          ...(isAllowedOrigin && { "Access-Control-Allow-Origin": origin }),
          ...CORS_HEADERS,
        },
      },
    );
  }

  const response = NextResponse.next();
  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    Object.entries(CORS_HEADERS).forEach(([key, value]) =>
      response.headers.set(key, value),
    );
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return withCors(request);
  }

  const isPublicRoute =
    pathname === "/" ||
    PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionCookie && pathname === "/login") {
    return NextResponse.redirect(new URL("/painel", request.url));
  }

  // Checagem otimista de papel (via cookie cache, sem consulta ao banco). A autorização
  // de verdade é reforçada nas rotas de API — isso aqui só evita expor a UI errada.
  if (sessionCookie && !isPublicRoute) {
    const cache = await getCookieCache(request);
    const role = cache?.user?.role ?? "";

    for (const [resource, { forbiddenRoles }] of Object.entries(
      RESOURCE_ACCESS,
    )) {
      if (
        pathname.startsWith(`/${resource}`) &&
        (forbiddenRoles as readonly string[]).includes(role)
      ) {
        return NextResponse.redirect(new URL("/painel", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
