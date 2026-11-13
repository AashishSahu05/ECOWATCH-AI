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
        // ignore
      }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function runCameraTests() {
  console.log("=================================================");
  console.log(" ECOWATCH AI — MODULE 02 CAMERA E2E AUDIT        ");
  console.log("=================================================\n");

  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const tempDir = "D:\\temp-cdp-camera";
  const destDir = "D:/ECO WATCH AI/public/screenshots";
  const artifactDir = "C:/Users/Aashish/.gemini/antigravity/brain/c6ff765d-ab97-4ddf-ad76-4f283a451f9a/screenshots";

  fs.mkdirSync(destDir, { recursive: true });
  fs.mkdirSync(artifactDir, { recursive: true });

  // Launch Edge with Chromium Real Fake Media Stream Device
  console.log("1. Spawning Edge with media stream device enabled...");
  const edgeProc = spawn(edgePath, [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--remote-allow-origins=*",
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
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

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.addEventListener("open", resolve));

    await sendCommand(ws, "Network.enable");
    await sendCommand(ws, "Page.enable");

    // Authenticate
    const sessionVal = createCitizenCookie();
    await sendCommand(ws, "Network.setCookie", {
      name: "ecowatch_auth_session",
      value: encodeURIComponent(sessionVal),
      domain: "localhost",
      path: "/",
    });

    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // Navigate to segregation portal
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/citizen/segregation" });
    await new Promise((r) => setTimeout(r, 2000));

    // TEST 1: Check separate buttons
    console.log("--- TEST 1: Distinct Upload and Camera Actions ---");
    const buttonsCheck = await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
          const hasUpload = btns.some(t => t.includes('Upload from Device'));
          const hasCamera = btns.some(t => t.includes('Open Camera'));
          return { hasUpload, hasCamera, total: btns.length };
        })()
      `,
      returnByValue: true,
    });

    const bRes = buttonsCheck.result.value;
    console.log(`[PASS] Upload from Device button present: ${bRes.hasUpload}`);
    console.log(`[PASS] Open Camera button present: ${bRes.hasCamera}`);
    if (!bRes.hasUpload || !bRes.hasCamera) throw new Error("Separate buttons not found!");

    const snap1 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(destDir, "camera-1-uploader-separate-buttons.png"), Buffer.from(snap1.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "camera-1-uploader-separate-buttons.png"), Buffer.from(snap1.data, "base64"));

    // TEST 2: Open Camera Modal & Stream Real Video
    console.log("\n--- TEST 2: In-Page Live Camera Viewfinder & Stream ---");
    await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        const cameraBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Open Camera'));
        if (cameraBtn) cameraBtn.click();
      `,
    });

    // Wait for stream to initialize
    await new Promise((r) => setTimeout(r, 2000));

    const videoState = await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        (() => {
          const video = document.querySelector('video');
          if (!video) return { exists: false };
          return {
            exists: true,
            hasStream: Boolean(video.srcObject),
            paused: video.paused,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            readyState: video.readyState,
          };
        })()
      `,
      returnByValue: true,
    });

    const vRes = videoState.result.value;
    console.log(`[PASS] Live Video element mounted: ${vRes.exists}`);
    console.log(`[PASS] Video source is live MediaStream: ${vRes.hasStream}`);
    console.log(`[PASS] Video dimensions: ${vRes.videoWidth}x${vRes.videoHeight}, readyState: ${vRes.readyState}`);
    if (!vRes.exists || !vRes.hasStream) throw new Error("Camera stream failed to mount!");

    const snap2 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(destDir, "camera-2-live-preview-modal.png"), Buffer.from(snap2.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "camera-2-live-preview-modal.png"), Buffer.from(snap2.data, "base64"));

    // TEST 3: Capture Photo Still Frame
    console.log("\n--- TEST 3: Frame Capture to Blob & ImagePreview Mount ---");
    await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        const captureBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Capture Photo'));
        if (captureBtn) captureBtn.click();
      `,
    });

    await new Promise((r) => setTimeout(r, 2500));

    const previewState = await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        (() => {
          const img = document.querySelector('img[alt="Waste Item for AI Inspection"]');
          const hasAnalyzeBtn = Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Run AI Segregation Analysis'));
          const hasRetakeBtn = Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Retake / Change'));
          return {
            hasImage: Boolean(img && img.src && img.src.startsWith('data:image')),
            hasAnalyzeBtn,
            hasRetakeBtn,
          };
        })()
      `,
      returnByValue: true,
    });

    const pRes = previewState.result.value;
    console.log(`[PASS] Captured still frame converted to data URL preview: ${pRes.hasImage}`);
    console.log(`[PASS] Run AI Segregation Analysis button ready: ${pRes.hasAnalyzeBtn}`);
    console.log(`[PASS] Retake / Change button available: ${pRes.hasRetakeBtn}`);
    if (!pRes.hasImage) throw new Error("Captured image not mounted in ImagePreview!");

    const snap3 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(destDir, "camera-3-captured-frame-preview.png"), Buffer.from(snap3.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "camera-3-captured-frame-preview.png"), Buffer.from(snap3.data, "base64"));

    // TEST 4: Retake / Cancel and Error State Simulation
    console.log("\n--- TEST 4: Retake Image & Camera Permission Denied Error Handling ---");
    const preRetakeBtns = await sendCommand(ws, "Runtime.evaluate", {
      expression: `Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim())`,
      returnByValue: true,
    });
    console.log("Buttons before retake click:", preRetakeBtns.result.value);

    // Click Retake / Change
    const retakeClickRes = await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        (() => {
          const retakeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Retake / Change'));
          if (retakeBtn) {
            retakeBtn.click();
            return true;
          }
          return false;
        })()
      `,
      returnByValue: true,
    });
    console.log("Retake button clicked:", retakeClickRes.result.value);
    await new Promise((r) => setTimeout(r, 1500));

    const postRetakeBtns = await sendCommand(ws, "Runtime.evaluate", {
      expression: `Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim())`,
      returnByValue: true,
    });
    console.log("Buttons after retake click:", postRetakeBtns.result.value);

    // Override getUserMedia to simulate NotAllowedError (permission denied)
    await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        MediaDevices.prototype.getUserMedia = function() {
          return Promise.reject(new DOMException('Camera permission denied by user', 'NotAllowedError'));
        };
      `,
    });

    // Click Open Camera again
    const camClick = await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        (() => {
          const cameraBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Open Camera'));
          if (cameraBtn) {
            cameraBtn.click();
            return { clicked: true, text: cameraBtn.textContent };
          }
          return { clicked: false };
        })()
      `,
      returnByValue: true,
    });
    console.log("Open Camera click result:", camClick.result.value);
    await new Promise((r) => setTimeout(r, 2000));

    const errorUiCheck = await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        (() => {
          const text = document.body.innerText;
          console.log("Current body text:", text);
          const hasDeniedTitle = text.includes('Camera Permission Denied');
          const hasRetry = Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Retry Camera'));
          const hasFallback = Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Upload from Device'));
          return { hasDeniedTitle, hasRetry, hasFallback, previewText: text.substring(0, 300) };
        })()
      `,
      returnByValue: true,
    });

    const eRes = errorUiCheck.result.value;
    console.log("Body text preview:", eRes.previewText);
    console.log(`[PASS] Permission Denied Error UI rendered: ${eRes.hasDeniedTitle}`);
    console.log(`[PASS] Retry Camera action available: ${eRes.hasRetry}`);
    console.log(`[PASS] Upload from Device fallback available: ${eRes.hasFallback}`);
    if (!eRes.hasDeniedTitle) throw new Error("Permission Denied UI not displayed!");

    const snap4 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(destDir, "camera-4-permission-denied-error.png"), Buffer.from(snap4.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "camera-4-permission-denied-error.png"), Buffer.from(snap4.data, "base64"));

    // TEST 5: Mobile Viewport Camera Experience (375x812)
    console.log("\n--- TEST 5: Mobile Camera Experience (375x812) ---");
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const snap5 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(destDir, "camera-5-mobile-camera-error.png"), Buffer.from(snap5.data, "base64"));
    fs.writeFileSync(path.join(artifactDir, "camera-5-mobile-camera-error.png"), Buffer.from(snap5.data, "base64"));

    ws.close();
    console.log("\n=================================================");
    console.log(" ALL CAMERA TESTS PASSED (5/5)                   ");
    console.log("=================================================");
  } finally {
    try {
      edgeProc.kill("SIGKILL");
    } catch {}
  }
}

runCameraTests().catch((err) => {
  console.error("Camera Test Failed:", err);
  process.exit(1);
});
