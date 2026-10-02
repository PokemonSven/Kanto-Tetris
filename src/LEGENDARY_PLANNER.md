# Legendary Trials and Collection Planner — 1.8.6

Open **Menu → Legendary Challenges**. Each sanctuary has a separate board objective, your earned badge speed, a visible hazard countdown and a deliberate catch screen. No ordinary HP combat, items, XP, travel progress or score gains occur during a trial. Your campaign board, queue, Hold slot, team and combat timing are suspended and restored afterward.

| Pokémon | Adventure prerequisites | Board objective | Hazard |
| --- | --- | --- | --- |
| Articuno Lv.50 | Six badges; visit Seafoam Islands | Clear the six cyan foundation rows | Gray rising row every 24 seconds |
| Zapdos Lv.50 | Six badges; visit Power Plant | Make three Double-or-larger clears | Rising circuit row every 18 seconds |
| Moltres Lv.55 | Eight badges; visit Victory Road | Clear eight marked orange rows, including new ember rises | Ember row every 15 seconds |
| Mewtwo Lv.70 | Champion; visit Cerulean Cave; catch the three birds in this run | Clear twelve lines including two Tetrises | Psychic row every 20 seconds; NEXT hidden for four seconds after each surge |

Normal caps at speed 8 and Hard at 12; Adventure Easy remains at 1. Entering a trial or clearing its objectives cannot increase the speed.

All hazards warn three seconds before striking. Pausing or leaving the app freezes the trial. Hold cannot remove board rows or reset timers, and cannot reveal a hidden NEXT preview. The normal Hold and lock-delay rules remain.

After completing a trial, choose **Catch · Guaranteed**. The Sanctuary Ball does not consume an item. A full team sends the Pokémon to Bill's PC. Each species can be claimed once per run. **Claim Later** restores the campaign and keeps the completed trial available; re-entering goes directly to the catch opportunity.

Adventure withdrawal restores the suspended board. A topout uses normal Adventure recovery. In a new Rogue expedition, bird trials unlock by badge count without a habitat-visit requirement because Rogue uses a shorter route progression. Mewtwo still requires Champion status and the three birds. Rogue topout or withdrawal during an unfinished trial ends the expedition. Trial active time counts toward the Rogue recap; trial score does not. Completed Rogue records stay frozen during postgame.

The four species are removed from ordinary wild pools in Adventure and new Rogue runs. Existing ownership is retained. KT2 and legacy Rogue runs keep their previous encounter pools and do not gain trial access. New runs use **Expedition v2 / KT3** codes and separate records; entering a KT2 code recreates the prior ruleset.

## Collection planning

Open a Pokédex entry and choose **Plan & Pin This Species**, or open **Menu → Collection Planner**. Pin one wanted species per save slot. The planner shows habitats, registration status, evolution sources and Fly actions for visited, unlocked routes. Selecting an evolution source plans its previous form. A registered goal remains pinned until you unpin or replace it.

**Explore Route** lists species missing from the permanent Pokédex, rather than species absent from the current party. Dedicated legendary encounters are identified separately. The Fly menu also provides route-detail links. Fly uses the existing Adventure permission and destination checks; Rogue can inspect locations but cannot Fly. Planning stays inside paused menus.

## Persistence and ownership

`src/milestones.js` owns trials, eligibility, board objectives, catches and planning; `src/milestones.css` owns their presentation. The shared Tetris engine dispatches trial clears, the main active-time loop ticks hazards, and campaign save/loss dispatch recognizes active trials. Existing campaign and Tetris entry-point ownership checks remain.

Saves retain version 1 with optional `wantedDex` and `legendary` fields. Active trials include one bounded, non-recursive return snapshot. Import validates the pin, milestone IDs, counters, row marks, checkpoint mode and original campaign snapshot. Old backups remain valid. Starting requires a successful checkpoint write. Catching writes the reward and restored campaign together before granting the permanent registration. A failed catch write retains the exact opportunity. Completed objectives, pending catches and in-progress trial boards survive reload/export/import.

Browser and Android automated coverage is documented in `QA.md`. Physical Retroid firmware mappings and human difficulty tuning still require hands-on playtesting.
