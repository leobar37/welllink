import {
  Navbar,
  HeroSection,
  FeaturesSection,
  AgentExplanation,
  CTASection,
  Footer,
} from "@/components/landing";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <AgentExplanation />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;
