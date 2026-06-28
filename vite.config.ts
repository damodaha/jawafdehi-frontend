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
      // Loopback by default (reached via SSH port-forward of this single port).
      // In compose, set VITE_DEV_HOST=0.0.0.0 so the port is reachable from the
      // host across the container boundary.
      host: process.env.VITE_DEV_HOST || "127.0.0.1",
      port: 40114,
      strictPort: true,
      // Same-origin /api, /admin, /static, /media -> the Think-Big monolith (the
      // consolidated backend that serves unified search AND the per-app APIs like
      // /api/cases/ used to hydrate result cards). One target, env-overridable so
      // the same config works on the host (default :48000) and inside compose
      // (VITE_API_PROXY_TARGET=http://platform:8080).
      proxy: (() => {
        const apiTarget =
          process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:48000";
        const proxyOpts = { target: apiTarget, changeOrigin: true };
        return {
          "/api": proxyOpts,
          // NES (entities) lives under /nes/api and NGM under /ngm/api on the same
          // monolith; proxy both so NES entity pages / per-app calls resolve.
          "/nes": proxyOpts,
          "/ngm": proxyOpts,
          "/admin": proxyOpts,
          // Django/WhiteNoise static (admin CSS etc.) lives under /static.
          "/static": proxyOpts,
          // Wagtail-managed media (uploaded images/renditions, documents).
          "/media": proxyOpts,
        };
      })(),
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
