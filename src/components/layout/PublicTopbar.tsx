import Link from "next/link";
import { cookies } from "next/headers";

import { Button } from "@/components/ui/button";
import { ACCESS_TOKEN_COOKIE, verifyAccessToken } from "@/lib/auth/jwt";
import { homeForRole } from "@/lib/auth/roles";

async function getLoggedHome(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = await verifyAccessToken(token);
    return homeForRole(payload.role);
  } catch {
    return null;
  }
}

export async function PublicTopbar() {
  const loggedHome = await getLoggedHome();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-navy-700 transition-colors hover:text-navy-600"
          >
            NexoJurídico
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#como-funciona"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-navy-600"
            >
              Cómo funciona
            </a>
            <a
              href="#especialidades"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-navy-600"
            >
              Especialidades
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {loggedHome ? (
            <Button asChild variant="default" size="lg">
              <Link href={loggedHome}>Ir al panel</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="hidden md:inline-flex"
              >
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button asChild variant="default" size="lg">
                <Link href="/registro">Registrarse</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
