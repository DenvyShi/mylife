const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DIST_DIR = path.join(__dirname, '.next', 'standalone', 'standalone');
const STATIC_DIR = path.join(__dirname, '.next');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.rsc': 'text/x-component',
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  
  const urlPath = req.url.split('?')[0];
  
  // Handle static files from _next/static
  if (urlPath.startsWith('/_next/')) {
    const staticPath = path.join(STATIC_DIR, urlPath);
    if (fs.existsSync(staticPath)) {
      const ext = path.extname(staticPath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(staticPath).pipe(res);
      return;
    }
  }
  
  // Handle favicon
  if (urlPath === '/favicon.ico') {
    const faviconPath = path.join(STATIC_DIR, 'favicon.ico');
    if (fs.existsSync(faviconPath)) {
      res.writeHead(200, { 'Content-Type': 'image/x-icon' });
      fs.createReadStream(faviconPath).pipe(res);
      return;
    }
  }
  
  // Determine the HTML file to serve based on the URL path
  let htmlFile = 'index.html'; // default
  
  if (urlPath === '/admin' || urlPath === '/admin/') {
    htmlFile = 'admin.html';
  } else if (urlPath.startsWith('/admin/snapshots')) {
    htmlFile = 'admin/snapshots.html';
  } else if (urlPath.startsWith('/r/')) {
    // Dynamic route - serve the main page and let client-side handle it
    htmlFile = 'index.html';
  }
  
  const filePath = path.join(DIST_DIR, htmlFile);
  
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'text/html';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // Fallback to index.html
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.createReadStream(indexPath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`易經占卜 server running on http://0.0.0.0:${PORT}`);
});
