import type { LucideIcon } from "lucide-react";

type HowItWorksStepProps = {
  icon: LucideIcon;
  step: number;
  title: string;
  description: string;
};

export function HowItWorksStep({
  icon: Icon,
  step,
  title,
  description,
}: HowItWorksStepProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <span
        aria-hidden
        className="mb-6 flex size-16 items-center justify-center rounded-full bg-navy-50 text-navy-600"
      >
        <Icon className="size-7" />
      </span>

      <h3 className="mb-2 text-xl font-semibold text-gray-900">
        {step}. {title}
      </h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
