import { Logo } from "@/components/ui/logo";

export function Footer() {
    return (
        <footer className="border-t py-8">
            <div className="container mx-auto px-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Logo size="md" />

                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} Welllink. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
}
