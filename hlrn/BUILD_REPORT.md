# HLRN Living Wiki — Corrective Editorial Rebuild

## Outcome

The HLRN wiki now uses the VRL Living Wiki's evidence depth rather than merely
its navigation shape. Public highlights, driver signature reels, race stories,
and Highline Central all come from a reviewed editorial layer.

Public URL:
https://shokkergroup.github.io/vrl-living-wiki/hlrn/

## Canon compartments

| Lane | Files | Public treatment |
| --- | ---: | --- |
| Season 1 | 16 | Official race deep dives and Central editions |
| Season 2 | 4 | Official race deep dives and Central editions |
| Highline Live | 29 | Source-first bonus files; excluded from season math |
| Fragments | 3 | Source-ledger preservation |

## Corrected editorial layer

- 20 authored Central editions.
- 5,819 structured editorial words.
- 357 full-broadcast chapters across the 20 official race tapes.
- 15-18 primary-broadcast chapters on every official race.
- 83 editor-reviewed Central / companion exact-source beats.
- 83 unique beat titles.
- 424 automated candidates quarantined from public editorial.
- Zero machine-generated public highlight cards.

## Full-broadcast chapter layer

The race page now follows the VRL playback model instead of using a handful of
companion excerpts as a substitute for the race:

- the primary race video is embedded directly in the deep dive;
- every official race has 15-18 chronological, uniquely titled chapter cards;
- clicking a card seeks the embedded primary video to that exact timestamp;
- each card exposes start, end, duration, phase, drivers, and a bounded call
  excerpt from the primary transcript;
- the URL retains the selected timestamp for sharing and recovery;
- previous/next controls advance through the race without leaving the page;
- Central and `The Show` receipts remain a separate editorial layer below the
  broadcast chapters.

The release contract rejects any official race with fewer than 15 or more than
20 chapters, any repeated chapter title within a race, or any chapter whose
source ID differs from that race's primary broadcast ID.

## Results and driver depth

- All 20 official winners retain position-specific receipts.
- Recovered podiums are published only where the current tape supports them.
- Trevor Haley retains the HLRN-supported Season 1 championship state.
- 99 driver identities remain searchable.
- 42 public dossiers currently have mapped HLRN source frames.
- Driver pages now include career stories, result form, signature tape, Central
  clippings, ranking resume, track fingerprint, evidence ledger, and full source
  appearance index.

## Highline Central

Central is now a newspaper-style publication with a visual identity distinct
from both VRL and HLRN's main control-room shell. Every official race has:

- an authored front-page headline and deck;
- a three-paragraph lead;
- a source-attributed hero frame;
- an opening/pressure/closing story;
- reviewed playback receipts;
- a result ledger and claim limitations;
- three notebook items;
- a separated `The Show` After Hours column.

## Update contract

New official races must receive a Central edition before their machine
candidates can enter Highlights or a driver signature reel. Highline Live
sources may be added immediately as source-first files; editorial cuts remain
optional and review-gated. Owner result sheets can fill standings, starts,
points, and full classifications without changing stable race or driver routes.

## Experience expansion

The current HLRN application is no longer limited to the corrected VRL-parity
surface. It now includes 38 route families and 24 deep tools:

- Results Room, Winner’s Garage, Visual Garage, and Photo Desk;
- Driver Compare, reviewed-only Battle Lines, Track Atlas, and Signal Timeline;
- Finish Vault, authored Story Paths, and The Show companion universe;
- Race Night Mixer and a persistent Replay Builder;
- Highline Lore Studio with JSON/CSV clip-manifest export;
- Highline Pulse as a browser-local source-delta return ritual;
- Evidence Ledger, Open Records, Corrections Desk, and Owner Result Intake;
- shareable exact receipts and downloadable race source packs.

These additions are HLRN-native. They use the network’s official/Highline Live
lanes, Highline Central publication, companion-show relationship, high-line
vocabulary, and reviewed race beats.

## Verification snapshot

- HLRN route families: 38.
- VRL reference route families: 36.
- Explore tools: 24.
- HLRN desktop/mobile route and workflow scenarios: 47.
- Full-broadcast chapters: 357.
- Official races with 15-20 primary chapters: 20/20.
- Cross-source broadcast chapters: zero.
- Duplicate chapter titles within a race: zero.
- Browser errors and overflow failures: zero.
- Shokker Lore build-wiki chapters: 18.
- Shokker Lore companion links checked: 12.
- Machine candidates in public editorial: zero.
- Unsupported complete results published: zero.

The executable comparison and gate evidence are in
`pipeline/feature_parity_report.json` and
`pipeline/feature_parity_report.md`.
