import { Link } from "react-router";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
    return (
        <section className="py-16 sm:py-24">
            <div className="container mx-auto px-4">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 to-primary px-6 py-16 sm:px-12 sm:py-24 text-center">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

                    {/* Content */}
                    <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
                        <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl">
                            Empieza hoy, es gratis
                        </h2>

                        <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto">
                            Crea tu tarjeta digital profesional en minutos.
                            Sin tarjeta de crédito, sin compromisos.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                            <ShimmerButton
                                className="h-14 text-lg font-semibold px-8"
                                background="hsl(var(--background))"
                                shimmerColor="hsl(var(--primary))"
                            >
                                <Link
                                    to="/auth/register"
                                    className="flex items-center gap-2 text-foreground"
                                >
                                    Crear mi tarjeta gratis
                                    <ArrowRight className="h-5 w-5" />
                                </Link>
                            </ShimmerButton>
                        </div>

                        <p className="text-sm text-primary-foreground/60 pt-2">
                            ¿Ya tienes cuenta?{" "}
                            <Link
                                to="/auth/login"
                                className="underline underline-offset-4 hover:text-primary-foreground"
                            >
                                Inicia sesión
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
