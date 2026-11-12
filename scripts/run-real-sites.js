'use strict';

// Runs each feature in tests/features/real-sites/ against the public site named
// by the file (`huble.com.feature` runs with LAUNCH_URL=https://huble.com).
// These checks are read-only and tagged @real-site, so the default run leaves
// them out. Run them with `npm run test:real-sites`; pass file names to run
// some of them: `npm run test:real-sites -- huble.com`.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'tests/features/real-sites');
const wanted = process.argv.slice(2);
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.feature'))
  .filter((f) => !wanted.length || wanted.some((w) => f.startsWith(w)));

let failed = 0;
for (const file of files) {
  const host = file.replace(/\.feature$/, '');
  console.log(`\n== ${host} ==`);
  const result = spawnSync('npx', ['cucumber-js', '--config', 'cucumber.js'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: Object.assign({}, process.env, {
      LAUNCH_URL: `https://${host}`,
      FEATURES: path.join('tests/features/real-sites', file),
      CUCUMBER_TAGS: '@real-site',
    }),
  });
  if (result.status !== 0) failed += 1;
}
process.exit(failed ? 1 : 0);
