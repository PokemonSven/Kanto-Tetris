# Kanto Tetris 1.1 Nightly

Unofficial fan-made browser prototype.

## Play

Open `index.html`, or use GitHub Pages if this repository is deployed.

## Team EXP Share + active bonus (2026-09-07)

EXP Share is always on for the current party, up to six Pokemon. No item or
setting is required. Rogue Run, Adventure Easy/Normal/Hard, and Boss Test all
use the same rules.

| Recipient | EXP per earned reward |
| --- | --- |
| Active Pokemon | 150% of the previous active reward |
| Each other party member | 100% of the previous active reward, not divided |
| Pokemon in Bill's PC or outside the party | None |

For example, a battle previously worth 48 EXP to the active Pokemon now gives
72 EXP to the active Pokemon and 48 EXP to each of the other five teammates.
Existing internal battle multipliers are preserved. A carried Speed Bike still
works; a Speed Bike stored in Sven's PC does not. Whole-number rewards use the
existing rounding convention.

Wild/Gym victories, Tetris bonuses, and duplicate-catch EXP use this capped,
party-only award system. Tetris uses the previous active Pokemon's reward as
its shared baseline, rather than calculating a different amount for each
reserve's level. Duplicate-catch bonuses now train the party instead of writing
uncapped EXP directly into the duplicate's collection entry, so boxed Pokemon
cannot gain EXP from that path either.

Each Pokemon's current level cap is enforced independently. A capped active
Pokemon does not stop under-cap teammates from earning EXP. EXP at the cap,
including overflow from reaching it, is not banked for the next badge.
Switching or depositing Pokemon updates the bonus/recipients immediately.
Party members can level up and evolve through shared EXP; fainted reserves
remain fainted, including through evolution.

Normal 1/2/3-line clears without a knockout do not create a new EXP source.
Non-Gym recovery remains a no-EXP phase. Rare Candy and quest Pokemon rewards
retain their existing non-EXP behavior and cap checks.

The previous Gym defeat -> city menu fix is included unchanged. The same save
format and storage keys are retained; no run reset is required when updating
the game on the same browser/site. Updated party help and Prof. Oak's guide
explain the EXP rules in-game.

Validation: 152 automated Chromium regression checks passed, covering the old
reward baseline, all modes, all eight Gym caps, Speed Bike, party/PC swaps,
Tetris and knockout paths, duplicate catches, evolution, save/load
serialization, and Gym defeat city returns. The production HTML also passed
startup -> Boss Test -> Gym battle UI checks with native timers, and desktop /
390px-wide mobile screen checks without JavaScript errors or horizontal
overflow. Regression tests use controlled timers and an in-memory Web Storage
adapter; the smoke test uses native timers with the same storage adapter.

## Gym defeat → city menu fix (2026-09-07)

Losing a Pokémon battle to a Gym Leader now returns you immediately to that
leader's city. Adventure Mode Gym board top-outs do the same. For example,
losing to Brock opens Pewter City's normal menu.

- No 10-line Gym recovery phase, lost city access, or automatic rematch.
- The battle board and Gym hazards are cleared; your team is healed.
- Heal, shop, choose a fresh Gym rematch, or return to optional route training.
- Existing training is unchanged: Pewter's lap is 25 lines; later cities keep
  their existing route-length laps. Gym progression stays frozen until victory.
- Team, collection, badges, inventory, and run progression are retained. The
  existing 15% score penalty still applies to a recoverable loss.
- Saved games in the old Gym recovery phase now load directly into the correct
  city. Saving in a city also restores that menu and its shop stock on load.
- A held keyboard drop key cannot automatically select a rematch on repeat.
- Abandoned Gym transition timers cannot interfere with a rapid rematch.
- Pokémon Center heals now correctly retain the full HP of high-HP species.

Non-Gym recovery rules are unchanged. Rogue Mode Tetris top-outs still end the
run; Rogue Pokémon-battle losses against a Gym Leader return to the city.
Gym victory rewards, progression, artwork, and music are otherwise unchanged.

## Nightly build includes

- Rogue Run
- Adventure Mode
- Boss Test menu
- Custom Pokémon sprite set
- Custom item sprites
- Custom Gym Leader portraits
- Sven Studios splash screen
- Updated title hero screen
- Prof. Oak guide screen
- Reworked Gym Leader boss mechanics
- Clean themed boss special popups
- Gym Leader badge handoff dialogue
- Fresh board after each Gym clear

## Boss mechanics in this nightly

- Brock: Stone Drop
- Misty: Rising Tide
- Lt. Surge: Board Shock + Paralysis
- Erika: Creeping Vines
- Koga: Poison Spikes
- Sabrina: Psychic Spin
- Blaine: taller Flame Column
- Giovanni: Earthquake color break + item lockout

## Upload note

This package is intentionally clean for GitHub:

- `index.html`
- `README.md`
- `VERSION.txt`

The active game is contained in `index.html`, with art embedded directly.
