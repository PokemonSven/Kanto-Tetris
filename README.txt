TETRIS CATCH: KANTO 150 — MUSIC UPDATE
==========================================

MUSIC
This build includes nine original synthesized 8-bit/chiptune tracks created
inside the game. No official Pokémon music or third-party fan recordings are
bundled.

Tracks:
- Opening Expedition — intro
- Pewter Pulse — Gym 1
- Moonlit Cavern — Gym 2
- Vermilion Voltage — Gym 3
- Lavender Signal — Gym 4
- Safari Sprint — Gym 5
- Seafoam Drift — Gym 6
- Victory Ascent — Gym 7
- Cerulean Depths — Gym 8

HOW IT WORKS
- Browsers block autoplay until the first click/key press.
- On first interaction, the intro theme starts.
- After about five seconds, the current Gym theme takes over and loops.
- Advancing to a new Gym changes the looping track automatically.
- Starting a new run replays the intro.
- MUSIC and SFX toggles are at the top of the Pokédex UI.

All existing route encounters, roguelike persistence, gym pacing, teams,
calibrated sprites and badges are retained.

FIX IN THIS BUILD
- Restored the missing run persistence helper that caused starter selection to crash.
- Pokédex local-storage writes are now failure-safe for local browser sessions.

GYM LEADER BOSS BATTLES
-----------------------
- Reaching a Gym line goal now starts a real Gym Leader battle instead of awarding the badge immediately.
- Gym Leader teams and levels follow Pokemon FireRed/LeafGreen rosters.
- Defeat the full Leader team to earn the badge and raise drop speed.
- Active Pokemon levels are capped at the ace level of the upcoming Gym.
- Pokemon caught during the run enter close to the current level cap so team switching stays viable.
- Charged partner moves now fire automatically during a line-clear battle action.
- Bill's PC is unavailable while a Gym Leader battle is active.
- If the whole team faints during a Gym battle, the usual 15% score penalty applies, the team heals, and five more lines are required for a rematch.

GYM LEADER ART
--------------
Gym Leader portraits use a credited online fan-art set by PhilDragash, linked in the in-game credits.
Internet access is required for that portrait sheet to load.

MANUAL CROP EDITOR
------------------
Open index.html and click CROP EDITOR in the top bar.
- POKEMON SHEET shows the full uncropped 1792x448 sprite sheet.
- GYM LEADERS shows the full uncropped leader portrait sheet.
- Drag a box around the selected sprite/leader and click SAVE CROP.
- Saved crops apply immediately in that browser using localStorage.
- Use EXPORT DATA when you want to send the coordinates back to be baked into the game.

MANUAL CROP EDITOR
------------------
Open CROP_EDITOR.html directly to launch the standalone full-sheet crop editor. This file is intentionally separate from the game so it does not just look like the normal Tetris screen. You can also open index.html#crop-editor or click the bright ✂ CROP EDITOR button in the game top bar. Use EXPORT DATA after cropping and send the JSON back to bake coordinates into the game.
