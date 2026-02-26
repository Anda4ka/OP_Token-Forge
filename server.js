// Minimal static file server with SPA fallback (zero dependencies)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIR = path.join(__dirname, 'dist');

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wasm': 'application/wasm',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.map': 'application/json',
};

function serveFile(res, filePath) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            // SPA fallback: serve index.html for any non-file route
            fs.readFile(path.join(DIR, 'index.html'), (err2, html) => {
                if (err2) {
                    res.writeHead(500);
                    res.end('Internal Server Error');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(html);
            });
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

http.createServer((req, res) => {
    const url = req.url.split('?')[0]; // strip query string
    const filePath = path.join(DIR, url === '/' ? 'index.html' : url);

    // Prevent directory traversal
    if (!filePath.startsWith(DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    serveFile(res, filePath);
}).listen(PORT, '0.0.0.0', () => {
    console.log(`Static server running on port ${PORT}`);
});
