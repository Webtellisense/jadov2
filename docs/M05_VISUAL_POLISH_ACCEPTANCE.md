# M0.5 visual polish — acceptance report

16 November 2026 · Webtellisense Consult · **Awaiting founder visual approval**

## 1. Milestone and scope

M0.5 — Visual experience refinement, on `feat/m05-visual-polish`, created from staging `1147e29b3a7d46333bc493c7cdcc6b1ade022841`. The approved navigation, colours, typography, architecture and interaction boundaries are preserved. No staging/main merge, deployment or M1 implementation is included.

PRD section 15 and Addendum D13 record the founder's visual instructions, including the single quiet staging/demo disclosure. They supersede the earlier repeated card-label requirement. The fixture namespace remains `jado-m05-v1`; none of the ten businesses is verified.

## 2. User-facing outcome

A visitor can explore ten recognisable fictional businesses, see photographs and logos in discovery sections, search their persisted business/service/post content, filter the six structured post types, open photo galleries and complete two- or three-business comparisons. Profiles have covers, image-led services, representative details and the existing six sections. Message, Follow and Like still lead through the existing sign-in gates and truthful milestone-unavailable states. They do not create engagement or send messages.

The [390 px first-screen overview](evidence/m05-visual-polish/mobile-overview.png) shows Explore, Feed and a profile. [All screen captures](evidence/m05-visual-polish/index.md) are available for visual review.

## 3. Files changed

| Files | Purpose |
| --- | --- |
| `components/business-media.tsx`, `components/media-preferences.ts`, `lib/business-media.ts`, `lib/media-policy.ts` | Shared identity, cover, gallery, safe contact and responsive/Data Saver media components; validated presentation contracts and post-media limits. |
| `app/design/page.tsx`, `styles/tokens.css`, `app/globals.css` | Component gallery, existing-token visual patterns, contained logos, photo layouts, fixed gallery geometry and responsive profile/card styling. |
| `components/discovery-cards.tsx`, `features/discovery/screens.tsx`, `components/app-chrome.tsx` | Image-led Explore/Feed/profiles, comparison identity, type indicators and one outside-main staging disclosure. |
| `db/schema.ts`, `db/migrations/0002_m05_visual_media.sql`, migration metadata, `db/prototype-presentation.ts`, `db/prototype-data.ts`, `db/prototype-rollback.ts` | Nullable fixture-only presentation storage, deterministic enrichment of the same stable IDs, guarded collision handling and updated local-only rollback history. |
| `lib/discovery.ts`, `server/prototype-repository.ts` | Carry presentation data through the existing database-backed discovery pathway. |
| `public/demo-businesses/` | Ten original SVG logos, 36 generated photographs in two WebP sizes, provenance manifest and asset notes. |
| `next.config.ts` | Mobile image-size tiers; canonical local variant URLs avoid duplicate hydration fetches. No remote transformation provider. |
| `tests/unit/business-media.test.ts`, integration and browser tests | Asset/schema/limit validation, idempotent enrichment, existing security regressions, media failure recovery and four-width visual checks. |
| `scripts/measure-ui.ts`, `scripts/measure-populated-ui.ts`, `scripts/test-discovery.ts`, `scripts/verify-discovery.ts`, `package.json`, CI artifact upload | Read-only populated runtime measurement, isolated runtime verification and current disclosure assertion. No new dependencies. |
| `AGENTS.md`, PRD, Brain, Addendum, `DECISION_LOG.md`, `README.md`, `DEPLOYMENT.md`, this report and evidence | Approved scope, visual rules, operational commands and review evidence. |

M0 authentication, authorization, account mutation and provider implementations are unchanged.

## 4. Database changes and rollback

Reviewed additive migration `0002_m05_visual_media.sql` adds nullable `presentation` JSONB columns to `development_business` and `development_post`. It changes no core user, session, membership or genuine business tables.

The seed retains all ten existing business IDs and twenty post IDs. Reruns update only presentation data on those known namespaced businesses, and presentation/cleaned descriptions on their known posts. Foreign namespaces and post/business collisions are refused. Genuine business preservation, targeted undo, re-seeding and idempotence pass against isolated PostgreSQL.

After visual approval, the operator uses the intended **staging `DATABASE_URL`**:

```sh
npm run db:migrate
ALLOW_DEV_SEED=true npm run db:prototype:seed
npm run verify:staging
```

These commands were **not run against shared Supabase** during this refinement. Tests migrate/seed only disposable local databases. No shared database was reset, migrated, undone or re-seeded.

For application rollback, leave the additive nullable columns in place; previous code ignores them. Do not reset shared staging or drop columns. `ALLOW_DEV_SEED=true npm run db:prototype:undo` remains an explicit destructive operation on its own fixture namespace, not a deployment rollback step. The complete prototype-schema rollback remains restricted to local development and the exact reviewed migration history.

## 5. Tests run

| Command | Exit | Result and scope |
| --- | --- | --- |
| `npm run typecheck` | 0 | TypeScript passes, including the final measurement runner. |
| `npm run lint` | 0 | Zero ESLint warnings. |
| `npm test` | 0 | **55 unit tests pass**: existing contracts/guards plus fixture presentation, safe media/contact paths, real asset files/byte limits and positive/negative post-media limits. |
| `npm run test:integration` | 0 | **32 PostgreSQL tests pass**: migrations/rollback on disposable databases, auth/RBAC, persistence, collision/undo safeguards and deterministic enrichment. |
| `NEXT_TELEMETRY_DISABLED=1 npm run build` | 0 | Optimised Next.js standalone build succeeds; local dotenv files excluded. |
| Focused browser command below | 0 | **17 tests pass**: 60 view/viewport captures, Axe checks, SQL search/history, comparison selection, real sign-in returns, authorization, gallery keyboard controls, Data Saver and media failure/recovery. |
| Additional state-regression command below | 0 | **4 tests pass**: expired/empty/unavailable/invalid states, real database wait/failure/retry, share URL behavior and pre-JavaScript credential protection. |
| `DISCOVERY_EVIDENCE_DIR=/tmp/jado-polish-runtime npm run test:discovery` | 0 | **12 optimised runtime checks pass** against a disposable PostgreSQL database, followed by populated production-build measurements on five routes. All ten profiles open; Feed/search/comparison values are read from SQL. |
| `npm run measure:populated` | 0 | Separate read-only measurement of the existing enriched local database; no migration or seed. Final recorded metrics were regenerated by the isolated runtime command above. |

```sh
npm run test:e2e -- --grep 'photo-led screens|gallery keyboard|Data Saver|SQL-backed|comparison selection|gate preserves|consumer cannot|mutation checks|selected profile|profile post and review tabs|unavailable media'
npm run test:e2e -- --grep 'expired offer|real database wait|copy and WhatsApp|authentication forms'
```

There are no failing final tests. Earlier iterations caught an invalid event timestamp, oversized WebP assets, migration-count assumptions, image hydration timing and a streamed-footer layout shift; these were corrected before the successful final runs. Tests were not skipped to hide those failures. Development runs still emit advisory Next image/LCP and terminal colour warnings; the measured production pages meet LCP/CLS targets below.

## 6. Screens and performance

**60 full-page captures: 15 views at each of 320, 390, 768 and 1280 px**, plus a mobile overview and intentional image-error capture. Views cover Explore, Feed, Search, solar category, all six profile sections, event/portfolio detail, two/three-business comparison and the component gallery. [Screenshot index](evidence/m05-visual-polish/index.md) · [machine-readable checks](evidence/m05-visual-polish/screens.json).

Each captured screen records zero broken images, zero horizontal page overflow and zero Axe violations. Keyboard gallery cycling, Escape/focus restoration, contained comparison panels and the profile Message/Compare tray separation pass. Manual review includes mobile discovery/profile/service/gallery layouts and desktop profile/comparison hierarchy. Founder visual review remains pending.

The [performance record](evidence/m05-visual-polish/performance.json) uses an optimised local build and populated PostgreSQL, cold browser contexts at 390 × 844, 4× CPU slowdown, 150 ms latency, 200,000 bytes/s download and 93,750 bytes/s upload. This is lab evidence, not Vercel or real-user telemetry. The fixed observation window does not measure the cost of scrolling through the entire Feed.

| Page | LCP | CLS | Image bytes during observation |
| --- | --- | --- | --- |
| Explore | 1.064 s | 0.00046 | 81,264 |
| Feed | 0.956 s | 0.00141 | 16,920 |
| Profile | 0.892 s | 0.00099 | 29,629 |
| Search | 0.720 s | 0.01218 | 47,357 |
| Compare (three) | 0.728 s | 0 | 987 |

All five routes meet the Brain's LCP < 2.5 s and CLS < 0.1 targets. Initial JavaScript is **184,616 bytes gzipped** (about 180.3 KiB), above the approximate 170 KB guide; this remains an explicit performance deviation for review. No third-party origins or broken images were recorded. Original photographs are compressed below 60 KB each, with smaller 320 px variants. Below-fold media is lazy-loaded; Data Saver initially requests only the smaller first image of a collage and permits deliberate gallery navigation.

## 7. External integration status

| Integration | Status |
| --- | --- |
| Local PostgreSQL, SQL discovery, auth and comparison | Real and exercised; isolated databases for automated mutation tests. |
| Logos and photographs | Original SVGs and generated local photographs with provenance. Illustrative fixture content, not owner/Google photographs. |
| Shared Supabase / deployed Vercel | Unchanged. The shared-host read attempt in this environment failed DNS (`EAI_AGAIN`); no shared write occurred. Apply approved additive migration/enrichment and verify deployment operationally outside this environment under D12. No deployed runtime fix is claimed. |
| Google/GBP, AI, email delivery, paid storage and messaging providers | Disabled/unavailable; no external credentials activated and no paid integration enabled. |
| Like, Follow, Message | Existing authenticated prototype continuations and honest blocked states; no invented counts or backend successes. |

## 8. Security and privacy

Server-side authentication, active-account/role checks, mutation validation, origin protection and abuse controls are preserved. Unit/integration/browser regressions cover unauthorized access and writes. No fixture receives Google verification, ratings, reviews, response metrics or customer interactions.

Presentation contracts accept only the approved local media paths. Example websites/emails/social destinations use reserved `.example` domains, and phone examples are deliberately not dialable; fixtures cannot accidentally contact an unrelated real business. No credential or database URL belongs in committed evidence. Responsive media is local and causes no third-party browser request.

Production isolation still depends on the agreed separate unseeded production database and credentials. This visual feature introduces no client, URL or cookie switch to alter fixture supply. Human screen-reader testing, real-device testing and deployed runtime confirmation have not been performed here.

## 9. Acceptance checklist

| Requested phase | Status | Evidence |
| --- | --- | --- |
| 1. Enrich ten existing fixtures | PASS locally | Stable IDs/namespace, ten distinct logos, covers/galleries, descriptive About, existing categories/locations, representative address/hours, services and safe contacts; 20 structured posts; deterministic seed tests. Shared enrichment is an operational step. |
| 2. Shared business identity | PASS | Seven named shared components in `/design`; contained logos, responsive/lazy media, keyboard gallery and Data Saver tests. |
| 3. Feed | PASS | Six icon/text types; limits 3/3/3/2/5/5 validated; 1–5 image layouts; existing gated actions; SQL-backed post links. |
| 4. Explore | PASS | Solar showcase, New offers with real fixture expiry, Just joined, Recently active and All businesses retained; photos/identity; useful 390 px first screen. |
| 5. Profiles | PASS | Cover/overlapping logo, contacts and existing action hierarchy; all six tabs; image-led services; representative fixture details and honest unavailable Google information. |
| 6. Compare | PASS | Logos/headings, seeded prices/hours/offers, URL selections/share, two/three compatible businesses, max-three and category guidance retained; no overall score. |
| 7. Reduce repeated development UI | PASS | One quiet staging/demo disclosure outside main; database provenance retained; no per-card sample labels or fake badges. |
| 8. Design system and verification | PASS with stated limits | Brain/decision log updated, four-width captures, 55 unit + 32 integration + 21 focused browser tests and production build pass. JS guide exceeded; human visual/screen-reader approval pending. |

### Screen Definition of Done (Brain section 11)

This checklist applies to the 15 delivered views in the screenshot matrix; profile tabs share the same shell and components.

| Item | Status and evidence |
| --- | --- |
| 1. Useful first screen; search/location immediately available | PASS — populated Explore capture at 390 px; single staging disclosure under D13. Fixtures are not verified supply. |
| 2. Four widths; no page overflow or overlapping action bars | PASS — 60 checks; profile/tray geometry regression. Intentional contained carousels/comparison panels can scroll. |
| 3. Shared gallery components and existing tokens | PASS — media/identity gallery assembled before screen integration; existing palette/fonts/navigation preserved. |
| 4. Loading, empty, error, offline and unauthorized states | PASS — real SQL lock/failure/retry, expired/invalid/empty states, offline notice, unauthorized regressions and image-error capture. |
| 5. Primary action/touch access | PASS — Message remains primary; existing minimum touch targets and mobile tray positioning preserved. |
| 6. Useful copy | PASS — enriched descriptions; repeated prototype/sample strings removed; unavailable data is stated honestly. |
| 7. Sign-in return and safe continuation | PASS — Message/Follow/Like preserve business/post context through real local sign-in; no message/engagement write is faked. |
| 8. Honest numbers and provenance | PASS — fixture prices/dates read from SQL; no Google ratings/reviews, verification or engagement metrics invented; D13 disclosure. |
| 9. Keyboard, screen reader and contrast | PARTIAL — keyboard and automated Axe checks pass at all four widths; no human screen-reader audit performed. Existing approved contrast tokens preserved. |
| 10. Performance and compressed/lazy media | PARTIAL — LCP/CLS pass, Data Saver/media tests pass; 184,616-byte initial JavaScript exceeds the approximate guide. |
| 11. History, refresh and deep links | PASS — SQL filters/back-forward, URL comparison persistence, share links, profile/post navigation. |
| 12. Screenshots/deviations | PASS — 60 captures indexed; D13 disclosure override, local-only evidence, JS and human-audit limits stated. |

## 10. Next step

Founder visual approval of this feature branch. Do not merge into staging until approval. After acceptance, an operator can apply the additive staging migration, re-run the namespaced seed and confirm the deployed flows using the normal staging `DATABASE_URL`. Main remains untouched and M1 remains unstarted.
