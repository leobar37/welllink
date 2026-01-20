import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Calendar, Clock, CheckCircle } from "lucide-react";
import { PhoneMockup } from "./phone-mockup";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-12 sm:py-20 lg:py-24">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

      <div className="container max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground animate-in fade-in slide-in-from-top-4 duration-700">
              <Bot className="h-4 w-4 text-primary" />
              Agente de IA + Reservas + Tarjeta digital
            </div>

            {/* Heading */}
            <h1 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Tu agente de IA <span className="text-primary">cierra citas</span>{" "}
              mientras duermes
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-lg text-muted-foreground max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              Convierte leads en pacientes 24/7. El agente conversa por
              WhatsApp, responde preguntas y agenda citas automáticamente.
            </p>

            {/* Key benefits */}
            <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              {[
                "Sin perder nunca un lead",
                "Pacientes reservan las 24 horas",
                "Dashboard de ventas integrado",
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
              <Button size="lg" className="h-11" asChild>
                <Link to="/auth/register" className="flex items-center gap-2">
                  Activar mi agente
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button variant="outline" size="lg" className="h-11" asChild>
                <Link to="/ana-garcia">Ver demo</Link>
              </Button>
            </div>

            {/* Social Proof */}
            <p className="mt-6 text-sm text-muted-foreground animate-in fade-in duration-700 delay-500">
              <span className="font-semibold text-foreground">100+</span>{" "}
              profesionales ya automatizan sus citas
            </p>
          </div>

          {/* Right Content - Visual */}
          <div className="flex justify-center lg:justify-end animate-in fade-in zoom-in-95 duration-1000 delay-300">
            {/* Simplified phone mockup showing agent conversation */}
            <div className="relative w-full max-w-sm">
              {/* Phone frame */}
              <div className="relative bg-card rounded-[2.5rem] border-8 border-foreground/10 shadow-2xl overflow-hidden">
                {/* Phone header */}
                <div className="bg-primary p-4 text-primary-foreground">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">MediApp Agent</div>
                      <div className="text-xs opacity-80">En línea ahora</div>
                    </div>
                  </div>
                </div>

                {/* Chat content */}
                <div className="p-4 space-y-4 bg-muted/20 min-h-[320px]">
                  {/* Patient message */}
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">👤</span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm text-sm">
                        Hola, tienes cita disponible?
                      </div>
                    </div>
                  </div>

                  {/* Agent response */}
                  <div className="flex gap-2 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm p-3 shadow-sm text-sm">
                        Hola! Tengo disponibilidad mañana a las 10:00 o 15:00.
                        <span className="block mt-1 text-xs opacity-80">
                          Qué horario prefieres?
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Patient confirmation */}
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">👤</span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm text-sm">
                        10:00 me viene bien!
                      </div>
                    </div>
                  </div>

                  {/* Confirmed */}
                  <div className="flex gap-2 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm p-3 shadow-sm text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Confirmado! Te espero mañana a las 10:00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="p-3 border-t bg-card flex gap-2 overflow-x-auto">
                  {["Hola", "Precios", "Horarios", "Ubicación"].map(
                    (action) => (
                      <button
                        key={action}
                        className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium whitespace-nowrap hover:bg-secondary/80 transition-colors"
                      >
                        {action}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -bottom-4 -left-4 bg-card rounded-xl shadow-lg p-3 flex items-center gap-2 border animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">3 citas esta semana</span>
              </div>

              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full shadow-lg p-2 animate-in fade-in zoom-in-95 duration-700 delay-700">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
