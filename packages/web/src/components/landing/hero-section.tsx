import { Link } from "react-router";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { Button } from "@/components/ui/button";
import { PhoneMockup } from "./phone-mockup";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-12 sm:py-20 lg:py-24">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

      <div className="container max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground animate-in fade-in slide-in-from-top-4 duration-700">
              <Sparkles className="h-4 w-4 text-primary" />
              La tarjeta digital para asesores de bienestar
            </div>

            {/* Heading */}
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Tu presencia digital
              </h1>
              <div className="h-[1.2em] mt-1">
                <TypingAnimation
                  words={["profesional", "accesible", "efectiva"]}
                  className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl"
                  duration={80}
                  pauseDelay={2000}
                  loop
                  showCursor
                  as="span"
                />
              </div>
            </div>

            {/* Subtitle */}
            <p className="mt-12 max-w-sm text-lg text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              Crea tu tarjeta digital con encuestas de salud, enlaces a redes
              sociales y código QR. Resultados directo a tu WhatsApp.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <Button size="lg" className="h-11" asChild>
                <Link to="/auth/register" className="flex items-center gap-2">
                  Crea tu tarjeta gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button variant="outline" size="lg" className="h-11" asChild>
                <Link to="/ana-garcia">Ver ejemplo</Link>
              </Button>
            </div>

            {/* Social Proof */}
            <p className="mt-6 text-sm text-muted-foreground animate-in fade-in duration-700 delay-500">
              <span className="font-semibold text-foreground">100+</span>{" "}
              asesores ya usan Welllink
            </p>
          </div>

          {/* Right Content - Phone Mockup */}
          <div className="flex justify-center lg:justify-end animate-in fade-in zoom-in-95 duration-1000 delay-300">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
