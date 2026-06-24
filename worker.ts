import { LEGACY_CASE_MAP } from './src/utils/legacyCaseMap';
import { courtRefCandidates } from './src/utils/courtCaseRef';
import { JAWAFDEHI_WEEKLY_SERIES } from './src/config/constants';

interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

const JDS_API_BASE = 'https://portal.jawafdehi.org/api';
const SITE_URL = 'https://jawafdehi.org';
const SITE_NAME = 'Jawafdehi Nepal';
const HEADER_LOGO_URL = `${SITE_URL}/assets/logo.svg`;
const CMS_API_BASE = `${JDS_API_BASE}/cms/v2`;

const MAX_LATEST_VIDEOS = 6;

interface FeedVideo {
  videoId: string;
  title: string;
  published: string | null;
  url: string;
  thumbnail: string;
  thumbnailMaxRes: string;
}

function securityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://portal.jawafdehi.org https://jawafdehi.org https://nes.jawafdehi.org https://api.jawafdehi.org https://auth.jawafdehi.org; worker-src blob:;",
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

function jsonResponse(body: unknown, status = 200, maxAge = 300): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': `public, max-age=${maxAge}`,
    },
  });
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(value: unknown): string {
  return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(value: string, max = 160): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

function absoluteUrl(value: unknown, base = SITE_URL): string | null {
  if (!value || typeof value !== 'string') return null;
  try {
    return new URL(value, base).toString();
  } catch {
    return null;
  }
}

function buildMetaTags(input: {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  imageAlt: string;
  type?: 'article' | 'website';
  publishedTime?: string | null;
  modifiedTime?: string | null;
}): string {
  const type = input.type ?? 'article';

  return `
<title>${escapeHtml(input.title)}</title>
<meta name="description" content="${escapeHtml(input.description)}" />
<link rel="canonical" href="${escapeHtml(input.canonicalUrl)}" />
<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
<meta property="og:type" content="${escapeHtml(type)}" />
<meta property="og:url" content="${escapeHtml(input.canonicalUrl)}" />
<meta property="og:title" content="${escapeHtml(input.title)}" />
<meta property="og:description" content="${escapeHtml(input.description)}" />
<meta property="og:image" content="${escapeHtml(input.imageUrl)}" />
<meta property="og:image:alt" content="${escapeHtml(input.imageAlt)}" />
<meta property="og:locale" content="en_US" />
${input.publishedTime ? `<meta property="article:published_time" content="${escapeHtml(input.publishedTime)}" />` : ''}
${input.modifiedTime ? `<meta property="article:modified_time" content="${escapeHtml(input.modifiedTime)}" />` : ''}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(input.title)}" />
<meta name="twitter:description" content="${escapeHtml(input.description)}" />
<meta name="twitter:image" content="${escapeHtml(input.imageUrl)}" />
<meta name="twitter:image:alt" content="${escapeHtml(input.imageAlt)}" />
`.trim();
}

async function fetchIndexHtml(request: Request, env: Env): Promise<string | null> {
  const indexRequest = new Request(new URL('/', request.url).toString(), request);
  const indexResponse = await env.ASSETS.fetch(indexRequest);
  if (!indexResponse.ok) return null;
  return indexResponse.text();
}

function injectHeadMeta(indexHtml: string, metaTags: string): string {
  const cleaned = indexHtml
    .replace('<!--helmet-title-->', '')
    .replace('<!--helmet-meta-->', '');

  if (cleaned.includes('</head>')) {
    return cleaned.replace('</head>', `${metaTags}\n</head>`);
  }

  return cleaned;
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&amp;/g, '&');
}

// Returns the channel's most recent uploads (id, title, watch URL, thumbnails)
// by reading the public YouTube Atom feed server-side — no API key, and the
// Worker hop sidesteps the feed's lack of CORS headers. Successful responses are
// cached at the Cloudflare edge (shared across users) so the feed is fetched at
// most once per TTL regardless of traffic, and it refreshes on its own each week
// with no rebuild or manual step.
async function handleLatestVideos(request: Request): Promise<Response> {
  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  const channelId = JAWAFDEHI_WEEKLY_SERIES.youtubeChannelId;
  try {
    const feedResponse = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
      { headers: { Accept: 'application/atom+xml' } },
    );

    if (!feedResponse.ok) {
      return jsonResponse({ error: 'Failed to fetch channel feed' }, 502, 60);
    }

    const xml = await feedResponse.text();
    const videos: FeedVideo[] = [];
    for (const match of xml.matchAll(/<entry[^>]*>[\s\S]*?<\/entry>/g)) {
      const entry = match[0];
      const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
      if (!videoId) {
        continue;
      }
      const rawTitle = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? '';
      const published = entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? null;
      videos.push({
        videoId,
        title: decodeXmlEntities(rawTitle).trim(),
        published,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        thumbnailMaxRes: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      });
      if (videos.length >= MAX_LATEST_VIDEOS) {
        break;
      }
    }

    if (videos.length === 0) {
      return jsonResponse({ error: 'No videos found' }, 404, 60);
    }

    const response = jsonResponse({ videos }, 200, 1800);
    // Only successful responses are cached at the edge (errors use short TTLs).
    await cache.put(request, response.clone());
    return response;
  } catch {
    return jsonResponse({ error: 'Failed to fetch latest videos' }, 502, 60);
  }
}

function extractCaseSlugFromUrl(caseUrl: string): string | null {
  try {
    const parsed = new URL(caseUrl);
    const match = parsed.pathname.match(/^\/case\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

// Resolve a bare court case number (e.g. "081-CR-0116") to its canonical slug
// by probing the known court identifiers against the cases API. Returns null if
// no case resolves (or the resolved case has no slug), so the caller falls
// through to normal handling.
async function resolveCourtRefSlug(ref: string): Promise<string | null> {
  for (const identifier of courtRefCandidates(ref)) {
    try {
      const apiUrl = `${JDS_API_BASE}/cases/${encodeURIComponent(identifier)}/`;
      const apiResponse = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
      if (!apiResponse.ok) {
        continue;
      }
      const caseData = (await apiResponse.json()) as { slug?: string | null };
      if (caseData.slug) {
        return caseData.slug;
      }
    } catch {
      // Network/parse failure: fall through to the next identifier.
    }
  }
  return null;
}

async function handleCaseMetaFallback(request: Request, env: Env, slug: string): Promise<Response | null> {
  const apiUrl = `${JDS_API_BASE}/cases/${encodeURIComponent(slug)}/`;
  const apiResponse = await fetch(apiUrl, { headers: { Accept: 'application/json' } });

  if (!apiResponse.ok) return null;

  const caseData = await apiResponse.json() as Record<string, unknown>;
  const titleRaw = String(caseData.title || 'Jawafdehi Case');
  const title = `${titleRaw} | Jawafdehi`;
  const descriptionText = stripHtml(caseData.description);

  let allegationText = '';
  if (Array.isArray(caseData.key_allegations)) {
    allegationText = caseData.key_allegations
      .slice(0, 2)
      .map((item) => String(item ?? '').trim())
      .filter(Boolean)
      .join('. ');
  }

  const description = truncate(
    descriptionText ||
    allegationText ||
    'A case record from Jawafdehi Nepal.',
  );

  const canonicalSlug =
    typeof caseData.slug === 'string' && caseData.slug.trim()
      ? caseData.slug
      : slug;

  const canonicalUrl = `${SITE_URL}/case/${encodeURIComponent(canonicalSlug)}`;
  const imageUrl =
    absoluteUrl(caseData.banner_url) ||
    absoluteUrl(caseData.thumbnail_url) ||
    HEADER_LOGO_URL;

  const indexHtml = await fetchIndexHtml(request, env);
  if (!indexHtml) return null;

  const metaTags = buildMetaTags({
    title,
    description,
    canonicalUrl,
    imageUrl,
    imageAlt: titleRaw,
    type: 'article',
    publishedTime: typeof caseData.created_at === 'string' ? caseData.created_at : null,
    modifiedTime: typeof caseData.updated_at === 'string' ? caseData.updated_at : null,
  });

  const html = injectHeadMeta(indexHtml, metaTags);

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      ...securityHeaders(),
    },
  });
}

async function handleUpdateMetaFallback(request: Request, env: Env, slug: string): Promise<Response | null> {
  const apiUrl = `${CMS_API_BASE}/pages/?type=content.ArticlePage&slug=${encodeURIComponent(slug)}&fields=*`;
  const apiResponse = await fetch(apiUrl, { headers: { Accept: 'application/json' } });

  if (!apiResponse.ok) return null;

  const payload = await apiResponse.json() as {
    items?: Array<Record<string, unknown>>;
  };

  const article = payload.items?.[0];
  if (!article) return null;

  const titleRaw = String(article.title || 'Jawafdehi Update');
  const title = `${titleRaw} | Jawafdehi`;
  const description = truncate(stripHtml(article.excerpt) || 'An update from Jawafdehi Nepal.');
  const canonicalUrl = `${SITE_URL}/updates/${encodeURIComponent(slug)}`;

  const thumbnail = article.thumbnail as { url?: string; alt?: string } | null | undefined;
  const imageUrl =
    absoluteUrl(thumbnail?.url, 'https://portal.jawafdehi.org') ||
    HEADER_LOGO_URL;

  const meta = article.meta as { first_published_at?: string | null } | undefined;
  const date = typeof article.date === 'string' ? article.date : null;

  const indexHtml = await fetchIndexHtml(request, env);
  if (!indexHtml) return null;

  const metaTags = buildMetaTags({
    title,
    description,
    canonicalUrl,
    imageUrl,
    imageAlt: thumbnail?.alt || titleRaw,
    type: 'article',
    publishedTime: meta?.first_published_at || date,
    modifiedTime: date,
  });

  const html = injectHeadMeta(indexHtml, metaTags);

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      ...securityHeaders(),
    },
  });
}

async function handleOembed(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return jsonResponse({ error: 'Missing url parameter' }, 400);
  }

  const slug = extractCaseSlugFromUrl(targetUrl);
  if (!slug) {
    return jsonResponse({ error: 'Invalid case URL. Expected format: https://jawafdehi.org/case/{slug}' }, 400);
  }

  try {
    const apiUrl = `${JDS_API_BASE}/cases/${encodeURIComponent(slug)}/`;
    const apiResponse = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!apiResponse.ok) {
      return jsonResponse({ error: 'Case not found' }, 404);
    }

    const caseData = await apiResponse.json() as Record<string, unknown>;
    const caseUrl = `https://jawafdehi.org/case/${slug}`;
    const embedUrl = `https://jawafdehi.org/embed/case/${slug}`;
    const title = (caseData.title as string) || 'Untitled Case';

    return jsonResponse({
      type: 'rich',
      version: '1.0',
      title,
      author_name: 'Jawafdehi',
      author_url: 'https://jawafdehi.org',
      provider_name: 'Jawafdehi',
      provider_url: 'https://jawafdehi.org',
      cache_age: 86400,
      thumbnail_url: (caseData.thumbnail_url as string) || (caseData.banner_url as string) || null,
      html: `<iframe src="${embedUrl}" width="480" height="360" frameborder="0" title="${title}" style="max-width:100%;overflow:hidden;border:none;border-radius:8px" allowfullscreen></iframe>`,
      width: 480,
      height: 360,
    });
  } catch {
    return jsonResponse({ error: 'Failed to fetch case data' }, 502);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle oEmbed endpoint
    if (path === '/oembed') {
      return handleOembed(request);
    }

    // Latest YouTube uploads for the Weekly Series "Past presentations" section
    if (path === '/api/latest-videos') {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method Not Allowed', { status: 405 });
      }
      return handleLatestVideos(request);
    }

    const isEmbedRoute = /^\/embed\/case\//.test(path);
    const secHeaders = isEmbedRoute ? securityHeadersAllowFrame() : securityHeaders();

    // Short alias: /weekly → /saptahik (301)
    if (path === '/weekly' || path === '/weekly/') {
      return new Response(null, {
        status: 301,
        headers: {
          'Location': '/saptahik' + url.search,
          'Cache-Control': 'public, max-age=3600',
          ...secHeaders,
        },
      });
    }

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

    // Court-case-ref case URLs: /case/081-CR-0116 → canonical slug (301)
    const courtRefMatch = path.match(/^\/case\/(\d+-[A-Za-z]+-\d+)\/?$/);
    if (courtRefMatch) {
      const targetSlug = await resolveCourtRefSlug(courtRefMatch[1]);
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

    const caseSlugMatch = path.match(/^\/case\/([^/?#]+)\/?$/);
    if (caseSlugMatch) {
      const response = await handleCaseMetaFallback(request, env, decodeURIComponent(caseSlugMatch[1]));
      if (response) return response;
    }

    const updateSlugMatch = path.match(/^\/updates\/([^/?#]+)\/?$/);
    if (updateSlugMatch) {
      const response = await handleUpdateMetaFallback(request, env, decodeURIComponent(updateSlugMatch[1]));
      if (response) return response;
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
