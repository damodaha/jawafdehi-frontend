import { readdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SITE_URL = 'https://jawafdehi.org';
const MAX_FILES_PER_REQUEST = 30;

interface CloudflarePurgeResponse {
  success: boolean;
  errors?: Array<{ code?: number; message?: string }>;
  messages?: Array<{ code?: number; message?: string }>;
}

function usage(): never {
  console.error(`
Usage:
  bun run cache:purge                 Purge generated case/update URLs from dist
  bun run cache:purge -- --all        Purge everything in Cloudflare cache
  bun run cache:purge -- --dry-run    Print URLs that would be purged
  bun run cache:purge -- /case/slug https://jawafdehi.org/updates/slug

Required environment:
  CF_ZONE_ID or CLOUDFLARE_ZONE_ID
  CF_API_TOKEN or CLOUDFLARE_API_TOKEN
`);
  process.exit(1);
}

function env(name: string, fallbackName: string): string {
  const value = process.env[name] || process.env[fallbackName];
  if (!value) {
    console.error(`[cache:purge] Missing ${name} or ${fallbackName}`);
    usage();
  }
  return value;
}

function toAbsoluteUrl(value: string): string {
  return new URL(value, SITE_URL).toString();
}

async function listGeneratedRouteUrls(routeDir: 'case' | 'updates'): Promise<string[]> {
  const dir = join(ROOT, 'dist', routeDir);
  let entries: Array<{ name: string; isDirectory(): boolean }>;

  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => toAbsoluteUrl(`/${routeDir}/${encodeURIComponent(entry.name)}`));
}

async function defaultUrls(): Promise<string[]> {
  const [caseUrls, updateUrls] = await Promise.all([
    listGeneratedRouteUrls('case'),
    listGeneratedRouteUrls('updates'),
  ]);

  return [
    ...caseUrls,
    ...updateUrls,
    toAbsoluteUrl('/cases'),
    toAbsoluteUrl('/updates'),
    toAbsoluteUrl('/sitemap.xml'),
    toAbsoluteUrl('/search-index.json'),
  ];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function purge(zoneId: string, token: string, body: Record<string, unknown>): Promise<void> {
  const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  let payload: CloudflarePurgeResponse | null = null;
  try {
    payload = responseText ? JSON.parse(responseText) as CloudflarePurgeResponse : null;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success) {
    const details = payload
      ? JSON.stringify(payload.errors || payload.messages || payload, null, 2)
      : responseText || response.statusText;
    throw new Error(`Cloudflare purge failed (${response.status}): ${details}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const purgeEverything = args.includes('--all');
  const explicitValues = args.filter((arg) => !arg.startsWith('--'));

  if (args.includes('--help') || args.includes('-h')) {
    usage();
  }

  if (purgeEverything && explicitValues.length > 0) {
    console.error('[cache:purge] Use either --all or explicit URLs, not both.');
    usage();
  }

  const zoneId = env('CF_ZONE_ID', 'CLOUDFLARE_ZONE_ID');
  const token = env('CF_API_TOKEN', 'CLOUDFLARE_API_TOKEN');

  if (purgeEverything) {
    if (dryRun) {
      console.log('[cache:purge] Would purge everything.');
      return;
    }

    await purge(zoneId, token, { purge_everything: true });
    console.log('[cache:purge] Purged everything.');
    return;
  }

  const urls = unique(
    explicitValues.length > 0
      ? explicitValues.map(toAbsoluteUrl)
      : await defaultUrls(),
  );

  if (urls.length === 0) {
    console.warn('[cache:purge] No URLs found to purge. Run bun run build first or pass URLs explicitly.');
    return;
  }

  if (dryRun) {
    console.log(`[cache:purge] Would purge ${urls.length} URL(s):`);
    for (const url of urls) {
      console.log(url);
    }
    return;
  }

  const batches = chunk(urls, MAX_FILES_PER_REQUEST);
  for (let index = 0; index < batches.length; index += 1) {
    const files = batches[index];
    await purge(zoneId, token, { files });
    console.log(`[cache:purge] Purged batch ${index + 1}/${batches.length} (${files.length} URLs)`);
  }

  console.log(`[cache:purge] Purged ${urls.length} URL(s).`);
}

main().catch((err) => {
  console.error('[cache:purge] Fatal error:', err);
  process.exit(1);
});
