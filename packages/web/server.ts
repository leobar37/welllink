import { serve } from "bun";
import path from "node:path";

const PORT = Number(process.env.PORT) || 3000;
const BUILD_DIR = path.join(process.cwd(), "build");
const CLIENT_DIR = path.join(BUILD_DIR, "client");

console.log(`🚀 Starting MediApp Web Server...`);
console.log(`📍 Port: ${PORT}`);
console.log(`📁 Build directory: ${BUILD_DIR}`);

const server = serve({
  port: PORT,
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Health check for Dokploy/Nginx
    if (pathname === "/health") {
      return new Response("OK", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Try to serve static files from build/client
    // We remove the leading slash from pathname to join with CLIENT_DIR
    const filePath = path.join(
      CLIENT_DIR,
      pathname === "/" ? "index.html" : pathname,
    );
    const file = Bun.file(filePath);

    if (await file.exists()) {
      // Basic check to avoid serving directories (if path is like /assets/)
      const stat = await file.stat();
      if (!stat.isDirectory()) {
        return new Response(file);
      }
    }

    // Fallback for SPA (React Router)
    // All non-file requests should serve index.html
    const indexFile = Bun.file(path.join(CLIENT_DIR, "index.html"));
    if (await indexFile.exists()) {
      return new Response(indexFile, {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
  error(error) {
    console.error("Server Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  },
});

console.log(`✅ Server ready at http://localhost:${server.port}`);
