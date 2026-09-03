import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const required = [
  'dist/app/main.js',
  'dist/app/controlCenterPreload.js',
  'dist/app/youtubePreload.js',
  'dist/app/renderer/youtube.html',
  'dist/app/renderer/youtube.js',
  'dist/app/renderer/nativeFeed.js',
  'dist/app/renderer/control-center.html',
  'dist/app/renderer/control-center.js',
  'dist/app/renderer/control-center.css',
  'dist/app/assets/trayTemplate.png',
];
const checks = [
  ['package main points to the built entrypoint', pkg.main === 'dist/app/main.js'],
  ...required.map((file) => [file, existsSync(join(root, file))]),
];
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
