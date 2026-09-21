# Triply Agent Guidelines & Project Standards

> **CRITICAL: Expo HAS CHANGED**
> Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

> **CRITICAL: NEVER RUN THE DEV SERVER**
> Never run `npm run start`, `npm start`, `npx expo start`, `expo run:ios`, `expo run:android`, or any application startup command. The user is already running the application in a separate terminal.

---

## 1. Core Tech Stack
- **Framework**: Expo SDK 57 (React Native 0.86, React 19)
- **Routing**: Expo Router v57 (File-based navigation & server routes `+api.ts`)
- **Styling**: NativeWind v4 (Tailwind CSS v3 engine) with `global.css`
- **Authentication**: Clerk (`@clerk/clerk-expo`) with `expo-secure-store` token cache
- **Database**: Neon Serverless Postgres (`@neondatabase/serverless`)
- **ORM**: Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- **Background Jobs**: Inngest (`inngest`) for asynchronous pipelines and event orchestration
- **AI Engine**: Google Gemini 1.5 Flash (`@google/genai`) with strict Zod structured outputs
- **Image Optimization & CDN**: ImageKit + Unsplash API for destination imagery
- **Error Tracking & Monitoring**: Sentry (`@sentry/react-native`) initialized in `src/lib/sentry.ts` and wrapping root layout
- **Client State & Caching**: TanStack React Query (`@tanstack/react-query`) for client-side API requests and polling

---

## 2. Navigation & UI Conventions
- **ALWAYS Use Native Tabs**:
  - This project **must always use native tabs**. Never use custom JavaScript tab bars, floating JS wrappers, or simulated bottom bars.
  - Use Expo Router's native `<Tabs />` backed directly by `react-native-screens` native bottom tab bar primitives.
- **Native Stack**:
  - Use `<Stack />` from `expo-router` for all modal and standard navigation transitions.
- **Styling**:
  - Exclusively use NativeWind `className="..."`.
  - Do not use `StyleSheet.create` unless required for dynamic runtime dimensions.
- **Images**:
  - ALWAYS import `Image` from `expo-image` (never from `react-native`).
  - Use ImageKit endpoint transformations for responsive sizing, WebP formatting, and CDN caching.
- **Safe Areas**:
  - Always use `react-native-safe-area-context` (`useSafeAreaInsets` or `<SafeAreaView>`) to handle notches and navigation bars.
- **Glass & Native Effects**:
  - Use `expo-glass-effect` for native blur/glass tab bars and headers on iOS.

---

## 3. Server Routes (`+api.ts`) & Background Pipeline
- **Expo Router Server Handlers**:
  - All API routes live in `src/app/api/.../*+api.ts`.
  - Must use Web Standard `Request` and `Response` (e.g., `Response.json(...)`).
  - **NEVER** import React Native UI modules into server `+api.ts` files.
- **Background Processing (Inngest)**:
  - Long-running operations (Gemini itinerary generation, Unsplash resolution, webhooks) must be dispatched as Inngest events (`triply/trip.generate`).
  - Server routes must remain fast: create a pending record, dispatch to Inngest, and return immediately. The mobile client polls the status using React Query.
- **Clerk Webhooks**:
  - Verify Svix signature headers using `CLERK_WEBHOOK_SECRET` before syncing users to the Neon database.

---

## 4. Database & Schemas
- Schemas live in `src/db/schema.ts` using Drizzle ORM with the Postgres dialect.
- Connection is managed in `src/db/index.ts` using `@neondatabase/serverless`.
- Use `zod` for all payload validation (API request bodies, Inngest event payloads, Gemini structured output).

---

## 5. Environment & Secrets Management
- **Client-Accessible Secrets**: Must be prefixed with `EXPO_PUBLIC_` (e.g., `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT`).
- **Server-Only Secrets**: Must **NEVER** have the `EXPO_PUBLIC_` prefix (e.g., `CLERK_SECRET_KEY`, `DATABASE_URL`, `GEMINI_API_KEY`, `INNGEST_SIGNING_KEY`, `CLERK_WEBHOOK_SECRET`).

---

## 6. Execution, Code Quality & Verification
- **DO NOT Start The Dev Server**: Never run `npm run start`, `npm start`, `npx expo start`, `expo run:ios`, `expo run:android`, or any start/dev command. The user is already running the server in a separate terminal.
- **TypeScript Verification**: Always run `npx tsc --noEmit` to verify type safety before completing tasks. No type errors or untyped `any` workarounds.
- **Expo SDK 57 Compatibility**: Only use APIs and packages compatible with React 19 and Expo SDK 57.
