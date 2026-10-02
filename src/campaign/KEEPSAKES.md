# Pokémon keepsakes — 1.8.5

Open **Trainer Card → Team Scrapbook → View & Nickname**, or open an owned Pokémon from your team, the Pokédex, or a PC preview and choose **Nickname**. The scrapbook has Team and Bill’s PC tabs with six entries per page.

Use the D-pad to move around the letter grid and A to type or select. Up/down moves between keypad rows. Space, Delete, Clear and a case switch are available. Choose Save Nickname to commit, or B/Cancel to discard the draft. A keyboard can type directly in the input. Names allow up to 12 letters, numbers, spaces and `. ! ' -`. Saving an empty name restores the species name. Species names and numbers remain visible in previews and scrapbook entries, and search accepts either the nickname or species name.

New acquisitions record the location, date, level and method: wild catch, starter, quest gift, Rogue reward or legendary sanctuary. Every starter receives a Starter Ribbon. Oak’s special Pikachu receives a permanent **Oak’s Partner** badge tied to the existing 20% HP/damage/EXP bonus; the badge and bonus follow it to Raichu. Other starters receive the ribbon without the special Pikachu bonus. Keepsakes stay inside menus, while the existing team and inventory labels show nicknames.

## Persistence and compatibility

- Entry `keepsake` version 1 stores the nickname, original species, location, acquisition method/date/level, ribbons and evolution path. It belongs to the run, so Adventure and Rogue remain separate.
- Nicknames, original catch details and ribbons survive evolution, PC deposits/swaps, save/reload and versioned backups. Renaming during a legendary trial also updates its return checkpoint.
- Nickname Save is transactional: a failed write restores the previous name and leaves the draft available for retry. The existing save-status indicator reports success/failure. Practice and boss-test teams cannot be renamed.
- The game still owns one record per species. Duplicate catches award their existing EXP benefit and keep the original identity. Recatching a species that evolved away creates a fresh ordinary identity; it cannot inherit the starter or lab-partner ribbon.
- Evolution into an already-owned species retains the existing roster merge behavior. The evolving Pokémon normally supplies its origin/history and nickname (or the resident nickname if unnamed), and keepsake ribbons are retained. An existing starter takes identity priority over an ordinary catch; Oak’s special partner takes priority over both. This preserves the original lab identity and bonus.
- Older saves infer starter ribbons only from recorded starter/evolution flags. Wild catches show **Location not recorded** and omit the unknown catch level. Their existing acquisition timestamp is retained. Migration does not invent a current-route catch location.
- Import validates nickname characters/length, version, location/date/level bounds, ribbons and evolution paths. An Oak badge requires the corresponding special-partner flag. Old backups without keepsakes remain supported.

No changes to the battle speed curve, hold rules, Pokémon stats or duplicate-catch balance are introduced by this feature.
