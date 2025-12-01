import { Outlet, Link } from "react-router";
import { Logo } from "@/components/ui/logo";

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex justify-center">
            <Logo size="lg" />
          </Link>
          <p className="text-muted-foreground text-sm sm:text-base px-2">
            Tu tarjeta digital de bienestar
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
