import { NextRequest, NextResponse } from "next/server";
import { getCookieCache, getSessionCookie } from "better-auth/cookies";

const PUBLIC_ROUTES = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = pathname === "/" || PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionCookie && pathname === "/login") {
    return NextResponse.redirect(new URL("/animais", request.url));
  }

  // Checagem otimista de papel (via cookie cache, sem consulta ao banco). A autorização
  // de verdade é reforçada nas rotas de API — isso aqui só evita expor a UI errada.
  if (sessionCookie && !isPublicRoute) {
    const cache = await getCookieCache(request);
    const role = cache?.user?.role;

    if (pathname.startsWith("/usuarios") && role !== "admin") {
      return NextResponse.redirect(new URL("/animais", request.url));
    }

    if (pathname.startsWith("/pessoas") && role === "tecnico") {
      return NextResponse.redirect(new URL("/animais", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
