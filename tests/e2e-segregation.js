const http = require("http");

function createCitizenCookie() {
  const session = {
    accessToken: `e2e_jwt_${Date.now()}`,
    expiresAt: Date.now() + 864e5,
    user: {
      id: "usr_citizen_001",
      email: "citizen@ecowatch.ai",
      fullName: "Maya Lin",
      role: "citizen",
      createdAt: new Date().toISOString(),
    },
  };
  return `ecowatch_auth_session=${encodeURIComponent(JSON.stringify(session))}; Path=/; HttpOnly`;
}

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
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runE2E() {
  console.log("=================================================");
  console.log("    ECOWATCH AI — MODULE 02 E2E HTTP TESTS       ");
  console.log("=================================================\n");

  const results = [];
  function record(testName, passed, details) {
    results.push({ testName, passed, details });
    const status = passed ? "[PASS]" : "[FAIL]";
    console.log(`${status} ${testName}`);
    if (details) console.log(`       -> ${details}`);
  }

  // 1. Unauthenticated route access to /citizen/segregation
  const unauthRes = await request("/citizen/segregation");
  record(
    "Unauthenticated access to /citizen/segregation redirects to /login",
    unauthRes.statusCode === 307 && unauthRes.headers.location.includes("/login?redirect=%2Fcitizen%2Fsegregation"),
    `Status: ${unauthRes.statusCode}, Location: ${unauthRes.headers.location}`
  );

  // 2. Authenticated citizen access to /citizen/segregation
  const citizenCookie = createCitizenCookie();
  const authRes = await request("/citizen/segregation", {
    headers: { Cookie: citizenCookie },
  });
  record(
    "Authenticated citizen accessing /citizen/segregation returns HTTP 200",
    authRes.statusCode === 200,
    `Status: ${authRes.statusCode}`
  );

  // 3. API validation: POST /api/segregation/analyze without payload
  const emptyPostRes = await request("/api/segregation/analyze", {
    method: "POST",
    headers: {
      Cookie: citizenCookie,
      "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundaryDummy",
    },
    body: "------WebKitFormBoundaryDummy--\r\n",
  });
  record(
    "POST /api/segregation/analyze without file returns HTTP 400 Bad Request",
    emptyPostRes.statusCode === 400,
    `Status: ${emptyPostRes.statusCode}`
  );

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log("\n=================================================");
  console.log(`TOTAL E2E TESTS: ${results.length}`);
  console.log(`PASSED:          ${passedCount}`);
  console.log(`FAILED:          ${failedCount}`);
  console.log("=================================================");

  if (failedCount > 0) process.exit(1);
}

runE2E().catch((err) => {
  console.error("E2E tests failed:", err);
  process.exit(1);
});

