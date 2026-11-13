const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function createAuthSession(role = "citizen") {
  const user = {
    id: role === "citizen" ? "usr_citizen_001" : role === "municipal_officer" ? "usr_officer_001" : "usr_admin_001",
    email: role === "citizen" ? "citizen@ecowatch.ai" : role === "municipal_officer" ? "officer@ecowatch.ai" : "admin@ecowatch.ai",
    fullName: role === "citizen" ? "Maya Lin" : role === "municipal_officer" ? "Marcus Bennett" : "Dr. Elena Vance",
    role: role,
    ward: "Ward 04",
    createdAt: new Date().toISOString(),
  };
  return JSON.stringify({
    accessToken: `e2e_jwt_${Date.now()}`,
    expiresAt: Date.now() + 864e5,
    user,
  });
}

function sendCommand(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const timer = setTimeout(() => {
      ws.removeEventListener("message", handler);
      reject(new Error(`Command ${method} timed out after 10000ms`));
    }, 10000);

    const handler = (event) => {
      try {
        const raw = event.data !== undefined ? event.data : event;
        const msg = JSON.parse(raw.toString());
        if (msg.id === id) {
          clearTimeout(timer);
          ws.removeEventListener("message", handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      } catch (err) {}
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function capture(ws, filename, destDir, artifactDir) {
  const res = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
  const buffer = Buffer.from(res.data, "base64");
  fs.writeFileSync(path.join(destDir, filename), buffer);
  fs.writeFileSync(path.join(artifactDir, filename), buffer);
  console.log(`[SCREENSHOT] Saved ${filename} (${buffer.length} bytes)`);
}

async function setSession(ws, role) {
  const sessionStr = createAuthSession(role);
  await sendCommand(ws, "Network.setCookie", {
    name: "ecowatch_auth_session",
    value: encodeURIComponent(sessionStr),
    domain: "localhost",
    path: "/",
  });
  await sendCommand(ws, "Runtime.evaluate", {
    expression: `localStorage.setItem('ecowatch_auth_session', ${JSON.stringify(sessionStr)});`,
  });
}

async function clearSession(ws) {
  await sendCommand(ws, "Network.deleteCookies", {
    name: "ecowatch_auth_session",
    domain: "localhost",
    path: "/",
  });
  await sendCommand(ws, "Runtime.evaluate", {
    expression: `localStorage.removeItem('ecowatch_auth_session');`,
  });
}

async function runSplitAuthScreenshots() {
  console.log("==========================================================");
  console.log("  ECOWATCH AI — ROOT SPLIT-SCREEN AUTHENTICATION CAPTURE  ");
  console.log("==========================================================\n");

  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const tempDir = "D:\\temp-cdp-splithome";
  const destDir = "D:/ECO WATCH AI/public/screenshots";
  const artifactDir = "C:/Users/Aashish/.gemini/antigravity/brain/c6ff765d-ab97-4ddf-ad76-4f283a451f9a/screenshots";

  fs.mkdirSync(destDir, { recursive: true });
  fs.mkdirSync(artifactDir, { recursive: true });

  console.log("1. Spawning Edge browser instance on port 9222...");
  const edgeProc = spawn(edgePath, [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--remote-allow-origins=*",
    `--user-data-dir=${tempDir}`,
    "http://localhost:3000",
  ]);

  try {
    let connected = false;
    for (let i = 0; i < 20; i++) {
      try {
        const check = await fetch("http://localhost:9222/json/version");
        if (check.ok) {
          connected = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!connected) throw new Error("Could not connect to Edge port 9222");

    const listRes = await fetch("http://localhost:9222/json/list");
    const pages = await listRes.json();
    let page = pages.find((p) => p.type === "page" && p.webSocketDebuggerUrl) || pages[0];

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.addEventListener("open", resolve));

    await sendCommand(ws, "Network.enable");
    await sendCommand(ws, "Page.enable");
    await sendCommand(ws, "Runtime.enable");

    // =========================================================================
    // 1. ROOT SPLIT-SCREEN AUTHENTICATION — Desktop 1440x900
    // =========================================================================
    console.log("\n2. Capturing Root Split-Screen Entry (/) on Desktop ...");
    await clearSession(ws);
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture(ws, "split-auth-1-root-desktop.png", destDir, artifactDir);

    // =========================================================================
    // 2. ROOT SPLIT-SCREEN AUTHENTICATION — Mobile 375x812
    // =========================================================================
    console.log("\n3. Capturing Root Split-Screen Entry (/) on Mobile (375x812) ...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture(ws, "split-auth-2-root-mobile.png", destDir, artifactDir);

    // =========================================================================
    // 3. CITIZEN DASHBOARD WITH OFFICIAL LOGO — Desktop 1440x900
    // =========================================================================
    console.log("\n4. Capturing Citizen Dashboard (/citizen/dashboard) with Official Logo ...");
    await setSession(ws, "citizen");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/citizen/dashboard" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture(ws, "split-auth-3-citizen-dashboard.png", destDir, artifactDir);

    // =========================================================================
    // 4. MUNICIPAL OFFICER DASHBOARD WITH OFFICIAL LOGO — Desktop 1440x900
    // =========================================================================
    console.log("\n5. Capturing Municipal Officer Dashboard (/officer/dashboard) with Official Logo ...");
    await setSession(ws, "municipal_officer");
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/officer/dashboard" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture(ws, "split-auth-4-officer-dashboard.png", destDir, artifactDir);

    // =========================================================================
    // 5. ADMINISTRATOR DASHBOARD WITH OFFICIAL LOGO — Desktop 1440x900
    // =========================================================================
    console.log("\n6. Capturing Administrator Dashboard (/admin/dashboard) with Official Logo ...");
    await setSession(ws, "administrator");
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/admin/dashboard" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture(ws, "split-auth-5-admin-dashboard.png", destDir, artifactDir);

    // =========================================================================
    // 6. CITIZEN REGISTRATION PAGE — Desktop 1440x900
    // =========================================================================
    console.log("\n7. Capturing Citizen Registration Page (/register) ...");
    await clearSession(ws);
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/register" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture(ws, "split-auth-6-register-page.png", destDir, artifactDir);

    console.log("\n==========================================================");
    console.log("  ALL SPLIT-SCREEN AUTH SCREENSHOTS CAPTURED!             ");
    console.log("==========================================================");

    ws.close();
  } catch (err) {
    console.error("Screenshot capture error:", err);
  } finally {
    try {
      edgeProc.kill("SIGKILL");
    } catch {}
  }
}

runSplitAuthScreenshots();

