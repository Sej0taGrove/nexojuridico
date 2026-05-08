"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  FolderOpen,
  Layers,
  LogOut,
  Scale,
  Settings,
  Sliders,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "orphanCount";
};

type NavSection = {
  title: string;
  items: readonly NavItem[];
};

const SECTIONS: readonly NavSection[] = [
  {
    title: "Gestión",
    items: [
      { href: "/admin", label: "Dashboard", icon: BarChart3 },
      { href: "/admin/abogados", label: "Abogados", icon: Users },
      { href: "/admin/casos", label: "Casos", icon: FolderOpen },
      {
        href: "/admin/huerfanos",
        label: "Casos huérfanos",
        icon: AlertTriangle,
        badgeKey: "orphanCount",
      },
    ],
  },
  {
    title: "Configuración",
    items: [
      {
        href: "/admin/especialidades",
        label: "Especialidades",
        icon: Layers,
      },
      { href: "/admin/reglas", label: "Reglas matchmaking", icon: Sliders },
      {
        href: "/admin/configuracion",
        label: "Configuración",
        icon: Settings,
      },
    ],
  },
];

type SidebarStats = { orphanCount: number };

async function fetchSidebarStats(): Promise<SidebarStats> {
  const res = await fetch("/api/admin/sidebar-stats", {
    credentials: "include",
  });
  if (!res.ok) return { orphanCount: 0 };
  const json = await res.json();
  if (!json.success) return { orphanCount: 0 };
  return json.data as SidebarStats;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(firstName?: string, lastName?: string): string {
  const a = firstName?.trim()?.[0] ?? "";
  const b = lastName?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

export function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user, logout, isLoggingOut } = useAuth();
  const { data: stats } = useQuery({
    queryKey: ["admin", "sidebar-stats"],
    queryFn: fetchSidebarStats,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const badgeValue = (key: NavItem["badgeKey"]): number => {
    if (!key) return 0;
    if (key === "orphanCount") return stats?.orphanCount ?? 0;
    return 0;
  };

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-navy-900/60 backdrop-blur-sm transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-navy-900 py-6 text-white shadow-lg transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between px-6 pb-2">
          <Link href="/admin" className="flex items-center gap-3">
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
              <span className="text-xs text-navy-200">Admin Panel</span>
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

        <nav className="mt-6 flex flex-1 flex-col gap-6 overflow-y-auto px-2">
          {SECTIONS.map((section) => (
            <div key={section.title} className="flex flex-col gap-1">
              <h3 className="px-4 pb-1 text-xs font-semibold uppercase tracking-wider text-navy-300">
                {section.title}
              </h3>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                const badge = badgeValue(item.badgeKey);
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
                    {badge > 0 ? (
                      <span className="rounded-full bg-danger-500 px-2 py-0.5 text-xs font-semibold">
                        {badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-1 border-t border-navy-800 px-2 pt-4">
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
              <p className="truncate text-xs text-gray-400">Administrador</p>
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
