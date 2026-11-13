import { GET as getCivicReport } from "../src/app/api/civic/reports/[id]/route";
import { GET as getCivicReports } from "../src/app/api/civic/reports/route";
import {
  getServerIdentity,
  requireServerRole,
  setTestIdentityForRequest,
  assertMunicipalWardAccess,
  normalizeWardId,
  AuthenticationError,
} from "../src/lib/auth/server";
import { signDemoSession, verifyDemoSession } from "../src/lib/auth/demo-session";
import { requireMunicipalAuthority, ForbiddenError } from "../src/lib/cleanup/api-helper";

Reflect.set(process.env, "NODE_ENV", "test");

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`[PASS] ${message}`);
  } else {
    failed++;
    console.error(`[FAIL] ${message}`);
  }
}

function request(url: string, role: "citizen" | "municipal_officer" | "administrator" | null, id = "usr_citizen_001") {
  const req = new Request(url);
  setTestIdentityForRequest(req, role ? { id, name: "Test User", role, ward: "ward_04" } : null);
  return req;
}

async function run() {
  const anonymous = request("http://localhost/api/civic/reports/rep_seed_001", null);
  const anonymousResponse = await getCivicReport(anonymous, { params: Promise.resolve({ id: "rep_seed_001" }) });
  assert(anonymousResponse.status === 401, "Unauthenticated report detail request is rejected");

  const forged = new Request("http://localhost/api/civic/reports?view=officer", {
    headers: { "x-auth-role": "administrator", "x-auth-user-id": "forged-admin" },
  });
  const forgedIdentity = await getServerIdentity(forged);
  assert(forgedIdentity === null, "Client role and identity headers do not authenticate a request");
  const forgedListResponse = await getCivicReports(forged);
  assert(forgedListResponse.status === 401, "Client cannot elevate report-list scope with view=officer");

  const owner = request("http://localhost/api/civic/reports/rep_seed_001", "citizen", "usr_citizen_001");
  const ownerResponse = await getCivicReport(owner, { params: Promise.resolve({ id: "rep_seed_001" }) });
  assert(ownerResponse.status === 200, "Citizen can read their own private report");

  const otherCitizen = request("http://localhost/api/civic/reports/rep_seed_001", "citizen", "citizen-other");
  const otherResponse = await getCivicReport(otherCitizen, { params: Promise.resolve({ id: "rep_seed_001" }) });
  assert(otherResponse.status === 403, "Citizen cannot read another citizen's report");

  for (const role of ["municipal_officer", "administrator"] as const) {
    const municipal = request("http://localhost/api/civic/reports/rep_seed_001", role, `test-${role}`);
    const response = await getCivicReport(municipal, { params: Promise.resolve({ id: "rep_seed_001" }) });
    assert(response.status === 200, `${role} can read a private civic report`);
  }

  const mockCookie = new Request("http://localhost/api/civic/reports/rep_seed_001", {
    headers: { cookie: "ecowatch_auth_session=%7B%22user%22%3A%7B%22id%22%3A%22usr_admin_001%22%2C%22role%22%3A%22administrator%22%7D%7D" },
  });
  const priorNodeEnv = process.env.NODE_ENV;
  Reflect.set(process.env, "NODE_ENV", "production");
  const mockIdentity = await getServerIdentity(mockCookie);
  Reflect.set(process.env, "NODE_ENV", priorNodeEnv);
  assert(mockIdentity === null, "Unsigned mock cookie cannot authenticate in production");

  const claims = { sub: "citizen-1", name: "Test Citizen", role: "citizen" as const, exp: Math.floor(Date.now() / 1000) + 60 };
  const token = await signDemoSession(claims, "test-only-secret-that-is-long-enough-32");
  assert(Boolean(await verifyDemoSession(token, "test-only-secret-that-is-long-enough-32")), "Signed development session verifies");
  assert(await verifyDemoSession(`${token.slice(0, -1)}x`, "test-only-secret-that-is-long-enough-32") === null, "Tampered development session is rejected");

  const citizen = request("http://localhost/api/operations/gaps", "citizen", "citizen-1");
  let citizenForbidden = false;
  try {
    await requireServerRole(citizen, ["municipal_officer", "administrator"]);
  } catch (error: any) {
    citizenForbidden = error.status === 403;
  }
  assert(citizenForbidden, "Citizen is denied municipal-only operations");

  // 1. Expired development demo session is rejected
  const expiredClaims = { sub: "citizen-1", name: "Test Citizen", role: "citizen" as const, exp: Math.floor(Date.now() / 1000) - 10 };
  const expiredToken = await signDemoSession(expiredClaims, "test-only-secret-that-is-long-enough-32");
  assert(await verifyDemoSession(expiredToken, "test-only-secret-that-is-long-enough-32") === null, "Expired development session is rejected");

  // 2. Forged signing secret fails verification
  assert(await verifyDemoSession(token, "wrong-forged-secret-that-is-long-enough-32") === null, "Session signed with wrong secret is rejected");

  // 3. Citizen denied municipal cleanup triage and board operations
  let citizenCleanupForbidden = false;
  try {
    await requireMunicipalAuthority(citizen);
  } catch (err: any) {
    citizenCleanupForbidden = err instanceof ForbiddenError;
  }
  assert(citizenCleanupForbidden, "Citizen denied municipal cleanup authority (403)");

  // 4. Officer jurisdiction prevents cross-ward operations
  const officerW04 = { id: "officer-1", name: "Officer Bennett", role: "municipal_officer" as const, ward: "ward_04" };
  let crossWardBlocked = false;
  try {
    assertMunicipalWardAccess(officerW04, "ward_01");
  } catch (err: any) {
    crossWardBlocked = err instanceof AuthenticationError && err.status === 403;
  }
  assert(crossWardBlocked, "Cross-ward access is blocked for municipal officer (403)");

  // 5. Officer jurisdiction accepts normalized canonical matching ('Ward 04' == 'ward_04')
  let wardMatchAccepted = false;
  try {
    const formattedOfficer = { id: "officer-2", name: "Officer Bennett", role: "municipal_officer" as const, ward: "Ward 04 — Central Transit Corridor" };
    assertMunicipalWardAccess(formattedOfficer, "ward_04");
    wardMatchAccepted = true;
  } catch {
    wardMatchAccepted = false;
  }
  assert(wardMatchAccepted, "Ward access normalization accepts descriptive ward name for canonical target");

  // 6. Role escalation: citizen cannot authenticate as administrator
  let adminEscalationBlocked = false;
  try {
    await requireServerRole(citizen, ["administrator"]);
  } catch (err: any) {
    adminEscalationBlocked = err.status === 403;
  }
  assert(adminEscalationBlocked, "Role escalation: citizen denied administrator permission (403)");

  console.log(`TOTAL: ${passed + failed}; PASSED: ${passed}; FAILED: ${failed}`);
  if (failed) process.exitCode = 1;
}

void run();
