const fs = require('fs');
const { spawn } = require('child_process');

async function makeTransparent() {
  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--remote-allow-origins=*',
    '--user-data-dir=D:\\temp-cdp-logo3',
    'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 1000));
  const listRes = await fetch('http://localhost:9225/json/list');
  const pages = await listRes.json();
  const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));

  const imgData = fs.readFileSync('public/images/ecowatch-ai-logo.png').toString('base64');
  const expr = `
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, c.width, c.height);
        const d = imgData.data;

        // Target background: [25, 74, 53]
        const targetR = 25;
        const targetG = 74;
        const targetB = 53;

        // Color distance function
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];

          // Euclidean distance in RGB space
          const dist = Math.sqrt(
            Math.pow(r - targetR, 2) +
            Math.pow(g - targetG, 2) +
            Math.pow(b - targetB, 2)
          );

          // Threshold for solid background vs logo artwork
          // The logo artwork is bright lime green [150-180, 200-240, 50-80] or pure white [255, 255, 255]
          // Background is ~ [25, 74, 53]
          if (dist < 18) {
            d[i + 3] = 0; // fully transparent
          } else if (dist < 28) {
            // Smooth edge transition
            const alphaFactor = (dist - 18) / 10;
            d[i + 3] = Math.round(d[i + 3] * alphaFactor);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(c.toDataURL('image/png'));
      };
      img.src = 'data:image/jpeg;base64,${imgData}';
    })
  `;

  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: { expression: expr, awaitPromise: true, returnByValue: true }
  }));

  ws.addEventListener('message', (ev) => {
    const data = JSON.parse(ev.data || ev);
    if (data.id === 1) {
      const dataUrl = data.result?.result?.value;
      if (dataUrl) {
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64, 'base64');
        // Save as ecowatch-ai-logo-transparent.png and ecowatch-ai-logo.png
        fs.writeFileSync('public/images/ecowatch-ai-logo-transparent.png', buffer);
        fs.writeFileSync('public/images/ecowatch-ai-logo.png', buffer);
        fs.writeFileSync('C:/Users/Aashish/.gemini/antigravity/brain/c6ff765d-ab97-4ddf-ad76-4f283a451f9a/screenshots/ecowatch-ai-logo.png', buffer);
        console.log('Saved transparent logo! Size:', buffer.length);
      }
      edgeProc.kill();
      process.exit(0);
    }
  });
}
makeTransparent();

