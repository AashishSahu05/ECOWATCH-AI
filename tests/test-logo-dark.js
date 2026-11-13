const fs = require('fs');
const { spawn } = require('child_process');

async function testOnDarkGreen() {
  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--remote-allow-origins=*',
    '--user-data-dir=D:\\temp-cdp-logo5',
    'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 1000));
  const listRes = await fetch('http://localhost:9227/json/list');
  const pages = await listRes.json();
  const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));

  const imgData = fs.readFileSync('public/images/ecowatch-ai-logo.png').toString('base64');
  const expr = `
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width + 40;
        c.height = img.height + 40;
        const ctx = c.getContext('2d');
        // Fill with panel dark green
        ctx.fillStyle = '#164734';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 20, 20);
        resolve(c.toDataURL('image/png'));
      };
      img.src = 'data:image/png;base64,${imgData}';
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
        fs.writeFileSync('C:/Users/Aashish/.gemini/antigravity/brain/c6ff765d-ab97-4ddf-ad76-4f283a451f9a/screenshots/test-logo-on-dark.png', buffer);
        console.log('Saved test-logo-on-dark.png!');
      }
      edgeProc.kill();
      process.exit(0);
    }
  });
}
testOnDarkGreen();

