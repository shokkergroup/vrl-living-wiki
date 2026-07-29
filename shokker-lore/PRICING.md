# SHOKKER LORE pricing — internal instrument

**This document is never shown to a client.** Public language stays:

> "Affordable for any niche audience or need."

The grid below exists so that a custom number can be produced in ten minutes
and defended if challenged.

---

## The core problem with a flat price list

A 50-race sim league and a ten-year YouTube channel with 3,000 uploads can
want an identical feature list. They do not cost the same to build. One flat
number either overcharges the league out of the deal or funds the big channel
for free.

Price on two axes:

- **Axis A — experience tier.** What gets *authored*: the world, the
  signatures, the dossiers, the creator tooling.
- **Axis B — archive band.** How much tape actually gets distilled, measured in
  **caption-backed hours** — never in upload count. Sources without captions
  ship as honest metadata-only pages and do not count toward the band.

Quote the client one blended number. Derive it internally from both.

---

## Axis A — experience tier

| Tier | Name | What it is |
| --- | --- | --- |
| 1 | **Season** | One season or defined window. Archive, search, recaps, moments, exact playback, light native branding. A door-opener, not the flagship. |
| 2 | **Pilot** | Full usable catalog. Authored visual world, entity dossiers, structured memory, one fan signature, one creator tool. |
| 3 | **Signature** | Distinct world, deeper Ask routing, native scoring, reviewed ledgers, one signature interaction, creator clip or research queue. |
| 4 | **Universe** | Two or more signatures, relationship and timeline surfaces, full creator studio, launch experience, correction desk. |

## Axis B — archive band

| Band | Caption-backed hours | Typical shape | Multiplier |
| --- | --- | --- | ---: |
| B1 · Pocket | Under 100 | A season, a short-run show, a young channel | ×1.0 |
| B2 · Working | 100–400 | Two to four years of a weekly show | ×1.3 |
| B3 · Deep | 400–1,200 | A mature podcast or long-running league | ×1.7 |
| B4 · Vault | 1,200–3,000 | Ten years of near-daily uploads | ×2.2 |
| B5 · Archive | Over 3,000 | Network, multi-show, full broadcast library | Custom only |

## The grid

Tier base price is at B1. Multiply by the band.

| | B1 Pocket | B2 Working | B3 Deep | B4 Vault |
| --- | ---: | ---: | ---: | ---: |
| **1 · Season** ($250) | $250 | $325 | $425 | — |
| **2 · Pilot** ($600) | $600 | $780 | $1,020 | $1,320 |
| **3 · Signature** ($1,200) | $1,200 | $1,560 | $2,040 | $2,640 |
| **4 · Universe** ($2,000) | $2,000 | $2,600 | $3,400 | $4,400 |

Round to the nearest $25 when quoting. Season above B3 is not offered — a deep
archive cannot be honestly served by the entry tier.

**These are still cheap.** A freelance web designer charges $1,000–$10,000 for
a site that does none of this; an agency charges $10,000–$50,000+. The top of
this grid is $4,400 for a decade-long archive with two signature experiences.
Affordability is not the risk. Underpricing the deep archives is.

---

## Recurring service

The build buys the seat. **The monthly plan is the business.**

| Plan | Monthly | Included | Active time |
| --- | ---: | --- | ---: |
| **Keep-alive** | $49 | Hosting, health checks, automated intake at a normal publishing cadence, quarterly archive refresh, **monthly watch-time report** | 5–15 min |
| **Curated** | $99 | Everything above plus light curation, correction handling, monthly moment/clip shortlist, **back-catalog resurrection report** | 15–30 min |
| **Studio** | $199 | Higher source volume, deeper clip queues, priority corrections, **sponsor-forwardable archive report**, door A/B tuning | 30–60 min |

**The report is the retention product.** A recurring fee is never questioned
when a one-page report arrives every month showing delivered watch hours,
resurrected uploads, and top-converting moments — with instructions for
verifying it against the client's own YouTube analytics. Ship the report from
month one or the plan will churn. See
[WATCH_TIME_ENGINE.md](WATCH_TIME_ENGINE.md).

### Why the floor moved from $25 to $49

Self-serve tools that bolt a searchable wiki onto a podcast feed sit at
**$19–$49/month with no human in the loop** (see `COMPETITORS.md`). A plan
that includes judgment, curation, and correction cannot anchor beneath them
without teaching the client that judgment is worthless.

$25/month also does not survive contact with reality: one support email, one
correction request, or one "can you look at this?" and the month is
underwater. $49 is the lowest number that survives a single human interaction.

Attach a plan to **every** build. A build without a recurring plan is a
one-time payment for an asset that will rot.

---

## Cost of goods — there basically isn't one

Production runs on a **flat monthly subscription with a weekly usage limit**,
not metered per-token API billing. Model spend is not a variable cost. It is a
fixed monthly number divided by however many builds ship that month.

### What was actually measured

| Build | Scale | Distill cost |
| --- | --- | --- |
| **VRL** | 222 source broadcasts transcribed and distilled → 219 canonical events, 486 hours, 185 identities, 2,539 moments | ~100–115k tokens per race, hard-capped batches, 3 agents max concurrency |
| **WWAM** | 510 canonical sources — **111 caption-backed**, 390 metadata-only, 9 caption-limited — 1,490 receipts, 928 artifacts, 29 engines, 14 interfaces, 112 regression files | Bulk of the work inside a 24-hour window |

**Both archives, plus all research and the entire engine buildout, came in
under half of one week's limit.**

### What that means for pricing

- ~330 distilled sources plus full product buildout fit in **half a week**.
- A week absorbs **two deep archives** and their assembly — and most of that
  half-week went to engines and interfaces that are now reusable, so future
  builds are cheaper still.
- **Marginal model cost of one more client build is effectively zero.**
- Fully loaded: a flat monthly plan across four builds is a low-double-digit
  figure per build, against quotes of $600–$4,400.

**Gross margin on a build is somewhere north of 95%.** Hosting is a static site
on a free or near-free tier. At $49/month the recurring plan is almost pure
margin — which is exactly why it must not be priced at $25.

### The real constraints, in order

1. **Operator active hours** — 5–10 per build. This is the binding one.
2. **Wall-clock agent time** — deep archives occupy the unattended pipeline
   longer, which limits builds per week.
3. **Weekly usage limit** — not close to binding at a sane cadence.

Price and schedule against #1. Everything else has headroom.

### So why does the archive band exist?

**Not as a compute pass-through.** Never tell a client it reflects processing
cost — it does not, and the claim will not survive a curious question. The band
is justified by the things that actually are scarce:

- **Review time.** More sources means more alias collisions, more identity
  calls, more gate failures to triage — all human hours.
- **Canon decisions.** More eras and broadcaster changes means more exception
  rules to author and defend.
- **Wall-clock.** Deep archives hold the pipeline longer, displacing other
  builds.
- **Delivered value.** A ten-year archive is worth more to its owner than a
  single season. Price follows value.

### Band on caption-backed sources, not uploads

WWAM shipped **390 metadata-only pages** beside 111 distilled ones — honest
zero-states, real artwork, working players, no invented claims. That is a
legitimate product state, not a shortfall.

So archive size and archive effort are **decoupled**. A 3,000-upload channel
with 400 caption-backed broadcasts is a mid-band build wearing a large number.
Count what is caption-backed; catalogue the rest honestly.

**Rule:** audit caption coverage before quoting. Then sell the honest split —
everything catalogued and playable, caption-backed tape distilled deeply,
coverage published in plain numbers.

### The one genuine outside cost

Transcription, and only for archives whose captions do not already exist.
Platform captions pulled by the pipeline are free; commodity ASR is $0.15–$0.40
per hour. Three thousand genuinely uncaptioned hours is $450–$1,200 — more than
most build fees.

If a prospect's archive has no captions, either quote transcription recovery as
a separate line item at cost + 40%, or route those sources to the metadata-only
lane and say so plainly.

---

## Internal time targets

| Sale | Maximum normal active operator time |
| --- | ---: |
| Season | 3–5 hours |
| Pilot | 5–7 hours |
| Signature | 7–9 hours |
| Universe | 8–10 hours |
| Add one band above B2 | +1–2 hours |

Agent processing may run far longer than active time. Track both. Use the
active-time ceiling to protect capacity — it is the only real constraint.

---

## Add-ons

| Add-on | Price |
| --- | ---: |
| Additional signature fan feature | $200–$450 |
| New dossier/entity family | $150–$300 |
| Reviewed results, title, or claim ledger | $200–$600 |
| Clip-opportunity pack for one source | $25–$50 |
| Themed supercut research packet | $100–$250 |
| Finished vertical clip | $75–$250 |
| Major visual redesign | $350–$900 |
| Additional show/feed under the same brand | 60% of its own tier × band |
| Transcription recovery | Quoted at cost + 40% |
| Remove the SHOKKER LORE credit line | $150 one time, or included at Tier 4 |
| Sponsor & segment index | $250–$600 |
| Watchalong companion mode | $300–$700 |
| Additional playable trail or "Start Here" route | $100–$250 |
| Membership-gated archive surface | $250–$600 |

Actual clip editing stays separate from the archive service. SHOKKER LORE
normally supplies source receipts, proposed windows, rationale, risks, and
promotional-copy ideas — not finished edits.

---

## Scope boundary

The quoted price covers **one primary channel or feed**, caption-ready, at the
audited band.

Quote separately for:

- additional channels, feeds, or unrelated shows;
- missing captions requiring transcription recovery;
- private or member-only sources;
- multilingual processing;
- manually reconstructed results, rosters, or identities;
- authenticated speaker or factual verification;
- rights-sensitive excerpts;
- unusual integrations or migrations.

### Tripwires — stop and re-quote

- active hours cross the tier ceiling before launch;
- caption coverage lands under the audited threshold;
- the client adds a second feed, show, or brand mid-build;
- results, rosters, or identities must be reconstructed by hand;
- a third revision round on the same surface;
- the client cannot supply corrections or approvals within a week.

Every tripwire gets the same response: name it in writing, quote the add-on,
continue only on a yes. **Absorbed scope is the single thing that turns a
ten-client studio back into a job.**

---

## Volume model

Recurring revenue compounds; builds do not. Model the year on installed
clients.

```text
Year one, conservative
------------------------------------------------------
8 Season builds averaging $300                   $2,400
10 Pilot builds averaging $800                   $8,000
4 Signature builds averaging $1,800              $7,200
2 tier upgrades averaging $900                   $1,800
add-ons and archive expansions                   $3,000
------------------------------------------------------
build revenue                                   $22,400

24 recurring clients averaging $85 × 12         $24,480
------------------------------------------------------
illustrative year one                           $46,880
```

The exact total is not the point. The point is that **recurring passes build
revenue somewhere in year one and never looks back.**

| Installed clients | Avg. plan | Monthly recurring |
| ---: | ---: | ---: |
| 20 | $85 | $1,700 |
| 40 | $85 | $3,400 |
| 60 | $95 | $5,700 |
| 100 | $95 | $9,500 |

At roughly thirty minutes per client per month, 40 clients is about 20 hours
monthly — one operator, comfortably. 100 clients needs a second seat or an
assistant on the Pulse block.

---

## Sales positioning

Never lead with a number. Lead with their archive.

**Small league:**

> "Your season becomes a permanent, searchable fan archive. Every race gets a
> page, a recap, the best moments, and exact links back to your broadcasts.
> Then every new race joins the story automatically."

**Creator or show:**

> "We turn your usable public back catalog into a working SHOKKER LORE. Fans
> can search it, explore the people and topics, and play the exact moment. Your
> team gets a research desk and a clip queue built from the same memory. It
> looks and behaves like your show, because we model your show — not a
> template."

**When they have a revenue problem** (see the monetization-posture table in the
guide, §10):

> "Your back catalog stops being a graveyard and starts being a second channel.
> Every moment fans explore is a play button pointed at your channel — those
> plays count toward your watch hours, ads run on them, and every cent goes to
> you. We don't host your video and we don't take a cut. Every month you get a
> report, plus instructions for checking it against your own YouTube analytics."

Do not sell "we will build you an AI wiki." And **never promise views, watch
hours, revenue, rank, or a timeline** — see the compliance spine in
[WATCH_TIME_ENGINE.md](WATCH_TIME_ENGINE.md).

---

## Guardrails

- Define the included primary channel or feed in writing.
- Define "caption-ready" and audit it before quoting.
- Keep hosting subject to a reasonable usage limit.
- Require client approval for public facts and sensitive clips.
- Never promise traffic, revenue, SEO rank, or virality.
- Preserve an export of the client's structured archive.
- Charge for scope changes rather than silently absorbing them.
- Log active operator hours, tokens per distilled source, and wall-clock
  pipeline time on every build. Not dollars — the subscription is fixed.
- Review this document against those logs after the first five paid clients.

---

## Related

- [COMPETITORS.md](COMPETITORS.md) — the field, the wedges, and the objection.
- [SHOKKER_LORE_SOURCE_GUIDE.html](SHOKKER_LORE_SOURCE_GUIDE.html) — §13
  commercial model, §14 competitive position, §15 studio operations.
