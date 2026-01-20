import { MessageCircle, Clock, CheckCircle, Zap } from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Conversación Natural",
    description:
      "El agente responde preguntas sobre tus servicios, horarios y precios automáticamente.",
  },
  {
    icon: Clock,
    title: "24/7 Disponible",
    description:
      "Nunca pierdes un lead. Atiende pacientes incluso mientras duermes.",
  },
  {
    icon: CheckCircle,
    title: "Cierra Citas",
    description:
      "El agente propone horarios disponibles y confirma la cita directamente.",
  },
  {
    icon: Zap,
    title: "Sin Intervención",
    description:
      "Solo intervienes en casos complejos. El resto se gestiona solo.",
  },
];

export function AgentExplanation() {
  return (
    <section className="py-16 md:py-24 bg-secondary/20">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            <span>Powered by AI</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Tu Asistente Virtual de Ventas
          </h2>
          <p className="mt-4 text-muted-foreground">
            Un agente inteligente que conversan con tus pacientes por WhatsApp,
            responde preguntas y cierra citas automáticamente.
          </p>
        </div>

        {/* Visual demo */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-xl">
            {/* Chat mockup */}
            <div className="grid md:grid-cols-2">
              {/* Doctor side */}
              <div className="p-6 border-r border-border bg-muted/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">MediApp Agent</div>
                    <div className="text-xs text-muted-foreground">
                      Activo ahora
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-secondary text-sm">
                    Hola Dr. García, el agente acaba de cerrar una cita para
                    mañana a las 10:00 AM.
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Paciente: María González • Servicio: Limpieza Dental
                  </div>
                </div>
              </div>

              {/* Patient side (simulated WhatsApp) */}
              <div className="p-6 bg-[#DCF8C6]/50">
                <div className="space-y-4">
                  {/* Chat messages */}
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">👤</span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm text-sm">
                        Hola, tienes disponibilidad para esta semana?
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        10:23 AM
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-white">🤖</span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm p-3 shadow-sm text-sm">
                        Hola! Tengo disponibles el martes a las 10:00 o 15:00, o
                        el viernes a las 11:00. Cuál te funciona mejor?
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 text-right">
                        10:24 AM
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">👤</span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm text-sm">
                        Me viene bien el martes a las 10:00!
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        10:25 AM
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-white">🤖</span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm p-3 shadow-sm text-sm">
                        Perfecto! Tu cita está confirmada para martes 10:00 AM.
                        Te enviaré un recordatorio mañana. Saludos!
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 text-right">
                        10:25 AM
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-5 rounded-xl border border-border bg-card hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
