const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const USERNAME = /^[a-zA-Z0-9._-]{1,64}$/;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function safeNext(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') ||
      /[\\\r\n]/.test(value) || value.length > 1000) return '/';
  return value;
}

function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 16 || password.length > 200) {
    throw new Error('Password must be 16-200 characters');
  }
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, SCRYPT_OPTIONS);
  return {
    salt: salt.toString('hex'),
    hash: hash.toString('hex'),
    version: crypto.randomUUID()
  };
}

function verifyPassword(password, record) {
  if (typeof password !== 'string' || password.length > 200 ||
      !record || !/^[0-9a-f]{32}$/.test(record.salt || '') ||
      !/^[0-9a-f]{128}$/.test(record.hash || '')) return false;
  const candidate = crypto.scryptSync(password, Buffer.from(record.salt, 'hex'), 64, SCRYPT_OPTIONS);
  return crypto.timingSafeEqual(candidate, Buffer.from(record.hash, 'hex'));
}

function readUsers(file) {
  if (!fs.existsSync(file)) return { version: 1, users: {} };
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!parsed || parsed.version !== 1 || !parsed.users || typeof parsed.users !== 'object') {
    throw new Error('Invalid auth users file');
  }
  return parsed;
}

function upsertUser(file, username, password) {
  if (!USERNAME.test(username || '')) throw new Error('Invalid username');
  const data = readUsers(file);
  data.users[username] = hashPassword(password);
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const temp = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
    fs.renameSync(temp, file);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
  return data.users[username].version;
}

module.exports = { safeNext, hashPassword, verifyPassword, readUsers, upsertUser };
