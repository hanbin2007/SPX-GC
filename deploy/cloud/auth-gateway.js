const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const cookieSession = require('cookie-session');
const Keygrip = require('keygrip');
const { engine } = require('express-handlebars');
const { safeNext, verifyPassword, readUsers, hashPassword } = require('../../utils/cloud_auth');

const authDir = process.env.SPX_AUTH_DIR;
if (!authDir) throw new Error('SPX_AUTH_DIR is required');
const usersFile = path.join(authDir, 'users.json');
const signingKey = fs.readFileSync(path.join(authDir, 'signing-key'), 'utf8').trim();
if (!/^[0-9a-f]{64,}$/.test(signingKey)) throw new Error('Invalid auth signing key');

const app = express();
const secureCookie = process.env.SPX_AUTH_TEST_HTTP !== '1';
const failures = new Map();
const dummyRecord = hashPassword(crypto.randomBytes(24).toString('hex'));
const SESSION_MS = 12 * 60 * 60 * 1000;

app.disable('x-powered-by');
app.set('trust proxy', 'loopback');
app.engine('handlebars', engine({ extname: '.handlebars' }));
app.set('view engine', 'handlebars');
app.set('views', path.resolve(__dirname, '../../views'));
app.use(cookieSession({
  name: secureCookie ? '__Host-spx_auth' : 'spx_auth_test',
  keys: new Keygrip([signingKey], 'SHA384', 'base64'),
  maxAge: SESSION_MS,
  path: '/',
  httpOnly: true,
  secure: secureCookie,
  sameSite: 'lax'
}));
app.use(express.urlencoded({ extended: false, limit: '4kb' }));
app.use(express.json({ limit: '4kb' }));

function currentUser(req) {
  const session = req.session;
  if (!session || typeof session.user !== 'string' ||
      !Number.isSafeInteger(session.issuedAt) ||
      Date.now() - session.issuedAt > SESSION_MS || session.issuedAt > Date.now() + 60000) return null;
  try {
    const record = readUsers(usersFile).users[session.user];
    return record && record.version === session.version ? session.user : null;
  } catch (_) {
    return null;
  }
}

function loginPage(req, res, options = {}) {
  res.set('Cache-Control', 'no-store');
  res.set('Content-Security-Policy', "default-src 'none'; style-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
  res.render('view-cloud-login', {
    layout: false,
    next: safeNext(options.next || req.query.next),
    username: options.username || '',
    error: options.error || null
  });
}

function loginKey(req) {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function isRateLimited(key) {
  const entry = failures.get(key);
  if (!entry) return false;
  if (entry.until <= Date.now()) { failures.delete(key); return false; }
  return entry.count >= 8;
}

function recordFailure(key) {
  const now = Date.now();
  const previous = failures.get(key);
  failures.set(key, previous && previous.until > now
    ? { count: previous.count + 1, until: previous.until }
    : { count: 1, until: now + 15 * 60 * 1000 });
  if (failures.size > 2048) {
    for (const [ip, entry] of failures) if (entry.until <= now) failures.delete(ip);
    if (failures.size > 2048) failures.clear();
  }
}

app.get('/health', (req, res) => res.sendStatus(200));
app.get('/auth/login.css', (req, res) => res.sendFile(path.resolve(__dirname, '../../static/css/cloud-login.css')));
app.get('/auth/logo.png', (req, res) => res.sendFile(path.resolve(__dirname, '../../static/img/spx_online.png')));

app.get('/login', (req, res) => {
  const next = safeNext(req.query.next);
  if (currentUser(req)) return res.redirect(302, next);
  return loginPage(req, res, { next });
});

app.post('/auth/login', (req, res) => {
  const key = loginKey(req);
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  const next = safeNext(req.body?.next);
  if (isRateLimited(key)) {
    return loginPage(req, res.status(429), { next, username, error: '尝试过于频繁，请稍后再试。' });
  }
  let record;
  try { record = readUsers(usersFile).users[username]; } catch (_) { return res.sendStatus(503); }
  const valid = password.length <= 200 && verifyPassword(password, record || dummyRecord);
  if (!record || !valid) {
    recordFailure(key);
    return loginPage(req, res.status(401), { next, username, error: '用户名或密码不正确。' });
  }
  failures.delete(key);
  req.session = { user: username, version: record.version, issuedAt: Date.now() };
  return res.redirect(303, next);
});

app.get('/auth/check', (req, res) => {
  res.set('Cache-Control', 'no-store');
  return res.sendStatus(currentUser(req) ? 204 : 401);
});

app.get('/auth/me', (req, res) => {
  const user = currentUser(req);
  res.set('Cache-Control', 'no-store');
  return user ? res.json({ user }) : res.sendStatus(401);
});

app.post('/auth/logout', (req, res) => {
  req.session = null;
  return res.redirect(303, '/login');
});

app.use((req, res) => res.sendStatus(404));

const port = Number(process.env.SPX_AUTH_PORT || 5659);
app.listen(port, '127.0.0.1', () => console.log(`SPX auth gateway listening on 127.0.0.1:${port}`));
