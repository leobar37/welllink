import { Outlet, Link } from "react-router";

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-1">
          <Link to="/" className="text-2xl font-semibold tracking-tight text-foreground">
            Wellness Link
          </Link>
          <p className="text-muted-foreground text-sm">
            Tu tarjeta digital de bienestar
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
