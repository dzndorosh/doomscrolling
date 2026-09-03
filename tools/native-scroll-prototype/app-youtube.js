import { createPlaybackLifecycle } from './lifecycle-model.mjs';

(() => {
  const feed = document.querySelector('.feed');
  const slides = [...document.querySelectorAll('.slide')];
  const ids = slides.map((slide) => slide.dataset.videoId);
  const activeOutput = document.querySelector('#active-index');
  const settledOutput = document.querySelector('#settled-video-id');
  const nearestOutput = document.querySelector('#nearest-index');
  const playingOutput = document.querySelector('#playing-video-id');
  const readyOutput = document.querySelector('#ready-count');
  const movementOutput = document.querySelector('#last-movement');
  const traceOutput = document.querySelector('#trace');

  const players = Array(ids.length).fill(null);
  const ready = Array(ids.length).fill(false);
  let active = 0;
  let nearest = 0;
  let scrolling = false;
  const traceLines = [];

  function trace(event, details = '') {
    const line = `${performance.now().toFixed(1)}ms ${event}${details ? ` ${details}` : ''}`;
    console.log(`[native-scroll-youtube] ${line}`);
    traceLines.push(line);
    while (traceLines.length > 9) traceLines.shift();
    traceOutput.textContent = traceLines.join('\n');
  }

  function updateReady() {
    readyOutput.value = `${ready.filter(Boolean).length}/${players.length}`;
  }

  function nearestFromScroll() {
    return Math.max(0, Math.min(ids.length - 1,
      Math.round(feed.scrollTop / feed.clientHeight)));
  }

  const lifecycle = createPlaybackLifecycle({
    players,
    slides,
    states: { PLAYING: 1, PAUSED: 2, BUFFERING: 3, ENDED: 0 },
    trace: (event, details = '') => trace(event, details),
  });

  function settle(index) {
    const from = active;
    lifecycle.activate(index);
    active = lifecycle.active;
    activeOutput.value = String(active);
    settledOutput.value = ids[active];
    movementOutput.value = `${from} → ${active}`;
    trace('active-slide-changed', `${from} → ${active}`);
    if (Math.abs(active - from) > 1) trace('multi-skip-observed', `${from} → ${active}`);

  }

  function onPlayerReady(index) {
    ready[index] = true;
    updateReady();
    lifecycle.onReady(index);
  }

  function onPlayerState(index, state) {
    lifecycle.onState(index, state);
    if (state === YT.PlayerState.PLAYING) playingOutput.value = ids[index];
    else if (state === YT.PlayerState.PAUSED && playingOutput.value === ids[index]) playingOutput.value = '—';
  }

  function onPlayerError(index, errorCode) {
    trace('player-error', `${index} ${ids[index]} code=${errorCode}`);
  }

  function prewarm(index) { lifecycle.prewarm(index); }

  // The official API replaces each host once during setup. No host is moved,
  // destroyed, or recreated in response to scrolling.
  window.onYouTubeIframeAPIReady = () => {
    ids.forEach((videoId, index) => {
      players[index] = new YT.Player(`player-host-${index}`, {
        videoId,
        playerVars: { autoplay: 0, controls: 1, playsinline: 1, rel: 0 },
        events: {
          onReady: () => onPlayerReady(index),
          onError: (event) => onPlayerError(index, event.data),
          onStateChange: (event) => onPlayerState(index, event.data),
        },
      });
      trace('player-created', `${index} ${videoId}`);
    });
  };

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) {
      nearest = Number(visible.target.dataset.index);
      nearestOutput.value = String(nearest);
      prewarm(nearest);
    }
  }, { root: feed, threshold: [0.5, 0.75, 1] });
  slides.forEach((slide) => observer.observe(slide));

  feed.addEventListener('scroll', () => {
    if (!scrolling) {
      scrolling = true;
      trace('native-scroll-start');
    }
    nearest = nearestFromScroll();
    nearestOutput.value = String(nearest);
    prewarm(nearest);
  }, { passive: true });

  feed.addEventListener('scrollend', () => {
    const destination = nearestFromScroll();
    trace('native-scroll-end', String(destination));
    settle(destination);
    scrolling = false;
  });

  updateReady();
})();
