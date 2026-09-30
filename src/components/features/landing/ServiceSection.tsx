import { Container } from "@/components/ui/Container";
import { valetServices } from "./services.data";
import { ServiceCard } from "./ServiceCard";

export function ServiceSection() {
  return (
    <section
      id="services"
      className="py-20"
    >
      <Container>

        {/* Header */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-primary">
              Curated Packages
            </span>

            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Our Professional Valet Services
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-5 text-text-secondary">
              Every detail is handled by certified specialists using premium
              products. Select a service to begin booking.
            </p>
          </div>

          <button className="rounded-button border border-gray-400 px-5 py-2.5 text-xs font-semibold">
            View Custom Solutions
          </button>

        </div>

        {/* Services */}
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {valetServices.map((service) => (
            <ServiceCard
              key={service.title}
              {...service}
            />
          ))}
        </div>

      </Container>
    </section>
  );
}