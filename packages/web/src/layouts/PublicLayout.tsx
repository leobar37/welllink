import { Outlet } from "react-router";
import { ThemeProvider } from "@/contexts/theme-context";

export function PublicLayout() {
  return (
    <ThemeProvider>
      <div className="min-h-screen">
        {/* We might add a public header here later if needed */}
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    </ThemeProvider>
  );
}
