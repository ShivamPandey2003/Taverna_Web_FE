import type { IconComponent } from "reicon-react";

interface ProcessCardProps {
  step: string;
  title: string;
  description: string;
  Icon: IconComponent
}

export function ProcessCard({
  step,
  title,
  Icon,
  description,
}: ProcessCardProps) {
  return (
    <div className="rounded-card border border-border bg-white p-7">

      <div className="flex items-center justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
          <Icon/>
        </div>

        <span className="text-xs font-bold text-primary">
          {step}
        </span>

      </div>

      <h3 className="mt-7 text-base font-bold">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-text-secondary">
        {description}
      </p>

    </div>
  );
}