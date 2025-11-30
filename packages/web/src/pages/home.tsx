export function HomePage() {
  return (
    <section className="space-y-4">
      <p className="text-sm uppercase text-muted-foreground tracking-[0.3em]">
        Setup status
      </p>
      <h1 className="text-4xl font-semibold">React Router + Tailwind v4 + shadcn/ui</h1>
      <p className="text-base text-muted-foreground">
        This workspace is preconfigured following the Vite guide from shadcn/ui with
        Tailwind CSS v4, tw-animate-css, and CSS variables aligned to the New York
        theme. Use the navigation to inspect the module summary derived from the PRD.
      </p>
    </section>
  );
}

export default HomePage;
