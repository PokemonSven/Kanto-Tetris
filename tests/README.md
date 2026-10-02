# Rocket town story (1.8.4)

Build with `node tests/build-retroid-web.cjs`; run `node tests/serve-rocket-review.cjs` on isolated port 4194. The default `rocket` suite covers 35 story, combat, persistence, failure/retry and menu/layout cases. Other suites are available via `?suite=campaign`, `controls`, `backups`, `expansion`, `milestones`, `oak`, `practice`, `tetris` and `ui`. `/play` is the uninstrumented release on the disposable QA origin.

Android `suite-rocket` runs the same cases; `all` additionally checks native A/B/D-pad/Start through story entry, skipping, approach selection, battle entry and pause. `preview-rocket` captures the actual WebView scene. Store 1.8.4 results in `android/qa-results/1.8.4`. Test 1280×960, 1920×1080 and browser 1280×720. Physical Retroid controls and a human campaign balance playthrough remain separate checks.

# Nova fixes (1.8.2)

The final layout is full screen with NEXT/trainer data on the left and title/Menu on the right. Four shortcuts below the map/battle area open Pokédex, Trainer Card, Inventory and Menu. `?suite=ui` runs 23 UI/menu checks, including shortcut pause safety, controller return paths, live Trainer Card data and nonoverlapping bounds. Record `nova`, `tetris` and `ui` results at 4:3, 1080p and 720p. Release verification runs through `tests/android/verify-nova-release.ps1` (use `-AllowSameVersion` for an already-installed 1.8.2 candidate); `tests/summarize-nova-qa.cjs` rejects incomplete or failing result sets.

Primary Android target: Retroid Pocket Nova 4:3 / 1280 × 960. Build with `node tests/build-retroid-web.cjs`; run `node tests/serve-nova-review.cjs` on isolated localhost:4192. Default `suite-nova` covers 15 regression cases. `?baseline=1` uses the retained 1.8.1 build to reproduce the evolution collision and prior speed/layout failures. `?suite=tetris` covers 22 Hold/engine cases, including matching preview dimensions and actual rendered block scale. Android QA runs `suite-nova`, then existing suites, with outputs under `android/qa-results/1.8.2`. The player origin stays on 4184.

# Legendary and planner checks (1.8.1)

Build with `node tests/build-retroid-web.cjs`; run `node tests/serve-milestone-review.cjs` on isolated localhost:4191. The default fixture has 44 checks. Android mode `suite-milestones` runs the same fixture; `all` includes 42 native controller/lifecycle checks. Preview modes: `preview-legendary`, `preview-trial`, `preview-planner`, `preview-catch`. Store results in the 1.8.1 result directories. Never run fixtures on the player origin.

# Pause regression checks

## Rival and Rogue checks (1.8.0)

Build with `node tests/build-retroid-web.cjs`, then run `node tests/serve-expansion-review.cjs`. The isolated origin is localhost:4190; `/play` serves the uninstrumented release. The default fixture runs 53 expansion checks. Android mode `suite-expansion` runs the same checks; `all` includes native Gary entry/pause and reward selection. Preview modes are `preview-gary`, `preview-reward` and `preview-finale`. Save results under the 1.8.0 results folders. Do not run fixtures on the player origin.

## Comfort and Practice checks (1.7.9)

Run `node tests/build-retroid-web.cjs`, then `node tests/serve-practice-review.cjs`. At `http://127.0.0.1:4189/`, press **Run comfort and Practice QA** (51 checks). `/play` serves the release without fixtures on the disposable origin. The suite also runs in the isolated Android package as `suite-practice`. Native `all` includes the new setup/results and comfort controls. Preview modes `preview-practice` and `preview-comfort` support visual review. Record 4:3, 1080p and RP4-size checks in the 1.7.9 results folders.

## Hold and speed checks (1.7.8)

Run `node tests/build-retroid-web.cjs`, then `node tests/serve-tetris-review.cjs`. At `http://127.0.0.1:4188/`, press **Run Hold and speed QA** (21 checks). Test both 1280 × 960 and 1920 × 1080. `/play` is the uninstrumented release on the disposable QA origin. Android instrumentation accepts `suite-tetris`; `all` additionally injects native L2 presses, repeats and releases. Record results in `tests/results/1.7.8` and `android/qa-results/1.7.8`. The release excludes all fixtures. See `src/tetris/README.md` for mechanics and balance values.

Run `node tests/serve-pause-review.cjs` from the workspace, then visit `http://127.0.0.1:4178/qa` and click **Run pause regression suite**.

The server injects `pause-browser-suite.js` into the complete game closure. It substitutes a deterministic combat clock and disables automatic animation-frame scheduling only on QA pages. The suite invokes actual menu listeners, pause logic, battle logic, and the real asynchronous Pokémon knockout transition. QA code is excluded from the release HTML and ZIP.

- `/`: uninstrumented 1.7.1 release.
- `/qa`: updated game; expected 13 passes.
- `/qa-baseline`: original 1.7 game; expected 13 regression failures.

`implement-autopause.cjs` records the exact patch transformation. It is intended to run once on a fresh copy of 1.7 and rejects an already patched build.

# Collection and battle feedback checks (1.7.6)

Run `node tests/build-retroid-web.cjs`, then `node tests/serve-feature-review.cjs`. Visit `http://127.0.0.1:4186/features` and choose **Run collection and battle feedback tests**; expect 20 passes. `/preview` provides disposable battle, Pokédex, PC, details and tutorial scenes for visual review. These pages use a separate origin from the player game on port 4184.

For Android, build `android/build.ps1 -QA`, install the isolated QA APK and run instrumentation with `-e mode suite-features`. Existing `suite-controls`, `suite-pause`, `suite-brock`, `suite-backups`, `suite-ui`, `all` and `files` modes cover regressions. Preview modes are `preview-battle`, `preview-dex`, `preview-pc`, `preview-detail` and `preview-tutorial`. Run instrumentation sequentially; concurrent runners share an activity and can invalidate results.

Check physical 1280 × 960, 1334 × 750 and 1920 × 1080. Inspect screenshots as well as bounds; controller focus alone does not prove a modal is visible in an older WebView. The Android builder emits CSS positioning fallbacks needed by WebView 83.

The signed release is generated by `android/build.ps1` without `-QA`. `node tests/summarize-features-qa.cjs` validates recorded passing results and writes the 1.7.6 QA summary and APK checksum. See `android/TESTING_1_7_6.md` for scope and hardware limits.
