"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  passwordResetConfirmSchema,
  type PasswordResetConfirmInput,
} from "@/server/validators/auth.schema";

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<PasswordResetConfirmInput>({
    resolver: zodResolver(passwordResetConfirmSchema),
    defaultValues: { token: params.token, password: "", confirmPassword: "" },
    mode: "onBlur",
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: PasswordResetConfirmInput) {
    try {
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "No se pudo restablecer la contraseña");
        return;
      }

      toast.success(json.data.message);
      router.push("/login");
    } catch {
      toast.error("Error de red. Intenta de nuevo.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-navy-900">
            Nuevo password
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Escribe tu nueva contraseña para recuperar el acceso.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Nueva contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className="h-11 px-3.5 pr-11 text-base"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-700 focus:outline-none"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" aria-hidden />
                        ) : (
                          <Eye className="size-4" aria-hidden />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-danger-700" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Repetir contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        className="h-11 px-3.5 pr-11 text-base"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((value) => !value)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-700 focus:outline-none"
                        aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showConfirm ? (
                          <EyeOff className="size-4" aria-hidden />
                        ) : (
                          <Eye className="size-4" aria-hidden />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-danger-700" />
                </FormItem>
              )}
            />

            <Button type="submit" className="h-11 w-full text-base" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Restableciendo...
                </>
              ) : (
                "Restablecer contraseña"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
