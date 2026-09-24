
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

      <div className="flex gap-5">

        {/* Image */}
        <img
          src={image}
          alt={title}
          className="h-28 w-40 shrink-0 rounded-lg object-cover"
        />

        {/* Content */}
        <div className="flex-1">

          <div className="flex items-start justify-between gap-3">

            <h3 className="text-base font-bold">
              {title}
            </h3>

            {badge && (
              <span className="rounded-md bg-green-50 px-2 py-1 text-[10px] font-bold text-primary">
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