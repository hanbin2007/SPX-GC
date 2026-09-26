const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assets = require('../utils/studio_logo_assets');

test('logo uploads are validated and stored outside the application tree', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spx-logos-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const png = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.alloc(8)]);
  assert.throws(() => assets.upload('bad.svg', 'image/svg+xml', Buffer.from('<svg/>'), root),
    (error) => error.status === 400);
  assert.throws(() => assets.upload('bad.png', 'image/png', Buffer.from('not an image'), root),
    (error) => error.status === 400);
  const saved = assets.upload('../My Logo.png', 'image/png', png, root);
  assert.match(saved.name, /^My-Logo-[a-f0-9]{8}\.png$/);
  assert.equal(saved.value, `./logos/${saved.name}`);
  assert.ok(fs.existsSync(path.join(assets.uploadDir(root), saved.name)));
  assert.ok(assets.list(root).some((entry) => entry.value === saved.value));
  assert.ok(assets.list(root).some((entry) => entry.name === 'sczlogo.svg'));
});
