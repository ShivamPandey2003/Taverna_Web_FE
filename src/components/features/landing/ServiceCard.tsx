
interface ServiceCardProps {
  title: string;
  description: string;
  image: string;
  badge?: string;
  features: string[];
}

export function ServiceCard({
  title,
  description,
  image,
  badge,
  features,
}: ServiceCardProps) {
  return (
    <article className="rounded-card border border-border bg-white p-5">

      <div className="flex flex-col gap-5 sm:flex-row">

        {/* Image; full width above the text on phones */}
        <img
          src={image}
          alt={title}
          className="h-40 w-full shrink-0 rounded-lg object-cover sm:h-28 sm:w-40"
        />

        {/* Content */}
        <div className="min-w-0 flex-1">

          <div className="flex items-start justify-between gap-3">

            <h3 className="text-base font-bold">
              {title}
            </h3>

            {badge && (
              <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold text-primary">
                {badge}
              </span>
            )}

          </div>

          <p className="mt-1 text-xs leading-5 text-text-secondary">
            {description}
          </p>

          <ul className="mt-2 space-y-1">
            {features.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2 text-xs text-gray-600"
              >
                <span className="text-primary">✓</span>
                {feature}
              </li>
            ))}
          </ul>

        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <button className="text-xs font-semibold">
          Explore details & select options
        </button>

        <span>→</span>
      </div>

    </article>
  );
}