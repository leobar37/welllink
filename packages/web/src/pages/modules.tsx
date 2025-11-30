const modules = [
  { id: "02", name: "Public Profile", reference: "PRD §2.2" },
  { id: "03", name: "Themes", reference: "PRD §2.3" },
  { id: "04", name: "Feature System", reference: "PRD §2.4" },
  { id: "05", name: "QR & Virtual Card", reference: "PRD §2.5" },
  { id: "06", name: "Dashboard", reference: "PRD §2.6" },
  { id: "07", name: "Settings", reference: "PRD §2.7" }
];

export function ModulesPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase text-muted-foreground tracking-[0.2em]">
          Documentation
        </p>
        <h1 className="text-3xl font-semibold">MVP Modules</h1>
        <p className="text-muted-foreground">
          Detailed specs live under <code>docs/modules</code>. Each module links back to the
          Product Requirements Document to keep implementation and documentation aligned.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((module) => (
          <article
            key={module.id}
            className="rounded-xl border border-border bg-card p-4 text-sm shadow-sm"
          >
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Module {module.id}
            </p>
            <h2 className="text-lg font-semibold">{module.name}</h2>
            <p className="text-muted-foreground">{module.reference}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ModulesPage;
