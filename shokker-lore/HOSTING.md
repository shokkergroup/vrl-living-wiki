# Hosting playbook

Researched July 25, 2026. Re-check tiers before committing a client — free
tiers move.

---

## The structural advantage: we never serve video

A SHOKKER LORE site does not host, mirror, or proxy a single second of media.
Playback is always the official YouTube iframe pointed at the creator's own
channel. That one architectural decision produces four compounding effects:

1. **Bandwidth is trivial.** The site serves HTML, JSON indexes, CSS/JS, and
   thumbnails. YouTube serves the expensive part. Per-visitor transfer is on
   the order of **0.5–2 MB**, not the hundreds of megabytes a video-hosting
   site moves.
2. **Hosting cost stays near zero at any traffic level** — see the tier table
   below.
3. **Zero rights exposure.** We never make a copy. Nothing to license, nothing
   to take down, nothing to argue about.
4. **100% of ad revenue goes to the creator.** Ads served in an embedded player
   pay the video owner and YouTube. The embedding site earns nothing — which is
   exactly what we want to be able to say out loud. See
   [WATCH_TIME_ENGINE.md](WATCH_TIME_ENGINE.md).

Thumbnails should be loaded from YouTube's own image CDN (`i.ytimg.com`) rather
than copied into the build. That pushes even image bandwidth off our host and
keeps the deployed artifact small.

**Say this to clients:** *"Your archive costs almost nothing to run, because
YouTube pays for the video. And every ad that plays on it pays you, not us."*

---

## Recommendation: Cloudflare Pages

| | Free | Pro | Business |
| --- | --- | --- | --- |
| Bandwidth | **Unlimited** | Unlimited | Unlimited |
| Builds/month | 500 | 5,000 | 20,000 |
| Cost | $0 | $5/mo | $50/mo |
| Storage | 10 GB | — | — |
| Custom domain + SSL | Included | Included | Included |
| Edge locations | 300+, sub-50ms globally | | |

Unlimited bandwidth on the free tier is not a promotional trick — it falls out
of Cloudflare's business model, and no other major host matches it at $0.

**The binding constraint is builds, not traffic.** Ten clients rebuilt weekly is
~40 builds/month. Ten clients rebuilt daily is ~300/month. Both fit inside the
free tier. At roughly 15+ clients on daily rebuilds, move to Pro at $5/month —
which covers the entire book, not per site.

> ⚠️ Reports conflict on custom domains per project on the free tier (one source
> says 5 per project, another says 1 per account). **Verify against your own
> account before promising a client a specific domain arrangement.** If the
> limit bites, GitHub Pages is the overflow (below).

### The limits that actually bite

Bandwidth is unlimited, so these are the real constraints:

| Limit | Free | Paid |
| --- | ---: | ---: |
| **Files per deployment** | 20,000 | 100,000 |
| **Max size of a single file** | 25 MiB | 25 MiB |
| Static asset requests | Free and unlimited | Free and unlimited |

The 100,000-file ceiling on paid plans requires setting
`PAGES_WRANGLER_MAJOR_VERSION=4` in the project settings — it is not automatic
just because the account is paid.

**The file count is the one to watch on a deep archive.** A page per source,
per entity, per quote, plus assets, adds up fast:

```text
3,000 source pages
+ 500 entity pages
+ 2,000 quote pages
+ 1,000 assets
= ~6,500 files          comfortably inside 20,000
```

But a Vault-band client with a page per *moment* can cross 20,000. Mitigations,
in order of preference: keep moments as anchors on their source page rather than
standalone files; paginate large indexes instead of pre-rendering every
permutation; move bulk media to R2 behind a `static.<client>.com` custom domain.

Anything over 25 MiB must go to R2 regardless. In practice nothing in a SHOKKER
LORE build should approach that — if a single file is 25 MiB, it is a mistake.

### Measured: what a real build actually weighs

VRL's deployable asset set is **129 MB across 648 files** — 76 MB of that is
poster art, 23 MB transcripts, the rest logos, winner frames, and JS bundles.
Nowhere near any limit.

Two things in that build are worth fixing on every project, because they cost
watch time rather than money:

- a **5.8 MB logo PNG** and a **6.3 MB JS bundle**
- Page weight determines time-to-interactive, and time-to-interactive
  determines whether a visitor is still there to click Play. A slow page loses
  the play *before the 30-second clock ever starts.* Compress art, ship
  responsive image sizes, lazy-load below the fold, and split bundles per
  surface.

**Asset discipline is a watch-time lever, not a hosting lever.** See
[WATCH_TIME_ENGINE.md](WATCH_TIME_ENGINE.md).

> Note: VRL's local working tree is ~2.6 GB, but almost none of that deploys.
> `pipeline/` (1.1 GB of caches, transcripts, and distills) and the separate
> Next.js app under `site-hosting/` (1.4 GB, mostly `node_modules`) are build
> inputs and tooling. **Never confuse working-tree size with deploy size** when
> sizing a host.

### Practical setup

- One Cloudflare Pages project **per client**, deployed from that client's
  build output. Keeps deploys, rollbacks, and analytics cleanly separated.
- Client points their own domain (or a subdomain) at it. **Let the client own
  the domain registration** — it is their asset, it removes you from the renewal
  path, and it is a meaningful anti-lock-in signal.
- Where a client has no domain, serve from a project subdomain until they do.
- Rebuild on a schedule tied to their publishing cadence, not on every commit.

---

## The rest of the field

| Host | Free tier | Verdict |
| --- | --- | --- |
| **Cloudflare Pages** | Unlimited bandwidth, 500 builds/mo, 10 GB storage, custom domain + SSL | **Default choice.** |
| **GitHub Pages** | Unlimited sites, 1 GB per site, ~100 GB/mo bandwidth (soft), 10 builds/hour, custom domain + HTTPS | **Solid overflow / secondary.** Static only, no server-side. Fine for a small league or a teaser build. |
| **Netlify** | New accounts: 300 credits/mo (deploys 15 credits each, bandwidth 20 credits/GB). Legacy pre-Sep-2025 accounts keep 100 GB + 300 build minutes. | **Avoid for client work.** Exceeding the free tier takes sites **offline** until the first of next month — no throttle, no grace period. A client site going dark is unacceptable. |
| **Vercel** | Hobby tier | **Do not use for clients.** ⚠️ The Hobby plan is **non-commercial, personal use only**. Client work violates the terms, and Vercel actively monitors and disables accounts. Pro is $20/seat/month. |
| **Bunny.net / Cloudflare R2** | Pay-as-you-go, very low per-GB | Only relevant if you ever self-host large assets. With YouTube serving playback, you almost certainly never will. |

### The Vercel trap

This is the one that could actually hurt. A free Hobby deployment is
technically identical to a paid one, so it is an easy default — and every
client site is by definition commercial. Suspension would take down every
client at once. **Never deploy client work to a Vercel Hobby account.**

---

## Cost model at scale

| Clients | Hosting | Notes |
| ---: | --- | --- |
| 1–10 | **$0** | Cloudflare Pages free, weekly rebuilds |
| 10–15 | **$0** | Still inside 500 builds/mo unless rebuilding daily |
| 15–50 | **$5/mo total** | Cloudflare Pages Pro, 5,000 builds |
| 50–200 | **$5–50/mo total** | Pro until builds exceed 5,000/mo |

That is total, not per client. Against a $49–$199/month recurring plan, hosting
is a rounding error — which is the whole reason the recurring plan is nearly
pure margin.

**Do not quote hosting as a line item.** Fold it into the recurring plan and let
it be invisible. A client who sees "$0.20 hosting" starts optimizing the wrong
thing.

---

## Build and deploy discipline

- **Deterministic builds.** Same inputs produce the same output — a prerequisite
  for delta rebuilds and for trusting a rollback.
- **Rebuild only on change.** Fingerprint the archive; if nothing changed, skip
  the deploy. Protects the build quota and keeps deploy history meaningful.
- **Keep the deployed artifact lean.** Ship JSON indexes sized for the page that
  needs them, not one giant blob every visitor downloads.
- **Preview before promote.** Deploy to a preview URL, run the quality gates
  against it, then promote. Never gate against production.
- **Keep an exportable copy of every client's structured archive** outside the
  host. Hosting is replaceable; the archive is the asset.
- **Set a no-index rule** on preview URLs and review surfaces so they never
  compete with the real site in search.

---

## What to tell a client about hosting

Short version, in their language:

> "Your archive runs on a global CDN with unlimited bandwidth. We don't host
> your videos — YouTube does, on your channel, so every play counts for you and
> every ad pays you. Your domain stays in your name. If you ever want to leave,
> we hand you the whole structured archive as an export."

That paragraph answers cost, speed, ownership, revenue, and lock-in in five
lines — and every clause is literally true.

---

## Sources

- [Cloudflare Pages pricing & bandwidth limits 2026](https://www.devtoolreviews.com/reviews/cloudflare-pages-pricing-bandwidth-limits-2026)
- [Cloudflare Pages free tier limits](https://rubabsdigital.com/blog/cloudflare-pages-free-tier-limits)
- [Vercel Hobby plan docs](https://vercel.com/docs/plans/hobby) · [Vercel free tier limits 2026](https://deploywise.dev/blog/vercel-free-tier-limits-2026)
- [Netlify free plan](https://www.netlify.com/blog/introducing-netlify-free-plan/) · [Netlify free tier 2026: what changed](https://agentdeals.dev/vendor/netlify)
- [GitHub Pages limits](https://supadrop.host/blog/github-pages-limits/)
- [Cloudflare Pages platform limits](https://developers.cloudflare.com/pages/platform/limits) · [file limit increased to 100,000 on paid plans](https://developers.cloudflare.com/changelog/post/2026-01-23-pages-file-limit-increase/)
- [Hosting platform comparison 2026](https://github.com/Wasserpuncher/hosting-platforms-comparison-2026)
