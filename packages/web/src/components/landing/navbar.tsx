import { Link } from "react-router";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ThemeSelector } from "@/components/ui/theme-selector";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center">
          <Logo size="md" variant="full" />
        </Link>

        <nav className="flex items-center gap-2">
          <ThemeSelector />
          <Button variant="ghost" asChild className="hidden sm:flex">
            <Link to="/auth/login">Iniciar sesión</Link>
          </Button>
          <Button asChild>
            <Link to="/auth/register">Empezar gratis</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
