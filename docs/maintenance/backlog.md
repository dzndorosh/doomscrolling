# FocusReels backlog

## 1. Audio coexistence (highest risk)

Goal: do not unexpectedly enable FocusReels audio while the user is listening
to music, is on a call, or is watching another video.

Current state: FocusReels guarantees exclusive audio between its own players,
but Electron does not expose a cross-application audio-activity API. A
standalone Core Audio probe now reports whether the default output device is
already running immediately before a trigger. Checking the frontmost app is
insufficient because music and calls may play in the background.

Decision: keep the probe standalone until repeated manual runs establish its
false-positive/false-negative behavior. It must not change scrolling or
playback until its signal is reliable; the probe itself requires no API key or
screen-recording permission.

## 2. Application adapters

- Add and document adapters for supported AI sources beyond the current Cursor,
  VS Code/Copilot and Claude Code hooks.
- Keep “Other applications…” hidden or explicitly marked unavailable until an
  event adapter exists.

## 3. Distribution

- Developer ID signing and notarization.
- Clean-profile Gatekeeper install.
- Launch-at-login verification after signed packaging.

## 4. Product validation

- Observe real use: when FocusReels is opened, muted/unmuted, skipped or closed.
- Record whether the first useful video starts without stealing attention or
  audio from the user's current task.
