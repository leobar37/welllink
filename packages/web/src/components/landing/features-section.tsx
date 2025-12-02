import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import {
    User,
    ClipboardCheck,
    MessageCircle,
    QrCode,
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
        background: (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
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
        background: (
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent" />
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
        background: (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent" />
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
        background: (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent" />
        ),
    },
];

export function FeaturesSection() {
    return (
        <section className="py-16 sm:py-24">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-12 space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        Todo lo que necesitas
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Herramientas especializadas para asesores de bienestar.
                        No es un simple Linktree, es tu centro de captación de clientes.
                    </p>
                </div>

                {/* Bento Grid */}
                <BentoGrid className="lg:grid-cols-3 lg:grid-rows-2 max-w-5xl mx-auto">
                    {features.map((feature) => (
                        <BentoCard key={feature.name} {...feature} />
                    ))}
                </BentoGrid>
            </div>
        </section>
    );
}
