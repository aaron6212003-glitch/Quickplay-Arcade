const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const logs = [];

// 1. Logging server on port 8080
const logServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/log') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const logData = JSON.parse(body);
        logs.push(logData);
        console.log(`[BROWSER ${logData.type.toUpperCase()}]`, logData.message || logData);
        if (logData.stack) {
          console.log(logData.stack);
        }
      } catch (e) {
        console.error('Error parsing log body:', e);
      }
      res.writeHead(200);
      res.end('ok');
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

logServer.listen(8080, () => {
  console.log('Logging server running on http://localhost:8080');
});

// 2. Static file server on port 3000 (with console hijacking injection)
const staticServer = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  
  const filePath = path.join(__dirname, '..', urlPath);
  
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath);
  let contentType = 'text/plain';
  if (ext === '.html') contentType = 'text/html';
  else if (ext === '.js') contentType = 'application/javascript';
  else if (ext === '.css') contentType = 'text/css';
  else if (ext === '.json') contentType = 'application/json';

  res.setHeader('Content-Type', contentType);

  if (contentType === 'text/html' && urlPath.includes('locker.html')) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Inject console hijacking script inside <head>
    const injectScript = `
      <script>
        console.log("=== Console Hijack Initialized ===");
        window.onerror = function(msg, url, line, col, error) {
          fetch('http://localhost:8080/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'error', message: msg + " at " + url + ":" + line + ":" + col, stack: error ? error.stack : '' })
          });
        };
        window.addEventListener('unhandledrejection', function(event) {
          fetch('http://localhost:8080/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'promise-error', message: event.reason ? event.reason.message || String(event.reason) : 'Unhandled Rejection', stack: event.reason && event.reason.stack ? event.reason.stack : '' })
          });
        });
        const oldLog = console.log;
        console.log = function(...args) {
          oldLog(...args);
          fetch('http://localhost:8080/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'log', message: args.join(' ') })
          });
        };
        const oldError = console.error;
        console.error = function(...args) {
          oldError(...args);
          fetch('http://localhost:8080/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'console-error', message: args.join(' ') })
          });
        };
      </script>
    `;
    content = content.replace('<head>', '<head>' + injectScript);
    res.writeHead(200);
    res.end(content);
  } else {
    const stream = fs.createReadStream(filePath);
    res.writeHead(200);
    stream.pipe(res);
  }
});

staticServer.listen(3000, () => {
  console.log('App server running on http://localhost:3000');
  
  // 3. Launch headless Google Chrome
  console.log('Launching headless Chrome...');
  const chromeCmd = `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --no-sandbox http://localhost:3000/locker.html`;
  const chromeProcess = exec(chromeCmd);
  
  // Wait 6 seconds, then stop everything
  setTimeout(() => {
    console.log('Stopping servers...');
    chromeProcess.kill();
    logServer.close();
    staticServer.close();
    
    console.log('\n--- DIAGNOSTIC RESULTS ---');
    if (logs.length === 0) {
      console.log('No browser logs captured.');
    } else {
      console.log(`Captured ${logs.length} browser log entries.`);
    }
    process.exit(0);
  }, 6000);
});
