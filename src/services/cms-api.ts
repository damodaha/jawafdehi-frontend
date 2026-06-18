/**
 * Wagtail CMS (headless) client for public Updates/News articles.
 *
 * Backed by Wagtail API v2, mounted under the Jawafdehi API at `/cms/v2`.
 * Only live/published pages are returned by the API.
 */

import axios, { AxiosInstance } from "axios";

import type {
  Article,
  ArticleCategory,
  ArticleListItem,
  WagtailListResponse,
} from "@/types/cms";

const JDS_API_BASE_URL =
  import.meta.env.VITE_JDS_API_BASE_URL || "https://portal.jawafdehi.org/api";

const cmsClient: AxiosInstance = axios.create({
  baseURL: `${JDS_API_BASE_URL}/cms/v2`,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

const ARTICLE_TYPE = "content.ArticlePage";
const LIST_FIELDS = "title,category,date,excerpt,thumbnail";

/** List published articles (newest first), optionally filtered by category. */
export async function getArticles(
  category?: ArticleCategory,
): Promise<ArticleListItem[]> {
  const params: Record<string, string | number> = {
    type: ARTICLE_TYPE,
    fields: LIST_FIELDS,
    order: "-date",
    limit: 20, // Wagtail API v2 default max page size (WAGTAILAPI_LIMIT_MAX)
  };
  if (category) {
    params.category = category;
  }
  const res = await cmsClient.get<WagtailListResponse<ArticleListItem>>("/pages/", {
    params,
  });
  return res.data.items;
}

/** Fetch a single published article by its slug, or null if not found. */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const res = await cmsClient.get<WagtailListResponse<Article>>("/pages/", {
    params: { type: ARTICLE_TYPE, slug, fields: "*" },
  });
  return res.data.items[0] ?? null;
}
