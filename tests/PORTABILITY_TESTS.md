# Save portability maintenance

Build with `node tests/build-portability.cjs`. It reads the unchanged 1.7.2 build and inserts `src/save-storage.js`, `src/save-validation.js`, and `src/save-portability.js` into the offline HTML. Unique-anchor checks and JavaScript parsing run before writing the output.

Run `node tests/serve-portability-review.cjs`, then open these URLs and use their Run buttons:

- `http://127.0.0.1:4180/qa-backups` — 26 backup checks.
- `http://127.0.0.1:4180/qa-controls` — 34 controller/keyboard checks.
- `http://127.0.0.1:4180/qa-pause` — 13 timing/pause checks.
- `http://127.0.0.1:4180/` — normal game for file-picker and download checks.

Run suites sequentially because they share the test origin's local storage. The backup suite snapshots/restores local storage. `tests/fixtures/portable-smoke.json` is a disposable file-picker fixture, not player progress. Source injection and deterministic clocks exist only in the QA server's responses.

## Format and recovery

The export envelope has `format: "kanto-tetris-backup"`, integer `version: 1`, an ISO `exportedAt`, a build string, and `data` with Adventure, Rogue, Pokédex and preferences. A null run deliberately means an empty slot. Run snapshots retain their existing native version and keys. The importer supports backup version 1 and rejects unknown future versions. Limit: 2 MB.

Validation checks nested data, reference integrity and essential snapshot structures before preview or mutation. Device-specific alphanumeric KeyboardEvent codes are retained. Text displayed in HTML is escaped; unsafe markup/prototype keys are rejected. Native saves predating the mode field are labeled before export; existing route migration remains the native loader's responsibility.

The recovery journal contains exact raw values for the eight managed keys, plus a timestamp and pending/ready state. The journal is written and read back before any slot replacement. A partial import rolls back; incomplete rollback leaves the pending journal and locks autosave. On startup, recovery runs before the game's first storage reads. Manual recovery retains the same previous state for retry; it is one recovery point, not a history stack. The journal itself is local and is not recursively included in exported backups.

The current live run is saved before an import to capture the latest paused board/progress in recovery. Successful import reloads runtime preferences/Pokédex and returns to title with saving suspended during reset, preventing the outgoing live run from overwriting the imported slots.
