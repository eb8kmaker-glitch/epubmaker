/**
 * Next.js instrumentation hook — Sentry 서버/엣지 초기화.
 *
 * sentry.server.config.ts / sentry.edge.config.ts 대신 이 파일에서
 * NEXT_RUNTIME에 따라 분기하여 초기화합니다.
 */

import * as Sentry from "@sentry/nextjs";

export async function register() {
  const isProd = process.env.NODE_ENV === "production";
  const tracesSampleRate = isProd ? 0.1 : 1.0;
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn,
      tracesSampleRate,
      debug: false,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn,
      tracesSampleRate,
      debug: false,
    });
  }
}
