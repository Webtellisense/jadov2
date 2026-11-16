# Jado v2

M0 foundation plus the M0.5 interactive UI prototype: Next.js App Router, strict TypeScript, PostgreSQL 17, Drizzle migrations and Better Auth sessions. Public registration and all external providers remain unavailable. The restricted development preview is described below.

Read [AGENTS.md](AGENTS.md) and all seven documents in its specified order. The Decisions Addendum requires PostgreSQL from M0 and limits launch to M0–M4. Implementation proceeds one accepted milestone at a time.

## Local setup

Requirements: Node.js 24.22.1 (Node 24 LTS), npm 11+, Docker/Compose, and a Chromium browser for E2E tests. Use the existing checkout; cloud tasks are already isolated and need no Git worktree.

```bash
npm ci
npm run setup:local
docker compose up -d --wait postgres
npm run db:migrate
npm run dev
```

In the prepared cloud environment, PostgreSQL is already managed by `/workspace/.cloud-setup/jadov2/start-postgres.sh`. Run that helper instead of starting a second Compose database on port 5432. It uses the managed Docker socket and persistent cloud data. Other machines use Compose above. Both provide a loopback-only, passwordless local database; this is not a production configuration.

`setup:local` creates an ignored `.env` from [.env.example](.env.example), generates local auth/seed secrets without printing them, and preserves any existing `.env`. Inspect local configuration securely. Override DATABASE_URL for your PostgreSQL installation. `APP_ORIGIN` must match the browser origin; production requires HTTPS. Missing environment values produce a safe unavailable response rather than fake success. Visit the app on port 3000. `/api/health` checks actual database connectivity and returns 503 on failure.

## Optional local development accounts

No user or business is seeded by default. To opt into clearly labeled local fixtures:

```bash
ALLOW_DEV_SEED=true npm run db:seed
```

Sign in with `consumer@example.invalid` or `admin@example.invalid` and the generated DEV_SEED_PASSWORD in your own ignored `.env`. The admin fixture exercises staff guards; neither account can verify a business. That M0 seed creates one pending-claim fixture with a deliberately invalid Google identifier; the ten-profile M0.5 dataset is a separate opt-in seed. Do not publish fixtures or share the local password.

```bash
ALLOW_DEV_SEED=true npm run db:seed:undo
```

Seeds can run repeatedly and reversal removes only the known labeled fixtures and dependent local records. Production refuses seed operations and fixture authentication. Public sign-up, Google login, verification email and password recovery are intentionally closed in M0. Approved consumer Google/email+password+email OTP flows remain subsequent work.

## Database and migrations

Schema: [db/schema.ts](db/schema.ts); reviewed SQL and Drizzle history: [db/migrations](db/migrations). Use `npm run db:generate` after a schema change and review the resulting SQL. `npm run db:migrate` applies pending migrations and is safe to repeat. The app never runs migrations on a web request. Standard PostgreSQL is used both locally and in production; no SQLite conversion is required.

Initial-M0 rollback is destructive and intentionally limited to a disposable, opted-in local database with exactly one migration:

```bash
ALLOW_DEV_SEED=true CONFIRM_INITIAL_ROLLBACK=true npm run db:rollback
npm run db:migrate
```

Back up any valued data first. Seed reversal is the narrower operation for removing fixture data. Future production schema changes need reviewed forward/compensating migrations and restore procedures; do not use the local initial rollback there.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run test:integration
npx playwright install chromium  # only if no compatible Chromium is installed
npm run test:e2e
NEXT_TELEMETRY_DISABLED=1 npm run build
npm run test:production
npm start
```

Integration and browser runners require the local database role to have CREATEDB (the local Docker role does). They allocate unique `jado_test_*` databases, migrate/seed only those databases, and drop them afterward. The integration runner also verifies initial rollback and repeated migration. Never point test runners at production. A compatible `/usr/bin/chromium` is used in the cloud; otherwise install Playwright Chromium or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH. Browser checks start their own dev server on port 3100, exercise authenticated persistence and denials, inspect 320/390/768/1280px layouts, and save screenshots/traces in ignored `test-results/` and `playwright-report/`. Do not run E2E and a production build concurrently against the same `.next` directory.

## Production packaging

```bash
docker build -t jado-v2:m0 .
```

The multi-stage [Dockerfile](Dockerfile) emits a nonroot standalone Next.js image. `npm run build` also prepares standalone static assets and removes traced dotenv files; `npm start` runs the generated server, loads optional local `.env` only at runtime, and accepts PORT from the environment. Supply DATABASE_URL, a generated BETTER_AUTH_SECRET and an HTTPS APP_ORIGIN at runtime through secure environment settings. No secret or `.env` is included in the packaged artifact. On this cloud platform, the verified build command mounts its trusted session CA temporarily:

```bash
docker build --secret "id=proxy_ca,src=$NODE_EXTRA_CA_CERTS" -t jado-v2:m0 .
```

TLS verification remains enabled and the CA is not copied into the image. A production host/provider and deployment are not selected or activated in M0. Health and production authentication must be verified against the eventual hosting configuration before release.

See [technical decisions](docs/DECISION_LOG.md), [security boundaries](docs/SECURITY.md) and [M0 acceptance evidence](docs/M0_ACCEPTANCE.md) for scope and limitations.

## M0.5 interactive UI prototype

The current branch preserves M0 and adds an **authenticated local development preview**, not a live business directory. Read the UI/UX Brain and Decisions Addendum in the order in AGENTS.md. AI and Learn are intentionally absent from launch navigation.

After the existing local setup and migrations, set these values in your ignored `.env`:

```dotenv
APP_ENV=local
DEV_PREVIEW_ENABLED=true
```

Then run:

```bash
ALLOW_DEV_SEED=true npm run db:seed
ALLOW_DEV_SEED=true npm run db:prototype:seed
npm run dev
```

Sign in through `/sign-in` with a local fixture account, then open `/design` to inspect the component gallery or `/dev?area=Uyo` to explore the prototype. `/account` also links to both when authorised. The dedicated dataset contains exactly ten fictional businesses across seven categories and twenty typed posts (one expired offer). Names, prices and post dates are fictional and visibly labelled **Development data**. Google ratings, verified badges, genuine activity metrics and fabricated contact numbers are absent. Category illustrations stand in for unavailable owner photos.

Search and filters run through the PostgreSQL repository; area, category, query, post type, offer filter, sort and comparison selections use URLs. Choose two or three businesses to compare. Message, Follow and Like preserve the intended business/post through authentication, then explain which milestone will connect the action. No fake write occurs. Owner and admin screens remain protected, honest shells.

Public routes remain open without sign-in after an area choice. They show an honest empty state; the M0 foundation has no activated public profiles yet. `/api/discovery` never falls back to development records. Production denies `/dev`, `/design`, the private API and fixture sign-in even if a preview flag was accidentally retained. Never run `next dev` as a public staging or production service.

Reversible operations:

```bash
ALLOW_DEV_SEED=true npm run db:prototype:undo
ALLOW_DEV_SEED=true npm run db:prototype:seed
# Optional schema reversal, disposable local database only:
ALLOW_DEV_SEED=true CONFIRM_PROTOTYPE_ROLLBACK=true npm run db:prototype:rollback
npm run db:migrate
```

Seed undo removes only the ten-record prototype namespace and its dependent posts/categories, preserving M0 auth, users, pending business and audit data. Schema rollback removes the three prototype tables only when the known two-migration history matches. The existing initial-M0 rollback remains separately guarded.

The full `test:e2e` command now captures all major screens at 320/390/768/1280px in `docs/evidence/m05/`; no external service is activated. See `docs/M05_ACCEPTANCE.md` for the final acceptance evidence and deviations. Visual founder approval is required before M1.

`npm run test:production` starts the optimised standalone runtime against an isolated PostgreSQL database seeded with fixtures, proves production denies them, checks packaged fonts/secrets, measures four public routes under a throttled mobile profile, and shuts down the test server/database. It does not deploy or access a production account.
