# Controls build maintenance

The runtime remains one offline HTML file. The new source is maintained in `src/controls-input.js` and `src/controls-ui.js` and embedded by `tests/build-controls.cjs` using checked, unique anchors against the immutable 1.7.1 build. No third-party dependencies are required.

Build: `node tests/build-controls.cjs`

Browser QA: `node tests/serve-controls-review.cjs`, then open:

- `http://127.0.0.1:4179/` — normal game.
- `http://127.0.0.1:4179/qa-controls` — click **Run controls regression suite** (34 checks).
- `http://127.0.0.1:4179/qa-pause` — click **Run pause regression suite** (13 checks).

The local server serves fresh files on every request and binds only to loopback. QA instruments the real closure with a deterministic clock and simulated input; the production game contains no test instrumentation. The controls suite snapshots/restores local storage on its dedicated local origin. Its simulated failed-save test intentionally emits one storage warning.

Controller navigation tests discover spatial focus paths, then replay the path with standard button snapshots through the production poller. Test outcomes appear in `#qaResults`. Save comparisons normalize piece state through the existing serializer (which adds default flags) and honor the existing Elite Four Resume Battle introduction.

The original ZIP and 1.7.1 build remain unchanged. The build script regenerates index.html; copy the inherited assets and release documentation when preparing a completely new output directory.
