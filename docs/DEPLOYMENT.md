# Permanent Git and deployment workflow

Current founder decision: PRD section 14 / Addendum D11 supersede the former private Preview model. **feature branch -> staging -> main**.

- `feat/*`: temporary milestone/feature branches. Review and accept changes before merging into `staging`.
- `staging`: permanent integration/development branch. Configure Vercel project **jadov2** to continuously deploy this branch to the shared staging URL. Feature deployment URLs are temporary, not the shared environment.
- `main`: future production branch. No active development or automatic merge here. Later connect it to a separate production deployment/database.

## Staging environment

Configure the staging deployment with `DATABASE_URL` pointing to the founder-approved shared PostgreSQL/Supabase database, `APP_ENV=staging`, `APP_ORIGIN=https://<actual-staging-domain>` and a separate `BETTER_AUTH_SECRET` of at least 32 random characters. Keep all paid provider flags false and spend caps zero. Use an appropriate TLS database URL. Never commit credentials.

A separately scoped Vercel staging project is recommended if the existing jadov2 project's current production-branch mapping would conflict with future main production: keep the staging deployment tracking `staging`, with staging-only credentials. Record the actual project/domain mapping before enabling deployments. Do not change main's production credentials or promote a feature deployment.

There are no fixture Preview flags, Basic reviewer credentials, reserved database names or private discovery routes. Normal `/`, `/search`, `/feed`, `/b/[slug]`, `/posts/[id]`, `/compare` and `/api/discovery` read this database. Select Uyo (`/?area=Uyo`) to view the dataset. The visible Development data labels and internal seed namespace are retained. Sign-in remains necessary for account access and intended Message/Follow/Like actions; actual writes remain deferred to their milestones.

## Exact migration and seed commands

On a trusted machine, configure an ignored `.env` with the **staging DATABASE_URL** and staging settings above. Check the target privately before executing. Never reuse production credentials. Node 24 is required.

```bash
npm ci
npm run db:migrate
ALLOW_DEV_SEED=true npm run db:prototype:seed
```

Seeding is not part of the build or any HTTP request. Do not retain `ALLOW_DEV_SEED=true` on the deployment. Repeat the seed command to repair missing known rows; stable IDs make it idempotent. Exactly ten fictional businesses, seven categories and twenty typed posts are supplied. Their posts cover services/products, offers, arrivals, updates, events and portfolios, with optional prices, different neighbourhoods, three comparable solar businesses and an expired offer. No Jado verification, users or memberships are granted.

Targeted undo:

```bash
ALLOW_DEV_SEED=true npm run db:prototype:undo
```

Undo only removes the known fixture businesses and their own posts, plus unused fixture categories. Unrelated records and real business/auth tables are preserved; unrelated dependent posts cause a refusal rather than cascading deletion. Migrations remain installed. Real test users/businesses may coexist; they are not yet eligible public listings without the future sanctioned verification gate. M0.5 is not an implementation of real publishing/verification.

## Local code verification and operational deployment

```bash
npm run typecheck
npm run lint
npm test
npm run test:integration
NEXT_TELEMETRY_DISABLED=1 npm run build
npm run test:discovery
```

Founder clarification D12 accepts local implementation and verification as sufficient for this code branch. Remote database connectivity failures in Codex are not code acceptance blockers. Run remote migrations/seed and shared database/deployment checks outside Codex as operational deployment steps.

`test:discovery` uses a disposable **local** database and is not shared-staging evidence. To test the actual configured shared database using the optimised local application and record normal-route browser evidence:

```bash
DISCOVERY_EVIDENCE_DIR=docs/evidence/staging-workflow-shared \
DISCOVERY_EVIDENCE_CONTEXT='Founder-approved shared staging database' \
npm run verify:staging
```

`verify:staging` automatically loads `.env` without overriding shell-supplied variables. It only reads existing database records and issues GET requests; it never migrates, seeds or sends account mutations. Successful verification terminates its own spawned server before printing `10 businesses found; Feed populated; Search working; profiles working; Compare working` and returning exit 0. Cleanup handles an already-exited/failed child and bounds shutdown with SIGTERM followed by SIGKILL if required.

This reads the configured `DATABASE_URL`, starts the app locally on port 3300, checks all ten profiles, four search modes, populated Feed/detail navigation, two/three-business comparisons and selection refresh; it captures five screens at four widths. It does not seed or mutate remote application records. This proves the actual database flows, not an already deployed Vercel site.

After acceptance, merge the feature branch into `staging`, push `staging`, and verify the Vercel deployment actually tracks that commit and uses staging credentials. Visit the actual deployment's normal routes, test search/filter refresh and compare navigation, and retain deployment/commit evidence. Do not claim this step passed without live evidence. No automatic main merge, production deployment or M1 work is authorised.

## Production isolation

Main must use separate production infrastructure and database credentials. **Never run fixture seed on that database.** The CLI requires explicit opt-in but cannot infer whether arbitrary credentials belong to production. There is intentionally no Vercel/runtime fixture switch: any database containing these fixture rows will render them. Operational separation and an unseeded production database are required release gates. An optimised staging build normally runs with NODE_ENV=production and still displays its seeded records.

## Exact feature-to-staging merge commands

From a clean checkout with the committed feature branch available:

```bash
git switch feat/staging-workflow
git push -u origin feat/staging-workflow
git fetch origin
# Select staging (Git can track origin/staging); create it from the feature if absent.
git switch staging || git switch -c staging feat/staging-workflow
if git show-ref --verify --quiet refs/remotes/origin/staging; then
  git merge --ff-only origin/staging
fi
git merge --no-ff feat/staging-workflow -m "Merge staging workflow simplification"
git push -u origin staging
```

These commands never switch or merge main. Run them from a clean checkout. A divergent local staging branch causes the fast-forward update to stop; resolve that separately without resetting unpublished work.
