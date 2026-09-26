const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const output = process.argv[2];
if (!output) {
  console.error('Usage: node deploy/cloud/make-config.js OUTPUT');
  process.exit(2);
}

const source = path.resolve(__dirname, '../../config.json');
const config = JSON.parse(fs.readFileSync(source, 'utf8'));

config.general = {
  ...config.general,
  hostname: 'SPX-CLOUD-SHENZHEN',
  username: '',
  password: '',
  apikey: crypto.randomBytes(32).toString('hex'),
  showusercommapass: '',
  dataroot: '/opt/ographic-spx/data/',
  logfolder: '/opt/ographic-spx/log/',
  port: 5658,
  templatesource: 'spx-ip-address',
  launchBrowser: false,
  recents: []
};
config.casparcg = { servers: [] };
config.osc = { ...config.osc, enable: false };
config.updated = new Date().toISOString();

fs.writeFileSync(output, `${JSON.stringify(config, null, 2)}\n`, {
  encoding: 'utf8',
  mode: 0o600,
  flag: 'wx'
});
