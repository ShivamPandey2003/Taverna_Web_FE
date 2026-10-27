import { useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectIsAuthenticated, setAuthMode } from "@/redux/auth/authSlice";
import { openAuthModal } from "@/redux/modals/homeModal/homeModalSlice";

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
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Booking needs an account, so logged-out visitors start the login flow
  const startBooking = () => {
    if (isAuthenticated) {
      navigate("/dashboard/book-service");
      return;
    }
    dispatch(setAuthMode("login"));
    dispatch(openAuthModal());
  };

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
      <button
        data-test-id={`landing-book-${title.toLowerCase().replace(/\s+/g, "-")}`}
        type="button"
        onClick={startBooking}
        className="mt-5 flex w-full cursor-pointer items-center justify-between border-t border-border pt-4"
      >
        <span className="text-xs font-semibold">
          Book This Service
        </span>

        <span>→</span>
      </button>

    </article>
  );
}