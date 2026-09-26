const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const auth = require('../utils/cloud_auth');

test('password records are salted, verified and invalidated by rotation', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spx-auth-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'users.json');
  const firstVersion = auth.upsertUser(file, 'admin', 'a-long-test-password-01');
  const first = auth.readUsers(file).users.admin;
  assert.ok(auth.verifyPassword('a-long-test-password-01', first));
  assert.equal(auth.verifyPassword('wrong-password', first), false);
  assert.notEqual(first.hash, 'a-long-test-password-01');
  const secondVersion = auth.upsertUser(file, 'admin', 'a-long-test-password-02');
  const second = auth.readUsers(file).users.admin;
  assert.notEqual(firstVersion, secondVersion);
  assert.notEqual(first.salt, second.salt);
  assert.equal(auth.verifyPassword('a-long-test-password-01', second), false);
  assert.ok(auth.verifyPassword('a-long-test-password-02', second));
  assert.equal(fs.statSync(file).mode & 0o777, 0o600);
});

test('post-login redirects stay on the same origin', () => {
  assert.equal(auth.safeNext('/gc/SCZ/1'), '/gc/SCZ/1');
  assert.equal(auth.safeNext('//evil.example'), '/');
  assert.equal(auth.safeNext('https://evil.example'), '/');
  assert.equal(auth.safeNext('/\\evil.example'), '/');
  assert.equal(auth.safeNext('/gc\nSet-Cookie: x'), '/');
});
