/**
 * YouTube playback policy for the Phase B probe.
 *
 * This module owns player commands only. Chromium's scroll container remains
 * the motion engine; an ENDED player requests one native adjacent scroll.
 */
export function createPlaybackLifecycle({ players, slides, states, trace }) {
  const ready = Array(players.length).fill(false);
  const prewarmed = Array(players.length).fill(false);
  let active = 0;
  let muted = true;
  let activationPending = null;

  const emit = (event, details = '') => trace(event, details);

  function prewarm(index) {
    const player = players[index];
    if (!player || !ready[index] || prewarmed[index] || index === active) return false;
    prewarmed[index] = true;
    emit('prewarm-start', `${index}`);
    player.mute();
    player.playVideo();
    return true;
  }

  function onReady(index) {
    ready[index] = true;
    players[index].mute();
    emit('player-ready', `${index}`);
    if (index === active) {
      if (!muted) players[index].unMute();
      players[index].playVideo();
    }
    else if (Math.abs(index - active) === 1) prewarm(index);
  }

  function activate(index) {
    if (index === active || index < 0 || index >= players.length) return false;
    const from = active;
    const incoming = players[index];
    const loadedFraction = incoming?.getVideoLoadedFraction?.() ?? null;
    emit('activation', `${from} → ${index} loadedFraction=${loadedFraction}`);

    active = index;
    activationPending = index;
    const outgoing = players[from];
    if (outgoing && ready[from]) {
      outgoing.pauseVideo();
      outgoing.seekTo(0, true);
      emit('outgoing-reset', `${from}`);
    }

    players.forEach((player, playerIndex) => {
      if (!player || !ready[playerIndex]) return;
      player.mute();
      if (playerIndex === active) {
        // A neighbour may have been prewarmed for several seconds. Reset it
        // before activation so every settled visit starts from zero.
        player.seekTo(0, true);
        if (!muted) player.unMute();
        player.playVideo();
      }
      else if (playerIndex !== from) player.pauseVideo();
    });
    return true;
  }

  function setMuted(value) {
    muted = Boolean(value);
    players.forEach((player, index) => {
      if (!player || !ready[index]) return;
      player.mute();
      if (index === active && !muted) player.unMute();
    });
  }

  function onState(index, state) {
    if (state === states.PLAYING) {
      emit('player-playing', `${index}`);
      if (index === activationPending) {
        emit('player-playing-after-activation', `${index}`);
        activationPending = null;
      }
      if (index !== active && prewarmed[index]) {
        // Option 1: keep the nearest prewarm muted and playing. This gives the
        // incoming iframe time to buffer; activation/scrollend still controls
        // which player is allowed to remain playing.
        emit('prewarm-playing-kept', `${index}`);
      }
    } else if (state === states.PAUSED) {
      emit('player-paused', `${index}`);
    } else if (state === states.BUFFERING) {
      emit('player-buffering', `${index}`);
    } else if (state === states.ENDED) {
      emit('player-ended', `${index}`);
      if (index === active && index < slides.length - 1) {
        const next = index + 1;
        emit('ended-next-request', `${index} → ${next}`);
        slides[next].scrollIntoView({ behavior: 'auto', block: 'start' });
      }
    }
  }

  return {
    activate,
    onReady,
    onState,
    prewarm,
    setMuted,
    get active() { return active; },
    isReady: (index) => ready[index],
  };
}
