import { Link } from "react-router";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
            <div className="container flex h-16 items-center justify-between">
                <Link to="/" className="flex items-center">
                    <Logo size="lg" />
                </Link>

                <nav className="flex items-center gap-2">
                    <Button variant="ghost" asChild>
                        <Link to="/auth/login">Iniciar sesión</Link>
                    </Button>
                    <Button asChild>
                        <Link to="/auth/register">Crear cuenta</Link>
                    </Button>
                </nav>
            </div>
        </header>
    );
}
