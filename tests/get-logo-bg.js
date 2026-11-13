const fs = require('fs');
const { spawn } = require('child_process');

async function check() {
  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--remote-allow-origins=*',
    '--user-data-dir=D:\\temp-cdp-logo2',
    'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 1000));
  const listRes = await fetch('http://localhost:9224/json/list');
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
        
        // Sample corners and borders
        const p1 = ctx.getImageData(5, 5, 1, 1).data;
        const p2 = ctx.getImageData(img.width - 5, 5, 1, 1).data;
        const p3 = ctx.getImageData(5, img.height - 5, 1, 1).data;
        const p4 = ctx.getImageData(img.width - 5, img.height - 5, 1, 1).data;
        
        resolve({
          w: img.width,
          h: img.height,
          topLeft: [p1[0], p1[1], p1[2]],
          topRight: [p2[0], p2[1], p2[2]],
          bottomLeft: [p3[0], p3[1], p3[2]],
          bottomRight: [p4[0], p4[1], p4[2]]
        });
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
      console.log('Result:', data.result?.result?.value);
      edgeProc.kill();
      process.exit(0);
    }
  });
}
check();

