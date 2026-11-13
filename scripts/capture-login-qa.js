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
      } catch (err) {
        // ignore
      }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function capture() {
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const tempDir = "D:\\temp-cdp-profile-login-qa";
  const artifactDir = "C:\\Users\\Aashish\\.gemini\\antigravity\\brain\\c6ff765d-ab97-4ddf-ad76-4f283a451f9a\\screenshots";
  const publicDir = "D:\\ECO WATCH AI\\public\\screenshots";

  [artifactDir, publicDir, tempDir].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  console.log("Launching Edge headless on port 9224...");
  const edgeProc = spawn(edgePath, [
    "--headless=new",
    "--remote-debugging-port=9224",
    "--remote-allow-origins=*",
    `--user-data-dir=${tempDir}`,
    "about:blank",
  ]);

  try {
    let connected = false;
    for (let i = 0; i < 20; i++) {
      try {
        const check = await fetch("http://localhost:9224/json/version");
        if (check.ok) {
          connected = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!connected) throw new Error("Could not connect to Edge on port 9224");

    const newRes = await fetch("http://localhost:9224/json/new?http://localhost:3000/login", { method: "PUT" });
    const page = await newRes.json();

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve);
      ws.addEventListener("error", reject);
    });

    await sendCommand(ws, "Network.enable");
    await sendCommand(ws, "Page.enable");

    // Clear any cookies to ensure clean login page
    await sendCommand(ws, "Network.clearBrowserCookies");

    // Navigate to /login
    console.log("Navigating to http://localhost:3000/login...");
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/login" });
    await new Promise((r) => setTimeout(r, 2500));

    // 1. Desktop 1440x900
    console.log("1. Capturing Desktop (1440x900)...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise((r) => setTimeout(r, 1000));
    let snap = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(publicDir, "login-desktop-1440.png"), Buffer.from(snap.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "login-desktop-1440.png"), Buffer.from(snap.data, "base64"));

    // 2. Laptop 1366x768
    console.log("2. Capturing Laptop (1366x768)...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise((r) => setTimeout(r, 1000));
    snap = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(publicDir, "login-laptop-1366.png"), Buffer.from(snap.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "login-laptop-1366.png"), Buffer.from(snap.data, "base64"));

    // 3. Tablet 768x1024
    console.log("3. Capturing Tablet (768x1024)...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 768,
      height: 1024,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise((r) => setTimeout(r, 1000));
    snap = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(publicDir, "login-tablet-768.png"), Buffer.from(snap.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "login-tablet-768.png"), Buffer.from(snap.data, "base64"));

    // 4. Mobile 390x844
    console.log("4. Capturing Mobile (390x844)...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await new Promise((r) => setTimeout(r, 1000));
    snap = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(publicDir, "login-mobile-390.png"), Buffer.from(snap.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "login-mobile-390.png"), Buffer.from(snap.data, "base64"));

    // 5. Interactive Autofill Demo Verification (Desktop 1440x900)
    console.log("5. Testing Municipal Officer tab and Autofill...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        // Click Municipal Officer tab
        const buttons = Array.from(document.querySelectorAll('button'));
        const officerTab = buttons.find(b => b.textContent.includes('Municipal Officer'));
        if (officerTab) officerTab.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    // Click Autofill button
    await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        const buttons = Array.from(document.querySelectorAll('button'));
        const autofillBtn = buttons.find(b => b.textContent.includes('Autofill demo credentials'));
        if (autofillBtn) autofillBtn.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 800));

    snap = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(publicDir, "login-officer-autofill.png"), Buffer.from(snap.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "login-officer-autofill.png"), Buffer.from(snap.data, "base64"));

    console.log("All screenshots captured successfully!");
    ws.close();
  } finally {
    edgeProc.kill("SIGKILL");
  }
}

capture().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
