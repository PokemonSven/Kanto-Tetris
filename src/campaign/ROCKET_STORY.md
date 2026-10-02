# The Missing Signal — 1.8.4

This release implements three optional town chapters and one connected Adventure questline. Nicknames, multiple Adventure profiles and the Battle Tower remain future work. Existing saves start with no Rocket chapters completed; no main-campaign progress is reset. Rogue and Practice cannot enter the quest.

| Chapter | Prerequisites | Encounter | Base reward |
| --- | --- | --- | --- |
| The Missing Partner | Cerulean City, 1 badge | Rattata Lv.16, Zubat Lv.17; one rising cargo row every 30 seconds | $300, 2 Potions |
| Signal in the Static | First chapter, 3 badges, 12 lines on Route 8 or Route 7, Celadon City | Grimer Lv.27, Koffing Lv.28, Raticate Lv.29; NEXT jammed for 4 seconds every 26 seconds | $600, Super Potion, Revive |
| The Silph Relay | Second chapter, 5 badges, Saffron City | Nidorino Lv.37, Kangaskhan Lv.38, Rhyhorn Lv.38, Nidoqueen Lv.40; rising row / queued stone alternating every 24 seconds | $1,500, Rare Candy, Revive |

Mira appears in the appropriate town menu. Scenes pause the game; Back postpones them and Skip advances to the battle choices without starting the battle. Choose Careful for a six-second delay before the first hazard, or Bold for $100 extra on victory. Every hazard has a three-second warning. The approach persists across saves and opponent transitions; the delay is granted once per battle.

Rocket battles use your badge speed, without a battle floor. At the minimum chapter requirements of 1, 3 and 5 badges, Normal uses levels 2, 4 and 6; Hard uses 3, 7 and 11. Normal caps at 8 and Hard at 12. Easy remains level 1 unless the player changes the speed/score slider. The normal Adventure level cap and EXP setting remain in effect. The Saffron Giovanni story battle does not run his Viridian Gym item robbery or award its badge. Hold cannot bypass queued/falling stones. Agatha's permanent NEXT suppression remains separate.

The connected quest follows Mira's stolen Clefairy, an unusual radio signal and the Rocket relay. Route research only advances after the rescue, in Adventure on Routes 8/7; normal travel and training count, boss battles, Rogue and Practice do not. Objectives, requirements, rewards, choices, completion dates and Oak/Gary reactions live in Menu → Quests. Completed endings can be replayed. No quest panels are added to the live battle UI.

`rocket.js` owns the optional `save.rocketStory` version-1 record and battle indices 16–18. The main battle owner dispatches victory/loss; the hazard owner dispatches clocks and mandatory stones. `isStoryBattle()` covers Gary only (12–15). Rocket guards reject mismatched chapter order, missing research, invalid plans/timers/return towns, and Rocket battles in Rogue backups.

Victory and rewards are written together to the Adventure slot before showing the ending. A storage failure keeps the won battle available for retry and backup recovery; repeated completion cannot award twice. A saved final-opponent transition completes on reload. Loss or withdrawal heals the team, removes 15% of score, returns to the chapter's town and preserves previous quest progress. Item overflow goes to Sven's PC. Existing portable backups automatically include the new state and retain their recovery copy.

New project art uses built-in imagegen: `src/assets/rocket-grunt-v1.png` and `src/assets/researcher-mira-v1.png`. Exact final prompts are in `src/assets/rocket-art-prompts.txt`. Existing Oak, Gary and Giovanni portraits are reused for reactions and the finale.

QA: build the web artifact, run `node tests/serve-rocket-review.cjs`, and use the isolated origin on port 4194. The Rocket suite covers 35 cases; `/play` is uninstrumented. Android `suite-rocket` runs the same cases. Native `all` also dispatches real Android A/B/D-pad/Start events through story entry, skip, choices and battle pause. The release APK never contains fixtures. Physical Retroid ergonomics, latency and a full human balance playthrough remain external checks.
