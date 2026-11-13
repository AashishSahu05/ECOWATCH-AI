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

async function checkScrollHeight(ws) {
  const evalRes = await sendCommand(ws, "Runtime.evaluate", {
    expression: `({
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      hasVerticalScroll: document.documentElement.scrollHeight > document.documentElement.clientHeight,
      bodyScrollHeight: document.body.scrollHeight,
      bodyClientHeight: document.body.clientHeight
    })`,
    returnByValue: true
  });
  return evalRes.result.value;
}

async function runFinalLoginQA() {
  console.log("==========================================================");
  console.log("  ECOWATCH AI — LOGIN PAGE FINAL UI/UX AUDIT & QA         ");
  console.log("==========================================================\n");

  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const tempDir = "D:\\temp-cdp-login-qa";
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

    if (!connected) throw new Error("Could not connect to Edge port 9222");

    const listRes = await fetch("http://localhost:9222/json/list");
    const pages = await listRes.json();
    let page = pages.find((p) => p.type === "page" && p.webSocketDebuggerUrl) || pages[0];

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.addEventListener("open", resolve));

    await sendCommand(ws, "Network.enable");
    await sendCommand(ws, "Page.enable");
    await sendCommand(ws, "Runtime.enable");

    // Clear any existing cookies/session
    await sendCommand(ws, "Network.deleteCookies", {
      name: "ecowatch_auth_session",
      domain: "localhost",
      path: "/",
    });

    // =========================================================================
    // RESOLUTION 1: 1366x768 Standard Laptop
    // =========================================================================
    console.log("\n2. Testing 1366x768 Standard Desktop/Laptop ...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/login" });
    await new Promise((r) => setTimeout(r, 2000));
    const metrics1366 = await checkScrollHeight(ws);
    console.log(`   [1366x768 Metrics] ScrollHeight: ${metrics1366.scrollHeight}px, ClientHeight: ${metrics1366.clientHeight}px -> Has Scrollbar? ${metrics1366.hasVerticalScroll}`);
    await capture(ws, "login-1-desktop-1366x768.png", destDir, artifactDir);

    // =========================================================================
    // RESOLUTION 2: 1440x900 Desktop / MacBook Pro
    // =========================================================================
    console.log("\n3. Testing 1440x900 Desktop ...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/login" });
    await new Promise((r) => setTimeout(r, 2000));
    const metrics1440 = await checkScrollHeight(ws);
    console.log(`   [1440x900 Metrics] ScrollHeight: ${metrics1440.scrollHeight}px, ClientHeight: ${metrics1440.clientHeight}px -> Has Scrollbar? ${metrics1440.hasVerticalScroll}`);
    await capture(ws, "login-2-desktop-1440x900.png", destDir, artifactDir);

    // =========================================================================
    // RESOLUTION 3: 1920x1080 Full HD Desktop
    // =========================================================================
    console.log("\n4. Testing 1920x1080 Full HD ...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/login" });
    await new Promise((r) => setTimeout(r, 2000));
    const metrics1920 = await checkScrollHeight(ws);
    console.log(`   [1920x1080 Metrics] ScrollHeight: ${metrics1920.scrollHeight}px, ClientHeight: ${metrics1920.clientHeight}px -> Has Scrollbar? ${metrics1920.hasVerticalScroll}`);
    await capture(ws, "login-3-desktop-1920x1080.png", destDir, artifactDir);

    // =========================================================================
    // RESOLUTION 4: 390x844 iPhone 12/13/14 Mobile
    // =========================================================================
    console.log("\n5. Testing 390x844 Mobile ...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    });
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/login" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture(ws, "login-4-mobile-390x844.png", destDir, artifactDir);

    console.log("\n==========================================================");
    console.log("  ALL 4 RESOLUTION SCREENSHOTS CAPTURED SUCCESSFULLY!     ");
    console.log("==========================================================");

    ws.close();
  } catch (err) {
    console.error("Screenshot capture error:", err);
  } finally {
    try { edgeProc.kill("SIGKILL"); } catch {}
  }
}

runFinalLoginQA();

