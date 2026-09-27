const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const obs = require('../utils/obs_auth');

test('fixed renderer token validates without granting a user session', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spx-obs-auth-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'renderer-token');
  const token = crypto.randomBytes(32).toString('base64url');
  assert.equal(obs.readToken(file), null);
  fs.writeFileSync(file, `${token}\n`, { mode: 0o600 });
  assert.equal(obs.readToken(file), token);
  assert.equal(obs.matchesToken(token, obs.readToken(file)), true);
  assert.equal(obs.matchesToken(crypto.randomBytes(32).toString('base64url'), token), false);
  const now = Date.now();
  const session = { kind: 'renderer', issuedAt: now, tokenVersion: obs.fingerprint(token) };
  assert.equal(obs.validSession(session, token, now + 1000), true);
  assert.equal(obs.validSession(session, token, now + obs.SESSION_MS + 1), false);
  assert.equal(obs.validSession(session, crypto.randomBytes(32).toString('base64url'), now), false);
  assert.equal(obs.validSession({ ...session, kind: 'admin' }, token, now), false);
});

test('renderer token is limited to renderer assets and transport', () => {
  for (const uri of ['/renderer', '/renderer/', '/renderer/scalable', '/renderer?layers=1,2',
    '/renderer/js/socket.io.js',
    '/templates/custom/czgz-md3/CZ_BUG.html', '/templates/custom/czgz-md3/logos/%E6%A0%87%E5%BF%97.png',
    '/js/socket.io.js', '/css/renderer.css', '/img/logo.png']) {
    assert.equal(obs.rendererPathAllowed(uri, 'GET'), true, uri);
  }
  assert.equal(obs.rendererPathAllowed('/socket.io/?EIO=4&transport=polling', 'GET'), true);
  assert.equal(obs.rendererPathAllowed('/socket.io/?EIO=4&transport=polling', 'POST'), true);
  for (const uri of ['/gc/SCZ/1', '/api/studio/SCZ/1', '/auth/me', '/shows',
    '/templates/../api/studio/SCZ/1', '/templates/%2e%2e/api/studio/SCZ/1',
    '/templates/%252e%252e/api/studio/SCZ/1', '/templates/%2f..%2fapi/studio/SCZ/1']) {
    assert.equal(obs.rendererPathAllowed(uri, 'GET'), false, uri);
  }
  assert.equal(obs.rendererPathAllowed('/templates/custom/czgz-md3/CZ_BUG.html', 'POST'), false);
  assert.equal(obs.rendererPathAllowed('/renderer', 'DELETE'), false);
  assert.equal(obs.rendererSocketEventAllowed('SPXMessage2Server', { spxcmd: 'identifyClient', name: 'SPX_RENDERER' }), true);
  assert.equal(obs.rendererSocketEventAllowed('SPXMessage2Server', { spxcmd: 'saveToLog', level: 'error' }), false);
  assert.equal(obs.rendererSocketEventAllowed('SPXWebRendererMessage', { spxcmd: 'clearAllLayers' }), false);
});
