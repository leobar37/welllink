import { Outlet } from "react-router";

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* We might add a public header here later if needed */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
