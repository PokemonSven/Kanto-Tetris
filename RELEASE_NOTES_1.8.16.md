Kanto Tetris 1.8.16 brings the current polished game to Windows browsers and Android handhelds, with layouts checked at **4:3 and 16:9**.

## Downloads

- **Android:** install `Kanto_Tetris_1.8.16_Android.apk`.
- **Windows:** extract `Kanto_Tetris_Build_1_8_16_QA_Fixes.zip`, then open `index.html` in your browser. Keep the `music` folder beside it.
- **QA:** `Kanto_Tetris_1.8.16_QA_Report.html` and `Kanto_Tetris_1.8.16_QA_Results.json`.
- `SHA256SUMS.txt` contains checksums for the attached downloads.

## Highlights since the earlier public builds

- Detailed GBA-style Kanto minimap and clickable Fly map. Pikachu runs on the current route and sits in the current town.
- New Ash and Pikachu title artwork, arranged for both screen shapes.
- Bundled FireRed/LeafGreen soundtrack, music crossfades, fanfares, and separate music/SFX controls.
- Android handheld menus with larger text, clear controller focus, and readable party and battle panels.
- Three Adventure save slots, portable save backups, Practice and boss rematches.
- Expanded Adventure and Rogue content, including Gary and the Champion, seeded Rogue expeditions, legendary challenges, the Rocket story, Battle Tower, and Pokémon nicknames/keepsakes.
- Hold, consistent square grid cells, configurable movement repeat, and comfort/display settings.

## Final 1.8.16 fixes

- Windows badge artwork now works offline.
- Long Rocket dialogue fits the Android screen more reliably.
- Android 16:9 menus correctly use the larger text profile.
- A wider handheld nickname editor reduces wrapping.

## Validation and saves

**2,749 checks passed across 98 effective suite runs**, covering gameplay, progression, controls, saves/recovery, maps, audio, menus, and stress tests. The final test matrix has no unresolved failures. The QA files distinguish the 1.8.15 baseline from focused 1.8.16 regressions.

The signed APK was successfully installed over 1.8.15 using the same signing identity. Export a Save Backup before updating; use Save Backups to transfer progress between browser and Android, whose local storage is separate. The 1.8.16 presentation fixes do not change gameplay or save formats.

Android verification used an Android 11 / WebView 83 emulator. Physical Retroid Pocket Nova comfort, hardware controls, audio, and sleep/wake behavior still need an on-device check. Windows was tested through the browser preview; direct local-file launch was not automated.

This is an unofficial fan project. Credits and asset provenance are included in the repository.
