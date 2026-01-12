import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode, useState } from "react";
import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { ThemeProvider } from "@/contexts/theme-context";

const DEFAULT_THEME = "medical";

const themeInitScript = `(() => {
  try {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem("welllink-theme");
    const savedDark = localStorage.getItem("welllink-dark");

    root.setAttribute("data-theme", savedTheme ?? "${DEFAULT_THEME}");

    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
    const isDark = savedDark === null ? prefersDark : savedDark === "true";
    root.classList.toggle("dark", isDark);
  } catch {
    // Ignore errors (e.g., privacy mode)
  }
})();`;

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        retry: 1,
      },
    },
  });

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme={DEFAULT_THEME}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  const [queryClient] = useState(createQueryClient);

  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme={DEFAULT_THEME}>
          <Outlet />
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}
