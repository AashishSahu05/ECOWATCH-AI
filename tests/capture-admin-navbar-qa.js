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

async function runAdminNavbarCaptures() {
  console.log("==========================================================");
  console.log("  ECOWATCH AI — ADMINISTRATOR NAVBAR REDESIGN QA          ");
  console.log("==========================================================\n");

  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const tempDir = "D:\\temp-cdp-admin-nav-qa";
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

    // Setup Administrator Session
    const adminUser = {
      id: "usr_admin_003",
      email: "admin@ecowatch.ai",
      fullName: "Elena Rostova",
      role: "administrator",
    };
    const adminCookie = encodeURIComponent(
      JSON.stringify({ user: adminUser, accessToken: "mock_token_admin" })
    );
    await sendCommand(ws, "Network.setCookie", {
      name: "ecowatch_auth_session",
      value: adminCookie,
      domain: "localhost",
      path: "/",
    });

    // 1. Desktop 1440px (/admin/dashboard)
    console.log("1. Capturing Desktop 1440px (/admin/dashboard) ...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/admin/dashboard" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture(ws, "admin-nav-1-desktop-1440.png", destDir, artifactDir);

    // 2. Desktop 1280px Standard Viewport (/admin/dashboard)
    console.log("2. Capturing Desktop 1280px standard viewport (/admin/dashboard) ...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/admin/dashboard" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture(ws, "admin-nav-2-desktop-1280.png", destDir, artifactDir);

    // 3. Desktop 1280px (/admin/analytics - Active Route Highlight)
    console.log("3. Capturing Desktop 1280px (/admin/analytics - Active Route Highlight) ...");
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/admin/analytics" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture(ws, "admin-nav-3-analytics-active-1280.png", destDir, artifactDir);

    // 4. Tablet 1024px Compact Layout
    console.log("4. Capturing Tablet 1024px compact layout (/admin/dashboard) ...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1024,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/admin/dashboard" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture(ws, "admin-nav-4-tablet-1024.png", destDir, artifactDir);

    // 5. Tablet 768px with Hamburger Navigation Open
    console.log("5. Capturing Tablet 768px with open drawer (/admin/dashboard) ...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 768,
      height: 1024,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/admin/dashboard" });
    await new Promise((r) => setTimeout(r, 2000));
    await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        const btn = document.querySelector('button[aria-label="Toggle Dashboard Navigation Menu"]');
        btn?.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));
    await capture(ws, "admin-nav-5-tablet-768.png", destDir, artifactDir);

    // 6. Mobile 390px with Touch-Friendly Hamburger Drawer
    console.log("6. Capturing Mobile 390px with open drawer (/admin/dashboard) ...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    });
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/admin/dashboard" });
    await new Promise((r) => setTimeout(r, 2000));
    await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        const btn = document.querySelector('button[aria-label="Toggle Dashboard Navigation Menu"]');
        btn?.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));
    await capture(ws, "admin-nav-6-mobile-390.png", destDir, artifactDir);

    console.log("\n==========================================================");
    console.log("  ALL 6 ADMIN NAVBAR SCREENSHOTS CAPTURED!                ");
    console.log("==========================================================");

    ws.close();
  } finally {
    try { edgeProc.kill(); } catch {}
  }
}

runAdminNavbarCaptures();

