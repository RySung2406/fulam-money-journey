import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { context } from 'esbuild';

const root = fileURLToPath(new URL('../site/', import.meta.url));
const base = '/fulin-money-journey/';
const host = '127.0.0.1';
const args = process.argv.slice(2);
let portText = process.env.PORT || '5173';
for (let index = 0; index < args.length; index += 1) {
  if (args[index] === '--port' && args[index + 1]) portText = args[++index];
  else if (args[index].startsWith('--port=')) portText = args[index].slice(7);
  else {
    console.error('Usage: npm run dev -- [--port 5173]');
    process.exit(1);
  }
}
const port = Number(portText);
if (!/^\d+$/.test(portText) || !Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Choose a port from 1 to 65535 with --port or PORT.');
  process.exit(1);
}

const generated = new Map();
const builds = [];
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

function insideSite(path) {
  const child = relative(root, path);
  return child !== '..' && !child.startsWith(`..${sep}`) && !isAbsolute(child);
}

const server = createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  const send = (status, text, headers = {}) => {
    response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', ...headers });
    response.end(request.method === 'HEAD' ? undefined : text);
  };
  if (!['GET', 'HEAD'].includes(request.method)) {
    send(405, 'Method not allowed', { Allow: 'GET, HEAD' });
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent((request.url || '/').split('?')[0]);
  } catch {
    send(400, 'Invalid URL');
    return;
  }
  if (!pathname.startsWith('/') || pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').includes('..')) {
    send(400, 'Invalid path');
    return;
  }
  if (pathname === '/' || pathname === base.slice(0, -1)) {
    send(302, `Open ${base}`, { Location: base });
    return;
  }
  if (!pathname.startsWith(base)) {
    send(404, 'Not found');
    return;
  }
  let target = resolve(root, pathname.slice(base.length));
  if (!insideSite(target)) {
    send(404, 'Not found');
    return;
  }
  try {
    let data = generated.get(target);
    if (!data) {
      target = await realpath(target);
      if (!insideSite(target)) { send(404, 'Not found'); return; }
      if ((await stat(target)).isDirectory()) {
        if (!pathname.endsWith('/')) {
          send(302, 'Open directory index', { Location: `${encodeURI(pathname)}/` });
          return;
        }
        target = await realpath(join(target, 'index.html'));
        if (!insideSite(target)) { send(404, 'Not found'); return; }
      }
      data = await readFile(target);
    }
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(target).toLowerCase()] || 'application/octet-stream',
      'Content-Length': data.byteLength
    });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch (error) {
    if (['ENOENT', 'ENOTDIR', 'EACCES', 'EPERM'].includes(error.code)) send(404, 'Not found');
    else { console.error('Could not serve request:', error.message); send(500, 'Could not serve file'); }
  }
});

let stopping = false;
async function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  server.close();
  server.closeAllConnections();
  await Promise.all(builds.map((build) => build.dispose()));
  process.exitCode = exitCode;
}
process.once('SIGINT', () => void stop());
process.once('SIGTERM', () => void stop());

console.log('Starting Fulin development server...');
try {
  for (const [entry, output] of [['app.js', 'app.bundle.js'], ['game-auth.js', 'game/auth.bundle.js']]) {
    const build = await context({
      entryPoints: [join(root, entry)],
      outfile: join(root, output),
      bundle: true,
      write: false,
      format: 'iife',
      platform: 'browser',
      target: ['es2020'],
      minify: true,
      legalComments: 'linked',
      define: { 'process.env.NODE_ENV': '"production"' },
      logLevel: 'warning',
      plugins: [{ name: 'local-bundles', setup(builder) {
        builder.onEnd((result) => {
          if (!result.errors.length) {
            for (const file of result.outputFiles || []) generated.set(resolve(file.path), file.contents);
          }
        });
      } }]
    });
    builds.push(build);
    await build.rebuild();
    await build.watch();
  }
  server.once('error', async (error) => {
    console.error(error.code === 'EADDRINUSE'
      ? `Port ${port} is already in use. Try npm run dev -- --port ${port === 65535 ? 5173 : port + 1}.`
      : `Could not start the development server: ${error.message}`);
    await stop(1);
  });
  server.listen(port, host, () => {
    console.log(`Fulin development server ready: http://${host}:${port}${base}`);
    console.log('JavaScript rebuilds automatically. Refresh the browser after edits. Press Ctrl+C to stop.');
    console.log('Database: site/config.js connects to the existing hosted Supabase project.');
  });
} catch (error) {
  console.error(`Could not build the website: ${error.message}`);
  await stop(1);
}
