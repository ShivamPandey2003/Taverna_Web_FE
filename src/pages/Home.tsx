import { Navbar } from "@/components/features/landing/Navbar";
import { HeroSection } from "@/components/features/landing/HeroSection";
import { ProcessSection } from "@/components/features/landing/ProcessSection";
import { ServiceSection } from "@/components/features/landing/ServiceSection";
import { Footer } from "@/components/features/landing/Footer";
import { AuthModal } from "@/components/features/auth/AuthModal";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header>
        <Navbar />
        <HeroSection />
      </header>

      <main>
        <ProcessSection />
        <ServiceSection />
      </main>

      <Footer />

      <AuthModal />
    </div>
  );
}
