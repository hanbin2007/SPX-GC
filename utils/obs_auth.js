const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;
const SESSION_MS = 365 * 24 * 60 * 60 * 1000;

function readToken(file) {
  try {
    const token = fs.readFileSync(file, 'utf8').trim();
    return TOKEN_PATTERN.test(token) ? token : null;
  } catch (_) { return null; }
}

function fingerprint(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function matchesToken(candidate, expected) {
  if (typeof candidate !== 'string' || !TOKEN_PATTERN.test(candidate) || !expected) return false;
  return crypto.timingSafeEqual(
    crypto.createHash('sha256').update(candidate).digest(),
    crypto.createHash('sha256').update(expected).digest()
  );
}

function validSession(session, token, now = Date.now()) {
  if (!token || session?.kind !== 'renderer' || !Number.isSafeInteger(session.issuedAt) ||
      session.issuedAt > now + 60000 || now - session.issuedAt > SESSION_MS ||
      !/^[0-9a-f]{64}$/.test(session.tokenVersion || '')) return false;
  return crypto.timingSafeEqual(
    Buffer.from(session.tokenVersion, 'hex'), Buffer.from(fingerprint(token), 'hex')
  );
}

function rendererPathAllowed(uri, method) {
  if (typeof uri !== 'string' || uri.length > 4096 || uri.includes('#') ||
      !['GET', 'HEAD', 'POST'].includes(method)) return false;
  const rawPath = uri.split('?')[0];
  let pathname;
  try { pathname = decodeURIComponent(rawPath); } catch (_) { return false; }
  if (!pathname.startsWith('/') || pathname.includes('\\') || pathname.includes('\0') ||
      pathname.includes('%') || pathname.includes('//') ||
      pathname.split('/').some((part) => part === '.' || part === '..') ||
      path.posix.normalize(pathname) !== pathname) return false;
  if (pathname === '/socket.io' || pathname === '/socket.io/') return method === 'GET' || method === 'POST';
  if (method !== 'GET' && method !== 'HEAD') return false;
  return ['/renderer', '/renderer/', '/renderer/index.html', '/renderer/scalable', '/renderer/scalable/'].includes(pathname) ||
    ['/templates/', '/js/', '/css/', '/img/', '/vendor/'].some((prefix) => pathname.startsWith(prefix));
}

function rendererSocketEventAllowed(event, data) {
  return event === 'SPXMessage2Server' && data?.spxcmd === 'identifyClient' &&
    ['SPX_RENDERER', 'SPX_PREVIEW', 'SPX_PROGRAM'].includes(data.name);
}

module.exports = {
  TOKEN_PATTERN, SESSION_MS, readToken, fingerprint, matchesToken, validSession,
  rendererPathAllowed, rendererSocketEventAllowed
};
