# Tetris engine — 1.8.6

`engine.js` owns spawning, Hold, gravity, lock delay, movement and rotations. `ownership.json` lists eight extracted entry points; the normal web builder rejects duplicate definitions in the shell. `tetris.css` fills the display: Hold, the larger single NEXT preview, score/route data and team sit left; the square-cell board uses almost the full height; the title/Menu and map/battle panels sit right. `compactFit()` bounds the board by height and available width. Menu panels restore a normal full-width header. The builder reads `compact-ui.js` as the authoritative UI source instead of using the shell's older embedded copy.

## Hold rules

- Shift (remappable) or controller L2 stores the current normal piece. Empty Hold consumes exactly one normal NEXT; swapping an occupied Hold does not advance NEXT or the bag.
- Stored pieces return in spawn orientation and position. Hold is available again after the current piece locks. A blocked incoming spawn follows the normal mode-specific loss path.
- Holding active stone/ghost pieces or while either hazard is queued is rejected without changing the board, queues or timers. Surge control locks, Sabrina spin, pauses, menus and knockout transitions also prevent Hold.
- Hold never clears lines, grants XP, refreshes idle/combo timers or resets hazard countdowns. Agatha/Sabrina still suppress NEXT; the held piece is already known information.
- The held shape and used flag survive save/load, backup and campaign transitions. New runs clear them. The grounded lock budget is also persisted so reloading cannot refresh it. Old saves initialize an empty slot; old control backups acquire a free Hold binding without overwriting custom keys.
- Hold and the single NEXT preview both display at 144 × 96, rendered from 240 × 160 canvases; Agatha, Sabrina and Mewtwo suppression remains in effect.

## Gravity and balance

This is a custom campaign curve. Earned badges are the only automatic source of speed levels. Line clears, route changes, training and entering a battle never raise the level.

| Level | Milliseconds per row |
| --- | ---: |
| 1 | 650 |
| 2 | 550 |
| 3 | 460 |
| 4 | 380 |
| 5 | 300 |
| 6 | 233 |
| 7 | 183 |
| 8 | 133 |
| 9 | 100 |
| 10 | 83 |
| 11 | 67 |
| 12 | 50 |

Normal uses `min(8, 1 + badges)`; Hard uses `min(12, 1 + 2 × badges)`. Only distinct gym badges 0–7 count. At 0–8 badges the ladders are **1, 2, 3, 4, 5, 6, 7, 8, 8** and **1, 3, 5, 7, 9, 11, 12, 12, 12**. Adventure and Rogue read their own difficulty. Existing saves derive the new level from their badges without changing their line totals or progress. Legendary encounters also use the earned badge level.

Adventure Easy stays at level 1 (650 ms/row), with its voluntary speed/score slider; Speed Bike does not accelerate Easy. Rogue retains its 0.8/1/1.1 difficulty factors. Speed Bike and Adventure Speed Risk remain modifiers. Oak's Watch lowers the effective level by two, minimum one, until the next badge. After modifiers, automatic gravity cannot be faster than **133 ms/row on Normal** or **50 ms/row on Hard**. Legendary trials ignore modifiers as before. Soft drop is up to 20× with a 4 ms minimum interval; forced ghost/stone bricks retain their special fast fall.

Practice retains explicitly selected fixed levels 1–15 (levels 13–15 use 42, 33 and 25 ms/row). A default gym rematch uses the Normal level on entering that gym; Elite Four/Champion defaults use level 8. Practice does not change campaign speed or progress. Rogue records store a separate `speedRules` tag (`badge-v1`); older records without it appear in the previous line-progression bucket, preserving their expedition ruleset and seed compatibility.

Normal pieces get 500 ms of grounded lock delay, capped at 15 successful grounded movement/rotation resets. Blocked movements do not reset it. Hard drop and forced hazards lock immediately; Sabrina's special spin landing rule remains intact. Gravity can move multiple rows each frame and caps elapsed time at 100 ms to avoid stall catch-up. Pause contributes no lock time or pressure debt.

## QA

Run `node tests/serve-speed-review.cjs` and press **Run badge speed QA** at localhost:4196. The fixture is separate from player saves. Its 17 cases cover every badge/difficulty step, modifiers, actual line clearing and Brock victory, encounter entry, legacy Continue, backups, Practice and record separation. Android instrumentation exposes it as `suite-speed`. Existing `suite-tetris` (22), `suite-nova` (15), Oak, Rocket, legendary and Practice suites also cover the changed behavior. Native L2 press/repeat/release remains checked by `all`. Release QA reports record the exact checks and physical-device limitations.
