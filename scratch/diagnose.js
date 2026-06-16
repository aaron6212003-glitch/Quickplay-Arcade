const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../locker.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const virtualConsole = new VirtualConsole();
virtualConsole.on('log', (message) => {
  console.log('[CONSOLE LOG]', message);
});
virtualConsole.on('error', (message) => {
  console.error('[CONSOLE ERROR]', message);
});
virtualConsole.on('warn', (message) => {
  console.warn('[CONSOLE WARN]', message);
});

console.log('Loading locker.html inside JSDOM...');

const dom = new JSDOM(html, {
  url: `file://${htmlPath}`,
  runScripts: 'dangerously',
  resources: 'usable',
  virtualConsole
});

// Wait 5 seconds to let scripts load and execute
setTimeout(() => {
  console.log('JSDOM check finished.');
  process.exit(0);
}, 5000);
