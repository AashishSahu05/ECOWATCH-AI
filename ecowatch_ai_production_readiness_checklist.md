# EcoWatch AI — Production Readiness Checklist

Status terms: PASS means verified in this audit; BLOCKED means evidence or dependency is absent; OPEN means work remains.

## Source and governance

- [BLOCKED] Canonical Git repository, complete history, current branch, code-owner review, and freeze records are available. Evidence: no `.git` directory.
- [BLOCKED] Original PRD and module acceptance criteria are available in the checkout.
- [OPEN] Create PRD-to-implementation traceability and final acceptance record.
- [PASS] This audit did not modify application source, schemas, dependencies, deployments, or credentials. The workspace already contained a local security-hardening change set when the audit began; no Git metadata exists to establish its provenance.

## Build and local quality

- [PASS] `npm run lint` succeeds with no lint warnings/errors.
- [PASS] `node_modules\\.bin\\tsc --noEmit --incremental false` succeeds.
- [OPEN] Replace deprecated `next lint` command with ESLint CLI.
- [PASS] Focused identity test `tests/api-identity-security.test.ts`: 11/11 passed using installed local runtime.
- [OPEN] `tests/analytics-security.test.ts` is red: ward fixture value `ward_04` conflicts with its expected display string containing `Ward 04`.
- [BLOCKED] Full regression runner: `tests/run-all-regressions.ts` uses `npx tsx`; `tsx` is not declared/installed and installation was outside audit scope.
- [NOT VERIFIED] Production build and deployed smoke tests.

## Authentication and authorization

- [PARTIALLY COMPLETE] Server identity uses `getClaims()` in `src/lib/auth/server.ts`; profile role resolution targets `profiles`.
- [PARTIALLY COMPLETE] Middleware uses claims/profile lookup in `src/middleware.ts`.
- [PASS] Focused local tests reject unauthenticated civic report access, client-controlled role headers, unsigned mock cookies, and cross-citizen report access.
- [BLOCKED] Live Supabase JWT validation, expired/revoked session behavior, and profile-RLS access tests.
- [BLOCKED] Authoritative roles and officer jurisdiction policy are documented and verified against live data.
- [OPEN] Confirm all mutation routes have CSRF strategy appropriate to their cookie/session model.

## Supabase, data, and storage

- [IMPLEMENTED BUT NOT LIVE] Supabase adapters exist across modules.
- [BLOCKED] Migration files/schema, RLS policies, storage policies, indexes, and backup/restore procedures are available for review.
- [BLOCKED] Persistent CRUD, cross-user isolation, officer/admin scope, media upload, and storage negative tests run against an approved test tenant.
- [OPEN] Remove or reconcile mock provenance returned by operations/analytics implementation paths before production UI uses them.

## External services

- [IMPLEMENTED BUT NOT LIVE] Gemini image and root-cause calls exist; fallback paths are explicit.
- [BLOCKED] Live Gemini calls, quota/error/safety tests, and structured-output evidence.
- [IMPLEMENTED BUT NOT LIVE] Google Maps JavaScript, browser location, map selection, and Geocoder paths exist.
- [BLOCKED] Maps API key restrictions, actual loader/Geocoder verification, quota monitoring, and geographic accuracy tests.
- [OPEN] Replace simulated notification transport in `src/lib/cleanup/notification-service.ts` with tested provider integration.

## Product workflows

- [IMPLEMENTED BUT NOT LIVE] Household segregation flow.
- [IMPLEMENTED BUT NOT LIVE] Geotagged civic reporting and municipal review flow.
- [PARTIALLY COMPLETE] Hotspot/analytics and collection-gap intelligence; mock data remains pervasive.
- [IMPLEMENTED BUT NOT LIVE] Root-cause assessment and officer review.
- [IMPLEMENTED BUT NOT LIVE] Cleanup assignment, evidence, certification, citizen tracking, and audit log.
- [BLOCKED] End-to-end persistent, multi-role workflow from citizen upload through officer-certified cleanup.

## UX, accessibility, and performance

- [PARTIALLY COMPLETE] Responsive pages/components and screenshot scripts exist.
- [NOT VERIFIED] Mobile real-device coverage, keyboard navigation, focus traps, screen-reader labels, semantic structure, contrast, reduced motion, and form-error accessibility.
- [OPEN] Audit raw images in cleanup/civic/report components for responsive image sizing and performance.
- [NOT VERIFIED] Production Web Vitals, server response targets, large-upload behavior, slow network, offline, and error recovery.

## Deployment and operations

- [NOT IMPLEMENTED] Deployment configuration/CI pipeline discovered in this checkout.
- [BLOCKED] Environment-specific secret inventory and rotation policy.
- [NOT IMPLEMENTED] Health checks, monitoring, alerting, central error reporting, SLOs, backup recovery runbook, and incident response runbook.
- [OPEN] Staging approval, security review, privacy/data retention review, and go-live sign-off.

## Release gate

Do not deploy until every BLOCKED/OPEN item in Authentication, Supabase, External Services, and Product Workflows has either passed or been explicitly accepted by the project owner as a documented non-production limitation.
