# HLRN Living Wiki — Initial Build Report

## Outcome

The HLRN Living Wiki is a standalone, static, evidence-first archive with the
same durable source engine as the VRL Living Wiki and a deliberately different
late-night broadcast-control-room identity.

Public URL:
https://shokkergroup.github.io/vrl-living-wiki/hlrn/

GitHub Pages source:
https://github.com/shokkergroup/vrl-living-wiki/tree/gh-pages/hlrn

## Canon compartments

| Lane | Files | Competition use |
| --- | ---: | --- |
| HLRN Season 1 | 16 | Official |
| HLRN Season 2 | 4 | Official; active at snapshot |
| Highline Live | 29 | Fully covered bonus lane; excluded from official season math |
| Fragments | 3 | Source-ledger preservation only |

Official canon was reconstructed from channel titles, descriptions, chronology,
primary broadcasts, and the channel-authored `The Show` sequence. A source
never enters a season merely because it was streamed by HLRN.

## Recovered result layer

- All 20 official winners have a position-specific broadcast or companion-show
  receipt.
- Ten race files include a recovered podium.
- Season 1 champion Trevor Haley has a later HLRN channel receipt.
- The Season 1 finale preserves the apparent Trevor Haley win, the
  below-yellow-line post-race ruling, and David Applegate's declared victory as
  distinct facts.
- Full finishing orders, starts, points, and complete standings remain open
  pending owner records.
- Uncertain transcript spellings such as Joseph Yusnukas and Connor Papowell
  are explicitly marked for owner confirmation.

## Core routes

- `Watch` — mood deck, current signal, and Pack Finder
- `Ask` — structured answers followed by lazy exact-transcript search
- `Highlights` — exact moments, Last Lap Lottery, and Restart Stack
- `Central` — official desk files paired with `The Show`
- `Drivers` — normalized identity dossiers and source appearances
- `Seasons` — official chronology, champion state, and race files
- `Rankings` — seven explainable boards including tape-supported Winner Wire
- `Explore` — the full HLRN interaction deck

Additional routes include Highline Live, High Line Radar, Highline Frequency,
Records, Source Ledger, Methodology, individual race files, individual Central
issues, driver dossiers, and season pages.

## HLRN-only signatures

- **Highline Central:** one race, one desk file, one connected companion source
- **The Show shelf:** HLRN's own post-race editorial lane
- **Race Radar:** exact moments distributed across the broadcast timeline
- **Pack Finder:** races plotted by fight pressure and disruption pressure
- **Highline Frequency:** recurring broadcast language with playable receipts
- **Last Lap Lottery:** a random exact finish signal
- **Highline Live:** the requested non-league potpourri, covered without leaking
  into official statistics
- **Press H:** opens a random high-line battle receipt

## Evidence architecture

- Stable YouTube source IDs
- Original-video playback through `youtube-nocookie.com`
- Exact-second recovery links to the HLRN upload
- Lazy transcript shards so the initial page stays compact
- Explicit `machine-surfaced`, `authored-receipt`, `editor-verified`, and
  `creator-certified` evidence states
- Unknown-safe result boundaries
- Driver alias normalization without converting mentions into starts
- Explainable ranking inputs; no hidden confidence points
- A source ledger that retains partial or removed-file identities

## Validation

The initial build was checked at 1440×1000 and 390×844 across 15 routes.

- JavaScript syntax checks passed.
- All 20 official race files have timed primary tape and surfaced moments.
- The complete public snapshot contains 424 exact-source moment routes and 99
  normalized driver dossiers.
- 15/15 route renders returned HTTP 200.
- No route produced horizontal overflow.
- The persistent result-receipt player opened correctly.
- Ask returned the Season 1 champion receipt.
- The public GitHub Pages origin rendered with no browser-console errors.
- Public assets were republished losslessly after a live-origin check detected
  and rejected a clipped first transfer.

The automated report is stored at `pipeline/qa_report.json`.

## Updating the archive

1. Refresh the channel inventories.
2. Recover captions or local ASR for new sources.
3. Materialize timed transcript shards.
4. Review canon changes and source overrides.
5. Add position-specific results or owner records to `curation.json`.
6. Mine moments and rebuild `assets/data.js`.
7. Run the browser QA suite.
8. Publish the verified public assets to the Pages branch.

Owner-supplied result sheets can be added later without changing the source
identities, routes, or editorial contract established by this build.
