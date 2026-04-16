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
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  
  let filePath = path.join(DIST_DIR, req.url.split('?')[0]);
  
  // SPA fallback - serve index.html for non-file routes
  if (!path.extname(filePath)) {
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.createReadStream(indexPath).pipe(res);
      return;
    }
  }
  
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  if (fs.existsSync(filePath)) {
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // Try .next/static files
    if (req.url.startsWith('/_next/')) {
      const staticPath = path.join(STATIC_DIR, req.url.split('?')[0]);
      if (fs.existsSync(staticPath)) {
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(staticPath).pipe(res);
        return;
      }
    }
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`易經占卜 server running on http://0.0.0.0:${PORT}`);
});
