import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// Configurable Credentials
const CLIENT_PIN = (process.env.CLIENT_PIN || '2026').trim();
const INTERNAL_PIN = (process.env.INTERNAL_PIN || '9418').trim();
const SESSION_SECRET = (process.env.SESSION_SECRET || 'rayamp-solar-geo-auth-secret-key-2026').trim();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function signToken(role) {
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(role).digest('hex');
  return `${role}.${hmac}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [role, hmac] = token.split('.');
  if (!role || !hmac) return null;
  if (role !== 'client' && role !== 'internal') return null;
  const expectedHmac = crypto.createHmac('sha256', SESSION_SECRET).update(role).digest('hex');
  if (crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
    return role;
  }
  return null;
}

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (!rc) return list;
  rc.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const key = parts.shift().trim();
    const val = decodeURI(parts.join('='));
    list[key] = val;
  });
  return list;
}

function renderPinGateHtml(target = '/') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Private page</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: #FFFFFF;
    color: #111827;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 24px;
    -webkit-font-smoothing: antialiased;
  }
  .container {
    max-width: 440px;
    width: 100%;
    text-align: left;
  }
  h1 {
    font-size: 36px;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: #111827;
    margin-bottom: 12px;
    line-height: 1.2;
  }
  p.subtitle {
    font-size: 16px;
    color: #4B5563;
    line-height: 1.5;
    margin-bottom: 32px;
  }
  label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  }
  input[type="password"] {
    width: 100%;
    padding: 14px 16px;
    font-size: 16px;
    border: 1px solid #D1D5DB;
    border-radius: 8px;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    margin-bottom: 20px;
    background: #FFFFFF;
    color: #111827;
  }
  input[type="password"]:focus {
    border-color: #FF5A39;
    box-shadow: 0 0 0 3px rgba(255, 90, 57, 0.2);
  }
  button {
    width: 100%;
    padding: 14px 16px;
    font-size: 16px;
    font-weight: 600;
    color: #FFFFFF;
    background-color: #111010;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  button:hover {
    background-color: #FF5A39;
  }
  .error-message {
    color: #DC2626;
    font-size: 14px;
    margin-top: 14px;
    display: none;
    line-height: 1.4;
  }
  footer {
    position: absolute;
    bottom: 24px;
    font-size: 13px;
    color: #9CA3AF;
  }
</style>
</head>
<body>
<div class="container">
  <h1>Private page</h1>
  <p class="subtitle">This page is shared privately. Enter the access code you were sent.</p>
  <form id="pin-form">
    <label for="pin-input">Access code</label>
    <input type="password" id="pin-input" name="pin" placeholder="Enter access code" autocomplete="current-password" autofocus required />
    <button type="submit">Continue</button>
    <div id="error" class="error-message">Incorrect access code. Please try again.</div>
  </form>
</div>
<footer>Rayamp Solar · Confidential</footer>

<script>
  const form = document.getElementById('pin-form');
  const input = document.getElementById('pin-input');
  const error = document.getElementById('error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.style.display = 'none';
    const pin = input.value.trim();

    try {
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, target: ${JSON.stringify(target)} })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = data.redirect || '${target}';
      } else {
        error.textContent = data.message || 'Incorrect access code. Please try again.';
        error.style.display = 'block';
        input.select();
      }
    } catch (err) {
      error.textContent = 'Connection error. Please try again.';
      error.style.display = 'block';
    }
  });
</script>
</body>
</html>`;
}

function renderForbiddenHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Access Restricted</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: #FFFFFF;
    color: #111827;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 24px;
    -webkit-font-smoothing: antialiased;
  }
  .container {
    max-width: 440px;
    width: 100%;
    text-align: left;
  }
  h1 {
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: #111827;
    margin-bottom: 12px;
  }
  p {
    font-size: 16px;
    color: #4B5563;
    line-height: 1.5;
    margin-bottom: 24px;
  }
  a {
    display: inline-block;
    padding: 12px 20px;
    font-size: 15px;
    font-weight: 600;
    color: #FFFFFF;
    background-color: #111010;
    text-decoration: none;
    border-radius: 8px;
    transition: background-color 0.15s ease;
  }
  a:hover {
    background-color: #FF5A39;
  }
</style>
</head>
<body>
<div class="container">
  <h1>Restricted Section</h1>
  <p>The technical data science dossier is restricted to internal team members. Your access code provides permission for the executive presentation only.</p>
  <a href="/">← Return to Presentation</a>
</div>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Security Headers
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // API PIN verification
  if (req.method === 'POST' && pathname === '/api/verify-pin') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { pin, target } = JSON.parse(body || '{}');
        if (pin === INTERNAL_PIN) {
          const token = signToken('internal');
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': `rayamp_auth=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`
          });
          res.end(JSON.stringify({ success: true, role: 'internal', redirect: target || '/' }));
          return;
        }

        if (pin === CLIENT_PIN) {
          if (target && target.startsWith('/technical')) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'This access code does not have permission to view the technical dossier.' }));
            return;
          }
          const token = signToken('client');
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': `rayamp_auth=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`
          });
          res.end(JSON.stringify({ success: true, role: 'client', redirect: '/' }));
          return;
        }

        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Incorrect access code. Please try again.' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Malformed request.' }));
      }
    });
    return;
  }

  // Logout
  if (pathname === '/logout') {
    res.writeHead(302, {
      'Location': '/',
      'Set-Cookie': 'rayamp_auth=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
    });
    res.end();
    return;
  }

  // Parse Auth Token
  const cookies = parseCookies(req);
  const role = verifyToken(cookies.rayamp_auth);

  // Serve static assets without auth (logo, css, js)
  if (pathname.startsWith('/assets/') || pathname.endsWith('.css') || pathname.endsWith('.js') || pathname === '/favicon.ico') {
    let filePath;
    if (pathname.startsWith('/assets/')) {
      filePath = path.join(__dirname, pathname);
    } else {
      filePath = path.join(__dirname, path.basename(pathname));
    }
    
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  // Technical Dossier Route
  if (pathname === '/technical' || pathname === '/technical.html') {
    if (!role) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderPinGateHtml('/technical'));
      return;
    }
    if (role !== 'internal') {
      res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderForbiddenHtml());
      return;
    }
    const techFile = path.join(__dirname, 'technical.html');
    if (fs.existsSync(techFile)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(techFile).pipe(res);
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Technical dossier is compiling, please refresh shortly.');
      return;
    }
  }

  // Root Client Presentation Route
  if (pathname === '/' || pathname === '/index.html') {
    if (!role) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderPinGateHtml('/'));
      return;
    }
    const indexFile = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexFile)) {
      let content = fs.readFileSync(indexFile, 'utf8');
      // If internal role, inject technical switcher button if not already there
      if (role === 'internal' && !content.includes('id="tech-dossier-pill"')) {
        const switcherHtml = `
          <a href="/technical" id="tech-dossier-pill" style="
            position: fixed;
            top: 20px;
            right: 24px;
            z-index: 9999;
            background: #111010;
            color: #FFFFFF;
            border: 1px solid rgba(255, 90, 57, 0.4);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            font-family: -apple-system, sans-serif;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.2s ease;
          " onmouseover="this.style.background='#FF5A39'; this.style.borderColor='#FF5A39';" onmouseout="this.style.background='#111010'; this.style.borderColor='rgba(255,90,57,0.4)';">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#FF5A39;"></span>
            Technical Dossier →
          </a>
        `;
        content = content.replace('</body>', `${switcherHtml}</body>`);
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Presentation is compiling, please refresh shortly.');
      return;
    }
  }

  // 404 for any other path
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Rayamp Solar AI Visibility Server listening on port ${PORT}`);
});

export default server;
