const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');

test('renderer keeps the live iframe when a strap handles the next take', () => {
  const html = fs.readFileSync(path.join(root, 'views/view-renderer.handlebars'), 'utf8')
    .replaceAll('{{width}}', '1920px').replaceAll('{{height}}', '1080px');
  const dom = new JSDOM(html, { url: 'http://localhost/renderer/', runScripts: 'outside-only' });
  const listeners = {};
  dom.window.io = () => ({ on: (name, handler) => { listeners[name] = handler; }, emit() {} });
  const script = [...dom.window.document.scripts].find((node) => node.textContent.includes("socket.on('SPXMessage2Client'"));
  dom.window.eval(script.textContent);

  const frame = dom.window.document.getElementById('layer2');
  frame.src = '/templates/custom/czgz-md3/CZ_NAME.html';
  const before = frame.src;
  const calls = [];
  frame.contentWindow.CZStrapSwitch = (relpath, fields) => {
    calls.push({ relpath, fields: JSON.parse(fields) });
    return true;
  };

  listeners.SPXMessage2Client({
    spxcmd: 'playTemplate', webplayout: '2',
    relpath: 'custom/czgz-md3/CZ_CAPTION.html',
    fields: [{ f0: '栏目' }, { f1: '新标题' }, { f2: '副标题' }]
  });

  assert.equal(frame.src, before);
  assert.deepEqual(calls, [{
    relpath: 'custom/czgz-md3/CZ_CAPTION.html',
    fields: { f0: '栏目', f1: '新标题', f2: '副标题' }
  }]);

  frame.contentWindow.CZStrapSwitch = () => false;
  listeners.SPXMessage2Client({
    spxcmd: 'playTemplate', webplayout: '2',
    relpath: 'custom/czgz-md3/CZ_TICKER.html', fields: []
  });
  assert.match(frame.src, /CZ_TICKER\.html/);
});

test('live name strap switches to caption data without exiting', async () => {
  const dir = path.join(root, 'ASSETS/templates/custom/czgz-md3');
  const html = fs.readFileSync(path.join(dir, 'CZ_NAME.html'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/CZ_NAME.html', runScripts: 'outside-only' });
  const { window } = dom;
  let graphic;
  let exits = 0;
  window.CZ = {
    to: () => Promise.resolve(), set() {}, swap() {}, snap() {},
    fit: () => 100, current: (node) => node,
    M: { acc: (duration) => duration },
    bus: { watch() {} },
    followLogo: () => ({ setMode() {}, snapshot: () => ({}), restore() {} }),
    graphic: (definition) => { graphic = definition; return definition; }
  };
  window.eval(fs.readFileSync(path.join(dir, 'gfx/strap.js'), 'utf8'));
  window.CZStrap({
    defaults: { f0: '张明远', f1: '主持人', f2: '学生', f3: 'left', f4: '1' },
    model: (d) => ({ side: 'left', kicker: '', title: d.f0, tag: d.f2, sub: d.f1, logo: d.f4 })
  });
  window.update = (data) => graphic.render(JSON.parse(data), { animate: true });
  graphic.enter();
  const originalExit = graphic.exit;
  graphic.exit = () => { exits += 1; return originalExit(); };

  assert.equal(window.CZStrapSwitch('custom/czgz-md3/CZ_CAPTION.html', JSON.stringify({
    f0: '栏目', f1: '新标题', f2: '副标题', f3: '2'
  })), true);
  assert.equal(exits, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(graphic.snapshot().model)), {
    side: 'left', kicker: '栏目', title: '新标题', tag: '', sub: '副标题', logo: '2'
  });
  assert.equal(window.CZStrapSwitch('/custom/other/CZ_NAME.html', '{}'), false);

  assert.equal(window.CZStrapSwitch('custom/czgz-md3/CZ_NAME.html', JSON.stringify({
    f0: '李晓', f1: '教师', f2: '嘉宾', f3: 'right', f4: '3'
  })), true);
  await new Promise(setImmediate);
  assert.equal(exits, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(graphic.snapshot().model)), {
    side: 'right', kicker: '', title: '李晓', tag: '嘉宾', sub: '教师', logo: '3'
  });
});
