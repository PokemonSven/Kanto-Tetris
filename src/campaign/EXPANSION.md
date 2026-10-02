# Gary and Rogue Expedition — 1.8.0

`campaign/story.js` owns rival teams, story battle entry, loss, victory, Champion hazards and Hall of Fame presentation. Its five battle entry points join the existing ownership checks. `rogue.js` owns seed generation, random streams, rewards, modifiers, recaps and records. `expansion.css` owns their layouts. The builder embeds Gary's PNG into the standalone HTML and APK; no art request is needed while playing.

## Rival and Champion

Gary picks Charmander against Bulbasaur, Squirtle against Charmander, and Bulbasaur against Squirtle. The original starter choice is retained independently of evolution. His optional town encounters appear at Cerulean after Brock (two Pokémon, ace 18), Celadon after Surge (four, ace 29), and Indigo Plateau after all eight badges (five, ace 52). Town healing and training remain available before accepting. A victory is permanent in that run; leaving town without fighting permits a later return.

After Lance, the League checkpoint stays at four Elite members defeated. Gary's Champion team has six distinct Pokémon, with an evolved counter-starter ace at level 65. The player's battle cap is 67. Champion Surge raises one row every 30 active seconds, with a three-second warning. Rival battles use ordinary combat and idle pressure, without extra board hazards.

Only the Champion victory awards the new Hall of Fame celebration and postgame unlock. Adventure losses heal the team, apply the normal score penalty, and retain previous victories. The delayed KO cancellation contract is shared with gyms. The celebration is saved as pending, so reload returns to it. Credits follow the team celebration; completed Rogue runs then show their recap.

Old completed saves retain their existing Cave access and Hall of Fame. They may challenge Gary without replaying the Elite Four. Older incomplete saves mark past rival stops complete based on badge progress, avoiding forced backtracking. Existing slots remain version 1 with optional journey metadata. Champion is also available through isolated Practice.

## Rogue ruleset and seeds

New Rogue runs use `expedition-v1`: a stack topout or full-team faint ends the run at every stage, including rivals and the League. Legacy Rogue saves retain their existing loss behavior and are recorded separately as `legacy-v0` when they end. Easy uses 0.8× gravity, Normal 1×, Hard 1.1×. Other difficulty rules are shared; the UI states the gravity difference.

Codes such as `KT2-N-MY-SEED` include the ruleset generation and difficulty. Plain seeds allow 1–24 uppercase letters, digits and hyphens; blank entry uses a cryptographically generated seed. Separate seeded streams handle pieces, world/combat and reward offers. Audio noise never consumes these streams. Their integer states are saved along with the board, bag and pending choices.

The same code, starter and decisions reproduce random sequences. Timing and actions still affect combat and therefore later world draws. A seed is not a replay or a promise that different player actions yield identical encounters. A future gameplay RNG/balance change must advance the ruleset/code generation rather than mixing its records with Expedition v1.

## Rewards

After each gym, the existing badge sequence ends at a saved three-choice reward screen. Choose exactly one: a two-item pack, a Pokémon at that gym's appropriate level, or a run modifier. Full inventories send overflow to Sven's PC; full teams send Pokémon to Bill's PC. Offers favor species not currently on the team or in the PC.

| Modifier | Per-stack effect |
| --- | --- |
| Power pact | Attack ×1.12; incoming damage ×1.08 |
| Guard pact | Incoming damage ×0.85; attack ×0.92 |
| Second wind | After a trainer Pokémon KO, heal each surviving teammate by 10% maximum HP |

Each modifier caps at three stacks and expires with the run. Choices persist before the UI opens; claiming saves the new state before dismissing. A failed write rolls back the grant and retains the same offer. New rewards replace the old random gym-item drop; normal prize money remains. Practice and Adventure do not receive Rogue modifiers.

## Records and portability

Completed-run records contain seed, ruleset, difficulty, outcome, score, lines, badges, active time and team. Completion snapshots are frozen so postgame play cannot alter the recap. The last 200 records are retained; the UI shows the top ten for the selected difficulty/ruleset, ranked by Champion status, badges, score and active time. IDs make repeated completion/record calls idempotent. These are local personal records, not a trusted competitive leaderboard.

Portable backup v1 adds optional Rogue records and validates journey/seed/reward state. Existing backups remain accepted. The recovery journal accepts the old key set and normalizes its missing records slot, preserving recovery of pre-1.8 imports. Records are in a dedicated storage key; existing preference writes cannot overwrite them.

Automated coverage is described in `android/TESTING_1_8_0.md`. Physical Retroid checks and a human campaign/balance playthrough remain necessary.
