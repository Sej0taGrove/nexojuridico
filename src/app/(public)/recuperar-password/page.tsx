"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
  passwordResetRequestSchema,
  type PasswordResetRequestInput,
} from "@/server/validators/auth.schema";

export default function RecoverPasswordPage() {
  const [devToken, setDevToken] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const form = useForm<PasswordResetRequestInput>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: { email: "" },
    mode: "onBlur",
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: PasswordResetRequestInput) {
    try {
      const res = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "No se pudo solicitar restablecimiento");
        return;
      }

      toast.success(json.data.message);
      setSent(true);
      setDevToken(json.data.devToken ?? null);
      form.reset();
    } catch {
      toast.error("Error de red. Intenta de nuevo.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-navy-900">
            Recuperar contraseña
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="tu@email.com"
                      autoComplete="email"
                      className="h-11 px-3.5 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-danger-700" />
                </FormItem>
              )}
            />

            <Button type="submit" className="h-11 w-full text-base" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Enviando...
                </>
              ) : (
                "Solicitar enlace"
              )}
            </Button>
          </form>
        </Form>

        {sent ? (
          <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-800">
            Si el email existe, hemos enviado las instrucciones.
            {devToken ? (
              <div className="mt-3 rounded-lg bg-white p-4 text-xs text-slate-700">
                <p className="font-semibold text-slate-900">Token de desarrollo</p>
                <p className="mt-2 break-all">{devToken}</p>
                <p className="mt-3">
                  Prueba el link: <Link className="font-semibold text-navy-600 hover:underline" href={`/recuperar-password/${devToken}`}>
                    Ir a restablecer contraseña
                  </Link>
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 border-t border-gray-200 pt-4 text-center text-sm text-gray-500">
          <Link href="/login" className="font-medium text-navy-600 hover:text-navy-700 hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
