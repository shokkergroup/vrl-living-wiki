# SHOKKER LORE — Universal Channel Engine

SHOKKER LORE turns a creator's back catalog into a source-linked, searchable
world. The engine is intentionally universal; the vocabulary is not.

## The invariant formula

1. **Scope the canon.** Define which uploads belong, which do not, and the
   exceptions. Keep the exclusion report.
2. **Preserve the tape.** Store immutable source IDs, dates, durations,
   thumbnails, captions/transcripts, and exact timestamps.
3. **Distill the story.** Recaps, people, topics, moments, quotes, arcs, and
   show-specific signals are editorial data with evidence links.
4. **Model the show's DNA.** A racing league cares about lead battles,
   finishes, incidents, championships, and drivers. A movie show cares about
   verdicts, running gags, franchise continuity, watchalong reactions, hosts,
   and spectacularly unhinged takes.
5. **Build doors, not lists.** Search, Ask the Tape, identity pages, timelines,
   movies, graphs, rankings, and community memory are different doors into the
   same evidence.
6. **Return value to the creator.** Every clip opens the original upload. The
   wiki creates discovery and attachment without becoming a pirate mirror.

## Portable contracts

`showpack.schema.json` is the white-label content contract. A show pack can
replace labels, scoring signals, entity types, visual tokens, and feature
names without replacing the evidence engine.

Example proof packs are deployed independently:

- **VRL:** race broadcasts → drivers, tracks, moments, results, excitement,
  rivalries, seasons, Time Machine, Ghost Telemetry.
- **Movie-commentary channels:** films, franchises, hosts, reactions, takes,
  running bits, watchalong sync, Timeline Trauma, and the Quote Crypt belong in
  a separate show-specific product rather than inside the racing archive.

## Evidence rule

Any factual or editorial item intended for public display should be able to
answer: “Which source, at what time, supports this?” Derived scores must name
their ingredients and distinguish official data from reconstruction.

## Answer-routing rule

Ask the Tape is not a keyword-results page. Each show pack should route a
question through five layers:

1. resolve the named person, title, franchise, team, or topic through its
   canonical identity and aliases;
2. classify the intent (winner, verdict, funniest take, incident, timeline,
   comparison, and so on);
3. answer from the most authoritative structured ledger first;
4. rank timestamped supporting moments using entity, intent, type, and heat;
5. open the raw transcript only as corroboration.

For VRL, “What race did this driver win?” checks official distilled winners
before searching moments. A movie-show pack would use the same route for
questions such as “Which Halloween movie did they rank highest?” by checking
its verdict ledger before returning reactions and quotes.
