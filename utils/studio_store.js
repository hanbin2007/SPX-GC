const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

class StudioError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const FIELD_ID = /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/;
const SOURCE_ID = /^[a-zA-Z0-9_-]{1,64}$/;
const BUG_GROUP_FIELDS = new Set(['f4', 'f15', 'f25', 'f35', 'f45', 'f55', 'f65']);
const BUG_LIBRARY_FIELDS = [
  'f4', 'f5',
  ...[1, 2, 3, 4, 5, 6].flatMap((n) => [`f${n}0`, `f${n}1`, `f${n}2`, `f${n}3`, `f${n}4`, `f${n}5`]),
  'f70', 'f71', 'f72', 'f73', 'f74', 'f75', 'f76', 'f77'
];
const LOGO_ID = /^[a-zA-Z0-9_-]{1,64}$/;
const GROUP_ID = /^[1-9][0-9]{0,63}$/;

function isLogoLibrary(item) {
  return /(?:^|\/)custom\/czgz-md3\/CZ_BUG\.html$/i.test(String(item.relpath || ''));
}

function groupFollowerField(item) {
  if (isLogoLibrary(item) || !/custom\/czgz-md3\//i.test(String(item.relpath || ''))) return null;
  return (item.DataFields || []).find((field) => field.field && String(field.title || '').startsWith('标志组'))?.field || null;
}

function safePart(value) {
  if (typeof value !== 'string' || !value || value.length > 120 || value === '.' ||
      value === '..' || /[/\\\0]/.test(value)) {
    throw new StudioError(400, 'Invalid project or rundown name');
  }
  return value;
}

function paths(project, rundown, dataroot = global.config?.general?.dataroot) {
  safePart(project);
  safePart(rundown);
  if (!dataroot) throw new StudioError(500, 'Data root is not configured');
  const projectDir = path.join(path.resolve(dataroot), project);
  const rundownFile = path.join(projectDir, 'data', `${rundown}.json`);
  if (!fs.existsSync(rundownFile)) throw new StudioError(404, 'Rundown not found');
  const studioDir = path.join(projectDir, '.studio');
  return {
    rundownFile,
    sourcesFile: path.join(studioDir, 'datasources.json'),
    bindingsFile: path.join(studioDir, `${rundown}.json`),
    logoLibraryFile: path.join(studioDir, 'logo-library.json')
  };
}

function readJSON(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
    fs.renameSync(temp, file);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

function readState(project, rundown, dataroot) {
  const files = paths(project, rundown, dataroot);
  const rundownData = readJSON(files.rundownFile, null);
  if (!Array.isArray(rundownData?.templates)) throw new StudioError(500, 'Invalid rundown');
  const sources = readJSON(files.sourcesFile, { version: 1, revision: 0, sources: [] });
  const bindings = readJSON(files.bindingsFile, { version: 1, revision: 0, items: {} });
  return {
    project,
    rundown,
    items: rundownData.templates,
    sources,
    bindings,
    logoLibrary: readLogoLibraryFrom(files, rundownData.templates, sources, bindings)
  };
}

function readLogoLibraryFrom(files, items, sources, bindings) {
  if (fs.existsSync(files.logoLibraryFile)) return migrateLogoLibrary(readJSON(files.logoLibraryFile, null));
  let bug = items.find(isLogoLibrary);
  if (!bug) {
    for (const name of fs.readdirSync(path.dirname(files.rundownFile)).filter((entry) => entry.endsWith('.json'))) {
      if (path.join(path.dirname(files.rundownFile), name) === files.rundownFile) continue;
      try {
        const candidate = readJSON(path.join(path.dirname(files.rundownFile), name), null)?.templates?.find(isLogoLibrary);
        if (!candidate) continue;
        bug = candidate;
        bindings = readJSON(path.join(path.dirname(files.bindingsFile), name), { items: {} });
        break;
      } catch (_) { /* skip unrelated invalid rundowns */ }
    }
  }
  if (!bug) return null;
  const binding = bindings.items[bug.itemID];
  const resolved = resolveItem(bug, binding, sources);
  const original = Object.fromEntries((bug.DataFields || []).filter((field) => field.field)
    .map((field) => [field.field, String(field.value ?? '')]));
  const values = {};
  const fieldColumns = {};
  for (const field of BUG_LIBRARY_FIELDS) {
    const column = BUG_GROUP_FIELDS.has(field) ? String(binding?.fieldColumns?.[field] || '') : '';
    fieldColumns[field] = column;
    values[field] = column ? String(binding?.manualValues?.[field] ?? original[field] ?? '')
      : String(resolved[field] ?? original[field] ?? '');
  }
  const hasMapping = [...BUG_GROUP_FIELDS].some((field) => fieldColumns[field]);
  return migrateLogoLibrary({
    version: 1, revision: 0, values, fieldColumns,
    sourceId: hasMapping ? String(binding?.sourceId || '') : '',
    rowIndex: hasMapping ? Number(binding?.rowIndex || 0) : 0
  });
}

function migrateLogoLibrary(library) {
  if (!library || library.version === 2) return library;
  const values = library.values || {};
  const legacyGroups = ['1', '2', '3', '4'];
  const membership = (value) => legacyGroups.filter((id) => String(value || '').includes(id));
  const groups = legacyGroups.map((id, index) => ({
    id, name: `${id} 组`, mode: values[`f${70 + index * 2}`] === 'manual' ? 'manual' : 'auto',
    interval: Math.max(3, Number(values[`f${71 + index * 2}`]) || 8)
  }));
  const logos = [];
  const groupColumns = { school: String(library.fieldColumns?.f4 || '') };
  for (let n = 1; n <= 6; n += 1) {
    const src = String(values[`f${n}0`] || '').trim();
    if (!src || src === '-' || src === 'none') continue;
    const id = `legacy-${n}`;
    logos.push({
      id, src, label: String(values[`f${n}1`] || ''), style: String(values[`f${n}2`] || 'auto'),
      scale: Number(values[`f${n}3`]) || 1, dwell: String(values[`f${n}4`] || ''),
      groups: membership(values[`f${n}5`])
    });
    groupColumns[id] = String(library.fieldColumns?.[`f${n}5`] || '');
  }
  return {
    version: 2, revision: Number(library.revision) || 0,
    groups, logos,
    school: { groups: membership(values.f4), dwell: String(values.f5 || '') },
    sourceId: String(library.sourceId || ''), rowIndex: Number(library.rowIndex) || 0,
    groupColumns
  };
}

function saveLogoLibrary(project, rundown, input, expectedRevision, dataroot) {
  const files = paths(project, rundown, dataroot);
  const data = readJSON(files.rundownFile, null);
  const sources = readJSON(files.sourcesFile, { version: 1, revision: 0, sources: [] });
  const bindings = readJSON(files.bindingsFile, { version: 1, revision: 0, items: {} });
  const current = readLogoLibraryFrom(files, data.templates, sources, bindings);
  if (!current) throw new StudioError(404, 'Logo library not found');
  expectRevision(current, expectedRevision);
  if (!input || input.version !== 2 || !Array.isArray(input.groups) || !input.groups.length ||
      !Array.isArray(input.logos) || !input.school || typeof input.school !== 'object') {
    throw new StudioError(400, 'Invalid logo library');
  }
  const groupIds = new Set();
  const groups = input.groups.map((group) => {
    const id = String(group.id || '');
    const name = String(group.name || '').trim();
    const interval = Number(group.interval);
    if (!GROUP_ID.test(id) || groupIds.has(id) || !name || name.length > 80 ||
        !['auto', 'manual'].includes(group.mode) || !Number.isFinite(interval) || interval < 3 || interval > 3600) {
      throw new StudioError(400, 'Invalid or duplicate logo group');
    }
    groupIds.add(id);
    return { id, name, mode: group.mode, interval };
  });
  const cleanGroups = (value) => {
    if (!Array.isArray(value) || value.some((id) => !groupIds.has(String(id)))) {
      throw new StudioError(400, 'Logo belongs to an unavailable group');
    }
    return [...new Set(value.map(String))];
  };
  const cleanDwell = (value) => {
    if (value === '' || value == null) return '';
    const n = Number(value);
    if (!Number.isFinite(n) || n < 3 || n > 3600) throw new StudioError(400, 'Invalid logo dwell time');
    return String(n);
  };
  const ids = new Set();
  const logos = input.logos.map((logo) => {
    const id = String(logo.id || '');
    const src = String(logo.src || '').trim();
    const label = String(logo.label || '');
    const scale = Number(logo.scale);
    if (!LOGO_ID.test(id) || ids.has(id) || src.length > 1000 || label.length > 100 ||
        !['auto', 'badge', 'plate'].includes(logo.style) || !Number.isFinite(scale) || scale < 0.2 || scale > 3) {
      throw new StudioError(400, 'Invalid or duplicate logo');
    }
    ids.add(id);
    return { id, src, label, style: logo.style, scale, dwell: cleanDwell(logo.dwell), groups: cleanGroups(logo.groups) };
  });
  const school = { groups: cleanGroups(input.school.groups), dwell: cleanDwell(input.school.dwell) };
  const sourceId = String(input.sourceId || '');
  const source = sourceId ? sources.sources.find((entry) => entry.id === sourceId) : null;
  if (sourceId && !source) throw new StudioError(400, 'Datasource is unavailable');
  const columnKeys = new Set(source?.columns.map((column) => column.key) || []);
  if (Object.entries(input.groupColumns || {}).some(([id, column]) => column && id !== 'school' && !ids.has(id))) {
    throw new StudioError(400, 'Only logo group membership may use a datasource');
  }
  const groupColumns = {};
  for (const id of ['school', ...ids]) {
    const column = String(input.groupColumns?.[id] || '');
    if (column && !columnKeys.has(column)) throw new StudioError(400, 'Mapped group column is unavailable');
    groupColumns[id] = column;
  }
  if (Object.values(groupColumns).some(Boolean) && !source?.rows.length) {
    throw new StudioError(400, 'Logo group datasource has no rows');
  }
  const rowIndex = Math.min(Math.max(0, (source?.rows.length || 1) - 1),
    Math.max(0, Number.parseInt(input.rowIndex, 10) || 0));
  const next = { version: 2, revision: current.revision + 1, groups, logos, school, sourceId, rowIndex, groupColumns };
  if (Buffer.byteLength(JSON.stringify(next)) > 2_000_000) throw new StudioError(400, 'Logo library exceeds 2 MB');
  writeJSON(files.logoLibraryFile, next);
  return next;
}

function resolveLogoLibrary(library, sources) {
  const resolved = structuredClone(migrateLogoLibrary(library));
  const source = sources.sources.find((entry) => entry.id === library.sourceId);
  if (!source) return resolved;
  const row = source.rows[library.rowIndex] || {};
  const names = new Map(resolved.groups.flatMap((group) => [[group.id, group.id], [group.name, group.id]]));
  const fromCell = (column) => [...new Set(String(row[column] ?? '').split(/[,，;；\n]+/).flatMap((part) => {
    const whole = part.trim();
    return names.has(whole) ? [names.get(whole)] : whole.split(/\s+/).map((token) => names.get(token)).filter(Boolean);
  }))];
  if (resolved.groupColumns.school) resolved.school.groups = fromCell(resolved.groupColumns.school);
  for (const logo of resolved.logos) {
    const column = resolved.groupColumns[logo.id];
    if (column) logo.groups = fromCell(column);
  }
  return resolved;
}

function runtimeLogoLibraryFromFile(rundownFile) {
  const projectDir = path.dirname(path.dirname(path.resolve(rundownFile)));
  const file = path.join(projectDir, '.studio', 'logo-library.json');
  if (!fs.existsSync(file)) return null;
  const library = migrateLogoLibrary(readJSON(file, null));
  const sources = readJSON(path.join(projectDir, '.studio', 'datasources.json'), { sources: [] });
  if (Object.values(library.groupColumns || {}).some(Boolean) &&
      !sources.sources.find((entry) => entry.id === library.sourceId)?.rows.length) {
    throw new StudioError(400, 'Logo group datasource has no rows');
  }
  return resolveLogoLibrary(library, sources);
}

function expectRevision(current, expected) {
  if (!Number.isInteger(expected) || current.revision !== expected) {
    throw new StudioError(409, 'Data changed elsewhere. Reload before saving.');
  }
}

function cleanSource(input, id) {
  if (!input || typeof input !== 'object') throw new StudioError(400, 'Invalid datasource');
  const name = String(input.name || '').trim();
  if (!name || name.length > 100) throw new StudioError(400, 'Datasource name must be 1-100 characters');
  if (!Array.isArray(input.columns) || input.columns.length < 1 || input.columns.length > 30) {
    throw new StudioError(400, 'Datasource must have 1-30 columns');
  }
  const keys = new Set();
  const columns = input.columns.map((column) => {
    const key = String(column.key || '');
    const title = String(column.title || '').trim();
    if (!FIELD_ID.test(key) || keys.has(key) || !title || title.length > 80) {
      throw new StudioError(400, 'Invalid or duplicate column');
    }
    keys.add(key);
    return { key, title };
  });
  if (!Array.isArray(input.rows) || input.rows.length > 5000) {
    throw new StudioError(400, 'Datasource is limited to 5000 rows');
  }
  const ids = new Set();
  const rows = input.rows.map((row) => {
    const rowId = typeof row._id === 'string' && SOURCE_ID.test(row._id) ? row._id : crypto.randomUUID();
    if (ids.has(rowId)) throw new StudioError(400, 'Duplicate row identifier');
    ids.add(rowId);
    const clean = { _id: rowId };
    for (const key of keys) {
      const value = String(row[key] ?? '');
      if (value.length > 10000) throw new StudioError(400, 'Cell exceeds 10000 characters');
      clean[key] = value;
    }
    return clean;
  });
  if (Buffer.byteLength(JSON.stringify(rows)) > 2_000_000) {
    throw new StudioError(400, 'Datasource exceeds 2 MB');
  }
  return { id, name, columns, rows, archived: Boolean(input.archived) };
}

function saveSource(project, rundown, input, expectedRevision, sourceId, dataroot) {
  const file = paths(project, rundown, dataroot).sourcesFile;
  const data = readJSON(file, { version: 1, revision: 0, sources: [] });
  expectRevision(data, expectedRevision);
  const existingIndex = sourceId ? data.sources.findIndex((source) => source.id === sourceId) : -1;
  if (sourceId && existingIndex < 0) throw new StudioError(404, 'Datasource not found');
  const id = sourceId || crypto.randomUUID();
  const source = cleanSource(input, id);
  if (existingIndex >= 0) data.sources[existingIndex] = source;
  else data.sources.push(source);
  data.revision += 1;
  writeJSON(file, data);
  return data;
}

function archiveSource(project, rundown, sourceId, archived, expectedRevision, dataroot) {
  const file = paths(project, rundown, dataroot).sourcesFile;
  const data = readJSON(file, { version: 1, revision: 0, sources: [] });
  expectRevision(data, expectedRevision);
  const source = data.sources.find((entry) => entry.id === sourceId);
  if (!source) throw new StudioError(404, 'Datasource not found');
  source.archived = Boolean(archived);
  data.revision += 1;
  writeJSON(file, data);
  return data;
}

function cleanBinding(input, item, sources) {
  if (!input || typeof input !== 'object') throw new StudioError(400, 'Invalid item configuration');
  const validFields = new Set((item.DataFields || []).filter((field) =>
    field.ftype !== 'hidden' && FIELD_ID.test(field.field || '')).map((field) => field.field));
  const sourceId = String(input.sourceId || '');
  if (sourceId && isLogoLibrary(item)) {
    throw new StudioError(400, 'Configure logo group datasource in the project logo library');
  }
  const source = sourceId ? sources.sources.find((entry) => entry.id === sourceId) : null;
  if (sourceId && !source) throw new StudioError(400, 'Datasource is unavailable');
  const columnKeys = new Set(source?.columns.map((column) => column.key) || []);
  const fieldColumns = {};
  const manualValues = {};
  for (const field of validFields) {
    const column = String(input.fieldColumns?.[field] || '');
    if (column && !columnKeys.has(column)) throw new StudioError(400, 'Mapped column is unavailable');
    if (column && (isLogoLibrary(item) || field === groupFollowerField(item))) {
      throw new StudioError(400, 'Configure logo group datasource in the project logo library');
    }
    fieldColumns[field] = column;
    const value = String(input.manualValues?.[field] ?? '');
    if (value.length > 10000) throw new StudioError(400, 'Manual value is too long');
    manualValues[field] = value;
  }
  const mode = input.mode === 'range' ? 'range' : 'row';
  if (isLogoLibrary(item) && mode !== 'row') throw new StudioError(400, 'Logo groups require a single datasource row');
  const rangeField = String(input.rangeField || '');
  if (isLogoLibrary(item) && (rangeField || input.rangeTextColumn || input.rangeTimeColumn)) {
    throw new StudioError(400, 'Logo groups do not support range mapping');
  }
  if (rangeField && !validFields.has(rangeField)) throw new StudioError(400, 'Invalid range field');
  const rangeTextColumn = String(input.rangeTextColumn || '');
  const rangeTimeColumn = String(input.rangeTimeColumn || '');
  if ((rangeTextColumn && !columnKeys.has(rangeTextColumn)) ||
      (rangeTimeColumn && !columnKeys.has(rangeTimeColumn))) {
    throw new StudioError(400, 'Range column is unavailable');
  }
  const rowCount = Math.max(1, source?.rows.length || 1);
  const rowIndex = Math.min(rowCount - 1, Math.max(0, Number.parseInt(input.rowIndex, 10) || 0));
  const rangeStart = Math.min(rowCount, Math.max(1, Number.parseInt(input.rangeStart, 10) || 1));
  const rangeEnd = Math.min(rowCount, Math.max(rangeStart, Number.parseInt(input.rangeEnd, 10) || rangeStart));
  const outputLayer = String(input.outputLayer || item.webplayout || '1');
  if (!/^([1-5]|-)$/.test(outputLayer)) throw new StudioError(400, 'Output layer must be 1-5 or off');
  const out = String(input.out || 'manual');
  if (!['manual', 'none'].includes(out) && (!/^\d+$/.test(out) || Number(out) > 3600000)) {
    throw new StudioError(400, 'Invalid auto-out duration');
  }
  return {
    sourceId, mode, rowIndex, rangeStart, rangeEnd,
    rangeField, rangeTextColumn, rangeTimeColumn,
    fieldColumns, manualValues, outputLayer, out
  };
}

function saveBinding(project, rundown, itemId, input, expectedRevision, dataroot) {
  const files = paths(project, rundown, dataroot);
  const rundownData = readJSON(files.rundownFile, null);
  const item = rundownData.templates.find((entry) => String(entry.itemID) === String(itemId));
  if (!item) throw new StudioError(404, 'Rundown item not found');
  const bindings = readJSON(files.bindingsFile, { version: 1, revision: 0, items: {} });
  expectRevision(bindings, expectedRevision);
  const sources = readJSON(files.sourcesFile, { version: 1, revision: 0, sources: [] });
  bindings.items[itemId] = cleanBinding(input, item, sources);
  bindings.revision += 1;
  writeJSON(files.bindingsFile, bindings);
  return bindings;
}

function resolveItem(item, binding, sources) {
  const values = Object.fromEntries((item.DataFields || []).filter((field) => field.field).map((field) => [field.field, String(field.value ?? '')]));
  if (!binding) return values;
  Object.assign(values, binding.manualValues || {});
  const source = sources.sources.find((entry) => entry.id === binding.sourceId);
  if (!source) return values;
  const firstRow = source.rows[binding.mode === 'range' ? binding.rangeStart - 1 : binding.rowIndex] || {};
  for (const [field, column] of Object.entries(binding.fieldColumns || {})) {
    if (column && field !== groupFollowerField(item)) values[field] = String(firstRow[column] ?? '');
  }
  if (binding.mode === 'range' && binding.rangeField && binding.rangeTextColumn) {
    values[binding.rangeField] = source.rows.slice(binding.rangeStart - 1, binding.rangeEnd).map((row) => {
      const text = String(row[binding.rangeTextColumn] ?? '').trim();
      const time = binding.rangeTimeColumn ? String(row[binding.rangeTimeColumn] ?? '').trim() : '';
      return time && text ? `${time} | ${text}` : (text || time);
    }).filter(Boolean).join('\n');
  }
  return values;
}

function applyItemForPlayout(project, rundown, itemId, dataroot) {
  const files = paths(project, rundown, dataroot);
  const data = readJSON(files.rundownFile, null);
  const item = data.templates.find((entry) => String(entry.itemID) === String(itemId));
  if (!item) throw new StudioError(404, 'Rundown item not found');
  if (!Array.isArray(item.DataFields)) throw new StudioError(400, 'Rundown item has no editable data');
  const sources = readJSON(files.sourcesFile, { version: 1, revision: 0, sources: [] });
  const bindings = readJSON(files.bindingsFile, { version: 1, revision: 0, items: {} });
  const binding = bindings.items[itemId];
  const source = binding?.sourceId ? sources.sources.find((entry) => entry.id === binding.sourceId) : null;
  if (binding?.sourceId && !source?.rows.length) {
    throw new StudioError(400, 'Datasource has no rows');
  }
  const values = resolveItem(item, binding, sources);
  if (binding?.mode === 'range' && binding.rangeField && !values[binding.rangeField]) {
    throw new StudioError(400, 'Selected range has no content');
  }
  for (const field of item.DataFields) {
    if (field.field && Object.hasOwn(values, field.field)) field.value = values[field.field];
  }
  if (binding) {
    item.webplayout = binding.outputLayer;
    item.out = binding.out;
  }
  data.updated = new Date().toISOString();
  writeJSON(files.rundownFile, data);
  return {
    item,
    file: files.rundownFile,
    fields: Object.entries(values).map(([field, value]) => ({ field, value }))
  };
}

module.exports = {
  StudioError, paths, readState, saveSource, archiveSource, isLogoLibrary,
  saveBinding, resolveItem, applyItemForPlayout, saveLogoLibrary, resolveLogoLibrary,
  migrateLogoLibrary, runtimeLogoLibraryFromFile
};
