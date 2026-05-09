"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserRole } from "@prisma/client";

export type AuthUser = {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string | null;
  rut: string | null;
};

async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Error consultando sesión");
  const json = (await res.json()) as { success: boolean; data?: { user: AuthUser } };
  if (!json.success || !json.data) return null;
  return json.data.user;
}

export function useAuth() {
  const router = useRouter();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    staleTime: 60_000,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("No se pudo cerrar sesión");
    },
    onSettled: () => {
      qc.removeQueries({ queryKey: ["auth"] });
      router.push("/login");
      router.refresh();
    },
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
  };
}
