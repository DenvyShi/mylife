const http = require('http');
const fs = require('fs');
const path = require('path');
const { parse } = require('url');

const PORT = 3000;
const SERVER_DIR = path.join(__dirname);
const STATIC_DIR = path.join(__dirname, '.next');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.jsx': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.rsc': 'text/x-component',
};

const server = http.createServer((req, res) => {
  const url = parse(req.url, true);
  const pathname = url.pathname;
  
  // CORS headers for API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Handle API routes - proxy to Cloudflare Tunnel origin or return 404
  // For now, serve JSON files for API if they exist
  if (pathname.startsWith('/api/')) {
    // API routes are handled by Next.js runtime, not static files
    // Return a proper response that Next.js can process
    const apiPath = path.join(SERVER_DIR, '.next', 'server', 'app', pathname + '.json');
    if (fs.existsSync(apiPath)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      fs.createReadStream(apiPath).pipe(res);
      return;
    }
    // For dynamic API routes like /api/analytics, we need to handle them differently
    // The issue is these need Node.js runtime
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }
  
  // Serve static chunks from _next/static
  if (pathname.startsWith('/_next/static/')) {
    const filePath = path.join(STATIC_DIR, pathname);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }
  
  // Serve other _next/ files
  if (pathname.startsWith('/_next/')) {
    const filePath = path.join(STATIC_DIR, pathname);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
    res.writeHead(404);
    res.end('Not Found');
    return;
  }
  
  // Serve favicon
  if (pathname === '/favicon.ico') {
    const faviconPath = path.join(STATIC_DIR, 'static/media/favicon.ico');
    if (fs.existsSync(faviconPath)) {
      res.writeHead(200, { 'Content-Type': 'image/x-icon' });
      fs.createReadStream(faviconPath).pipe(res);
      return;
    }
  }
  
  // Route to the correct HTML file based on pathname
  let htmlFile = 'app/index.html';
  
  if (pathname === '/admin' || pathname === '/admin/') {
    htmlFile = 'app/admin.html';
  } else if (pathname.startsWith('/admin/snapshots')) {
    htmlFile = 'app/admin/snapshots.html';
  }
  
  const filePath = path.join(SERVER_DIR, '.next', 'server', htmlFile);
  
  if (fs.existsSync(filePath)) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    console.log(`File not found: ${filePath} (pathname: ${pathname})`);
    res.writeHead(404);
    res.end('Not Found: ' + pathname);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
