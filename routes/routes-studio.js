const express = require('express');
const studio = require('../utils/studio_store');
const spxAuth = require('../utils/spx_auth');
const appRoutes = require('./routes-application');
const logoAssets = require('../utils/studio_logo_assets');

const router = express.Router();
const actionQueues = new Map();
router.use(spxAuth.CheckLogin);

function run(handler) {
  return (req, res) => {
    Promise.resolve().then(() => handler(req, res)).catch((error) => {
      if (!(error instanceof studio.StudioError)) console.error('Studio API error:', error);
      if (!res.headersSent) res.status(error.status || 500).json({ error: error.status ? error.message : 'Studio request failed' });
    });
  };
}

function enqueue(key, task) {
  const next = (actionQueues.get(key) || Promise.resolve()).catch(() => {}).then(task);
  const finished = next.finally(() => {
    if (actionQueues.get(key) === finished) actionQueues.delete(key);
  });
  actionQueues.set(key, finished);
  return finished;
}

router.get('/:project/:rundown', run((req, res) => {
  const state = studio.readState(req.params.project, req.params.rundown);
  const file = studio.paths(req.params.project, req.params.rundown).rundownFile;
  const live = new Set(global.studioOnAir?.values() || []);
  state.items = state.items.map((item) => ({
    ...item,
    onair: item.onair === 'true' && live.has(`${file}#${item.itemID}`) ? 'true' : 'false'
  }));
  res.json(state);
}));

function requireLogoLibrary(req) {
  const state = studio.readState(req.params.project, req.params.rundown);
  if (!state.logoLibrary) throw new studio.StudioError(404, 'Logo library not found');
}

router.get('/:project/:rundown/logos', run((req, res) => {
  requireLogoLibrary(req);
  res.json({ logos: logoAssets.list() });
}));

router.get('/:project/:rundown/logo-library', run((req, res) => {
  const library = studio.readState(req.params.project, req.params.rundown).logoLibrary;
  if (!library) throw new studio.StudioError(404, 'Logo library not found');
  res.json(library);
}));

router.put('/:project/:rundown/logo-library', run((req, res) => {
  res.json(studio.saveLogoLibrary(req.params.project, req.params.rundown,
    req.body.library, req.body.revision));
}));

router.post('/:project/:rundown/logos', express.raw({ type: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'], limit: '5mb' }), run((req, res) => {
  requireLogoLibrary(req);
  const name = String(req.query.name || 'logo');
  res.status(201).json(logoAssets.upload(name, req.get('content-type')?.split(';')[0], req.body));
}));

router.post('/:project/:rundown/sources', run((req, res) => {
  const result = studio.saveSource(req.params.project, req.params.rundown,
    req.body.source, req.body.revision);
  res.status(201).json(result);
}));

router.put('/:project/:rundown/sources/:sourceId', run((req, res) => {
  const result = studio.saveSource(req.params.project, req.params.rundown,
    req.body.source, req.body.revision, req.params.sourceId);
  res.json(result);
}));

router.post('/:project/:rundown/sources/:sourceId/archive', run((req, res) => {
  const result = studio.archiveSource(req.params.project, req.params.rundown,
    req.params.sourceId, req.body.archived, req.body.revision);
  res.json(result);
}));

router.put('/:project/:rundown/items/:itemId', run((req, res) => {
  const result = studio.saveBinding(req.params.project, req.params.rundown,
    req.params.itemId, req.body.binding, req.body.revision);
  res.json(result);
}));

router.post('/:project/:rundown/items/:itemId/action', run((req, res) => {
  const { project, rundown, itemId } = req.params;
  return enqueue(`${project}/${rundown}`, () => {
    const action = req.body.action;
    if (!['play', 'stop', 'update', 'next'].includes(action)) {
      throw new studio.StudioError(400, 'Invalid playout action');
    }
    const state = studio.readState(project, rundown);
    const item = state.items.find((entry) => String(entry.itemID) === itemId);
    if (!item) throw new studio.StudioError(404, 'Rundown item not found');
    if (!Array.isArray(item.DataFields)) throw new studio.StudioError(400, 'Rundown item has no editable data');
    const resolved = ['play', 'update'].includes(action)
      ? studio.applyItemForPlayout(project, rundown, itemId)
      : { item, file: studio.paths(project, rundown).rundownFile, fields: [] };
    req.body = {
      command: action === 'play' && resolved.item.out === 'none' ? 'playonce' : action,
      epoch: itemId,
      datafile: resolved.file,
      fields: resolved.fields,
      forceFileReadOnce: true
    };
    return Promise.resolve(appRoutes.handlePlayout(req, res)).then(() => {
      if (res.statusCode >= 400) return;
      global.studioOnAir ||= new Map();
      const output = resolved.item.webplayout !== '-'
        ? `web:${resolved.item.webplayout}`
        : `ccg:${resolved.item.playserver}/${resolved.item.playchannel}/${resolved.item.playlayer}`;
      const ref = `${resolved.file}#${itemId}`;
      const hasOutput = resolved.item.webplayout !== '-' ||
        (resolved.item.playserver && resolved.item.playserver !== '-');
      if (action === 'play' && resolved.item.out !== 'none' && hasOutput) {
        global.studioOnAir.set(output, ref);
        if (/^\d+$/.test(resolved.item.out)) {
          const timer = setTimeout(() => {
            if (global.studioOnAir.get(output) === ref) global.studioOnAir.delete(output);
          }, Number(resolved.item.out) + 100);
          timer.unref();
        }
      }
      if (action === 'stop' && global.studioOnAir.get(output) === ref) global.studioOnAir.delete(output);
    });
  });
}));

module.exports = router;
