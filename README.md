# EcoWatch AI — Smart Environmental & Waste Intelligence Platform

[![Build Status](https://img.shields.io/badge/Build-Passing-1B4332?style=flat-square&logo=next.js)](file:///d:/ECO%20WATCH%20AI)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-3.5%20%2F%202.5%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![Google Maps](https://img.shields.io/badge/Google%20Maps-Platform-34A853?style=flat-square&logo=googlemaps)](https://developers.google.com/maps)
[![Tests](https://img.shields.io/badge/Tests-624%20Passing%20(18%20Suites)-success?style=flat-square)](file:///d:/ECO%20WATCH%20AI)

> **Google Startup Buildathon Official Platform Entry**  
> An enterprise-grade, preventive, predictive, and closed-loop municipal solid waste intelligence platform built with Next.js App Router, Google Gemini Multimodal Vision, Google Maps Platform, and a resilient Dual-Adapter Architecture.

---

## 1. System Architecture Overview

EcoWatch AI bridges household waste segregation with city-scale municipal cleanup operations. Rather than merely reacting to illegal dumping sites, the platform combines predictive hotspot analytics, root-cause diagnosis, and verified photographic remediation.

```
                              ┌─────────────────────────────────────────┐
                              │            ECOWATCH AI CLIENT           │
                              │   (Next.js 15 App Router + React 19)    │
                              └────────────────────┬────────────────────┘
                                                   │
                   ┌───────────────────────────────┼───────────────────────────────┐
                   ▼                               ▼                               ▼
       ┌───────────────────────┐       ┌───────────────────────┐       ┌───────────────────────┐
       │   Citizen Dashboard   │       │   Municipal Officer   │       │  System Administrator │
       │  - AI Segregation     │       │  - Triage & Kanban    │       │  - Citywide Analytics │
       │  - Dumping Reporting  │       │  - Squad Dispatch     │       │  - SLA Compliance     │
       │  - Milestone Tracking │       │  - Photo Verification │       │  - Fleet Rebalancing  │
       └───────────┬───────────┘       └───────────┬───────────┘       └───────────┬───────────┘
                   │                               │                               │
                   └───────────────────────────────┼───────────────────────────────┘
                                                   │ Server-Side RBAC Guard
                                                   ▼
                              ┌─────────────────────────────────────────┐
                              │           NEXT.JS API ENGINE            │
                              │   (Strict RBAC, Zod Validation, Auth)   │
                              └────────────────────┬────────────────────┘
                                                   │
         ┌────────────────────────┬────────────────┼────────────────────────┬────────────────────────┐
         ▼                        ▼                ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐  ┌──────────────────┐   ┌─────────────────────┐   ┌──────────────────┐
│  Gemini AI Core  │    │ Google Maps API  │  │ Notification Svc │   │ Mock Adapter Layer  │   │ Supabase Adapter │
│ - Waste Vision   │    │ - Geocoding      │  │ - SMS Gateway    │   │ (In-Memory/Local)   │   │ (PostGIS DB)     │
│ - Civic Vision   │    │ - Cluster Maps   │  │ - WhatsApp Biz   │   │ *ACTIVE FOR DEMO*   │   │ *PENDING HANDOVER│
│ - Root Cause Syn │    │ - Ward Routing   │  │ - Backoff Retry  │   │ *ZERO LEAKAGE*      │   │  EXCLUDED NOW*   │
└──────────────────┘    └──────────────────┘  └──────────────────┘   └─────────────────────┘   └──────────────────┘
```

### Core Design Principles
1. **Dual-Adapter Pattern**: Abstracted repository interfaces (`AuthAdapter`, `SegregationAdapter`, `CivicReportAdapter`, `OperationsAdapter`, `CivicCleanupAdapter`) allow seamless toggling between isolated in-memory mock fixtures and live Supabase PostGIS instances without leaking infrastructure logic into UI components.
2. **Strict Server-Side RBAC**: Role authorization is executed server-side on every protected API endpoint (`citizen`, `municipal_officer`, `administrator`). Client-controlled headers are strictly rejected; unsigned cookies are blocked in production.
3. **Ward Jurisdiction Boundary**: Municipal officers are restricted to their assigned territorial wards (`ward_01` through `ward_05`) with canonical format normalization bridging `"Ward 04"`, `"ward_04"`, and descriptive designations.
4. **Mandatory Human-in-the-Loop Certification**: Consequential municipal actions (closing civic reports, dispatching heavy fleet, certifying remediation) require authorized officer sign-off and cannot be auto-certified by AI perception models.

---

## 2. Completed Modules Matrix (Modules 00–06)

| Module | Name | Key Capabilities | Status |
| :--- | :--- | :--- | :--- |
| **Module 00** | **Public Website & Brand** | Responsive 10-section landing page, design tokens (Forest Green, Leaf Green, Soft Sage), WCAG AA typography (`Manrope`, `Inter`). | **COMPLETE & FROZEN** |
| **Module 01** | **Authentication & RBAC** | Multi-role authentication (Citizen, Officer, Admin), secure session handling, middleware route gating, mock/Supabase dual auth adapter. | **COMPLETE & FROZEN** |
| **Module 02** | **AI Waste Segregation** | Multimodal Gemini Vision (`@google/genai`), 4-stream classification (Wet, Dry, Recyclable, Hazardous), bounding boxes, confidence scoring, contamination warnings. | **COMPLETE & FROZEN** |
| **Module 03** | **AI Civic Dumping Reporting** | Geotagged citizen dumping reports, image validation, reverse geocoding via Google Maps Platform, structured severity estimation. | **COMPLETE & FROZEN** |
| **Module 04** | **Hotspot Predictor & Analytics** | Spatial-temporal incident clustering, DBSCAN-inspired grouping, SLA breach prediction, ward-level telemetry, CSV export. | **COMPLETE & FROZEN** |
| **Module 05** | **Collection Gap & Root Cause Intelligence** | Receptacle saturation telemetry, collection schedule gap detection, multivariate correlation analysis, Gemini root-cause hypothesis synthesis. | **COMPLETE & FROZEN** |
| **Module 06** | **Civic Response & Cleanup Tracker** | Municipal Kanban command board (`/officer/cleanup`), squad/vehicle assignment, before-and-after photo comparison, GPS proximity checks, weighbridge triage, mandatory officer certification gate, citizen tracking timeline. | **COMPLETE & FROZEN** |

---

## 3. Technology Stack

- **Framework**: [Next.js 15.5](https://nextjs.org/) (App Router, Server Actions, Route Handlers)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) (Strict typing, no implicit `any`)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/) + Custom EcoWatch Token Palette
- **AI / Multimodal Vision**: [Google GenAI SDK](https://www.npmjs.com/package/@google/genai) (`gemini-2.5-flash` / `gemini-3.5-flash-lite`)
- **Mapping & Geocoding**: [Google Maps Platform](https://developers.google.com/maps) (Maps JS API, Geocoding API)
- **Validation**: [Zod 4.6](https://zod.dev/) (Strict runtime schema validation on all inputs/outputs)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: [TSX](https://github.com/privatenumber/tsx) (Fast TypeScript test runner)

---

## 4. Getting Started & Installation

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Git**

### Installation Steps
```bash
# 1. Clone repository
git clone https://github.com/your-org/ecowatch-ai.git
cd ecowatch-ai

# 2. Install declared dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
```

### Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

### Pre-Configured Demo Credentials
For testing in Demo/Staging Mode (`NEXT_PUBLIC_ECOWATCH_ENABLE_DEMO_AUTH=true`):
- **Citizen Account**: `citizen@ecowatch.ai` / `Demo@123`
- **Municipal Officer Account**: `officer@ecowatch.ai` / `Demo@123` (Assigned to Ward 04)
- **Administrator Account**: `admin@ecowatch.ai` / `Demo@123` (Citywide Scope)

---

## 5. Environment Configuration (.env.local)

See [.env.example](file:///d:/ECO%20WATCH%20AI/.env.example) for the full documented template.

```ini
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL_ID=gemini-2.5-flash

# Google Maps Platform
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_optional_map_id_here

# Demo Authentication (HMAC-SHA256 Signed Session)
NEXT_PUBLIC_ECOWATCH_ENABLE_DEMO_AUTH=true
ECOWATCH_DEMO_AUTH_SECRET=your_32_character_demo_auth_secret_minimum_length_here

# Supabase (EXCLUDED IN CURRENT MILESTONE - KEEP UNSET)
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=
```

---

## 6. Automated Testing & Verification Suite

EcoWatch AI maintains an exhaustive regression and integration test harness covering 18 test suites and 624 verified automated tests.

### Run All Regression Suites
```bash
npm test
```
*Executes all 18 test suites using local project dependencies (`tsx`) with reproducible exit codes.*

### Run Security & RBAC Isolation Tests
```bash
npm run test:security
```
*Verifies cookie anti-forgery, client header tampering rejection, citizen data isolation, officer ward boundary checks, and role escalation guards.*

### Run Live Gemini & Google Maps Integration Test
```bash
npx tsx tests/live-integration.test.ts
```
*Performs actual live API calls against Google Gemini and Google Maps Platform to verify end-to-end cloud latency, response structure, and graceful offline fallbacks.*

### TypeScript Compilation & Linting
```bash
# Typecheck
npx tsc --noEmit

# ESLint
npm run lint

# Production Build
npm run build
```

---

## 7. REST API Catalog (42 Route Handlers)

### Analytics Engine (Module 04)
- `GET /api/analytics/kpi`: Ward-level and citywide operational KPIs.
- `GET /api/analytics/hotspots`: Incident clusters with spatial radius filtering.
- `GET /api/analytics/materials`: Waste stream material breakdown.
- `GET /api/analytics/trends`: Temporal complaint volume and resolution trends.
- `GET /api/analytics/sla`: SLA compliance metrics and breach warnings.
- `GET /api/analytics/wards`: Comparative ward cleanliness indicators.
- `GET /api/analytics/recommendations`: Algorithmic fleet and resource optimization.
- `GET /api/analytics/reports/export`: CSV export for municipal record-keeping.

### Civic Reporting Engine (Module 03)
- `GET /api/civic/reports`: Paginated civic reports with citizen ownership filtering.
- `POST /api/civic/reports/analyze`: Gemini vision perception for civic dumping photos.
- `GET /api/civic/reports/[id]`: Incident detail with access authorization.
- `POST /api/civic/reports/[id]/assign`: Squad dispatch and target SLA assignment.
- `POST /api/civic/reports/[id]/evidence`: Additional photo evidence submission.
- `POST /api/civic/reports/[id]/feedback`: Citizen resolution rating and feedback.
- `PATCH /api/civic/reports/[id]/status`: Lifecycle status transition.

### Civic Response & Remediation Tracker (Module 06)
- `GET /api/civic/response/board`: Municipal Kanban command board ticket aggregation.
- `GET /api/civic/response/[id]`: Unified cleanup ticket and weighbridge telemetry.
- `POST /api/civic/response/[id]/assign`: Sanitation squad and vehicle assignment.
- `POST /api/civic/response/[id]/progress`: Crew arrival and on-site remediation tracking.
- `POST /api/civic/response/[id]/complete`: Clearance proof with GPS validation and tonnage.
- `POST /api/civic/response/[id]/certify`: Mandatory officer verification gate.
- `GET /api/civic/response/[id]/tracking`: Citizen 6-milestone remediation journey.
- `POST /api/civic/response/[id]/feedback`: Post-cleanup citizen rating.
- `GET /api/civic/response/[id]/audit`: Append-only tamper-evident audit ledger.

### Operations & Root Cause Intelligence (Module 05)
- `GET /api/operations/squads`: Sanitation squad fleet rosters and live assignments.
- `GET /api/operations/receptacles`: Smart bin fill telemetry and overflow alerts.
- `GET /api/operations/gaps`: Unserviced collection corridor detection.
- `GET /api/operations/root-causes`: Identified systemic dumping hypotheses.
- `POST /api/operations/root-causes/analyze`: Gemini root cause synthesis.
- `POST /api/operations/root-causes/[id]/review`: Officer review and intervention plan.
- `GET /api/operations/routes`: Optimized route manifests.
- `GET /api/operations/correlations`: Spatial correlation between gaps and dumping.
- `POST /api/operations/notifications/dispatch`: Multi-channel notification gateway.

### AI Waste Segregation (Module 02)
- `POST /api/segregation/analyze`: Multimodal Gemini waste image classification.
- `POST /api/segregation/correct`: Citizen correction and classification feedback.
- `GET /api/segregation/[id]`: Historical segregation scan lookup.

### Authentication & Session Management (Module 01)
- `POST /api/auth/demo-session`: Cryptographic HMAC session minting (Staging only).
- `GET /api/auth/demo-session`: Active session claim retrieval.
- `POST /api/auth/logout`: Clear session cookies.
- `GET /api/auth/callback`: Supabase OAuth callback handler.

---

## 8. Database Integration Handover (Status & Contract)

> [!IMPORTANT]
> **Supabase database integration is EXCLUDED from the current milestone.**  
> The application currently operates with 100% test coverage using the high-fidelity `MockAdapter` implementations.

### Handover Preparation for Member 3
1. **Zero Schema Collisions**: No custom SQL migrations were created in this phase. The project strictly preserves the contract defined in `ecowatch_ai_database_contract.md`.
2. **Adapter Boundary**: Supabase adapters (`SupabaseCivicReportAdapter`, `SupabaseOperationsAdapter`, `SupabaseCivicCleanupAdapter`) are scaffolded and map 1-to-1 with PostgreSQL tables (`civic_reports`, `sanitation_squads`, `response_tickets`, `audit_ledger`).
3. **Activation Steps**:
   - Apply Member 3 official SQL migration scripts to your Supabase PostgreSQL instance.
   - Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
   - The platform will automatically transition from `MockAdapter` to `SupabaseAdapter` without code changes.

---

## 9. Security & Production Hardening

- **No Secrets in Source Control**: Verified via automated AST and entropy secret scanning (`scripts/scan-secrets.py`).
- **CSRF & Cookie Protection**: Session cookies use `HttpOnly`, `SameSite=Lax`, and `Secure` (in HTTPS/production).
- **Rate Limiting**: Sliding window rate limiter applied to expensive AI vision endpoints (10 requests/minute/user).
- **Buffer Sanitization**: Uploaded image buffers undergo strict magic byte verification (`image/jpeg`, `image/png`, `image/webp`) and size clamping (5MB limit) before memory processing.
- **Fail-Safe Error Boundaries**: API errors return sanitized error messages with specific HTTP status codes without leaking stack traces or internal environment variables.

---

## 10. License & Credits

Built for the **Google Startup Buildathon**.  
Copyright © 2026 EcoWatch AI Team. All rights reserved.
