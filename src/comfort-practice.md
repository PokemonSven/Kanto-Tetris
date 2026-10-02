# Comfort and Practice ownership — 1.7.9

`comfort.js` owns normalized presentation preferences, volume gains, marked block rendering, and the Options card. `practice.js` owns setup, suspended campaign state, disposable attempts, statistics and results. `comfort-practice.css` owns their presentation. The normal builder injects these alongside the campaign/Tetris modules; no historical release is read as source.

## Comfort

- Separate music/SFX volumes (0–100%, controller steps of 5%) retain the existing mute switches. Defaults are 100%, preserving the previous mix. Every audio initialization reapplies volume so legacy music setup cannot override it.
- Reduce motion disables screen animations and floating damage. Reduce flashes suppresses animated brightness and decorative flashes. Persistent hazard/idle text and damage summaries remain. These are presentation changes: Sabrina's piece rotation and control restrictions still run.
- Distinct blocks use high contrast colours plus I/O/T/S/Z/J/L and X/G markings; the board, Hold and visible NEXT use the same renderer. Agatha/Sabrina preview hiding is unchanged.
- Grid and landing ghost (normal, strong, off) are independent.
- Preferences are stored inside the existing audio storage record, avoiding a change to the recovery journal's key set. Portable backup v1 adds optional `preferences.comfort`, strictly validates it when present, and defaults it for older imports. Existing audio-toggle saves retain comfort settings. Reset affects only comfort.

## Practice

- Entry is **Practice & Rematches** on the title screen or main menu. The old developer Boss Test UI is superseded for players; its fixtures remain for regression tests.
- Free stacking supports endless play or a 40-line sprint. It uses Tetris scoring and the real piece/Hold engine, but no wild encounters, travel, battle damage, XP or quests.
- Rematches cover all eight gym leaders and four Elite members, regardless of campaign unlocks. They use complete opposing teams, real combat/hazards, idle pressure, hidden previews and hazard-safe Hold.
- Encounter default speed is fixed at level 1 for free play or the boss's normal minimum. Levels 1–15 can be selected explicitly. Practice does not apply campaign difficulty, Bike or Adventure Speed Risk modifiers. Existing movement-repeat and key settings remain active.
- Prepared teams and a small healing kit are supplied. A healed copy of the suspended current team is also available. Copied levels are preserved; all Practice XP is frozen for comparable retries. No badges, money, permanent registrations or campaign checkpoints are earned.
- Statistics are active-play time, normal pieces locked, lines, Tetrises, Holds, score and pieces/second. Menus and opponent transitions do not count as active time. Results offer Retry, Change Setup and Leave Practice. Retry resets the board, team, enemy team, hazards, Hold and metrics, while keeping the chosen settings. Piece order is randomized anew.

## Save and transition boundary

Starting from a live campaign first saves an ordinary campaign checkpoint. If this fails, Practice does not start and the setup explains why. During Practice, run persistence, permanent registration persistence, destructive save actions, imports and exports are blocked. Comfort/control preferences remain writable.

The original board, pieces/bag, Hold/lock budget, team, HP, battle clocks, route/town and Fly runtime are retained in memory. Leaving restores them paused through `restoreRunSnapshot()` in `campaign/saves.js`; no Practice data is written into a run slot. Starting from title returns to title. Closing the app discards Practice and leaves the pre-Practice checkpoint available through Continue.

`campaignLoss()` and `completeGymBattle()` dispatch Practice results before ordinary campaign defeat/rewards. KO callbacks use the existing ownership/cancellation mechanism and are canceled on retry or leave. Free clears are owned by `clearPracticeLines()` and never enter campaign travel/combat wrappers.

## HP fix found during QA

The legacy Pokémon initializer clamped current-model HP to a species-neutral maximum on each refresh. The current-model adapter now preserves existing HP until it can clamp against the actual species maximum. This keeps a healed Blastoise (and other species with a higher HP modifier) fully healed across HUD refresh/save/load. Old-model HP still follows its existing ratio migration.

## QA entry points

`tests/serve-practice-review.cjs` serves disposable browser QA on localhost:4189. **Run comfort and Practice QA** executes 51 integration checks. Android accepts `suite-practice`; native `all` also exercises setup dropdowns, start, L2, result Back, volume and checkbox input. Preview modes include `preview-practice` and `preview-comfort`. All QA hooks are excluded from the release. Physical Retroid firmware, audio and trigger checks remain a separate human test.
