import { User } from "lucide-react";

export default function PerfilAbogadoPage() {
  return (
    <div className="mx-auto w-full max-w-[800px] p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
          Mi perfil
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Tus datos personales y profesionales.
        </p>
      </header>

      <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
        <User className="size-10 text-gray-300" aria-hidden />
        <h2 className="text-lg font-semibold text-gray-700">En construcción</h2>
        <p className="max-w-sm text-base text-gray-500">
          Pronto podrás editar tu biografía, especialidades, fotografía y datos
          de colegiación.
        </p>
      </div>
    </div>
  );
}
