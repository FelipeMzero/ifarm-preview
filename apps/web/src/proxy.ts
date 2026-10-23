import { NextRequest, NextResponse } from "next/server";
import { getCookieCache, getSessionCookie } from "better-auth/cookies";
import { RESOURCE_ACCESS } from "@ifarm/shared";

const PUBLIC_ROUTES = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

// /api/* não passa por aqui: o next.config.ts repassa essas chamadas para a API (apps/api).
export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico).*)"],
};
