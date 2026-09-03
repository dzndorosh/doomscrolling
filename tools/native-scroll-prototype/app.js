(() => {
  const feed = document.querySelector('.feed');
  const activeSlide = document.querySelector('#active-slide');
  const scrollTop = document.querySelector('#scroll-top');
  const motionState = document.querySelector('#motion-state');
  const lastTransition = document.querySelector('#last-transition');

  let active = 1;

  function nearestSlide() {
    // Every target is exactly one viewport high, so this observes Chromium's
    // settled native position without making any movement decision itself.
    return Math.max(1, Math.min(5, Math.round(feed.scrollTop / feed.clientHeight) + 1));
  }

  function updateScrollTop() {
    scrollTop.value = String(Math.round(feed.scrollTop));
  }

  feed.addEventListener('scroll', () => {
    updateScrollTop();
    motionState.value = 'scrolling';
  }, { passive: true });

  feed.addEventListener('scrollend', () => {
    updateScrollTop();
    const next = nearestSlide();
    if (next !== active) {
      lastTransition.value = `${active} → ${next}`;
      active = next;
      activeSlide.value = String(active);
    }
    motionState.value = 'settled';
  });
})();
