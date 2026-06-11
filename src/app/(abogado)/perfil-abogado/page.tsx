"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil } from "lucide-react";
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
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth, type AuthUser } from "@/hooks/useAuth";
import {
  changePasswordSchema,
  type ChangePasswordInput,
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/server/validators/auth.schema";

async function patchProfile(input: UpdateProfileInput): Promise<AuthUser> {
  const res = await fetch("/api/auth/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    credentials: "include",
  });
  const json = (await res.json()) as
    | { success: true; data: { user: AuthUser } }
    | { success: false; error: string };
  if (!res.ok || !json.success) {
    throw new Error(("error" in json && json.error) || "Error actualizando perfil");
  }
  return json.data.user;
}

async function patchPassword(input: ChangePasswordInput): Promise<string> {
  const res = await fetch("/api/auth/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    credentials: "include",
  });
  const json = (await res.json()) as
    | { success: true; data: { message: string } }
    | { success: false; error: string };
  if (!res.ok || !json.success) {
    throw new Error(("error" in json && json.error) || "Error al cambiar contraseña");
  }
  return json.data.message;
}

export default function PerfilAbogadoPage() {
  const { user, isLoading } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { firstName: "", lastName: "", phone: "" },
    mode: "onBlur",
  });

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? "",
      });
    }
  }, [user, form]);

  const mutation = useMutation({
    mutationFn: patchProfile,
    onSuccess: (updated) => {
      qc.setQueryData(["auth", "me"], updated);
      qc.invalidateQueries({ queryKey: ["auth"] });
      toast.success("Perfil actualizado");
      setEditing(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "No se pudo actualizar el perfil");
    },
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const passwordMutation = useMutation({
    mutationFn: patchPassword,
    onSuccess: (message) => {
      toast.success(message);
      passwordForm.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message || "No se pudo cambiar la contraseña");
    },
  });

  function onCancel() {
    if (user) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? "",
      });
    }
    setEditing(false);
  }

  return (
    <div className="mx-auto w-full max-w-[720px] p-4 sm:p-6 md:p-8">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-navy-900 md:text-3xl">
          Mi perfil profesional
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Actualiza tus datos y la contraseña de tu cuenta de abogado.
        </p>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        {isLoading || !user ? (
          <LoadingSkeleton variant="row" count={5} />
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
              className="flex flex-col gap-5"
              noValidate
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Nombre</FormLabel>
                      <FormControl>
                        <Input
                          className="h-11 px-3.5 text-base"
                          disabled={!editing || mutation.isPending}
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
                          className="h-11 px-3.5 text-base"
                          disabled={!editing || mutation.isPending}
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+56 9 1234 5678"
                        className="h-11 px-3.5 text-base"
                        disabled={!editing || mutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-danger-700" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-sm font-semibold text-gray-700">
                    Email
                  </p>
                  <Input
                    value={user.email}
                    disabled
                    className="h-11 cursor-not-allowed bg-gray-50 px-3.5 text-base text-gray-700"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    El email no se puede modificar.
                  </p>
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-semibold text-gray-700">
                    RUT
                  </p>
                  <Input
                    value={user.rut ?? "—"}
                    disabled
                    className="h-11 cursor-not-allowed bg-gray-50 px-3.5 text-base text-gray-700"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    El RUT no se puede modificar.
                  </p>
                </div>
              </div>

              <div className="mt-2 flex flex-col-reverse items-stretch gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-end">
                {editing ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      size="lg"
                      onClick={onCancel}
                      disabled={mutation.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" size="lg" disabled={mutation.isPending}>
                      {mutation.isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          Guardando...
                        </>
                      ) : (
                        "Guardar cambios"
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="size-4" aria-hidden />
                    Editar perfil
                  </Button>
                )}
              </div>
            </form>
          </Form>
        )}
      </section>

      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-navy-900">Cambiar contraseña</h2>
          <p className="mt-2 text-sm text-gray-500">
            Completa este formulario si deseas actualizar tu contraseña.
          </p>
        </div>

        <Form {...passwordForm}>
          <form
            onSubmit={passwordForm.handleSubmit((data) => passwordMutation.mutate(data))}
            className="grid gap-5"
            noValidate
          >
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Contraseña actual</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      className="h-11 px-3.5 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-danger-700" />
                </FormItem>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Nueva contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      className="h-11 px-3.5 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-danger-700" />
                </FormItem>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Repetir nueva contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      className="h-11 px-3.5 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-danger-700" />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={passwordMutation.isPending}
              >
                {passwordMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Actualizando...
                  </>
                ) : (
                  "Cambiar contraseña"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </section>
    </div>
  );
}
