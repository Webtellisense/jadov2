# M0.5 verification runner fix

16 November 2026. No M1, schema migration, seed or application feature changes.

- `npm run verify:staging` now loads `.env` automatically, retaining shell environment precedence.
- SQL pool cleanup runs even if a query fails. Verification only performs SQL SELECTs and HTTP GETs; the account PATCH probe was removed.
- Child cleanup registers listeners before signalling; already-exited/failed-spawn children return immediately. Shutdown is bounded with SIGTERM, SIGKILL fallback and a final rejection deadline. Success prints after cleanup, so successful execution returns 0 without an unresolved top-level await.
- Concise summary: `Verification passed (12 checks): 10 businesses found; Feed populated; Search working; profiles working; Compare working.`

Validation (all final exit codes 0):

- `npm run typecheck`
- `npm run lint`
- `npm test`: 52 passed, including four shutdown regressions: already exited, running child, failed spawn and ignored SIGTERM.
- `DISCOVERY_EVIDENCE_DIR=/tmp/jado-verifier-existing-db npm run verify:staging`: existing workspace `.env` database, 12 checks; no migrations or seeds.
- `DISCOVERY_EVIDENCE_DIR=/tmp/jado-verifier-shared-final DISCOVERY_EVIDENCE_CONTEXT='Existing shared Supabase staging database; read-only verification' node --env-file=.env.staging.local --run verify:staging`: existing shared staging DATABASE_URL from the ignored local environment file, 12 checks, exit 0. The file was used to keep the shared credentials separate from the workspace's existing local `.env`. No shared rows were modified/reseeded. Standalone application ran locally; this is not evidence of a deployed Vercel site.

The shared check found ten fixture businesses and twenty existing posts, opened all ten profiles, exercised populated Feed/post links, business/category/service/post-content search, URL selection refresh and two/three-business comparisons. Twenty screenshots were generated in `/tmp` at 320/390/768/1280px; UI design did not change.

[Shared database verification evidence](evidence/verifier-fix/shared-verification.json). No database URL, credentials or reviewer secret are included in evidence.
