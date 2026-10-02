# Three Adventure profiles — 1.8.7

**Adventure Mode** on the title screen opens **Choose Your Adventure**. Three cards show trainer names, difficulty, location, badges, team and last saved time. Empty cards offer **Start New Adventure**. Names come from Oak's existing controller-friendly trainer-name choices/keypad. Continue opens the selected journey paused, preserving its board, team, quests, Rocket story, keepsakes and difficulty.

Slot 1 reuses `tetrisCatchKanto150_adventureSave_v1` byte-for-byte. Slots 2 and 3 use separate storage keys. Browsing cards and starting an Oak draft never change `activeAdventureSlot`; only a successful Continue or committed new starter does. Every campaign write continues through `activeRunSaveKey()`, including legendary return checkpoints, Rocket rewards and nicknames. Rogue retains its own key. Permanent Pokédex registrations and controls/audio/display preferences remain global.

New Adventures stay in memory until starter selection. Replacing an occupied slot asks for confirmation naming the slot and old trainer, with Cancel selected by default. The new run is constructed with persistence suspended; its validated snapshot and global registration are committed through the recovery journal. Write failures roll back the old saves and keep the Oak draft available for retry. In-game Restart uses the same protected draft flow. Deletion retains recovery and exits the live run so autosave cannot recreate the deleted profile.

## Backups

Version **2** exports `data.adventures` as exactly three snapshots/nulls, plus Rogue, permanent registrations, records and global preferences. A paused live Adventure updates only its selected array position. Every nonempty profile is validated before import; previews name each trainer and show location, badges, team and date. Explicit empty slots in a version 2 file clear their corresponding slots.

Version **1** files remain supported. Their single `data.adventure` imports into Slot 1, leaving existing Slots 2 and 3 unchanged. The preview and confirmation explain that scope. Rogue and global data retain the original import semantics.

The retained recovery copy contains all three Adventure keys, Rogue and global data. **Save Backups → Restore Previous Saves** restores the state before the most recent import, new Adventure/replacement or deletion. It is one recovery point, not a history. Old journals add null entries for the new keys on read; interrupted imports recover before normal autosaves begin. Storage failures keep recovery locked until it can complete.

## Ownership and QA

The build now assembles `save-storage.js`, `save-validation.js` and `save-portability.js` directly instead of keeping divergent embedded copies. `adventure-slots.js` owns selection and protected creation/deletion; `campaign/saves.js` owns runtime snapshot/restore. `adventure-intro.js` owns the Oak dialogue and starter construction.

`tests/serve-slots-review.cjs` serves an isolated fixture at localhost:4197. `suite-slots` runs the same profile tests on Android; `all` adds native D-pad/A/B checks for the new screen. Release QA reports list the verified cases and physical-device limitations.
