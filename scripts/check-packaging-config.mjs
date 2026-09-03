import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const build = pkg.build ?? {};
const checks = [
  ['packager has an app id', typeof build.appId === 'string' && build.appId.length > 0],
  ['packager has a product name', build.productName === 'FocusReels'],
  ['packager enables asar', build.asar === true],
  ['native helpers are unpacked', Array.isArray(build.asarUnpack) && build.asarUnpack.some((entry) => String(entry).includes('dist/native'))],
  ['packager writes artifacts outside dist', build.directories?.output === 'release'],
  ['packager includes dist runtime', build.files?.includes('dist/**/*') === true],
  ['packager excludes nested mac artifacts', build.files?.includes('!dist/mac-*') === true],
  ['mac target includes dmg', build.mac?.target?.some((target) => target.target === 'dmg') === true],
  ['mac target includes arm64', build.mac?.target?.some((target) => target.arch?.includes('arm64')) === true],
  ['mac target includes x64', build.mac?.target?.some((target) => target.arch?.includes('x64')) === true],
  ['mac packaging command exists', pkg.scripts?.['package:mac'] === 'npm run build && CSC_IDENTITY_AUTO_DISCOVERY=false electron-builder --mac dmg'],
];
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
