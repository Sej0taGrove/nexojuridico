import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ACCESS_TOKEN_COOKIE, verifyAccessToken } from "@/lib/auth/jwt";
import { homeForRole } from "@/lib/auth/roles";

// En Next.js 16 "middleware" se renombró a "proxy". El archivo se llama
// proxy.ts y la función exportada se llama `proxy`. Ver:
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md

const PUBLIC_PREFIXES = [
  "/login",
  "/registro",
  "/api/auth",
  "/terminos",
  "/privacidad",
  "/recuperar-password",
];

const CLIENT_PREFIXES = ["/dashboard", "/mis-casos", "/publicar-caso"];
const LAWYER_PREFIXES = [
  "/feed",
  "/mis-casos-abogado",
  "/dashboard-abogado",
];
const ADMIN_PREFIXES = ["/admin"];

function startsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Home pública
  if (pathname === "/") return NextResponse.next();

  const isPublic = startsWithAny(pathname, PUBLIC_PREFIXES);
  const isClientRoute = startsWithAny(pathname, CLIENT_PREFIXES);
  const isLawyerRoute = startsWithAny(pathname, LAWYER_PREFIXES);
  const isAdminRoute = startsWithAny(pathname, ADMIN_PREFIXES);
  const isProtected = isClientRoute || isLawyerRoute || isAdminRoute;

  if (isPublic && !isProtected) return NextResponse.next();
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  let payload: Awaited<ReturnType<typeof verifyAccessToken>>;
  try {
    payload = await verifyAccessToken(token);
  } catch {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    const res = NextResponse.redirect(url);
    res.cookies.delete(ACCESS_TOKEN_COOKIE);
    return res;
  }

  const role = payload.role;
  const allowed =
    (isClientRoute && role === "client") ||
    (isLawyerRoute && role === "lawyer") ||
    (isAdminRoute && role === "admin");

  if (!allowed) {
    const url = request.nextUrl.clone();
    url.pathname = homeForRole(role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
