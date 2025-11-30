import { Link, Outlet } from "react-router-dom";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/" className="text-lg font-semibold">
            Wellness Link
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>
            <Link to="/modules" className="hover:text-foreground">
              Modules
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl flex-1 flex-col px-6 py-12">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
