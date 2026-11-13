# EcoWatch AI — Remaining Work Roadmap

This roadmap is ordered by release risk, based on `ecowatch_ai_master_completion_audit.md`. It does not authorize implementation.

## P0 — Complete and validate security remediation

Objective: establish a single, testable server-side identity boundary.

Evidence: `src/lib/auth/server.ts`, `src/middleware.ts`, and module API helpers now use claims/profile-based identity paths, but live Supabase validation is absent and `tests/analytics-security.test.ts` currently fails on a stale ward assertion.

Work:

- Decide and document authoritative identity data (`profiles` is the observed contract).
- Run authenticated Supabase tests for `getClaims()`, optional fresh `getUser()`, profile lookup, missing/expired JWT, wrong role, and wrong owner.
- Complete route-by-route tests for all endpoints under `src/app/api/`; remove test assumptions based on client role headers.
- Repair the ward fixture/assertion mismatch and run the affected analytics, operations, civic, cleanup, and regression suites.
- Review CSRF posture for cookie-backed mutation endpoints, rate limiting, audit records, and error disclosure.

Acceptance: every protected route returns 401/403 appropriately, citizen data isolation is live-tested, role headers/cookies cannot elevate a request, and the full local test suite passes.

## P0 — Establish Supabase production integration

Objective: replace demo persistence with a proven protected database and storage environment.

Blocked dependency: database schema, migrations, RLS policies, storage policies, test/project credentials, and an approved non-production Supabase environment are absent from this checkout.

Work:

- Recover the canonical migrations/schema and document each table, foreign key, index, bucket, retention rule, and RLS policy.
- Confirm `profiles` access and claims-based role checks are allowed only to appropriate authenticated users.
- Test create/read/update/delete flows across reports, waste analyses, operations, cleanup evidence, audit history, and notification logs.
- Validate media upload paths, signed/public URL strategy, MIME/size checks, malware processing policy, and cross-user file access isolation.
- Resolve `isMock: true` values in `src/lib/operations/supabase-adapter.ts` before presenting data as live.

Acceptance: a test tenant shows persisted data after restart, RLS rejects cross-user and role-inappropriate operations, and storage rules are verified with negative tests.

## P1 — Verify Gemini and Google Maps

Objective: demonstrate external services under real credentials without hiding fallback behavior.

Evidence: Gemini is implemented in `src/lib/ai/gemini.ts`, `gemini-civic.ts`, `src/lib/operations/gemini-root-cause.ts`; Maps in `src/lib/geo/google-maps.ts`, `CivicMapSelector.tsx`, and `HotspotClusterMap.tsx`.

Work:

- Run existing `tests/live-integration.test.ts` against approved keys and controlled fixture images.
- Verify model availability, structured output, safety blocks, rate limits, timeouts, malformed responses, and fallback labels.
- Verify Maps JavaScript loader, Geocoding, geolocation permission denial, manual pin selection, API key restrictions, billing/quota alerts, and coordinate accuracy across target wards.
- Remove reliance on hard-coded landmark/ward fallbacks for production location decisions or explicitly label them as fallback-only.

Acceptance: live requests produce non-mock results, failures remain safe and clearly labeled, and Maps accuracy/reverse-geocoding evidence is recorded.

## P1 — Cross-module production workflows

Objective: prove one real workflow for each actor using persistent data.

Work:

- Citizen: login, classify, submit geo-tagged report, view only owned reports, submit feedback.
- Officer: view authorized queue, assign, update progress, upload evidence, certify/reject, inspect audit history.
- Administrator: access analytics and authorized governance functions.
- Verify reports propagate to hotspots and root-cause evidence with clear data freshness and no seeded fixture leakage.
- Verify duplicate submission strategy and concurrency/error recovery.

Acceptance: a recorded test script passes with non-mock Supabase data and external-integration evidence.

## P1 — Notification delivery

Objective: replace simulated status with actual provider receipts.

Evidence: `src/lib/cleanup/notification-service.ts` has a simulated `transportSend` function.

Work: select and configure approved provider(s); encrypt/limit recipient data; add provider error mapping, idempotency, webhook/receipt handling, opt-out requirements, and a test sandbox.

Acceptance: sandbox delivery plus failure/retry/receipt tests; production UI never reports simulated delivery as real delivery.

## P2 — UI, accessibility, and performance

Work:

- Run keyboard, focus-order, screen-reader, contrast, mobile viewport, zoom, and error-message audits on citizen, officer, and administrator workflows.
- Replace or justify raw `<img>` use where responsive sizing/performance matters; see `src/components/cleanup/*`, `src/components/civic/*`, and protected report pages.
- Add automated accessibility checks and performance budgets; test slow network, large image, offline, and reduced-motion cases.
- Measure production bundle/server response performance after live integrations are enabled.

Acceptance: documented WCAG target and test results for critical flows, tested mobile views, and agreed performance thresholds.

## P2 — Production deployment and operations

Work:

- Add an approved deployment configuration, environment-variable inventory, secret rotation policy, health checks, structured logs, error tracking, metrics, alerts, backups, recovery runbook, and CI gates.
- Replace deprecated `next lint` script with ESLint CLI as Next recommends.
- Establish dependency/vulnerability monitoring and release rollback procedure.

Acceptance: staging deployment passes security/integration checks; production release has monitoring, backup/restore evidence, and approval sign-off.

## P2 — Documentation and final acceptance

Work:

- Restore the original PRD, requirements traceability matrix, architecture document, schema/RLS specification, API contract, threat model, freeze records, and Git history.
- Produce a final acceptance script with evidence links, known limitations, mock-mode policy, and sign-off owners.

Acceptance: every PRD item is traceable to live evidence or explicitly deferred; project owner accepts the production readiness checklist.

## Remaining PRD-module conclusion

No additional functional module should be started before P0 and P1 are complete. The six named capabilities have implementation surfaces, but database-backed, externally integrated, secure production behavior has not been established.
