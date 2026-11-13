const fs = require("fs");
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

async function testShot() {
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const tempDir = "D:\\temp-cdp-shot2";
  const edgeProc = spawn(edgePath, [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--remote-allow-origins=*",
    `--user-data-dir=${tempDir}`,
    "about:blank",
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
    if (!connected) throw new Error("Could not connect to port 9222");

    const listRes = await fetch("http://localhost:9222/json/list");
    const pages = await listRes.json();
    let page = pages.find((p) => p.type === "page" && p.webSocketDebuggerUrl) || pages[0];

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener("open", r));

    await sendCommand(ws, "Network.enable");
    await sendCommand(ws, "Page.enable");

    // Set officer session cookie
    const officerUser = {
      id: "usr_officer_002",
      email: "officer@ecowatch.ai",
      fullName: "Marcus Bennett",
      role: "municipal_officer",
      ward: "Ward 04 — Central Transit Corridor",
    };
    const cookieVal = encodeURIComponent(JSON.stringify({ user: officerUser, accessToken: "mock_token" }));
    await sendCommand(ws, "Network.setCookie", {
      name: "ecowatch_auth_session",
      value: cookieVal,
      domain: "localhost",
      path: "/",
    });

    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/officer/dashboard" });
    await new Promise((r) => setTimeout(r, 2000));

    const shot = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync("C:/Users/Aashish/.gemini/antigravity/brain/c6ff765d-ab97-4ddf-ad76-4f283a451f9a/screenshots/live-officer-dashboard.png", Buffer.from(shot.data, "base64"));
    console.log("Captured live-officer-dashboard.png successfully!");
    ws.close();
  } finally {
    try { edgeProc.kill(); } catch {}
  }
}

testShot();
