import * as Sentry from "@sentry/bun";

if (process.env.NODE_ENV === "production" && !process.env.SENTRY_DSN) {
  console.error("SENTRY_DSN is not set");
  process.exit(1);
}

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || "production"
  });
}
