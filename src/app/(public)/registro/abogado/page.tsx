"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { FileDropzone } from "@/components/forms/FileDropzone";
import { RutInput } from "@/components/forms/RutInput";
import { SPECIALTIES, type SpecialtyCode } from "@/lib/constants/specialties";
import {
  registerLawyerSchema,
  type RegisterLawyerInput,
} from "@/server/validators/auth.schema";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-navy-800">{children}</h2>
  );
}

export default function RegistroAbogadoPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<RegisterLawyerInput>({
    resolver: zodResolver(registerLawyerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      rut: "",
      phone: "",
      email: "",
      barNumber: "",
      specialties: [],
      titleCert: undefined as unknown as File,
      barCert: undefined as unknown as File,
      password: "",
      confirmPassword: "",
      acceptTerms: false as unknown as true,
    },
    mode: "onBlur",
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: RegisterLawyerInput) {
    // Los archivos se subirán en una fase posterior. Por ahora la API
    // recibe solo los campos de texto.
    const { titleCert: _t, barCert: _b, ...payload } = data;
    void _t;
    void _b;

    try {
      const res = await fetch("/api/auth/register/lawyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(json.error ?? "No se pudo enviar la solicitud");
        return;
      }

      toast.success("Solicitud enviada", {
        description: "Espera la validación del administrador para iniciar sesión.",
      });
      router.push("/login");
    } catch {
      toast.error("Error de red. Intenta de nuevo.");
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-[720px] rounded-xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="mb-6 text-center">
          <p className="text-sm font-bold tracking-tight text-navy-600">
            NexoJurídico
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-navy-800">
            Únete como abogado
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Tu cuenta será revisada antes de activarse en el marketplace
          </p>
        </div>

        <Alert className="mb-7 border-navy-200 bg-navy-50 text-navy-800">
          <Info className="text-navy-600" />
          <AlertDescription className="text-sm leading-relaxed text-navy-800">
            Tu cuenta quedará en estado{" "}
            <span className="font-semibold">Pendiente de validación</span> hasta
            que el administrador apruebe tus documentos. Recibirás un email
            cuando se complete el proceso.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8"
            noValidate
          >
            {/* Datos personales */}
            <section className="space-y-5">
              <SectionHeading>Datos personales</SectionHeading>

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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Teléfono</FormLabel>
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
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      Email profesional
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="nombre@estudio.cl"
                        autoComplete="email"
                        className="h-11 px-3.5 text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-danger-700" />
                  </FormItem>
                )}
              />
            </section>

            {/* Datos profesionales */}
            <section className="space-y-5">
              <SectionHeading>Datos profesionales</SectionHeading>

              <FormField
                control={form.control}
                name="barNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      Número de colegiatura
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: 12345"
                        autoComplete="off"
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
                name="specialties"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      Especialidades{" "}
                      <span className="font-normal text-gray-500">
                        (selecciona al menos una)
                      </span>
                    </FormLabel>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                      {SPECIALTIES.map((spec) => {
                        const checked = field.value.includes(spec.code);
                        return (
                          <label
                            key={spec.code}
                            className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3.5 py-3 transition-colors ${
                              checked
                                ? "border-navy-500 bg-navy-50"
                                : "border-gray-200 bg-white hover:border-navy-300 hover:bg-gray-50"
                            }`}
                          >
                            <Checkbox
                              className="mt-0.5"
                              checked={checked}
                              onCheckedChange={(c) => {
                                const next = new Set<SpecialtyCode>(
                                  field.value,
                                );
                                if (c === true) next.add(spec.code);
                                else next.delete(spec.code);
                                field.onChange(Array.from(next));
                              }}
                            />
                            <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                              <spec.icon
                                aria-hidden
                                className="size-4 text-navy-600"
                              />
                              {spec.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {fieldState.error && (
                      <p className="mt-1 text-sm text-danger-700">
                        {fieldState.error.message}
                      </p>
                    )}
                  </FormItem>
                )}
              />
            </section>

            {/* Documentos requeridos */}
            <section className="space-y-5">
              <SectionHeading>Documentos requeridos</SectionHeading>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="titleCert"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">
                        Certificado de título
                      </FormLabel>
                      <FileDropzone
                        label="Sube tu certificado"
                        value={field.value ?? null}
                        onChange={(f) =>
                          field.onChange(f as unknown as File)
                        }
                        onBlur={field.onBlur}
                        invalid={!!fieldState.error}
                      />
                      {fieldState.error && (
                        <p className="mt-1 text-sm text-danger-700">
                          {fieldState.error.message}
                        </p>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="barCert"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">
                        Certificado de colegiatura
                      </FormLabel>
                      <FileDropzone
                        label="Sube tu certificado"
                        value={field.value ?? null}
                        onChange={(f) =>
                          field.onChange(f as unknown as File)
                        }
                        onBlur={field.onBlur}
                        invalid={!!fieldState.error}
                      />
                      {fieldState.error && (
                        <p className="mt-1 text-sm text-danger-700">
                          {fieldState.error.message}
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* Seguridad */}
            <section className="space-y-5">
              <SectionHeading>Seguridad</SectionHeading>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">
                        Contraseña
                      </FormLabel>
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
            </section>

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
                  Enviando solicitud...
                </>
              ) : (
                "Enviar solicitud de registro"
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
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
