/** Static guardrails for the deliberately passive prototype. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname);
const read = (name) => readFileSync(resolve(root, name), 'utf8');
const css = read('styles.css');
const app = read('app.js');
const main = read('main.cjs');
const packageJson = read('../../package.json');

const requiredCss = [
  'overflow-y: auto',
  'overscroll-behavior: contain',
  'scroll-snap-type: y mandatory',
  'scrollbar-width: none',
  'scroll-snap-align: start',
  'scroll-snap-stop: always',
];

const assertions = [
  ['all required scroll-snap CSS is present', requiredCss.every((rule) => css.includes(rule))],
  ['a scrollend observer commits the active slide', /addEventListener\('scrollend'/.test(app)],
  ['no wheel listener is present', !/addEventListener\(['"]wheel['"]/.test(app)],
  ['no preventDefault call is present', !/\.preventDefault\s*\(/.test(app)],
  ['no transform animation is present', !/(?:transform\s*:|@keyframes|requestAnimationFrame|\.animate\s*\()/.test(`${css}\n${app}`)],
  ['the window has FocusReels video-stage dimensions', /width:\s*326[\s\S]*height:\s*720/.test(main)],
  ['the npm launch command is registered', /"prototype:native-scroll"\s*:\s*"electron tools\/native-scroll-prototype\/main\.cjs"/.test(packageJson)],
  ['the prototype is isolated from production source imports', !/src\//.test(main)],
];

let failed = false;
for (const [name, passed] of assertions) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
  failed ||= !passed;
}

if (failed) process.exitCode = 1;
