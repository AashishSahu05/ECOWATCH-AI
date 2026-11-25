import assert from "node:assert/strict";
import { signDemoSession, getDemoAuthSecret, DEMO_SESSION_COOKIE } from "../src/lib/auth/demo-session";
import { GET as listReports, POST as createReport } from "../src/app/api/civic/reports/route";
import { GET as getReport } from "../src/app/api/civic/reports/[id]/route";
import { POST as updateStatus } from "../src/app/api/civic/reports/[id]/status/route";
import { POST as assignReport } from "../src/app/api/civic/reports/[id]/assign/route";
import { POST as uploadEvidence } from "../src/app/api/civic/reports/[id]/evidence/route";
import { POST as escalateReport } from "../src/app/api/civic/reports/[id]/escalate/route";
import { GET as getAccountability, PATCH as updateSla } from "../src/app/api/admin/accountability/route";
import { GET as getGovernance, POST as postGovernance, PATCH as patchGovernance } from "../src/app/api/admin/governance/route";
import { POST as runCronEscalate } from "../src/app/api/cron/escalate/route";

async function makeSessionCookie(claims: { sub: string; name: string; email: string; role: "citizen" | "municipal_officer" | "administrator"; ward?: string }) {
  const secret = getDemoAuthSecret()!;
  const token = await signDemoSession(
    {
      ...claims,
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    secret
  );
  return `${DEMO_SESSION_COOKIE}=${token}`;
}

function makeReq(url: string, method: string, cookie: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: {
      cookie,
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

async function run() {
  console.log("==========================================================");
  console.log("  NAGARDRISHTI AI — OFFICER & ADMIN WORKFLOW TEST SUITE   ");
  console.log("==========================================================");

  let passed = 0;
  const check = (name: string, cond: boolean, detail?: string) => {
    assert.ok(cond, name + (detail ? ` (${detail})` : ""));
    passed++;
    console.log(`[PASS] ${name}${detail ? ` -> ${detail}` : ""}`);
  };

  const citizenCookie = await makeSessionCookie({
    sub: "usr_test_citizen",
    name: "Test Citizen",
    email: "test-citizen@example.invalid",
    role: "citizen",
  });
  const officerW4Cookie = await makeSessionCookie({
    sub: "usr_test_officer_w4",
    name: "Test Officer W4",
    email: "test-officer-w4@example.invalid",
    role: "municipal_officer",
    ward: "Ward 04 — South Lake District",
  });
  const officerW9Cookie = await makeSessionCookie({
    sub: "usr_test_officer_w9",
    name: "Test Officer W9",
    email: "test-officer-w9@example.invalid",
    role: "municipal_officer",
    ward: "Ward 09 — Test Corridor",
  });
  const adminCookie = await makeSessionCookie({
    sub: "usr_test_admin",
    name: "Test Administrator",
    email: "test-admin@example.invalid",
    role: "administrator",
  });

  // 1. Create an isolated test report in Ward 04 as Test Citizen
  const createRes = await createReport(
    makeReq("http://localhost/api/civic/reports", "POST", citizenCookie, {
      categoryId: "cat_dumping",
      title: "Test Isolated Illegal Dumping Report",
      description: "Isolated test fixture report for Officer and Admin workflow verification.",
      location: {
        latitude: 12.9352,
        longitude: 77.6245,
        formattedAddress: "Test Street, Ward 04",
        serviceAreaId: "ward_04",
      },
      media: [
        {
          publicUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800",
          mediaType: "image/jpeg",
          fileSizeBytes: 12345,
          isPrimary: true,
        },
      ],
      isAnonymous: false,
    })
  );
  check("Citizen creates isolated test report", createRes.status === 201, `HTTP ${createRes.status}`);
  const createdReport = await createRes.json();
  const reportId = createdReport.id;

  // 2. Officer Ward 04 can list, view, update status, assign, upload evidence, and escalate
  const listW4 = await listReports(makeReq("http://localhost/api/civic/reports?view=officer", "GET", officerW4Cookie));
  check("Officer W4 lists Ward 04 reports", listW4.status === 200);

  const crossList = await listReports(makeReq("http://localhost/api/civic/reports?ward=ward_01", "GET", officerW4Cookie));
  check("Officer W4 blocked from querying Ward 01 reports", crossList.status === 403, `HTTP ${crossList.status}`);

  const detailW4 = await getReport(makeReq(`http://localhost/api/civic/reports/${reportId}`, "GET", officerW4Cookie), {
    params: Promise.resolve({ id: reportId }),
  });
  check("Officer W4 views Ward 04 complaint detail", detailW4.status === 200);

  const detailW9 = await getReport(makeReq(`http://localhost/api/civic/reports/${reportId}`, "GET", officerW9Cookie), {
    params: Promise.resolve({ id: reportId }),
  });
  check("Officer W9 blocked from viewing Ward 04 complaint detail", detailW9.status === 403, `HTTP ${detailW9.status}`);

  const statusW9 = await updateStatus(
    makeReq(`http://localhost/api/civic/reports/${reportId}/status`, "POST", officerW9Cookie, {
      newStatus: "verified",
      remarks: "Unauthorized cross-ward attempt",
    }),
    { params: Promise.resolve({ id: reportId }) }
  );
  check("Officer W9 blocked from updating Ward 04 complaint status", statusW9.status === 403, `HTTP ${statusW9.status}`);

  const statusW4 = await updateStatus(
    makeReq(`http://localhost/api/civic/reports/${reportId}/status`, "POST", officerW4Cookie, {
      newStatus: "verified",
      remarks: "Verified by Ward 04 officer",
      officialSeverity: "high",
    }),
    { params: Promise.resolve({ id: reportId }) }
  );
  check("Officer W4 updates complaint status to verified", statusW4.status === 200);

  const assignRes = await assignReport(
    makeReq(`http://localhost/api/civic/reports/${reportId}/assign`, "POST", officerW4Cookie, {
      assignedToTeam: "Ward 04 Rapid Clean Squad A",
      officerInChargeId: "usr_test_officer_w4",
      officerInChargeName: "Test Officer W4",
      specialInstructions: "Clear debris within SLA window",
    }),
    { params: Promise.resolve({ id: reportId }) }
  );
  check("Officer W4 assigns squad and sets server-side SLA deadline", assignRes.status === 200);
  const assignedJson = await assignRes.json();
  check("Assigned report includes slaDeadline", Boolean(assignedJson.slaDeadline));

  const escRes = await escalateReport(
    makeReq(`http://localhost/api/civic/reports/${reportId}/escalate`, "POST", officerW4Cookie, {
      targetLevel: 2,
      reason: "Test manual escalation to Senior Municipal Officer",
    }),
    { params: Promise.resolve({ id: reportId }) }
  );
  check("Officer W4 escalates complaint to Level 2", escRes.status === 200);

  const evRes = await uploadEvidence(
    makeReq(`http://localhost/api/civic/reports/${reportId}/evidence`, "POST", officerW4Cookie, {
      resolutionNotes: "Cleared all illegal waste bags and sanitized perimeter.",
      beforePhotographUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800",
      afterPhotographUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800",
    }),
    { params: Promise.resolve({ id: reportId }) }
  );
  check("Officer W4 uploads before/after cleanup evidence and resolves", evRes.status === 200);

  // 3. RBAC: Officer & Citizen blocked from Admin APIs
  const offAcc = await getAccountability(makeReq("http://localhost/api/admin/accountability", "GET", officerW4Cookie));
  check("Officer blocked from /api/admin/accountability", offAcc.status === 403, `HTTP ${offAcc.status}`);

  const offGov = await getGovernance(makeReq("http://localhost/api/admin/governance", "GET", officerW4Cookie));
  check("Officer blocked from /api/admin/governance", offGov.status === 403, `HTTP ${offGov.status}`);

  // 4. Admin CRUD: Governance, Wards, Officers, Reassignment, SLA, Cron Escalation
  const admGov = await getGovernance(makeReq("http://localhost/api/admin/governance", "GET", adminCookie));
  check("Admin fetches governance registry", admGov.status === 200);

  const createWardRes = await postGovernance(
    makeReq("http://localhost/api/admin/governance", "POST", adminCookie, {
      action: "create_ward",
      name: "Ward 99 — Test Zone",
      code: "W-99",
    })
  );
  check("Admin creates new ward", createWardRes.status === 201);
  const newWard = (await createWardRes.json()).ward;

  const updateWardRes = await patchGovernance(
    makeReq("http://localhost/api/admin/governance", "PATCH", adminCookie, {
      action: "update_ward",
      id: newWard.id,
      isActive: false,
    })
  );
  check("Admin updates ward active state", updateWardRes.status === 200);

  const createOffRes = await postGovernance(
    makeReq("http://localhost/api/admin/governance", "POST", adminCookie, {
      action: "create_officer",
      fullName: "Test New Officer",
      email: "new-officer-test@example.invalid",
      ward: "Ward 99 — Test Zone",
    })
  );
  check("Admin creates new municipal officer", createOffRes.status === 201);
  const newOfficer = (await createOffRes.json()).officer;

  const assignWardRes = await patchGovernance(
    makeReq("http://localhost/api/admin/governance", "PATCH", adminCookie, {
      action: "assign_officer_ward",
      officerId: newOfficer.id,
      ward: "Ward 04 — South Lake District",
    })
  );
  check("Admin assigns officer to Ward 04", assignWardRes.status === 200);

  const slaRes = await updateSla(
    makeReq("http://localhost/api/admin/accountability", "PATCH", adminCookie, {
      slaHours: 14,
    })
  );
  check("Admin configures SLA window (14h)", slaRes.status === 200);

  const cronRes = await runCronEscalate(makeReq("http://localhost/api/cron/escalate", "POST", adminCookie));
  check("Admin triggers SLA escalation batch check", cronRes.status === 200);

  console.log("==========================================================");
  console.log(`TOTAL CHECKS: ${passed}; PASSED: ${passed}; FAILED: 0`);
  console.log("==========================================================");
}

run().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
