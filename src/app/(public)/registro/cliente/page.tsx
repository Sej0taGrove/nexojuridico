"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RutInput } from "@/components/forms/RutInput";
import {
  registerClientSchema,
  type RegisterClientInput,
} from "@/server/validators/auth.schema";

export default function RegistroClientePage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<RegisterClientInput>({
    resolver: zodResolver(registerClientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      rut: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false as unknown as true,
    },
    mode: "onBlur",
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: RegisterClientInput) {
    try {
      const res = await fetch("/api/auth/register/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(json.error ?? "No se pudo crear la cuenta");
        return;
      }

      toast.success("Cuenta creada", {
        description: "Inicia sesión para continuar.",
      });
      router.push("/login");
    } catch {
      toast.error("Error de red. Intenta de nuevo.");
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-[560px] rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-sm font-bold tracking-tight text-navy-600">
            NexoJurídico
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-navy-800">
            Crea tu cuenta de ciudadano
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Publica tu caso y conecta con un abogado especialista
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Nombre</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="given-name"
                        className="h-11 px-3.5 text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-danger-700" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Apellido</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="family-name"
                        className="h-11 px-3.5 text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-danger-700" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="rut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">RUT</FormLabel>
                  <FormControl>
                    <RutInput
                      className="h-11 px-3.5 text-base"
                      placeholder="12.345.678-9"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormMessage className="text-danger-700" />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">
                    Teléfono{" "}
                    <span className="font-normal text-gray-500">
                      (opcional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+56 9 1234 5678"
                      autoComplete="tel"
                      className="h-11 px-3.5 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-danger-700" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Contraseña</FormLabel>
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
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-700 focus:outline-none focus-visible:text-navy-600"
                          aria-label={
                            showPassword
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                          tabIndex={-1}
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
                    <FormLabel className="text-gray-700">
                      Confirmar contraseña
                    </FormLabel>
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
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-700 focus:outline-none focus-visible:text-navy-600"
                          aria-label={
                            showConfirm
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                          tabIndex={-1}
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
            </div>

            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-2.5 space-y-0">
                  <FormControl>
                    <Checkbox
                      className="mt-0.5"
                      checked={field.value === true}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  </FormControl>
                  <div className="flex-1 leading-snug">
                    <FormLabel className="cursor-pointer text-sm font-normal text-gray-700">
                      Acepto los{" "}
                      <Link
                        href="/terminos"
                        className="font-medium text-navy-600 hover:underline"
                      >
                        Términos y Condiciones
                      </Link>{" "}
                      y la{" "}
                      <Link
                        href="/privacidad"
                        className="font-medium text-navy-600 hover:underline"
                      >
                        Política de Privacidad
                      </Link>
                    </FormLabel>
                    <FormMessage className="mt-1 text-danger-700" />
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="h-11 w-full text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Creando cuenta...
                </>
              ) : (
                "Crear cuenta"
              )}
            </Button>
          </form>
        </Form>

        <p className="mt-6 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-navy-600 hover:text-navy-700 hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
