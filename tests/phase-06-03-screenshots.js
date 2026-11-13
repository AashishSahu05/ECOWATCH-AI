const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

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

async function setViewport(ws, width, height, isMobile = false) {
  await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: isMobile,
  });
}

async function navigate(ws, url) {
  await sendCommand(ws, "Page.navigate", { url });
  await new Promise((r) => setTimeout(r, 2000));
}

async function runScreenshots() {
  console.log("==========================================================");
  console.log("  MODULE 06 — PHASE 06.03: VISUAL QA SCREENSHOT CAPTURE   ");
  console.log("  Desktop (1280px), Tablet (768px), Mobile (390px)        ");
  console.log("==========================================================\n");

  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const tempDir = "D:\\temp-cdp-phase-06-03";
  const destDir = "D:/ECO WATCH AI/public/screenshots";
  const artifactDir = "C:/Users/Aashish/.gemini/antigravity/brain/c6ff765d-ab97-4ddf-ad76-4f283a451f9a/screenshots";

  fs.mkdirSync(destDir, { recursive: true });
  fs.mkdirSync(artifactDir, { recursive: true });

  const edgeProc = spawn(edgePath, [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--remote-allow-origins=*",
    `--user-data-dir=${tempDir}`,
    "http://localhost:3000/officer/cleanup",
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

    // Set officer session cookie
    const officerCookie = JSON.stringify({
      user: {
        id: "usr_officer_001",
        email: "officer@ecowatch.gov",
        fullName: "Inspector Marcus Bennett",
        role: "municipal_officer",
        ward: "ward_04",
      },
    });

    await sendCommand(ws, "Network.setCookie", {
      name: "ecowatch_auth_session",
      value: encodeURIComponent(officerCookie),
      domain: "localhost",
      path: "/",
    });

    // 1. Officer Cleanup Command Board
    console.log("1a. Capturing Officer Cleanup Board (Desktop 1280x800)...");
    await setViewport(ws, 1280, 800, false);
    await navigate(ws, "http://localhost:3000/officer/cleanup");
    await capture(ws, "phase-06-03-1a-cleanup-board-desktop-1280.png", destDir, artifactDir);

    console.log("1b. Capturing Officer Cleanup Board (Tablet 768x1024)...");
    await setViewport(ws, 768, 1024, false);
    await navigate(ws, "http://localhost:3000/officer/cleanup");
    await capture(ws, "phase-06-03-1b-cleanup-board-tablet-768.png", destDir, artifactDir);

    console.log("1c. Capturing Officer Cleanup Board (Mobile 390x844)...");
    await setViewport(ws, 390, 844, true);
    await navigate(ws, "http://localhost:3000/officer/cleanup");
    await capture(ws, "phase-06-03-1c-cleanup-board-mobile-390.png", destDir, artifactDir);

    // 2. Officer Certification Console (rep_w04_002 is cleanup_completed)
    console.log("2a. Capturing Officer Certification Console (Desktop 1280x800)...");
    await setViewport(ws, 1280, 800, false);
    await navigate(ws, "http://localhost:3000/officer/cleanup/rep_w04_002");
    await capture(ws, "phase-06-03-2a-certification-console-desktop-1280.png", destDir, artifactDir);

    console.log("2b. Capturing Officer Certification Console (Tablet 768x1024)...");
    await setViewport(ws, 768, 1024, false);
    await navigate(ws, "http://localhost:3000/officer/cleanup/rep_w04_002");
    await capture(ws, "phase-06-03-2b-certification-console-tablet-768.png", destDir, artifactDir);

    console.log("2c. Capturing Officer Certification Console (Mobile 390x844)...");
    await setViewport(ws, 390, 844, true);
    await navigate(ws, "http://localhost:3000/officer/cleanup/rep_w04_002");
    await capture(ws, "phase-06-03-2c-certification-console-mobile-390.png", destDir, artifactDir);

    // 3. Citizen Tracking & Milestone Timeline
    console.log("3. Switching session to Citizen...");
    const citizenCookie = JSON.stringify({
      user: {
        id: "usr_citizen_001",
        email: "ananya.sharma@example.com",
        fullName: "Ananya Sharma",
        role: "citizen",
      },
    });
    await sendCommand(ws, "Network.setCookie", {
      name: "ecowatch_auth_session",
      value: encodeURIComponent(citizenCookie),
      domain: "localhost",
      path: "/",
    });

    console.log("3a. Capturing Citizen Tracking & Milestones (Desktop 1280x800)...");
    await setViewport(ws, 1280, 800, false);
    await navigate(ws, "http://localhost:3000/citizen/reports/rep_w04_001");
    await capture(ws, "phase-06-03-3a-citizen-tracking-desktop-1280.png", destDir, artifactDir);

    console.log("3b. Capturing Citizen Tracking & Milestones (Tablet 768x1024)...");
    await setViewport(ws, 768, 1024, false);
    await navigate(ws, "http://localhost:3000/citizen/reports/rep_w04_001");
    await capture(ws, "phase-06-03-3b-citizen-tracking-tablet-768.png", destDir, artifactDir);

    console.log("3c. Capturing Citizen Tracking & Milestones (Mobile 390x844)...");
    await setViewport(ws, 390, 844, true);
    await navigate(ws, "http://localhost:3000/citizen/reports/rep_w04_001");
    await capture(ws, "phase-06-03-3c-citizen-tracking-mobile-390.png", destDir, artifactDir);

    ws.close();
    console.log("\n[SUCCESS] All 9 Phase 06.03 visual QA screenshots (Desktop, Tablet, Mobile) captured successfully!");
  } finally {
    edgeProc.kill();
  }
}

runScreenshots().catch((err) => {
  console.error("Screenshot capture error:", err);
  process.exit(1);
});
