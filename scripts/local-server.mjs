import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createLocalBookingStore } from './local-booking-store.mjs';
import { handleMcp } from '../lib/clinic-mcp.mjs';
export function createDemoServer({ storagePath } = {}) {
  const store = createLocalBookingStore(storagePath);
  const files = new Map([
    ['/', ['../demo/index.html', 'text/html']],
    ['/modules/booking-widget.mjs', ['../lib/booking-widget.mjs','text/javascript']],
    ['/modules/booking.mjs', ['../lib/booking.mjs','text/javascript']],
    ['/modules/clinic-client.mjs', ['../lib/clinic-client.mjs', 'text/javascript']],
    ['/modules/clinic-mcp.mjs', ['../lib/clinic-mcp.mjs', 'text/javascript']],
    ['/modules/clinic-routing.mjs', ['../lib/clinic-routing.mjs', 'text/javascript']],
  ]);
  const server = createServer(async (req, res) => {
    const address = serverAddress(req.socket.localPort);
    if (req.headers.host !== new URL(address).host) { res.writeHead(403); res.end(); return; }
    try {
      const pathname = new URL(req.url, address).pathname;
      if (pathname === '/api/mcp') {
        let size = 0; const chunks = [];
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 16384) { res.writeHead(413); res.end(); return; }
          chunks.push(chunk);
        }
        const request = new Request(address + pathname, { method: req.method, headers: req.headers,
          ...(['GET', 'HEAD'].includes(req.method) ? {} : {body: Buffer.concat(chunks)}) });
        const response = await handleMcp(request, [address], store);
        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(await response.text()); return;
      }
      if (req.method !== 'GET' || !files.has(pathname)) { res.writeHead(404); res.end(); return; }
      const [path, type] = files.get(pathname);
      res.writeHead(200, {'Content-Type':type, 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff'});
      res.end(await readFile(new URL(path, import.meta.url)));
    } catch { res.writeHead(500); res.end('Request failed'); }
  });
  server.on("close", () => store.close());
  return server;
}
const serverAddress = port => `http://127.0.0.1:${port}`;
if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  const port = Number(process.env.PORT || 8787);
  createDemoServer().listen(port, '127.0.0.1', () => console.log(`Clinic Access Navigator: ${serverAddress(port)} — fictional examples only`));
}
