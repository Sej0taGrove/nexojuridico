import Link from "next/link";
import { ArrowRight, Scale, User } from "lucide-react";

export default function RegistroSelectorPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="mb-10 max-w-xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-navy-800 md:text-4xl">
          Crea tu cuenta
        </h1>
        <p className="mt-3 text-base text-gray-600">
          Elige el tipo de cuenta que mejor se ajusta a ti.
        </p>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
        <Link
          href="/registro/cliente"
          className="group flex flex-col items-start gap-5 rounded-xl border border-gray-200 bg-white p-7 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-navy-300 hover:shadow-md"
        >
          <span
            aria-hidden
            className="flex size-12 items-center justify-center rounded-lg bg-navy-50 text-navy-600 transition-colors group-hover:bg-navy-100"
          >
            <User className="size-6" />
          </span>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-navy-700">
              Soy ciudadano
            </h2>
            <p className="text-sm text-gray-600">
              Necesito ayuda con un caso legal y quiero conectar con un abogado
              especialista.
            </p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-navy-600">
            Crear cuenta
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </Link>

        <Link
          href="/registro/abogado"
          className="group flex flex-col items-start gap-5 rounded-xl border border-gray-200 bg-white p-7 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-navy-300 hover:shadow-md"
        >
          <span
            aria-hidden
            className="flex size-12 items-center justify-center rounded-lg bg-navy-50 text-navy-600 transition-colors group-hover:bg-navy-100"
          >
            <Scale className="size-6" />
          </span>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-navy-700">
              Soy abogado
            </h2>
            <p className="text-sm text-gray-600">
              Quiero recibir casos pre-filtrados según mi especialidad y ampliar
              mi cartera de clientes.
            </p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-navy-600">
            Postular como abogado
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </Link>
      </div>

      <p className="mt-8 text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-navy-600 hover:text-navy-700 hover:underline"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
