# Kanto Tetris 1.8.16 for Android controllers

The 1.8.16 QA update gives long Rocket dialogue more room, restores the intended 32px body / 36px action text on 16:9 displays, and widens the nickname editor. The 4:3 profile remains 28px / 32px with 72px targets. Gameplay and saves are unchanged. Full test evidence, resolved failures and device limitations are in `../tests/results/full-qa-1.8.15/QA_REPORT.html`.

The 1.8.15 release replaces the main title artwork with the supplied Ash and Pikachu tree illustration. The complete image retains its original proportions. Menus sit below it in 4:3 and beside it in 16:9. Both fresh and saved-run title layouts, native D-pad/A/B actions, and in-place installation over 1.8.14 passed. Title checks are in `qa-results/1.8.15/QA_RESULTS.json`.

The retained 1.8.14 handheld profile tunes the interface for the Retroid Pocket Nova's 4.5-inch 1280 × 960 AMOLED. Menus use larger text and controls, with automatic scrolling as controller focus moves. Six horizontal party cards keep names, levels, HP and EXP readable. Inventory and Menu shortcuts remain beside the board; the other tools are in Menu. Fly has large destination buttons and a stable map area. The square-cell board, controls, progression, music and saves retain their existing behavior. See `qa-results/1.8.14/QA_RESULTS.json` for verification.

Install `releases/Kanto_Tetris_1.8.16_Android.apk` on the handheld. Copy it by USB or your usual file-transfer method, open it in Android's file manager, and allow that app to install it if prompted. This update uses the same signing key and can install over 1.8.15 or earlier releases to retain saves. Uninstalling clears the app's local data; export a backup first.

The same APK retains automatic 16:9 support. This release was checked at 1280 × 960 and 1920 × 1080 in an Android 11 / WebView 83 emulator, including density scaling, native controller input and Fly touch selection. Physical Nova / Android 13 visual comfort remains an on-device check. No touch movement controls are required. Game art, music, and code are bundled for offline play; external credit links open a separate browser.

## Controller

| Input | During play | In menus |
| --- | --- | --- |
| D-pad / left stick | Move; down holds soft drop | Navigate |
| A | Clockwise rotation | Select |
| X | Counterclockwise rotation | — |
| B / Y | Hard drop | B goes back |
| R1 / L1 | Clockwise / counterclockwise | — |
| L2 | Hold (once per piece) | — |
| R2 | Hard drop | — |
| Start | Pause / resume | Resume where permitted |
| Select | Inventory / team | — |
| Start + Select | Restart confirmation | — |
| Android Back | Main menu | Back; exit confirmation at title |

Options → Retroid Controller includes a face-button swap setting and **Test Controller**. Use the test to check all buttons, both sticks, and both triggers on the actual handheld. Start exits the test. Stick clicks and the right stick are detected but have no game action. Movement repeat delay and interval are adjustable in Options. Keyboard Hold defaults to Shift and can be remapped.

Physical Retroid hardware was not connected during development. Automated Android tests cover native key events, input normalization, menu navigation, pause/resume, save exchange, and display fit. A final physical-device check is still needed for each device's controller mode, audio, sleep/wake, and system file-picker navigation.

## Bring existing saves across

1. In the browser build, open Menu → Save Backups and export all saves.
2. Transfer that JSON file to the handheld.
3. In the Android app, open Save Backups → Choose Backup File. Review the preview and confirm Import.

Adventure, Rogue, permanent Pokédex, and portable game preferences travel together. Import retains the previous save for recovery. Android's face-button mapping is device-specific. Browser and Android app storage are separate; installing the APK does not automatically copy browser saves. The Android backup buttons open the system file picker directly, including when activated by a controller.

## Additions in 1.8.2

- Menu → Legendary Challenges: Articuno, Zapdos, Moltres and Mewtwo have fixed-speed board trials and guaranteed catch opportunities after their objectives. Buttons show prerequisites; full teams send the catch to Bill's PC.
- Adventure requires habitat visits and badges; new Rogue uses badge gates. Mewtwo requires the Champion and all three birds. Adventure withdrawal is safe; Rogue withdrawal/topout ends an unfinished expedition.
- Pokédex → species → Plan & Pin and Menu → Collection Planner provide wanted-species pins, habitats, evolution sources, missing-species route details and unlocked Fly shortcuts. Fly remains Adventure-only.
- Trials, pending catches and pins are portable. Failed catch writes retain the offer.
- New seeds use KT3 / Expedition v2; KT2 and legacy runs retain old pools and separate records. See ../src/LEGENDARY_PLANNER.md for exact rules.

## Additions in 1.8.0

- Gary is the recurring rival at Cerulean, Celadon and Indigo Plateau. His starter counters your original choice and evolves with his growing team. His new pixel-art portrait is bundled offline.
- After Lance, challenge Gary’s six-Pokémon Champion team. Winning saves a Hall of Fame celebration, credits and postgame access. Older completed saves retain their unlocks and can take the new challenge.
- New Rogue Expeditions choose one of three rewards after every gym: an item pack, Pokémon or stackable run modifier. A topped-out board or full-team faint ends the expedition, including the League.
- Optional shareable seeds include difficulty; separate random streams and saved state support repeatable runs. Menu → Rogue Run / Seed shows the code and recap. Records are grouped by difficulty and ruleset and are included in backups.
- Gary, rewards, setup and records use the standard controller navigation. D-pad changes dropdowns; A confirms; B returns. Reward selection requires an explicit choice. Seed text entry is optional and uses a keyboard/Android text input.

Legacy Rogue saves retain their old rules. New Expedition records never mix with legacy records. See ../src/campaign/EXPANSION.md for exact team levels, modifiers and seed limitations.

## Retained additions from 1.7.9

- Options → Comfort: separate music/SFX volumes, reduced motion/flashes, marked high contrast blocks, grid visibility and normal/strong/off landing ghost. Settings persist and travel in portable backups.
- Title or Menu → Practice & Rematches: endless stacking, 40-line sprint, and all eight gyms plus four Elite members. Choose fixed speed levels 1–15 or the encounter default.
- Use a prepared team or a healed copy of your current campaign team. Boss mechanics and idle pressure stay enabled; Practice XP is frozen. Retry restores the chosen encounter and kit with a fresh randomized piece queue.
- Results show active time, pieces, lines, Tetrises, Holds, score and pieces/second. All setup/result/settings controls work with the existing keyboard and controller navigation.
- Practice saves a campaign checkpoint before starting, then isolates all session progress. Leave Practice restores the suspended run paused. Closing the app discards Practice; Continue retains the pre-Practice checkpoint.
- An HP normalization fix keeps fully healed Pokémon at their actual species maximum through HUD refreshes and save/load.

Practice grants no badges, money or permanent registrations. Save import/export and destructive save actions are blocked during a session; leave Practice first. Comfort/control preferences remain adjustable.

## Retained additions from 1.7.8

- Hold window alongside the score, lines, speed level and NEXT. Shift or L2 stores/swaps a normal piece once per lock.
- Active and queued stone/ghost hazards block Hold. Hold leaves enemy pressure and hazard clocks unchanged; Agatha/Sabrina still hide NEXT.
- Fifteen speed levels: 650 ms per row initially, down to about 17 ms at level 15. Ten cleared lines earn a level, with campaign stage ceilings and boss minimums.
- Easy falls 20% slower; Hard 10% faster. Speed Bike and manual speed risk remain; Oak's Watch lowers the effective level by two until the next badge.
- A 500 ms grounded lock delay with up to 15 movement/rotation resets makes faster gravity controllable. Hard drop and hazards still lock immediately.
- Hold and lock state persist in saves/backups. Older saves and control configurations migrate without replacing custom bindings.

See ../src/tetris/README.md for the complete balance table.

## Retained additions from 1.7.7

- Shared battle, travel, save and hazard modules replace stacked overrides for campaign transitions.
- Adventure gym saves resume correctly; route reloads retain their board and travel progress.
- Rogue town checkpoints reopen correctly. Post-gym travel and local training/return/reload work.
- Queued and active hazards, HP, shop stock, training destinations and remaining idle-pressure time survive save/reload.
- Stale knockout callbacks are canceled. A saved knockout transition resolves once, preserving checkpoint and prize ownership.
- Campaign regression coverage includes every gym and Elite victory/loss in both modes, evolution, blackouts, old saves and the postgame gate.

The game retains one NEXT preview; forced ghost/stone pieces retain priority over the normal queue.
## Retained additions from 1.7.6

- Pokédex and PC search by partial name or number, dual-type filtering, and name/level sorting. The Pokédex also filters missing or registered species; PC filters healthy or fainted Pokémon.
- Controller-operated Name Keypad; direct keyboard typing remains available.
- PC previews show HP, level, types, locations and evolution. Choosing a Pokémon and team slot opens a swap confirmation; Cancel leaves the team unchanged.
- Persistent hazard countdowns, queued ghost/stone indicators, actual damage numbers and idle-pressure warnings. Opening menus freezes these timers.
- Optional five-page Oak battle tutorial, available from his guide and Options.
- Explicit CSS positioning for older Android WebViews fixes offscreen menus.

See `TESTING_1_8_1.md` for validation and hardware limits.

## Retained fixes

- An explicit town/battle action clears the stale automatic-pause request after leaving the game during Brock's victory sequence.
- Town actions use the current route-chain handlers before legacy handlers can run. This fixes Continue leaving the cursor in Pewter on older Android WebViews.
- Native controller input handles independent held sources, repeat filtering, disconnects, and neutral input after suspension.
- Leaving the app pauses and saves eligible progress; returning requires an explicit resume.
- Older WebView support includes `Object.hasOwn`, viewport-height, and score-strip layout fallbacks.

## Build and verification

Run `android/build.ps1` from the workspace with Node, the project-local JDK, and Android SDK tools in `.android-tools`. The signed release is written to `releases`. Run with `-QA` for an isolated `com.kantotetris.game.qa` package in `android/out/qa`; its hooks and instrumentation are excluded from the release.

The signing key and password remain in ignored `android/signing`. Keep a private backup of these files: future APK updates need the same signing key. Do not distribute the key or password with the game.

Android source: `android/java`; browser adapters: `src/android-bridge.js`, `src/android-viewport.js`, and the campaign modules in `src/campaign`. New features live in `src/collection-tools.js`, `src/battle-feedback.js`, and `src/collection-battle.css`. Test runners and fixtures live in `tests/android`; recorded emulator results live in `android/qa-results`.

Reference documentation: [Android controller input](https://developer.android.com/games/sdk/game-controller/controller-input), [local WebView content](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content), [APK signing](https://developer.android.com/tools/apksigner).
