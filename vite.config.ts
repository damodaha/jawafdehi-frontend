import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "node:fs";
import { componentTagger } from "lovable-tagger";
import { VitePluginRadar } from "vite-plugin-radar";
import { JAWAFDEHI_GA_MEASUREMENT_ID } from "./src/config/analytics-config";

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

const DOCUMENT_PREVIEW_ALLOWED_HOSTS = new Set([
  "ngm-store.jawafdehi.org",
  "s3.jawafdehi.org",
]);

function getPreviewFilename(targetUrl: URL): string {
  const lastSegment = targetUrl.pathname.split("/").filter(Boolean).pop();
  return lastSegment ? decodeURIComponent(lastSegment).replace(/["\\]/g, "") : "document";
}

function serveDocumentPreview() {
  return {
    name: "serve-document-preview",
    configureServer(server) {
      server.middlewares.use("/document-preview", async (req, res) => {
        try {
          const requestUrl = new URL(req.url || "", "http://localhost");
          const target = requestUrl.searchParams.get("url");

          if (!target) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ error: "Missing document URL" }));
            return;
          }

          const targetUrl = new URL(target);

          if (targetUrl.protocol !== "https:" || !DOCUMENT_PREVIEW_ALLOWED_HOSTS.has(targetUrl.hostname)) {
            res.statusCode = 403;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ error: "Document host is not allowed" }));
            return;
          }

          const upstream = await fetch(targetUrl, {
            headers: {
              Accept: "application/pdf,text/markdown,text/plain,*/*",
            },
          });

          res.statusCode = upstream.status;
          res.setHeader("Content-Type", upstream.headers.get("Content-Type") || "application/octet-stream");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Cache-Control", upstream.ok ? "public, max-age=3600" : "no-store");

          const contentLength = upstream.headers.get("Content-Length");
          if (contentLength) res.setHeader("Content-Length", contentLength);

          if (requestUrl.searchParams.get("download") === "1") {
            res.setHeader("Content-Disposition", `attachment; filename="${getPreviewFilename(targetUrl)}"`);
          }

          const body = upstream.body;
          if (!body) {
            res.end();
            return;
          }

          const reader = body.getReader();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }

          res.end();
        } catch {
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: "Failed to fetch document" }));
        }
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
      },
    },
    plugins: [
      react(),
      mode === "development" && serveDocumentPreview(),
      mode === "development" && serveGeneratedSearchIndex(),
      mode === "development" && componentTagger(),
      // Only enable analytics in production with a configured GA ID
      mode === "production" && JAWAFDEHI_GA_MEASUREMENT_ID && VitePluginRadar({
        analytics: {
          id: JAWAFDEHI_GA_MEASUREMENT_ID,
        },
      }),
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
