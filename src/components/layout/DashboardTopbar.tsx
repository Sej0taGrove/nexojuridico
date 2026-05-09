"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useMemo } from "react";
import { Bell, ChevronRight, HelpCircle, Menu, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export type Crumb = { label: string; href?: string };

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Inicio",
  "mis-casos": "Mis casos",
  "publicar-caso": "Publicar caso",
  notificaciones: "Notificaciones",
  perfil: "Mi perfil",
  ayuda: "Ayuda",
};

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [{ label: "Inicio" }];

  const crumbs: Crumb[] = [{ label: "Inicio", href: "/dashboard" }];
  let acc = "";
  segments.forEach((seg, idx) => {
    acc += `/${seg}`;
    const isLast = idx === segments.length - 1;
    // Reemplaza IDs (uuid o cualquier slug-no-listado) por "Detalle".
    const label =
      SEGMENT_LABELS[seg] ?? (seg.length > 20 ? "Detalle" : seg);
    if (idx === 0 && seg === "dashboard") return; // ya agregado arriba
    crumbs.push({ label, href: isLast ? undefined : acc });
  });
  return crumbs;
}

function initials(firstName?: string, lastName?: string): string {
  const a = firstName?.trim()?.[0] ?? "";
  const b = lastName?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

export function DashboardTopbar({
  onOpenSidebar,
}: {
  onOpenSidebar: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const breadcrumbs = useMemo(() => buildCrumbs(pathname), [pathname]);

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
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            // En móvil ocultamos crumbs intermedios para evitar overflow.
            const hiddenOnMobile = !isLast && idx > 0;
            return (
              <Fragment key={`${crumb.label}-${idx}`}>
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className={`truncate text-gray-500 transition-colors hover:text-navy-600 ${
                      hiddenOnMobile ? "hidden sm:inline" : ""
                    }`}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={`truncate ${
                      isLast
                        ? "font-semibold text-navy-700"
                        : "text-gray-500"
                    } ${hiddenOnMobile ? "hidden sm:inline" : ""}`}
                  >
                    {crumb.label}
                  </span>
                )}
                {!isLast ? (
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
        <Link
          href="/notificaciones"
          aria-label="Notificaciones"
          className="hidden rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-navy-600 sm:inline-flex"
        >
          <Bell className="size-5" />
        </Link>
        <Link
          href="/ayuda"
          aria-label="Ayuda"
          className="hidden rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-navy-600 sm:inline-flex"
        >
          <HelpCircle className="size-5" />
        </Link>

        <Button asChild size="lg" className="hidden sm:inline-flex">
          <Link href="/publicar-caso">
            <Plus className="size-4" aria-hidden />
            Nuevo caso
          </Link>
        </Button>

        <Link
          href="/perfil"
          aria-label="Mi perfil"
          className="ml-1 flex size-9 items-center justify-center rounded-full bg-navy-100 text-sm font-semibold text-navy-700 transition-colors hover:bg-navy-200"
        >
          {initials(user?.firstName, user?.lastName)}
        </Link>
      </div>
    </header>
  );
}
