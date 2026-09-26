const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const studio = require('../utils/studio_store');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spx-studio-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dataDir = path.join(root, 'SCZ', 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, '1.json'), JSON.stringify({
    projectFormat: 'SPX',
    templates: [
      {
        itemID: 'agenda', description: 'Agenda', webplayout: '1', out: 'manual',
        DataFields: [
          { field: 'f0', title: 'Title', ftype: 'textfield', value: 'Original' },
          { field: 'f2', title: 'Items', ftype: 'textarea', value: 'Old item' }
        ]
      },
      {
        itemID: 'name', description: 'Name', webplayout: '2', out: 'manual',
        DataFields: [{ field: 'f0', title: 'Name', ftype: 'textfield', value: 'Old name' }]
      }
    ]
  }));
  return root;
}

test('multiple datasources retain separate rows and reject stale writes', (t) => {
  const root = fixture(t);
  const first = studio.saveSource('SCZ', '1', {
    name: 'Programme', columns: [{ key: 'time', title: 'Time' }, { key: 'content', title: 'Content' }],
    rows: [{ time: '08:30', content: 'Opening' }]
  }, 0, null, root);
  assert.equal(first.revision, 1);
  const second = studio.saveSource('SCZ', '1', {
    name: 'People', columns: [{ key: 'name', title: 'Name' }], rows: [{ name: 'Lin' }]
  }, 1, null, root);
  assert.equal(second.sources.length, 2);
  assert.notEqual(second.sources[0].id, second.sources[1].id);
  assert.throws(() => studio.saveSource('SCZ', '1', {
    name: 'Stale', columns: [{ key: 'text', title: 'Text' }], rows: []
  }, 1, null, root), (error) => error.status === 409);
  const archived = studio.archiveSource('SCZ', '1', first.sources[0].id, true, 2, root);
  assert.equal(archived.sources[0].archived, true);
  assert.equal(archived.sources[0].rows[0].content, 'Opening');
});

test('a range binding resolves rows into the existing SPX fields', (t) => {
  const root = fixture(t);
  const data = studio.saveSource('SCZ', '1', {
    name: 'Programme', columns: [
      { key: 'time', title: 'Time' }, { key: 'content', title: 'Content' }
    ],
    rows: [
      { time: '08:30', content: 'Opening' },
      { time: '08:40', content: 'Speech' },
      { time: '09:00', content: 'Awards' }
    ]
  }, 0, null, root);
  const binding = studio.saveBinding('SCZ', '1', 'agenda', {
    sourceId: data.sources[0].id, mode: 'range', rangeStart: 2, rangeEnd: 3,
    rangeField: 'f2', rangeTimeColumn: 'time', rangeTextColumn: 'content',
    fieldColumns: {}, manualValues: { f0: 'Today', f2: 'Fallback' },
    outputLayer: '1', out: 'manual'
  }, 0, root);
  assert.equal(binding.revision, 1);
  const result = studio.applyItemForPlayout('SCZ', '1', 'agenda', root);
  assert.equal(result.item.DataFields[0].value, 'Today');
  assert.equal(result.item.DataFields[1].value, '08:40 | Speech\n09:00 | Awards');
  assert.equal(studio.readState('SCZ', '1', root).items[0].DataFields[1].value,
    '08:40 | Speech\n09:00 | Awards');
});

test('single-row mapping and path validation', (t) => {
  const root = fixture(t);
  const data = studio.saveSource('SCZ', '1', {
    name: 'People', columns: [{ key: 'name', title: 'Name' }],
    rows: [{ name: 'Lin' }, { name: 'Wang' }]
  }, 0, null, root);
  studio.saveBinding('SCZ', '1', 'name', {
    sourceId: data.sources[0].id, mode: 'row', rowIndex: 1,
    fieldColumns: { f0: 'name' }, manualValues: { f0: 'Fallback' },
    outputLayer: '2', out: 'manual'
  }, 0, root);
  assert.equal(studio.applyItemForPlayout('SCZ', '1', 'name', root).item.DataFields[0].value, 'Wang');
  assert.throws(() => studio.readState('../SCZ', '1', root), (error) => error.status === 400);
});

test('archiving keeps existing datasource bindings playable', (t) => {
  const root = fixture(t);
  const data = studio.saveSource('SCZ', '1', {
    name: 'People', columns: [{ key: 'name', title: 'Name' }], rows: [{ name: 'Lin' }]
  }, 0, null, root);
  const id = data.sources[0].id;
  studio.saveBinding('SCZ', '1', 'name', {
    sourceId: id, mode: 'row', rowIndex: 0, fieldColumns: { f0: 'name' },
    manualValues: { f0: 'Fallback' }, outputLayer: '-', out: '3000'
  }, 0, root);
  studio.archiveSource('SCZ', '1', id, true, 1, root);
  const result = studio.applyItemForPlayout('SCZ', '1', 'name', root);
  assert.equal(result.item.DataFields[0].value, 'Lin');
  assert.equal(result.item.webplayout, '-');
  assert.equal(result.item.out, '3000');
});

test('a bug item cannot own datasource mapping for the project logo library', (t) => {
  const root = fixture(t);
  const file = path.join(root, 'SCZ', 'data', '1.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.templates.push({
    itemID: 'bug', relpath: '/custom/czgz-md3/CZ_BUG.html', webplayout: '4', out: 'manual',
    DataFields: [
      { field: 'f10', value: './logos/sczlogo.svg' },
      { field: 'f15', value: '1' },
      { field: 'f11', value: 'SCZ' },
      { field: 'f70', value: 'auto' }
    ]
  });
  fs.writeFileSync(file, JSON.stringify(data));
  const sources = studio.saveSource('SCZ', '1', {
    name: 'Logo groups', columns: [{ key: 'groups', title: 'Groups' }], rows: [{ groups: '2 4' }]
  }, 0, null, root);
  const base = {
    sourceId: sources.sources[0].id, mode: 'row', rowIndex: 0,
    fieldColumns: { f15: 'groups' },
    manualValues: { f10: './logos/sczlogo.svg', f15: '1', f11: 'SCZ', f70: 'manual' },
    outputLayer: '4', out: 'manual'
  };
  assert.throws(() => studio.saveBinding('SCZ', '1', 'bug', {
    ...base, fieldColumns: { f10: 'groups' }
  }, 0, root), (error) => error.status === 400);
  assert.throws(() => studio.saveBinding('SCZ', '1', 'bug', {
    ...base, mode: 'range'
  }, 0, root), (error) => error.status === 400);
  assert.throws(() => studio.saveBinding('SCZ', '1', 'bug', base, 0, root),
    (error) => error.status === 400);
  const saved = studio.saveBinding('SCZ', '1', 'bug', {
    ...base, sourceId: '', fieldColumns: {}
  }, 0, root);
  assert.equal(saved.items.bug.fieldColumns.f15, '');
  const result = studio.applyItemForPlayout('SCZ', '1', 'bug', root);
  assert.equal(result.item.DataFields.find((f) => f.field === 'f15').value, '1');
  assert.equal(result.item.DataFields.find((f) => f.field === 'f10').value, './logos/sczlogo.svg');
});

test('packaging group selection stays manual even with an old datasource mapping', (t) => {
  const item = {
    relpath: '/custom/czgz-md3/CZ_AGENDA.html', webplayout: '1',
    DataFields: [{ field: 'f4', title: '标志组', value: '1' }]
  };
  const sources = { sources: [{ id: 'source', columns: [{ key: 'groups', title: 'Groups' }],
    rows: [{ groups: '10' }] }] };
  assert.equal(studio.resolveItem(item, {
    sourceId: 'source', mode: 'row', rowIndex: 0,
    manualValues: { f4: '3' }, fieldColumns: { f4: 'groups' }
  }, sources).f4, '3');
});

test('project logo library is shared by rundowns and only group membership comes from data', (t) => {
  const root = fixture(t);
  const first = path.join(root, 'SCZ', 'data', '1.json');
  const data = JSON.parse(fs.readFileSync(first, 'utf8'));
  const bug = {
    itemID: 'bug', relpath: '/custom/czgz-md3/CZ_BUG.html', webplayout: '4', out: 'manual',
    DataFields: [
      { field: 'f0', value: 'live' }, { field: 'f10', value: './logos/old.png' },
      { field: 'f15', value: '1' }, { field: 'f11', value: 'Old' },
      { field: 'f70', value: 'auto' }, { field: 'f71', value: '8' }
    ]
  };
  data.templates.push(bug);
  fs.writeFileSync(first, JSON.stringify(data));
  fs.writeFileSync(path.join(root, 'SCZ', 'data', '2.json'), JSON.stringify({
    templates: [{ ...bug, itemID: 'other-bug', DataFields: bug.DataFields.map((field) => ({ ...field })) }]
  }));
  fs.writeFileSync(path.join(root, 'SCZ', 'data', '3.json'), JSON.stringify({ templates: [] }));
  const initial = studio.readState('SCZ', '1', root).logoLibrary;
  assert.equal(initial.version, 2);
  assert.equal(initial.logos[0].src, './logos/old.png');
  assert.equal(studio.readState('SCZ', '3', root).logoLibrary.logos[0].src, './logos/old.png');
  const sources = studio.saveSource('SCZ', '1', {
    name: 'Groups', columns: [{ key: 'groups', title: 'Groups' }], rows: [{ groups: '2 4' }]
  }, 0, null, root);
  assert.throws(() => studio.saveLogoLibrary('SCZ', '1', {
    ...initial, sourceId: sources.sources[0].id, groupColumns: { 'legacy-1': 'groups', f10: 'groups' }
  }, 0, root), (error) => error.status === 400);
  const next = studio.saveLogoLibrary('SCZ', '1', {
    ...initial, logos: [{ ...initial.logos[0], src: './logos/new.png', label: 'New' }],
    sourceId: sources.sources[0].id, groupColumns: { 'legacy-1': 'groups' }
  }, 0, root);
  assert.equal(next.revision, 1);
  assert.equal(next.groupColumns['legacy-1'], 'groups');
  assert.throws(() => studio.saveLogoLibrary('SCZ', '2', next, 0, root),
    (error) => error.status === 409);
  assert.equal(studio.readState('SCZ', '2', root).logoLibrary.logos[0].src, './logos/new.png');
  assert.equal(studio.readState('SCZ', '3', root).logoLibrary.logos[0].src, './logos/new.png');
  const played = studio.applyItemForPlayout('SCZ', '2', 'other-bug', root).item;
  const payload = studio.runtimeLogoLibraryFromFile(path.join(root, 'SCZ', 'data', '2.json'));
  assert.equal(payload.logos[0].src, './logos/new.png');
  assert.deepEqual(payload.logos[0].groups, ['2', '4']);
  assert.equal(played.DataFields.find((field) => field.field === 'f0').value, 'live');
  const expanded = studio.saveLogoLibrary('SCZ', '1', {
    ...next,
    groups: [...next.groups, ...['5', '6', '7', '8', '9', '10'].map((id) => ({
      id, name: `${id} 组`, mode: 'auto', interval: 8
    }))],
    logos: [...next.logos, ...Array.from({ length: 7 }, (_, index) => ({
      id: `extra-${index}`, src: `./logos/extra-${index}.png`, label: `Extra ${index}`,
      style: 'auto', scale: 1, dwell: '', groups: ['10']
    }))]
  }, 1, root);
  assert.equal(expanded.groups.length, 10);
  assert.equal(expanded.logos.length, 8);
  const many = studio.runtimeLogoLibraryFromFile(path.join(root, 'SCZ', 'data', '2.json'));
  assert.deepEqual(many.logos.at(-1).groups, ['10']);
  studio.saveSource('SCZ', '1', {
    ...sources.sources[0], rows: [{ ...sources.sources[0].rows[0], groups: '10' }]
  }, sources.revision, sources.sources[0].id, root);
  const exact = studio.runtimeLogoLibraryFromFile(path.join(root, 'SCZ', 'data', '2.json'));
  assert.deepEqual(exact.logos[0].groups, ['10']);
  assert.deepEqual(exact.logos.at(-1).groups, ['10']);
});
