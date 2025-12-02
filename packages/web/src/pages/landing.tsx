import {
    Navbar,
    HeroSection,
    FeaturesSection,
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
                <CTASection />
            </main>
            <Footer />
        </div>
    );
}

export default LandingPage;
