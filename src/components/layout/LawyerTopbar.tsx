"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useMemo } from "react";
import { ChevronRight, Menu } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

type Crumb = { label: string; href?: string };

const SEGMENT_LABELS: Record<string, string> = {
  feed: "Feed",
  "mis-casos-abogado": "Mis casos",
  "dashboard-abogado": "Dashboard",
  configuracion: "Configuración",
  "perfil-abogado": "Mi perfil",
};

function rootForPath(pathname: string): Crumb {
  if (pathname.startsWith("/mis-casos-abogado")) {
    return { label: "Mis casos", href: "/mis-casos-abogado" };
  }
  if (pathname.startsWith("/dashboard-abogado")) {
    return { label: "Dashboard", href: "/dashboard-abogado" };
  }
  if (pathname.startsWith("/configuracion")) {
    return { label: "Configuración", href: "/configuracion" };
  }
  if (pathname.startsWith("/perfil-abogado")) {
    return { label: "Mi perfil", href: "/perfil-abogado" };
  }
  return { label: "Feed", href: "/feed" };
}

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [{ label: "Feed" }];

  const crumbs: Crumb[] = [rootForPath(pathname)];
  // Si hay un sub-segmento (detalle), añadirlo
  if (segments.length > 1) {
    const last = segments[segments.length - 1];
    const label = SEGMENT_LABELS[last] ?? "Detalle";
    crumbs[0] = { ...crumbs[0] }; // ensure root retains href
    crumbs.push({ label });
  } else {
    // Single-segment: convertir el último (root) en sin href
    const last = segments[0];
    const label = SEGMENT_LABELS[last] ?? crumbs[0].label;
    crumbs[0] = { label };
  }
  return crumbs;
}

function initials(firstName?: string, lastName?: string): string {
  const a = firstName?.trim()?.[0] ?? "";
  const b = lastName?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

export function LawyerTopbar({
  onOpenSidebar,
}: {
  onOpenSidebar: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const breadcrumbs = useMemo(() => buildCrumbs(pathname), [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Abrir menú"
          className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 md:hidden"
        >
          <Menu className="size-5" />
        </button>
        <nav
          aria-label="Migas de pan"
          className="flex items-center gap-2 text-sm font-medium"
        >
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <Fragment key={`${crumb.label}-${idx}`}>
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="text-gray-500 transition-colors hover:text-navy-600"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={
                      isLast
                        ? "font-semibold text-navy-700"
                        : "text-gray-500"
                    }
                  >
                    {crumb.label}
                  </span>
                )}
                {!isLast ? (
                  <ChevronRight
                    className="size-4 text-gray-400"
                    aria-hidden
                  />
                ) : null}
              </Fragment>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/perfil-abogado"
          aria-label="Mi perfil"
          className="ml-1 flex size-9 items-center justify-center rounded-full bg-navy-100 text-sm font-semibold text-navy-700 transition-colors hover:bg-navy-200"
        >
          {initials(user?.firstName, user?.lastName)}
        </Link>
      </div>
    </header>
  );
}
