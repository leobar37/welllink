import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { BorderBeam } from "@/components/ui/border-beam";
import { Badge } from "@/components/ui/badge";
import {
  User,
  ClipboardCheck,
  MessageCircle,
  QrCode,
  Sparkles,
} from "lucide-react";

const features = [
  {
    Icon: User,
    name: "Perfil Profesional",
    description:
      "Tu tarjeta digital siempre accesible. Foto, bio, título profesional y enlaces a todas tus redes sociales.",
    href: "/auth/register",
    cta: "Crear perfil",
    className: "lg:col-span-1 lg:row-span-2",
    featured: true,
    background: (
      <>
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
        {/* Decorative pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
      </>
    ),
  },
  {
    Icon: ClipboardCheck,
    name: "Encuesta de Salud",
    description:
      "Test de Transformación 7 días que captura leads calificados automáticamente.",
    href: "/auth/register",
    cta: "Activar encuesta",
    className: "lg:col-span-2 lg:row-span-1",
    featured: false,
    background: (
      <>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-green-500/5 to-transparent" />
        <div className="absolute top-4 right-4 w-20 h-20 bg-emerald-400/20 rounded-full blur-2xl" />
        {/* Animated pulse effect */}
        <div className="absolute top-6 right-6 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
      </>
    ),
  },
  {
    Icon: MessageCircle,
    name: "WhatsApp Directo",
    description:
      "Los resultados de las encuestas llegan directo a tu WhatsApp. Sin intermediarios.",
    href: "/auth/register",
    cta: "Configurar WhatsApp",
    className: "lg:col-span-1 lg:row-span-1",
    featured: false,
    background: (
      <>
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/15 via-emerald-500/5 to-transparent" />
        <div className="absolute bottom-4 right-4 w-16 h-16 bg-green-400/20 rounded-full blur-xl" />
      </>
    ),
  },
  {
    Icon: QrCode,
    name: "QR Compartible",
    description:
      "Genera tu código QR para compartir en persona. Imprimible en tarjetas físicas.",
    href: "/auth/register",
    cta: "Generar QR",
    className: "lg:col-span-1 lg:row-span-1",
    featured: false,
    background: (
      <>
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/15 via-blue-500/5 to-transparent" />
        <div className="absolute top-4 left-4 w-16 h-16 bg-sky-400/20 rounded-full blur-xl" />
        {/* QR pattern hint */}
        <div className="absolute bottom-4 right-4 grid grid-cols-3 gap-1 opacity-10">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-sm ${i % 2 === 0 ? "bg-current" : ""}`}
            />
          ))}
        </div>
      </>
    ),
  },
];

export function FeaturesSection() {
  return (
    <section className="relative py-20 sm:py-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Badge */}
          <div className="flex justify-center">
            <Badge
              variant="secondary"
              className="gap-2 px-4 py-1.5 text-sm font-medium"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Herramientas profesionales
            </Badge>
          </div>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Todo lo que necesitas para{" "}
            <span className="text-primary">crecer</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Herramientas especializadas para asesores de bienestar. No es un
            simple Linktree, es tu{" "}
            <span className="font-semibold text-foreground">
              centro de captación de clientes
            </span>
            .
          </p>
        </div>

        {/* Bento Grid */}
        <BentoGrid className="lg:grid-cols-3 lg:grid-rows-2 max-w-5xl mx-auto gap-4 lg:gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.name}
              className="relative animate-in fade-in slide-in-from-bottom-4 duration-700"
              style={{ animationDelay: `${index * 100 + 200}ms` }}
            >
              <BentoCard {...feature} />
              {/* Add BorderBeam to featured card */}
              {feature.featured && (
                <BorderBeam
                  size={200}
                  duration={8}
                  colorFrom="hsl(var(--primary))"
                  colorTo="hsl(162 80% 50%)"
                  borderWidth={2}
                />
              )}
            </div>
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
