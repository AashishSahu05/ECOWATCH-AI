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
        // ignore non-matching
      }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function capture() {
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const tempDir = "D:\\temp-cdp-profile-corrected";

  console.log("Launching Edge headless on port 9222...");
  const edgeProc = spawn(edgePath, [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--remote-allow-origins=*",
    `--user-data-dir=${tempDir}`,
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

    if (!connected) throw new Error("Could not connect to Edge port 9222");

    const listRes = await fetch("http://localhost:9222/json/list");
    const pages = await listRes.json();
    let page = pages.find((p) => p.type === "page" && p.webSocketDebuggerUrl) || pages[0];

    if (!page || !page.webSocketDebuggerUrl) {
      const newRes = await fetch("http://localhost:9222/json/new?http://localhost:3000", { method: "PUT" });
      page = await newRes.json();
    }

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve);
      ws.addEventListener("error", reject);
    });

    await sendCommand(ws, "Network.enable");
    await sendCommand(ws, "Page.enable");

    // Authenticate as Citizen
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

    // --- 1. Citizen Segregation Page (Desktop 1280x900) - Single Auth Navbar ---
    console.log("1. Capturing Citizen Segregation Page (Single Auth Navbar)...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/citizen/segregation" });
    await new Promise((r) => setTimeout(r, 2000));
    const snap1 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(destDir, "corrected-1-segregation-page.png"), Buffer.from(snap1.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "corrected-1-segregation-page.png"), Buffer.from(snap1.data, "base64"));

    // --- 2. Results Desktop (1280x900) - Top Image + Summary Overview ---
    console.log("2. Loading Results Scan and Capturing Results Desktop...");
    // Click first history card
    await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        const cards = Array.from(document.querySelectorAll('div')).filter(el => 
          el.className && el.className.includes('group rounded-3xl bg-white border')
        );
        if (cards.length > 0) cards[0].click();
      `,
    });
    await new Promise((r) => setTimeout(r, 2000));
    const snap2 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(destDir, "corrected-2-results-desktop.png"), Buffer.from(snap2.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "corrected-2-results-desktop.png"), Buffer.from(snap2.data, "base64"));

    // --- 3. Results Mobile (375x812) ---
    console.log("3. Capturing Results Mobile (375x812)...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await new Promise((r) => setTimeout(r, 1200));
    const snap3 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(destDir, "corrected-3-results-mobile.png"), Buffer.from(snap3.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "corrected-3-results-mobile.png"), Buffer.from(snap3.data, "base64"));

    // --- 4. Multiple Rectangular Object Cards View (Desktop 1280x1100, scrolled to cards) ---
    console.log("4. Capturing Multiple Rectangular Object Cards View...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 950,
      deviceScaleFactor: 1,
      mobile: false,
    });
    // Scroll down to cards section and toggle open the technical details on first card
    await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        const cardsHeading = Array.from(document.querySelectorAll('h4')).find(h => h.textContent.includes('Identified Discarded Items'));
        if (cardsHeading) cardsHeading.scrollIntoView({ behavior: 'instant', block: 'start' });
        
        // Open technical details toggle on first card
        const techToggles = document.querySelectorAll('button:has(span:contains("Technical"))') || [];
        const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Technical'));
        if (btns.length > 0) btns[0].click();
      `,
    });
    await new Promise((r) => setTimeout(r, 1200));
    const snap4 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(destDir, "corrected-4-object-cards.png"), Buffer.from(snap4.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "corrected-4-object-cards.png"), Buffer.from(snap4.data, "base64"));

    // --- 5. Bounding-Box Interaction View ---
    console.log("5. Capturing Bounding-Box Interaction View...");
    // Scroll back to top
    await sendCommand(ws, "Runtime.evaluate", {
      expression: `window.scrollTo({ top: 0, behavior: 'instant' });`,
    });
    // Hover on first object
    await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        const objCards = document.querySelectorAll('div[class*="rounded-3xl p-6 sm:p-7 border bg-white"]');
        if (objCards && objCards.length > 0) {
          objCards[0].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        }
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));
    const snap5 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(destDir, "corrected-5-bounding-boxes.png"), Buffer.from(snap5.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "corrected-5-bounding-boxes.png"), Buffer.from(snap5.data, "base64"));

    // --- 6. Responsive Tablet 768px ---
    console.log("6. Capturing Responsive Tablet (768x1024)...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 768,
      height: 1024,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise((r) => setTimeout(r, 1000));
    const snap6 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(destDir, "corrected-6-tablet-768.png"), Buffer.from(snap6.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "corrected-6-tablet-768.png"), Buffer.from(snap6.data, "base64"));

    // --- 7. Responsive Wide Desktop 1440px ---
    console.log("7. Capturing Responsive Wide Desktop (1440x900)...");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise((r) => setTimeout(r, 1000));
    const snap7 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(destDir, "corrected-7-desktop-1440.png"), Buffer.from(snap7.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "corrected-7-desktop-1440.png"), Buffer.from(snap7.data, "base64"));

    ws.close();
    console.log("All corrected screenshots captured successfully!");
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

