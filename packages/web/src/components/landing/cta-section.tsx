import { Link } from "react-router";
import { ArrowRight, Sparkles, Check, Zap } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 sm:py-32">
      <div className="container">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary/95 to-primary/90 px-6 py-20 sm:px-12 sm:py-28 text-center shadow-2xl shadow-primary/25">
          {/* Floating Gradient Blobs */}
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-white/8 blur-3xl" />
          <div className="absolute top-1/2 left-1/4 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

          {/* Background Pattern - más sutil */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem]" />

          {/* Radial gradient overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.15)_100%)]" />

          {/* Content */}
          <div className="relative z-10 space-y-8 max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-2 text-sm font-medium text-white/90">
              <Sparkles className="h-4 w-4" />
              Lanza tu presencia digital hoy
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Empieza hoy
              </h2>
              <p className="text-4xl font-bold tracking-tight text-white/80 sm:text-5xl lg:text-6xl">
                es completamente gratis
              </p>
            </div>

            {/* Description */}
            <p className="text-lg sm:text-xl text-white/75 max-w-xl mx-auto leading-relaxed">
              Crea tu tarjeta digital profesional en minutos. Sin tarjeta de
              crédito, sin compromisos.
            </p>

            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/90">
                <Check className="h-3.5 w-3.5" />
                100% Gratis
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/90">
                <Check className="h-3.5 w-3.5" />
                Sin tarjeta de crédito
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/90">
                <Zap className="h-3.5 w-3.5" />
                Listo en 2 minutos
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
              <Link
                to="/auth/register"
                className="group inline-flex items-center gap-2.5 h-14 sm:h-16 px-10 sm:px-12 rounded-full bg-white text-primary font-semibold text-lg shadow-lg shadow-black/10 hover:bg-white/95 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Crear mi tarjeta gratis
                <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Login link */}
            <p className="text-sm text-white/50 pt-2">
              ¿Ya tienes cuenta?{" "}
              <Link
                to="/auth/login"
                className="text-white/70 underline underline-offset-4 hover:text-white transition-colors"
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
