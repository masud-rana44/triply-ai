# Triply — AI Trip Planner Implementation Plan & Checklist

**Tech Stack**: Expo SDK 57 (React Native 0.86, React 19) • Clerk Auth (Google & Apple) • Neon Postgres • Drizzle ORM • Inngest • Google Gemini 1.5 Flash • ImageKit + Unsplash • Sentry

---

## Progress Overview
- [ ] Phase 1: Environment, Tooling & Core Dependencies
- [ ] Phase 2: Database Layer (Neon Postgres & Drizzle ORM)
- [ ] Phase 3: Background Pipeline & AI Orchestration (Inngest, Gemini, Unsplash, ImageKit)
- [ ] Phase 4: Server API Routes (`+api.ts`)
- [ ] Phase 5: Client Foundations & Auth Shell
- [ ] Phase 6: UI Screens & Flows *(Awaiting User Design Assets)*
- [ ] Phase 7: End-to-End Verification & Quality Bar

---

## Phase 1: Environment, Tooling & Core Dependencies
- [ ] Update `app.json`:
  - [ ] Set `web.output` to `"server"` (required for Expo Router `+api.ts` server routes)
  - [x] Confirm deep-linking `scheme: "triply"`
  - [x] Verify `expo-secure-store` and other config plugins (`@clerk/expo`)
- [ ] Install runtime dependencies:
  - [x] `@clerk/expo` (Authentication)
  - [x] `expo-secure-store` (Secure token caching)
  - [x] `expo-auth-session` (OAuth / Browser SSO)
  - [ ] `drizzle-orm` & `@neondatabase/serverless` (Neon Postgres database client)
  - [ ] `inngest` (Background job workflows)
  - [ ] `svix` (Clerk webhook signature verification)
  - [ ] `@google/genai` (Gemini 1.5 Flash SDK)
  - [ ] `zod` (Strict schema validation for AI and API payloads)
  - [ ] `@tanstack/react-query` (Mobile polling & data caching)
  - [x] `@sentry/react-native` (Monitoring & error tracking)
  - [ ] `dotenv` (Environment configuration)
- [ ] Install dev dependencies:
  - [ ] `drizzle-kit` (Schema migrations)
  - [ ] `@types/node` (Node type definitions)
- [ ] Add helper scripts to `package.json`:
  - [ ] `"inngest:dev": "npx inngest-cli@latest dev -u http://localhost:8081/api/inngest"`
  - [ ] `"db:generate": "drizzle-kit generate"`
  - [ ] `"db:push": "drizzle-kit push"`
- [x] Configure environment variables (`.env` configured with required secrets):
  - [x] `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - [x] `CLERK_SECRET_KEY`
  - [x] `CLERK_WEBHOOK_SIGNING_SECRET`
  - [x] `DATABASE_URL`
  - [x] `GEMINI_API_KEY`
  - [x] `UNSPLASH_ACCESS_KEY`
  - [x] `EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT`
  - [x] `SENTRY_DSN` / `EXPO_PUBLIC_SENTRY_DSN`
  - [x] `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY`

---

## Phase 2: Database Layer (Neon Postgres & Drizzle ORM)
- [ ] Create `drizzle.config.ts` configured for Neon Postgres (`postgresql` dialect)
- [ ] Create `src/db/schema.ts`:
  - [ ] Define `users` table (`id` [Clerk user ID], `email`, `firstName`, `lastName`, `imageUrl`, timestamps)
  - [ ] Define `trips` table:
    - Primary key: `id` (UUID)
    - Foreign key: `userId` -> `users.id` (cascade delete)
    - Metadata: `destination`, `durationDays` (1–14), `travelerType`, `budgetTier`, `interests` (JSONB)
    - Status: `status` (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`), `errorMessage`
    - Content: `heroImageUrl`, `itineraryData` (JSONB containing structured days & time slots)
    - Timestamps: `createdAt`, `updatedAt`
- [ ] Create `src/db/index.ts` connecting `@neondatabase/serverless` with Drizzle ORM
- [ ] Run `npm run db:push` to sync schema with Neon database

---

## Phase 3: Background Pipeline & AI Orchestration
- [ ] Create `src/types/trip.ts`:
  - [ ] Define Zod schema for structured AI itinerary (days array, daily theme, Morning/Afternoon/Evening slots with activity name, description, estimated cost, estimated duration, category tag)
  - [ ] Define TypeScript types for input parameters and trip responses
- [ ] Create `src/lib/gemini.ts`:
  - [ ] Initialize Google Gemini 1.5 Flash client
  - [ ] Configure structured JSON output mode with the itinerary Zod schema
  - [ ] Write system prompts enforcing quality recommendations, budget realism, and pacing
- [ ] Create `src/lib/unsplash.ts`:
  - [ ] Implement destination cover photo resolver using Unsplash API
  - [ ] Add fallback curated destination imagery if Unsplash is unavailable or rate-limited
- [ ] Create `src/lib/imagekit.ts`:
  - [ ] Implement URL transformation helper (WebP auto-format, DPR sizing, CDN proxy caching)
- [ ] Create `src/inngest/client.ts`:
  - [ ] Initialize Inngest client with ID `"triply"`
- [ ] Create `src/inngest/functions/generate-trip.ts`:
  - [ ] Event trigger: `triply/trip.generate`
  - [ ] Step 1: Update trip status to `PROCESSING` in Neon
  - [ ] Step 2: Call Gemini 1.5 Flash with exponential retries (up to 3 attempts)
  - [ ] Step 3: Fetch destination photo from Unsplash with safe fallback
  - [ ] Step 4: Save `itineraryData`, `heroImageUrl`, and set status to `COMPLETED`
  - [ ] Failure Handler (`onFailure`): Mark trip status as `FAILED` with descriptive error message

---

## Phase 4: Server API Routes (`+api.ts`)
- [ ] Create `src/app/api/inngest+api.ts`:
  - [ ] Serve Inngest webhook route handler (`GET`, `POST`, `PUT`) using Web Standard Request/Response
- [ ] Create `src/app/api/webhooks/clerk+api.ts`:
  - [ ] Verify incoming Svix signature with `CLERK_WEBHOOK_SECRET`
  - [ ] Handle `user.created` and `user.updated` events (upsert to Neon `users` table)
  - [ ] Handle `user.deleted` event (remove user from Neon)
- [ ] Create `src/app/api/trips/generate+api.ts`:
  - [ ] Authenticate request with Clerk session headers
  - [ ] Enforce quota: Count trips created by `userId` in the last 24 hours (limit: 20)
  - [ ] Insert initial `trips` record with `status: "PENDING"`
  - [ ] Dispatch `triply/trip.generate` event to Inngest
  - [ ] Return `{ tripId, status: "PENDING" }`
- [ ] Create `src/app/api/trips/[id]+api.ts`:
  - [ ] `GET`: Return trip by `id` (used by mobile client polling every 2s)
  - [ ] `DELETE`: Remove trip by `id` ensuring `userId` ownership
- [ ] Create `src/app/api/trips/index+api.ts`:
  - [ ] `GET`: Fetch all trips for the authenticated user ordered by `createdAt DESC`

---

## Phase 5: Client Foundations & Auth Shell
- [x] Configure token cache:
  - [x] Implement Clerk token cache using `expo-secure-store` (`@clerk/expo/token-cache`)
- [ ] Create `src/lib/query-client.ts`:
  - [ ] Configure TanStack Query client with sensible retry and stale-time defaults
- [x] Create `src/lib/sentry.ts`:
  - [x] Initialize `@sentry/react-native` for client and error boundary monitoring
- [ ] Update `src/app/_layout.tsx`:
  - [x] Wrap application with `ClerkProvider` and Sentry error boundary
  - [ ] Add `QueryClientProvider`

---

## Phase 6: UI Screens & Flows
- [x] Welcome / Sign-In Screen (`src/app/index.tsx` - Single-Page Auth Screen):
  - [x] "Continue with Apple" button with custom SVG icon
  - [x] "Continue with Google" button with custom SVG icon
  - [x] Connected to Clerk `useSSO()` OAuth flow
  - [x] Dark overlay and active session state display
- [ ] Home / Dashboard Screen (`src/app/(main)/index.tsx`):
  - [ ] "Plan a New Trip" hero call-to-action
  - [ ] List of saved trips with status badges, destination hero cards, and delete action
  - [ ] Empty state for new users
- [ ] Trip Generation Wizard (`src/app/(main)/generate.tsx`):
  - [ ] Destination input
  - [ ] Duration selector (1–14 days)
  - [ ] Travelers selector (Solo, Couple, Family, Friends)
  - [ ] Budget tier selector (Budget, Moderate, Luxury)
  - [ ] Travel vibe / interests selector chips
  - [ ] Submit button triggering generation
- [ ] Loading & Polling Screen (`src/app/(main)/loading/[id].tsx`):
  - [ ] Engaging loading animations & travel tips
  - [ ] React Query polling `GET /api/trips/[id]` every 2 seconds
  - [ ] Error state with "Try Again" CTA if `status: "FAILED"`
  - [ ] Seamless navigation to Trip Detail when `status: "COMPLETED"`
- [ ] Trip Detail Screen (`src/app/(main)/trip/[id].tsx`):
  - [ ] Hero header image with ImageKit optimization
  - [ ] Destination title, duration, budget, and traveler badges
  - [ ] Day selector tabs
  - [ ] Morning, Afternoon, Evening cards with activity details, cost estimates, and duration

---

## Phase 7: End-to-End Verification & Quality Bar
- [ ] Run `npx tsc --noEmit` to verify strict TypeScript types
- [ ] Start Inngest local dev server (`npm run inngest:dev`) and verify functions register on `http://localhost:8288`
- [ ] Test Clerk webhook user sync with test event
- [ ] Test trip generation dispatch (`POST /api/trips/generate` -> Inngest -> Gemini -> Neon)
- [ ] Verify 20 trips / 24 hours quota enforcement (request 21 returns HTTP 429)
- [ ] Verify fallback image logic when Unsplash is unavailable
