# Campaign ownership

The maintained source is `src/game-shell.html`, with the former large inline image/audio strings kept separately in `src/assets/embedded.json`. A normal build reads no historical build directory. Run `node tests/build-retroid-web.cjs` to assemble the self-contained browser build, or `android/build.ps1` for the Android APK.

| Module | Owns |
| --- | --- |
| `story.js` | Gary rival teams, story battles, Champion progression and Hall of Fame |
| `rocket.js` | Three optional town chapters, connected research quest, story scenes, hazards and atomic rewards |
| `battle.js` | Gym/Elite entry, opponent changes, victory, mode-specific defeat dispatch, delayed KO callbacks |
| `travel.js` | Route/town entry, travel progress, training destinations, gym return and League gate |
| `saves.js` | Snapshot, normalization/migration, storage write, restore for both modes |
| `hazards.js` | Boss hazard clocks, forced-piece queue, Agatha preview suppression |
| `ui.js` | Town and battle-start button dispatch for keyboard, controller and clicks |

`src/practice.js` dispatches disposable rematches through these battle handlers. Victory/loss checks return Practice results before campaign rewards or recovery. `restoreRunSnapshot()` also restores the suspended live campaign without reading a temporary save slot. See `src/comfort-practice.md` for the checkpoint and isolation contract.

The modules share the game's existing closure and access legacy helpers by name. They are injected before initialization. `ownership.json` lists 36 campaign entry points; the builder rejects missing/duplicate definitions or a legacy shell override. The rest of the engine and presentation still live in the shell. This is an incremental extraction, not a rewrite of every rendering or combat-damage helper.

## Transition rules

- An active battle cannot be replaced by entering a route or town. Victory requires the final opponent to have actually fainted.
- Each delayed knockout callback captures the current save, battle, opponent and cancellation epoch. Loading, changing opponent or leaving a battle invalidates it.
- Adventure gym defeat heals the team and returns to that gym town. Adventure route defeat returns to its previous town (the opening section restarts Route 1). Rogue stack topout ends the run; a team blackout retains the existing heal/pause/score-penalty behavior. Elite defeat retains earlier Elite checkpoints in both modes.
- Loading restores state; it does not call new-route entry. Board, pieces, HP, partial travel, training metadata, shop stock, hazard queues and remaining combat pressure survive. Loading always pauses.
- Saves retain schema version 1, with optional `combatState`. Older saves without this field initialize combat timing safely. Pre-League cursor migration is marked with `leagueSchema` so it runs once.
- Hold is owned by `src/tetris/engine.js`. It rejects active or queued stone/ghost hazards without advancing either queue. Agatha and Sabrina continue to suppress the single NEXT preview. Hold does not reset combat clocks; its slot, used flag and grounded lock budget survive restore.

## Regression workflow

`node tests/serve-campaign-review.cjs` exposes the campaign fixture on `http://127.0.0.1:4187/`. Press **Run full campaign QA**. `/baseline` uses the retained 1.7.6 artifact for comparison. Tests use a separate origin and restore its storage afterward; never use the player origin for fixtures.

The fixture executes real line clearing and battle transitions, with prepared teams/boards to reach each scenario reproducibly. Only the 850/900 ms opponent transition delays are manually drained; victory dialogs and the rest of the UI use their normal event handlers. It is transition/integration QA, not a human balance playthrough.

`android/build.ps1 -QA` assembles a separate `com.kantotetris.game.qa` package. Its instrumentation accepts `-e mode suite-campaign`, plus the existing `suite-controls`, `suite-pause`, `suite-brock`, `suite-backups`, `suite-ui`, and `suite-features`. Native checks use `mode all` and `mode files`. Test hooks never enter the release APK. Record the emulator OS/WebView and actual resolution/density alongside results. Physical Retroid controller, audio and sleep/wake checks remain a separate release checklist.

`tests/extract-campaign-source.cjs` records the one-time extraction. It refuses to overwrite the maintained source and must not be used for normal builds.

See `EXPANSION.md` for Gary, save migration and the versioned Rogue ruleset, and `ROCKET_STORY.md` for the optional town arc. The combined campaign/Tetris build checks 44 entry points.
