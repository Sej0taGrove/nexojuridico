import Link from "next/link";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-gray-200 bg-gray-50">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
        <Link href="/" className="text-lg font-bold text-navy-700">
          NexoJurídico
        </Link>

        <p className="text-sm text-gray-500">
          © {year} NexoJurídico. Todos los derechos reservados.
        </p>

        <nav className="flex gap-6">
          <Link
            href="/terminos"
            className="text-sm text-gray-500 transition-colors hover:text-navy-600"
          >
            Términos
          </Link>
          <Link
            href="/privacidad"
            className="text-sm text-gray-500 transition-colors hover:text-navy-600"
          >
            Privacidad
          </Link>
          <Link
            href="/contacto"
            className="text-sm text-gray-500 transition-colors hover:text-navy-600"
          >
            Contacto
          </Link>
        </nav>
      </div>
    </footer>
  );
}
