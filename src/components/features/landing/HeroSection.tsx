import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site.config";
import { BookingWidget } from "./BookingWidget";
import HeroImage from '@/assets/background.webp'

export function HeroSection() {
  return (
    <section className="py-8 md:py-12">
      <Container>

        {/* Hero Image */}
        <div className="overflow-hidden rounded-2xl">
          <img
            src={HeroImage}
            alt="Taverna dealership"
            className="h-[190px] w-full object-cover md:h-[250px]"
          />
        </div>

        {/* Hero Content */}
        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">

          {/* Text */}
          <div>
            <h1 className="max-w-xl text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl">
              {siteConfig.hero.title}
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-6 text-text-secondary">
              {siteConfig.hero.description}
            </p>
          </div>

          {/* Booking */}
          <BookingWidget />

        </div>

      </Container>
    </section>
  );
}