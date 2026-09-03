import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlaybackLifecycle } from './lifecycle-model.mjs';

const STATES = { PLAYING: 1, PAUSED: 2, BUFFERING: 3, ENDED: 0 };

function fixture() {
  const calls = [];
  const trace = [];
  const players = Array.from({ length: 3 }, (_, index) => ({
    getVideoLoadedFraction: () => index === 2 ? 0.82 : 0.44,
    mute: () => calls.push([index, 'mute']),
    unMute: () => calls.push([index, 'unMute']),
    pauseVideo: () => calls.push([index, 'pause']),
    playVideo: () => calls.push([index, 'play']),
    seekTo: (at, allowSeekAhead) => calls.push([index, 'seekTo', at, allowSeekAhead]),
  }));
  const slides = players.map((_, index) => ({
    scrollIntoView: (options) => calls.push([index, 'scrollIntoView', options]),
  }));
  const lifecycle = createPlaybackLifecycle({ players, slides, states: STATES, trace: (event, details) => trace.push([event, details]) });
  players.forEach((_, index) => lifecycle.onReady(index));
  calls.length = 0;
  return { calls, trace, lifecycle };
}

test('resets outgoing playback after a confirmed activation', () => {
    const { calls, lifecycle } = fixture();
    lifecycle.activate(1);
    assert.deepEqual(calls.find((call) => call[0] === 0 && call[1] === 'pause'), [0, 'pause']);
    assert.deepEqual(calls.find((call) => call[0] === 0 && call[1] === 'seekTo'), [0, 'seekTo', 0, true]);
    assert.deepEqual(calls.find((call) => call[0] === 1 && call[1] === 'play'), [1, 'play']);
    assert.deepEqual(calls.find((call) => call[0] === 1 && call[1] === 'seekTo'), [1, 'seekTo', 0, true]);
  });

test('unmutes only the settled active player', () => {
    const { calls, lifecycle } = fixture();
    lifecycle.setMuted(false);
    assert.equal(calls.some((call) => call[0] === 0 && call[1] === 'unMute'), true);
    assert.equal(calls.some((call) => call[0] !== 0 && call[1] === 'unMute'), false);
    assert.equal(calls.some((call) => call[0] !== 0 && call[1] === 'mute'), true);
  });

test('does not play intermediate players during a multi-skip activation', () => {
    const { calls, lifecycle } = fixture();
    lifecycle.activate(2);
    assert.deepEqual(calls.find((call) => call[0] === 2 && call[1] === 'play'), [2, 'play']);
    assert.equal(calls.some((call) => call[0] === 1 && call[1] === 'play'), false);
  });

test('turns ENDED into one native next-slide request and does not loop last slide', () => {
    const first = fixture();
    first.lifecycle.onState(0, STATES.ENDED);
    assert.deepEqual(first.calls.find((call) => call[0] === 1 && call[1] === 'scrollIntoView'), [1, 'scrollIntoView', { behavior: 'auto', block: 'start' }]);

    const last = fixture();
    last.lifecycle.activate(2);
    last.calls.length = 0;
    last.lifecycle.onState(2, STATES.ENDED);
    assert.deepEqual(last.calls, []);
  });

test('records loader timing signals, including loaded fraction before activation', () => {
    const { calls, trace, lifecycle } = fixture();
    lifecycle.prewarm(1);
    lifecycle.onState(1, STATES.PLAYING);
    assert.equal(calls.some((call) => call[0] === 1 && call[1] === 'pause'), false);
    lifecycle.activate(2);
    lifecycle.onState(2, STATES.BUFFERING);
    lifecycle.onState(2, STATES.PLAYING);
    const events = trace.map(([event]) => event);
    for (const event of [
      'prewarm-start', 'player-playing', 'prewarm-playing-kept',
      'activation', 'player-buffering', 'player-playing-after-activation',
    ]) assert.equal(events.includes(event), true, `missing ${event}`);
    assert.match(trace.find(([event]) => event === 'activation')[1], /loadedFraction=0\.82/);
  });
