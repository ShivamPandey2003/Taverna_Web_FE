import { Container } from "@/components/ui/Container";
import { processSteps } from "./process.data";
import { ProcessCard } from "./ProcessCard";

export function ProcessSection() {
  return (
    <section
      id="process"
      className="border-y border-border bg-section py-20"
    >
      <Container>

        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-wide text-primary">
            Process
          </span>

          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            How service at Taverna works
          </h2>

          <p className="mt-4 text-sm leading-6 text-text-secondary">
            Get first-class vehicle maintenance and detailing without ever
            lifting a finger or wasting hours at a service center.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {processSteps.map((step) => (
            <ProcessCard
              key={step.step}
              {...step}
            />
          ))}
        </div>

      </Container>
    </section>
  );
}