// Module 01 Automated QA & Security Verification Test Suite
// Executes functional adapter checks and live HTTP RBAC route checks

const http = require("http");

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `http://localhost:3000${path}`,
      {
        method: options.method || "GET",
        headers: options.headers || {},
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
          });
        });
      }
    );
    req.on("error", reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

function createSessionCookie(role, email, fullName, ward) {
  const session = {
    accessToken: `audit_jwt_${role}_${Date.now()}`,
    expiresAt: Date.now() + 864e5,
    user: {
      id: `usr_${role}_test`,
      email,
      fullName,
      role,
      ward: ward || undefined,
      createdAt: new Date().toISOString(),
    },
  };
  return `ecowatch_auth_session=${encodeURIComponent(JSON.stringify(session))}; Path=/; HttpOnly`;
}

async function runTests() {
  console.log("=================================================");
  console.log("   ECOWATCH AI — MODULE 01 AUTOMATED QA SUITE    ");
  console.log("=================================================\n");

  const results = [];

  function record(testName, passed, details) {
    results.push({ testName, passed, details });
    const status = passed ? "[PASS]" : "[FAIL]";
    console.log(`${status} ${testName}`);
    if (details) console.log(`       -> ${details}`);
  }

  // --- SUITE 1: UNAUTHENTICATED ROUTE ACCESS ---
  console.log("\n--- SUITE 1: Unauthenticated Protected Route Access ---");

  const citizenUnauth = await request("/citizen/dashboard");
  record(
    "Unauthenticated access to /citizen/dashboard redirects to /login",
    citizenUnauth.statusCode === 307 &&
      citizenUnauth.headers.location.includes("/login?redirect=%2Fcitizen%2Fdashboard"),
    `Status: ${citizenUnauth.statusCode}, Location: ${citizenUnauth.headers.location}`
  );

  const officerUnauth = await request("/officer/dashboard");
  record(
    "Unauthenticated access to /officer/dashboard redirects to /login",
    officerUnauth.statusCode === 307 &&
      officerUnauth.headers.location.includes("/login?redirect=%2Fofficer%2Fdashboard"),
    `Status: ${officerUnauth.statusCode}, Location: ${officerUnauth.headers.location}`
  );

  const adminUnauth = await request("/admin/dashboard");
  record(
    "Unauthenticated access to /admin/dashboard redirects to /login",
    adminUnauth.statusCode === 307 &&
      adminUnauth.headers.location.includes("/login?redirect=%2Fadmin%2Fdashboard"),
    `Status: ${adminUnauth.statusCode}, Location: ${adminUnauth.headers.location}`
  );

  const profileUnauth = await request("/profile");
  record(
    "Unauthenticated access to /profile redirects to /login",
    profileUnauth.statusCode === 307 &&
      profileUnauth.headers.location.includes("/login?redirect=%2Fprofile"),
    `Status: ${profileUnauth.statusCode}, Location: ${profileUnauth.headers.location}`
  );

  // --- SUITE 2: CITIZEN RBAC & ESCALATION ATTEMPTS ---
  console.log("\n--- SUITE 2: Citizen RBAC & Privilege Escalation Defenses ---");
  const citizenCookie = createSessionCookie("citizen", "citizen@ecowatch.ai", "Maya Lin");

  const citizenAccessOwn = await request("/citizen/dashboard", {
    headers: { Cookie: citizenCookie },
  });
  record(
    "Citizen accessing own /citizen/dashboard returns HTTP 200",
    citizenAccessOwn.statusCode === 200,
    `Status: ${citizenAccessOwn.statusCode}`
  );

  const citizenAccessOfficer = await request("/officer/dashboard", {
    headers: { Cookie: citizenCookie },
  });
  record(
    "Citizen attempting to access /officer/dashboard redirects to /unauthorized",
    citizenAccessOfficer.statusCode === 307 &&
      citizenAccessOfficer.headers.location.includes("/unauthorized"),
    `Status: ${citizenAccessOfficer.statusCode}, Location: ${citizenAccessOfficer.headers.location}`
  );

  const citizenAccessAdmin = await request("/admin/dashboard", {
    headers: { Cookie: citizenCookie },
  });
  record(
    "Citizen attempting to access /admin/dashboard redirects to /unauthorized",
    citizenAccessAdmin.statusCode === 307 &&
      citizenAccessAdmin.headers.location.includes("/unauthorized"),
    `Status: ${citizenAccessAdmin.statusCode}, Location: ${citizenAccessAdmin.headers.location}`
  );

  const citizenAccessLogin = await request("/login", {
    headers: { Cookie: citizenCookie },
  });
  record(
    "Authenticated Citizen visiting /login redirects to /citizen/dashboard",
    citizenAccessLogin.statusCode === 307 &&
      citizenAccessLogin.headers.location.includes("/citizen/dashboard"),
    `Status: ${citizenAccessLogin.statusCode}, Location: ${citizenAccessLogin.headers.location}`
  );

  // --- SUITE 3: MUNICIPAL OFFICER RBAC ---
  console.log("\n--- SUITE 3: Municipal Officer RBAC Boundaries ---");
  const officerCookie = createSessionCookie(
    "municipal_officer",
    "officer@ecowatch.ai",
    "Marcus Bennett",
    "Ward 04"
  );

  const officerAccessOwn = await request("/officer/dashboard", {
    headers: { Cookie: officerCookie },
  });
  record(
    "Municipal Officer accessing /officer/dashboard returns HTTP 200",
    officerAccessOwn.statusCode === 200,
    `Status: ${officerAccessOwn.statusCode}`
  );

  const officerAccessAdmin = await request("/admin/dashboard", {
    headers: { Cookie: officerCookie },
  });
  record(
    "Municipal Officer attempting to access /admin/dashboard redirects to /unauthorized",
    officerAccessAdmin.statusCode === 307 &&
      officerAccessAdmin.headers.location.includes("/unauthorized"),
    `Status: ${officerAccessAdmin.statusCode}, Location: ${officerAccessAdmin.headers.location}`
  );

  const officerAccessLogin = await request("/login", {
    headers: { Cookie: officerCookie },
  });
  record(
    "Authenticated Officer visiting /login redirects to /officer/dashboard",
    officerAccessLogin.statusCode === 307 &&
      officerAccessLogin.headers.location.includes("/officer/dashboard"),
    `Status: ${officerAccessLogin.statusCode}, Location: ${officerAccessLogin.headers.location}`
  );

  // --- SUITE 4: ADMINISTRATOR AUTHORIZATION ---
  console.log("\n--- SUITE 4: Administrator Super-Console Authorization ---");
  const adminCookie = createSessionCookie(
    "administrator",
    "admin@ecowatch.ai",
    "Dr. Elena Vance"
  );

  const adminAccessOwn = await request("/admin/dashboard", {
    headers: { Cookie: adminCookie },
  });
  record(
    "Administrator accessing /admin/dashboard returns HTTP 200",
    adminAccessOwn.statusCode === 200,
    `Status: ${adminAccessOwn.statusCode}`
  );

  const adminAccessOfficer = await request("/officer/dashboard", {
    headers: { Cookie: adminCookie },
  });
  record(
    "Administrator supervisory audit access to /officer/dashboard returns HTTP 200",
    adminAccessOfficer.statusCode === 200,
    `Status: ${adminAccessOfficer.statusCode}`
  );

  const adminAccessCitizen = await request("/citizen/dashboard", {
    headers: { Cookie: adminCookie },
  });
  record(
    "Administrator supervisory audit access to /citizen/dashboard returns HTTP 200",
    adminAccessCitizen.statusCode === 200,
    `Status: ${adminAccessCitizen.statusCode}`
  );

  const adminAccessLogin = await request("/login", {
    headers: { Cookie: adminCookie },
  });
  record(
    "Authenticated Administrator visiting /login redirects to /admin/dashboard",
    adminAccessLogin.statusCode === 307 &&
      adminAccessLogin.headers.location.includes("/admin/dashboard"),
    `Status: ${adminAccessLogin.statusCode}, Location: ${adminAccessLogin.headers.location}`
  );

  // --- SUITE 5: LOGOUT ENDPOINT & COOKIE CLEARANCE ---
  console.log("\n--- SUITE 5: Logout Endpoint & Cookie Clearance ---");
  const logoutRes = await request("/api/auth/logout", {
    method: "POST",
    headers: { Cookie: citizenCookie },
  });
  const setCookie = logoutRes.headers["set-cookie"] || [];
  const clearedCookie = Array.isArray(setCookie) ? setCookie.join("; ") : setCookie;
  record(
    "POST /api/auth/logout clears session cookie and redirects",
    logoutRes.statusCode === 303 &&
      (clearedCookie.includes("ecowatch_auth_session=;") ||
        clearedCookie.includes("Max-Age=0") ||
        clearedCookie.includes("expires=")),
    `Status: ${logoutRes.statusCode}, Set-Cookie: ${clearedCookie}`
  );

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log("\n=================================================");
  console.log(`TOTAL TESTS: ${results.length}`);
  console.log(`PASSED:      ${passedCount}`);
  console.log(`FAILED:      ${failedCount}`);
  console.log("=================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

