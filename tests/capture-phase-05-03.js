const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function sendCommand(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const timer = setTimeout(() => {
      ws.removeEventListener("message", handler);
      reject(new Error(`Command ${method} timed out`));
    }, 12000);

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

async function runPhase0503Captures() {
  console.log("==========================================================");
  console.log("  ECOWATCH AI — PHASE 05.03 VISUAL VERIFICATION QA        ");
  console.log("==========================================================\n");

  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const tempDir = "D:\\temp-cdp-phase-05-03";
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

    // Officer session setup
    const officerUser = {
      id: "usr_officer_001",
      email: "officer@ecowatch.ai",
      fullName: "Inspector Marcus Bennett",
      role: "municipal_officer",
      ward: "ward_04",
    };
    const officerCookie = encodeURIComponent(
      JSON.stringify({ user: officerUser, accessToken: "mock_token_officer" })
    );
    await sendCommand(ws, "Network.setCookie", {
      name: "ecowatch_auth_session",
      value: officerCookie,
      domain: "localhost",
      path: "/",
    });

    // ------------------------------------------------------------------------
    // 1. Screen 1: /officer/operations Desktop (1280x900)
    // ------------------------------------------------------------------------
    console.log("1. Capturing Operations Dashboard (/officer/operations) at 1280x900 ...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/officer/operations" });
    await new Promise((r) => setTimeout(r, 2500));
    await capture(ws, "phase-05-03-1-operations-desktop-1280.png", destDir, artifactDir);

    // ------------------------------------------------------------------------
    // 2. Screen 1: /officer/operations Mobile (390x844)
    // ------------------------------------------------------------------------
    console.log("2. Capturing Operations Dashboard (/officer/operations) at 390x844 (Mobile) ...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await new Promise((r) => setTimeout(r, 1500));
    await capture(ws, "phase-05-03-2-operations-mobile-390.png", destDir, artifactDir);

    // ------------------------------------------------------------------------
    // 3. Screen 2: /officer/operations/routes Desktop (1280x900)
    // ------------------------------------------------------------------------
    console.log("3. Capturing Route Management (/officer/operations/routes) at 1280x900 ...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/officer/operations/routes" });
    await new Promise((r) => setTimeout(r, 2500));
    await capture(ws, "phase-05-03-3-routes-desktop-1280.png", destDir, artifactDir);

    // ------------------------------------------------------------------------
    // 4. Screen 2: /officer/operations/routes Mobile (390x844)
    // ------------------------------------------------------------------------
    console.log("4. Capturing Route Management (/officer/operations/routes) at 390x844 (Mobile) ...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await new Promise((r) => setTimeout(r, 1500));
    await capture(ws, "phase-05-03-4-routes-mobile-390.png", destDir, artifactDir);

    // ------------------------------------------------------------------------
    // 5. Screen 3: /officer/operations/root-causes Desktop (1280x900)
    // ------------------------------------------------------------------------
    console.log("5. Capturing Root Cause Intelligence (/officer/operations/root-causes) at 1280x900 ...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/officer/operations/root-causes" });
    await new Promise((r) => setTimeout(r, 2500));
    await capture(ws, "phase-05-03-5-root-causes-desktop-1280.png", destDir, artifactDir);

    // ------------------------------------------------------------------------
    // 6. Screen 3: /officer/operations/root-causes Mobile (390x844)
    // ------------------------------------------------------------------------
    console.log("6. Capturing Root Cause Intelligence (/officer/operations/root-causes) at 390x844 (Mobile) ...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await new Promise((r) => setTimeout(r, 1500));
    await capture(ws, "phase-05-03-6-root-causes-mobile-390.png", destDir, artifactDir);

    console.log("\n==========================================================");
    console.log("  ALL 6 VISUAL QA SCREENSHOTS CAPTURED SUCCESSFULLY       ");
    console.log("==========================================================");

    ws.close();
  } finally {
    edgeProc.kill("SIGKILL");
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

runPhase0503Captures().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
