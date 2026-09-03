# FocusReels vertical paging architecture

Status: **RECOMMEND NATIVE SCROLL-SNAP PROTOTYPE**  
Date: 2026-09-03

## Decision

Replace the production `WheelGestureRecognizer` path with a native Chromium
vertical scroll container. Use mandatory CSS scroll snapping and make every
video a viewport-sized snap target:

```css
.feed {
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-snap-type: y mandatory;
}

.slide {
  height: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}
```

Do not ship this directly. First validate an isolated prototype with physical
MacBook trackpad input, then add real YouTube players, and only then replace
the current production path.

## Why the current approach is unstable

Standard `WheelEvent` exposes deltas and their units but not a portable event
that says whether a wheel packet is direct finger input or inertial momentum.
The current implementation consequently has to infer gesture boundaries from
thresholds, quiet periods, magnitude changes, transition locks, and timing
gaps. A physical capture demonstrated that a single flick can contain a later
magnitude rise that looks like a new gesture to such a recognizer.

The UI Events specification defines the available wheel event data:
<https://www.w3.org/TR/uievents/#events-wheelevents>.

Non-passive wheel interception can also move input processing onto the main
thread. Chromium's compositor architecture is designed to scroll independently
of a busy main thread where possible:
<https://www.chromium.org/developers/design-documents/compositor-thread-architecture/>.

## Why native scroll snap is the preferred path

CSS Scroll Snap exists to turn imprecise wheel or touch input into controlled
paging. `scroll-snap-stop: always` prevents a scrolling operation from passing
over a snap target, which directly matches the requirement that a strong flick
advance only one video:

- CSS Scroll Snap specification: <https://www.w3.org/TR/css-scroll-snap-1/>
- `scroll-snap-stop`: <https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-snap-stop>
- `scrollend`: <https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollend_event>

The specification intentionally leaves exact animation and physics to the user
agent. FocusReels uses Electron 33 / Chromium 130, so this delegates the motion
to the same Chromium scrolling machinery embedded in the app rather than
reconstructing it in JavaScript:
<https://releases.electronjs.org/release/v33.0.0>.

## Open-source implementations reviewed

### Native-scroll references

- `react-vertical-feed` uses a native vertical scrolling feed, CSS snap, and
  visibility observation rather than translating a deck from wheel deltas:
  <https://github.com/reinaldosimoes/react-vertical-feed>
- `scroll-snap-slider` is a mostly-CSS carousel architecture where JavaScript
  observes selection rather than owning movement:
  <https://github.com/barthy-koeln/scroll-snap-slider>

These are architectural references, not proposed dependencies.

### Swiper

Swiper is mature and supports vertical mousewheel carousels and virtual slides:
<https://github.com/nolimits4web/swiper>. Its mousewheel implementation still
normalizes wheel deltas, keeps recent-event history, applies time and magnitude
thresholds, blocks around animation state, and calls `preventDefault()`:
<https://github.com/nolimits4web/swiper/blob/master/src/modules/mousewheel/mousewheel.ts>.

It is a better-tested version of the same heuristic class, not an escape from
the underlying ambiguity. It is therefore not the first choice for FocusReels.

### Embla with Wheel Gestures

The Embla wheel plugin explicitly supports Mac trackpads and limits motion to a
slide when snap skipping is disabled:
<https://github.com/xiel/embla-carousel-wheel-gestures>. Its implementation
classifies momentum and converts wheel motion into synthetic mouse dragging:
<https://github.com/xiel/embla-carousel-wheel-gestures/blob/master/embla-carousel-wheel-gestures/src/WheelGesturesPlugin.ts>.

This is the preferred fallback if native scroll snap fails the iframe prototype,
but it still owns gesture classification and transform physics in JavaScript.

## Proposed FocusReels model

```text
physical trackpad input
        -> Chromium native scrolling
        -> mandatory snap / snap-stop always
        -> scrollend selects the active slide
        -> playback lifecycle promotes that slide
```

1. Keep stable DOM positions for the session feed; do not recenter and reorder
   a three-item deck after every transition.
2. Lightweight slide shells may exist for the whole session, while expensive
   YouTube players are mounted only for the current item and immediate neighbors.
3. Never reparent an iframe during scrolling. Reparenting or destroying it risks
   a repaint, player reload, black frame, or transient Play screen.
4. Prime the next player muted. Begin/resume it when native scrolling starts;
   only the settled active slide may restore user audio.
5. Use `scrollend` to commit selection. Use `IntersectionObserver` for preloading
   and as a selection fallback, not as the motion engine.
6. Buttons and keyboard navigation target exactly one adjacent slide using
   `scrollIntoView()` or `scrollTo()`.
7. If the cross-origin iframe consumes trackpad input, retain a transparent
   element above the video, but place it inside the native scroll container and
   do not attach a non-passive wheel recognizer or manual transform animation.

## Prototype gates

Phase A uses three colored, viewport-sized local slides and no media. It passes
only if physical trackpad testing confirms:

- content follows the fingers without an input delay;
- a normal flick advances exactly one slide;
- the strongest repeatable flick advances exactly one slide;
- reverse motion works immediately;
- partial motion settles cleanly to one snap point;
- no custom wheel thresholds or timers are present.

Phase B replaces the colors with three real YouTube iframe players. It passes
only if:

- scrolling works over the video surface;
- no iframe is destroyed or reparented during motion;
- the incoming visual is already available while moving;
- only the active video has sound;
- no Play/loading flash, black frame, or double playback is introduced.

Only after both phases pass should the production recognizer, its hardware
timing constants, and the manual pane transition be removed. Keep the current
path behind a development flag until the native path passes physical testing.

## Limits of the comparison

YouTube Shorts and TikTok do not publish their production feed source code, so
this research does not claim that either product uses CSS Scroll Snap. The
recommendation reproduces the observable interaction model using the native
scrolling implementation already present in Electron.
