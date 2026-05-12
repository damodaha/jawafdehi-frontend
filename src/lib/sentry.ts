import * as Sentry from "@sentry/react";

const HARDCODED_DSN = "https://f5fafd04ccca67355a3b404d1b209e94@o4511364048027648.ingest.de.sentry.io/4511366946226256";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export function initSentry(): void {
  const dsn = SENTRY_DSN || HARDCODED_DSN;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
