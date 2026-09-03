/** Static Phase B guardrails; visual and physical behaviour remain manual. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname);
const read = (name) => readFileSync(resolve(root, name), 'utf8');
const css = read('styles-youtube.css');
const html = read('index-youtube.html');
const app = read('app-youtube.js');
const lifecycle = read('lifecycle-model.mjs');
const main = read('main-youtube.cjs');
const packageJson = read('../../package.json');

const assertions = [
  ['CSS snap and containment are present', ['scroll-snap-type: y mandatory', 'scroll-snap-stop: always', 'overscroll-behavior: contain'].every((rule) => css.includes(rule))],
  ['no wheel listener is present', !/addEventListener\(['"]wheel['"]/.test(`${html}\n${app}`)],
  ['no preventDefault call is present', !/\.preventDefault\s*\(/.test(`${html}\n${app}`)],
  ['deltaY is not analyzed', !/deltaY/.test(`${html}\n${app}`)],
  ['no manual slide transform animation is present', !/(?:transform\s*:|@keyframes|requestAnimationFrame|\.animate\s*\()/.test(`${css}\n${app}\n${lifecycle}`)],
  ['five stable slide/player hosts are declared', (html.match(/class="player-host"/g) ?? []).length === 5 && (app.match(/new YT\.Player/g) ?? []).length === 1],
  ['players are not recreated or moved during scrolling', !/(?:remove\(|removeChild|replaceChildren|appendChild|innerHTML|loadVideoById)/.test(app)],
  ['official YouTube IFrame API is used', html.includes('https://www.youtube.com/iframe_api') && app.includes('onYouTubeIframeAPIReady')],
  ['no API key is present', !/(?:apiKey|api_key|developerKey|key\s*=)/i.test(`${html}\n${app}\n${main}`)],
  ['YouTube Referer handler is narrowly registered before window creation', /YOUTUBE_REQUEST_FILTER\s*=\s*\{\s*urls:\s*\['https:\/\/www\.youtube\.com\/\*',\s*'https:\/\/www\.youtube-nocookie\.com\/\*'\]/.test(main) && /webRequest\.onBeforeSendHeaders\(\s*YOUTUBE_REQUEST_FILTER[\s\S]*?Referer:\s*YOUTUBE_REFERER/.test(main) && /installYoutubeRefererHandler\(\);\s*\n\s*createWindow\(\);/.test(main)],
  ['Referer is the fixed FocusReels origin', /YOUTUBE_REFERER\s*=\s*'https:\/\/focusreels\.app\/'/.test(main)],
  ['web security remains enabled', !/webSecurity\s*:\s*false/.test(main)],
  ['player error trace preserves numeric error code', /player-error[\s\S]*errorCode/.test(app) && /onError/.test(app)],
  ['loader lifecycle trace has timing signals', ['prewarm-start', 'activation', 'player-buffering', 'player-playing-after-activation', 'prewarm-playing-kept'].every((event) => lifecycle.includes(`'${event}'`)) && /performance\.now\(\)/.test(app)],
  ['ENDED requests one native adjacent scroll without a timer', /scrollIntoView\(\{ behavior: 'auto', block: 'start' \}\)/.test(lifecycle) && !/(setTimeout|setInterval)/.test(lifecycle)],
  ['outgoing playback is paused and reset to zero', /pauseVideo\(\)[\s\S]*seekTo\(0, true\)/.test(lifecycle)],
  ['the launch command is registered', /"prototype:native-scroll:youtube"\s*:\s*"electron tools\/native-scroll-prototype\/main-youtube\.cjs"/.test(packageJson)],
  ['the entry point is isolated from production imports', !/src\//.test(main)],
];

let failed = false;
for (const [name, passed] of assertions) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
  failed ||= !passed;
}
if (failed) process.exitCode = 1;
