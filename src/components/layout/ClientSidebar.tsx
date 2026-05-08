"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  FolderOpen,
  Home,
  LogOut,
  Scale,
  Settings,
  User,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/mis-casos", label: "Mis casos", icon: FolderOpen },
  { href: "/notificaciones", label: "Notificaciones", icon: Bell },
  { href: "/perfil", label: "Mi perfil", icon: User },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(firstName?: string, lastName?: string): string {
  const a = firstName?.trim()?.[0] ?? "";
  const b = lastName?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

export function ClientSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user, logout, isLoggingOut } = useAuth();

  return (
    <>
      {/* Overlay móvil */}
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-navy-900/60 backdrop-blur-sm transition-opacity md:hidden",
          open
            ? "opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-navy-900 py-6 text-white shadow-lg transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Brand + close móvil */}
        <div className="flex items-center justify-between px-6 pb-2">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-9 items-center justify-center rounded-md bg-navy-600"
            >
              <Scale className="size-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-lg font-bold tracking-tight">
                NexoJurídico
              </span>
              <span className="text-xs text-navy-200">Ciudadano</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded-md p-1 text-gray-300 transition-colors hover:bg-navy-800 hover:text-white md:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navegación principal */}
        <nav className="mt-6 flex flex-1 flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-r-md py-2.5 pl-4 pr-3 text-sm font-medium transition-colors",
                  active
                    ? "border-l-4 border-navy-400 bg-navy-800 pl-3 text-white"
                    : "text-gray-300 hover:bg-navy-800 hover:text-white",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-danger-500 px-2 py-0.5 text-xs font-semibold">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Footer: ajustes + perfil + logout */}
        <div className="mt-auto flex flex-col gap-1 border-t border-navy-800 px-2 pt-4">
          <Link
            href="/perfil"
            onClick={onClose}
            className="flex items-center gap-3 rounded-md py-2.5 pl-4 pr-3 text-sm font-medium text-gray-300 transition-colors hover:bg-navy-800 hover:text-white"
          >
            <Settings className="size-5" aria-hidden />
            <span>Ajustes</span>
          </Link>

          <div className="mx-2 mt-2 flex items-center gap-3 rounded-md bg-navy-800/50 px-3 py-3">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-navy-600 text-sm font-semibold text-white"
            >
              {initials(user?.firstName, user?.lastName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user ? `${user.firstName} ${user.lastName}` : "Cargando..."}
              </p>
              <p className="truncate text-xs text-gray-400">
                {user?.email ?? ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              disabled={isLoggingOut}
              aria-label="Cerrar sesión"
              className="rounded-md p-2 text-gray-300 transition-colors hover:bg-navy-700 hover:text-white disabled:opacity-50"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
