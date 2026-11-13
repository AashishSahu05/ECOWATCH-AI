const fs = require("fs");
const { spawn } = require("child_process");

async function testLogoRender() {
  const edgeProc = spawn("C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--remote-allow-origins=*",
    "--user-data-dir=D:\\temp-cdp-logotest",
    "about:blank",
  ]);

  try {
    for (let i = 0; i < 20; i++) {
      try {
        const check = await fetch("http://localhost:9222/json/version");
        if (check.ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
    const listRes = await fetch("http://localhost:9222/json/list");
    const pages = await listRes.json();
    const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener("open", r));

    function send(method, params = {}) {
      return new Promise((res) => {
        const id = Math.floor(Math.random() * 100000);
        const handler = (e) => {
          const msg = JSON.parse(e.data || e);
          if (msg.id === id) {
            ws.removeEventListener("message", handler);
            res(msg.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    const logoBase64 = fs.readFileSync("public/images/ecowatch-ai-logo.png").toString("base64");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: sans-serif; background: #FAFCF9; padding: 40px; margin: 0; }
          .row { margin-bottom: 30px; }
          .label { font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #164734; }
          .pill-dark { background: #133A29; display: inline-flex; align-items: center; padding: 6px 14px; border-radius: 12px; }
          .bare-light { background: #FAFCF9; display: inline-flex; align-items: center; padding: 6px 14px; border: 1px solid #DCEBDD; border-radius: 12px; }
          img { height: 36px; width: auto; display: block; object-fit: contain; }
        </style>
      </head>
      <body>
        <div class="row">
          <div class="label">Option 1: Dark Forest Green Brand Pill (Preserves original green, lime & white 100%):</div>
          <div class="pill-dark">
            <img src="data:image/png;base64,${logoBase64}" />
          </div>
        </div>
        <div class="row">
          <div class="label">Option 2: Bare on Light Navbar (Notice white text is washed out/invisible):</div>
          <div class="bare-light">
            <img src="data:image/png;base64,${logoBase64}" />
          </div>
        </div>
      </body>
      </html>
    `;

    await send("Page.enable");
    const tree = await send("Page.getFrameTree");
    await send("Page.setDocumentContent", { frameId: tree.frameTree.frame.id, html });
    await new Promise((r) => setTimeout(r, 600));

    const shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(
      "C:/Users/Aashish/.gemini/antigravity/brain/c6ff765d-ab97-4ddf-ad76-4f283a451f9a/screenshots/logo-comparison.png",
      Buffer.from(shot.data, "base64")
    );
    console.log("Saved logo-comparison.png");
    ws.close();
  } finally {
    try { edgeProc.kill(); } catch {}
  }
}

testLogoRender();

