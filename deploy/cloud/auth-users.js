const path = require('node:path');
const { upsertUser } = require('../../utils/cloud_auth');

const username = process.argv[2];
const authDir = process.env.SPX_AUTH_DIR;
if (!username || !authDir) {
  console.error('Usage: SPX_AUTH_DIR=/path node deploy/cloud/auth-users.js USERNAME < password-stdin');
  process.exit(2);
}

(async () => {
  let password = '';
  for await (const chunk of process.stdin) password += chunk;
  password = password.replace(/\r?\n$/, '');
  upsertUser(path.join(authDir, 'users.json'), username, password);
  console.log(`Account ${username} saved. Existing sessions for this account are revoked.`);
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
