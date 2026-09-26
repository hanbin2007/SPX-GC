const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { StudioError } = require('./studio_store');

const PUBLIC_PATH = '/templates/custom/czgz-md3/logos';
const TEMPLATE_DIR = path.join(__dirname, '..', 'ASSETS', 'templates', 'custom', 'czgz-md3', 'logos');
const EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);
const UPLOAD_TYPES = new Map([
  ['image/png', '.png'], ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'], ['image/gif', '.gif']
]);

function uploadDir(dataroot = global.config?.general?.dataroot) {
  if (!dataroot) throw new StudioError(500, 'Data root is not configured');
  return path.join(path.resolve(dataroot), '.studio', 'logo-assets', 'czgz-md3');
}

function validImage(buffer, type) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12 || buffer.length > 5_000_000) return false;
  if (type === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
  if (type === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (type === 'image/webp') return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (type === 'image/gif') return ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6));
  return false;
}

function list(dataroot) {
  const uploaded = uploadDir(dataroot);
  const entries = new Map();
  for (const dir of [TEMPLATE_DIR, uploaded]) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!file.isFile() || !EXTENSIONS.has(path.extname(file.name).toLowerCase())) continue;
      entries.set(file.name, {
        name: file.name,
        value: `./logos/${file.name}`,
        url: `${PUBLIC_PATH}/${encodeURIComponent(file.name)}`
      });
    }
  }
  return [...entries.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
}

function upload(originalName, type, bytes, dataroot) {
  const extension = UPLOAD_TYPES.get(type);
  if (!extension || !validImage(bytes, type)) throw new StudioError(400, 'Only PNG, JPEG, WebP, or GIF images up to 5 MB are supported');
  const base = path.basename(String(originalName || 'logo'), path.extname(String(originalName || '')))
    .normalize('NFKC').replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'logo';
  const filename = `${base}-${crypto.randomBytes(4).toString('hex')}${extension}`;
  const dir = uploadDir(dataroot);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), bytes, { flag: 'wx', mode: 0o644 });
  return { name: filename, value: `./logos/${filename}`, url: `${PUBLIC_PATH}/${encodeURIComponent(filename)}` };
}

module.exports = { uploadDir, list, upload };
