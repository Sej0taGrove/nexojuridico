"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useMemo } from "react";
import { ChevronRight, Menu } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

type Crumb = { label: string; href?: string };

const ROOT_LABELS: Record<string, string> = {
  abogados: "Abogados",
  casos: "Casos",
  huerfanos: "Casos huérfanos",
  especialidades: "Especialidades",
  reglas: "Reglas matchmaking",
  configuracion: "Configuración",
};

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  // /admin → solo "Dashboard"
  if (segments.length === 0 || (segments.length === 1 && segments[0] === "admin")) {
    return [{ label: "Dashboard" }];
  }
  // /admin/<root>[/<id>]
  const root = segments[1];
  const rootLabel = ROOT_LABELS[root] ?? "Sección";
  const crumbs: Crumb[] = [{ label: "Admin", href: "/admin" }];
  if (segments.length === 2) {
    crumbs.push({ label: rootLabel });
  } else {
    crumbs.push({ label: rootLabel, href: `/admin/${root}` });
    crumbs.push({ label: "Detalle" });
  }
  return crumbs;
}

function initials(firstName?: string, lastName?: string): string {
  const a = firstName?.trim()?.[0] ?? "";
  const b = lastName?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

export function AdminTopbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const crumbs = useMemo(() => buildCrumbs(pathname), [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-gray-200 bg-white px-4 md:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Abrir menú"
          className="shrink-0 rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 md:hidden"
        >
          <Menu className="size-5" />
        </button>
        <nav
          aria-label="Migas de pan"
          className="flex min-w-0 items-center gap-2 overflow-hidden text-sm font-medium"
        >
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            const hiddenOnMobile = !last && i > 0;
            return (
              <Fragment key={`${c.label}-${i}`}>
                {c.href && !last ? (
                  <Link
                    href={c.href}
                    className={`truncate text-gray-500 transition-colors hover:text-navy-600 ${
                      hiddenOnMobile ? "hidden sm:inline" : ""
                    }`}
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span
                    className={`truncate ${
                      last ? "font-semibold text-navy-700" : "text-gray-500"
                    } ${hiddenOnMobile ? "hidden sm:inline" : ""}`}
                  >
                    {c.label}
                  </span>
                )}
                {!last ? (
                  <ChevronRight
                    className={`size-4 shrink-0 text-gray-400 ${
                      hiddenOnMobile ? "hidden sm:inline" : ""
                    }`}
                    aria-hidden
                  />
                ) : null}
              </Fragment>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden text-xs text-gray-500 sm:block">
          {user?.email}
        </span>
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-full bg-navy-100 text-sm font-semibold text-navy-700"
        >
          {initials(user?.firstName, user?.lastName)}
        </span>
      </div>
    </header>
  );
}
