import { LEGACY_CASE_MAP } from './src/utils/legacyCaseMap';

interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

const JDS_API_BASE = 'https://portal.jawafdehi.org/api';
const DOCUMENT_PREVIEW_ALLOWED_HOSTS = new Set([
  'ngm-store.jawafdehi.org',
  's3.jawafdehi.org',
]);

function securityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://portal.jawafdehi.org https://jawafdehi.org https://nes.jawafdehi.org https://api.jawafdehi.org; worker-src 'self' blob:;",
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}

function securityHeadersAllowFrame(): Record<string, string> {
  const headers = securityHeaders();
  delete headers['X-Frame-Options'];
  return headers;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

async function handleOembed(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const apiUrl = new URL(`${JDS_API_BASE}/oembed/`);
  url.searchParams.forEach((value, key) => {
    apiUrl.searchParams.set(key, value);
  });

  try {
    const apiResponse = await fetch(apiUrl.toString(), {
      headers: { 'Accept': 'application/json' },
    });

    return new Response(apiResponse.body, {
      status: apiResponse.status,
      headers: {
        'Content-Type': apiResponse.headers.get('Content-Type') || 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': apiResponse.ok ? 'public, max-age=300' : 'no-store',
      },
    });
  } catch {
    return jsonResponse({ error: 'Failed to fetch case data' }, 502);
  }
}

function getPreviewFilename(targetUrl: URL): string {
  const lastSegment = targetUrl.pathname.split('/').filter(Boolean).pop();
  return lastSegment ? decodeURIComponent(lastSegment).replace(/["\\]/g, '') : 'document';
}

async function handleDocumentPreview(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const target = url.searchParams.get('url');

  if (!target) {
    return jsonResponse({ error: 'Missing document URL' }, 400);
  }

  let targetUrl: URL;

  try {
    targetUrl = new URL(target);
  } catch {
    return jsonResponse({ error: 'Invalid document URL' }, 400);
  }

  if (targetUrl.protocol !== 'https:' || !DOCUMENT_PREVIEW_ALLOWED_HOSTS.has(targetUrl.hostname)) {
    return jsonResponse({ error: 'Document host is not allowed' }, 403);
  }

  const upstream = await fetch(targetUrl.toString(), {
    headers: {
      'Accept': 'application/pdf,text/markdown,text/plain,*/*',
    },
  });

  const headers = new Headers();
  headers.set('Content-Type', upstream.headers.get('Content-Type') || 'application/octet-stream');
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Cache-Control', upstream.ok ? 'public, max-age=3600' : 'no-store');

  const contentLength = upstream.headers.get('Content-Length');
  if (contentLength) headers.set('Content-Length', contentLength);

  if (url.searchParams.get('download') === '1') {
    headers.set('Content-Disposition', `attachment; filename="${getPreviewFilename(targetUrl)}"`);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle oEmbed endpoint
    if (path === '/oembed' || path === '/oembed/') {
      return handleOembed(request);
    }

    if (path === '/document-preview' || path === '/document-preview/') {
      return handleDocumentPreview(request);
    }

    const isEmbedRoute = /^\/embed\/case\//.test(path);
    const secHeaders = isEmbedRoute ? securityHeadersAllowFrame() : securityHeaders();

    // Handle legacy numeric case redirects (301)
    const caseMatch = path.match(/^\/case\/(\d+)\/?$/);
    if (caseMatch) {
      const legacyId = caseMatch[1];
      const targetSlug = LEGACY_CASE_MAP[legacyId];
      if (targetSlug) {
        return new Response(null, {
          status: 301,
          headers: {
            'Location': `/case/${targetSlug}`,
            'Cache-Control': 'public, max-age=3600',
            ...secHeaders,
          },
        });
      }
    }

    // Try to serve pre-rendered static asset
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) {
      const response = new Response(asset.body, asset);
      for (const [key, value] of Object.entries(secHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    // SPA fallback: serve index.html with 200
    if (request.method !== 'GET' && request.method !== 'HEAD') return asset;
    const indexRequest = new Request(new URL('/', request.url).toString(), request);
    const indexResponse = await env.ASSETS.fetch(indexRequest);
    const spaResponse = new Response(indexResponse.body, {
      status: 200,
      headers: indexResponse.headers,
    });
    for (const [key, value] of Object.entries(secHeaders)) {
      spaResponse.headers.set(key, value);
    }
    return spaResponse;
  },
};
