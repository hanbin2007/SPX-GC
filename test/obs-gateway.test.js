const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { upsertUser } = require('../utils/cloud_auth');

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function cookieHeader(response) {
  return response.headers.getSetCookie().map((entry) => entry.split(';')[0]).join('; ');
}

test('OBS token grants renderer access without granting controller access', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spx-obs-gateway-'));
  const token = crypto.randomBytes(32).toString('base64url');
  fs.writeFileSync(path.join(dir, 'signing-key'), crypto.randomBytes(48).toString('hex'));
  fs.writeFileSync(path.join(dir, 'renderer-token'), `${token}\n`);
  upsertUser(path.join(dir, 'users.json'), 'admin', 'a-long-test-password-01');
  const port = await freePort();
  const child = spawn(process.execPath, [path.join(__dirname, '../deploy/cloud/auth-gateway.js')], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, SPX_AUTH_DIR: dir, SPX_AUTH_TEST_HTTP: '1', SPX_AUTH_PORT: String(port) },
    stdio: 'ignore'
  });
  t.after(() => { child.kill('SIGTERM'); fs.rmSync(dir, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${port}`;
  let healthy = false;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { healthy = (await fetch(`${base}/health`)).ok; } catch (_) { /* starting */ }
    if (healthy) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.equal(healthy, true);
  const page = await fetch(`${base}/obs`);
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-security-policy'), /script-src 'self'/);
  assert.doesNotMatch(await page.text(), new RegExp(token));
  assert.equal((await fetch(`${base}/obs/scalable`)).status, 200);
  assert.equal((await fetch(`${base}/obs/bootstrap.js`)).status, 200);

  const bad = await fetch(`${base}/obs/authorize`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: crypto.randomBytes(32).toString('base64url') }) });
  assert.equal(bad.status, 401);
  const login = await fetch(`${base}/obs/authorize`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }) });
  assert.equal(login.status, 204);
  const cookie = cookieHeader(login);
  const check = (uri, method = 'GET') => fetch(`${base}/auth/check`, { headers: {
    Cookie: cookie, 'X-Original-URI': uri, 'X-Original-Method': method
  } });
  const renderer = await check('/renderer');
  assert.equal(renderer.status, 204);
  assert.equal(renderer.headers.get('x-spx-role'), 'renderer');
  assert.equal((await fetch(`${base}/auth/check`, { headers: { Cookie: cookie } })).status, 401);
  assert.equal((await check('/socket.io/?EIO=4', 'POST')).status, 204);
  assert.equal((await check('/api/studio/SCZ/1')).status, 401);
  assert.equal((await check('/templates/custom/czgz-md3/CZ_BUG.html', 'POST')).status, 401);
  assert.equal((await fetch(`${base}/auth/me`, { headers: { Cookie: cookie } })).status, 401);
  fs.writeFileSync(path.join(dir, 'renderer-token'), `${crypto.randomBytes(32).toString('base64url')}\n`);
  assert.equal((await check('/renderer')).status, 401);

  const admin = await fetch(`${base}/auth/login`, { method: 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: 'admin', password: 'a-long-test-password-01', next: '/' }) });
  assert.equal(admin.status, 303);
  const adminCheck = await fetch(`${base}/auth/check`, { headers: {
    Cookie: cookieHeader(admin), 'X-Original-URI': '/api/studio/SCZ/1', 'X-Original-Method': 'POST'
  } });
  assert.equal(adminCheck.status, 204);
  assert.equal(adminCheck.headers.get('x-spx-role'), 'admin');
});
