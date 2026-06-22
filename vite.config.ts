import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "node:fs";
import { componentTagger } from "lovable-tagger";

function serveGeneratedSearchIndex() {
  return {
    name: "serve-generated-search-index",
    configureServer(server) {
      server.middlewares.use("/search-index.json", (_req, res, next) => {
        const candidates = [
          path.resolve(__dirname, "dist/search-index.json"),
          path.resolve(__dirname, "dist/client/search-index.json"),
        ];
        const searchIndexPath = candidates.find((candidate) => fs.existsSync(candidate));

        if (!searchIndexPath) {
          next();
          return;
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.end(fs.readFileSync(searchIndexPath));
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode, isSsrBuild }) => {
  const isSSR = isSsrBuild || process.env.SSR === 'true';

  return {
    server: {
      // Loopback only; reached via SSH port-forward of this single port.
      host: "127.0.0.1",
      port: 40114,
      strictPort: true,
      // Same-origin /api and /admin -> local gunicorn, so only one tunnel is needed.
      proxy: {
        "/api": {
          target: "http://127.0.0.1:40173",
          changeOrigin: true,
        },
        "/admin": {
          target: "http://127.0.0.1:40173",
          changeOrigin: true,
        },
        // Django/WhiteNoise static (admin CSS etc.) lives under /static.
        "/static": {
          target: "http://127.0.0.1:40173",
          changeOrigin: true,
        },
        // Wagtail-managed media (uploaded images/renditions, documents).
        "/media": {
          target: "http://127.0.0.1:40173",
          changeOrigin: true,
        },
      },
    },
    plugins: [
      react(),
      mode === "development" && serveGeneratedSearchIndex(),
      mode === "development" && componentTagger(),
      // Google Analytics is loaded at runtime only after the visitor opts in
      // via the cookie consent banner (see src/lib/ga.ts). Do not inject a GA
      // tag here — doing so would load analytics before consent.
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: isSSR
      ? {
          outDir: "dist/server",
          ssr: true,
          rollupOptions: {
            input: "src/entry-server.tsx",
          },
        }
      : {
          outDir: "dist/client",
          rollupOptions: {
            input: "index.html",
          },
        },
  };
});
