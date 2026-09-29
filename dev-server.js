/* ============================================================
   Local dev server — serves the site AND runs api/enquiry.js,
   so /api/enquiry behaves the same as it does on Vercel.

     AIRTABLE_TOKEN=pat... node dev-server.js
     → http://localhost:3000

   The token is read from the environment. Never put it in a file.
   ============================================================ */
const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const TYPES = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript',
  '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png',
  '.json':'application/json', '.ico':'image/x-icon' };

const handler = require('./api/enquiry.js');

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/api/enquiry') {
    let raw = '';
    req.on('data', c => raw += c);
    req.on('end', async () => {
      req.body = raw;
      // minimal shim so the Vercel-style handler works unchanged
      res.status = c => { res.statusCode = c; return res; };
      res.json   = o => { res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(o)); };
      try { await handler(req, res); }
      catch (e) { console.error(e); res.statusCode = 500; res.end(JSON.stringify({ error: String(e) })); }
    });
    return;
  }

  let file = decodeURIComponent(url.pathname);
  if (file === '/' ) file = '/index.html';
  const full = path.join(__dirname, file);
  if (!full.startsWith(__dirname)) { res.statusCode = 403; return res.end('nope'); }

  fs.readFile(full, (err, data) => {
    if (err) { res.statusCode = 404; return res.end('Not found: ' + file); }
    res.setHeader('Content-Type', TYPES[path.extname(full).toLowerCase()] || 'application/octet-stream');
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`\n  Jeevo dev server → http://localhost:${PORT}`);
  console.log(`  Airtable token: ${process.env.AIRTABLE_TOKEN ? 'set' : 'NOT SET — writes will fail'}\n`);
});
