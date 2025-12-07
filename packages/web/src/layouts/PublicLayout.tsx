import { Outlet } from "react-router";

export function PublicLayout() {
  return (
    <div className="min-h-screen">
      {/* We might add a public header here later if needed */}
      <main className="min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
