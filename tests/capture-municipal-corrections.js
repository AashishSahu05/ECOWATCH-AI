const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function sendCommand(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const timer = setTimeout(() => {
      ws.removeEventListener("message", handler);
      reject(new Error(`Command ${method} timed out`));
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

async function runMunicipalCaptures() {
  console.log("==========================================================");
  console.log("  ECOWATCH AI — MUNICIPAL DASHBOARD CORRECTIONS QA        ");
  console.log("==========================================================\n");

  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const tempDir = "D:\\temp-cdp-muni-qa";
  const destDir = "D:/ECO WATCH AI/public/screenshots";
  const artifactDir = "C:/Users/Aashish/.gemini/antigravity/brain/c6ff765d-ab97-4ddf-ad76-4f283a451f9a/screenshots";

  fs.mkdirSync(destDir, { recursive: true });
  fs.mkdirSync(artifactDir, { recursive: true });

  const edgeProc = spawn(edgePath, [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--remote-allow-origins=*",
    `--user-data-dir=${tempDir}`,
    "http://localhost:3000/login",
  ]);

  try {
    let connected = false;
    for (let i = 0; i < 20; i++) {
      try {
        const check = await fetch("http://localhost:9222/json/version");
        if (check.ok) { connected = true; break; }
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!connected) throw new Error("Could not connect to Edge 9222");

    const listRes = await fetch("http://localhost:9222/json/list");
    const pages = await listRes.json();
    let page = pages.find((p) => p.type === "page" && p.webSocketDebuggerUrl) || pages[0];

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.addEventListener("open", resolve));

    await sendCommand(ws, "Network.enable");
    await sendCommand(ws, "Page.enable");
    await sendCommand(ws, "Runtime.enable");

    // Set officer session cookie
    const officerUser = {
      id: "usr_officer_002",
      email: "officer@ecowatch.ai",
      fullName: "Marcus Bennett",
      role: "municipal_officer",
      ward: "Ward 04 — Central Transit Corridor",
    };
    const cookieVal = encodeURIComponent(
      JSON.stringify({ user: officerUser, accessToken: "mock_token_officer" })
    );
    await sendCommand(ws, "Network.setCookie", {
      name: "ecowatch_auth_session",
      value: cookieVal,
      domain: "localhost",
      path: "/",
    });

    // 1. Municipal Overview Desktop 1440x900
    console.log("1. Capturing Municipal Overview (/officer/dashboard) at 1440x900 ...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/officer/dashboard" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture(ws, "municipal-1-overview.png", destDir, artifactDir);

    // 2. Municipal Analytics Desktop 1440x900
    console.log("2. Capturing Municipal Analytics (/officer/analytics) at 1440x900 ...");
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/officer/analytics" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture(ws, "municipal-2-analytics.png", destDir, artifactDir);

    // 3. Municipal Report Queue Desktop 1440x900
    console.log("3. Capturing Municipal Report Queue (/officer/reports) at 1440x900 ...");
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/officer/reports" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture(ws, "municipal-3-report-queue.png", destDir, artifactDir);

    // 4. Municipal Operations (/officer/dashboard#operations) Desktop 1440x900
    console.log("4. Capturing Municipal Operations (/officer/dashboard#operations) ...");
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/officer/dashboard#operations" });
    await new Promise((r) => setTimeout(r, 2000));
    // Scroll down to operations section
    await sendCommand(ws, "Runtime.evaluate", {
      expression: `document.getElementById("operations")?.scrollIntoView({ behavior: "instant" })`,
    });
    await new Promise((r) => setTimeout(r, 500));
    await capture(ws, "municipal-4-operations.png", destDir, artifactDir);

    // 5. Mobile Overview (390x844)
    console.log("5. Capturing Mobile Overview (390x844) ...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    });
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/officer/dashboard" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture(ws, "municipal-5-mobile-overview.png", destDir, artifactDir);

    console.log("\n==========================================================");
    console.log("  ALL 5 MUNICIPAL SCREENSHOTS CAPTURED SUCCESSFULLY!      ");
    console.log("==========================================================");

    ws.close();
  } finally {
    try { edgeProc.kill(); } catch {}
  }
}

runMunicipalCaptures();

