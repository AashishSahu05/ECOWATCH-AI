/**
 * EcoWatch AI — Module 04 Phase 04.03
 * Analytics Security & RBAC Enforcement Test Suite
 */

import {
  requireMunicipalAuthority,
  scopeAnalyticsWard,
  analyticsErrorResponse,
  ForbiddenError,
  UnauthorizedError,
} from "../src/lib/analytics/api-helper";
import { setTestIdentityForRequest, normalizeWardId, assertMunicipalWardAccess } from "../src/lib/auth/server";

Reflect.set(process.env, "NODE_ENV", "test");

let passedCount = 0;
let failedCount = 0;

function request(role: "citizen" | "municipal_officer" | "administrator" | null, id = "test-user") {
  const req = new Request("http://localhost:3000/api/analytics/kpi");
  setTestIdentityForRequest(req, role ? { id, name: "Test User", role, ward: "ward_04" } : null);
  return req;
}

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failedCount++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runSecurityTests() {
  console.log("==========================================================");
  console.log("  ECOWATCH AI — MODULE 04 PHASE 04.03 SECURITY SUITE      ");
  console.log("==========================================================\n");

  // --- SUITE 1: RBAC Role-Based Access Control ---
  console.log("--- SUITE 1: RBAC Role-Based Access Control ---");
  {
    // 1. Citizen Role: Must be rejected with ForbiddenError (403)
    const citizenReq = request("citizen", "citizen-1");

    let citizenBlocked = false;
    let thrownError: any = null;
    try {
      await requireMunicipalAuthority(citizenReq);
    } catch (err) {
      citizenBlocked = true;
      thrownError = err;
    }
    assert(citizenBlocked, "Citizen role access to analytics is blocked");
    assert(thrownError instanceof ForbiddenError, "Throws ForbiddenError for citizen role");

    const forbiddenResponse = analyticsErrorResponse(thrownError);
    assert(forbiddenResponse.status === 403, "ForbiddenError generates HTTP 403 response");

    // 2. Municipal Officer Role: Must be permitted
    const officerReq = request("municipal_officer", "officer-1");
    const officerUser = await requireMunicipalAuthority(officerReq);
    assert(officerUser.role === "municipal_officer", "Municipal officer role is granted access");
    assert(officerUser.id.length > 0, "Officer has valid identity ID");

    // 3. Administrator Role: Must be permitted
    const adminReq = request("administrator", "admin-1");
    const adminUser = await requireMunicipalAuthority(adminReq);
    assert(adminUser.role === "administrator", "Administrator role is granted access");

    // 4. Explicit Unauthenticated Session: Must be rejected with UnauthorizedError (401)
    const unauthReq = request(null);
    let unauthBlocked = false;
    let unauthErr: any = null;
    try {
      await requireMunicipalAuthority(unauthReq);
    } catch (err) {
      unauthBlocked = true;
      unauthErr = err;
    }
    assert(unauthBlocked, "Unauthenticated request is blocked");
    assert(unauthErr instanceof UnauthorizedError, "Throws UnauthorizedError");

    const unauthResponse = analyticsErrorResponse(unauthErr);
    assert(unauthResponse.status === 401, "UnauthorizedError generates HTTP 401 response");
  }

  // --- SUITE 2: Ward-Level Scoping & Boundaries (Ward 04 vs ward_04 Normalization) ---
  console.log("\n--- SUITE 2: Ward-Level Scoping & Boundaries (Ward 04 vs ward_04 Normalization) ---");
  {
    // 1. Direct identity resolution
    const officerReq = request("municipal_officer", "officer-1");
    const user = await requireMunicipalAuthority(officerReq);
    assert(user.ward === "ward_04", "Officer jurisdiction resolves to assigned ward_04");

    // 2. Canonical normalization bridges formatting disparities
    assert(normalizeWardId("ward_04") === "ward_04", "normalizeWardId canonicalizes 'ward_04'");
    assert(normalizeWardId("Ward 04") === "ward_04", "normalizeWardId bridges 'Ward 04' to 'ward_04'");
    assert(normalizeWardId("Ward 04 — Central Transit Corridor") === "ward_04", "normalizeWardId parses descriptive ward names");
    assert(normalizeWardId("Ward 4") === "ward_04", "normalizeWardId normalizes single digit 'Ward 4'");

    // 3. scopeAnalyticsWard permits 'Ward 04' identity requesting 'ward_04'
    const ward04Officer = { id: "officer-formatted", name: "Officer Bennett", role: "municipal_officer" as const, ward: "Ward 04" };
    const scopedWard = scopeAnalyticsWard(ward04Officer, "ward_04");
    assert(scopedWard === "ward_04", "scopeAnalyticsWard resolves 'Ward 04' identity against 'ward_04' query");

    // 4. scopeAnalyticsWard permits 'ward_04' identity requesting 'Ward 04'
    const canonicalOfficer = { id: "officer-canonical", name: "Officer Bennett", role: "municipal_officer" as const, ward: "ward_04" };
    const scopedWardReverse = scopeAnalyticsWard(canonicalOfficer, "Ward 04");
    assert(scopedWardReverse === "ward_04", "scopeAnalyticsWard resolves 'ward_04' identity against 'Ward 04' query");

    // 5. Cross-ward boundary enforcement blocks unauthorized access
    let crossWardBlocked = false;
    try {
      scopeAnalyticsWard(ward04Officer, "ward_01");
    } catch (err) {
      crossWardBlocked = err instanceof ForbiddenError;
    }
    assert(crossWardBlocked, "Cross-ward access to ward_01 is blocked for Ward 04 officer (403)");

    // 6. assertMunicipalWardAccess accepts normalized matching ward
    let accessGranted = false;
    try {
      assertMunicipalWardAccess(ward04Officer, "ward_04");
      accessGranted = true;
    } catch {
      accessGranted = false;
    }
    assert(accessGranted, "assertMunicipalWardAccess validates 'Ward 04' identity for 'ward_04' target");
  }

  // --- SUITE 3: Phase 04.04 Endpoints RBAC Verification ---
  console.log("\n--- SUITE 3: Phase 04.04 Endpoints RBAC Verification ---");
  {
    const citizenRecsReq = request("citizen", "citizen-1");
    let recsBlocked = false;
    try {
      await requireMunicipalAuthority(citizenRecsReq);
    } catch {
      recsBlocked = true;
    }
    assert(recsBlocked, "Citizen access to /api/analytics/recommendations is blocked (403)");

    const citizenExportReq = request("citizen", "citizen-1");
    let exportBlocked = false;
    try {
      await requireMunicipalAuthority(citizenExportReq);
    } catch {
      exportBlocked = true;
    }
    assert(exportBlocked, "Citizen access to /api/analytics/reports/export is blocked (403)");
  }

  console.log("\n==========================================================");
  console.log(`TOTAL SECURITY TESTS: ${passedCount + failedCount}`);
  console.log(`PASSED:               ${passedCount}`);
  console.log(`FAILED:               ${failedCount}`);
  console.log("==========================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error("Security test failed:", err);
  process.exit(1);
});

