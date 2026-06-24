export const SITE_URL = "https://jawafdehi.org";
export const SITE_NAME = "Jawafdehi Nepal";
export const HEADER_LOGO_URL = `${SITE_URL}/assets/logo.svg`;

export function absoluteUrl(value: string | null | undefined, base = SITE_URL): string | null {
  if (!value) return null;
  try {
    return new URL(value, base).toString();
  } catch {
    return null;
  }
}

export function truncateMeta(value: string | null | undefined, maxLength = 160): string {
  const cleaned = (value ?? "").replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`;
}

export function stripHtml(value: string | null | undefined): string {
  return (value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
