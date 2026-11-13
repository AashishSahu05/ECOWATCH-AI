const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function createCitizenCookie() {
  const session = {
    accessToken: `e2e_jwt_${Date.now()}`,
    expiresAt: Date.now() + 864e5,
    user: {
      id: "usr_citizen_001",
      email: "citizen@ecowatch.ai",
      fullName: "Maya Lin",
      role: "citizen",
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
      } catch (err) {
        // ignore parse of non-matching events
      }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function capture() {
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const tempDir = "D:\\temp-cdp-profile";
  
  console.log("Launching Edge headless with remote debugging on port 9222...");
  const edgeProc = spawn(edgePath, [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--remote-allow-origins=*",
    `--user-data-dir=${tempDir}`,
    "http://localhost:3000",
  ]);

  try {
    // Wait for debugging port to be ready
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

    if (!connected) {
      throw new Error("Could not connect to Edge DevTools port 9222");
    }

    const listRes = await fetch("http://localhost:9222/json/list");
    const pages = await listRes.json();
    let page = pages.find((p) => p.type === "page" && p.webSocketDebuggerUrl) || pages[0];

    if (!page || !page.webSocketDebuggerUrl) {
      const newRes = await fetch("http://localhost:9222/json/new?http://localhost:3000", { method: "PUT" });
      page = await newRes.json();
    }

    console.log("Connecting WebSocket to CDP page target:", page.webSocketDebuggerUrl);
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve);
      ws.addEventListener("error", reject);
    });

    await sendCommand(ws, "Network.enable");
    await sendCommand(ws, "Page.enable");

    // Set Auth Cookie for Citizen session
    const sessionVal = createCitizenCookie();
    await sendCommand(ws, "Network.setCookie", {
      name: "ecowatch_auth_session",
      value: encodeURIComponent(sessionVal),
      domain: "localhost",
      path: "/",
    });

    const destDir = "D:/ECO WATCH AI/public/screenshots";
    const artifactDir = "C:/Users/Aashish/.gemini/antigravity/brain/c6ff765d-ab97-4ddf-ad76-4f283a451f9a/screenshots";
    fs.mkdirSync(destDir, { recursive: true });
    fs.mkdirSync(artifactDir, { recursive: true });

    // --- 1. Upload Page Desktop (1280x900) ---
    console.log("1. Capturing Upload Page Desktop (1280x900)...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/citizen/segregation" });
    await new Promise((r) => setTimeout(r, 2500));
    const snap1 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(destDir, "1-upload-desktop.png"), Buffer.from(snap1.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "1-upload-desktop.png"), Buffer.from(snap1.data, "base64"));

    // --- 2. Upload Page Mobile (375x812) ---
    console.log("2. Capturing Upload Page Mobile (375x812)...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await new Promise((r) => setTimeout(r, 1200));
    const snap2 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(destDir, "2-upload-mobile.png"), Buffer.from(snap2.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "2-upload-mobile.png"), Buffer.from(snap2.data, "base64"));

    // --- 3. Analysis Results Desktop (1280x900) ---
    console.log("3. Capturing Analysis Results Desktop (1280x900)...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    // Click first history item to load result
    await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        const cards = Array.from(document.querySelectorAll('div')).filter(el => 
          el.className && el.className.includes('group rounded-3xl bg-white border')
        );
        if (cards.length > 0) cards[0].click();
      `,
    });
    await new Promise((r) => setTimeout(r, 2000));
    const snap3 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(destDir, "3-results-desktop.png"), Buffer.from(snap3.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "3-results-desktop.png"), Buffer.from(snap3.data, "base64"));

    // --- 4. Analysis Results Mobile (375x812) ---
    console.log("4. Capturing Analysis Results Mobile (375x812)...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await new Promise((r) => setTimeout(r, 1200));
    const snap4 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(destDir, "4-results-mobile.png"), Buffer.from(snap4.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "4-results-mobile.png"), Buffer.from(snap4.data, "base64"));

    // --- 5. Bounding Box Visualization Desktop ---
    console.log("5. Capturing Bounding-Box Visualization Desktop (1280x900)...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    // Hover on first object card to activate bounding box
    await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        const objCards = document.querySelectorAll('div[class*="rounded-3xl p-6 sm:p-7 border bg-white"]');
        if (objCards && objCards.length > 0) {
          const ev = new MouseEvent('mouseenter', { bubbles: true });
          objCards[0].dispatchEvent(ev);
        }
      `,
    });
    await new Promise((r) => setTimeout(r, 1200));
    const snap5 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(destDir, "5-bounding-boxes.png"), Buffer.from(snap5.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "5-bounding-boxes.png"), Buffer.from(snap5.data, "base64"));

    // --- 6. Classification Correction Modal ---
    console.log("6. Capturing Classification Correction Modal Desktop (1280x900)...");
    // Click edit button on first card
    await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        const editBtns = document.querySelectorAll('button[aria-label="Correct classification"]');
        if (editBtns && editBtns.length > 0) editBtns[0].click();
      `,
    });
    await new Promise((r) => setTimeout(r, 1500));
    const snap6 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(destDir, "6-correction-modal.png"), Buffer.from(snap6.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "6-correction-modal.png"), Buffer.from(snap6.data, "base64"));

    ws.close();
    console.log("All 6 screenshots captured and saved successfully!");
  } finally {
    try {
      edgeProc.kill("SIGKILL");
    } catch {}
  }
}

capture().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
