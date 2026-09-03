# FocusReels backlog

## 1. Audio coexistence (highest risk)

Goal: do not unexpectedly enable FocusReels audio while the user is listening
to music, is on a call, or is watching another video.

Current state: FocusReels guarantees exclusive audio between its own players,
but Electron does not expose a reliable cross-application audio-activity API.
Checking the frontmost app is insufficient because music and calls may play in
the background.

Decision: do not ship a guessed heuristic. The next probe is a small macOS
native helper research spike around Core Audio process activity and required
permissions. It must remain opt-in and must not change scrolling or playback
until its signal is reliable.

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
