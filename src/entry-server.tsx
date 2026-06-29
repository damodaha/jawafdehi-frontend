import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import type { HelmetServerState } from 'react-helmet-async';
import { QueryClient, QueryClientProvider, dehydrate } from '@tanstack/react-query';
import App from './App';
import { ThemeProvider } from './components/ThemeProvider';
import './i18n/config';
import { getCaseById, getCases, getStatistics } from './services/jds-api';
import { getArticleBySlug, getArticles } from './services/cms-api';
import axios from 'axios';
import type { JawafEntity } from './types/jds';

const JDS_API_BASE_URL = process.env.VITE_JDS_API_BASE_URL || 'https://portal.jawafdehi.org/api';
// NGM read plane. SSR runs in Node, so a relative base won't resolve — fall back to
// the production NGM host when no absolute override is set.
const NGM_API_BASE_URL = process.env.VITE_NGM_API_BASE_URL || 'https://ngm.jawafdehi.org/ngm/api';

export interface RenderResult {
  html: string;
  helmetContext: { helmet?: HelmetServerState };
  dehydratedState: unknown;
}

async function prefetch(url: string, queryClient: QueryClient): Promise<void> {
  // Home page: prefetch stats + first page of cases
  if (url === '/') {
    await Promise.allSettled([
      queryClient.prefetchQuery({ queryKey: ['statistics'], queryFn: getStatistics }),
      queryClient.prefetchQuery({ queryKey: ['cases', { page: 1 }], queryFn: () => getCases({ page: 1 }) }),
    ]);
    return;
  }

  // Cases list page
  if (url === '/cases') {
    await queryClient.prefetchQuery({ queryKey: ['cases', { page: 1 }], queryFn: () => getCases({ page: 1 }) });
    return;
  }

  // Updates/News list page
  if (url === '/updates') {
    await queryClient.prefetchQuery({ queryKey: ['cms-articles'], queryFn: () => getArticles() });
    return;
  }

  // Article detail page (slug is everything after /updates/ up to /?#)
  const updateMatch = url.match(/^\/updates\/([^/?#]+)/);
  if (updateMatch) {
    const slug = decodeURIComponent(updateMatch[1]);
    await queryClient.prefetchQuery({
      queryKey: ['cms-article', slug],
      queryFn: () => getArticleBySlug(slug),
    });
    return;
  }

  // Case detail page (slug-only API; slug is everything after /case/ up to /?#)
  const caseMatch = url.match(/^\/case\/([^/?#]+)/);
  if (caseMatch) {
    const slug = decodeURIComponent(caseMatch[1]);
    await queryClient.prefetchQuery({
      queryKey: ['case', slug],
      queryFn: () => getCaseById(slug),
    });
    return;
  }

  // Embed case card route
  const embedMatch = url.match(/^\/embed\/case\/([^/?#]+)/);
  if (embedMatch) {
    const slug = decodeURIComponent(embedMatch[1]);
    await queryClient.prefetchQuery({
      queryKey: ['case', slug],
      queryFn: () => getCaseById(slug),
    });
    return;
  }

  // Entity profile page
  const entityMatch = url.match(/^\/entity\/(\d+)/);
  if (entityMatch) {
    const entityId = parseInt(entityMatch[1]);
    await queryClient.prefetchQuery({
      queryKey: ['jds-entity', entityId],
      queryFn: async () => {
        const res = await axios.get<JawafEntity>(`${JDS_API_BASE_URL}/entities/${entityId}/`);
        return res.data;
      },
    });
    return;
  }

  // NGM material profile (/material/<source>/<ident>). The query key mirrors
  // MaterialProfile's useQuery (['ngm-material', tail]) so the client hydrates
  // from the dehydrated cache instead of refetching.
  const materialMatch = url.match(/^\/material\/(.+?)(?:[?#]|$)/);
  if (materialMatch) {
    const tail = decodeURIComponent(materialMatch[1]);
    await queryClient.prefetchQuery({
      queryKey: ['ngm-material', tail],
      queryFn: async () => {
        const res = await axios.get(`${NGM_API_BASE_URL}/materials/${tail}`);
        return res.data;
      },
    });
    return;
  }
}

export async function render(url: string): Promise<RenderResult> {
  const helmetContext: { helmet?: HelmetServerState } = {};
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 0 } },
  });

  await prefetch(url, queryClient);

  const html = renderToString(
    <ThemeProvider>
      <HelmetProvider context={helmetContext}>
        <QueryClientProvider client={queryClient}>
          <StaticRouter location={url}>
            <App />
          </StaticRouter>
        </QueryClientProvider>
      </HelmetProvider>
    </ThemeProvider>
  );

  const dehydratedState = dehydrate(queryClient);
  return { html, helmetContext, dehydratedState };
}
