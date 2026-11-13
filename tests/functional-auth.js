// Module 01 Functional Unit Test Suite
// Verifies MockAuthAdapter methods, registration rules, and privilege escalation guards

const { DEMO_USERS } = require("../src/lib/auth/mock-adapter");

// Simulated browser cookie storage
let cookieStore = {};
global.document = {
  get cookie() {
    return Object.entries(cookieStore)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("; ");
  },
  set cookie(val) {
    const [pair] = val.split(";");
    const [k, v] = pair.split("=");
    if (v === "" || val.includes("expires=Thu, 01 Jan 1970")) {
      delete cookieStore[k.trim()];
    } else {
      cookieStore[k.trim()] = decodeURIComponent(v || "");
    }
  },
};

// Simulated localStorage
let localStorageStore = {};
global.window = {};
global.localStorage = {
  getItem: (key) => localStorageStore[key] || null,
  setItem: (key, val) => {
    localStorageStore[key] = val;
  },
  clear: () => {
    localStorageStore = {};
  },
};

const { MockAuthAdapter } = require("../src/lib/auth/mock-adapter");

async function runFunctionalTests() {
  console.log("=================================================");
  console.log("   ECOWATCH AI — FUNCTIONAL ADAPTER UNIT TESTS   ");
  console.log("=================================================\n");

  const results = [];
  function record(testName, passed, details) {
    results.push({ testName, passed, details });
    const status = passed ? "[PASS]" : "[FAIL]";
    console.log(`${status} ${testName}`);
    if (details) console.log(`       -> ${details}`);
  }

  const adapter = new MockAuthAdapter();

  // Test 1: Seed personas presence
  console.log("\n--- TEST 1: Seed Demo Personas ---");
  record(
    "Citizen persona seeded correctly",
    DEMO_USERS["citizen@ecowatch.ai"]?.role === "citizen",
    `Role: ${DEMO_USERS["citizen@ecowatch.ai"]?.role}`
  );
  record(
    "Municipal Officer persona seeded correctly with jurisdiction",
    DEMO_USERS["officer@ecowatch.ai"]?.role === "municipal_officer" &&
      Boolean(DEMO_USERS["officer@ecowatch.ai"]?.ward),
    `Role: ${DEMO_USERS["officer@ecowatch.ai"]?.role}, Ward: ${DEMO_USERS["officer@ecowatch.ai"]?.ward}`
  );
  record(
    "Administrator persona seeded correctly",
    DEMO_USERS["admin@ecowatch.ai"]?.role === "administrator",
    `Role: ${DEMO_USERS["admin@ecowatch.ai"]?.role}`
  );

  // Test 2: Login validation
  console.log("\n--- TEST 2: Login Flows & Invariant Checks ---");
  const validCitizenLogin = await adapter.signIn({
    email: "citizen@ecowatch.ai",
    password: "Citizen@123",
  });
  record(
    "Valid citizen login succeeds and establishes session",
    validCitizenLogin.success && validCitizenLogin.data.user.role === "citizen",
    `User: ${validCitizenLogin.data?.user.fullName}`
  );

  const invalidPasswordLogin = await adapter.signIn({
    email: "citizen@ecowatch.ai",
    password: "WrongPassword999!",
  });
  record(
    "Invalid password correctly rejected",
    !invalidPasswordLogin.success && Boolean(invalidPasswordLogin.error),
    `Error: ${invalidPasswordLogin.error}`
  );

  const nonExistentEmailLogin = await adapter.signIn({
    email: "unknown@ecowatch.ai",
    password: "Citizen@123",
  });
  record(
    "Non-existent email correctly rejected",
    !nonExistentEmailLogin.success && Boolean(nonExistentEmailLogin.error),
    `Error: ${nonExistentEmailLogin.error}`
  );

  const validOfficerLogin = await adapter.signIn({
    email: "officer@ecowatch.ai",
    password: "Officer@123",
  });
  record(
    "Valid municipal officer login succeeds with ward jurisdiction",
    validOfficerLogin.success &&
      validOfficerLogin.data.user.role === "municipal_officer" &&
      validOfficerLogin.data.user.ward === "Ward 04 — Central Transit Corridor",
    `Role: ${validOfficerLogin.data?.user.role}, Ward: ${validOfficerLogin.data?.user.ward}`
  );

  const validAdminLogin = await adapter.signIn({
    email: "admin@ecowatch.ai",
    password: "Admin@123",
  });
  record(
    "Valid administrator login succeeds with root privileges",
    validAdminLogin.success && validAdminLogin.data.user.role === "administrator",
    `Role: ${validAdminLogin.data?.user.role}`
  );

  // Test 3: Session Persistence & Logout
  console.log("\n--- TEST 3: Session Persistence & Sign Out ---");
  const currentSession = await adapter.getSession();
  record(
    "Session persists in browser cookie",
    Boolean(currentSession) && currentSession.user.email === "admin@ecowatch.ai",
    `Active User: ${currentSession?.user.email}`
  );

  const signOutResult = await adapter.signOut();
  const sessionAfterSignOut = await adapter.getSession();
  record(
    "Sign out clears active session",
    signOutResult.success && sessionAfterSignOut === null,
    `Session after signout: ${sessionAfterSignOut}`
  );

  // Test 4: Registration & Privilege Escalation Defenses
  console.log("\n--- TEST 4: Registration & Privilege Escalation Defenses ---");
  const testRegEmail = `test_citizen_${Date.now()}@example.org`;
  const regResult = await adapter.signUp({
    fullName: "Alice Green",
    email: testRegEmail,
    password: "Password123!",
  });
  record(
    "Citizen registration creates account with role strictly locked to 'citizen'",
    regResult.success && regResult.data.role === "citizen",
    `Assigned Role: ${regResult.data?.role}`
  );

  // Duplicate email registration attempt
  const dupRegResult = await adapter.signUp({
    fullName: "Alice Impersonator",
    email: testRegEmail,
    password: "Password123!",
  });
  record(
    "Duplicate email registration rejected",
    !dupRegResult.success && Boolean(dupRegResult.error),
    `Error: ${dupRegResult.error}`
  );

  // Weak password (<8 chars)
  const weakPassReg = await adapter.signUp({
    fullName: "Weak Pass User",
    email: `weak_${Date.now()}@example.org`,
    password: "short",
  });
  record(
    "Registration with weak password (<8 characters) rejected",
    !weakPassReg.success && Boolean(weakPassReg.error),
    `Error: ${weakPassReg.error}`
  );

  // Test 5: Profile Updates & Role Immutability
  console.log("\n--- TEST 5: Profile Update & Role Protection ---");
  // Login as registered citizen
  await adapter.signIn({
    email: testRegEmail,
    password: "Password123!",
  });

  const profileUpdate = await adapter.updateProfile({
    fullName: "Alice Green (Updated)",
    // Note: ProfileUpdatePayload only permits fullName
  });
  const updatedUser = await adapter.getCurrentUser();
  record(
    "Profile update allows fullName update while preserving immutable 'citizen' role",
    profileUpdate.success &&
      updatedUser.fullName === "Alice Green (Updated)" &&
      updatedUser.role === "citizen",
    `Name: ${updatedUser?.fullName}, Role: ${updatedUser?.role}`
  );

  // Test 6: Password Recovery
  console.log("\n--- TEST 6: Password Recovery Flow ---");
  const pwResetReq = await adapter.requestPasswordReset({
    email: testRegEmail,
  });
  record(
    "Password reset request returns safe confirmation",
    pwResetReq.success,
    pwResetReq.message
  );

  const pwResetNonExistent = await adapter.requestPasswordReset({
    email: "does_not_exist@example.org",
  });
  record(
    "Password reset for non-existent email does not leak account existence",
    pwResetNonExistent.success,
    pwResetNonExistent.message
  );

  const pwUpdate = await adapter.updatePassword({
    newPassword: "BrandNewPassword123!",
  });
  record(
    "Password update succeeds for authenticated user",
    pwUpdate.success,
    pwUpdate.message
  );

  // Verify login with new password
  await adapter.signOut();
  const loginWithNewPw = await adapter.signIn({
    email: testRegEmail,
    password: "BrandNewPassword123!",
  });
  record(
    "Login with updated password succeeds",
    loginWithNewPw.success,
    `Welcome: ${loginWithNewPw.data?.user.fullName}`
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

runFunctionalTests().catch((err) => {
  console.error("Functional tests failed:", err);
  process.exit(1);
});

