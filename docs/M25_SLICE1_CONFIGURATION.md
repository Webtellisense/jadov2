# M2.5 Slice 1 configuration and operating notes

17 November 2026. All configuration is server-only. No live provider was enabled while implementing this slice. Better Auth remains the only Jado account/session system.

## Environment

Keep existing DATABASE_URL, APP_ORIGIN and BETTER_AUTH_SECRET. Staging uses its normal shared Supabase URL with TLS verification; future production uses separate credentials and an unseeded database. Do not commit secrets or set any key through NEXT_PUBLIC_.

```dotenv
APP_ENV=staging
APP_ORIGIN=https://your-actual-staging-domain
JADO_FIXTURES_VISIBLE=true
AUTH_GOOGLE_ENABLED=false
AUTH_GOOGLE_CLIENT_ID=
AUTH_GOOGLE_CLIENT_SECRET=
EMAIL_ENABLED=false
EMAIL_PROVIDER=disabled
EMAIL_API_KEY=
EMAIL_FROM=
```

On future main production, APP_ENV=production and JADO_FIXTURES_VISIBLE=false, with separate database credentials. APP_ENV=production denies fixture reads even if the fixture flag is mistakenly true. Vercel's Production Branch currently being staging does not make staging the future main environment. ALLOW_DEV_SEED is still a one-off CLI choice, never a persistent deployment flag.

## Google account sign-in

Register a Google Web OAuth client and the exact callback `${APP_ORIGIN}/api/auth/callback/google`. Configure AUTH_GOOGLE_CLIENT_ID/SECRET and then explicitly enable AUTH_GOOGLE_ENABLED. Local callback is `http://localhost:3000/api/auth/callback/google` when APP_ORIGIN matches. Use a stable allowed staging domain; do not wildcard arbitrary feature URLs or let an untrusted Host select callback origin. Configure consent screen/test users and privacy/terms as required by Google before live demonstration.

This requests Google identity, not business.manage. A Google login does not create a business membership or verification. Implicit email-based account linking stays disabled; users with an existing email credential must use that method rather than silently merge identities. Dedicated GBP OAuth is Slice 2, not this callback.

Absent credentials: the Google button is disabled and its endpoint is closed. No mock provider can be selected in staging. A test-only mailer/credentials injected by automated tests is not a runtime configuration option.

## Genuine transactional email

First transport is replaceable Resend HTTP, without an added vendor SDK. Configure a verified sender/domain, EMAIL_FROM, EMAIL_API_KEY, EMAIL_PROVIDER=resend and EMAIL_ENABLED=true only after the founder has provided the account and authorised its free-tier usage. Paid upgrades/sends beyond approved limits are not authorised. Existing paid caps remain zero; the code does not buy or upgrade a plan. Configure provider-side free-tier limits/alerts before enabling delivery. Replace the transport if another provider is approved; do not change auth systems.

Sign-up creates an unverified Better Auth account and hashed six-digit OTP (five-minute expiry, attempt/resend limits). No verified flag is set until the correct code is consumed. Recovery uses Better Auth's single-use link and revokes existing sessions after password reset. No OTP/password/token is logged. The full auth route allowlist excludes OTP disclosure, email-only OTP sign-in, account linking and arbitrary profile mutations.

Unconfigured email disables registration/verification/recovery. Existing permitted credential sign-in remains operational. Transport failure is surfaced as unavailable even though Better Auth normally catches its callback exception; it never turns an unverified account into a verified one. An account created before delivery failure stays unverified and may request a new code after service recovery. Messages use conditional wording when account existence must remain private.

## Migration and rollback

Review `db/migrations/0003_m25_business_foundation.sql`, back up the intended staging database, and apply through the normal single migration runner at deployment time:

```sh
npm run db:migrate
```

This slice does not need fixture reseeding. No shared migration, reset or seed was performed by this implementation. Migration 0003 extends business/membership and adds private onboarding/profile/verification/audit tables. Legacy Google identity and business IDs remain. Legacy verified_active never becomes new published proof. Nullable unique Place ID supports a genuine missing ID; unique GBP location ID is available for Slice 2.

Application rollback must preserve the additive schema and any saved drafts; disable new writes and retain data. Do not reimpose Place ID NOT NULL, remove history, drop tables or run local destructive rollback commands on staging. Integration tooling exercises the historical 0000–0002 rollback only on a disposable local database before applying the full migration chain. Those rollback commands refuse a database with 0003 applied.

## Local review

Use existing local setup and loopback PostgreSQL. Apply the additive migration to the local database, preserve existing seed data, then `npm run dev`. Existing fictional records remain on `/?area=Uyo` with JADO_FIXTURES_VISIBLE enabled. `/my-business` requires a real active verified Jado account. Local development seed identities are intentionally denied real-business onboarding. Do not change is_fixture/email_verified manually to get around this in staging.

Automated integration/browser tests provision accounts through Better Auth with a test-only injected sender in isolated databases. That proves account/draft contracts; genuine external delivery and live Google sign-in require configured credentials and separate evidence. There is no public route, runtime mock switch or UI button that grants test verification.

## Slice boundaries / operational dependencies

Slice 1 can save incomplete provisional business details, About, service area and contacts. It assigns no OWNER or MANAGER. No real profile/post is publicly projected yet. Uploads, completed profile preview and visual identity selection/monograms are Slice 3. Publishing and welcome guide are later approved slices. Do not portray their controls as live.

For actual staging acceptance, configure Google identity and/or genuine mail, deploy the accepted feature with migration 0003, create a real verified Jado account, save/reopen a private draft and prove its exclusion from public routes. Inspect deployed SHA and runtime errors without exposing secrets. No merge or deployment of M2.5 has occurred merely because local tests pass. Stop for Slice 1 acceptance before Slice 2.
