import * as Sentry from "@sentry/react-native";

export const routingInstrumentation = Sentry.expoRouterIntegration();

Sentry.init({
  dsn:
    process.env.EXPO_PUBLIC_SENTRY_DSN ||
    "https://f1a140461b568c3dda9b7796032cc07a@o4512119876288512.ingest.de.sentry.io/4512119896670288",
  integrations: [routingInstrumentation],
  tracesSampleRate: 1.0,
});

export { Sentry };
