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
      } catch (err) { }
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

async function loginAs(ws, roleText) {
  await sendCommand(ws, "Network.clearBrowserCookies");
  await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/login" });
  await new Promise((r) => setTimeout(r, 2000));
  await sendCommand(ws, "Runtime.evaluate", {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const roleBtn = btns.find(b => b.textContent && b.textContent.includes('${roleText}'));
        if (roleBtn) roleBtn.click();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 1000));
  await sendCommand(ws, "Runtime.evaluate", {
    expression: `
      (() => {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 3000));
}

async function runLiveIntegrationCaptures() {
  console.log("==========================================================");
  console.log("  ECOWATCH AI — REAL INTEGRATION VISUAL VERIFICATION QA   ");
  console.log("==========================================================\n");

  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const tempDir = "D:\\temp-cdp-live-int-qa-clean";
  const destDir = "D:/ECO WATCH AI/public/screenshots";
  const artifactDir = "C:/Users/Aashish/.gemini/antigravity/brain/c6ff765d-ab97-4ddf-ad76-4f283a451f9a/screenshots";

  fs.mkdirSync(destDir, { recursive: true });
  fs.mkdirSync(artifactDir, { recursive: true });

  const edgeProc = spawn(edgePath, [
    "--headless=new",
    "--remote-debugging-port=9225",
    "--remote-allow-origins=*",
    `--user-data-dir=${tempDir}`,
    "http://localhost:3000/login",
  ]);

  try {
    let connected = false;
    for (let i = 0; i < 20; i++) {
      try {
        const check = await fetch("http://localhost:9225/json/version");
        if (check.ok) { connected = true; break; }
      } catch { }
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!connected) throw new Error("Could not connect to Edge 9225");

    const listRes = await fetch("http://localhost:9225/json/list");
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === "page") || targets[0];

    const { WebSocket } = require("ws");
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.on("open", resolve));

    await sendCommand(ws, "Page.enable");
    await sendCommand(ws, "DOM.enable");
    await sendCommand(ws, "Network.enable");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // 1. Citizen Role -> Report Step 4 (Location Map Picker)
    console.log("Authenticating as Citizen...");
    await loginAs(ws, "Citizen");
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/citizen/report" });
    await new Promise((r) => setTimeout(r, 2500));
    // Click category to advance to evidence
    await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        (() => {
          const cards = document.querySelectorAll('.cursor-pointer, [role="button"]');
          if (cards.length > 0) cards[0].click();
          const nextBtn = document.querySelector('button[type="button"]');
        })()
      `,
    });
    await capture(ws, "live-int-1-citizen-reporting-1280.png", destDir, artifactDir);

    // 2. Officer Role -> Analytics Page (Hotspot Map)
    console.log("Authenticating as Municipal Officer...");
    await loginAs(ws, "Municipal Officer");
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/officer/analytics" });
    await new Promise((r) => setTimeout(r, 3500));
    await sendCommand(ws, "Runtime.evaluate", { expression: `window.scrollBy(0, 680);` });
    await new Promise((r) => setTimeout(r, 1500));
    await capture(ws, "live-int-2-hotspot-map-1280.png", destDir, artifactDir);

    // 3. Admin Role -> Governance Dashboard
    console.log("Authenticating as Administrator...");
    await loginAs(ws, "Administrator");
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/admin/dashboard" });
    await new Promise((r) => setTimeout(r, 3000));
    await capture(ws, "live-int-3-admin-dashboard-1280.png", destDir, artifactDir);

    ws.close();
  } catch (err) {
    console.error("Capture failed:", err);
  } finally {
    edgeProc.kill();
  }
}

runLiveIntegrationCaptures().then(() => console.log("Capture completed."));