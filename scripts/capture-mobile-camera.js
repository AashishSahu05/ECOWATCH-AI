const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function createCitizenCookie() {
  return JSON.stringify({
    accessToken: "e2e_jwt_" + Date.now(),
    expiresAt: Date.now() + 864e5,
    user: {
      id: "usr_citizen_001",
      email: "citizen@ecowatch.ai",
      fullName: "Maya Lin",
      role: "citizen",
      createdAt: new Date().toISOString(),
    },
  });
}

function sendCommand(ws, method, params = {}) {
  return new Promise((res, rej) => {
    const id = Math.floor(Math.random() * 1e6);
    const timer = setTimeout(() => rej(new Error("Timeout")), 10000);
    const h = (e) => {
      try {
        const raw = e.data !== undefined ? e.data : e;
        const m = JSON.parse(raw.toString());
        if (m.id === id) {
          clearTimeout(timer);
          ws.removeEventListener("message", h);
          res(m.result);
        }
      } catch {}
    };
    ws.addEventListener("message", h);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function run() {
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const edgeProc = spawn(edgePath, [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--remote-allow-origins=*",
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
    "--user-data-dir=D:\\temp-cdp-mobile-cam",
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

    if (!connected) throw new Error("Could not connect");

    const res = await fetch("http://localhost:9222/json/list");
    const pages = await res.json();
    const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener("open", r));

    await sendCommand(ws, "Network.enable");
    await sendCommand(ws, "Page.enable");
    await sendCommand(ws, "Network.setCookie", {
      name: "ecowatch_auth_session",
      value: encodeURIComponent(createCitizenCookie()),
      domain: "localhost",
      path: "/",
    });

    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });

    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/citizen/segregation" });
    await new Promise((r) => setTimeout(r, 2000));

    await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Open Camera'));
        if (btn) btn.click();
      `,
    });

    await new Promise((r) => setTimeout(r, 2000));

    const snap = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync("D:/ECO WATCH AI/public/screenshots/camera-6-mobile-live-camera.png", Buffer.from(snap.data, "base64"));
    fs.writeFileSync("C:/Users/Aashish/.gemini/antigravity/brain/c6ff765d-ab97-4ddf-ad76-4f283a451f9a/screenshots/camera-6-mobile-live-camera.png", Buffer.from(snap.data, "base64"));

    ws.close();
    console.log("Mobile live camera screenshot saved successfully!");
  } finally {
    try {
      edgeProc.kill("SIGKILL");
    } catch {}
  }
}

run().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});

