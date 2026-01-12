import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Calendar,
  User,
  ListOrdered,
  Sparkles,
  QrCode,
} from "lucide-react";

const features = [
  {
    Icon: Bot,
    name: "Agente de IA",
    description:
      "Conversa con pacientes por WhatsApp 24/7. Responde preguntas, recomienda horarios y cierra citas automáticamente.",
    href: "#",
    cta: "Ver más",
    className: "lg:col-span-2 lg:row-span-1",
    featured: true,
    background: (
      <>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
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
    Icon: Calendar,
    name: "Reserva de Citas",
    description:
      "Gestión completa de disponibilidad. Aprobación manual o automática según tus preferencias.",
    href: "#",
    cta: "Ver horarios",
    className: "lg:col-span-1 lg:row-span-1",
    featured: false,
    background: (
      <>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 via-primary/5 to-transparent" />
        <div className="absolute top-4 right-4 w-20 h-20 bg-blue-400/20 rounded-full blur-2xl" />
      </>
    ),
  },
  {
    Icon: User,
    name: "Tarjeta Digital",
    description:
      "Tu perfil profesional en una URL. Comparte tu link en redes, firmas digitales o código QR.",
    href: "#",
    cta: "Crear perfil",
    className: "lg:col-span-1 lg:row-span-1",
    featured: false,
    background: (
      <>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-green-500/5 to-transparent" />
        <div className="absolute bottom-4 right-4 w-16 h-16 bg-emerald-400/20 rounded-full blur-xl" />
      </>
    ),
  },
  {
    Icon: ListOrdered,
    name: "Servicios",
    description:
      "Catálogo de tratamientos con precios. Los pacientes pueden ver y seleccionar servicios directamente.",
    href: "#",
    cta: "Ver servicios",
    className: "lg:col-span-1 lg:row-span-1",
    featured: false,
    background: (
      <>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/15 via-orange-500/5 to-transparent" />
        <div className="absolute top-4 left-4 w-16 h-16 bg-amber-400/20 rounded-full blur-xl" />
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
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Badge
            variant="secondary"
            className="gap-2 px-4 py-1.5 text-sm font-medium"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            4 pilares para tu práctica
          </Badge>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Todo lo que necesitas para{" "}
            <span className="text-primary">automatizar</span> tu consultorio
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Desde la primera impresión hasta la confirmación de cita.
            Una plataforma completa para profesionales de la salud.
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
            </div>
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
