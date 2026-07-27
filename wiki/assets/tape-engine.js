(function (root) {
  "use strict";

  var SYNONYMS = {
    crash: ["crash", "wreck", "spin", "incident", "big one", "airborne", "flip"],
    wreck: ["crash", "wreck", "spin", "incident", "big one", "airborne", "flip"],
    finish: ["finish", "checkered", "photo finish", "at the line", "to the stripe", "white flag", "last lap"],
    close: ["close", "photo finish", "by inches", "hundredth", "thousandth", "at the line"],
    funny: ["funny", "joke", "laugh", "comedy", "booth"],
    lead: ["lead", "leader", "pass", "three wide", "side by side", "battle"],
    angry: ["angry", "retaliation", "payback", "revenge", "heated"],
    wild: ["wild", "unbelievable", "chaos", "big one", "three wide", "four wide"],
    win: ["win", "wins", "won", "winner", "victory", "checkered", "takes the flag"]
  };
  var STOP = {
    the: 1, a: 1, an: 1, of: 1, in: 1, on: 1, at: 1, to: 1, for: 1,
    was: 1, were: 1, is: 1, are: 1, show: 1, me: 1, find: 1, when: 1,
    what: 1, which: 1, who: 1, did: 1, does: 1, do: 1, race: 1, races: 1,
    driver: 1, drivers: 1, please: 1, tell: 1, tape: 1
  };
  var WORD_ALIASES = {
    closest: "close", finishes: "finish", wrecks: "wreck", crashes: "crash",
    leaders: "lead", passes: "lead", wildest: "wild", biggest: "wild",
    angriest: "angry", jokes: "funny", funniest: "funny", won: "win",
    wins: "win", winner: "win", winners: "win", victory: "win", victories: "win"
  };

  function norm(value) {
    return String(value == null ? "" : value)
      .toLowerCase()
      .replace(/['’`]/g, "")
      .replace(/-/g, " ")
      .replace(/[^a-z0-9.]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function words(value) {
    return norm(value).split(/\s+/).filter(Boolean);
  }

  function unique(items) {
    var seen = {};
    return items.filter(function (item) {
      var key = norm(item);
      if (!key || seen[key]) return false;
      seen[key] = 1;
      return true;
    });
  }

  function driverNames(driver) {
    return unique([driver.name].concat(driver.aka || []));
  }

  function directDriverNames(driver) {
    return unique([driver.name].concat(driver.reviewedAliases || []));
  }

  function resolveDriverName(name, drivers) {
    var wanted = norm(name), match = null;
    if (!wanted) return null;
    (drivers || []).some(function (driver) {
      return driverNames(driver).some(function (candidate) {
        if (norm(candidate) !== wanted) return false;
        match = driver;
        return true;
      });
    });
    return match;
  }

  var COMMON_ALIAS_TOKENS = {
    it: 1, won: 1, win: 1, winner: 1, race: 1, show: 1, tape: 1,
    who: 1, what: 1, when: 1, where: 1, june: 1, may: 1, march: 1
  };

  function detectDrivers(query, drivers, registry) {
    var q = " " + norm(query) + " ", queryWords = words(query);
    var aliasOwners = {}, canonicalSurnameOwners = {}, aliasSurnameOwners = {}, collisionTokens = {};
    (drivers || []).forEach(function (driver) {
      directDriverNames(driver).forEach(function (candidate) {
        var key = norm(candidate);
        if (!key) return;
        aliasOwners[key] = aliasOwners[key] || {};
        aliasOwners[key][driver.id] = 1;
        var aliasParts = words(candidate), aliasSurname = aliasParts.slice(-1)[0];
        if (aliasParts.length > 1 && aliasSurname) {
          aliasSurnameOwners[aliasSurname] = aliasSurnameOwners[aliasSurname] || {};
          aliasSurnameOwners[aliasSurname][driver.id] = 1;
        }
      });
      var surname = words(driver.name).slice(-1)[0];
      if (surname) {
        canonicalSurnameOwners[surname] = canonicalSurnameOwners[surname] || {};
        canonicalSurnameOwners[surname][driver.id] = 1;
      }
    });
    ((registry || {}).collisions || []).forEach(function (item) {
      var key = norm(item.alias);
      if (key) collisionTokens[key] = 1;
    });
    Object.keys(aliasOwners).forEach(function (key) {
      if (Object.keys(aliasOwners[key]).length > 1) collisionTokens[key] = 1;
    });

    var matches = [];
    (drivers || []).forEach(function (driver) {
      var best = 0, matchedAs = "";
      directDriverNames(driver).forEach(function (candidate) {
        var n = norm(candidate), parts = words(candidate);
        var canonical = norm(driver.name) === n;
        if (!n || collisionTokens[n]) return;
        if (!canonical && parts.length === 1 && (parts[0].length < 4 || STOP[parts[0]] || COMMON_ALIAS_TOKENS[parts[0]])) return;
        if (q.indexOf(" " + n + " ") >= 0) {
          var score = canonical ? 130 : 110;
          if (score > best) { best = score; matchedAs = candidate; }
        } else if (parts.length > 1) {
          var all = parts.every(function (part) { return queryWords.indexOf(part) >= 0; });
          if (all && 95 > best) { best = 95; matchedAs = candidate; }
        }
      });
      if (!best) {
        var surname = words(driver.name).slice(-1)[0];
        var owners = canonicalSurnameOwners[surname] || {};
        if (
          surname && surname.length >= 4 && !collisionTokens[surname] &&
          !STOP[surname] && !COMMON_ALIAS_TOKENS[surname] &&
          queryWords.indexOf(surname) >= 0 && Object.keys(owners).length === 1
        ) {
          best = 74;
          matchedAs = surname;
        }
      }
      if (!best) {
        queryWords.some(function (candidateSurname) {
          var owners = aliasSurnameOwners[candidateSurname] || {};
          if (
            candidateSurname.length < 5 || collisionTokens[candidateSurname] ||
            STOP[candidateSurname] || COMMON_ALIAS_TOKENS[candidateSurname] ||
            Object.keys(owners).length !== 1 || !owners[driver.id]
          ) return false;
          best = 72;
          matchedAs = candidateSurname;
          return true;
        });
      }
      if (best) matches.push({ driver: driver, score: best, matchedAs: matchedAs });
    });
    matches.sort(function (a, b) { return b.score - a.score || a.driver.name.localeCompare(b.driver.name); });
    if (matches.length > 1 && matches[0].score > matches[1].score) {
      matches = matches.filter(function (item) { return item.score === matches[0].score; });
    }
    return matches.slice(0, 3);
  }

  function detectIntent(query) {
    var q = norm(query), types = [];
    function add(name, expression) { if (expression.test(q)) types.push(name); }
    add("win", /\b(win|wins|won|winner|winners|winningest|victory|victories|checkered)\b/);
    add("finish", /\b(finish|finishes|finished|photo finish|last lap|white flag|at the line)\b/);
    add("wreck", /\b(wreck|wrecks|crash|crashes|spin|spins|airborne|flip|flips|big one)\b/);
    add("funny", /\b(funny|funniest|joke|jokes|laugh|comedy|booth)\b/);
    add("angry", /\b(angry|angriest|retaliation|payback|revenge|heated|fight)\b/);
    add("lead", /\b(lead|leader|pass|passes|battle|three wide|side by side)\b/);
    add("close", /\b(close|closest|photo|inches|hundredth|thousandth)\b/);
    add("wild", /\b(wild|wildest|crazy|craziest|chaos|unbelievable|biggest)\b/);
    return {
      primary: types[0] || "general",
      types: types,
      asksCount: /\b(how many|number of|count)\b/.test(q),
      asksWhen: /\b(when|what date|which season)\b/.test(q),
      asksWhichRace: /\b(what race|which race|where)\b/.test(q)
    };
  }

  function queryTerms(query, detected) {
    var raw = words(query).filter(function (word) { return word.length > 2 && !STOP[word]; })
      .map(function (word) { return WORD_ALIASES[word] || word; });
    var out = raw.slice();
    raw.forEach(function (word) {
      (SYNONYMS[word] || []).forEach(function (candidate) { out.push(candidate); });
    });
    (detected || []).forEach(function (match) {
      out.push(match.driver.name);
      var last = words(match.driver.name).slice(-1)[0];
      if (last) out.push(last);
    });
    return unique(out).slice(0, 20);
  }

  function recordText(record, race, driverMap) {
    var taggedNames = (record.tags || []).map(function (id) {
      return driverMap[id] ? driverMap[id].name : "";
    }).filter(Boolean).join(" ");
    return norm(
      (record.type || "") + " " + (record.title || "") + " " + (record.text || "") + " " +
      (record.context || "") + " " + taggedNames + " " + (race.name || race.title || "") +
      " " + (race.track || "")
    );
  }

  function termHits(hay, terms) {
    var tokens = {};
    words(hay).forEach(function (word) { tokens[word] = 1; });
    var hits = 0;
    (terms || []).forEach(function (term) {
      var n = norm(term);
      if (!n) return;
      if (n.indexOf(" ") >= 0 ? hay.indexOf(n) >= 0 : tokens[n]) hits++;
    });
    return hits;
  }

  function legacyWinnerForRace(race, data) {
    var raceData = (data.distilled || {})[race.id] || {};
    var driver = raceData.winner ? resolveDriverName(raceData.winner, data.drivers || []) : null;
    if (!driver) return null;
    var finishes = (raceData.moments || []).filter(function (moment) { return moment.kind === "finish"; });
    var finish = finishes.length ? finishes[finishes.length - 1] : null;
    return {
      driver: driver,
      sourceRace: race,
      receipt: finish ? { t: finish.t, quote: finish.summary || "Authored finish receipt." } : null,
      basis: "legacy fixture without result truth ledger"
    };
  }

  function verifiedWinnerForEvent(race, data) {
    var truth = data.resultTruth || {}, sources = truth.sources || {};
    if (!Object.keys(sources).length) return legacyWinnerForRace(race, data);
    var eventId = race.eventId || race.id, candidates = [];
    (data.races || []).forEach(function (sourceRace) {
      if ((sourceRace.eventId || sourceRace.id) !== eventId) return;
      var row = sources[sourceRace.id] || {};
      (row.claims || []).forEach(function (claim) {
        if (claim.position !== 1 || claim.status !== "supported-by-exact-source-language" || !claim.receipt) return;
        if (claim.countsAsOrdinaryEvent === false) return;
        var driver = resolveDriverName(claim.name, data.drivers || []);
        if (driver) candidates.push({ driver: driver, sourceRace: sourceRace, receipt: claim.receipt, basis: claim.status });
      });
    });
    var byDriver = {};
    candidates.forEach(function (candidate) { (byDriver[candidate.driver.id] = byDriver[candidate.driver.id] || []).push(candidate); });
    var ids = Object.keys(byDriver);
    return ids.length === 1 ? byDriver[ids[0]][0] : null;
  }

  function directVictories(detected, data) {
    var out = [];
    detected.forEach(function (match) {
      var driver = match.driver;
      (data.races || []).forEach(function (race) {
        if (race.sourceRole === "continuation") return;
        var result = verifiedWinnerForEvent(race, data);
        if (!result || result.driver.id !== driver.id || !result.receipt) return;
        out.push({
          driver: driver,
          race: race,
          record: {
            raceId: result.sourceRace.id,
            sourceId: result.sourceRace.id,
            eventId: race.eventId || race.id,
            t: result.receipt.t,
            end: result.receipt.end,
            type: "victory",
            title: driver.name + " won " + (race.name || race.title),
            text: result.receipt.quote,
            heat: 5,
            tags: [driver.id],
            direct: true,
            evidenceRelationship: "position-specific winner language + named driver in one bounded official-source receipt"
          },
          score: 1000
        });
      });
    });
    out.sort(function (a, b) { return (b.race.ts || 0) - (a.race.ts || 0); });
    return out;
  }

  // Booth and paddock nicknames that never appear in the canonical track field.
  var TRACK_ALIASES = {
    "dega": "Talladega",
    "the brickyard": "Indianapolis",
    "brickyard": "Indianapolis",
    "indy": "Indianapolis",
    "the glen": "Watkins Glen",
    "glen": "Watkins Glen",
    "the paperclip": "Martinsville",
    "paperclip": "Martinsville",
    "wilkesboro": "North Wilkesboro",
    "the roval": "Charlotte Roval",
    "roval": "Charlotte Roval",
    "vegas": "Las Vegas",
    "homestead": "Homestead-Miami",
    "miami": "Homestead-Miami",
    "the lady in black": "Darlington",
    "too tough to tame": "Darlington",
    "the magic mile": "New Hampshire",
    "loudon": "New Hampshire",
    "the tricky triangle": "Pocono",
    "tricky triangle": "Pocono",
    "hotlanta": "Atlanta",
    "the coliseum": "LA Coliseum",
    "cota": "COTA"
  };

  // "who has the most wins at X" / "winningest driver at X" — an aggregate
  // question, not a single-event lookup. Answering it with one arbitrary race
  // is the failure mode this resolves.
  function detectTrack(query, races) {
    var q = " " + norm(query) + " ", best = null;
    var canonical = {};
    (races || []).forEach(function (race) { if (race.track) canonical[race.track] = 1; });
    Object.keys(canonical).forEach(function (track) {
      var needle = " " + norm(track) + " ";
      if (q.indexOf(needle) >= 0 && (!best || track.length > best.length)) best = track;
    });
    if (best) return best;
    Object.keys(TRACK_ALIASES).forEach(function (alias) {
      if (q.indexOf(" " + alias + " ") >= 0) {
        var target = TRACK_ALIASES[alias];
        if (canonical[target] && (!best || alias.length > best.length)) best = target;
      }
    });
    return best;
  }

  function asksSuperlative(query) {
    var q = norm(query);
    return /\b(most|winningest|best|top|leader|leaders|leading|who has|which driver|how many)\b/.test(q);
  }

  function trackLeaderboard(query, data, intent) {
    if (intent.types.indexOf("win") < 0 || !asksSuperlative(query)) return null;
    var track = detectTrack(query, data.races || []);
    if (!track) return null;
    var tally = {}, events = {};
    (data.races || []).forEach(function (race) {
      if (race.sourceRole === "continuation" || race.track !== track) return;
      var eventId = race.eventId || race.id;
      if (events[eventId]) return;
      var result = verifiedWinnerForEvent(race, data);
      if (!result || !result.receipt) return;
      events[eventId] = 1;
      var id = result.driver.id;
      if (!tally[id]) tally[id] = { driver: result.driver, wins: 0, races: [] };
      tally[id].wins++;
      tally[id].races.push({
        race: race,
        sourceId: result.sourceRace.id,
        t: result.receipt.t,
        end: result.receipt.end,
        quote: result.receipt.quote
      });
    });
    var rows = Object.keys(tally).map(function (id) { return tally[id]; });
    if (!rows.length) return null;
    rows.forEach(function (row) {
      row.races.sort(function (a, b) { return (b.race.ts || 0) - (a.race.ts || 0); });
    });
    rows.sort(function (a, b) {
      return b.wins - a.wins || a.driver.name.localeCompare(b.driver.name);
    });
    return {
      track: track,
      rows: rows,
      eventCount: Object.keys(events).length,
      leaders: rows.filter(function (row) { return row.wins === rows[0].wins; })
    };
  }

  var MONTHS = {
    january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
    july: "07", august: "08", september: "09", october: "10", november: "11", december: "12"
  };

  function queryDate(query) {
    var raw = String(query || ""), iso = raw.match(/\b(20\d{2})[-\/]([01]?\d)[-\/]([0-3]?\d)\b/);
    if (iso) return iso[1] + "-" + String(+iso[2]).padStart(2, "0") + "-" + String(+iso[3]).padStart(2, "0");
    var month = raw.toLowerCase().match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+([0-3]?\d)(?:st|nd|rd|th)?[,]?\s+(20\d{2})\b/);
    if (!month) return null;
    return month[3] + "-" + MONTHS[month[1]] + "-" + String(+month[2]).padStart(2, "0");
  }

  function aliasAmbiguities(query, registry) {
    var q = " " + norm(query) + " ", out = [];
    ((registry || {}).collisions || []).forEach(function (item) {
      var alias = norm(item.alias);
      if (!alias || q.indexOf(" " + alias + " ") < 0) return;
      out.push({
        type: "driver",
        message: "\"" + item.alias + "\" belongs to more than one canonical driver. Add a first name, number, or season.",
        alias: item.alias,
        driverIds: item.ownerIds || []
      });
    });
    return out;
  }

  function directEventAnswers(query, data, intent) {
    if ((intent.types || []).indexOf("win") < 0) return { answers: [], ambiguities: [] };
    var date = queryDate(query), q = " " + norm(query) + " ", matching = [];
    (data.races || []).forEach(function (race) {
      var name = norm(race.name || race.title || "");
      var title = norm(race.title || "");
      var dateHit = date && race.date === date;
      var nameHit = name.length >= 8 && q.indexOf(" " + name + " ") >= 0;
      var titleHit = title.length >= 12 && q.indexOf(" " + title + " ") >= 0;
      if (dateHit || nameHit || titleHit) matching.push(race);
    });
    var groups = {};
    matching.forEach(function (race) {
      var eventId = race.eventId || race.id;
      (groups[eventId] = groups[eventId] || []).push(race);
    });
    var eventIds = Object.keys(groups);
    if (eventIds.length > 1) {
      return {
        answers: [],
        ambiguities: [{
          type: "event",
          message: "That date or event name matches more than one canonical race. Add the track or race name.",
          raceIds: matching.map(function (race) { return race.id; })
        }]
      };
    }
    if (eventIds.length !== 1) return { answers: [], ambiguities: [] };
    var sources = groups[eventIds[0]].slice().sort(function (a, b) {
      return (a.sourceRole === "primary" ? -1 : 0) - (b.sourceRole === "primary" ? -1 : 0);
    });
    var race = sources[0], result = verifiedWinnerForEvent(race, data), answer = null;
    if (result && result.receipt) {
      answer = {
        race: race,
        winnerName: result.driver.name,
        resultConfidence: "supported-by-exact-source-language",
        record: {
          raceId: result.sourceRace.id,
          sourceId: result.sourceRace.id,
          eventId: race.eventId || race.id,
          t: result.receipt.t,
          end: result.receipt.end,
          type: "victory",
          title: result.driver.name + " won " + (race.name || race.title),
          text: result.receipt.quote,
          heat: 5,
          tags: [result.driver.id],
          direct: true,
          evidenceRelationship: "position-specific winner language + named driver in one bounded official-source receipt"
        },
        score: 1200
      };
    }
    return answer ? { answers: [answer], ambiguities: [] } : {
      answers: [],
      ambiguities: [{
        type: "evidence",
        message: "The event is identified, but a bounded winner-and-finish receipt is not available."
      }]
    };
  }

  function directKnowledgeAnswers(query, data) {
    var q = norm(query), answers = [], drivers = data.drivers || [], raceById = {}, driverById = {};
    (data.races || []).forEach(function (race) { raceById[race.id] = race; });
    drivers.forEach(function (driver) { driverById[driver.id] = driver; });

    var seasonMatch = q.match(/\bseason\s*(\d{1,2})\b/);
    if (seasonMatch && /\b(champion|championship|title)\b/.test(q)) {
      var seasonNumber = Number(seasonMatch[1]);
      var season = ((data.seasonChampions || {}).seasons || []).filter(function (item) {
        return Number(item.seasonNumber) === seasonNumber;
      })[0];
      if (season) {
        var wantsContender = /\bcontender\b/.test(q);
        var wantsPremier = /\b(premier|cup)\b/.test(q);
        (season.outcomes || []).forEach(function (outcome) {
          if (outcome.status !== "confirmed" || !outcome.receipt) return;
          if (wantsContender && outcome.seriesId !== "contender") return;
          if (wantsPremier && outcome.seriesId !== "premier") return;
          var driver = driverById[outcome.championId] || resolveDriverName(outcome.championName, drivers);
          var race = raceById[outcome.sourceId];
          if (!driver || !race) return;
          answers.push({
            type: "championship", driver: driver, race: race,
            heading: driver.name + " — " + outcome.seriesLabel + " " + season.seasonLabel,
            label: "REVIEWED CHAMPIONSHIP LEDGER", text: outcome.receipt.quote,
            basis: outcome.basis, confidence: outcome.reviewStatus,
            record: { sourceId: outcome.sourceId, raceId: outcome.sourceId, t: outcome.receipt.t, end: outcome.receipt.end }
          });
        });
      }
    }

    var numberMatch = q.match(/(?:\b(?:number|no\.?)\s*#?\s*|#)(\d{1,3})\b/);
    if (numberMatch && /\b(who|driver|drove|drives|number|no)\b/.test(q)) {
      var wantedNumber = numberMatch[1];
      var numberRows = [];
      Object.keys(data.driverDossiers || {}).forEach(function (driverId) {
        var dossier = data.driverDossiers[driverId] || {};
        (dossier.numberHistory || []).forEach(function (history) {
          if (String(history.number) !== wantedNumber) return;
          var priority = { "owner-confirmed": 4, high: 3, medium: 2, tentative: 1 }[history.confidence] || 0;
          numberRows.push({ driverId: driverId, dossier: dossier, history: history, priority: priority });
        });
      });
      var strong = numberRows.filter(function (row) { return row.priority >= 3; });
      if (!strong.length) strong = numberRows.filter(function (row) { return row.priority >= 2; });
      strong.sort(function (a, b) { return b.priority - a.priority || (b.history.mentions || 0) - (a.history.mentions || 0); });
      strong.slice(0, 8).forEach(function (row) {
        var driver = driverById[row.driverId];
        var evidence = (row.history.evidence || []).filter(function (item) { return item.raceId && item.t != null; })[0] || (row.history.evidence || [])[0];
        var race = evidence && evidence.raceId ? raceById[evidence.raceId] : null;
        if (!driver || !evidence) return;
        answers.push({
          type: "number", driver: driver, race: race,
          heading: driver.name + " drove No. " + wantedNumber, label: "REVIEWED NUMBER HISTORY",
          text: evidence.quote, basis: row.history.raceCount + " eligible broadcasts / " + row.history.mentions + " explicit number mentions",
          confidence: row.history.confidence,
          record: { sourceId: evidence.raceId, raceId: evidence.raceId, t: evidence.t, end: evidence.t == null ? null : evidence.t + 18 }
        });
      });
    }
    return answers;
  }

  function search(query, data) {
    data = data || {};
    var drivers = data.drivers || [], intent = detectIntent(query);
    var detected = detectDrivers(query, drivers, data.entityRegistry || {}), terms = queryTerms(query, detected);
    var raceById = {}, driverMap = {};
    (data.races || []).forEach(function (race) { raceById[race.id] = race; });
    drivers.forEach(function (driver) { driverMap[driver.id] = driver; });
    var direct = intent.types.indexOf("win") >= 0 && detected.length === 1 ? directVictories(detected, data) : [];
    var knowledge = directKnowledgeAnswers(query, data);
    var directNumberLookup = knowledge.some(function (item) { return item.type === "number"; });
    var eventResolution = directEventAnswers(query, data, intent);
    var leaderboard = detected.length ? null : trackLeaderboard(query, data, intent);
    // A track-scoped aggregate is the answer. Do not also surface one arbitrary
    // race at that track as if it settled the question.
    if (leaderboard) eventResolution = { answers: [], ambiguities: eventResolution.ambiguities };
    var driverAmbiguities = aliasAmbiguities(query, data.entityRegistry || {});
    var unresolvedDirectQuestion = (
      intent.types.indexOf("win") >= 0 && !detected.length && !leaderboard &&
      !eventResolution.answers.length && !knowledge.length && !driverAmbiguities.length &&
      (intent.asksWhichRace || /^\s*who\b/i.test(String(query || "")))
    );
    if (unresolvedDirectQuestion) {
      driverAmbiguities.push({
        type: "evidence",
        message: "I could not resolve one driver or one canonical event. Add a full driver name, date, track, or event title."
      });
    }
    var wonRaceIds = {};
    direct.forEach(function (item) { wonRaceIds[item.race.id] = 1; });
    var scored = [];

    (data.evidence || []).forEach(function (record) {
      var race = raceById[record.raceId]; if (!race) return;
      var hay = recordText(record, race, driverMap), hits = termHits(hay, terms);
      var taggedDriver = false, namedDriver = false;
      detected.forEach(function (match) {
        if ((record.tags || []).indexOf(match.driver.id) >= 0) taggedDriver = true;
        if (hay.indexOf(norm(match.driver.name)) >= 0) namedDriver = true;
      });
      if (detected.length && !taggedDriver && !namedDriver) return;
      if (!detected.length && !hits) return;

      var score = hits * 12 + (record.heat || 0) * 4;
      if (taggedDriver) score += 180;
      else if (namedDriver) score += 90;

      if (intent.types.indexOf("win") >= 0) {
        var winLanguage = /\b(win|wins|won|winner|victory|checkered|takes the flag)\b/.test(hay);
        var recordLead = norm((record.title || "") + " " + (record.text || ""));
        var namedWinLanguage = false;
        detected.forEach(function (match) {
          var surname = words(match.driver.name).slice(-1)[0];
          var leadWords = words(recordLead), nameAt = surname ? leadWords.indexOf(surname) : -1;
          var winAt = -1;
          leadWords.some(function (word, index) {
            if (!/^(win|wins|won|winner|victory|checkered)$/.test(word)) return false;
            winAt = index;
            return true;
          });
          var subjectWins = nameAt >= 0 && winAt === nameAt + 1;
          var victoryFor = winAt >= 0 && nameAt === winAt + 2 && leadWords[winAt + 1] === "for";
          if (winLanguage && (subjectWins || victoryFor)) namedWinLanguage = true;
        });
        if (detected.length && !wonRaceIds[race.id] && !namedWinLanguage) return;
        if (wonRaceIds[race.id]) score += 520;
        if (record.type === "finish") score += 180;
        if (winLanguage) score += 140;
        if (!wonRaceIds[race.id] && namedWinLanguage) score += 80;
        else if (!wonRaceIds[race.id]) score -= 260;
        if (!wonRaceIds[race.id] && record.type !== "finish" && !winLanguage) score -= 90;
      }
      if (intent.types.indexOf("finish") >= 0 && record.type === "finish") score += 120;
      if (intent.types.indexOf("wreck") >= 0 && record.type === "wreck") score += 120;
      if (intent.types.indexOf("funny") >= 0 && (record.type === "funny" || record.type === "booth")) score += 100;
      if (intent.types.indexOf("lead") >= 0 && record.type === "pass") score += 100;
      if (score <= 0) return;
      scored.push({ record: record, race: race, score: score, hits: hits });
    });

    if (eventResolution.answers.length) {
      var answeredEventId = eventResolution.answers[0].record.eventId;
      scored = scored.filter(function (item) {
        return (item.race.eventId || item.race.id) === answeredEventId;
      });
    }
    if (driverAmbiguities.length && intent.types.indexOf("win") >= 0) scored = [];
    // A reviewed number-history answer already carries its exact bounded receipt.
    // Do not trail it with generic booth uses of "number", which can imply the
    // wrong driver even though the direct answer is correct.
    if (directNumberLookup) scored = [];
    scored.sort(function (a, b) {
      return b.score - a.score || (b.record.heat || 0) - (a.record.heat || 0) ||
        (b.race.ts || 0) - (a.race.ts || 0);
    });
    return {
      terms: terms,
      intent: intent,
      drivers: detected.map(function (item) { return item.driver; }),
      directAnswers: direct,
      leaderboard: leaderboard,
      eventAnswers: eventResolution.answers,
      knowledgeAnswers: knowledge,
      ambiguities: eventResolution.ambiguities.concat(driverAmbiguities).concat(
        detected.length > 1 ? [{
          type: "driver",
          message: "That name resolves to more than one driver. Add a first name, number, or season.",
          driverIds: detected.map(function (driver) { return driver.id; })
        }] : []
      ),
      results: scored.slice(0, 24)
    };
  }

  root.VRLTapeEngine = {
    norm: norm,
    detectDrivers: detectDrivers,
    detectIntent: detectIntent,
    detectTrack: detectTrack,
    trackLeaderboard: trackLeaderboard,
    queryDate: queryDate,
    queryTerms: queryTerms,
    search: search
  };
})(typeof window !== "undefined" ? window : globalThis);
