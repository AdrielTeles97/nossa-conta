import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function middleware(request: NextRequest) {
  // Pega o cookie de sessão do Better Auth
  const sessionToken = request.cookies.get("better-auth.session_token");

  // Se tentar acessar o /dashboard ou qualquer sub-rota sem token, manda pro login
  if (request.nextUrl.pathname.startsWith("/dashboard") && !sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Se já estiver logado e tentar ir pro login, manda pro dashboard
  if (request.nextUrl.pathname === "/login" && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};