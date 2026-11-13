const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function createAuthCookie(role = "citizen") {
  const session = {
    accessToken: `e2e_jwt_${Date.now()}`,
    expiresAt: Date.now() + 864e5,
    user: {
      id: role === "citizen" ? "usr_citizen_001" : "usr_officer_001",
      email: role === "citizen" ? "citizen@ecowatch.ai" : "officer@ecowatch.ai",
      fullName: role === "citizen" ? "Aarav Sharma" : "Inspector Rajesh Kumar",
      role: role,
      ward: "Ward 04",
      createdAt: new Date().toISOString(),
    },
  };
  return JSON.stringify(session);
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

async function runBrowserE2E() {
  console.log("==========================================================");
  console.log("  ECOWATCH AI — MODULE 03 BROWSER UI & SCREENSHOT AUDIT   ");
  console.log("==========================================================\n");

  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const tempDir = "D:\\temp-cdp-civic";
  const destDir = "D:/ECO WATCH AI/public/screenshots";
  const artifactDir = "C:/Users/Aashish/.gemini/antigravity/brain/c6ff765d-ab97-4ddf-ad76-4f283a451f9a/screenshots";

  fs.mkdirSync(destDir, { recursive: true });
  fs.mkdirSync(artifactDir, { recursive: true });

  console.log("1. Spawning Edge browser instance on port 9222...");
  const edgeProc = spawn(edgePath, [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--remote-allow-origins=*",
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
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

    // VIEW 1: Citizen Report Creation Wizard (Desktop 1440x900)
    console.log("\n2. Testing Citizen Report Wizard (/citizen/report)...");
    await sendCommand(ws, "Network.setCookie", {
      name: "ecowatch_auth_session",
      value: encodeURIComponent(createAuthCookie("citizen")),
      domain: "localhost",
      path: "/",
    });

    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/citizen/report" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture(ws, "civic-1-citizen-wizard.png", destDir, artifactDir);

    // VIEW 2: Citizen My Reports Feed
    console.log("\n3. Testing Citizen My Reports Feed (/citizen/reports)...");
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/citizen/reports" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture(ws, "civic-2-citizen-reports-feed.png", destDir, artifactDir);

    // VIEW 3: Citizen Report Detail Page with Resolution Evidence & Feedback
    console.log("\n4. Testing Citizen Report Detail (/citizen/reports/rep_seed_004)...");
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/citizen/reports/rep_seed_004" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture(ws, "civic-3-citizen-report-detail.png", destDir, artifactDir);

    // VIEW 4: Municipal Officer Triage Queue
    console.log("\n5. Testing Municipal Officer Queue (/officer/reports)...");
    await sendCommand(ws, "Network.setCookie", {
      name: "ecowatch_auth_session",
      value: encodeURIComponent(createAuthCookie("municipal_officer")),
      domain: "localhost",
      path: "/",
    });

    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/officer/reports" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture(ws, "civic-4-officer-queue.png", destDir, artifactDir);

    // VIEW 5: Municipal Officer Command Console
    console.log("\n6. Testing Municipal Officer Command Console (/officer/reports/rep_seed_001)...");
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/officer/reports/rep_seed_001" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture(ws, "civic-5-officer-console.png", destDir, artifactDir);

    // VIEW 6: Mobile Responsive Viewport (375x812) on Citizen Report Wizard
    console.log("\n7. Testing Mobile Responsive Viewport (375px) on /citizen/report...");
    await sendCommand(ws, "Network.setCookie", {
      name: "ecowatch_auth_session",
      value: encodeURIComponent(createAuthCookie("citizen")),
      domain: "localhost",
      path: "/",
    });

    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });

    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/citizen/report" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture(ws, "civic-6-mobile-citizen-report.png", destDir, artifactDir);

    ws.close();
    console.log("\nAll 6 browser UI screenshots generated successfully!");
  } finally {
    edgeProc.kill();
  }
}

runBrowserE2E().catch((err) => {
  console.error("Browser E2E failed:", err);
  process.exit(1);
});

