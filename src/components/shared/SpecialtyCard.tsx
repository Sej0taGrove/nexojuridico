import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type SpecialtyCardProps = {
  icon: LucideIcon;
  name: string;
  description: string;
  href: string;
};

export function SpecialtyCard({
  icon: Icon,
  name,
  description,
  href,
}: SpecialtyCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-6 transition-all duration-150 hover:border-navy-300 hover:shadow-sm"
    >
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-md bg-navy-50 text-navy-600 transition-colors group-hover:bg-navy-100"
      >
        <Icon className="size-5" />
      </span>

      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold text-gray-900 transition-colors group-hover:text-navy-700">
          {name}
        </span>
        <span className="text-sm text-gray-600">{description}</span>
      </div>
    </Link>
  );
}
