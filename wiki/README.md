# VRL LIVING WIKI — SHOKKER LORE build

A searchable living wiki of the **Vigilante Racing League** — every surviving
Wednesday-night broadcast across all four broadcaster eras (2021→today), plus
the permitted All-Star qualifying broadcasts,
indexed to the second, with playback wired straight into the original YouTube
tape. Sister build to the Lapsed Fan podcast wiki (`E:\SHOKKER PODCAST WIKI`);
the "sports series" proof-of-concept for selling living wikis to other leagues.

## Run it

```
python serve.py           # -> http://localhost:8791
```

Static site — any web host works (YouTube embeds need http(s), not file://).

## The features

- **Seasons 1-15** - full archive, era by era, with generated recaps, defining
  moments, best-race rails, and a reviewed championship ledger that preserves
  unknowns instead of inferring a champion from the finale winner
- **Most Exciting Races** - 219 canonical events ranked by a published eight-part
  model: finish drama, lead battle, restart stakes, strategy uncertainty, booth
  energy, disruption (capped), story stakes, and evidence confidence. All 222
  source broadcasts remain independently playable; continuation videos roll up
  to their canonical event
- **Nine empirical Top 25 driver boards** — Greatest in VRL History, Plate Kings,
  podium résumé, big-stage winners, versatile winners, Most Exciting on Tape,
  overtake-reel headliners, archive iron, and chaos magnets. Performance boards
  use exact result/title receipts; archive-impact boards are labeled separately.
  Owner priors and confidence have literal zero score effect
- **The Definitive VRL Hype History** — a 30:23 chronological exact-source edit
  across all 15 seasons. Full incident/replay windows stay intact, finishes keep
  the full last lap with supported winner evidence, and every chapter has a
  YouTube recovery link
- **Hall of Vigilantes / Driver Dossiers** - 133 evidence-retained canonical identities with a
  disclosed mixed participant-or-mention appearance index, curated wins and
  podiums, archive years/seasons, career write-ups, transparent archive-footprint
  gauges, number histories, track fingerprints, exact interview receipts, and
  explicit unknowns. Confirmed starts remain null until a reviewed entry ledger exists
- **Car-on-Tape pilot** — high-confidence real broadcast frames for a first
  group of drivers; everyone else receives a stylized recovered-number card
- **Winner's Circle** — every provable winner + a real video frame from a race
  they won (grabbed off the broadcast at the finish, zero AI)
- **The Hot 100** - 100 unique, exact-source memorable moments, distinct from the
  race ranking. Every entry exposes its component score, evidence confidence,
  baseline rank, diversity adjustment, and literal zero for unsupplied creator or
  editor votes; category caps prevent wrecks or profanity from taking over
- **FIRED UP** — 296 rage moments: bleeped cussing fits (YouTube censors = free
  profanity detector), radio meltdowns, paybacks, retaliation
- **Soundbyte Jukebox** — the booth's greatest lines, playable at the exact second
- **Record Book** — tote board, most-watched, Track Atlas, marathon nights, the
  Wednesday Streak, Victory Lane, Big One Board, most-talked-about
- **Shared-Tape Wire** - co-mention pairs with exact receipts; co-occurrence is not proof of rivalry or interaction
- **Poster Vault** — 237 pieces of original race poster art, lightboxed
- **Vigilante After Dark** — all-night auto-shuffling moment scanner
- **Race Night Mode** — moment toasts pop live in sync while you rewatch
- **Deep tape search** — every word the booth ever said in 222 eligible transcripts
- **Lost Tape Memorial** — honors the deleted-broadcaster gaps
- Press **C** anywhere for a caution flag.

## Data pipeline (`pipeline/`)

Local/free steps (no AI tokens): `fetch_channels` → `fetch_meta` (yt-dlp) →
`build_races` (Wednesday/All-Star-qualifier eligibility gate) →
`build_transcripts` → `normalize_distills` (stable public moment/quote schema) →
`build_provisional_roster` (name
clustering + `roster_overrides.json` for owner corrections) → `build_mentions`
→ `build_distilled` → `build_automoments` (keyword moment radar) →
`build_firedup` -> `build_excitement` (race ranking + season recaps) ->
`build_hot100` -> `build_source_dossiers` -> `build_highlight_reels` ->
`build_driver_interviews` → `build_driver_dossiers` → `build_driver_rankings` →
`build_definitive_history` →
`build_winner_shots` (video frames) → `build_driver_carshots` (resumable pilot) →
`build_posters` → `validate`.

`python pipeline/update.py` = one-command refresh. Newly discovered uploads stay in Fresh Tape quarantine until a reviewed season/scope mapping admits them.

AI distills (recaps/moments/soundbytes per race): `gen_workflow.py [limit]`
regenerates `vrl_distill_workflow2.js` for ONLY undistilled races —
**hard-capped batch size, 3 agents max concurrency, and human evidence review
before publication** (~100-115k tokens per race; see feedback_agent_budget memory).
Status: **222/222 eligible source broadcasts transcribed and distilled; 0 remain.**
They compile to **219 canonical race events across 218 dates**. The public catalog
is restricted to Wednesday nights plus the three reviewed Monday All-Star qualifiers. Friday, Monday mock, weekend, and technical
uploads are preserved as research but excluded from every public data surface.
Run `python pipeline/validate.py` after every batch to verify source coverage,
distill contracts, timestamps, and generated-asset parity.

## The four eras

1. **Midwest Days of Thunder** (2021-22) → 2. **AAA Broadcasting** (2022-24)
→ 3. **Track Limits Network** (2024-25) → 4. **Vigilante Racing Network**
(2025→, the league's own channel). One departed broadcaster deleted their
uploads — Aug-Oct 2024 and the TLN-era Race #1s are lost tape.
