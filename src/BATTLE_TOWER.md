# Battle Tower — 1.8.8

Unlock: defeat Champion Gary in Adventure. Open Menu → Battle Tower, or the Battle Tower button in town. Each Adventure profile owns its set, records, ribbons and board themes. Rogue and Practice remain separate.

A set has exactly three rounds, two opposing Pokémon each. Every round starts with a healed team, a fresh board and empty Hold. The preparation screen previews the next opponents, objective and hazard combination. Inventory allows partner/item changes; Bill’s PC allows team swaps before starting. No PC swaps during a fight. Participating partners keep earned EXP even when the set is lost or withdrawn.

| Round | Normal opponents | Board objective | Hazard interval |
| --- | --- | --- | --- |
| Stone & Tide | Golem 62, Kabutops 64 | Clear 6 lines | Every 24 seconds: one rising row plus a mandatory stone brick |
| Veil & Ghost | Gengar 65, Jynx 67 | Make two Double/Triple/Tetris clears | Every 26 seconds: mandatory ghost brick and 6 seconds of hidden NEXT |
| Dragon Summit | Gyarados 68, Dragonite 70 | Clear 10 lines including two Double-or-better clears | Every 28 seconds: one rising row, mandatory ghost, and a 6-second NEXT veil |

All hazards have a 3-second warning. Queued and falling mandatory bricks block Hold. The last opponent stays at 1 HP until the round’s board objective is met. Objectives and countdowns occupy the existing travel/battle strips; there are no new persistent HUD panels.

Easy opponents are 8 levels lower and use 80% of the Tower HP envelope. Hard opponents are 6 levels higher and use 115%. Normal HP is 360 + level × 6 + opponent slot × 60. Species and type matchups still affect the existing combat system. Normal remains at badge speed 8, Hard at 12; Easy remains at badge speed 1 with its existing voluntary speed/score slider. No lines, rounds or repeat sets increase gravity. Forced hazard bricks retain their established fast fall and are explained in preparation.

Win all three rounds to award the relevant Easy / Normal / Hard Tower ribbon to owned partners that cleared lines during the set. Identity follows evolution, so the ribbon is retained by their evolved form. Existing starter and Oak’s Partner keepsakes remain intact. Ribbons are visible in the Pokédex detail and Trainer Card scrapbook.

Board themes: first successful set unlocks Slate; three successful sets across difficulties unlock Dusk; a Hard clear unlocks Gold. Select an earned theme in Tower → Records & Board Themes. Changes affect the playfield and NEXT background/grid, preserving piece colours, contrast settings, grid preference and boss preview suppression. Classic retains existing route/boss palettes.

The recap reports rounds won, lines, score gained, active battle time and rewards. Records show the best 10 of the latest 90 attempts, filtered by difficulty and Tower ruleset. Lifetime set-clear totals remain after old attempt rows roll out. Ranking: rounds won, then score, then active time. Easy’s score slider still affects score. Timing excludes menus, preparation, opponent transitions and background time.

Preparation, live battles, pending opponent transitions and recaps save in the active Adventure slot and version 2 backups. Continue cards name the Tower round/stage. Result application is idempotent; reloading a recap cannot award another clear. Failed saves show a retry message and preserve the live result. Save & Return to Title is available in preparation/results and the normal battle menu. Withdrawing requires confirmation, records completed rounds, heals the team, and has no score penalty. Leaving the recap returns to Indigo Plateau.

Implementation ownership: src/campaign/tower.js owns Tower progression, validation, hazards and rewards. Existing campaign battle dispatch, save restore and hazard delivery call its entry points. Opponent art reuses Brock, Agatha and Lance’s existing credited portraits; this release adds no generated art.
