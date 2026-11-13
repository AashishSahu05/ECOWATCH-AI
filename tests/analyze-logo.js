const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

async function analyzeLogo() {
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const tempDir = "D:\\temp-cdp-logo";
  
  const edgeProc = spawn(edgePath, [
    "--headless=new",
    "--remote-debugging-port=9223",
    "--remote-allow-origins=*",
    `--user-data-dir=${tempDir}`,
    "about:blank"
  ]);

  try {
    let connected = false;
    for (let i = 0; i < 20; i++) {
      try {
        const check = await fetch("http://localhost:9223/json/version");
        if (check.ok) { connected = true; break; }
      } catch {}
      await new Promise(r => setTimeout(r, 500));
    }
    if (!connected) throw new Error("Could not connect to port 9223");

    const listRes = await fetch("http://localhost:9223/json/list");
    const pages = await listRes.json();
    const wsUrl = pages[0].webSocketDebuggerUrl;
    const ws = new WebSocket(wsUrl);
    await new Promise(r => ws.addEventListener("open", r));

    function sendCommand(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = Math.floor(Math.random() * 1000000);
        const handler = (event) => {
          const msg = JSON.parse(event.data || event);
          if (msg.id === id) {
            ws.removeEventListener("message", handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendCommand("Runtime.enable");

    // Read the image as base64
    const imgData = fs.readFileSync("public/images/ecowatch-ai-logo.png").toString("base64");

    const script = `
      (async () => {
        const img = new Image();
        img.src = "data:image/jpeg;base64,${imgData}";
        await new Promise(r => img.onload = r);
        
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Sample background color from corners
        const topLeft = [data[0], data[1], data[2]];
        const topRight = [data[(canvas.width - 1) * 4], data[(canvas.width - 1) * 4 + 1], data[(canvas.width - 1) * 4 + 2]];
        const bottomLeft = [data[(canvas.height - 1) * canvas.width * 4], data[(canvas.height - 1) * canvas.width * 4 + 1], data[(canvas.height - 1) * canvas.width * 4 + 2]];
        
        return {
          width: canvas.width,
          height: canvas.height,
          topLeft,
          topRight,
          bottomLeft
        };
      })()
    `;

    const res = await sendCommand("Runtime.evaluate", {
      expression: script,
      awaitPromise: true,
      returnByValue: true
    });

    console.log("Image Analysis:", res.value);
    ws.close();
  } finally {
    try { edgeProc.kill("SIGKILL"); } catch {}
  }
}

analyzeLogo();

