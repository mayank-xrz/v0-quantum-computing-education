import { Navigation } from "@/components/navigation";
import { HeroSection } from "@/components/hero-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { ChallengesSection } from "@/components/challenges-section";
import { BenefitsSection } from "@/components/benefits-section";
import { ResourcesSection } from "@/components/resources-section";
import { Footer } from "@/components/footer";

export default function QuantumEducationPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <HowItWorksSection />
      <ChallengesSection />
      <BenefitsSection />
      <ResourcesSection />
      <Footer />
    </main>
  );
}
