/* ============================================================================
   SHOKKER LORE — VRL Living Wiki app
   Static SPA. Data contracts (all built offline by pipeline/):
     window.RACES      [{id,title,name,era,season,seasonLabel,round,special,
                         track,date,ts,duration,thumb,views,desc}]
     window.DISTILLED  {ytid:{recap,winner,podium,moments:[{t,title,summary,
                         tags,heat,kind}]}}
     window.DRIVERS    [{id,name,aka,reviewedAliases,pronunciation,bio,races,momentCount}]
     window.MENTIONS   {slug:{n,races:{id:count},first,last}}
     window.RIVALRIES  [{a,b,n,refs:[[raceId,t],...]}]
     window.DRIVER_DOSSIERS {slug:{career,narrative,seasonStats,numberHistory,
                              bestQuotes,topEvidenceMoments,careerGauge}}
     window.DRIVER_CARSHOTS {drivers:{slug:{path,raceId,t,confidence,...}}}
     window.TR_INDEX   [ytid,...]  (races that have commentary transcripts)
     assets/tr/<id>.js sets window.TR["<id>"] = [[sec,"text"],...]
   ========================================================================== */
(function () {
"use strict";

var SHOW = window.SHOW || {};
var RACES = window.RACES || [];
var DISTILLED = window.DISTILLED || {};
var DRIVERS = window.DRIVERS || [];
var MENTIONS = window.MENTIONS || {};
var RIVALRIES = window.RIVALRIES || [];
var AUTOMOMENTS = window.AUTOMOMENTS || {};
var EXCITEMENT = window.EXCITEMENT || {};
var SEASON_STORIES = window.SEASON_STORIES || {};
var EXCITEMENT_METHOD = window.EXCITEMENT_METHOD || {};
var TR_INDEX = window.TR_INDEX || [];
var TIME_MACHINE = window.TIME_MACHINE || { topRaceIds: [], races: {} };
var DRIVER_DNA = window.DRIVER_DNA || {};
var GHOST_TELEMETRY = window.GHOST_TELEMETRY || {};
var LORE_EVIDENCE = window.LORE_EVIDENCE || [];
var LORE_GRAPH = window.LORE_GRAPH || { nodes: [], edges: [] };
var BOOTH_LORE = window.BOOTH_LORE || { curse: [], carnac: [], upsideDown: [] };
var DRIVER_DOSSIERS = window.DRIVER_DOSSIERS || {};
var DRIVER_CARSHOTS = window.DRIVER_CARSHOTS || {};
var DRIVER_ART = window.DRIVER_ART || { drivers: {}, count: 0, policy: "" };
var OWNER_DRIVER_IMAGES = window.OWNER_DRIVER_IMAGES || { drivers: {}, policy: "" };
var CURRENT_ROSTER = window.CURRENT_ROSTER || { members: [], sources: [], appearanceDistribution: {} };
var SEASON_RULES = window.SEASON_RULES || {};
var RECEIPT_MATRIX = window.RECEIPT_MATRIX || [];
var HOT100 = window.HOT100 || { entries: [], method: {}, deferrals: [] };
var ENTITY_REGISTRY = window.ENTITY_REGISTRY || { aliases: [], collisions: [], corrections: [], pronunciations: {} };
var SOURCE_DOSSIERS = window.SOURCE_DOSSIERS || {};
var SEASON_CHAMPIONS = window.SEASON_CHAMPIONS || { seasons: [], methodology: [] };
var RESULT_TRUTH = window.RESULT_TRUTH || { sources: {}, summary: {} };
var FULL_RESULTS_BOARDS = window.FULL_RESULTS_BOARDS || { boards: [], summary: {}, methodology: {} };
var HIGHLIGHT_REELS = window.HIGHLIGHT_REELS || { reels: {}, summary: {}, methodology: {} };
var DRIVER_RANKINGS = window.DRIVER_RANKINGS || { categoryOrder: [], categories: {}, snapshot: {} };
var DEFINITIVE_HISTORY = window.DEFINITIVE_HISTORY || { units: [], methodology: {} };
var VIGILANTE_PUBLICATIONS = window.VIGILANTE_PUBLICATIONS || {
  scene: { issues: [] }, flashbacks: { annuals: [] }, summary: {}, methodology: {}
};
var CAR_REVIEW_KEY = "vrlCarFrameReviews.v1";
window.TR = window.TR || {};

var $app = document.getElementById("app");
var $nav = document.getElementById("nav");
var $foot = document.getElementById("foot");
var DEEP_ARCHIVE_URL = "assets/showcase.js?v=51";
var RACE_DOSSIERS_URL = "assets/source-dossiers.js?v=51";
var DRIVER_DOSSIERS_URL = "assets/driver-dossiers.js?v=51";
var FULL_RESULTS_URL = "assets/full-results-boards.js?v=41a";
var DRIVER_RANKINGS_URL = "assets/driver-rankings.js?v=51";
var deepArchivePromise = null;
var deepArchiveScript = null;
var raceDossiersPromise = null;
var raceDossiersScript = null;
var driverDossiersPromise = null;
var driverDossiersScript = null;
var fullResultsPromise = null;
var fullResultsScript = null;
var driverRankingsPromise = null;
var driverRankingsScript = null;
var routeRequest = 0;

function syncDeepArchiveGlobals() {
  TIME_MACHINE = window.TIME_MACHINE || { topRaceIds: [], races: {} };
  DRIVER_DNA = window.DRIVER_DNA || {};
  GHOST_TELEMETRY = window.GHOST_TELEMETRY || {};
  LORE_EVIDENCE = window.LORE_EVIDENCE || [];
  LORE_GRAPH = window.LORE_GRAPH || { nodes: [], edges: [] };
}
function routeNeedsDeepArchive(hash) {
  return /^#\/(?:showcase|time-machine|tape|galaxy|driver|race)(?:\/|$)/.test(hash) ||
    /^#\/movie\/booth(?:\/|$)/.test(hash);
}
function routeNeedsRaceDossiers(hash) {
  return /^#\/race(?:\/|$)/.test(hash);
}
function routeNeedsDriverDossiers(hash) {
  return /^#\/(?:tape|rankings)(?:\/|$)/.test(hash) ||
    /^#\/(?:race|driver|season)\//.test(hash) ||
    /^#\/(?:hall|drivers|visual-garage|winners|records)$/.test(hash);
}
function routeNeedsFullResults(hash) {
  return /^#\/(?:results|race)(?:\/|$)/.test(hash);
}
function routeNeedsDriverRankings(hash) {
  return /^#\/rankings(?:\/|$)/.test(hash) || /^#\/driver\//.test(hash);
}
function deepArchiveReady() {
  return !!(window.TIME_MACHINE && window.DRIVER_DNA && window.GHOST_TELEMETRY && window.LORE_EVIDENCE && window.LORE_GRAPH);
}
function loadDeepArchive() {
  if (deepArchiveReady()) {
    syncDeepArchiveGlobals();
    return Promise.resolve();
  }
  if (deepArchivePromise) return deepArchivePromise;
  deepArchivePromise = new Promise(function (resolve, reject) {
    deepArchiveScript = document.createElement("script");
    deepArchiveScript.src = DEEP_ARCHIVE_URL;
    deepArchiveScript.async = true;
    deepArchiveScript.dataset.vrlDeepArchive = "true";
    deepArchiveScript.onload = function () {
      syncDeepArchiveGlobals();
      resolve();
    };
    deepArchiveScript.onerror = function () {
      reject(new Error("The deep archive could not be loaded."));
    };
    document.head.appendChild(deepArchiveScript);
  });
  return deepArchivePromise;
}
function loadRaceDossiers() {
  if (window.SOURCE_DOSSIERS) {
    SOURCE_DOSSIERS = window.SOURCE_DOSSIERS;
    return Promise.resolve();
  }
  if (raceDossiersPromise) return raceDossiersPromise;
  raceDossiersPromise = new Promise(function (resolve, reject) {
    raceDossiersScript = document.createElement("script");
    raceDossiersScript.src = RACE_DOSSIERS_URL;
    raceDossiersScript.async = true;
    raceDossiersScript.dataset.vrlRaceDossiers = "true";
    raceDossiersScript.onload = function () {
      SOURCE_DOSSIERS = window.SOURCE_DOSSIERS || {};
      resolve();
    };
    raceDossiersScript.onerror = function () {
      reject(new Error("The race source dossiers could not be loaded."));
    };
    document.head.appendChild(raceDossiersScript);
  });
  return raceDossiersPromise;
}
function loadDriverDossiers() {
  if (window.DRIVER_DOSSIERS) {
    DRIVER_DOSSIERS = window.DRIVER_DOSSIERS;
    return Promise.resolve();
  }
  if (driverDossiersPromise) return driverDossiersPromise;
  driverDossiersPromise = new Promise(function (resolve, reject) {
    driverDossiersScript = document.createElement("script");
    driverDossiersScript.src = DRIVER_DOSSIERS_URL;
    driverDossiersScript.async = true;
    driverDossiersScript.dataset.vrlDriverDossiers = "true";
    driverDossiersScript.onload = function () {
      DRIVER_DOSSIERS = window.DRIVER_DOSSIERS || {};
      resolve();
    };
    driverDossiersScript.onerror = function () {
      reject(new Error("The driver archive dossiers could not be loaded."));
    };
    document.head.appendChild(driverDossiersScript);
  });
  return driverDossiersPromise;
}
function loadFullResults() {
  if (window.FULL_RESULTS_BOARDS) {
    FULL_RESULTS_BOARDS = window.FULL_RESULTS_BOARDS;
    return Promise.resolve();
  }
  if (fullResultsPromise) return fullResultsPromise;
  fullResultsPromise = new Promise(function (resolve, reject) {
    fullResultsScript = document.createElement("script");
    fullResultsScript.src = FULL_RESULTS_URL;
    fullResultsScript.async = true;
    fullResultsScript.dataset.vrlFullResults = "true";
    fullResultsScript.onload = function () {
      FULL_RESULTS_BOARDS = window.FULL_RESULTS_BOARDS || { boards: [], summary: {}, methodology: {} };
      resolve();
    };
    fullResultsScript.onerror = function () {
      reject(new Error("The reviewed full-results boards could not be loaded."));
    };
    document.head.appendChild(fullResultsScript);
  });
  return fullResultsPromise;
}
function loadDriverRankings() {
  if (window.DRIVER_RANKINGS) {
    DRIVER_RANKINGS = window.DRIVER_RANKINGS;
    return Promise.resolve();
  }
  if (driverRankingsPromise) return driverRankingsPromise;
  driverRankingsPromise = new Promise(function (resolve, reject) {
    driverRankingsScript = document.createElement("script");
    driverRankingsScript.src = DRIVER_RANKINGS_URL;
    driverRankingsScript.async = true;
    driverRankingsScript.dataset.vrlDriverRankings = "true";
    driverRankingsScript.onload = function () {
      DRIVER_RANKINGS = window.DRIVER_RANKINGS || { categoryOrder: [], categories: {}, snapshot: {} };
      resolve();
    };
    driverRankingsScript.onerror = function () {
      reject(new Error("The empirical driver rankings could not be loaded."));
    };
    document.head.appendChild(driverRankingsScript);
  });
  return driverRankingsPromise;
}
function deepArchiveLoadingHtml(needsDeep, needsRaceDossiers, needsDriverDossiers, needsFullResults, needsDriverRankings) {
  var systems = [];
  if (needsDeep) systems.push("Time Machine, Driver DNA, Ghost Telemetry, and Lore Galaxy");
  if (needsRaceDossiers) systems.push("race source dossiers");
  if (needsDriverDossiers) systems.push("driver identity and career files");
  if (needsFullResults) systems.push("reviewed field-result boards");
  if (needsDriverRankings) systems.push("empirical Top 25 scorecards");
  return '<div class="archive-ignition route-ignition" role="status" aria-live="polite">' +
    '<div class="archive-ignition-mark" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>' +
    '<span>DEEP ARCHIVE / LOADING EXACT TAPE INTELLIGENCE</span><h1>OPENING THE INNER GARAGE</h1><p>Wiring ' +
    systems.join(" + ") + '&hellip;</p>' +
    '<div class="archive-ignition-track" aria-hidden="true"><b></b></div></div>';
}
function deepArchiveErrorHtml() {
  return '<div class="wrap"><div class="empty"><b>ARCHIVE CONNECTION MISSED</b><p>The core race files are still available. Retry this evidence-heavy route when the connection is ready.</p>' +
    '<button class="btn" onclick="__retryDeepArchive()">RETRY ARCHIVE ROUTE</button> <a class="btn ghost" href="#/">RETURN TO PIT WALL</a></div></div>';
}
window.__retryDeepArchive = function () {
  deepArchivePromise = null;
  if (deepArchiveScript) deepArchiveScript.remove();
  deepArchiveScript = null;
  raceDossiersPromise = null;
  if (raceDossiersScript) raceDossiersScript.remove();
  raceDossiersScript = null;
  driverDossiersPromise = null;
  if (driverDossiersScript) driverDossiersScript.remove();
  driverDossiersScript = null;
  fullResultsPromise = null;
  if (fullResultsScript) fullResultsScript.remove();
  fullResultsScript = null;
  driverRankingsPromise = null;
  if (driverRankingsScript) driverRankingsScript.remove();
  driverRankingsScript = null;
  routeAndSettle();
};

/* ------------------------------------------------------------------ utils */
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function encArg(s) { return encodeURIComponent(String(s == null ? "" : s)).replace(/'/g, "%27"); }
function fmtT(s) { s = Math.max(0, Math.round(s || 0)); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0"); }
function fmtDur(s) { if (!s) return ""; var h = Math.floor(s / 3600), m = Math.round(s % 3600 / 60); return h ? h + "h " + m + "m" : m + "m"; }
function fmtDate(d) { if (!d) return "date unknown"; var p = d.split("-"); var M = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; return M[+p[1]] + " " + (+p[2]) + ", " + p[0]; }
function yearOf(d) { return d ? d.slice(0, 4) : "?"; }
function byId(id) { for (var i = 0; i < RACES.length; i++) if (RACES[i].id === id) return RACES[i]; return null; }
function driverById(id) { for (var i = 0; i < DRIVERS.length; i++) if (DRIVERS[i].id === id) return DRIVERS[i]; return null; }
function numberSortValue(value) {
  var text = String(value == null ? "" : value).trim();
  return /^\d+$/.test(text) ? parseInt(text, 10) : 999999;
}
function resultNameKey(name) { return String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function eventSources(race) {
  var eventId = (race && race.eventId) || (race && race.id);
  return RACES.filter(function (source) { return (source.eventId || source.id) === eventId; })
    .sort(function (a, b) { return (a.sourceRole === "primary" ? -1 : 0) - (b.sourceRole === "primary" ? -1 : 0); });
}
function supportedEventClaims(race, position, ordinaryOnly) {
  var claims = [];
  eventSources(race).forEach(function (source) {
    var row = (RESULT_TRUTH.sources || {})[source.id] || {};
    (row.claims || []).forEach(function (claim) {
      if (claim.position !== position || claim.status !== "supported-by-exact-source-language" || !claim.receipt) return;
      if (ordinaryOnly && claim.countsAsOrdinaryEvent === false) return;
      claims.push({
        name: claim.name,
        sourceId: source.id,
        receipt: claim.receipt,
        sourceRole: source.sourceRole || "primary",
        resultScope: claim.resultScope || "event",
        countsAsOrdinaryEvent: claim.countsAsOrdinaryEvent !== false
      });
    });
  });
  return claims;
}
function verifiedEventPosition(race, position, ordinaryOnly) {
  var claims = supportedEventClaims(race, position, ordinaryOnly), byName = {};
  claims.forEach(function (claim) { (byName[resultNameKey(claim.name)] = byName[resultNameKey(claim.name)] || []).push(claim); });
  var names = Object.keys(byName).filter(Boolean);
  if (names.length !== 1) return null;
  return byName[names[0]][0];
}
function verifiedEventWinner(race) { return verifiedEventPosition(race, 1); }
function verifiedOrdinaryEventWinner(race) { return verifiedEventPosition(race, 1, true); }
function eventResultRundown(race) {
  var rows = eventSources(race).map(function (source) {
    var result = ((RESULT_TRUTH.sources || {})[source.id] || {}).resultRundown;
    return result && result.status === "supported-by-bounded-closing-rundown" && result.receipt
      ? { sourceId: source.id, result: result }
      : null;
  }).filter(Boolean);
  rows.sort(function (a, b) {
    return (b.result.positionLanguageCount || 0) - (a.result.positionLanguageCount || 0)
      || a.result.receipt.t - b.result.receipt.t;
  });
  return rows[0] || null;
}
function verifiedResultCount(name, position, seasonLabel) {
  var wanted = resultNameKey(name), count = 0;
  CANONICAL_RACES.forEach(function (race) {
    if (seasonLabel && race.seasonLabel !== seasonLabel) return;
    var claim = verifiedEventPosition(race, position, true);
    if (claim && resultNameKey(claim.name) === wanted) count++;
  });
  return count;
}
function verifiedResultsForDriver(name) {
  var wanted = resultNameKey(name), rows = [];
  CANONICAL_RACES.forEach(function (race) {
    [1, 2, 3].forEach(function (position) {
      var claim = verifiedEventPosition(race, position);
      if (!claim || resultNameKey(claim.name) !== wanted) return;
      rows.push({ race: race, position: position, claim: claim });
    });
  });
  return rows.sort(function (a, b) {
    return (b.race.ts || 0) - (a.race.ts || 0) || a.position - b.position;
  });
}
function publicRaceRecap(race, data) {
  var raw = String((data || {}).recap || "");
  if (!raw) return { text: "", quarantined: false };
  var verified = verifiedEventWinner(race);
  var rawWinner = resultNameKey((data || {}).winner);
  if (verified && (!rawWinner || rawWinner === resultNameKey(verified.name))) {
    return { text: raw, quarantined: false };
  }
  var resultWords = /\b(won|wins|winner|victory|checkered|podium|finished first|took the flag|takes the flag|beat|beats|defeated|held off|edged)\b/i;
  var sentences = raw.match(/[^.!?]+[.!?]*/g) || [raw];
  var safe = sentences.filter(function (sentence) {
    if (rawWinner && resultNameKey(sentence).indexOf(rawWinner) >= 0) return false;
    return !resultWords.test(sentence);
  }).join(" ").replace(/\s+/g, " ").trim();
  return { text: safe, quarantined: true };
}
function publicEventRecap(race) {
  var parts = eventSources(race).map(function (source) {
    var view = publicRaceRecap(race, DISTILLED[source.id] || {});
    if (!view.text) return null;
    return {
      sourceId: source.id,
      sourceRole: source.sourceRole || "primary",
      title: source.name || source.title || source.id,
      text: view.text,
      quarantined: view.quarantined
    };
  }).filter(Boolean);
  return {
    parts: parts,
    text: parts.map(function (part) { return part.text; }).join(" "),
    quarantined: parts.some(function (part) { return part.quarantined; }),
    multiSource: parts.length > 1
  };
}
function raceStoryboard(race, reel, resultRundown) {
  if (!race || !reel || !(reel.cuts || []).length) return [];
  var cuts = reel.cuts.slice();
  var used = {};
  function key(cut) { return cut.sourceId + ":" + cut.t + ":" + cut.end; }
  function tagged(cut, value) { return (cut.coverageTags || []).indexOf(value) >= 0; }
  function add(out, cut, label) {
    if (!cut || used[key(cut)] || !isFinite(cut.t) || !isFinite(cut.end) || cut.end <= cut.t) return;
    used[key(cut)] = 1;
    out.push({
      eventId: race.eventId || race.id,
      raceId: race.id,
      sourceId: cut.sourceId,
      t: cut.t,
      end: cut.end,
      label: label,
      title: cut.title || label,
      summary: cut.summary || "",
      kind: cut.kind || "moment",
      heat: cut.heat || 0
    });
  }
  function storyLabel(cut) {
    if (tagged(cut, "incident") || cut.isIncident || cut.kind === "wreck") return "THE INCIDENT";
    if (cut.kind === "pass") return "THE MOVE";
    if (cut.kind === "strategy") return "THE CALL";
    if (cut.kind === "restart") return "THE RESTART";
    if (cut.kind === "finish") return "THE SWING";
    return "TURNING POINT";
  }
  function importance(cut) {
    var kind = { finish: 8, pass: 7, strategy: 6, wreck: 5, restart: 4, interview: 2 };
    return (cut.heat || 0) * 5 + (kind[cut.kind] || 3) +
      (tagged(cut, "incident") ? 4 : 0) + ((cut.beats || []).length > 1 ? 2 : 0);
  }

  var fastWanted = {};
  ((reel.fastRecap || {}).cutIndexes || []).forEach(function (index) { fastWanted[index] = 1; });
  var fastCuts = cuts.filter(function (cut) { return fastWanted[cut.index]; });
  if (!fastCuts.length) fastCuts = cuts;
  var out = [];
  var first = cuts.filter(function (cut) { return tagged(cut, "first-lap"); })[0] || cuts[0];
  var lastMatches = cuts.filter(function (cut) { return tagged(cut, "last-lap"); });
  var last = lastMatches[lastMatches.length - 1] || cuts[cuts.length - 1];
  add(out, first, "GREEN FLAG");

  var middle = fastCuts.filter(function (cut) { return key(cut) !== key(first) && key(cut) !== key(last); });
  if (middle.length > 5) {
    middle = middle.sort(function (a, b) { return importance(b) - importance(a) || a.t - b.t; }).slice(0, 5);
  }
  middle
    .sort(function (a, b) { return (a.programOffset || a.t) - (b.programOffset || b.t); })
    .forEach(function (cut) { add(out, cut, storyLabel(cut)); });
  add(out, last, "TO THE FLAG");

  if (resultRundown && resultRundown.result && resultRundown.result.receipt) {
    var receipt = resultRundown.result.receipt;
    add(out, {
      sourceId: resultRundown.sourceId,
      t: receipt.t,
      end: receipt.end,
      title: "The booth reads the finishing order",
      summary: (resultRundown.result.coverageLabel || "Bounded closing results rundown") +
        ". Lower-field names remain transcript candidates until individually position-bound.",
      kind: "results",
      heat: 3
    }, "AFTER THE FLAG");
  }
  return out;
}
function storyboardRuntime(story) {
  return (story || []).reduce(function (sum, item) { return sum + Math.max(0, item.end - item.t); }, 0);
}
function seasonStorySequence(label) {
  var story = SEASON_STORIES[label];
  if (!story || !(story.definingMoments || []).length) return [];
  var used = {}, sequence = [];
  (story.definingMoments || []).slice().sort(function (a, b) {
    var raceA = byId(a.raceId) || {}, raceB = byId(b.raceId) || {};
    return (raceA.ts || 0) - (raceB.ts || 0) || (a.t || 0) - (b.t || 0);
  }).forEach(function (moment) {
    var race = byId(moment.raceId);
    var reel = highlightOf(moment.eventId || moment.raceId);
    if (!race || !reel) return;
    var cuts = reel.cuts || [];
    var cut = cuts.filter(function (candidate) {
      return candidate.t <= moment.t && candidate.end > moment.t;
    }).sort(function (a, b) {
      return (a.end - a.t) - (b.end - b.t);
    })[0];
    if (!cut) return;
    var sourceId = (cut && cut.sourceId) || race.id;
    var start = cut && isFinite(cut.t) ? cut.t : Math.max(0, moment.t - 8);
    var end = cut && isFinite(cut.end) ? cut.end : Math.min(race.duration || moment.t + 42, moment.t + 42);
    var key = sourceId + ":" + start + ":" + end;
    if (used[key] || end <= start) return;
    used[key] = 1;
    sequence.push({
      eventId: moment.eventId || race.eventId || race.id,
      raceId: race.id,
      sourceId: sourceId,
      t: start,
      end: end,
      label: label.toUpperCase() + " / " + (race.track || "RACE NIGHT"),
      title: moment.title,
      raceTitle: race.name || race.title,
      date: race.date,
      track: race.track,
      summary: cut.summary || "",
      kind: moment.kind || cut.kind || "moment",
      heat: moment.heat || cut.heat || 0
    });
  });
  return sequence;
}
function storyTaggedDrivers(item) {
  var source = DISTILLED[item.sourceId] || {};
  var seen = {}, drivers = [];
  (source.moments || []).forEach(function (moment) {
    if (!isFinite(moment.t) || moment.t < item.t || moment.t >= item.end) return;
    (moment.tags || []).forEach(function (driverId) {
      var driver = driverById(driverId);
      if (!driver || seen[driverId] || drivers.length >= 2) return;
      seen[driverId] = 1;
      drivers.push(driver);
    });
  });
  return drivers;
}
function storyVisualData(item, mode) {
  var sourceRace = byId(item.sourceId) || {};
  var eventRace = byId(item.eventId || item.raceId) || sourceRace;
  var duration = Number(sourceRace.duration) || 0;
  var position = duration ? Math.max(0, Math.min(100, (Number(item.t) || 0) / duration * 100)) : 0;
  return {
    sourceRace: sourceRace,
    eventRace: eventRace,
    thumb: sourceRace.thumb || ("https://i.ytimg.com/vi/" + item.sourceId + "/hqdefault.jpg"),
    raceTitle: item.raceTitle || sourceRace.name || sourceRace.title || item.sourceId,
    date: item.date || sourceRace.date || "",
    track: item.track || sourceRace.track || "",
    position: position,
    drivers: storyTaggedDrivers(item),
    excitement: mode === "season" ? excitementOf(item.eventId || item.raceId || item.sourceId) : null
  };
}
function storyDriverMedallions(drivers) {
  if (!drivers.length) return "";
  return '<div class="story-frame-drivers" aria-label="Canonical drivers tagged in authored moments inside this exact cut">' +
    drivers.map(function (driver) {
      return '<div class="story-driver-medallion" title="Authored exact-cut tag: ' + esc(driver.name) + '">' +
        driverVisual(driver, "story-driver-visual") + '<span>' + esc(driver.name) + '</span></div>';
    }).join("") + '</div>';
}
function storyFilmstripHtml(items, options) {
  options = options || {};
  var mode = options.mode === "season" ? "season" : "race";
  var label = mode === "season" ? "SEASON TAPE CONTACT SHEET" : "RACE TAPE CONTACT SHEET";
  return '<div class="story-filmstrip mode-' + mode + '">' +
    '<div class="story-filmstrip-head"><div><span>' + label + ' / ' + items.length +
    ' EXACT CUTS</span><small>SELECT A FRAME TO PLAY ITS BOUNDED OFFICIAL-SOURCE RECEIPT</small></div>' +
    '<b class="story-source-boundary">SOURCE THUMBNAILS IDENTIFY THE BROADCAST; THE PLAY BUTTON IS THE MOMENT RECEIPT.</b></div>' +
    '<div class="story-filmstrip-viewport" tabindex="0" aria-label="' + label +
    '. Scroll horizontally through exact playable chapters."><div class="story-filmstrip-track" role="list">' +
    items.map(function (item, index) {
      var visual = storyVisualData(item, mode);
      var kind = String(item.kind || "moment").toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
      var heat = Math.max(0, Math.min(5, Number(item.heat) || 0));
      var noteId = "story-frame-" + mode + "-" + index + "-notes";
      var playLabel = esc(item.label || "EXACT CHAPTER").replace(/'/g, "\\'");
      var score = visual.excitement
        ? '<span class="story-frame-score" aria-label="Full race excitement score ' +
          visual.excitement.score + ' out of 100, archive rank ' + visual.excitement.rank +
          '"><b>' + visual.excitement.score + '</b><span>FULL RACE<br>SCORE</span><em>#' +
          visual.excitement.rank + '</em></span>'
        : '<span class="story-frame-heat" aria-label="Archivist heat ' + heat +
          ' out of 5"><span>ARCHIVIST HEAT</span><b>' +
          [1, 2, 3, 4, 5].map(function (level) {
            return '<i class="' + (level <= heat ? "on" : "") + '"></i>';
          }).join("") + '</b></span>';
      var seasonMeta = mode === "season"
        ? '<span class="story-frame-race">' + esc(fmtDate(visual.date)) +
          (visual.track ? ' / ' + esc(visual.track) : "") + '</span>'
        : "";
      return '<article class="story-frame k-' + kind + '" role="listitem">' +
        '<button type="button" class="story-frame-media" style="--story-pos:' +
        visual.position.toFixed(1) + '%" aria-describedby="' + noteId +
        '" onclick="__playReceipt(\'' + item.sourceId + '\',' + item.t + ',' + item.end +
        ',\'' + playLabel + '\')"><img loading="lazy" src="' + esc(visual.thumb) +
        '" alt="Official source thumbnail for ' + esc(visual.raceTitle) +
        '; this image identifies the broadcast and is not moment-frame proof">' +
        '<span class="story-frame-shade" aria-hidden="true"></span>' +
        '<span class="story-frame-source">OFFICIAL SOURCE THUMBNAIL <b>NOT MOMENT FRAME</b></span>' +
        '<span class="story-frame-body"><span class="story-frame-kicker">' +
        String(index + 1).padStart(2, "0") + ' / ' + esc(item.label || "EXACT CHAPTER") +
        '</span>' + seasonMeta + '<strong>' + esc(item.title) + '</strong>' +
        '<span class="story-frame-time">&#9654; ' + fmtT(item.t) + '&ndash;' + fmtT(item.end) +
        ' <small>' + fmtT(item.end - item.t) + ' CUT</small></span>' + score +
        '<span class="story-frame-progress" aria-hidden="true"><i></i></span></span></button>' +
        storyDriverMedallions(visual.drivers) +
        '<details class="story-frame-context" id="' + noteId + '"><summary>CHAPTER NOTES / SOURCE BOUNDARY</summary><p>' +
        esc(item.summary || "No additional authored note is attached to this bounded cut.") +
        '</p><small>OFFICIAL SOURCE <code>' + esc(item.sourceId) + '</code> / EXACTLY ' +
        fmtT(item.t) + '&ndash;' + fmtT(item.end) +
        ' / THUMBNAIL IS SOURCE ART, NOT FRAME-LEVEL PROOF</small></details></article>';
    }).join("") + '</div></div><small class="story-filmstrip-hint">SWIPE OR SCROLL THE TAPE / TAB TO AN EXACT CUT</small></div>';
}
function raceStoryboardHtml(race, story) {
  if (!story.length) return "";
  var eventId = race.eventId || race.id;
  return '<section class="race-storyboard"><div class="race-storyboard-head"><div><span>RACE STORY / ' +
    story.length + ' EXACT CHAPTERS</span><h2>THE WHOLE NIGHT, IN ORDER</h2><p>A source-bounded route through the green flag, decisive swings, full final lap, and available post-race results. This is an edit map—not copied media.</p></div>' +
    '<button class="btn" onclick="__playRaceStory(\'' + eventId + '\')">&#9654; PLAY THE STORY / ' +
    fmtT(storyboardRuntime(story)) + '</button></div>' +
    storyFilmstripHtml(story, { mode: "race" }) + '</section>';
}
function excitementOf(id) { var race = byId(id); return EXCITEMENT[(race && race.eventId) || id] || null; }
function highlightOf(id) { var race = byId(id); return (HIGHLIGHT_REELS.reels || {})[(race && race.eventId) || id] || null; }
function initials(n) { return n.split(/\s+/).map(function (w) { return w[0] || ""; }).join("").slice(0, 2).toUpperCase(); }
function era(id) { var es = SHOW.eras || []; for (var i = 0; i < es.length; i++) if (es[i].id === id) return es[i]; return { name: id, short: id }; }
function go(h) { location.hash = h; }
function rxEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

/* Sorted views of RACES */
var R_SORTED = RACES.slice().sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
var CANONICAL_RACES = R_SORTED.filter(function (r) { return r.sourceRole !== "continuation"; });
var CANONICAL_COUNT = RECEIPT_MATRIX.length || CANONICAL_RACES.length;
var R_ALL_NEWEST = R_SORTED.slice().reverse();
var R_NEWEST = CANONICAL_RACES.slice().reverse();

/* Season list (in chronological order of first race) */
var SEASONS = (function () {
  var m = {}, out = [];
  CANONICAL_RACES.forEach(function (r) {
    var k = r.seasonLabel || "Unsorted";
    if (!m[k]) { m[k] = { label: k, era: r.era, races: [], ts: r.ts || 0 }; out.push(m[k]); }
    m[k].races.push(r);
  });
  return out;
})();

/* Championships — only from the reviewed, exact-receipt title ledger. */
var CHAMPIONS = (function () {
  var map = {};
  (SEASON_CHAMPIONS.seasons || []).forEach(function (season) {
    var outcomes = (season.outcomes || []).filter(function (outcome) { return outcome.status === "confirmed"; });
    if (!outcomes.length) return;
    var primary = outcomes.filter(function (outcome) { return outcome.seriesId === "premier"; })[0] || outcomes[0];
    map[season.seasonLabel] = {
      name: primary.championName,
      driverId: primary.championId,
      raceId: primary.sourceId,
      t: primary.receipt && primary.receipt.t,
      end: primary.receipt && primary.receipt.end,
      seriesLabel: primary.seriesLabel,
      outcomes: outcomes
    };
  });
  return map;
})();
var TITLES = (function () {
  var titles = {};
  (SEASON_CHAMPIONS.seasons || []).forEach(function (season) {
    (season.outcomes || []).forEach(function (outcome) {
      if (outcome.status !== "confirmed" || !outcome.championName) return;
      (titles[outcome.championName] = titles[outcome.championName] || []).push(
        season.seasonLabel + (outcome.seriesId === "premier" ? "" : " · " + outcome.seriesLabel)
      );
    });
  });
  return titles;
})();

/* Driver mention helpers */
function mentionsOf(slug) { return MENTIONS[slug] || null; }
function careerSpan(d) {
  var m = mentionsOf(d.id);
  var ids = (d.races || []).slice();
  if (m) ids = ids.concat(Object.keys(m.races || {}));
  var ts = ids.map(byId).filter(Boolean).map(function (r) { return r.ts || 0; }).filter(Boolean);
  if (!ts.length) return null;
  var a = new Date(Math.min.apply(null, ts) * 1000).getFullYear();
  var b = new Date(Math.max.apply(null, ts) * 1000).getFullYear();
  return a === b ? String(a) : a + "–" + b;
}
function raceCountOf(d) {
  var m = mentionsOf(d.id);
  var set = {};
  (d.races || []).forEach(function (id) { set[id] = 1; });
  if (m) Object.keys(m.races || {}).forEach(function (id) { set[id] = 1; });
  return Object.keys(set).length;
}
function dossierOf(slug) { return DRIVER_DOSSIERS[slug] || null; }
function currentRosterMember(slug) {
  return (CURRENT_ROSTER.members || []).filter(function (member) { return member.driverId === slug; })[0] || null;
}
function carshotOf(slug) {
  var shot = (DRIVER_CARSHOTS.drivers || DRIVER_CARSHOTS)[slug] || null;
  return shot && (!shot.reviewStatus || shot.reviewStatus === "approved") ? shot : null;
}
function ownerDriverImageOf(slug) {
  var image = (OWNER_DRIVER_IMAGES.drivers || {})[slug] || null;
  return image && image.reviewStatus === "owner-approved-identity-art" ? image : null;
}
function driverArtOf(slug) {
  var art = (DRIVER_ART.drivers || {})[slug] || null;
  return art && art.vehicle === "truck" && art.reviewStatus === "placeholder-number-matched" ? art : null;
}
function driverForResultName(name) {
  return DRIVERS.filter(function (driver) {
    return resultNameKey(driver.name) === resultNameKey(name);
  })[0] || null;
}
function shotSrc(shot) {
  if (!shot) return "";
  return shot.src || shot.image || shot.path || shot.file || "";
}
function driverVisual(d, extraClass) {
  var dossier = dossierOf(d.id) || {};
  var ownerImage = ownerDriverImageOf(d.id);
  var art = driverArtOf(d.id);
  var shot = carshotOf(d.id);
  var number = dossier.primaryNumber;
  if (art && number && numberSortValue(art.number) !== numberSortValue(number)) art = null;
  var src = ownerImage ? ownerImage.path : art ? art.path : shotSrc(shot);
  if (src) {
    var imageNumber = (ownerImage && ownerImage.number) || number;
    var proof = ownerImage
      ? "OWNER SELECTED" + (ownerImage.currentSeasonSchemeCertified ? " · CURRENT SCHEME" : " · IDENTITY ART")
      : art ? "PAINT LIBRARY · PLACEHOLDER" : "OFFICIAL TAPE FRAME";
    var altPrefix = ownerImage
      ? "League-owner-selected truck image for "
      : art ? "Historical number-matched truck placeholder for " : "Approved official-tape frame associated with ";
    return '<div class="driver-visual has-shot ' + (ownerImage ? "has-owner-art " : "") +
      (art ? "has-library-art " : "") + (extraClass || "") + '"' +
      ((ownerImage || art) ? ' title="' + esc((ownerImage || art).matchBasis) + '"' : "") + '>' +
      '<img loading="lazy" src="' + esc(src) + '" alt="' + altPrefix + esc(d.name) + '">' +
      (imageNumber ? '<span class="dv-number">#' + esc(imageNumber) + '</span>' : "") +
      '<span class="dv-proof">' + proof + '</span></div>';
  }
  return '<div class="driver-visual number-card ' + (extraClass || "") + '">' +
    (number ? '<span class="dv-hash">#</span><b>' + esc(number) + '</b>' : '<b class="dv-initials">' + esc(initials(d.name)) + '</b>') +
    '<span class="dv-proof">' + (number ? esc((dossier.numberConfidence || "archive")) + " NUMBER" : "PROFILE ON TAPE") + "</span></div>";
}
function driverMomentMatchesSubject(moment, dossier, driver) {
  var titleKey = resultNameKey(moment && moment.title);
  if (!titleKey) return false;
  var identityNames = [driver && driver.name].concat(
    (driver && driver.reviewedAliases) || [],
    (dossier && dossier.aliases) || []
  ).filter(Boolean);
  var identityKeys = [];
  identityNames.forEach(function (name) {
    var key = resultNameKey(name);
    if (!key) return;
    identityKeys.push(key);
    var parts = key.split(" ");
    if (parts.length > 1 && parts[parts.length - 1].length >= 3) identityKeys.push(parts[parts.length - 1]);
  });
  var paddedTitle = " " + titleKey + " ";
  if (identityKeys.some(function (key) {
    return paddedTitle.indexOf(" " + key + " ") >= 0;
  })) return true;
  var number = String((dossier && dossier.primaryNumber) || "").replace(/^0+/, "") || "0";
  return !!(dossier && dossier.primaryNumber) &&
    new RegExp("(?:#|\\bno\\.?\\s*|\\bnumber\\s+)" + number + "\\b", "i")
      .test(String(moment.title || "").replace(/0+(\d)/g, "$1"));
}
function driverSignatureSequence(dossier, driver) {
  var out = [], seenRace = {}, total = 0;
  var candidates = [];
  (dossier.storyEvidenceRoutes || []).forEach(function (route) {
    candidates.push({ item: route, exactProfileRoute: true });
  });
  (dossier.topEvidenceMoments || []).forEach(function (moment) {
    if (!driverMomentMatchesSubject(moment, dossier, driver)) return;
    var duplicate = candidates.some(function (candidate) {
      return candidate.item.raceId === moment.raceId &&
        Math.abs((candidate.item.t || 0) - (moment.t || 0)) <= 4;
    });
    if (!duplicate) candidates.push({ item: moment, exactProfileRoute: false });
  });
  candidates.forEach(function (candidate) {
    var moment = candidate.item;
    if (out.length >= 6 || seenRace[moment.raceId]) return;
    var cut = null, beat = null;
    var t = Number(moment.t), end = Number(moment.end), sourceId = moment.sourceId;
    if (!candidate.exactProfileRoute || !sourceId || !isFinite(end) || end <= t) {
      var reel = highlightOf(moment.raceId);
      if (!reel) return;
      cut = (reel.cuts || []).filter(function (item) {
        return (item.beats || []).some(function (beatItem) { return Math.abs((beatItem.t || 0) - (moment.t || 0)) <= 4; }) ||
          ((moment.t || 0) >= item.t && (moment.t || 0) < item.end);
      })[0];
      if (!cut) return;
      beat = (cut.beats || []).filter(function (item) {
        return Math.abs((item.t || 0) - (moment.t || 0)) <= 4;
      })[0];
      t = beat && beat.t != null ? beat.t : cut.t;
      end = beat && beat.end > t ? beat.end : cut.end;
      sourceId = cut.sourceId;
    }
    if (!isFinite(t) || !isFinite(end) || end <= t) return;
    var duration = end - t;
    if (out.length >= 2 && total + duration > 600) return;
    out.push({
      sourceId: sourceId,
      raceId: moment.raceId,
      t: t,
      end: end,
      label: moment.title || (cut && cut.title) || "SIGNATURE TAPE",
      title: moment.title || (cut && cut.title) || "Signature tape",
      summary: moment.summary || (cut && cut.summary) || "",
      kind: moment.kind || (cut && cut.kind) || "moment"
    });
    seenRace[moment.raceId] = 1;
    total += duration;
  });
  return out;
}

/* ----------------------------------------------------------------- player */
var Player = (function () {
  var apiReady = null, dockP = null, inlineP = null, inlineVid = null, dockVid = null;
  var sequence = null, sequenceIndex = 0, sequenceTimer = null, dockStart = 0;
  var sequenceArmed = false, sequenceExpectedVid = null, sequenceLoadNonce = 0;
  function youtubeUrl(vid, t) {
    return "https://www.youtube.com/watch?v=" + encodeURIComponent(vid) + "&t=" + Math.max(0, Math.floor(t || 0)) + "s";
  }
  function clearSequence() {
    if (sequenceTimer) clearInterval(sequenceTimer);
    sequenceTimer = null; sequence = null; sequenceIndex = 0;
    sequenceArmed = false; sequenceExpectedVid = null; sequenceLoadNonce += 1;
  }
  function armSequence(player, nonce) {
    if (!sequence || !player || nonce !== sequenceLoadNonce) return false;
    var current = sequence[sequenceIndex];
    if (!current) return false;
    var expected = current.sourceId || sequenceExpectedVid;
    var actual = "", now = -1;
    try {
      actual = player.getVideoData ? ((player.getVideoData() || {}).video_id || "") : player.__vid;
      now = player.getCurrentTime();
    } catch (e) { return false; }
    if (actual === expected && now >= current.t - 3 && now < current.end) {
      sequenceArmed = true; return true;
    }
    return false;
  }
  function dockLabel(vid, label) {
    var r = byId(vid);
    var title = r ? (r.name || r.title) : "VRL broadcast";
    return label ? label + " · " + title : title;
  }
  function playerVars(t, autoplay) {
    return {
      start: Math.floor(t || 0), autoplay: autoplay ? 1 : 0, rel: 0,
      playsinline: 1, origin: location.origin, widget_referrer: location.href
    };
  }
  function api() {
    if (apiReady) return apiReady;
    apiReady = new Promise(function (resolve, reject) {
      if (window.YT && YT.Player) return resolve();
      var settled = false;
      var timeout = setTimeout(function () {
        if (settled) return; settled = true;
        reject(new Error("YouTube player API timed out"));
      }, 9000);
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (prev) prev();
        if (settled) return; settled = true; clearTimeout(timeout); resolve();
      };
      var s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.onerror = function () {
        if (settled) return; settled = true; clearTimeout(timeout);
        reject(new Error("YouTube player API failed to load"));
      };
      document.head.appendChild(s);
    });
    return apiReady;
  }
  function setRecovery(anchor, vid, t, failed) {
    if (!anchor) return;
    anchor.href = youtubeUrl(vid, t);
    anchor.textContent = failed ? "PLAYER BLOCKED — OPEN EXACT TIME ON YOUTUBE ↗" : "OPEN THIS EXACT TIME ON YOUTUBE ↗";
    anchor.classList.toggle("failed", !!failed);
  }
  function inlineRecovery(hostId, vid, t) {
    var id = hostId + "Recovery", anchor = document.getElementById(id);
    if (!anchor) {
      var host = document.getElementById(hostId); if (!host) return null;
      anchor = document.createElement("a"); anchor.id = id; anchor.className = "player-recovery";
      anchor.target = "_blank"; anchor.rel = "noopener noreferrer";
      host.insertAdjacentElement("afterend", anchor);
    }
    setRecovery(anchor, vid, t, false);
    return anchor;
  }
  function dockEl() {
    var d = document.getElementById("dock");
    if (!d) {
      d = document.createElement("div"); d.id = "dock";
      d.innerHTML = '<div class="d-head"><span class="tt" id="dockTitle"></span>' +
        '<button title="Open race page" aria-label="Open the current race page" id="dockGoto">↗</button>' +
        '<button title="Close" aria-label="Close the video player" id="dockClose">✕</button></div>' +
        '<div class="d-vid"><div id="dockPlayerHost"></div></div>' +
        '<a id="dockRecovery" class="player-recovery" target="_blank" rel="noopener noreferrer"></a>';
      document.body.appendChild(d);
      d.querySelector("#dockClose").onclick = function () { d.classList.remove("show"); clearSequence(); AfterDark.stop(); try { dockP && dockP.stopVideo(); } catch (e) {} };
      d.querySelector("#dockGoto").onclick = function () { if (dockVid) go("#/race/" + dockVid); };
    }
    return d;
  }
  function playDock(vid, t, label) {
    var d = dockEl(); d.classList.add("show");
    d.querySelector("#dockTitle").textContent = dockLabel(vid, label);
    dockVid = vid; dockStart = t || 0;
    setRecovery(d.querySelector("#dockRecovery"), vid, dockStart, false);
    api().then(function () {
      if (dockP) {
        if (vid === dockP.__vid) { dockP.seekTo(dockStart, true); dockP.playVideo(); }
        else { dockP.loadVideoById({ videoId: vid, startSeconds: dockStart }); dockP.__vid = vid; }
      } else {
        dockP = new YT.Player("dockPlayerHost", {
          videoId: vid, playerVars: playerVars(dockStart, true),
          events: {
            onReady: function (ev) { ev.target.playVideo(); },
            onError: function () { setRecovery(d.querySelector("#dockRecovery"), vid, dockStart, true); }
          }
        });
        dockP.__vid = vid;
      }
    }).catch(function () { setRecovery(d.querySelector("#dockRecovery"), vid, dockStart, true); });
  }
  function mountInline(hostId, vid, t, autoplay) {
    inlineVid = vid;
    var recovery = inlineRecovery(hostId, vid, t || 0);
    api().then(function () {
      if (!document.getElementById(hostId)) return;
      inlineP = new YT.Player(hostId, {
        videoId: vid, playerVars: playerVars(t || 0, !!autoplay),
        events: { onError: function () { setRecovery(recovery, vid, t || 0, true); } }
      });
      inlineP.__vid = vid;
    }).catch(function () { setRecovery(recovery, vid, t || 0, true); });
  }
  function loadInline(hostId, vid, t, autoplay) {
    inlineVid = vid;
    var recovery = inlineRecovery(hostId, vid, t || 0);
    if (inlineP && inlineP.loadVideoById) {
      try {
        if (autoplay === false && inlineP.cueVideoById) inlineP.cueVideoById({ videoId: vid, startSeconds: t || 0 });
        else inlineP.loadVideoById({ videoId: vid, startSeconds: t || 0 });
        inlineP.__vid = vid;
        setRecovery(recovery, vid, t || 0, false);
        return;
      } catch (e) {}
    }
    mountInline(hostId, vid, t || 0, autoplay);
  }
  function play(vid, t) {
    clearSequence();
    if (inlineP && inlineVid === vid && inlineP.seekTo) {
      try {
        inlineP.seekTo(t || 0, true); inlineP.playVideo();
        var exact = document.getElementById("racePlayerHostRecovery");
        setRecovery(exact, vid, t || 0, false);
        window.scrollTo({ top: 0, behavior: "smooth" }); return;
      } catch (e) {}
    }
    playDock(vid, t);
  }
  function playSequence(vid, segments) {
    clearSequence();
    sequence = (segments || []).filter(function (part) {
      return part && isFinite(part.t) && isFinite(part.end) && part.end > part.t;
    });
    if (!sequence.length) return play(vid, 0);
    sequenceIndex = 0;
    sequenceLoadNonce += 1;
    sequenceArmed = false;
    sequenceExpectedVid = sequence[0].sourceId || vid;
    playDock(sequenceExpectedVid, sequence[0].t, sequence[0].label || "CLIP 1");
    sequenceTimer = setInterval(function () {
      if (!sequence || !dockP || !dockP.getCurrentTime) return;
      var nonce = sequenceLoadNonce;
      if (!sequenceArmed && !armSequence(dockP, nonce)) return;
      var now;
      try { now = dockP.getCurrentTime(); } catch (e) { return; }
      var current = sequence[sequenceIndex];
      if (!current || now < current.end - .15) return;
      sequenceIndex += 1;
      if (sequenceIndex >= sequence.length) {
        try { dockP.pauseVideo(); } catch (e) {}
        var done = document.getElementById("dock");
        if (done) done.querySelector("#dockTitle").textContent = dockLabel(vid, "SEQUENCE COMPLETE");
        clearSequence(); return;
      }
      current = sequence[sequenceIndex]; dockStart = current.t;
      var currentVid = current.sourceId || vid;
      sequenceLoadNonce += 1;
      sequenceArmed = false;
      sequenceExpectedVid = currentVid;
      try {
        dockVid = currentVid;
        if (dockP.__vid === currentVid) {
          dockP.seekTo(current.t, true); dockP.playVideo();
        } else {
          dockP.loadVideoById({ videoId: currentVid, startSeconds: current.t });
          dockP.__vid = currentVid;
        }
        var dock = document.getElementById("dock");
        if (dock) {
          dock.querySelector("#dockTitle").textContent = dockLabel(currentVid, current.label || ("CLIP " + (sequenceIndex + 1)));
          setRecovery(dock.querySelector("#dockRecovery"), currentVid, current.t, false);
        }
      } catch (e) {}
    }, 250);
  }
  function inlineTime() {
    try { if (inlineP && inlineP.getCurrentTime) return inlineP.getCurrentTime(); } catch (e) {}
    return null;
  }
  function dockTime() {
    try { if (dockP && dockP.getCurrentTime) return dockP.getCurrentTime(); } catch (e) {}
    return null;
  }
  function dropInline() { inlineP = null; inlineVid = null; }
  return {
    play: play, playSequence: playSequence, mountInline: mountInline, loadInline: loadInline,
    dropInline: dropInline, inlineTime: inlineTime, dockTime: dockTime,
    youtubeUrl: youtubeUrl
  };
})();
window.__play = function (vid, t) { Player.play(vid, t); };
window.__playReceipt = function (vid, t, end, label) {
  Player.playSequence(vid, [
    { sourceId: vid, t: t, end: end, label: label || "RESULTS RUNDOWN" }
  ]);
};
window.__playSequence = function (vid, setupT, setupEnd, payoffT, payoffEnd, setupLabel, payoffLabel) {
  Player.playSequence(vid, [
    { t: setupT, end: setupEnd, label: setupLabel || "THE SETUP" },
    { t: payoffT, end: payoffEnd, label: payoffLabel || "THE PAYOFF" }
  ]);
};
window.__playHighlight = function (eventId, mode) {
  var reel = (HIGHLIGHT_REELS.reels || {})[eventId];
  if (!reel || !(reel.cuts || []).length) return;
  var cuts = reel.cuts || [];
  if (mode === "fast" && reel.fastRecap) {
    var wanted = {}; (reel.fastRecap.cutIndexes || []).forEach(function (index) { wanted[index] = 1; });
    cuts = cuts.filter(function (cut) { return wanted[cut.index]; });
  }
  Player.playSequence(eventId, cuts.map(function (cut) {
    return { sourceId: cut.sourceId, t: cut.t, end: cut.end, label: cut.label };
  }));
};
window.__playRaceStory = function (eventId) {
  var race = CANONICAL_RACES.filter(function (item) { return (item.eventId || item.id) === eventId; })[0] ||
    byId(eventId);
  var story = raceStoryboard(race, highlightOf(eventId), eventResultRundown(race));
  if (!story.length) return;
  Player.playSequence(eventId, story.map(function (item) {
    return { sourceId: item.sourceId, t: item.t, end: item.end, label: item.label };
  }));
};
window.__playDriverReel = function (slug) {
  var dossier = dossierOf(slug);
  var sequence = dossier ? driverSignatureSequence(dossier) : [];
  if (!sequence.length) return;
  Player.playSequence(sequence[0].sourceId, sequence);
};
window.__playSeasonStory = function (label) {
  var sequence = seasonStorySequence(decodeURIComponent(label || ""));
  if (!sequence.length) return;
  Player.playSequence(sequence[0].sourceId, sequence);
};

/* ------------------------------------------------------- transcript loader */
var trLoading = {};
function loadTranscript(id) {
  if (window.TR[id]) return Promise.resolve(window.TR[id]);
  if (TR_INDEX.indexOf(id) < 0) return Promise.resolve(null);
  if (trLoading[id]) return trLoading[id];
  trLoading[id] = new Promise(function (res) {
    var s = document.createElement("script");
    s.src = "assets/tr/" + id + ".js";
    s.onload = function () { res(window.TR[id] || null); };
    s.onerror = function () { res(null); };
    document.head.appendChild(s);
  });
  return trLoading[id];
}

/* ------------------------------------------------------------------- nav */
function renderNav() {
  var primaryLinks = [
    ["#/watch", "Watch"], ["#/tape", "Ask"], ["#/highlights", "Highlights"],
    ["#/scene", "Scene"],
    ["#/hall", "Drivers"], ["#/seasons", "Seasons"], ["#/rankings", "Rankings"]
  ];
  var exploreLinks = [
    ["#/", "Home"], ["#/showcase", "Showcase"], ["#/time-machine", "Time Machine"],
    ["#/flashback", "Flashback"],
    ["#/definitive-history", "Hype History"], ["#/results", "Results"],
    ["#/exciting", "Most Exciting"], ["#/moments", "Hot 100"],
    ["#/booth-lore", "Booth Lore"], ["#/more", "More"]
  ];
  var cur = location.hash || "#/";
  function linkHtml(link) {
    var on = (link[0] === "#/" ? (cur === "#/" || cur === "") : cur.indexOf(link[0]) === 0);
    return '<a href="' + link[0] + '" class="' + (on ? "on" : "") + '"' +
      (on ? ' aria-current="page"' : '') + ' onclick="__navClose()">' + link[1] + "</a>";
  }
  var exploreOn = exploreLinks.some(function (link) {
    return link[0] === "#/" ? (cur === "#/" || cur === "") : cur.indexOf(link[0]) === 0;
  });
  $nav.innerHTML = '<div class="nav-in">' +
    '<a class="nav-logo" href="#/" aria-label="VRL Living Wiki home">' +
    '<img src="' + (SHOW.brand && (SHOW.brand.navLogo || SHOW.brand.logo) || "") + '" alt="Vigilante Racing">' +
    '<div class="t">' + esc(SHOW.name || "VRL") + '<small>' + esc(SHOW.product || "") + ' · LIVING WIKI</small></div></a>' +
    '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primaryNav" onclick="__navToggle(this)">MENU</button>' +
    '<nav class="nav-links" id="primaryNav" aria-label="Primary navigation">' +
    primaryLinks.map(linkHtml).join("") +
    '<details class="nav-explore"><summary class="' + (exploreOn ? "on" : "") +
    '" aria-label="Open Explore navigation">Explore</summary><div class="nav-explore-menu">' +
    exploreLinks.map(linkHtml).join("") + "</div></details></nav></div>" +
    '<div class="checker"></div>';
}
window.__navToggle = function (button) {
  var nav = document.getElementById("primaryNav");
  if (!nav) return;
  var open = nav.classList.toggle("open");
  button.setAttribute("aria-expanded", open ? "true" : "false");
  button.textContent = open ? "CLOSE" : "MENU";
};
window.__navClose = function () {
  var nav = document.getElementById("primaryNav");
  var button = $nav && $nav.querySelector(".nav-toggle");
  if (nav) nav.classList.remove("open");
  var explore = nav && nav.querySelector(".nav-explore");
  if (explore) explore.removeAttribute("open");
  if (button) {
    button.setAttribute("aria-expanded", "false");
    button.textContent = "MENU";
  }
};

function renderFoot() {
  $foot.innerHTML = '<div class="wrap">' +
    '<img src="' + (SHOW.brand && SHOW.brand.networkLogo || "") + '" alt="Shokker Lore">' +
    '<div>' + esc(SHOW.product) + " — a " + esc(SHOW.maker) + " product · The living wiki of the " + esc(SHOW.name) +
    "<br>Every clip plays from the original YouTube broadcasts on their home channels. " +
    (SHOW.eras || []).map(function (e) { return '<a href="' + e.channelUrl + '" target="_blank" rel="noopener">' + esc(e.name) + "</a>"; }).join(" · ") +
    "<br><span style='opacity:.6'>Psst — press C for a caution flag.</span></div></div>";
}
function partnerBand() {
  var partners = SHOW.partners || {};
  var presenting = partners.presenting || {};
  var supporting = partners.supporting || [];
  if (!presenting.logo && !supporting.length) return "";
  return '<section class="partner-band" aria-label="VRL sponsors and partners">' +
    '<div class="partner-heading"><span>POWERING WEDNESDAY NIGHT</span><h2>VRL PARTNERS</h2></div>' +
    '<div class="partner-grid">' +
    (presenting.logo ? '<article class="partner presenting"><span>PRESENTING SPONSOR</span><img loading="lazy" src="' +
      esc(presenting.logo) + '" alt="' + esc(presenting.name) + ' logo"><b>' + esc(presenting.name) + '</b></article>' : '') +
    '<div class="partner-supporting">' + supporting.map(function (partner) {
      return '<article class="partner supporting"><span>SUPPORTING SPONSOR</span><img loading="lazy" src="' +
        esc(partner.logo) + '" alt="' + esc(partner.name) + ' logo"><b>' + esc(partner.name) + '</b></article>';
    }).join("") + '</div></div></section>';
}

/* --------------------------------------------------------- VIGILANTE PRESS */
function sceneIssues() {
  return ((VIGILANTE_PUBLICATIONS.scene || {}).issues || []).slice();
}
function flashbackAnnuals() {
  return ((VIGILANTE_PUBLICATIONS.flashbacks || {}).annuals || []).slice();
}
function sceneIssueForEvent(eventId) {
  return sceneIssues().filter(function (issue) { return issue.eventId === eventId; })[0] || null;
}
function sceneIssueById(id) {
  return sceneIssues().filter(function (issue) {
    return issue.id === id || issue.eventId === id || String(issue.issueNumber) === String(id);
  })[0] || null;
}
function flashbackForSeason(value) {
  var number = parseInt(String(value || "").replace(/\D+/g, ""), 10);
  return flashbackAnnuals().filter(function (annual) { return annual.seasonNumber === number; })[0] || null;
}
function pressClippingsForDriver(driverId) {
  return {
    issues: sceneIssues().filter(function (issue) {
      return (issue.driverIds || []).indexOf(driverId) >= 0;
    }).sort(function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); }),
    annuals: flashbackAnnuals().filter(function (annual) {
      return (annual.driverIds || []).indexOf(driverId) >= 0;
    }).sort(function (a, b) { return b.seasonNumber - a.seasonNumber; })
  };
}
function driverPressClippingCard(item, type) {
  var isScene = type === "scene";
  var href = isScene ? "#/scene/" + item.eventId : "#/flashback/" + item.seasonNumber;
  var image = item.heroImage || "assets/vrl-logo.png";
  var eyebrow = isScene
    ? "VIGILANTE SCENE / ISSUE " + String(item.issueNumber).padStart(2, "0")
    : "VIGILANTE FLASHBACK / SEASON " + item.seasonNumber;
  var title = isScene ? item.leadStory.headline : item.title;
  var detail = isScene
    ? fmtDate(item.date) + " / " + (item.track || "TRACK DEVELOPING")
    : (item.dateRange || "SEASON ARCHIVE") + " / " + item.raceCount + " RACES";
  return '<a class="driver-press-card ' + (isScene ? "scene" : "flashback") + '" href="' + href +
    '"><figure><img loading="lazy" src="' + esc(image) + '" alt="" aria-hidden="true"></figure><div><span>' +
    esc(eyebrow) + '</span><h3>' + esc(title) + '</h3><p>' + esc(detail) +
    '</p><b>OPEN THE PUBLICATION &rarr;</b></div></a>';
}
window.__playPressReceipt = function (sourceId, t, end, encodedLabel) {
  window.__playReceipt(sourceId, t, end, decodeURIComponent(encodedLabel || "PRESS RECEIPT"));
};
function pressReceiptButton(receipt, label, className) {
  if (!receipt) return "";
  var text = label || receipt.label || "Play exact receipt";
  return '<button class="' + esc(className || "press-receipt") + '" type="button" onclick="__playPressReceipt(\'' +
    esc(receipt.sourceId) + '\',' + Number(receipt.t || 0) + ',' + Number(receipt.end || 0) + ',\'' +
    encArg(text) + '\')"><span>&#9654;</span><b>' + esc(text) + '</b><small>' +
    fmtT(receipt.t) + '&ndash;' + fmtT(receipt.end) + '</small></button>';
}
function pressSponsorStrip() {
  var partners = SHOW.partners || {}, presenting = partners.presenting || {};
  return '<aside class="press-sponsors"><span>VIGILANTE PRESS PARTNERS</span>' +
    (presenting.logo ? '<img src="' + esc(presenting.logo) + '" alt="' + esc(presenting.name) + ' logo">' : '') +
    (partners.supporting || []).map(function (partner) {
      return '<img src="' + esc(partner.logo) + '" alt="' + esc(partner.name) + ' logo">';
    }).join("") + '</aside>';
}
function homePressRack() {
  var issues = sceneIssues(), annuals = flashbackAnnuals();
  if (!issues.length && !annuals.length) return "";
  var latest = issues[issues.length - 1], annual = annuals[annuals.length - 1];
  return '<section class="press-rack" aria-labelledby="pressRackTitle"><header><div><span>THE VIGILANTE PRESS</span>' +
    '<h2 id="pressRackTitle">THE RACE PAPER &amp; THE SEASON YEARBOOK</h2></div><p>Original reporting built from the official Wednesday-night tape. Read the story, then play the exact proof.</p></header><div class="press-rack-grid">' +
    (latest ? '<a class="press-rack-scene" href="#/scene/' + esc(latest.eventId) + '"><span>NEW ISSUE / ' +
      esc(fmtDate(latest.date).toUpperCase()) + '</span><div><img src="' + esc(latest.heroImage) +
      '" alt="Official broadcast thumbnail for ' + esc(latest.raceTitle) + '"><section><small>' +
      esc(latest.cover.edition) + '</small><h3>' + esc(latest.cover.headline) + '</h3><p>' +
      esc(latest.cover.deck) + '</p><b>READ THE LATEST SCENE &rarr;</b></section></div></a>' : '') +
    (annual ? '<a class="press-rack-flashback" href="#/flashback/' + annual.seasonNumber + '"><span>LATEST COMPLETE VOLUME</span>' +
      '<div class="press-volume-mini"><i>' + annual.seasonNumber + '</i><section><small>VIGILANTE FLASHBACK</small><h3>SEASON ' +
      annual.seasonNumber + '</h3><p>' + esc(annual.subtitle) + '</p><b>OPEN THE YEARBOOK &rarr;</b></section></div></a>' : '') +
    '</div><footer><a href="#/scene">ALL SCENE ISSUES</a><a href="#/flashback">ALL FLASHBACK ANNUALS</a><span>' +
    (VIGILANTE_PUBLICATIONS.summary.receiptCount || 0) + ' EXACT-SOURCE ROUTES</span></footer></section>';
}

/* --------------------------------------------------------------- renderers */
function raceCard(r) {
  var d = DISTILLED[r.id] || {};
  var ex = excitementOf(r.id);
  var winner = verifiedEventWinner(r);
  var meta = [];
  if (r.seasonLabel) meta.push(esc(r.seasonLabel) + (r.round ? " · R" + r.round : ""));
  if (r.special) meta.push('<span style="color:var(--gold)">★ ' + esc(String(r.special).toUpperCase()) + "</span>");
  meta.push('<span class="era">' + esc(era(r.era).short) + "</span>");
  if (r.date) meta.push(fmtDate(r.date));
  return '<a class="card race-card" href="#/race/' + r.id + '" aria-label="Open race file: ' + esc(r.name || r.title) + '">' +
    '<div class="thumb"><img loading="lazy" src="' + esc(r.thumb || ("https://i.ytimg.com/vi/" + r.id + "/hqdefault.jpg")) + '" alt="Broadcast thumbnail for ' + esc(r.name || r.title) + '">' +
    (ex ? '<span class="ex-card-score" title="Archive excitement rank #' + ex.rank + '"><b>' + ex.score + '</b><small>INDEX</small></span>' : '') +
    '<span class="dur">' + fmtDur(r.duration) + '</span><span class="play">▶</span></div>' +
    '<div class="body"><div class="meta">' + meta.join(" · ") + "</div>" +
    "<h3>" + esc(r.name || r.title) + "</h3>" +
    (winner ? '<div class="win">✓ ' + (winner.countsAsOrdinaryEvent ? '' : 'QUALIFIER P1 · ') + esc(winner.name) + "</div>" : (d.winner ? '<div class="win pending">RESULT RECEIPT PENDING</div>' : "")) +
    "</div></a>";
}

function momentRow(r, m, showRace, rankMeta) {
  var tags = (m.tags || []).map(function (t) {
    var dr = driverById(t);
    return dr ? '<a class="pill" href="#/driver/' + dr.id + '">' + esc(dr.name) + "</a>" : "";
  }).join("");
  return '<div class="moment' + ((m.heat || 0) >= 4 ? " hot" : "") + '">' +
    '<button class="m-play" onclick="__play(\'' + r.id + "'," + (m.t || 0) + ')">▶ ' + fmtT(m.t) + "</button>" +
    '<div class="m-body">' +
    (showRace ? '<div class="m-race"><a href="#/race/' + r.id + '">' + esc(r.name || r.title) + "</a>" + (r.date ? " · " + fmtDate(r.date) : "") + "</div>" : "") +
    '<div class="m-title">' + esc(m.title || "") + (m.auto ? ' <span class="pill" style="font-size:9.5px;padding:1px 8px;vertical-align:2px;cursor:default">AUTO-DETECTED</span>' : "") +
    '<button class="m-share" title="Share this exact moment" onclick="__shareMoment(\'' + r.id + '\',' + (m.t || 0) + ',\'' + encArg(m.title || "VRL moment") + '\')">↗ SHARE</button></div>' +
    (m.summary ? '<div class="m-sub">' + esc(m.summary) + "</div>" : "") +
    (rankMeta ? '<div class="hot-why"><b>' + rankMeta.score + ' MEMORABILITY</b> · ' + (rankMeta.reasons || rankMeta.why || []).map(esc).join(' · ') + '<small>Baseline #' + (rankMeta.baselineRank || rankMeta.rank || "?") + ' · confidence ' + Math.round((rankMeta.evidenceConfidence || 0) * 100) + '% · creator/editor votes ' + (rankMeta.creatorVotes || 0) + '/' + (rankMeta.editorVotes || 0) + '</small></div>' : '') +
    (tags ? '<div class="m-tags">' + tags + "</div>" : "") +
    "</div></div>";
}

function wantedCard(d, tier) {
  var dossier = dossierOf(d.id) || {};
  var career = dossier.career || {};
  var years = dossier.yearsActive || [];
  var span = years.length
    ? (years.length === 1 ? String(years[0]) : years[0] + "-" + years[years.length - 1])
    : careerSpan(d);
  var titles = TITLES[d.name] || [];
  return '<a class="wanted' + (tier === "legend" ? " legend" : "") + '" href="#/driver/' + d.id + '" aria-label="Open driver dossier: ' + esc(d.name) + '">' +
    (titles.length ? '<span class="w-badge" title="' + esc(titles.join(", ")) + '">👑' + (titles.length > 1 ? "×" + titles.length : "") + "</span>" :
      tier === "legend" ? '<span class="w-badge">🏆</span>' : "") +
    '<div class="w-tag">' + (tier === "legend" ? "ARCHIVE ICON" : "DRIVER DOSSIER") + "</div>" +
    driverVisual(d, "card-shot") +
    "<h3>" + esc(d.name) + "</h3>" +
    '<div class="w-sub">' + (span ? "RODE " + span : "AT LARGE") + ((d.reviewedAliases || []).length ? " · " + d.reviewedAliases.length + " REVIEWED ALIASES" : "") + "</div>" +
    '<div class="w-stats">' +
    "<div><b>" + (career.archiveAppearances == null ? (d.races || []).length : career.archiveAppearances) + "</b><span>Archive appearances*</span></div>" +
    "<div><b>" + verifiedResultCount(d.name, 1) + "</b><span>Reviewed wins</span></div>" +
    "<div><b>" + ((dossier.careerGauge || {}).score || 0) + "</b><span>Gauge</span></div>" +
    "</div></a>";
}

/* ------------------------------------------------------------------- HOME */
function allMoments(includeAuto) {
  var out = [];
  R_ALL_NEWEST.forEach(function (r) {
    var d = DISTILLED[r.id];
    if (d && (d.moments || []).length) {
      d.moments.forEach(function (m) { out.push([r, m]); });
    } else if (includeAuto && AUTOMOMENTS[r.id]) {
      AUTOMOMENTS[r.id].forEach(function (m) { out.push([r, m]); });
    }
  });
  return out;
}
function momentsOf(raceId) {
  var d = DISTILLED[raceId];
  if (d && (d.moments || []).length) return { list: d.moments, auto: false };
  if (AUTOMOMENTS[raceId]) return { list: AUTOMOMENTS[raceId], auto: true };
  return { list: [], auto: false };
}

function thisWednesday() {
  // races within ±3 days of today's month/day in previous years
  var now = new Date();
  var out = [];
  CANONICAL_RACES.forEach(function (r) {
    if (!r.date) return;
    if (r.special && /fragment|part/i.test(r.special)) return;
    var d = new Date(r.date + "T12:00:00");
    if (d.getFullYear() === now.getFullYear()) return;
    var a = new Date(now.getFullYear(), d.getMonth(), d.getDate());
    var diff = Math.abs(a - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000;
    if (diff <= 3) out.push(r);
  });
  return out.sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
}

function homePitBoard(race, data) {
  if (!race) return "";
  var eventId = race.eventId || race.id;
  var reel = highlightOf(eventId);
  var rundownRoute = eventResultRundown(race);
  var rundown = rundownRoute && rundownRoute.result;
  var recap = publicRaceRecap(race, data || {});
  var podium = [1, 2, 3].map(function (position) {
    var claim = verifiedEventPosition(race, position);
    return claim ? { position: position, claim: claim } : null;
  }).filter(Boolean);
  var climax = ((data || {}).moments || []).slice().sort(function (a, b) {
    return (b.heat || 0) - (a.heat || 0) || (b.t || 0) - (a.t || 0);
  })[0];
  var fast = reel && reel.fastRecap;
  var coverage = (reel && reel.coverage) || {};
  var meta = [
    race.seasonLabel,
    race.round ? "ROUND " + race.round : "",
    race.track,
    fmtDate(race.date)
  ].filter(Boolean).map(esc).join(" / ");

  return '<section class="pit-board"><div class="pit-board-flag"><span>WEDNESDAY PIT BOARD</span><b>LATEST OFFICIAL TAPE</b></div>' +
    '<div class="pit-board-main"><div class="pit-board-visual"><img src="' +
    esc(race.thumb || ("https://i.ytimg.com/vi/" + race.id + "/maxresdefault.jpg")) +
    '" alt="Broadcast thumbnail for ' + esc(race.name || race.title) + '"><div><span>' +
    esc(meta) + '</span><h2>' + esc(race.name || race.title) +
    '</h2><p>THE NEWEST COMPLETE WEDNESDAY RACE FILE</p></div></div><div class="pit-board-story">' +
    '<div class="pit-board-kicker">THE RACE IN ONE READ</div><p>' + esc(recap.text || "Race story developing from the official tape.") + '</p>' +
    '<div class="pit-board-actions">' +
    (fast ? '<button class="btn" onclick="__playHighlight(\'' + eventId + '\',\'fast\')">&#9654; FAST RECAP / ' +
      fmtT(fast.editDurationSeconds) + '</button>' : '') +
    '<button class="btn ghost" onclick="__playRaceStory(\'' + eventId + '\')">&#9654; PLAY RACE STORY</button>' +
    (rundown ? '<button class="btn ghost" onclick="__playReceipt(\'' + rundownRoute.sourceId + '\',' +
      rundown.receipt.t + ',' + rundown.receipt.end + ',\'BROADCAST RESULTS READ\')">&#9654; RESULT READ / ' +
      fmtT(rundown.receipt.end - rundown.receipt.t) + '</button>' : '') +
    '<a class="btn ghost" href="#/race/' + race.id + '">OPEN COMPLETE FILE</a></div></div></div>' +
    '<div class="pit-board-podium"><div class="pit-board-podium-label"><span>OFFICIAL-TAPE PODIUM</span><b>' +
    (podium.length === 3 ? "ALL THREE POSITIONS BOUNDED" : "SUPPORTED POSITIONS ONLY") + '</b></div>' +
    [1, 2, 3].map(function (position) {
      var item = podium.filter(function (candidate) { return candidate.position === position; })[0];
      if (!item) return '<div class="pit-place pending"><span>P' + position + '</span><b>NOT POSITION-BOUND</b></div>';
      var claim = item.claim;
      return '<button class="pit-place" onclick="__playReceipt(\'' + claim.sourceId + '\',' +
        claim.receipt.t + ',' + claim.receipt.end + ',\'P' + position + ' RESULT RECEIPT\')"><span>P' +
        position + '</span><b>' + esc(claim.name) + '</b><small>' +
        'PLAY EXACT RESULT PROOF</small></button>';
    }).join("") + '</div><div class="pit-board-tote">' +
    '<div><b>' + (fast ? fmtT(fast.editDurationSeconds) : "—") + '</b><span>FAST RECAP</span></div>' +
    '<div><b>' + (fast ? fast.cutCount : 0) + '</b><span>QUICK-EDIT CHAPTERS</span></div>' +
    '<div><b>' + (coverage.cautionCallsCovered || 0) + '</b><span>CAUTION WINDOWS COVERED</span></div>' +
    '<div><b>' + (rundown ? (rundown.positionsCovered || []).length : 0) + '</b><span>POSITIONS SPOKEN IN RUNDOWN</span></div>' +
    '<div><b>' + ((CURRENT_ROSTER && CURRENT_ROSTER.memberCount) || 0) + '</b><span><a href="#/drivers/current">CURRENT-SEASON DRIVERS ON TAPE</a></span></div>' +
    (climax ? '<button onclick="__play(\'' + race.id + '\',' + climax.t + ')"><b>&#9654;</b><span>PLAY THE NIGHT-CHANGING MOMENT</span></button>' : '') +
    '</div><small class="pit-board-boundary">Podium names require a position-specific same-source receipt. The bounded broadcast rundown is preserved as playback evidence; lower-field names remain candidates until separately position-bound.</small></section>';
}

function vHome() {
  var hours = 0; RACES.forEach(function (r) { hours += r.duration || 0; });
  var moms = allMoments();
  var latest = R_NEWEST.slice(0, 6);
  var html = "";

  html += '<section class="hero"><div class="wrap">' +
    '<div class="hero-logo"><img src="' + esc(SHOW.brand.seriesLogo || SHOW.brand.logo) + '" alt="VRL Premiere Series logo"></div>' +
    '<div class="hero-command">' +
    '<div class="kicker">' + esc(SHOW.product) + " PRESENTS · A LIVING WIKI</div>" +
    "<h1>Vigilante <span class=\"r\">Racing</span> League</h1>" +
    '<p class="tag">' + esc(SHOW.tagline || "") + "</p>" +
    '<div class="bigsearch"><span class="ic">🔎</span><input id="homeQ" aria-label="Search the VRL archive" placeholder="Search a driver, a track, a wreck… try a name like \'Ricky Whittenburg\'"></div>' +
    '<div class="stat-row">' +
    '<div class="stat"><b>' + RACES.length + "</b><span>Official sources</span></div>" +
    '<div class="stat"><b>' + CANONICAL_COUNT + "</b><span>Canonical events</span></div>" +
    '<div class="stat"><b>' + SEASONS.length + "</b><span>Seasons & runs</span></div>" +
    '<div class="stat"><b>' + Math.round(hours / 3600) + "</b><span>Hours of tape</span></div>" +
    '<div class="stat"><b>' + DRIVERS.length + "</b><span>Driver dossiers</span></div>" +
    (moms.length ? '<div class="stat"><b>' + moms.length + "</b><span>Logged moments</span></div>" : "") +
    '</div></div><nav class="hero-pitwall" aria-label="Primary archive routes"><span>PIT WALL</span>' +
    '<a href="#/watch"><b>01</b><strong>WATCH</strong><em>Find tonight&rsquo;s race</em></a>' +
    '<a href="#/drivers/current"><b>02</b><strong>GRID</strong><em>Meet Season 15</em></a>' +
    '<a href="#/tape"><b>03</b><strong>ASK</strong><em>Question the tape</em></a>' +
    '<a href="#/scene"><b>04</b><strong>SCENE</strong><em>Read race week</em></a>' +
    '</nav></div></section>';

  html += '<div class="wrap">' + partnerBand();

  html += '<section class="home-start" aria-labelledby="homeStartTitle"><div class="home-start-head">' +
    '<div><span>NEW TO THE VRL ARCHIVE?</span><h2 id="homeStartTitle">PICK YOUR FIRST LAP</h2></div>' +
    '<p>Choose a goal. Every path stays wired to the official Wednesday-night tape.</p></div>' +
    '<div class="home-start-grid">' +
    '<a href="#/watch"><b>01</b><span>JUST SHOW ME A GREAT RACE</span><h3>WATCH ONE</h3><p>Pick finish drama, battles, strategy, chaos, stakes, or the newest race.</p><em>FIND A RACE &rarr;</em></a>' +
    '<a href="#/drivers/current"><b>02</b><span>I WANT TO KNOW THE FIELD</span><h3>MEET THE GRID</h3><p>See the current roster, recent form, truck visuals, and driver dossiers.</p><em>OPEN SEASON 15 &rarr;</em></a>' +
    '<a href="#/tape"><b>03</b><span>I HAVE A VRL QUESTION</span><h3>ASK THE TAPE</h3><p>Ask the archive, get a direct answer, then play the bounded evidence.</p><em>ASK A QUESTION &rarr;</em></a>' +
    '<a href="#/showcase"><b>04</b><span>I RUN A LEAGUE</span><h3>SEE THE PRODUCT</h3><p>Tour the evidence model, correction workflow, and bounded pilot offer.</p><em>RUN THE DEMO &rarr;</em></a></div></section>' +
    '<nav class="home-toolbelt" aria-label="More ways to explore the VRL archive"><span>MORE WAYS INTO THE ARCHIVE</span>' +
    '<a href="#/highlights">RACE HIGHLIGHTS</a><a href="#/time-machine">TIME MACHINE</a>' +
    '<a href="#/scene">VIGILANTE SCENE</a><a href="#/flashback">FLASHBACK ANNUALS</a>' +
    '<a href="#/definitive-history">HYPE HISTORY ' + esc(DEFINITIVE_HISTORY.runtimeLabel || "30:00") + '</a>' +
    '<a href="#/rankings">TOP 25 BOARDS</a><a href="#/results">RESULTS ROOM</a>' +
    '<a href="#/booth-lore">BOOTH LORE</a></nav>';

  var newest = latest[0], newestData = newest ? (DISTILLED[newest.id] || {}) : {};
  html += homePitBoard(newest, newestData);
  html += homePressRack();

  // This Wednesday in VRL history
  var tw = thisWednesday();
  if (tw.length) {
    html += '<div class="sec"><div class="sec-head"><h2>This week in VRL history</h2><div class="ln"></div></div><div class="grid g3">' +
      tw.slice(0, 3).map(function (r) {
        return '<a class="card tw-card" href="#/race/' + r.id + '" aria-label="Open race file: ' + esc(r.name || r.title) + '">' +
          '<div class="tw-year">' + yearOf(r.date) + "</div><h3>" + esc(r.name || r.title) + "</h3>" +
          '<div class="sub">' + fmtDate(r.date) + " · " + esc(era(r.era).short) + (r.seasonLabel ? " · " + esc(r.seasonLabel) : "") + "</div></a>";
      }).join("") + "</div></div>";
  }

  // Season rail
  html += '<div class="sec"><div class="sec-head"><h2>Seasons</h2><div class="ln"></div><a href="#/seasons">All seasons →</a></div><div class="season-rail">' +
    SEASONS.map(function (s) {
      var ch = CHAMPIONS[s.label];
      return '<a class="season-chip" href="#/season/' + encodeURIComponent(s.label) + '"><b>' + esc(s.label) + "</b><span>" + s.races.length + " races · " + esc(era(s.era).short) + "</span>" +
        (ch ? '<span style="display:block;color:var(--gold)">🏆 ' + esc(ch.name) + "</span>" : "") + "</a>";
    }).join("") + "</div></div>";

  // Archive-wide, evidence-based race excitement ranking
  var wild = RACES.slice().filter(function (r) { return r.sourceRole !== "continuation" && excitementOf(r.id); })
    .sort(function (a, b) { return excitementOf(a.id).rank - excitementOf(b.id).rank; }).slice(0, 3);
  if (wild.length) {
    html += '<div class="sec"><div class="sec-head"><h2>Most exciting races in VRL history</h2><div class="ln"></div><a href="#/exciting">See the full index →</a></div>' +
      '<p class="page-sub">Finish drama, lead battles, restart stakes, strategy uncertainty, booth energy, capped disruption, story stakes, and evidence confidence — ranked across every canonical event.</p>' +
      '<div class="grid g3">' + wild.map(raceCard).join("") + '</div></div>';
  }

  // Latest
  html += '<div class="sec"><div class="sec-head"><h2>Latest broadcasts</h2><div class="ln"></div></div><div class="grid g3">' +
    latest.map(raceCard).join("") + "</div></div>";

  // Hot moments sampler
  var hot = hot100().slice(0, 6);
  if (hot.length) {
    html += '<div class="sec"><div class="sec-head"><h2>Wednesday night chaos</h2><div class="ln"></div><a href="#/moments">All moments →</a></div>' +
      hot.map(function (p) { return momentRow(p[0], p[1], true, p[2]); }).join("") + "</div>";
  }

  // After Dark promo
  html += '<div class="sec"><a class="card" href="#/afterdark" style="display:block;text-align:center;padding:28px;background:linear-gradient(160deg,#161020,#12141F);color:var(--txt)">' +
    '<div class="kicker" style="margin-bottom:4px">CAN\'T PICK A RACE?</div>' +
    '<h3 style="font-family:var(--disp);font-size:30px;letter-spacing:2px;margin:4px 0">🌙 VIGILANTE AFTER DARK</h3>' +
    '<div class="sub">Flip on the late-night scanner — the archive plays its own greatest hits, one moment after another, all night long.</div></a></div>';

  // Eras
  html += '<div class="sec"><div class="sec-head"><h2>The broadcast eras</h2><div class="ln"></div><a href="#/eras">The full story →</a></div><div class="grid g2">' +
    (SHOW.eras || []).map(function (e) {
      var n = RACES.filter(function (r) { return r.era === e.id; }).length;
      return '<a class="card" href="#/eras" style="display:block;color:var(--txt)"><h3>' + esc(e.name) + "</h3>" +
        '<div class="sub">' + esc(e.blurb) + "</div>" +
        '<div style="margin-top:8px" class="sub"><b style="color:var(--txt)">' + n + "</b> surviving broadcasts</div></a>";
    }).join("") + "</div></div>";

  html += '<div class="note red">📼 <b>Lost tape:</b> ' + esc(SHOW.lostMedia || "") + ' <a href="#/lost">Visit the Lost Tape Memorial →</a></div>';
  html += "</div>";
  $app.innerHTML = html;

  var q = document.getElementById("homeQ");
  q.addEventListener("keydown", function (e) { if (e.key === "Enter" && q.value.trim().length >= 2) go("#/search/" + encodeURIComponent(q.value.trim())); });
}

/* ----------------------------------------------------------- EXCITEMENT INDEX */
function excitementBars(ex) {
  if (!ex) return "";
  return '<div class="ex-bars">' + Object.keys(ex.components || {}).map(function (name) {
    var value = ex.components[name];
    return '<div class="ex-bar"><span>' + esc(name) + '</span><i><b style="width:' + value + '%"></b></i><em>' + value + '</em></div>';
  }).join("") + '</div>';
}

var EXCITING_BROWSER = { ranked: [], query: "", season: "", limit: 25 };
function excitingRowHtml(r) {
  var ex = excitementOf(r.id);
  return '<a class="ex-row" href="#/race/' + r.id + '" aria-label="Open ranked race #' + ex.rank + ': ' + esc(r.name || r.title) + '"><div class="ex-rank">#' + ex.rank + '</div><div class="ex-score g' + ex.grade + '"><b>' + ex.score + '</b><span>' + ex.grade + ' CLASS</span></div>' +
    '<div class="ex-copy"><h3>' + esc(r.name || r.title) + '</h3><div>' + esc(r.seasonLabel || "") + (r.track ? ' &middot; ' + esc(r.track) : '') + (r.date ? ' &middot; ' + fmtDate(r.date) : '') + '</div><p>' + (ex.reasons || []).map(esc).join(' &middot; ') + '</p></div>' +
    excitementBars(ex) + '<div class="ex-proof"><span>Baseline #' + (ex.baselineRank || ex.rank) + '</span><span>' +
    (ex.receiptCount || 0) + ' receipts</span><span>' + esc(ex.confidence || "unknown") + ' confidence</span></div></a>';
}
function filteredExcitingRaces() {
  return EXCITING_BROWSER.ranked.filter(function (race) {
    var query = EXCITING_BROWSER.query;
    var haystack = [race.name, race.title, race.track, race.seasonLabel, race.date].filter(Boolean).join(" ").toLowerCase();
    return (!query || haystack.indexOf(query) >= 0) &&
      (!EXCITING_BROWSER.season || race.seasonLabel === EXCITING_BROWSER.season);
  });
}
function renderExcitingRows() {
  var list = document.getElementById("excitingList");
  if (!list) return;
  var filtered = filteredExcitingRaces();
  var shown = filtered.slice(0, EXCITING_BROWSER.limit);
  list.innerHTML = shown.map(excitingRowHtml).join("");
  var status = document.getElementById("excitingStatus");
  if (status) status.textContent = "SHOWING " + shown.length + " OF " + filtered.length + " MATCHING RACES";
  var more = document.getElementById("excitingMore");
  if (more) {
    more.hidden = shown.length >= filtered.length;
    more.textContent = "LOAD " + Math.min(25, filtered.length - shown.length) + " MORE RACES";
  }
  var empty = document.getElementById("excitingEmpty");
  if (empty) empty.hidden = filtered.length !== 0;
}
window.__moreExciting = function () {
  EXCITING_BROWSER.limit += 25;
  renderExcitingRows();
};
window.__filterExciting = function () {
  var query = document.getElementById("excitingQ");
  var season = document.getElementById("excitingSeason");
  EXCITING_BROWSER.query = (query ? query.value : "").trim().toLowerCase();
  EXCITING_BROWSER.season = season ? season.value : "";
  EXCITING_BROWSER.limit = 25;
  renderExcitingRows();
};
function vExciting() {
  var ranked = RACES.slice().filter(function (r) { return r.sourceRole !== "continuation" && excitementOf(r.id); })
    .sort(function (a, b) { return excitementOf(a.id).rank - excitementOf(b.id).rank; });
  EXCITING_BROWSER = { ranked: ranked, query: "", season: "", limit: 25 };
  var weights = EXCITEMENT_METHOD.weights || {};
  var html = '<div class="wrap"><div class="ex-hero"><div><div class="kicker">THE SURVIVING TAPE, RANKED</div>' +
    '<h1>MOST EXCITING <span>RACES</span></h1><p>The VRL Excitement Index measures complete race drama without letting wreck count, profanity, recency, or one noisy signal take over.</p></div>' +
    '<div class="ex-dial"><b>100</b><span>ARCHIVE<br>MAXIMUM</span></div></div>' +
    '<div class="method-card"><b>HOW THE INDEX WORKS</b><span>Every component is normalized against all ' + ranked.length + ' canonical events. Continuation uploads roll into one event; disruption is capped. Time Machine now uses the literal baseline Top 25 in rank order.</span><div class="method-weights">' +
    Object.keys(weights).map(function (k) { return '<span><b>' + weights[k] + '%</b> ' + esc(k) + '</span>'; }).join("") + '</div><small>' + esc(EXCITEMENT_METHOD.note || "") + '</small></div>';
  html += '<div class="sec"><div class="sec-head"><h2>The podium</h2><div class="ln"></div></div><div class="grid g3">' + ranked.slice(0, 3).map(raceCard).join("") + '</div></div>';
  html += '<div class="sec"><div class="sec-head"><h2>Complete archive ranking</h2><div class="ln"></div><span class="more">Wednesday only &middot; All-Star qualifiers permitted</span></div>' +
    '<div class="ex-browser"><label><span>FIND A RACE</span><input id="excitingQ" aria-label="Search exciting races" type="search" placeholder="Track, event, date..." oninput="__filterExciting()"></label>' +
    '<label><span>SEASON</span><select id="excitingSeason" aria-label="Filter exciting races by season" onchange="__filterExciting()"><option value="">ALL SEASONS</option>' +
    SEASONS.map(function (season) { return '<option value="' + esc(season.label) + '">' + esc(season.label) + '</option>'; }).join("") +
    '</select></label><div id="excitingStatus" class="ex-browser-status" aria-live="polite"></div></div>' +
    '<div class="ex-list" id="excitingList"></div><div class="empty" id="excitingEmpty" hidden>No ranked races match those filters.</div>' +
    '<div class="ex-more"><button class="btn ghost" id="excitingMore" onclick="__moreExciting()">LOAD 25 MORE RACES</button><small>The complete ranking remains available in batches; filters never change a race&rsquo;s baseline rank.</small></div></div></div>';
  $app.innerHTML = html;
  renderExcitingRows();
}

/* ---------------------------------------------------------- HIGHLIGHT REELS */
function highlightCard(r) {
  var reel = highlightOf(r.id);
  if (!reel) return "";
  return '<a class="highlight-card" href="#/highlights/' + reel.eventId + '" data-highlight-search="' +
    esc([reel.title, reel.date, reel.season, reel.track, reel.winner].filter(Boolean).join(" ").toLowerCase()) +
    '" aria-label="Open ' + esc(reel.title) + ' highlight reel"><div class="highlight-thumb"><img loading="lazy" src="' +
    esc(r.thumb || ("https://i.ytimg.com/vi/" + r.id + "/hqdefault.jpg")) + '" alt="Broadcast thumbnail for ' +
    esc(reel.title) + '"><span>FAST ' + fmtT((reel.fastRecap || {}).editDurationSeconds) + ' / FULL ' + fmtT(reel.editDurationSeconds) + '</span></div><div class="highlight-copy"><small>' +
    esc(reel.season || "VRL") + (reel.date ? ' · ' + fmtDate(reel.date) : '') + '</small><h3>' + esc(reel.title) +
    '</h3><p>' + reel.cutCount + ' exact cuts · ' + (reel.coverage.cautionCallsCovered || 0) + ' caution windows · ' + reel.sourceCount + ' official ' +
    (reel.sourceCount === 1 ? 'source' : 'sources') + '</p>' +
    (reel.winner ? '<b>✓ ' + esc(reel.winner) + '</b>' : '<b class="pending">RESULT RECEIPT PENDING</b>') +
    '</div></a>';
}

function vHighlights() {
  var summary = HIGHLIGHT_REELS.summary || {};
  var method = HIGHLIGHT_REELS.methodology || {};
  var rows = R_NEWEST.filter(function (race) { return !!highlightOf(race.id); });
  var html = '<div class="highlight-page"><section class="highlight-hero"><div class="wrap"><div class="kicker">FULL FIRST LAP · FULL FINAL LAP · FULL INCIDENT CONTEXT</div>' +
    '<h1>VRL <span>HIGHLIGHT REELS</span></h1><p>Every race now has two exact-source cuts: a five-to-ten-minute Fast Recap and the full Coverage Reel with complete first lap, final lap, cautions, wrecks, and replay sequences.</p>' +
    '<div class="highlight-scoreboard"><div><b>' + (summary.reelCount || 0) + '</b><span>RACE REELS</span></div><div><b>' +
    (summary.cautionCallsCovered || 0).toLocaleString() + '</b><span>CAUTIONS COVERED</span></div><div><b>' +
    (summary.cutCount || 0).toLocaleString() + '</b><span>EXACT CUTS</span></div><div><b>' + fmtT(summary.fastAverageDurationSeconds || 0) +
    '</b><span>FAST AVERAGE</span></div><div><b>' + fmtT(summary.averageDurationSeconds || 0) +
    '</b><span>COVERAGE AVERAGE</span></div></div></div></section>' +
    '<div class="wrap"><div class="highlight-method"><b>TWO-MODE EDIT CONTRACT</b><p>' + esc(method.fastSelection || "") + '</p><p>' + esc(method.selection || "") + '</p><small>' +
    esc(method.reviewBoundary || "") + '</small></div><div class="bigsearch highlight-search"><span class="ic">SEARCH</span>' +
    '<input id="highlightQ" aria-label="Search highlight reels" placeholder="Track, driver, season, date…"></div>' +
    '<div class="highlight-browser-status" id="highlightStatus" aria-live="polite"></div>' +
    '<div class="highlight-grid" id="highlightGrid"></div>' +
    '<div class="empty" id="highlightEmpty" hidden>No highlight reels match that search.</div>' +
    '<div class="highlight-more"><button class="btn ghost" id="highlightMore" type="button">LOAD 25 MORE REELS</button></div></div></div>';
  $app.innerHTML = html;
  var input = document.getElementById("highlightQ"), limit = 25;
  function renderHighlights() {
    var query = input.value.trim().toLowerCase();
    var matches = rows.filter(function (race) {
      var reel = highlightOf(race.id);
      var search = [reel.title, reel.date, reel.season, reel.track, reel.winner].filter(Boolean).join(" ").toLowerCase();
      return !query || search.indexOf(query) >= 0;
    });
    var shown = matches.slice(0, limit);
    document.getElementById("highlightGrid").innerHTML = shown.map(highlightCard).join("");
    document.getElementById("highlightEmpty").hidden = matches.length !== 0;
    document.getElementById("highlightStatus").textContent = matches.length
      ? "SHOWING " + shown.length + " OF " + matches.length + " MATCHING REELS / " + rows.length + " RACES"
      : "NO MATCHING REELS / " + rows.length + " RACES";
    var more = document.getElementById("highlightMore");
    more.hidden = shown.length >= matches.length;
    more.textContent = "LOAD " + Math.min(25, matches.length - shown.length) + " MORE REELS";
  }
  input.addEventListener("input", function () {
    limit = 25;
    renderHighlights();
  });
  document.getElementById("highlightMore").addEventListener("click", function () { limit += 25; renderHighlights(); });
  renderHighlights();
}

/* -------------------------------------------------------- WATCH DESK */
var WATCH_MOODS = [
  { id: "latest", label: "LATEST TAPE", title: "I want the newest race", dek: "Start with the most recent completed Wednesday race.", accent: "NEW" },
  { id: "all-gas", label: "ALL GAS", title: "Give me the archive classic", dek: "Highest complete-race Excitement Index with receipts.", accent: "100" },
  { id: "photo-finish", label: "AT THE LINE", title: "I want finish drama", dek: "Finish pressure, reversals, and a supported result.", component: "Finish drama", accent: "0.039" },
  { id: "side-by-side", label: "DOOR TO DOOR", title: "I want a battle", dek: "Sustained lead pressure and authored battle evidence.", component: "Lead battle", accent: "2x2" },
  { id: "restart", label: "ONE MORE SHOT", title: "I want restart pressure", dek: "Late compression, overtime, and position swings.", component: "Restart stakes", accent: "GWC" },
  { id: "strategy", label: "PIT WALL", title: "I want strategy", dek: "Fuel, tires, timing, and uncertainty instead of pure chaos.", component: "Strategy uncertainty", accent: "FUEL" },
  { id: "booth", label: "MIC PEGGED", title: "I want the booth on fire", dek: "The strongest caption-derived broadcaster-energy signal.", component: "Booth energy", accent: "!!!" },
  { id: "chaos", label: "YELLOW FEVER", title: "I want controlled chaos", dek: "Disruption is capped so wreck count cannot choose the race alone.", component: "Race disruption", accent: "CAUTION" },
  { id: "stakes", label: "EVERYTHING ON IT", title: "I want the big story", dek: "Championship, comeback, underdog, and late-race stakes.", component: "Story stakes", accent: "TITLE" }
];
function watchMood(id) {
  return WATCH_MOODS.filter(function (mood) { return mood.id === id; })[0] || WATCH_MOODS[0];
}
function watchEligibleRaces() {
  return CANONICAL_RACES.filter(function (race) {
    return !!highlightOf(race.id) && !!excitementOf(race.id) && !!verifiedEventWinner(race);
  });
}
function watchRanked(mood) {
  var races = watchEligibleRaces();
  if (mood.id === "latest") {
    return races.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  }
  return races.sort(function (a, b) {
    var ax = excitementOf(a.id), bx = excitementOf(b.id);
    if (mood.component) {
      var componentGap = ((bx.components || {})[mood.component] || 0) - ((ax.components || {})[mood.component] || 0);
      if (componentGap) return componentGap;
    }
    return ax.rank - bx.rank || (b.ts || 0) - (a.ts || 0);
  });
}
function watchSelectionHtml(race, mood, randomized) {
  if (!race) return '<div class="empty">No receipt-backed watch pick is available.</div>';
  var eventId = race.eventId || race.id;
  var ex = excitementOf(eventId) || {};
  var reel = highlightOf(eventId) || {};
  var winner = verifiedEventWinner(race);
  var rundown = eventResultRundown(race);
  var component = mood.component ? ((ex.components || {})[mood.component] || 0) : ex.score;
  var componentLabel = mood.component || "Excitement Index";
  var coverage = reel.coverage || {};
  var recap = publicRaceRecap(race, DISTILLED[race.id] || {});
  return '<article class="watch-pick" id="watchPick"><div class="watch-pick-frame"><img src="' +
    esc(race.thumb || ("https://i.ytimg.com/vi/" + race.id + "/maxresdefault.jpg")) +
    '" alt="Official broadcast thumbnail for ' + esc(race.name || race.title) + '"><div class="watch-pick-score"><b>' +
    component + '</b><span>' + esc(componentLabel.toUpperCase()) + '</span></div></div><div class="watch-pick-copy"><div class="kicker">' +
    (randomized ? "RANDOMIZED FROM RECEIPT-BACKED A-CLASS RACES" : esc(mood.label) + " / EVIDENCE-LED PICK") +
    '</div><h2>' + esc(race.name || race.title) + '</h2><p class="watch-meta">' +
    [race.seasonLabel, race.track, fmtDate(race.date)].filter(Boolean).map(esc).join(" / ") +
    '</p><p>' + esc(recap.text || "Open the race file for the complete source-grounded story.") + '</p><div class="watch-proof">' +
    '<span><b>' + ex.score + '</b>EXCITEMENT / #'+ ex.rank + '</span><span><b>' +
    esc(winner ? winner.name : "UNKNOWN") + '</b>SUPPORTED WINNER</span><span><b>' +
    ((reel.fastRecap || {}).editDurationSeconds ? fmtT(reel.fastRecap.editDurationSeconds) : "—") +
    '</b>FAST RECAP</span><span><b>' + (coverage.cautionCallsCovered || 0) +
    '</b>CAUTIONS COVERED</span><span><b>' + (rundown ? (rundown.result.positionsCovered || []).length : 0) +
    '</b>RESULT POSITIONS</span></div><div class="watch-actions"><button class="btn hot" onclick="__playHighlight(\'' +
    eventId + '\',\'fast\')">&#9654; FAST RECAP</button><button class="btn" onclick="__playHighlight(\'' +
    eventId + '\')">&#9654; FULL COVERAGE</button><a class="btn ghost" href="#/race/' +
    eventId + '">OPEN RACE FILE</a><button class="btn ghost" onclick="__watchSurprise()">SURPRISE ME</button></div>' +
    '<small>WHY THIS PICK: ' + esc((ex.reasons || []).join(" / ")) +
    '. Component scores are archive-relative; disruption is capped and confidence adds no spectacle by itself.</small></div></article>';
}
window.__watchSurprise = function () {
  var pool = watchEligibleRaces().filter(function (race) {
    return (excitementOf(race.id) || {}).score >= 80;
  });
  if (!pool.length) return;
  var current = document.getElementById("watchPick");
  var currentId = current && current.getAttribute("data-event-id");
  var candidates = pool.filter(function (race) { return race.id !== currentId; });
  var race = candidates[Math.floor(Math.random() * candidates.length)] || pool[0];
  var host = document.getElementById("watchPickHost");
  if (host) host.innerHTML = watchSelectionHtml(race, watchMood("all-gas"), true).replace(
    'id="watchPick"',
    'id="watchPick" data-event-id="' + esc(race.id) + '"'
  );
};
function vWatch(moodId) {
  var mood = watchMood(moodId);
  var ranked = watchRanked(mood);
  var selected = ranked[0];
  var moodGrid = WATCH_MOODS.map(function (item) {
    return '<a class="' + (item.id === mood.id ? "on" : "") + '" href="#/watch/' + item.id +
      '"><span>' + esc(item.label) + '</span><b>' + esc(item.accent) + '</b><h3>' +
      esc(item.title) + '</h3><p>' + esc(item.dek) + '</p></a>';
  }).join("");
  $app.innerHTML = '<div class="watch-page"><section class="watch-hero"><div class="wrap"><div class="kicker">NO SCROLLING REQUIRED / PICK A MOOD</div>' +
    '<h1>WHAT SHOULD I <span>WATCH?</span></h1><p>A fan-first way into 219 race nights. Choose the kind of racing you want; the Watch Desk uses the public Excitement components, exact result receipts, and available highlight coverage to make the pick.</p>' +
    '<div class="watch-ledger"><div><b>' + watchEligibleRaces().length + '</b><span>RECEIPT-BACKED PICKS</span></div><div><b>' +
    WATCH_MOODS.length + '</b><span>WATCH MOODS</span></div><div><b>2</b><span>RECAP MODES</span></div><div><b>0</b><span>HIDDEN EDITOR VOTES</span></div></div></div></section>' +
    '<div class="wrap"><nav class="watch-moods" aria-label="Choose a racing mood">' + moodGrid +
    '</nav><section id="watchPickHost">' + watchSelectionHtml(selected, mood, false).replace(
      'id="watchPick"',
      'id="watchPick" data-event-id="' + esc((selected || {}).id || "") + '"'
    ) + '</section><div class="sec"><div class="sec-head"><h2>MORE THAT FIT THIS MOOD</h2><div class="ln"></div><span class="more">NEXT THREE BY THE SAME PUBLIC METRIC</span></div><div class="grid g3">' +
    ranked.slice(1, 4).map(raceCard).join("") + '</div></div><aside class="watch-boundary"><b>THE WATCH DESK DOES NOT INVENT TASTE</b><p>The category score chooses each recommendation. Surprise Me randomizes only among receipt-backed races scoring 80 or higher. Full standings, telemetry, and visual wreck identity remain unknown unless the official tape supports them.</p></aside></div></div>';
}

function vHighlight(id) {
  var sourceRace = byId(id), eventId = sourceRace ? (sourceRace.eventId || id) : id;
  var reel = (HIGHLIGHT_REELS.reels || {})[eventId], race = byId(eventId);
  if (!reel || !race) {
    $app.innerHTML = '<div class="wrap"><div class="empty">Highlight reel not found.</div></div>'; return;
  }
  var winner = verifiedEventWinner(race);
  var recapView = publicRaceRecap(race, { recap: reel.recap, winner: reel.winner });
  var html = '<div class="highlight-detail"><div class="wrap"><div class="crumb"><a href="#/highlights">HIGHLIGHT REELS</a> / ' +
    esc(reel.title).toUpperCase() + '</div><section class="highlight-detail-hero"><div><div class="kicker">THE RACE IN ' +
    fmtT(reel.editDurationSeconds) + ' · ' + reel.cutCount + ' EXACT CUTS</div><h1>' + esc(reel.title) +
    '</h1><p>' + esc(reel.season || "") + (reel.round ? ' · Round ' + reel.round : '') +
    (reel.track ? ' · ' + esc(reel.track) : '') + (reel.date ? ' · ' + fmtDate(reel.date) : '') + '</p></div>' +
    '<div class="highlight-detail-actions"><button class="btn" onclick="__playHighlight(\'' + eventId + '\',\'fast\')">▶ FAST ' +
    fmtT((reel.fastRecap || {}).editDurationSeconds) + ' RECAP</button><button class="btn ghost" onclick="__playHighlight(\'' + eventId + '\')">▶ FULL ' +
    fmtT(reel.editDurationSeconds) + ' COVERAGE</button><a class="btn ghost" href="#/race/' + eventId + '">FULL RACE FILE</a>' +
    '<button class="btn ghost" onclick="__shareCurrent(\'VRL Highlight Reel · ' + esc(reel.title).replace(/'/g, "\\'") + '\')">SHARE REEL</button></div></section>' +
    '<div class="highlight-truth"><div><b>' + reel.sourceCount + '</b><span>OFFICIAL SOURCE ' + (reel.sourceCount === 1 ? 'TAPE' : 'TAPES') +
    '</span></div><div><b>' + reel.cutCount + '</b><span>BOUNDED CUTS</span></div><div><b>' +
    (reel.coverage.cautionCallsCovered || 0) + '</b><span>CAUTION WINDOWS COVERED</span></div><div><b>1 + 1</b><span>FULL FIRST + FINAL LAPS</span></div><div><b>' +
    (winner ? esc(winner.name) : 'UNKNOWN') + '</b><span>' + (winner ? 'RECEIPT-SUPPORTED WINNER' : 'RESULT NOT PROMOTED') +
    '</span></div></div>' +
    (recapView.text ? '<div class="recap"><span class="k">' + (recapView.quarantined ? 'Tape story / result language quarantined' : 'The race in one read') + '</span>' + esc(recapView.text) + '</div>' : '') +
    '<div class="note"><b>Coverage contract:</b> the opening lap and final lap are always retained. Caution and incident cuts include the setup, impact, and bounded replay analysis when the official broadcast provides it. Transcript-confirmed cautions never authenticate an unmatched visual cause. Use each cut’s YouTube recovery link if embedding is blocked.</div>' +
    '<div class="sec"><div class="sec-head"><h2>The Cut List</h2><div class="ln"></div><span class="more">CHRONOLOGICAL · OFFICIAL TAPE ONLY</span></div><div class="highlight-cut-list">' +
    reel.cuts.map(function (cut) {
      var role = cut.sourceRole === "continuation" ? "CONTINUATION TAPE" : "PRIMARY TAPE";
      var coverageLabels = { "first-lap": "FULL FIRST LAP", "last-lap": "FULL FINAL LAP", caution: "CAUTION", incident: "INCIDENT", "replay-analysis": "REPLAY COVERAGE" };
      var tags = (cut.coverageTags || []).filter(function (tag) { return coverageLabels[tag]; }).map(function (tag) { return '<b>' + coverageLabels[tag] + '</b>'; }).join('');
      var merged = (cut.beats || []).length > 1 ? '<div class="highlight-beats">' + cut.beats.map(function (beat) {
        return '<span><b>' + fmtT(beat.t) + '</b>' + esc(beat.title) + '</span>';
      }).join("") + '</div>' : '';
      return '<article class="highlight-cut"><div class="highlight-cut-no">' + String(cut.index).padStart(2, "0") +
        '</div><div class="highlight-cut-main"><span>' + role + ' · ' + fmtT(cut.t) + '–' + fmtT(cut.end) + ' · ' +
        esc(String(cut.kind || "moment").toUpperCase()) + ' · H' + cut.heat + '</span><h3>' + esc(cut.title) +
        '</h3><div class="highlight-tags">' + tags + '</div><p>' + esc(cut.summary || "") + '</p>' + merged + '<small>Source <code>' + esc(cut.sourceId) +
        '</code> · ' + esc(cut.reviewStatus) + '</small></div><div class="highlight-cut-actions"><button onclick="__play(\'' +
        cut.sourceId + '\',' + cut.t + ')">▶ PLAY CUT</button><a target="_blank" rel="noopener noreferrer" href="' +
        esc(cut.exactUrl) + '">EXACT TIME ON YOUTUBE ↗</a></div></article>';
    }).join("") + '</div></div></div></div>';
  $app.innerHTML = html;
}

/* ------------------------------------------------------- VIGILANTE SCENE */
function sceneCoverCard(issue, featured) {
  return '<article class="scene-cover-card' + (featured ? " featured" : "") + '"><a href="#/scene/' +
    esc(issue.eventId) + '"><div class="scene-cover-image"><img loading="lazy" src="' +
    esc(issue.heroImage) + '" alt="Official broadcast thumbnail for ' + esc(issue.raceTitle) +
    '"><span>' + esc(issue.cover.coverLine) + '</span></div><div class="scene-cover-copy"><small>' +
    esc(issue.cover.edition) + ' / ' + esc(fmtDate(issue.date).toUpperCase()) + '</small><h2>' +
    esc(issue.cover.headline) + '</h2><p>' + esc(issue.cover.deck) + '</p><div><b>' +
    esc(issue.winner || "Winner receipt pending") + '</b><em>' + issue.wordCount.toLocaleString() +
    ' WORDS</em></div><strong>READ THE ISSUE &rarr;</strong></div></a></article>';
}

function vSceneIndex() {
  var issues = sceneIssues().sort(function (a, b) { return b.issueNumber - a.issueNumber; });
  var latest = issues[0];
  var html = '<div class="scene-newsstand"><div class="wrap"><div class="scene-index-mast"><span>THE WEEKLY RECORD OF THE WEDNESDAY NIGHT WARS</span>' +
    '<h1>VIGILANTE <i>SCENE</i></h1><div><b>SEASON 15</b><em>' + issues.length +
    ' ISSUES / UPDATED AFTER EVERY RACE</em></div></div>' +
    '<section class="scene-index-lede"><div><span>THE RACE PAPER, BUILT FROM THE TAPE</span><h2>THE STORY BEHIND EVERY CURRENT-SEASON CHECKERED FLAG</h2>' +
    '<p>One original issue after every completed race: a reported lead story, garage notebook, race-night voices, result receipts, and a direct route back to the official broadcast.</p></div>' +
    (latest ? '<a href="#/scene/' + esc(latest.eventId) + '"><img src="' + esc(latest.heroImage) +
      '" alt="Latest Vigilante Scene issue"><span>LATEST / ISSUE ' + String(latest.issueNumber).padStart(2, "0") +
      '</span><b>' + esc(latest.cover.headline) + '</b></a>' : '') + '</section>' +
    '<div class="scene-cover-grid">' + issues.map(function (issue, index) {
      return sceneCoverCard(issue, index === 0);
    }).join("") + '</div>' +
    '<section class="scene-method"><span>THE SCENE DESK CONTRACT</span><div><b>ORIGINAL REPORTING</b><p>Stories synthesize reviewed race moments; they do not copy another publication&rsquo;s design or prose.</p></div>' +
    '<div><b>RESULTS NEED RECEIPTS</b><p>A winner, podium, or title appears only when exact same-source language supports it.</p></div>' +
    '<div><b>PLAY THE PROOF</b><p>Every evidence button opens a bounded cut from an eligible official broadcast, with a YouTube recovery route.</p></div>' +
    '<div><b>UNCERTAINTY STAYS VISIBLE</b><p>Conflicting caution totals, missing standings, and unreviewed visual claims remain limitations.</p></div></section>' +
    '<a class="scene-to-flashback" href="#/flashback"><span>WHEN THE SEASON ENDS</span><b>THE WEEKLY PAPER BECOMES A VIGILANTE FLASHBACK YEARBOOK</b><em>OPEN 14 COMPLETE SEASON VOLUMES &rarr;</em></a>' +
    pressSponsorStrip() + '</div></div>';
  $app.innerHTML = html;
}

function scenePhotoDesk(issue) {
  var frames = issue.photoEssay || [];
  if (!frames.length) return "";
  return '<section class="scene-photo-desk"><header><div><span>THE BROADCAST CONTACT SHEET</span>' +
    '<h2>THREE FRAMES THAT EXPLAIN THE NIGHT</h2></div><p>Each still comes from the eligible official broadcast at the exact time shown. Captions describe visible graphics and action; league certification remains pending.</p></header>' +
    '<div class="scene-photo-grid">' + frames.map(function (frame, index) {
      return '<figure class="scene-photo-frame frame-' + (index + 1) + '"><a target="_blank" rel="noopener noreferrer" href="' +
        esc(frame.exactUrl) + '"><img loading="lazy" src="' + esc(frame.path) + '" alt="' +
        esc(frame.alt || frame.title) + '"><span>FRAME ' + String(index + 1).padStart(2, "0") +
        ' / ' + fmtT(frame.t) + ' / OFFICIAL TAPE</span></a><figcaption><div><b>' +
        esc(frame.title) + '</b><p>' + esc(frame.description) + '</p><small>' +
        esc(frame.visualBasis || "literal broadcast graphics visible") + ' / ' +
        esc(frame.identityStatus || "identity not asserted") +
        '</small></div><button onclick="__play(\'' + esc(frame.sourceId) + '\',' +
        Number(frame.t || 0) + ')">&#9654; PLAY FROM THIS FRAME</button></figcaption></figure>';
    }).join("") + '</div><footer><b>PHOTO DESK STATUS</b><span>MACHINE-VISUAL-REVIEWED</span>' +
    '<em>LEAGUE CERTIFICATION PENDING</em><small>Exact frame does not establish incident fault or causality.</small></footer></section>';
}

function vSceneIssue(value) {
  var issue = sceneIssueById(value);
  if (!issue) {
    $app.innerHTML = '<div class="wrap"><div class="empty">Vigilante Scene issue not found.</div></div>';
    return;
  }
  var issues = sceneIssues(), position = issues.map(function (item) { return item.id; }).indexOf(issue.id);
  var previous = position > 0 ? issues[position - 1] : null;
  var next = position < issues.length - 1 ? issues[position + 1] : null;
  var reel = highlightOf(issue.eventId);
  var heroFrame = (issue.photoEssay || [])[Number(issue.heroFrameIndex || 0)] || null;
  var html = '<div class="scene-paper"><div class="wrap"><div class="crumb scene-crumb"><a href="#/scene">VIGILANTE SCENE</a> / ISSUE ' +
    String(issue.issueNumber).padStart(2, "0") + '</div><header class="scene-masthead"><div><span>THE WEEKLY RECORD OF THE WEDNESDAY NIGHT WARS</span>' +
    '<h1>VIGILANTE <i>SCENE</i></h1></div><section><b>' + esc(fmtDate(issue.date).toUpperCase()) +
    '</b><em>' + esc(issue.cover.edition.toUpperCase()) + '</em><small>' + issue.wordCount.toLocaleString() +
    ' WORDS / ' + ((issue.leadStory.receipts || []).length + (issue.notebook || []).length + (issue.quotes || []).length) +
    ' FEATURED RECEIPTS</small></section></header>' +
    '<div class="scene-rule"><span>' + esc(issue.track || "TRACK UNCONFIRMED") + '</span><b>' +
    esc(issue.raceTitle) + '</b><em>RESULTS AND STORY CLAIMS ROUTED TO OFFICIAL TAPE</em></div>' +
    '<section class="scene-splash">' + (heroFrame ? '<a class="scene-splash-media" target="_blank" rel="noopener noreferrer" href="' +
    esc(heroFrame.exactUrl) + '"><img src="' + esc(issue.heroImage) + '" alt="' +
    esc(heroFrame.alt || ("Official broadcast frame for " + issue.raceTitle)) + '"><span>EXACT BROADCAST FRAME / ' +
    fmtT(heroFrame.t) + ' / OPEN SOURCE &#8599;</span></a>' : '<img src="' + esc(issue.heroImage) +
    '" alt="Official broadcast thumbnail for ' + esc(issue.raceTitle) + '">') +
    '<div><span>' + esc(issue.cover.coverLine) + '</span><h2>' +
    esc(issue.cover.headline) + '</h2><p>' + esc(issue.cover.deck) +
    '</p><small>Exact official-source broadcast still / visual labels are not league certification</small></div></section>' +
    '<div class="scene-story-grid"><main><div class="scene-byline"><span>RACE NIGHT LEAD</span><b>BY ' +
    esc(issue.leadStory.byline.toUpperCase()) + '</b></div><h2>' + esc(issue.leadStory.headline) + '</h2>' +
    issue.leadStory.paragraphs.map(function (paragraph, index) {
      return '<p' + (index === 0 ? ' class="dropcap"' : '') + '>' + esc(paragraph) + '</p>';
    }).join("") + '<div class="scene-play-grid"><h3>PLAY THE STORY</h3>' +
    issue.leadStory.receipts.map(function (receipt) {
      return pressReceiptButton(receipt, receipt.label);
    }).join("") + '</div></main><aside class="scene-scorecard"><span>RACE-DAY SCORECARD</span>' +
    '<h3>SUPPORTED PODIUM</h3><ol>' + (issue.podium || []).map(function (item) {
      return '<li><i>P' + item.position + '</i><b>' + esc(item.name) + '</b></li>';
    }).join("") + '</ol>' + (issue.winnerReceipt ? pressReceiptButton(issue.winnerReceipt, "Play the winner call", "press-receipt primary") : '') +
    '<div class="scene-facts">' + (issue.facts || []).map(function (fact) {
      var value = fact.unit === "seconds" ? fmtT(fact.value) : fact.value;
      return '<div><b>' + esc(value == null ? "N/A" : value) + '</b><span>' + esc(fact.label) +
        (fact.unit && fact.unit !== "seconds" ? ' / ' + esc(fact.unit) : '') + '</span></div>';
    }).join("") + '</div>' +
    (reel ? '<button class="scene-highlight-play" onclick="__playHighlight(\'' + esc(issue.eventId) +
      '\',\'fast\')"><span>&#9654;</span><b>WATCH THE FAST RECAP</b><small>' +
      fmtT((reel.fastRecap || {}).editDurationSeconds) + ' / exact-source edit</small></button>' : '') +
    '<a class="scene-file-link" href="#/race/' + esc(issue.eventId) + '">OPEN COMPLETE RACE FILE &rarr;</a></aside></div>' +
    scenePhotoDesk(issue) +
    '<section class="scene-notebook"><header><span>FROM THE GARAGE</span><h2>THE RACE NOTEBOOK</h2></header><div>' +
    (issue.notebook || []).map(function (note) {
      return '<article><h3>' + esc(note.headline) + '</h3><p>' + esc(note.body) + '</p>' +
        pressReceiptButton(note.receipt, "Play this notebook item") + '</article>';
    }).join("") + '</div></section>' +
    '<section class="scene-voices"><header><span>THE NIGHT IN THEIR WORDS</span><h2>VOICES FROM THE TAPE</h2></header><div>' +
    (issue.quotes || []).map(function (item) {
      return '<blockquote><p>&ldquo;' + esc(item.quote) + '&rdquo;</p><cite>' + esc(item.context) +
        '</cite>' + pressReceiptButton(item.receipt, "Hear the full context") + '</blockquote>';
    }).join("") + '</div></section>' +
    '<section class="scene-result-read"><div><span>CLOSING LEDGER</span><h2>THE RESULT READ, UNABRIDGED</h2><p>The bounded closing rundown is playback evidence. Lower-field names are not promoted into statistics until independently position-bound.</p></div>' +
    pressReceiptButton(issue.resultRundownReceipt, "Play the closing result rundown", "press-receipt primary") + '</section>' +
    '<section class="scene-limits"><span>EDITOR&rsquo;S NOTE / WHAT THE TAPE DOES NOT SETTLE</span><ul>' +
    (issue.limitations || []).map(function (item) { return '<li>' + esc(item) + '</li>'; }).join("") +
    '</ul></section>' + pressSponsorStrip() +
    '<nav class="press-pagination">' + (previous ? '<a href="#/scene/' + esc(previous.eventId) +
      '"><span>&larr; PREVIOUS ISSUE</span><b>' + esc(previous.cover.headline) + '</b></a>' : '<i></i>') +
    (next ? '<a href="#/scene/' + esc(next.eventId) + '"><span>NEXT ISSUE &rarr;</span><b>' +
      esc(next.cover.headline) + '</b></a>' : '<a href="#/scene"><span>BACK TO</span><b>THE NEWSSTAND</b></a>') +
    '</nav></div></div>';
  $app.innerHTML = html;
}

/* --------------------------------------------------- VIGILANTE FLASHBACK */
window.__pressJump = function (id) {
  var target = document.getElementById(id);
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
};

function flashbackVolumeCard(annual) {
  var champions = (annual.championships || []).map(function (item) {
    return item.championName;
  }).join(" / ");
  return '<article class="flashback-volume"><a href="#/flashback/' + annual.seasonNumber +
    '"><div class="flashback-spine"><span>VIGILANTE FLASHBACK</span><b>' + annual.seasonNumber +
    '</b><em>' + esc(annual.dateRange.start.slice(0, 4)) + '</em></div><div class="flashback-volume-copy"><img loading="lazy" src="' +
    esc(annual.heroImage) + '" alt="Official race thumbnail representing ' + esc(annual.seasonLabel) +
    '"><section><span>THE COMPLETE SEASON STORY</span><h2>SEASON ' + annual.seasonNumber +
    '</h2><p>' + esc(annual.subtitle) + '</p><div><b>' + annual.raceCount + ' RACES</b><b>' +
    annual.supportedWinnerCount + ' SUPPORTED WINNERS</b><b>' + annual.wordCount.toLocaleString() +
    ' WORDS</b></div><small>CHAMPION LEDGER / ' + esc(champions) +
    '</small><strong>OPEN THE VOLUME &rarr;</strong></section></div></a></article>';
}

function vFlashbackIndex() {
  var annuals = flashbackAnnuals().sort(function (a, b) { return b.seasonNumber - a.seasonNumber; });
  var html = '<div class="flashback-library"><div class="wrap"><header class="flashback-library-head"><img src="' +
    esc((SHOW.brand || {}).seriesLogo || "") + '" alt="Vigilante Racing"><div><span>THE COMPLETE YEARS OF THE WEDNESDAY NIGHT WARS</span>' +
    '<h1>VIGILANTE <i>FLASHBACK</i></h1><p>Fourteen long-form season annuals: championship receipts, the races that defined the year, transparent archive accolades, voices from the booth, and a complete race ledger.</p></div></header>' +
    '<section class="flashback-library-stats"><div><b>' + annuals.length + '</b><span>COMPLETE SEASONS</span></div><div><b>' +
    annuals.reduce(function (sum, item) { return sum + item.raceCount; }, 0) +
    '</b><span>CANONICAL RACE FILES</span></div><div><b>' +
    Math.round((VIGILANTE_PUBLICATIONS.summary.flashbackWordCount || 0) / 1000) +
    'K</b><span>WORDS OF SEASON HISTORY</span></div><div><b>' +
    (VIGILANTE_PUBLICATIONS.summary.receiptCount || 0) + '</b><span>PRESS RECEIPT ROUTES</span></div></section>' +
    '<div class="flashback-shelf">' + annuals.map(flashbackVolumeCard).join("") + '</div>' +
    '<section class="flashback-contract"><span>HOW TO READ A FLASHBACK</span><h2>A YEARBOOK WITH A PAPER TRAIL</h2><div>' +
    '<p><b>CHAMPIONS ARE REVIEWED.</b> A title appears only when the official tape names it. A finale winner is never silently converted into a champion.</p>' +
    '<p><b>ACCOLADES ARE EDITORIAL.</b> Every honor discloses its metric and remains separate from official VRL awards or points.</p>' +
    '<p><b>UNKNOWN REMAINS USEFUL.</b> Missing results and uncertain visual claims stay visible instead of being filled with a plausible guess.</p></div></section>' +
    '<a class="flashback-to-scene" href="#/scene"><span>THE CURRENT SEASON IS STILL BEING WRITTEN</span><b>READ SEASON 15 RACE BY RACE IN VIGILANTE SCENE</b><em>OPEN THE NEWSSTAND &rarr;</em></a>' +
    pressSponsorStrip() + '</div></div>';
  $app.innerHTML = html;
}

function vFlashback(value) {
  var annual = flashbackForSeason(value);
  if (!annual) {
    $app.innerHTML = '<div class="wrap"><div class="empty">Vigilante Flashback volume not found.</div></div>';
    return;
  }
  var annuals = flashbackAnnuals(), position = annuals.map(function (item) { return item.id; }).indexOf(annual.id);
  var previous = position > 0 ? annuals[position - 1] : null;
  var next = position < annuals.length - 1 ? annuals[position + 1] : null;
  var html = '<div class="flashback-book"><div class="wrap"><div class="crumb flashback-crumb"><a href="#/flashback">VIGILANTE FLASHBACK</a> / SEASON ' +
    annual.seasonNumber + '</div><header class="flashback-cover"><div class="flashback-cover-mark"><span>VIGILANTE</span><b>FLASHBACK</b><em>SEASON</em><i>' +
    annual.seasonNumber + '</i></div><div class="flashback-cover-image"><img src="' + esc(annual.heroImage) +
    '" alt="Official race thumbnail representing ' + esc(annual.seasonLabel) + '"><span>OFFICIAL-SOURCE ARCHIVE IMAGE / NOT A DRIVER IDENTIFICATION</span></div>' +
    '<div class="flashback-cover-copy"><span>THE COMPLETE YEAR IN REVIEW</span><h1>' + esc(annual.title) +
    '</h1><p>' + esc(annual.subtitle) + '</p><div><b>' + annual.raceCount + ' RACE FILES</b><b>' +
    annual.supportedWinnerCount + ' SUPPORTED P1 RECEIPTS</b><b>' + annual.wordCount.toLocaleString() +
    ' WORDS</b></div><small>' + esc(annual.dateRange.label) + '</small></div></header>' +
    '<section class="flashback-champions"><header><span>THE REVIEWED TITLE LEDGER</span><h2>CHAMPIONS OF ' +
    esc(annual.seasonLabel.toUpperCase()) + '</h2></header><div>' + (annual.championships || []).map(function (item) {
      return '<article><span>' + esc(item.seriesLabel.toUpperCase()) + '</span><h3>' + esc(item.championName) +
        '</h3><p>' + esc(item.basis) + '</p>' + pressReceiptButton(item.receipt, "Play the title receipt", "press-receipt gold") +
        ((item.limitations || []).length ? '<small>' + item.limitations.map(esc).join(" ") + '</small>' : '') + '</article>';
    }).join("") + '</div></section>' +
    '<nav class="flashback-contents"><span>IN THIS VOLUME</span>' + (annual.chapters || []).map(function (chapter) {
      return '<button onclick="__pressJump(\'flashback-chapter-' + chapter.number + '\')"><b>' +
        String(chapter.number).padStart(2, "0") + '</b><em>' + esc(chapter.headline) + '</em></button>';
    }).join("") + '<button onclick="__pressJump(\'flashback-ledger\')"><b>07</b><em>Complete race ledger</em></button></nav>' +
    '<main class="flashback-chapters">' + (annual.chapters || []).map(function (chapter) {
      return '<article id="flashback-chapter-' + chapter.number + '"><header><span>CHAPTER ' +
        String(chapter.number).padStart(2, "0") + ' / ' + esc(chapter.eyebrow.toUpperCase()) +
        '</span><h2>' + esc(chapter.headline) + '</h2></header><div class="flashback-prose">' +
        (chapter.paragraphs || []).map(function (paragraph, index) {
          return '<p' + (index === 0 ? ' class="dropcap"' : '') + '>' + esc(paragraph) + '</p>';
        }).join("") + '</div><div class="flashback-receipts">' + (chapter.receipts || []).map(function (receipt) {
          return pressReceiptButton(receipt, receipt.label);
        }).join("") + '</div></article>';
    }).join("") + '</main>' +
    '<section class="flashback-honors"><header><span>THE SCENE DESK HONORS</span><h2>ACCOLADES THE ARCHIVE CAN EXPLAIN</h2><p>Editorial archive honors, not official VRL awards. Metrics and receipts are disclosed on every card.</p></header><div>' +
    (annual.honors || []).map(function (honor) {
      return '<article><span>' + esc(honor.label.toUpperCase()) + '</span><h3>' + esc(honor.recipient) +
        '</h3>' + (honor.quote ? '<blockquote>&ldquo;' + esc(honor.quote) + '&rdquo;</blockquote>' : '') +
        '<div><b>' + esc(honor.value) + '</b><em>' + esc(honor.metric) + '</em></div><p>' +
        esc(honor.basis) + '</p>' + pressReceiptButton(honor.receipt, "Play the accolade evidence") +
        '<small>SCENE DESK / NON-OFFICIAL</small></article>';
    }).join("") + '</div></section>' +
    '<section class="flashback-moments"><header><span>THE MOMENTS THAT STAY</span><h2>DEFINING TAPE</h2></header><div>' +
    (annual.definingMoments || []).map(function (moment) {
      var race = byId(moment.raceId);
      return '<article><span>' + esc(String(moment.kind || "moment").toUpperCase()) + ' / HEAT ' +
        esc(moment.heat) + '</span><h3>' + esc(moment.title) + '</h3><p>' +
        esc(race ? (race.name || race.title) : moment.raceId) + '</p>' +
        pressReceiptButton(moment.receipt, "Play the defining moment") + '</article>';
    }).join("") + '</div></section>' +
    '<section class="flashback-capsules"><header><span>FIVE RACES THAT DEFINE THE YEAR</span><h2>THE SEASON FILMSTRIP</h2></header><div>' +
    (annual.raceCapsules || []).map(function (capsule, index) {
      return '<article><img loading="lazy" src="' + esc(capsule.image) + '" alt="Official broadcast thumbnail for ' +
        esc(capsule.raceTitle) + '"><div><span>FILE ' + String(index + 1).padStart(2, "0") + ' / ' +
        esc(fmtDate(capsule.date).toUpperCase()) + ' / ' + esc(capsule.track || "TRACK UNKNOWN") +
        '</span><h3>' + esc(capsule.raceTitle) + '</h3><p>' + esc(capsule.recap) +
        '</p><div class="flashback-capsule-actions">' + pressReceiptButton(capsule.receipt, "Play this race receipt") +
        '<a href="#/race/' + esc(capsule.eventId) + '">OPEN COMPLETE FILE &rarr;</a></div></div><b>' +
        esc(capsule.excitementScore) + '<small>EXCITEMENT</small></b></article>';
    }).join("") + '</div></section>' +
    '<section class="flashback-ledger" id="flashback-ledger"><header><span>THE COMPLETE SEASON REGISTER</span><h2>EVERY CANONICAL RACE FILE</h2></header><div class="flashback-ledger-head"><b>RD</b><b>DATE</b><b>RACE / TRACK</b><b>SUPPORTED WINNER</b><b>STATUS</b></div>' +
    (annual.completeRaceLedger || []).map(function (row) {
      return '<a href="#/race/' + esc(row.eventId) + '"><b>' + (row.round ? esc(row.round) : "&#9733;") +
        '</b><span>' + esc(fmtDate(row.date)) + '</span><span><strong>' + esc(row.raceTitle) +
        '</strong><small>' + esc(row.track || "Track not confirmed") + (row.special ? ' / ' + esc(row.special) : '') +
        '</small></span><span>' + esc(row.winner || "Not position-bound") + '</span><em>' +
        (row.winner ? "SUPPORTED P1" : "UNKNOWN PRESERVED") + '</em></a>';
    }).join("") + '</section>' +
    '<section class="flashback-limits"><span>ENDPAPERS / EDITORIAL BOUNDARIES</span><ul>' +
    (annual.limitations || []).map(function (item) { return '<li>' + esc(item) + '</li>'; }).join("") +
    '</ul></section>' + pressSponsorStrip() +
    '<nav class="press-pagination flashback-pagination">' + (previous ? '<a href="#/flashback/' +
      previous.seasonNumber + '"><span>&larr; PREVIOUS VOLUME</span><b>SEASON ' + previous.seasonNumber +
      '</b></a>' : '<a href="#/flashback"><span>BACK TO</span><b>THE LIBRARY</b></a>') +
    (next ? '<a href="#/flashback/' + next.seasonNumber + '"><span>NEXT VOLUME &rarr;</span><b>SEASON ' +
      next.seasonNumber + '</b></a>' : '<a href="#/scene"><span>CONTINUE INTO</span><b>THE CURRENT SCENE</b></a>') +
    '</nav></div></div>';
  $app.innerHTML = html;
}

/* ---------------------------------------------------------------- SEASONS */
function vSeasons() {
  var html = '<div class="wrap"><h1 class="page">Every season has a story</h1>' +
    '<p class="page-sub">Fifteen season files organize ' + RACES.length + " official source broadcasts covering " + CANONICAL_COUNT + " canonical events. Open any season for every race, its defining tape, championship receipts, and complete archive rail.</p>";
  (SHOW.eras || []).forEach(function (e) {
    var ss = SEASONS.filter(function (s) { return s.era === e.id; });
    if (!ss.length) return;
    html += '<div class="era-band"><h3>' + esc(e.name) + '</h3><p>' + esc(e.blurb) + '</p><span class="ch"><a href="' + e.channelUrl + '" target="_blank" rel="noopener">YouTube channel ↗</a></span></div>';
    html += '<div class="season-index-grid">';
    ss.forEach(function (s) {
      var story = SEASON_STORIES[s.label];
      var champion = CHAMPIONS[s.label];
      var annual = flashbackForSeason(s.label);
      var featured = ((story && story.topRaceIds) || []).map(byId).filter(Boolean).slice(0, 3);
      if (!featured.length) featured = s.races.slice(0, 3);
      var hero = featured[0] || s.races[0];
      var verified = s.races.map(verifiedOrdinaryEventWinner).filter(Boolean).length;
      var championName = champion && (champion.name || (((champion.outcomes || [])[0] || {}).championName));
      html += '<article class="season-index-card"><a class="season-index-hero" href="#/season/' + encodeURIComponent(s.label) + '">' +
        (hero ? '<img loading="lazy" src="' + esc(hero.thumb || ("https://i.ytimg.com/vi/" + hero.id + "/hqdefault.jpg")) + '" alt="Official broadcast thumbnail representing ' + esc(s.label) + '">' : '') +
        '<span>' + esc(s.label) + '</span></a><div class="season-index-copy"><div class="season-index-ledger"><b>' +
        s.races.length + '<small>RACES</small></b><b>' + verified + '<small>SUPPORTED WINNERS</small></b><b>' +
        featured.length + '<small>FEATURED FILES</small></b></div><h2>' + esc(s.label) + '</h2>' +
        (championName ? '<div class="season-index-champion">CHAMPION LEDGER &middot; ' + esc(championName) + '</div>' : '<div class="season-index-champion pending">CHAMPION NOT INFERRED</div>') +
        '<p>' + esc(story ? story.recap : "Open the season file for its complete surviving race history.") + '</p><div class="season-index-races">' +
        featured.map(function (race) { var ex = excitementOf(race.id) || {}; return '<a href="#/race/' + race.id + '"><b>#' + (ex.rank || "—") + '</b><span>' + esc(race.name || race.title) + '</span></a>'; }).join("") +
        '</div><div class="season-index-actions"><a class="btn ghost" href="#/season/' +
        encodeURIComponent(s.label) + '">OPEN FULL ' + esc(s.label.toUpperCase()) +
        ' FILE</a>' + (annual ? '<a class="btn" href="#/flashback/' +
        annual.seasonNumber + '">READ FLASHBACK</a>' :
        '<a class="btn" href="#/scene">READ CURRENT SCENE</a>') +
        '</div></div></article>';
    });
    html += '</div>';
  });
  html += "</div>";
  $app.innerHTML = html;
}

function seasonWarRoom(label, season, rules) {
  if (label !== "Season 15" || !rules) return "";
  var seasonEventIds = season.races.map(function (race) { return race.eventId || race.id; });
  var issues = sceneIssues().filter(function (issue) {
    return issue.seasonLabel === label && seasonEventIds.indexOf(issue.eventId) >= 0;
  }).sort(function (a, b) {
    return (a.round || a.issueNumber || 0) - (b.round || b.issueNumber || 0);
  });
  if (!issues.length) return "";
  var archivedRounds = issues.length;
  var remainingRegular = Math.max(0, rules.schedule.regularSeasonRaces - archivedRounds);
  var throughDate = issues[issues.length - 1].date;
  var progress = Math.min(100, Math.round((archivedRounds / rules.schedule.regularSeasonRaces) * 100));
  var ledger = issues.map(function (issue) {
    var cover = issue.cover || {};
    var winnerReceipt = issue.winnerReceipt || {};
    var round = issue.round || issue.issueNumber;
    return '<li class="season-war-round"><div class="season-war-rank"><span>ROUND</span><b>' +
      String(round).padStart(2, "0") + '</b><em>CHECKERED</em></div><a class="season-war-frame" href="#/scene/' +
      esc(issue.eventId) + '"><img loading="lazy" src="' + esc(issue.heroImage) +
      '" alt="Reviewed official-broadcast frame for ' + esc(issue.raceTitle) +
      '"><span>OPEN VIGILANTE SCENE ' + String(issue.issueNumber).padStart(2, "0") +
      ' &rarr;</span></a><div class="season-war-copy"><span>' + esc(fmtDate(issue.date).toUpperCase()) +
      ' / ' + esc(issue.track.toUpperCase()) + ' / COMPLETED ARCHIVE FILE</span><h3>' +
      esc(cover.coverLine || issue.raceTitle) + '</h3><p>' +
      esc(cover.deck || ((issue.winner || "The supported winner") + " closes the round.")) +
      '</p><div class="season-war-result"><small>SUPPORTED WINNER</small><b>' +
      esc((issue.winner || "Unknown").toUpperCase()) + '</b></div><div class="season-war-actions">' +
      (winnerReceipt.sourceId && Number.isFinite(winnerReceipt.t)
        ? '<button onclick="__play(\'' + esc(winnerReceipt.sourceId) + '\',' + winnerReceipt.t +
          ')">&#9654; PLAY WIN RECEIPT / ' + fmtT(winnerReceipt.t) + '</button>'
        : '') +
      '<a href="#/race/' + esc(issue.eventId) + '">RACE FILE &rarr;</a></div></div></li>';
  }).join("");
  return '<section class="season-war-room" aria-labelledby="seasonWarRoomTitle"><header><div><span>RACE CONTROL / ARCHIVE THROUGH ' +
    esc(fmtDate(throughDate).toUpperCase()) + '</span><h2 id="seasonWarRoomTitle">THE ROAD TO THE CHASE</h2></div>' +
    '<p><b>Coverage board, not a live points table.</b> Completed rounds come from published race files. Remaining counts come only from the league-owner-supplied Season 15 format; no standings, penalties, drop selections, or playoff positions are inferred.</p></header>' +
    '<div class="season-war-tower" aria-label="Season 15 race format coverage"><div class="active"><b>' +
    archivedRounds + '</b><span>ROUNDS<br>ARCHIVED</span></div><div><b>' + remainingRegular +
    '</b><span>REGULAR ROUNDS<br>REMAINING</span></div><div><b>' + rules.schedule.chaseRaces +
    '</b><span>CHASE<br>RACES</span></div><div><b>' + rules.drops.count +
    '</b><span>DROP WEEKS<br>R1&ndash;R12</span></div></div><div class="season-war-cut"><div><span>REGULAR-SEASON ARCHIVE PROGRESS</span><b>' +
    archivedRounds + ' / ' + rules.schedule.regularSeasonRaces + ' COMPLETED ROUNDS</b></div><div class="season-war-gauge" role="img" aria-label="' +
    archivedRounds + ' of ' + rules.schedule.regularSeasonRaces +
    ' regular-season rounds archived"><i style="width:' + progress + '%"></i></div><em>NO STANDINGS INFERRED</em></div>' +
    '<ol class="season-war-ledger">' + ledger + '</ol><footer><b>RACE-CONTROL BOUNDARY</b><span>The pylon advances only when a canonical Wednesday event has a published Scene issue and race file. Broadcast-frame images are exact-source candidates; they are not automated truck-identification claims.</span></footer></section>';
}

function vSeason(label) {
  var s = null; SEASONS.forEach(function (x) { if (x.label === label) s = x; });
  if (!s) { $app.innerHTML = '<div class="wrap"><div class="empty">Season not found.</div></div>'; return; }
  var e = era(s.era);
  var winners = s.races.map(verifiedOrdinaryEventWinner).filter(Boolean);
  var ch = CHAMPIONS[label];
  var story = SEASON_STORIES[label];
  var annual = flashbackForSeason(label);
  var seasonFilm = seasonStorySequence(label);
  var resultReadCount = s.races.filter(function (race) { return !!eventResultRundown(race); }).length;
  var fastRecapSeconds = s.races.reduce(function (sum, race) {
    var reel = highlightOf(race.id);
    return sum + ((reel && reel.fastRecap && reel.fastRecap.editDurationSeconds) || 0);
  }, 0);
  var rules = SEASON_RULES[label] || null;
  var rulesHtml = rules ? '<section class="season-rulebook" aria-labelledby="seasonRulebookTitle"><header><span>RACE CONTROL / OWNER-SUPPLIED RULEBOOK</span><h2 id="seasonRulebookTitle">' +
    esc(label.toUpperCase()) + ' COMPETITION FORMAT</h2><p>Published as league-owner guidance, separate from inferred broadcast facts and from the official results ledger.</p></header><div class="season-rulebook-tower"><div><b>' +
    rules.schedule.totalWeeks + '</b><span>WEEK SEASON</span></div><div><b>' +
    rules.schedule.regularSeasonRaces + '</b><span>REGULAR</span></div><div><b>' +
    rules.schedule.chaseRaces + '</b><span>CHASE</span></div><div><b>' +
    rules.drops.count + '</b><span>DROP WEEKS / R1–R12</span></div></div><div class="season-rulebook-lines"><article><span>QUALIFICATION</span><b>' +
    esc(rules.qualification.label.toUpperCase()) + '</b><p>' + esc(rules.qualification.context) +
    '</p></article>' + rules.bonuses.map(function (bonus) {
      return '<article><span>BONUS</span><b>+' + bonus.points + ' / ' + esc(bonus.label.toUpperCase()) +
        '</b><p>' + esc(bonus.condition) + '</p></article>';
    }).join("") + '</div><details><summary>RULEBOOK EVIDENCE BOUNDARY</summary><ul>' +
    rules.limitations.map(function (item) { return '<li>' + esc(item) + '</li>'; }).join("") +
    '</ul></details></section>' : "";
  var html = '<div class="wrap">' +
    '<div class="crumb"><a href="#/seasons">SEASONS</a> / ' + esc(label).toUpperCase() + "</div>" +
    '<h2 class="page">' + esc(label) + '</h2>' +
    '<p class="page-sub">' + s.races.length + " canonical events · Called by " + esc(e.name) +
    (winners.length ? " · " + winners.length + " receipt-verified winners" : "") + "</p>" +
    rulesHtml +
    seasonWarRoom(label, s, rules) +
    (annual
      ? '<a class="season-publication-cta flashback" href="#/flashback/' +
        annual.seasonNumber + '"><span>THE COMPLETE YEAR IN REVIEW</span><b>OPEN VIGILANTE FLASHBACK SEASON ' +
        annual.seasonNumber + '</b><em>' + annual.wordCount.toLocaleString() +
        ' WORDS / CHAMPIONSHIP RECEIPTS / COMPLETE RACE LEDGER &rarr;</em></a>'
      : '<a class="season-publication-cta scene" href="#/scene"><span>THE ACTIVE SEASON, ISSUE BY ISSUE</span><b>READ VIGILANTE SCENE</b><em>' +
        sceneIssues().length + ' RACE-DAY EDITIONS AND COUNTING &rarr;</em></a>') +
    (seasonFilm.length ? '<section class="season-film"><div class="season-film-copy"><span>SEASON STORY FILM / EXACT OFFICIAL TAPE</span><h2>WATCH ' +
      esc(label.toUpperCase()) + ' IN ' + seasonFilm.length + ' DEFINING CHAPTERS</h2><p>The season&rsquo;s pivotal finishes, strategy swings, wrecks, and reversals play in chronological order from bounded highlight cuts. No media is copied; every chapter returns to its official broadcast.</p><div><button class="btn" onclick="__playSeasonStory(\'' +
      encodeURIComponent(label) + '\')">&#9654; PLAY SEASON FILM / ' + fmtT(storyboardRuntime(seasonFilm)) +
      '</button><button class="btn ghost" onclick="__shareCurrent(\'VRL ' + esc(label).replace(/'/g, "\\'") +
      ' Season File\')">SHARE SEASON</button><button class="btn ghost season-print-file" onclick="__printWikiFile()">PRINT / PDF SEASON FILE</button></div></div><div class="season-film-ledger"><div><b>' + s.races.length +
      '</b><span>RACE FILES</span></div><div><b>' + winners.length + '</b><span>SUPPORTED WINNERS</span></div><div><b>' +
      resultReadCount + '</b><span>RESULT READS</span></div><div><b>' + fmtDur(fastRecapSeconds) +
      '</b><span>FAST-RECAP TAPE</span></div></div>' +
      storyFilmstripHtml(seasonFilm, { mode: "season" }) + '</section>' : '') +
    (story ? '<div class="recap season-story"><span class="k">Season recap</span>' + esc(story.recap) + '</div>' : '') +
    (ch ? '<div class="recap" style="border-left-color:var(--gold)"><span class="k" style="color:var(--gold)">Reviewed championship ledger</span>' +
      ch.outcomes.map(function (outcome) {
        var receipt = outcome.receipt || {};
        return '<div class="championship-receipt"><span style="font-family:var(--disp);font-size:26px;letter-spacing:1px">🏆 ' + esc(outcome.championName).toUpperCase() + '</span>' +
          '<b>' + esc(outcome.seriesLabel) + '</b><button class="btn" onclick="__play(\'' + outcome.sourceId + '\',' + receipt.t + ')">▶ PLAY TITLE RECEIPT</button>' +
          '<a href="#/race/' + outcome.sourceId + '/t/' + receipt.t + '">OPEN EXACT SOURCE →</a><small>' + esc(outcome.basis) +
          ((outcome.limitations || []).length ? ' Limits: ' + (outcome.limitations || []).map(esc).join(' ') : '') + '</small></div>';
      }).join('') + '</div>' : '<div class="recap"><span class="k">Championship status</span>Not adjudicated on reviewed official tape. No champion is inferred from a finale winner.</div>');
  if (story && story.topRaceIds && story.topRaceIds.length) {
    html += '<div class="sec"><div class="sec-head"><h2>Most exciting races this season</h2><div class="ln"></div><a href="#/exciting">How the index works →</a></div><div class="grid g3">' +
      story.topRaceIds.slice(0, 3).map(byId).filter(Boolean).map(raceCard).join("") + '</div></div>';
  }
  if (story && story.definingMoments && story.definingMoments.length) {
    html += '<div class="sec"><div class="sec-head"><h2>Defining moments</h2><div class="ln"></div></div>' +
      story.definingMoments.map(function (m) {
        var race = byId(m.raceId); if (!race) return "";
        return momentRow(race, { t: m.t, title: m.title, kind: m.kind, heat: m.heat }, true);
      }).join("") + '</div>';
  }
  html += '<div class="sec"><div class="sec-head"><h2>Every race</h2><div class="ln"></div></div><div class="grid g3">' + s.races.map(raceCard).join("") + "</div></div></div>";
  $app.innerHTML = html;
}

/* ------------------------------------------------------------------- RACE */
var RaceNight = (function () {
  var timer = null, fired = {};
  function stop() { if (timer) { clearInterval(timer); timer = null; } fired = {}; var b = document.getElementById("rnBtn"); if (b) b.classList.remove("live"); var t = document.getElementById("rnToasts"); if (t) t.innerHTML = ""; }
  function toggle(raceId) {
    if (timer) { stop(); return; }
    var mo = momentsOf(raceId); if (!mo.list.length) return;
    var b = document.getElementById("rnBtn"); if (b) b.classList.add("live");
    fired = {};
    timer = setInterval(function () {
      var t = Player.inlineTime();
      if (t == null) return;
      mo.list.forEach(function (m, i) {
        if (fired[i]) return;
        if (t >= m.t - 4 && t <= m.t + 14) {
          fired[i] = 1;
          toast(raceId, m);
        }
      });
    }, 1500);
  }
  function toast(raceId, m) {
    var host = document.getElementById("rnToasts");
    if (!host) { host = document.createElement("div"); host.id = "rnToasts"; document.body.appendChild(host); }
    var el = document.createElement("div");
    el.className = "rn-toast";
    el.innerHTML = '<span class="k">⚡ HAPPENING NOW · ' + fmtT(m.t) + "</span><b>" + esc(m.title || "") + "</b><span>" + esc(m.summary || "") + "</span>";
    el.onclick = function () { el.remove(); };
    host.appendChild(el);
    setTimeout(function () { el.remove(); }, 14000);
  }
  return { toggle: toggle, stop: stop };
})();
window.__rnToggle = function (id) { RaceNight.toggle(id); };

function vRace(id, startAt) {
  var r = byId(id);
  if (!r) { $app.innerHTML = '<div class="wrap"><div class="empty">Race not found.</div></div>'; return; }
  var d = DISTILLED[id] || {};
  var e = era(r.era);
  var ex = excitementOf(id);
  var gh = GHOST_TELEMETRY[id];
  var dossier = SOURCE_DOSSIERS[id] || null;
  var reel = highlightOf(id);
  var eventId = r.eventId || id;
  var sceneIssue = sceneIssueForEvent(eventId);
  var winnerResult = verifiedEventWinner(r);
  var resultRundown = eventResultRundown(r);
  var fullResultsBoard = fullResultsBoardFor(r);
  var verifiedPositions = [1, 2, 3].map(function (position) {
    var claim = verifiedEventPosition(r, position);
    return claim ? { position: position, claim: claim } : null;
  }).filter(Boolean);
  var storyboard = raceStoryboard(r, reel, resultRundown);
  var recapView = publicEventRecap(r);
  var receiptGroup = RECEIPT_MATRIX.filter(function (item) { return item.eventId === (r.eventId || id); })[0] || null;
  var raceJumpLinks = [
    ["race-watch", "WATCH"],
    reel ? ["race-highlights", "HIGHLIGHTS"] : null,
    recapView.text ? ["race-story", "STORY"] : null,
    (verifiedPositions.length || fullResultsBoard) ? ["race-results", "RESULTS"] : null,
    dossier ? ["race-source", "SOURCE"] : null
  ].filter(Boolean);
  var raceRundownHtml = '<nav class="race-rundown-bar" aria-label="Race file sections"><span>PIT WALL</span>' +
    raceJumpLinks.map(function (item, index) {
      return '<button type="button" onclick="var el=document.getElementById(\'' + item[0] +
        '\');if(el)el.scrollIntoView({behavior:\'smooth\',block:\'start\'})"><b>' +
        String(index + 1).padStart(2, "0") + '</b>' + item[1] + '</button>';
    }).join("") + '<button type="button" class="race-print-file" onclick="__printRaceFile()"' +
    ' aria-label="Print or save this race file as a PDF"><b>PDF</b>PRINT FILE</button></nav>';
  var html = '<div class="wrap race-hero">' +
    '<div class="crumb"><a href="#/seasons">SEASONS</a>' + (r.seasonLabel ? ' / <a href="#/season/' + encodeURIComponent(r.seasonLabel) + '">' + esc(r.seasonLabel).toUpperCase() + "</a>" : "") + " / " + esc(r.name || r.title).toUpperCase() + "</div>" +
    "<h1>" + esc(r.name || r.title) + "</h1>" +
    '<div class="race-meta">' +
    (r.round ? "<span>ROUND <b>" + r.round + "</b></span>" : "") +
    (r.special ? '<span style="color:var(--gold)">★ <b>' + esc(String(r.special).toUpperCase()) + "</b></span>" : "") +
    (r.track ? "<span>TRACK <b>" + esc(r.track) + "</b></span>" : "") +
    "<span>DATE <b>" + fmtDate(r.date) + "</b></span>" +
    "<span>TAPE <b>" + fmtDur(r.duration) + "</b></span>" +
    "<span>BOOTH <b>" + esc(e.name) + "</b></span>" +
    "</div>" +
    '<section class="race-control-stage" id="race-watch"><div class="race-control-screen">' +
    '<div class="player-shell"><div class="player-16x9"><div id="racePlayerHost"></div></div></div>' +
    '<div class="race-broadcast-ribbon"><span>ARCHIVE FEED / EXACT OFFICIAL SOURCE</span><b>' +
    esc(r.name || r.title) + '</b><em>' + esc((r.seasonLabel || "VRL").toUpperCase()) +
    (r.round ? ' / ROUND ' + r.round : '') + ' / ' + esc(fmtDate(r.date).toUpperCase()) +
    '</em></div>' +
    (sceneIssue ? '<a class="race-scene-cta" href="#/scene/' + esc(sceneIssue.eventId) +
      '"><span>VIGILANTE SCENE / ISSUE ' + String(sceneIssue.issueNumber).padStart(2, "0") +
      '</span><b>' + esc(sceneIssue.cover.headline) +
      '</b><em>READ THE RACE-DAY EDITION &rarr;</em></a>' : '') +
    '</div><section class="race-fact-strip" aria-label="Static reviewed race evidence tower">' +
    (winnerResult
      ? '<button class="race-fact winner" onclick="__playReceipt(\'' + winnerResult.sourceId + '\',' +
        winnerResult.receipt.t + ',' + winnerResult.receipt.end + ',\'P1 RESULT RECEIPT\')"><span>' +
        (winnerResult.countsAsOrdinaryEvent ? "SUPPORTED WINNER" : "QUALIFIER P1") +
        '</span><b>' + esc(winnerResult.name) + '</b><small>&#9654; PLAY EXACT PROOF</small></button>'
      : '<div class="race-fact unknown"><span>WINNER</span><b>NOT POSITION-BOUND</b><small>UNKNOWN IS PRESERVED</small></div>') +
    '<div class="race-fact"><span>SUPPORTED PODIUM</span><b>' +
    (verifiedPositions.length
      ? verifiedPositions.map(function (item) { return 'P' + item.position + ' ' + esc(item.claim.name); }).join(' / ')
      : 'NO POSITIONS PROMOTED') +
    '</b><small>' + verifiedPositions.length + ' OF 3 EXACT RECEIPTS</small></div>' +
    (reel
      ? '<button class="race-fact" onclick="__playHighlight(\'' + eventId + '\',\'fast\')"><span>FAST RECAP</span><b>' +
        fmtT((reel.fastRecap || {}).editDurationSeconds) + '</b><small>&#9654; ' +
        ((reel.fastRecap || {}).cutCount || 0) + ' CHAPTERS</small></button>'
      : '<div class="race-fact unknown"><span>FAST RECAP</span><b>NOT BUILT</b><small>FULL SOURCE REMAINS</small></div>') +
    (resultRundown
      ? '<button class="race-fact" onclick="__playReceipt(\'' + resultRundown.sourceId + '\',' +
        resultRundown.result.receipt.t + ',' + resultRundown.result.receipt.end +
        ',\'BROADCAST RESULTS READ\')"><span>RESULT RUNDOWN</span><b>' +
        (resultRundown.result.positionsCovered || []).length + ' POSITIONS</b><small>&#9654; ' +
        fmtT(resultRundown.result.receipt.end - resultRundown.result.receipt.t) + ' BOUNDED</small></button>'
      : '<div class="race-fact unknown"><span>RESULT RUNDOWN</span><b>NOT BOUNDED</b><small>SUPPORTED CLAIMS STILL SHOW BELOW</small></div>') +
    (ex
      ? '<a class="race-fact" href="#/exciting"><span>EXCITEMENT INDEX</span><b>' + ex.score +
        ' / 100</b><small>ARCHIVE RANK #' + ex.rank + '</small></a>'
      : '<div class="race-fact unknown"><span>EXCITEMENT INDEX</span><b>PENDING</b><small>NO SCORE INVENTED</small></div>') +
    '</section></section>';
  html += raceRundownHtml;

  if (reel) {
    html += '<section class="highlight-race-cta" id="race-highlights"><div><span>FAST ' + fmtT((reel.fastRecap || {}).editDurationSeconds) + ' / COVERAGE ' + fmtT(reel.editDurationSeconds) + '</span><h2>TWO WAYS TO RELIVE THE RACE</h2><p>Fast Recap hits the SportsCenter window. Full Coverage keeps every first lap, final lap, caution, wreck, and bounded replay sequence.</p></div>' +
      '<div><button class="btn" onclick="__playHighlight(\'' + eventId + '\',\'fast\')">▶ FAST RECAP</button><button class="btn ghost" onclick="__playHighlight(\'' + eventId + '\')">▶ FULL COVERAGE</button><a class="btn ghost" href="#/highlights/' + eventId + '">OPEN CUT LIST</a></div></section>';
  }

  if (ex) {
    html += '<div class="race-ex"><div class="race-ex-score"><b>' + ex.score + '</b><span>EXCITEMENT<br>INDEX</span><em>#' + ex.rank + ' OF ' + CANONICAL_COUNT + '</em></div>' +
      '<div class="race-ex-copy"><div class="kicker">' + ex.grade + ' CLASS · ' + esc(ex.status).toUpperCase() + ' EVIDENCE</div><h3>Why this race ranks here</h3><p>' + (ex.reasons || []).map(esc).join(' · ') + '</p>' + excitementBars(ex) + '</div>' +
      '<div class="race-ex-actions">' +
      (TIME_MACHINE.races[id] ? '<a class="btn" href="#/time-machine/' + id + '">ENTER TIME MACHINE</a>' : '') +
      '<a href="#/exciting">Full methodology →</a></div></div>';
  }

  var mo = momentsOf(id);
  if (mo.list.length) {
    html += '<div style="margin:-6px 0 14px"><span class="rn-toggle" id="rnBtn" onclick="__rnToggle(\'' + id + '\')"><span class="dot"></span> RACE NIGHT MODE — pop the moments live as you watch</span></div>';
  }

  if (gh && gh.events && gh.events.length) {
    html += '<div class="ghost-race"><div><span>GHOST TELEMETRY · BROADCAST RECONSTRUCTION</span><b>' + gh.events.length + ' EVIDENCE-BOUNDED STORY STATES</b><small>Not official iRacing telemetry—each state is inferred from curated tape evidence.</small></div>' +
      '<div class="ghost-race-line">' + gh.events.map(function (event) {
        return '<button class="k-' + esc(event.kind) + '" style="left:' + event.x + '%" title="' + esc(event.state + " · " + event.title) +
          '" aria-label="Play ' + esc(event.state + ": " + event.title) + '" onclick="__play(\'' + id + '\',' + event.t + ')"></button>';
      }).join("") + '</div>' +
      (TIME_MACHINE.races[id] ? '<a href="#/time-machine/' + id + '">OPEN FULL MACHINE →</a>' : '<em>PILOT VIEW</em>') + '</div>';
  }

  if (recapView.text) {
    html += '<div class="recap" id="race-story"><span class="k">' +
      (recapView.quarantined ? "Tape story · result language quarantined" :
        (recapView.multiSource ? "Complete race recap · all official tape parts" : "Race recap")) +
      "</span>" + recapView.parts.map(function (part) {
        return '<div class="recap-part"><b>' +
          (part.sourceRole === "continuation" ? "FINISH / CONTINUATION TAPE" : "PRIMARY TAPE") +
          '</b><p>' + esc(part.text) + '</p></div>';
      }).join("") + "</div>";
  }
  html += raceStoryboardHtml(r, storyboard);

  if (dossier) {
    var sourceLimits = dossier.sourceLimitations || [];
    html += '<div class="source-dossier" id="race-source"><div><span>OFFICIAL SOURCE DOSSIER</span><h3>' + esc(dossier.canonicalTitle) + '</h3>' +
      '<p>Source <code>' + esc(dossier.sourceId) + '</code> · canonical event <code>' + esc(dossier.eventId) + '</code> · ' + esc(dossier.sourceRole) +
      ' · result status ' + (winnerResult ? "exact-language receipt" : "unverified / unknown") + '</p>' +
      '<p><b>TRACK</b> ' + esc(dossier.track || "not established") + ' · <b>CONFIGURATION</b> ' + esc(dossier.configuration || "not established") +
      ' · <b>VEHICLE / CLASS</b> ' + esc(dossier.vehicleClass || "not established") + '</p></div>' +
      '<div class="source-proof"><b>' + (dossier.majorReceipts || []).length + '</b><span>bounded race receipts</span><b>' +
      (dossier.boothReceipts || []).length + '</b><span>booth receipts</span></div>' +
      ((receiptGroup && receiptGroup.sources.length > 1) ? '<div class="source-family"><b>THIS EVENT HAS ' + receiptGroup.sources.length + ' OFFICIAL SOURCE VIDEOS</b>' + receiptGroup.sources.map(function (source) {
        return '<a href="#/race/' + source.id + '">' + esc(source.role.toUpperCase()) + ' · ' + esc(source.title) + '</a>';
      }).join("") + '</div>' : '') +
      ((sourceLimits.length || (dossier.unknowns || []).length) ? '<details><summary>Limits and unknowns</summary><p>' +
        sourceLimits.concat((dossier.unknowns || []).map(function (value) { return "Unknown: " + value; })).map(esc).join(' ') + '</p></details>' : '') +
      '<small>Structural fingerprint ' + esc(dossier.structuralFingerprint) + ' detects drift only; it is not authentication or truth.</small></div>';
  }

  if (verifiedPositions.length) {
    html += '<div class="podium" id="race-results">' + verifiedPositions.map(function (item) {
      var claim = item.claim;
      var dr = driverForResultName(claim.name);
      var positionLabel = claim.countsAsOrdinaryEvent ? ('P' + item.position) : ('QUALIFIER P' + item.position);
      return '<div class="pod p' + item.position + '">' +
        (dr ? driverVisual(dr, "race-podium-visual") : "") +
        '<div class="pod-result-copy"><div class="pos">' + positionLabel + '</div><div class="nm"' +
        (dr ? ' onclick="location.hash=\'#/driver/' + dr.id + '\'"' : "") + ">" + esc(claim.name) +
        '</div><button class="m-play" title="' + esc(claim.receipt.quote || "Exact result receipt") + '" onclick="__play(\'' +
        claim.sourceId + '\',' + claim.receipt.t + ')">PROOF ' + fmtT(claim.receipt.t) + '</button></div></div>';
    }).join("") + "</div>";
    if (verifiedPositions.some(function (item) { return !item.claim.countsAsOrdinaryEvent; })) {
      html += '<div class="note"><b>Qualifier result:</b> this final or transfer result is preserved as part of VRL history, but it does not count as an ordinary race win or podium in driver statistics and rankings.</div>';
    }
  }
  if (resultRundown) {
    var rundownReceipt = resultRundown.result.receipt;
    var rundownIsProvisional = !!resultRundown.result.provisional;
    html += '<div class="source-dossier' + (rundownIsProvisional ? ' provisional-result-read' : '') + '"><div><span>' +
      (rundownIsProvisional ? 'PROVISIONAL RESULT READ' : 'BROADCAST RESULTS ON TAPE') +
      '</span><h3>HEAR THE BOOTH READ THE FINISHING ORDER</h3>' +
      '<p>' + esc(resultRundown.result.coverageLabel || "Closing results language detected") + '. Lower-field names remain transcript candidates until separately position-bound.</p></div>' +
      '<div class="source-proof"><b>' + fmtT(rundownReceipt.end - rundownReceipt.t) + '</b><span>bounded results segment</span>' +
      '<button class="btn" onclick="__playReceipt(\'' + resultRundown.sourceId + '\',' + rundownReceipt.t + ',' + rundownReceipt.end + ',\'' +
      (rundownIsProvisional ? 'PROVISIONAL RESULT READ' : 'RESULTS RUNDOWN') + '\')">▶ PLAY ' +
      (rundownIsProvisional ? 'PROVISIONAL READ' : 'RESULTS RUNDOWN') + ' · ' + fmtT(rundownReceipt.t) + '</button></div>' +
      (rundownIsProvisional ? '<small class="provisional-result-note">The booth called this read provisional. It is broadcast context, not final league certification.</small>' : '') +
      '</div>';
  }
  if (fullResultsBoard) {
    html += '<section class="race-full-results-pilot"' + (!verifiedPositions.length ? ' id="race-results"' : '') + '><div><span>FULL RESULTS BOARD PILOT</span><h3>THE BOOTH READ, POSITION BY POSITION</h3><p>' +
      fullResultsBoard.knownPositionCount + ' of ' + fullResultsBoard.fieldSize +
      ' positions are explicitly relationship-reviewed in exact same-source closing windows. Unknowns are left blank, and the entire board is quarantined from statistics.</p></div>' +
      fullResultsBoardHtml(fullResultsBoard) + '</section>';
  }
  if ((d.winner || (d.podium || []).length) && !winnerResult) {
    html += '<div class="note"><b>Result receipt pending:</b> a prior result claim exists in the distill, but this public race file does not promote it until position-specific language is bounded to the named driver on an eligible official source.</div>';
  }

  if (mo.list.length) {
    html += '<div class="sec"><div class="sec-head"><h2>' + (mo.auto ? "Moments — auto-detected off the tape" : "Moments — click to watch") + '</h2><div class="ln"></div></div>' +
      (mo.auto ? '<div class="note" style="margin-top:0">These were flagged by keyword radar (wreck calls, big-one alerts, finish calls) — the full archivist pass for this race hasn\'t run yet, but the timestamps still drop you right into the action.</div>' : "") +
      mo.list.map(function (m) { return momentRow(r, m, false); }).join("") + "</div>";
  }

  if (d.soundbytes && d.soundbytes.length) {
    html += '<div class="sec"><div class="sec-head"><h2>🎙️ Booth gold from this night</h2><div class="ln"></div><a href="#/jukebox">The Jukebox →</a></div>' +
      d.soundbytes.map(function (s) { return sbRow(r, s); }).join("") + "</div>";
  }

  if (r.desc) {
    html += '<div class="sec"><div class="sec-head"><h2>Broadcast notes</h2><div class="ln"></div></div>' +
      '<div class="card"><div class="sub" style="white-space:pre-wrap">' + esc(r.desc.slice(0, 2200)) + "</div></div></div>";
  }

  if (TR_INDEX.indexOf(id) >= 0) {
    html += '<div class="sec"><div class="sec-head"><h2>Commentary tape</h2><div class="ln"></div></div>' +
      '<div class="bigsearch" style="margin-bottom:12px"><span class="ic">🔎</span><input id="trQ" placeholder="Search this broadcast\'s commentary…"></div>' +
      '<div id="trBox"><div class="load-note">Loading commentary…</div></div></div>';
  }

  var seq = r.seasonLabel ? R_SORTED.filter(function (x) { return x.seasonLabel === r.seasonLabel; }) : R_SORTED;
  var pos = seq.indexOf(r);
  var prev = pos > 0 ? seq[pos - 1] : null, next = pos >= 0 && pos < seq.length - 1 ? seq[pos + 1] : null;
  html += '<div style="margin:26px 0;display:flex;gap:10px;flex-wrap:wrap">' +
    (prev ? '<a class="btn ghost" href="#/race/' + prev.id + '">← ' + esc(prev.name || prev.title).slice(0, 42) + "</a>" : "") +
    (next ? '<a class="btn ghost" href="#/race/' + next.id + '">' + esc(next.name || next.title).slice(0, 42) + " →</a>" : "") +
    '<button class="btn ghost" onclick="__shareEncoded(\'' + encArg(r.name || r.title) + '\')">SHARE THIS RACE</button>' +
    '<button class="btn ghost" onclick="__memoryOpen(\'' + id + '\')">LEAVE A MEMORY</button>' +
    '<a class="btn ghost" target="_blank" rel="noopener noreferrer" href="' + Player.youtubeUrl(id, +(startAt || 0)) + '">Watch exact time on YouTube ↗</a></div>' +
    '<div id="raceMemoryBox"></div>';
  html += "</div>";
  $app.innerHTML = html;

  var savedMemories = memories().filter(function (item) { return item.raceId === id; });
  var memoryBox = document.getElementById("raceMemoryBox");
  if (memoryBox && savedMemories.length) {
    memoryBox.innerHTML = '<div class="sec"><div class="sec-head"><h2>Community memory</h2><div class="ln"></div></div>' + memoryWallHtml(id) + '</div>';
  }
  Player.mountInline("racePlayerHost", id, +(startAt || 0), false);

  if (TR_INDEX.indexOf(id) >= 0) {
    loadTranscript(id).then(function (tr) {
      var box = document.getElementById("trBox");
      if (!box) return;
      if (!tr || !tr.length) { box.innerHTML = '<div class="load-note">No commentary captions survive for this broadcast.</div>'; return; }
      function renderTr(q) {
        var rows = [], shown = 0, cap = q ? 400 : 250;
        var rx = q ? new RegExp("(" + rxEsc(q) + ")", "ig") : null;
        for (var i = 0; i < tr.length; i++) {
          var seg = tr[i];
          if (q && seg[1].toLowerCase().indexOf(q.toLowerCase()) < 0) continue;
          var x = esc(seg[1]);
          if (rx) x = x.replace(rx, "<mark>$1</mark>");
          rows.push('<div class="tr-line"><span class="t" onclick="__play(\'' + id + "'," + seg[0] + ')">' + fmtT(seg[0]) + '</span><span class="x">' + x + "</span></div>");
          if (++shown >= cap) { rows.push('<div class="load-note">Showing first ' + cap + (q ? " matches" : " lines") + ".</div>"); break; }
        }
        box.innerHTML = rows.length ? rows.join("") : '<div class="load-note">No matches in this broadcast.</div>';
      }
      renderTr("");
      var inp = document.getElementById("trQ"), tm;
      inp.addEventListener("input", function () { clearTimeout(tm); tm = setTimeout(function () { renderTr(inp.value.trim()); }, 200); });
    });
  }
}

/* ------------------------------------------------- HALL OF VIGILANTES */
function vHall() {
  var enriched = DRIVERS.map(function (d) { return { d: d, races: raceCountOf(d), men: (mentionsOf(d.id) || {}).n || 0 }; });
  enriched.sort(function (a, b) { return b.races - a.races || b.men - a.men; });
  var tiers = [
    { key: "legend", name: "Outlaw Legends", star: "★★★★★", test: function (x) { return x.races >= 120; } },
    { key: "warrior", name: "Road Warriors", star: "★★★★", test: function (x) { return x.races >= 40; } },
    { key: "gun", name: "Hired Guns", star: "★★★", test: function (x) { return x.races >= 8; } },
    { key: "wonder", name: "One-Night Wonders", star: "★", test: function () { return true; } }
  ];
  var used = {};
  var html = '<div class="wrap">' +
    '<div class="hall-head"><div class="kicker">EVERY NAME THAT EVER CROSSED THE TAPE</div>' +
    "<h1>HALL OF <span>VIGILANTES</span></h1>" +
    '<p>If the booth ever said your name on a Wednesday night, you\'re in here — champions, journeymen, and the one-night wonders who showed up, sent it, and vanished. Click a poster to open the case file.</p>' +
    '<div class="bigsearch" style="margin:20px auto 0"><span class="ic">🔎</span><input id="hallQ" aria-label="Search drivers" placeholder="Find a vigilante…"></div></div>' +
    '<div id="hallBody"></div></div>';
  $app.innerHTML = html;

  function render(q) {
    q = (q || "").toLowerCase();
    var list = enriched.filter(function (x) {
      if (!q) return true;
      if (x.d.name.toLowerCase().indexOf(q) >= 0) return true;
      return (x.d.aka || []).some(function (a) { return a.toLowerCase().indexOf(q) >= 0; });
    });
    var out = "", usedL = {};
    tiers.forEach(function (t) {
      var rows = list.filter(function (x) { return !usedL[x.d.id] && t.test(x); });
      rows.forEach(function (x) { usedL[x.d.id] = 1; });
      if (!rows.length) return;
      out += '<div class="hall-tier"><div class="tier-bar"><h2>' + t.name + '</h2><span class="star">' + t.star + '</span><div class="ln"></div><span class="ct">' + rows.length + "</span></div>" +
        '<div class="grid g5">' + rows.map(function (x) { return wantedCard(x.d, t.key); }).join("") + "</div></div>";
    });
    document.getElementById("hallBody").innerHTML = out ||
      '<div class="empty">' + (DRIVERS.length ? "No vigilante matches that name." : "The Hall is being carved right now — a fleet of archivists is combing every broadcast for every name. Check back in a bit.") + "</div>";
  }
  render("");
  var inp = document.getElementById("hallQ"), tm;
  inp.addEventListener("input", function () { clearTimeout(tm); tm = setTimeout(function () { render(inp.value.trim()); }, 150); });
}

function vDriver(slug) {
  var d = driverById(slug);
  if (!d) { $app.innerHTML = '<div class="wrap"><div class="empty">Driver not found.</div></div>'; return; }
  var m = mentionsOf(slug);
  var span = careerSpan(d);
  var raceIds = {};
  (d.races || []).forEach(function (id) { raceIds[id] = 1; });
  Object.keys((m && m.races) || {}).forEach(function (id) { raceIds[id] = 1; });
  var raceList = Object.keys(raceIds).map(byId).filter(Boolean).sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  var tagged = [];
  RACES.forEach(function (r) {
    var di = DISTILLED[r.id]; if (!di) return;
    (di.moments || []).forEach(function (mm) { if ((mm.tags || []).indexOf(slug) >= 0) tagged.push([r, mm]); });
  });
  tagged.sort(function (a, b) { return momentScore(b[0], b[1]).score - momentScore(a[0], a[1]).score || (b[0].ts || 0) - (a[0].ts || 0); });
  var bestRaces = raceList.slice().filter(function (r) { return excitementOf(r.id); })
    .sort(function (a, b) { return excitementOf(a.id).rank - excitementOf(b.id).rank; });
  var boothHits = [];
  [["curse", BOOTH_LORE.curse || []], ["carnac", BOOTH_LORE.carnac || []], ["upside", BOOTH_LORE.upsideDown || []]].forEach(function (group) {
    group[1].forEach(function (item) {
      if ((item.drivers || []).indexOf(d.name) >= 0) boothHits.push({ category: group[0], item: item });
    });
  });

  // rivalries involving this driver
  var rivs = RIVALRIES.filter(function (rv) { return rv.a === slug || rv.b === slug; }).slice(0, 5);

  var html = '<div class="wrap">' +
    '<div class="crumb"><a href="#/hall">HALL OF VIGILANTES</a> / ' + esc(d.name).toUpperCase() + "</div>" +
    '<div class="driver-head"><div class="d-ava red">' + esc(initials(d.name)) + "</div>" +
    "<div><h1>" + esc(d.name) + "</h1>" +
    ((TITLES[d.name] || []).length ? '<div style="color:var(--gold);font-family:var(--disp);letter-spacing:1.5px;font-size:17px">👑 VRL CHAMPION — ' + TITLES[d.name].map(esc).join(" · ") + "</div>" : "") +
    ((d.reviewedAliases || []).length ? '<div class="aka">REVIEWED ALIASES · ' + d.reviewedAliases.map(esc).join(" · ") + "</div>" : "") +
    "</div></div>" +
    '<div class="service">' +
    '<div class="svc"><b>' + raceCountOf(d) + "</b><span>Broadcasts</span></div>" +
    '<div class="svc"><b>' + (m ? m.n : 0) + "</b><span>Booth mentions</span></div>" +
    '<div class="svc"><b>' + tagged.length + "</b><span>Logged moments</span></div>" +
    (span ? '<div class="svc"><b>' + span + "</b><span>Years active</span></div>" : "") +
    "</div>" +
    (d.bio ? '<div class="recap"><span class="k">Case file</span>' + esc(d.bio) + "</div>" : "");

  var dna = DRIVER_DNA[slug];
  if (dna) {
    html += '<div class="dna-card"><div class="dna-stamp">DRIVER DNA</div><div class="dna-title"><div><span>ARCHETYPE</span><h2>' +
      esc(dna.archetype) + '</h2></div><button class="btn ghost" onclick="__shareCurrent(\'' +
      esc(d.name).replace(/'/g, "\\'") + ' · ' + esc(dna.archetype).replace(/'/g, "\\'") +
      '\')">SHARE DNA</button></div><div class="dna-grid"><div class="dna-bars">' +
      (dna.traits || []).map(function (trait) {
        return '<div class="dna-trait"><span>' + esc(trait.name) + '</span><i><b style="width:' + trait.score + '%"></b></i><em>' + trait.score + '</em></div>';
      }).join("") +
      '</div><div class="dna-facts"><div><b>' + dna.wins + '</b><span>reviewed wins</span></div><div><b>' + dna.podiums +
      '</b><span>reviewed podium positions</span></div><div><b>' + esc(dna.topTrack || "Tape pending") + '</b><span>most-seen track</span></div><div><b>' +
      dna.evidenceCount + '</b><span>tagged evidence</span></div></div></div>' +
      '<p class="dna-note">A living profile derived from race appearances, tagged moments, reviewed result receipts, and booth gravity. Every trait changes as new Wednesday tape enters the archive.</p></div>';
  }

  if (rivs.length) {
    html += '<div class="sec"><div class="sec-head"><h2>Shared tape</h2><div class="ln"></div><a href="#/rivalries">Shared-Tape Wire →</a></div><div class="grid g2">' +
      rivs.map(function (rv) {
        var other = driverById(rv.a === slug ? rv.b : rv.a);
        if (!other) return "";
        return '<a class="riv-card" href="#/rivalry/' + rv.a + "/" + rv.b + '"><div class="vs">+</div><div class="names"><b>' + esc(other.name) + '</b><div class="ct">' + rv.n + " moments of shared commentary</div></div></a>";
      }).join("") + "</div></div>";
  }

  if (tagged.length) {
    html += '<div class="sec"><div class="sec-head"><h2>' + esc(d.name.split(" ")[0]) + "'s best moments</h2><div class=\"ln\"></div><span class=\"more\">RANKED BY MEMORABILITY · " + tagged.length + " LOGGED</span></div>" +
      tagged.map(function (p) { var ms = momentScore(p[0], p[1]); return momentRow(p[0], p[1], true, ms); }).join("") + "</div>";
  }

  if (boothHits.length) {
    html += '<div class="sec"><div class="sec-head"><h2>Booth lore</h2><div class="ln"></div><a href="#/booth-lore">' + boothHits.length + ' ARCHIVE HITS →</a></div>' +
      '<div class="booth-mini-grid">' + boothHits.slice(0, 8).map(function (hit) {
        var item = hit.item, r = byId(item.raceId);
        var label = hit.category === "curse" ? "ANNOUNCER'S CURSE" : hit.category === "carnac" ? "GREAT CARNAC" : "UPSIDE DOWN CANDIDATE";
        var action = hit.category === "upside"
          ? "__play('" + item.raceId + "'," + item.t + ")"
          : "__playSequence('" + item.raceId + "'," + item.setup.t + "," + item.setup.end + "," + item.payoff.t + "," + item.payoff.end + ")";
        return '<article class="booth-mini"><span>' + label + '</span><h3>' + esc(item.title) + '</h3><p>' + esc(r ? (r.name || r.title) : "") + '</p><button onclick="' + action + '">▶ PLAY THE TAPE</button></article>';
      }).join("") + '</div></div>';
  }

  if (bestRaces.length) {
    html += '<div class="sec"><div class="sec-head"><h2>' + (tagged.length ? "Most exciting race nights" : "Start with these race nights") + '</h2><div class="ln"></div><span class="more">EXCITEMENT INDEX</span></div>' +
      (!tagged.length ? '<div class="note">No hand-logged highlight is attached to this driver yet, so the tape radar is surfacing the most exciting broadcasts where the booth says their name.</div>' : '') +
      '<div class="grid g3">' + bestRaces.slice(0, 6).map(raceCard).join("") + '</div></div>';
  }

  html += '<div class="sec"><div class="sec-head"><h2>Heard in the booth</h2><div class="ln"></div></div>' +
    '<div class="load-note" id="menProg">Scanning the commentary tape for “' + esc(d.name) + '”…</div>' +
    '<div class="prog"><i id="menBar"></i></div><div id="menBox"></div></div>';

  if (raceList.length) {
    html += '<div class="sec"><div class="sec-head"><h2>Broadcast appearances</h2><div class="ln"></div><span class="more">' + raceList.length + " races</span></div>" +
      '<div class="grid g3">' + raceList.slice(0, 12).map(raceCard).join("") + "</div></div>";
  }
  html += "</div>";
  $app.innerHTML = html;

  var terms = [d.name].concat(d.aka || []);
  var last = d.name.split(/\s+/).pop();
  if (last && last.length >= 5 && terms.indexOf(last) < 0) terms.push(last);
  // prioritize scanning the races we KNOW they're in
  var priority = Object.keys((m && m.races) || {});
  deepScan(terms, {
    prog: "menBar", note: "menProg", box: "menBox", perRace: 4, max: 120, priority: priority,
    doneNote: function (hits, scanned) { return hits + " mentions surfaced across " + scanned + " broadcasts."; }
  });
}

/* --------------------------------------------------------------- MOMENTS */
function kindWeight(k) { return { finish: 22, wreck: 20, drama: 15, pass: 11, restart: 9, funny: 7, moment: 5 }[k || "moment"] || 5; }
var MEMORY_MARKERS = [
  [/photo finish|by inches|by a nose|thousandths|at the line|to the stripe/i, "razor-close finish evidence"],
  [/big one|massive wreck|huge wreck|airborne|upside down|barrel roll|flips?/i, "spectacular crash evidence"],
  [/championship|title fight|champion/i, "championship stakes"],
  [/last lap|final lap|white flag|overtime|green.?white.?checkered/i, "last-gasp stakes"],
  [/four wide|five wide|three wide for the lead/i, "maximum-width racing"],
  [/retaliat|payback|revenge|intentional/i, "feud or payback"],
  [/fuel|ran out|empty tank/i, "fuel-strategy twist"],
  [/unbelievable|are you kidding|booth loses|oh my goodness/i, "the booth erupts"]
];
function momentScore(r, m) {
  var score = (m.heat || 0) * 14 + kindWeight(m.kind);
  var reasons = [];
  if ((m.heat || 0) >= 5) reasons.push("maximum archivist heat");
  else if ((m.heat || 0) >= 4) reasons.push("high archivist heat");
  var text = (m.title || "") + " " + (m.summary || "");
  MEMORY_MARKERS.forEach(function (pair) {
    if (pair[0].test(text)) { score += 9; reasons.push(pair[1]); }
  });
  var sounds = (DISTILLED[r.id] || {}).soundbytes || [], bestGold = 0;
  sounds.forEach(function (s) { if (Math.abs((s.t || 0) - (m.t || 0)) <= 65) bestGold = Math.max(bestGold, s.gold || 0); });
  if (bestGold >= 4) { score += bestGold * 2; reasons.push("booth-gold call on the tape"); }
  var ex = excitementOf(r.id);
  if (ex) {
    score += ex.score * 0.10;
    if (ex.score >= 90) reasons.push("from an S-class race night");
  }
  if (m.kind === "finish" && r.duration && (m.t || 0) >= r.duration * 0.78) score += 7;
  if (!reasons.length) reasons.push("strong curated race moment");
  return { score: Math.round(score), reasons: reasons.slice(0, 4) };
}
function hot100() {
  return (HOT100.entries || []).map(function (entry) {
    var race = byId(entry.sourceId || entry.raceId); if (!race) return null;
    return [race, {
      t: entry.t, end: entry.end, title: entry.title, summary: entry.summary,
      kind: entry.kind, heat: entry.heat, tags: entry.driverIds || []
    }, {
      rank: entry.rank, score: entry.score, reasons: entry.why || [],
      components: entry.components || {}, baselineRank: entry.baselineRank,
      evidenceConfidence: entry.evidenceConfidence, creatorVotes: entry.creatorVotes,
      editorVotes: entry.editorVotes, diversityReason: entry.diversityReason,
      reviewStatus: entry.reviewStatus
    }];
  }).filter(Boolean).sort(function (a, b) { return a[2].rank - b[2].rank; });
}
function hotMomentCard(packet, index) {
  var r = packet[0], m = packet[1], meta = packet[2] || {};
  var rank = meta.rank || (index + 1);
  var confidence = Math.max(0, Math.min(100, Math.round((meta.evidenceConfidence || 0) * 100)));
  var kind = String(m.kind || "moment").toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  var thumb = r.thumb || ("https://i.ytimg.com/vi/" + r.id + "/hqdefault.jpg");
  return '<article class="hot-card ' + (rank <= 10 ? "top-ten " : "") + 'k-' + esc(kind) + '">' +
    '<div class="hot-card-visual"><img loading="lazy" src="' + esc(thumb) +
    '" alt="Official source thumbnail for ' + esc(r.name || r.title) + '; not moment-frame proof">' +
    '<span>OFFICIAL SOURCE THUMBNAIL / NOT MOMENT-FRAME PROOF</span>' +
    '<button onclick="__play(\'' + r.id + '\',' + (m.t || 0) + ')">&#9654; PLAY #' + rank + ' / ' +
    fmtT(m.t) + '</button></div><div class="hot-card-rank"><small>VRL HOT 100</small><b>#' + rank +
    '</b><em>' + esc(String(m.kind || "moment").toUpperCase()) + '</em></div>' +
    '<div class="hot-card-copy">' + momentRow(r, m, true, meta) + '</div>' +
    '<div class="hot-confidence" style="--hot-confidence:' + confidence + '%"><b>' + confidence +
    '%</b><span>EVIDENCE</span></div></article>';
}
function vMoments() {
  var all = allMoments();
  var method = HOT100.method || {}, targets = method.categoryTargets || {};
  var html = '<div class="wrap"><h1 class="page">🔥 The Hot 100</h1>' +
    '<p class="page-sub">One hundred unique, exact-source moments across the eligible VRL broadcast history. This is a memorable-moment countdown, not the Most Exciting Races list, a crash count, or a profanity chart.</p>' +
    '<div class="method-card"><b>HOW THE HOT 100 WORKS</b><span>' + esc(method.note || "Authored receipts are explainably ranked and remain reviewable.") + '</span><div class="method-weights">' +
    Object.keys(targets).map(function (kind) { return '<span><b>' + targets[kind] + '</b> ' + esc(kind) + '</span>'; }).join("") +
    '</div><small>Max ' + ((method.controls || {}).maxPerCanonicalEvent || 2) + ' per canonical event · all creator/editor votes remain literal zero until supplied · every entry exposes baseline rank, diversity reason, and evidence confidence.</small></div>';
  if (!all.length) {
    html += '<div class="note">The moment log is being built race by race — the archive fleet is working through all ' + RACES.length + ' broadcasts overnight. Check the race pages for full commentary search in the meantime.</div>';
  } else {
    var kinds = ["wreck", "pass", "restart", "finish", "drama"];
    html += '<div style="margin-bottom:14px">' +
      '<button type="button" class="pill on" data-k="hot100">🔥 Hot 100</button>' +
      '<button type="button" class="pill" data-k="funny">😂 Comedy Hour</button>' +
      '<button type="button" class="pill" data-k="all">Everything</button>' +
      kinds.map(function (k) { return '<button type="button" class="pill" data-k="' + k + '">' + k + "</button>"; }).join("") + "</div>";
    html += '<div class="mom-browser-status" id="momStatus" aria-live="polite"></div><div id="momBox"></div>' +
      '<div class="mom-more"><button class="btn ghost" id="momMore" type="button">LOAD 25 MORE MOMENTS</button></div>';
  }
  html += "</div>";
  $app.innerHTML = html;
  if (!all.length) return;
  var activeKind = "hot100", momentLimit = 25;
  function render(kind, keepLimit) {
    if (!keepLimit) momentLimit = 25;
    activeKind = kind;
    var rows, numbered = false;
    var withAuto = allMoments(true);
    if (kind === "hot100") { rows = hot100(); numbered = true; }
    else if (kind === "funny") {
      rows = all.filter(function (p) { return (p[1].kind || "") === "funny"; })
        .sort(function (a, b) { return (b[1].heat || 0) - (a[1].heat || 0); }).slice(0, 150);
    }
    else if (kind === "all") rows = withAuto.slice(0, 300);
    else rows = withAuto.filter(function (p) { return (p[1].kind || "moment") === kind; }).slice(0, 200);
    var shown = rows.slice(0, momentLimit);
    var momBox = document.getElementById("momBox");
    momBox.className = numbered ? "hot-grid" : "";
    momBox.innerHTML = shown.map(function (p, i) {
      return numbered ? hotMomentCard(p, i) : momentRow(p[0], p[1], true, null);
    }).join("") || '<div class="empty">None logged yet — the fleet is still working through the tape.</div>';
    document.getElementById("momStatus").textContent = rows.length
      ? "SHOWING " + shown.length + " OF " + rows.length + " " +
        (numbered ? "RANKED HOT 100 MOMENTS" : String(kind).toUpperCase() + " MOMENTS")
      : "NO MOMENTS IN THIS CATEGORY";
    var more = document.getElementById("momMore");
    more.hidden = shown.length >= rows.length;
    more.textContent = "LOAD " + Math.min(25, rows.length - shown.length) + " MORE MOMENTS";
  }
  render("hot100");
  document.getElementById("momMore").onclick = function () {
    momentLimit += 25;
    render(activeKind, true);
  };
  Array.prototype.forEach.call(document.querySelectorAll(".pill[data-k]"), function (p) {
    p.onclick = function () {
      Array.prototype.forEach.call(document.querySelectorAll(".pill[data-k]"), function (x) { x.classList.remove("on"); });
      p.classList.add("on"); render(p.getAttribute("data-k"), false);
    };
  });
}

/* --------------------------------------------------------------- JUKEBOX */
function allSoundbytes() {
  var out = [];
  R_ALL_NEWEST.forEach(function (r) {
    var d = DISTILLED[r.id]; if (!d) return;
    (d.soundbytes || []).forEach(function (s) { if (s.quote) out.push([r, s]); });
  });
  out.sort(function (a, b) { return (b[1].gold || 0) - (a[1].gold || 0); });
  return out;
}
function sbRow(r, s) {
  return '<div class="moment' + ((s.gold || 0) >= 5 ? " hot" : "") + '">' +
    '<button class="m-play" onclick="__play(\'' + r.id + "'," + Math.max(0, (s.t || 0) - 3) + ')">▶ ' + fmtT(s.t) + "</button>" +
    '<div class="m-body"><div class="m-race"><a href="#/race/' + r.id + '">' + esc(r.name || r.title) + "</a>" + (r.date ? " · " + fmtDate(r.date) : "") + "</div>" +
    '<div class="m-title" style="font-style:italic">“' + esc(s.quote) + "”</div>" +
    (s.context ? '<div class="m-sub">' + esc(s.context) + "</div>" : "") +
    "</div></div>";
}
function vJukebox() {
  var bytes = allSoundbytes();
  var html = '<div class="wrap"><h2 class="page">🎙️ The Soundbyte Jukebox</h2>' +
    '<p class="page-sub">The greatest lines ever said in the VRL booth — the calls, the catchphrases, the jokes that landed at 180 miles an hour. Hit ▶ and the tape plays the line itself.' + (bytes.length ? " " + bytes.length + " quotes on the box." : "") + "</p>";
  if (!bytes.length) {
    html += '<div class="note">The jukebox is being loaded tonight — the archive fleet is pulling the best booth lines out of every broadcast. First 45s land shortly.</div>';
  } else {
    html += '<div style="margin-bottom:16px"><button class="btn" onclick="__sbRandom()">🎲 DROP A QUARTER — RANDOM QUOTE</button></div>' +
      '<div id="sbBox">' + bytes.slice(0, 150).map(function (p) { return sbRow(p[0], p[1]); }).join("") + "</div>";
  }
  html += "</div>";
  $app.innerHTML = html;
}
window.__sbRandom = function () {
  var bytes = allSoundbytes();
  if (!bytes.length) return;
  var p = bytes[Math.floor(Math.random() * bytes.length)];
  Player.play(p[0].id, Math.max(0, (p[1].t || 0) - 3));
};

/* ------------------------------------------------------------ AFTER DARK */
var AfterDark = (function () {
  var live = false, timer = null, queue = [], idx = 0, filterEra = "all";
  function pool() {
    var moms = [];
    RACES.forEach(function (r) {
      if (filterEra !== "all" && r.era !== filterEra) return;
      momentsOf(r.id).list.forEach(function (m) { if ((m.heat || 0) >= 3) moms.push([r, m]); });
    });
    if (moms.length >= 10) return moms;
    // fallback: random deep cuts straight off the tape
    var rs = RACES.filter(function (r) { return (filterEra === "all" || r.era === filterEra) && r.duration > 1800; });
    return rs.map(function (r) {
      var t = Math.floor(r.duration * (0.2 + Math.random() * 0.65));
      return [r, { t: t, title: "Deep cut off the tape", summary: "Scanner landed somewhere inside " + (r.name || r.title) + ".", kind: "moment", heat: 3 }];
    });
  }
  function start() {
    queue = shuffle(pool());
    if (!queue.length) return;
    idx = -1; live = true;
    next();
    var b = document.getElementById("adBtn");
    if (b) { b.classList.add("live"); b.innerHTML = '<span class="dot"></span> ON AIR — CLICK TO SIGN OFF'; }
    timer = setInterval(next, 75000);
  }
  function stop() {
    live = false;
    if (timer) { clearInterval(timer); timer = null; }
    var b = document.getElementById("adBtn");
    if (b) { b.classList.remove("live"); b.innerHTML = '<span class="dot"></span> START THE SCANNER'; }
  }
  function next() {
    if (!queue.length) return;
    idx = (idx + 1) % queue.length;
    var p = queue[idx];
    Player.play(p[0].id, p[1].t);
    var now = document.getElementById("adNow");
    if (now) now.innerHTML = momentRow(p[0], p[1], true);
    var log = document.getElementById("adLog");
    if (log) {
      var el = document.createElement("div");
      el.innerHTML = '<div class="m-race" style="padding:4px 2px"><a href="#/race/' + p[0].id + '">' + esc(p[0].name || p[0].title) + "</a> · " + fmtT(p[1].t) + " · " + esc(p[1].title || "") + "</div>";
      log.prepend(el);
      while (log.children.length > 12) log.removeChild(log.lastChild);
    }
  }
  function toggle() { live ? stop() : start(); }
  function setEra(e) { filterEra = e; if (live) { queue = shuffle(pool()); idx = -1; } }
  return { toggle: toggle, stop: stop, next: function () { if (live) { clearInterval(timer); timer = setInterval(next, 75000); next(); } }, setEra: setEra, isLive: function () { return live; } };
})();
window.__adToggle = function () { AfterDark.toggle(); };
window.__adNext = function () { AfterDark.next(); };
window.__adEra = function (e, el) {
  AfterDark.setEra(e);
  Array.prototype.forEach.call(document.querySelectorAll("#adEras .pill"), function (x) { x.classList.remove("on"); });
  if (el) el.classList.add("on");
};

function vAfterDark() {
  var nMoments = allMoments().filter(function (p) { return (p[1].heat || 0) >= 3; }).length;
  var html = '<div class="ad-wrap"><div class="wrap">' +
    '<div class="ad-hero">' +
    '<div class="neon">VIGILANTE <span class="b">AFTER DARK</span></div>' +
    "<p>The all-night scanner. Punch it and the archive starts broadcasting its own greatest hits — " +
    (nMoments >= 10 ? nMoments + " logged moments" : "deep cuts straight off " + RACES.length + " broadcasts") +
    ", shuffled across every era, auto-advancing until you sign off. Wednesday never has to end.</p>" +
    '<button class="onair" id="adBtn" onclick="__adToggle()"><span class="dot"></span> START THE SCANNER</button>' +
    '<div style="margin-top:14px"><button class="btn ghost" onclick="__adNext()">SKIP ▸▸</button></div>' +
    '<div id="adEras" style="margin-top:16px"><span class="pill on" onclick="__adEra(\'all\',this)">All eras</span>' +
    (SHOW.eras || []).map(function (e) { return '<span class="pill" onclick="__adEra(\'' + e.id + '\',this)">' + esc(e.short) + "</span>"; }).join("") + "</div>" +
    "</div>" +
    '<div class="ad-now" id="adNow"></div>' +
    '<div class="ad-log" id="adLog"></div>' +
    "</div></div>";
  $app.innerHTML = html;
  if (AfterDark.isLive()) {
    var b = document.getElementById("adBtn");
    if (b) { b.classList.add("live"); b.innerHTML = '<span class="dot"></span> ON AIR — CLICK TO SIGN OFF'; }
  }
}

/* ---------------------------------------------------------- RIVALRY WIRE */
function vRivalries() {
  var max = RIVALRIES.length ? RIVALRIES[0].n : 1;
  var html = '<div class="wrap"><h2 class="page">The Shared-Tape Wire</h2>' +
    '<p class="page-sub">Who the booth mentions in the same bounded moments. Every pair below shares real commentary tape; a co-mention does not by itself prove contact, rivalry, or any off-track relationship.</p>';
  if (!RIVALRIES.length) {
    html += '<div class="note">The wire is warming up — shared-tape pairs appear once the archive finishes indexing driver mentions.</div>';
  } else {
    html += '<div class="grid g2">' + RIVALRIES.slice(0, 40).map(function (rv) {
      var a = driverById(rv.a), b = driverById(rv.b);
      if (!a || !b) return "";
      return '<a class="riv-card" href="#/rivalry/' + rv.a + "/" + rv.b + '" aria-label="Open shared-tape receipts for ' + esc(a.name) + ' and ' + esc(b.name) + '">' +
        '<div class="vs">+</div><div class="names"><b>' + esc(a.name) + "</b> &nbsp;·&nbsp; <b>" + esc(b.name) + "</b>" +
        '<div class="heat-bar"><i style="width:' + Math.round(rv.n / max * 100) + '%"></i></div></div>' +
        '<div class="ct">' + rv.n + " shared<br>calls</div></a>";
    }).join("") + "</div>";
  }
  html += "</div>";
  $app.innerHTML = html;
}

function vRivalry(a, b) {
  var da = driverById(a), db = driverById(b);
  var rv = null;
  RIVALRIES.forEach(function (x) { if ((x.a === a && x.b === b) || (x.a === b && x.b === a)) rv = x; });
  if (!da || !db) { $app.innerHTML = '<div class="wrap"><div class="empty">Shared-tape pair not found.</div></div>'; return; }
  var html = '<div class="wrap">' +
    '<div class="crumb"><a href="#/rivalries">SHARED-TAPE WIRE</a> / ' + esc(da.name).toUpperCase() + " VS " + esc(db.name).toUpperCase() + "</div>" +
    '<div class="driver-head">' +
    '<div class="d-ava red">' + esc(initials(da.name)) + '</div>' +
    '<h1 style="font-size:clamp(22px,4vw,38px)">' + esc(da.name) + ' <span style="color:var(--blue)">+</span> ' + esc(db.name) + "</h1>" +
    '<div class="d-ava">' + esc(initials(db.name)) + "</div></div>" +
    '<p class="page-sub">' + (rv ? rv.n + " shared commentary receipts." : "") + " These are co-mentions only; the receipt does not authenticate a rivalry or direct interaction.</p>" +
    '<div id="rivBox"><div class="load-note">Pulling the shared tape…</div></div></div>';
  $app.innerHTML = html;

  var box = document.getElementById("rivBox");
  if (rv && (rv.refs || []).length) {
    var rows = [];
    var done = 0;
    var refs = rv.refs.slice(0, 40);
    refs.forEach(function (ref) {
      var r = byId(ref[0]); if (!r) { done++; return; }
      loadTranscript(ref[0]).then(function (tr) {
        done++;
        var text = "";
        if (tr) {
          for (var i = 0; i < tr.length; i++) if (Math.abs(tr[i][0] - ref[1]) < 6) { text = tr[i][1]; break; }
        }
        rows.push('<div class="moment"><button class="m-play blue" onclick="__play(\'' + r.id + "'," + ref[1] + ')">▶ ' + fmtT(ref[1]) + "</button>" +
          '<div class="m-body"><div class="m-race"><a href="#/race/' + r.id + '">' + esc(r.name || r.title) + "</a>" + (r.date ? " · " + fmtDate(r.date) : "") + "</div>" +
          (text ? '<div class="m-sub">“' + esc(text) + '”</div>' : "") + "</div></div>");
        if (done === refs.length) box.innerHTML = rows.join("");
      });
    });
  } else {
    box.innerHTML = '<div class="load-note">No indexed shared tape yet — try the deep search.</div>';
  }
}

/* ------------------------------------------------------------ POSTER VAULT */
function vPosters() {
  var POSTERS = window.POSTERS || [];
  var seasons = [];
  POSTERS.forEach(function (p) { if (seasons.indexOf(p.s) < 0) seasons.push(p.s); });
  var html = '<div class="wrap"><h2 class="page">The Poster Vault</h2>' +
    '<p class="page-sub">Every Wednesday night got the full promo treatment — original VRL race poster art from the league\'s own design shop, season by season. Click any piece to see it big.</p>';
  if (!POSTERS.length) {
    html += '<div class="note">The vault door is still being cut — poster art is being digitized into the wiki right now.</div>';
  } else {
    html += '<div id="vaultFilters" style="margin-bottom:16px"><span class="pill on" data-s="all">All (' + POSTERS.length + ')</span>' +
      seasons.map(function (s) { return '<span class="pill" data-s="' + esc(s) + '">' + esc(s) + "</span>"; }).join("") + "</div>" +
      '<div class="vault-grid" id="vaultGrid"></div>';
  }
  html += "</div>";
  $app.innerHTML = html;
  if (!POSTERS.length) return;
  function render(s) {
    var list = POSTERS.filter(function (p) { return s === "all" || p.s === s; });
    document.getElementById("vaultGrid").innerHTML = list.map(function (p, i) {
      return '<div class="vault-item" onclick="__lb(\'assets/posters/' + p.f + "','" + esc(p.s + " · " + p.n).replace(/'/g, "\\'") + '\')">' +
        '<img loading="lazy" src="assets/posters/' + p.f + '" alt="' + esc(p.n) + '"><div class="cap">' + esc(p.s) + " · " + esc(p.n) + "</div></div>";
    }).join("");
  }
  render("all");
  Array.prototype.forEach.call(document.querySelectorAll("#vaultFilters .pill"), function (p) {
    p.onclick = function () {
      Array.prototype.forEach.call(document.querySelectorAll("#vaultFilters .pill"), function (x) { x.classList.remove("on"); });
      p.classList.add("on"); render(p.getAttribute("data-s"));
    };
  });
}
window.__lb = function (src, cap) {
  var lb = document.getElementById("lightbox");
  if (!lb) {
    lb = document.createElement("div"); lb.id = "lightbox";
    lb.innerHTML = '<img><div class="lb-cap"></div>';
    lb.onclick = function () { lb.classList.remove("show"); };
    document.body.appendChild(lb);
  }
  lb.querySelector("img").src = src;
  lb.querySelector(".lb-cap").textContent = cap || "";
  lb.classList.add("show");
};

/* --------------------------------------------------------------- FIRED UP */
function vFiredUp() {
  var FU = window.FIREDUP || [];
  var kinds = [];
  FU.forEach(function (h) { if (kinds.indexOf(h.kind) < 0) kinds.push(h.kind); });
  var html = '<div class="wrap"><h2 class="page">😡 FIRED UP</h2>' +
    '<p class="page-sub">Tempers, paybacks, radio meltdowns — and every single bleeped-out cussing fit the auto-captions ever censored. ' +
    FU.length + ' documented moments of pure Wednesday-night rage. Hit ▶ to hear it boil over.</p>';
  if (!FU.length) {
    html += '<div class="note">The rage archive is being mined — check back shortly.</div>';
  } else {
    html += '<div id="fuFilters" style="margin-bottom:14px"><span class="pill on" data-k="all">All the rage</span>' +
      kinds.map(function (k) {
        var n = FU.filter(function (h) { return h.kind === k; }).length;
        var label = k === "bleeped" ? "🤬 bleeped" : k;
        return '<span class="pill" data-k="' + esc(k) + '">' + esc(label) + " (" + n + ")</span>";
      }).join("") + "</div><div id=\"fuBox\"></div>";
  }
  html += "</div>";
  $app.innerHTML = html;
  if (!FU.length) return;
  function render(kind) {
    var rows = FU.filter(function (h) { return kind === "all" || h.kind === kind; }).slice(0, 200);
    document.getElementById("fuBox").innerHTML = rows.map(function (h) {
      var r = byId(h.v);
      if (!r) return "";
      return '<div class="moment' + (h.heat >= 5 ? " hot" : "") + '">' +
        '<button class="m-play" onclick="__play(\'' + h.v + "'," + h.t + ')">▶ ' + fmtT(h.t) + "</button>" +
        '<div class="m-body"><div class="m-race"><a href="#/race/' + h.v + '">' + esc(r.name || r.title) + "</a>" + (r.date ? " · " + fmtDate(r.date) : "") +
        ' · <span style="color:var(--red-hot)">' + esc(h.kind === "bleeped" ? "🤬 CENSORED BY YOUTUBE" : h.kind.toUpperCase()) + "</span></div>" +
        '<div class="m-sub">“' + esc(h.quote) + '”</div></div></div>';
    }).join("") || '<div class="empty">Nothing in this category.</div>';
  }
  render("all");
  Array.prototype.forEach.call(document.querySelectorAll("#fuFilters .pill"), function (p) {
    p.onclick = function () {
      Array.prototype.forEach.call(document.querySelectorAll("#fuFilters .pill"), function (x) { x.classList.remove("on"); });
      p.classList.add("on"); render(p.getAttribute("data-k"));
    };
  });
}

/* ---------------------------------------------------------------- WINNERS */
function vWinnersLegacy() {
  var SHOTS = window.WINNERSHOTS || [];
  var shotSet = {};
  SHOTS.forEach(function (v) { shotSet[v] = 1; });
  // receipt-verified winner -> [canonical events]
  var byWinner = {};
  CANONICAL_RACES.forEach(function (r) {
    var result = verifiedOrdinaryEventWinner(r);
    if (result) (byWinner[result.name] = byWinner[result.name] || []).push(r);
  });
  var winners = Object.keys(byWinner).map(function (n) { return { name: n, races: byWinner[n] }; });
  winners.sort(function (a, b) { return b.races.length - a.races.length || a.name.localeCompare(b.name); });
  var totalWins = 0;
  winners.forEach(function (w) { totalWins += w.races.length; });

  var html = '<div class="wrap"><h2 class="page">🏁 The Winner\'s Circle</h2>' +
    '<p class="page-sub">Every driver with bounded, position-specific winner language on an eligible official tape — ' + winners.length +
    ' winners across ' + totalWins + ' receipt-verified victories. Candidate frames remain official-source references, and unbounded result claims stay out until reviewed. <a href="#/results">Open the race-by-race Results Room &rarr;</a></p>';

  winners.forEach(function (w) {
    var dr = DRIVERS.filter(function (x) { return x.name === w.name; })[0];
    var titles = TITLES[w.name] || [];
    // pick the best shot available among their wins
    var shotRace = null;
    w.races.forEach(function (r) { if (!shotRace && shotSet[r.id]) shotRace = r; });
    html += '<div class="card" style="margin-bottom:14px"><div style="display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start">' +
      (shotRace
        ? '<div style="flex:0 0 300px;max-width:100%"><img src="assets/winners/' + shotRace.id + '.jpg" alt="Candidate official-source victory frame from ' + esc(shotRace.name || shotRace.title) + '" style="border-radius:10px;border:1px solid var(--line)" loading="lazy">' +
          '<div style="font-family:var(--mono);font-size:9.5px;color:var(--faint);letter-spacing:1px;margin-top:4px">FROM THE WIN: ' + esc(shotRace.name || shotRace.title).toUpperCase() + "</div></div>"
        : '<div class="d-ava red" style="width:74px;height:74px;font-size:30px;border-radius:14px">' + esc(initials(w.name)) + "</div>") +
      '<div style="flex:1;min-width:240px">' +
      '<h3 style="font-family:var(--disp);font-size:24px;letter-spacing:1px;margin:0">' + (dr ? '<a href="#/driver/' + dr.id + '" style="color:inherit">' + esc(w.name).toUpperCase() + '</a>' : esc(w.name).toUpperCase()) + "</h3>" +
      (titles.length ? '<div style="color:var(--gold);font-family:var(--disp);letter-spacing:1px;font-size:14px">👑 VRL CHAMPION — ' + titles.map(esc).join(" · ") + "</div>" : "") +
      '<div class="sub" style="margin:4px 0 8px"><b style="color:var(--gold);font-family:var(--disp);font-size:19px">' + w.races.length + "</b> " + (w.races.length === 1 ? "win" : "wins") + " on tape</div>" +
      '<div>' + w.races.map(function (r) {
        return '<a class="pill" href="#/race/' + r.id + '">🏆 ' + esc((r.name || r.title).slice(0, 34)) + (r.date ? " · " + yearOf(r.date) : "") + "</a>";
      }).join("") + "</div></div></div></div>";
  });

  if (!winners.length) html += '<div class="note">Winners appear as races get distilled.</div>';
  html += "</div>";
  $app.innerHTML = html;
}

function vWinners() {
  var byWinner = {};
  CANONICAL_RACES.forEach(function (race) {
    var result = verifiedOrdinaryEventWinner(race);
    if (result) (byWinner[result.name] = byWinner[result.name] || []).push(race);
  });
  var winners = Object.keys(byWinner).map(function (name) {
    return { name: name, races: byWinner[name] };
  }).sort(function (a, b) {
    return b.races.length - a.races.length || a.name.localeCompare(b.name);
  });
  var totalWins = winners.reduce(function (sum, winner) { return sum + winner.races.length; }, 0);
  var championCount = winners.filter(function (winner) {
    return (TITLES[winner.name] || []).length;
  }).length;
  var html = '<div class="winners-page"><section class="victory-lane-hero"><div class="wrap"><div><span>THE RECEIPT-VERIFIED WIN LEDGER</span><h1>VICTORY<br><em>LANE</em></h1><p>Every listed win has bounded, position-specific P1 language on eligible official tape. The order below is archive win count, not an official points table or a claim about unevidenced starts.</p></div><div class="victory-lane-tower"><div><b>' +
    winners.length + '</b><span>SUPPORTED<br>WINNERS</span></div><div><b>' + totalWins +
    '</b><span>SUPPORTED<br>VICTORIES</span></div><div><b>' + championCount +
    '</b><span>TITLE-WINNING<br>DRIVERS</span></div><a href="#/results"><b>R</b><span>OPEN RESULTS<br>ROOM &rarr;</span></a></div></div></section><div class="wrap"><div class="winner-pylon">';

  winners.forEach(function (winner, index) {
    var driver = driverForResultName(winner.name);
    var dossier = driver && dossierOf(driver.id) || {};
    var titles = TITLES[winner.name] || [];
    var orderedWins = winner.races.slice().sort(function (a, b) {
      return (b.ts || 0) - (a.ts || 0);
    });
    var newest = orderedWins[0];
    var quickWins = orderedWins.slice(0, 3).map(function (race) {
      var result = verifiedOrdinaryEventWinner(race);
      if (!result || !result.receipt) return "";
      return '<button class="winner-quick-win" onclick="__playReceipt(\'' +
        esc(result.sourceId) + '\',' + result.receipt.t + ',' + result.receipt.end +
        ',\'SUPPORTED P1 RECEIPT\')"><span>' + esc((race.seasonLabel || "VRL").toUpperCase()) +
        ' / ' + esc(fmtDate(race.date).toUpperCase()) + '</span><b>' +
        esc(race.name || race.title) + '</b><small>&#9654; P1 PROOF / ' +
        fmtT(result.receipt.t) + '</small></button>';
    }).join("");
    var completeLedger = orderedWins.map(function (race) {
      var result = verifiedOrdinaryEventWinner(race);
      if (!result || !result.receipt) return "";
      return '<div class="winner-ledger-row"><a href="#/race/' + esc(race.id) +
        '"><span>' + esc((race.seasonLabel || "VRL").toUpperCase()) + ' / ' +
        esc(fmtDate(race.date).toUpperCase()) + '</span><b>' +
        esc(race.name || race.title) + '</b></a><button onclick="__playReceipt(\'' +
        esc(result.sourceId) + '\',' + result.receipt.t + ',' + result.receipt.end +
        ',\'SUPPORTED P1 RECEIPT\')">&#9654; PLAY ' + fmtT(result.receipt.t) +
        '</button></div>';
    }).join("");
    html += '<article class="winner-pylon-row"><div class="winner-pylon-rank"><span>ARCHIVE<br>WIN RANK</span><b>' +
      String(index + 1).padStart(2, "0") + '</b></div><div class="winner-pylon-visual">' +
      (driver ? driverVisual(driver, "winner-driver-shot")
        : '<div class="winner-identity-fallback"><b>' + esc(initials(winner.name)) +
          '</b><span>CANONICAL DRIVER ART PENDING</span></div>') +
      '</div><div class="winner-pylon-copy"><span>VICTORY FILE / ' +
      esc(dossier.primaryNumber ? "#" + dossier.primaryNumber : "NUMBER DEVELOPING") +
      (newest ? ' / LATEST ' + esc(fmtDate(newest.date).toUpperCase()) : "") +
      '</span><h2>' + (driver ? '<a href="#/driver/' + esc(driver.id) + '">' +
      esc(winner.name) + '</a>' : esc(winner.name)) + '</h2>' +
      (titles.length ? '<div class="winner-title-strip">VRL CHAMPION / ' +
        titles.map(esc).join(" / ") + '</div>' : "") +
      '<p><b>' + winner.races.length + '</b> receipt-verified ' +
      (winner.races.length === 1 ? "victory" : "victories") +
      ' in the eligible Wednesday championship archive.</p><div class="winner-quick-strip">' +
      quickWins + '</div><details class="winner-complete-ledger"><summary><span>COMPLETE SCORING SHEET</span><b>OPEN ALL ' +
      winner.races.length + ' WIN RECEIPTS</b></summary><div>' + completeLedger +
      '</div></details></div><div class="winner-pylon-count"><b>' +
      winner.races.length + '</b><span>SUPPORTED<br>P1 CALLS</span></div></article>';
  });
  if (!winners.length) html += '<div class="empty">No position-bound winner receipts are published yet.</div>';
  html += '</div><aside class="winner-evidence-boundary"><b>VICTORY LANE DOES NOT GUESS</b><p>Driver images are separately labeled owner-selected identity art, historical paint placeholders, or approved official-tape frames. An image does not prove a win; the exact bounded P1 receipt beside each race does. Qualifying races and excluded Monday, Friday, or crossover material do not enter this ordinary-event win count.</p></aside></div></div>';
  $app.innerHTML = html;
}

/* ------------------------------------------------------------ RESULTS ROOM */
function fullResultsBoardFor(race) {
  var eventId = (race && (race.eventId || race.id)) || "";
  return (FULL_RESULTS_BOARDS.boards || []).filter(function (board) {
    return board.eventId === eventId;
  })[0] || null;
}

function fullResultsBoardHtml(board) {
  if (!board || !(board.slots || []).length) return "";
  var renderFullResultSlot = function (slot) {
    if (!slot.canonicalDriver || !slot.receipt) {
      return '<div class="full-result-slot unknown"><b>P' + slot.position +
        '</b><span>UNKNOWN</span><small>NOT GUESSED</small></div>';
    }
    var driver = driverForResultName(slot.canonicalDriver);
    return '<div class="full-result-slot"><b>P' + slot.position + '</b><span>' +
      (driver ? '<a href="#/driver/' + driver.id + '">' + esc(slot.canonicalDriver) + '</a>' :
      esc(slot.canonicalDriver)) + '</span><button aria-label="Play provisional P' +
      slot.position + ' broadcast result read for ' + esc(slot.canonicalDriver) +
      '" onclick="__playReceipt(\'' +
      slot.receipt.sourceId + '\',' + slot.receipt.t + ',' + slot.receipt.end +
      ',\'PROVISIONAL P' + slot.position + ' BROADCAST READ\')">&#9654; ' +
      fmtT(slot.receipt.t) + '</button></div>';
  };
  var resultsMidpoint = Math.ceil(board.slots.length / 2);
  var resultsColumns = [
    board.slots.slice(0, resultsMidpoint),
    board.slots.slice(resultsMidpoint)
  ].filter(function (column) { return column.length; });
  return '<details class="full-results-board"><summary><span>FULL RESULTS BOARD PILOT</span><b>' +
    board.knownPositionCount + ' / ' + board.fieldSize +
    ' EXPLICIT READS</b><em>OPEN PROVISIONAL FIELD</em></summary><div class="full-results-board-body">' +
    '<div class="full-results-board-ledger"><span>EDITOR-REVIEWED BROADCAST READ</span><span>EXACT SAME-SOURCE WINDOWS</span><span>ZERO STATS / RANKING EFFECT</span></div>' +
    '<div class="full-results-columns">' + resultsColumns.map(function (column, index) {
      return '<div class="full-results-column" aria-label="Provisional finishing order column ' +
        (index + 1) + '">' + column.map(renderFullResultSlot).join("") + '</div>';
    }).join("") + '</div><p>Provisional as broadcast, not final league certification. Unknown slots stay unknown. No row changes starts, wins, podiums, statistics, championships, or driver rankings.</p></div></details>';
}

function resultUnknownReason(race) {
  var truth = ((RESULT_TRUTH.sources || {})[race.id]) || {};
  var reviewed = (truth.claims || []).map(function (claim) {
    return claim.reviewedLimitation && claim.reviewedLimitation.reviewNote;
  }).filter(Boolean)[0];
  if (reviewed) return reviewed;
  if ((truth.resultFormat || {}).kind === "multi-race-broadcast") {
    return (truth.resultFormat.basis || "The official source contains multiple races.") +
      " A single broadcast-level P1 would combine separate events.";
  }
  var limitation = String(((DISTILLED[race.id] || {}).sourceLimitations) || "").trim();
  if (!limitation) return "No position-specific P1 receipt has been bounded on the surviving official tape.";
  if (limitation.length <= 260) return limitation;
  return limitation.slice(0, 257).replace(/\s+\S*$/, "") + "...";
}

function resultRaceCardHtml(row) {
  var race = row.race;
  var names = row.positions.map(function (item) { return item.claim.name; });
  var state = [row.fullBoard ? "fullboard" : "", row.rundown ? "rundown" : "", row.rundown && row.rundown.result.provisional ? "provisional" : "", row.winner ? "winner" : "unknown", row.positions.length === 3 ? "podium" : ""].join(" ");
  var search = [race.name || race.title, race.seasonLabel, race.track, race.date].concat(names).join(" ").toLowerCase();
  var winner = row.winner && row.winner.claim;
  var rundown = row.rundown && row.rundown.result;
  return '<article class="result-race-card" data-results-search="' + esc(search) + '" data-results-state="' + state + '">' +
    '<div class="result-race-visual">' +
    (race.thumb ? '<img loading="lazy" src="' + esc(race.thumb) + '" alt="Official source thumbnail for ' +
      esc(race.name || race.title) + '">' : '<div class="result-race-visual-fallback" aria-hidden="true"></div>') +
    '<div class="result-race-date"><b>' + esc(yearOf(race.date)) + '</b><span>' + esc(fmtDate(race.date).toUpperCase()) +
    '</span><em>' + esc(race.seasonLabel || "VRL") + '</em></div>' +
    '<small>OFFICIAL SOURCE THUMBNAIL / NOT RESULT-FRAME PROOF</small></div>' +
    '<div class="result-race-main"><div class="result-race-meta">' +
    (race.track ? esc(race.track).toUpperCase() + ' / ' : '') + esc((race.special || "CHAMPIONSHIP EVENT").toUpperCase()) +
    '</div><h2><a href="#/race/' + race.id + '">' + esc(race.name || race.title) + '</a></h2>' +
    (winner ? '<div class="result-winner"><span>' + (winner.countsAsOrdinaryEvent ? "WINNER" : "QUALIFIER P1") +
      '</span><b>' + esc(winner.name) + '</b><button onclick="__playReceipt(\'' + winner.sourceId + '\',' +
      winner.receipt.t + ',' + winner.receipt.end + ',\'P1 RESULT RECEIPT\')">&#9654; PROOF / ' +
      fmtT(winner.receipt.t) + '</button></div>' :
    '<div class="result-winner unknown"><span>WINNER</span><b>NOT YET POSITION-BOUND</b><small><strong>SOURCE LIMIT / </strong>' +
      esc(resultUnknownReason(race)) + '</small>' +
      (race.special === "qualifier" ? '<em class="result-scope-zero">ALL-STAR QUALIFIER FINAL / ZERO ORDINARY WIN EFFECT</em>' : "") +
      '</div>') +
    '<div class="result-podium">' + [1, 2, 3].map(function (position) {
      var item = row.positions.filter(function (candidate) { return candidate.position === position; })[0];
      if (!item) return '<span class="pending">P' + position + ' / PENDING</span>';
      var driver = DRIVERS.filter(function (candidate) { return resultNameKey(candidate.name) === resultNameKey(item.claim.name); })[0];
      return '<span>P' + position + ' / ' + (driver ? '<a href="#/driver/' + driver.id + '">' + esc(item.claim.name) + '</a>' : esc(item.claim.name)) + '</span>';
    }).join("") + '</div>' + fullResultsBoardHtml(row.fullBoard) + '</div><div class="result-race-actions">' +
    (rundown ? '<b>' + (rundown.provisional ? 'PROVISIONAL RESULT READ' : 'RESULT READ ON TAPE') + '</b><span>' + esc(rundown.coverageLabel || "Closing rundown") +
      (rundown.provisional ? ' · broadcast context, not final league certification' : '') +
      '</span><button class="btn" onclick="__playReceipt(\'' + row.rundown.sourceId + '\',' +
      rundown.receipt.t + ',' + rundown.receipt.end + ',\'' +
      (rundown.provisional ? 'PROVISIONAL RESULT READ' : 'BROADCAST RESULTS READ') + '\')">&#9654; PLAY ' +
      fmtT(rundown.receipt.end - rundown.receipt.t) + '</button>' :
      '<b>RUNDOWN NOT BOUNDED</b><span>The race page still exposes every supported position receipt.</span>') +
    '<a href="#/race/' + race.id + '">OPEN COMPLETE RACE FILE &rarr;</a></div></article>';
}

function vResults() {
  var rows = CANONICAL_RACES.slice().reverse().map(function (race) {
    var positions = [1, 2, 3].map(function (position) {
      var claim = verifiedEventPosition(race, position);
      return claim ? { position: position, claim: claim } : null;
    }).filter(Boolean);
    return {
      race: race,
      positions: positions,
      winner: positions.filter(function (item) { return item.position === 1; })[0] || null,
      rundown: eventResultRundown(race),
      fullBoard: fullResultsBoardFor(race)
    };
  });
  var winnerCount = rows.filter(function (row) { return row.winner; }).length;
  var rundownCount = rows.filter(function (row) { return row.rundown; }).length;
  var completePodiums = rows.filter(function (row) { return row.positions.length === 3; }).length;
  var qualifierUnknownCount = rows.filter(function (row) {
    return !row.winner && row.race.special === "qualifier";
  }).length;
  var ordinaryUnknownCount = rows.filter(function (row) {
    return !row.winner && row.race.special !== "qualifier";
  }).length;
  var html = '<div class="results-room"><section class="results-hero"><div class="wrap"><div class="kicker">THE CHECKERED FLAG / EXACT OFFICIAL TAPE</div>' +
    '<h1>VRL RESULTS <span>ROOM</span></h1><p>One finish desk for every eligible Wednesday-night event. Winner and podium names appear only when individually bound to position language; complete finishing-order reads remain playable as bounded booth segments.</p>' +
    '<div class="results-tote"><div><b>' + winnerCount + '</b><span>EVENTS WITH SUPPORTED P1</span></div><div><b>' +
    completePodiums + '</b><span>COMPLETE SUPPORTED PODIUMS</span></div><div><b>' + rundownCount +
    '</b><span>BOUNDED RESULT READS</span></div><div><b>' + ordinaryUnknownCount +
    '</b><span>ORDINARY P1 GAPS</span></div></div><div class="results-scope-seal"><b>ORDINARY RACE-WINNER RECORD: COMPLETE ON REVIEWED TAPE</b><span>' +
    qualifierUnknownCount + ' All-Star qualifier-final P1 remains deliberately unknown because the captions never say who won. It contributes zero ordinary wins, podiums, starts, or ranking points.</span></div></div></section><div class="wrap">' +
    ((FULL_RESULTS_BOARDS.summary || {}).boardCount ? '<aside class="full-results-pilot-banner"><div><span>NEW / FULL RESULTS BOARD PILOT</span><b>' +
      FULL_RESULTS_BOARDS.summary.knownPositionCount + ' REVIEWED FIELD POSITIONS ACROSS ' +
      FULL_RESULTS_BOARDS.summary.boardCount + ' FEATURED RACES</b><small>' +
      FULL_RESULTS_BOARDS.summary.unknownPositionCount + ' UNKNOWN SLOTS PRESERVED / ZERO STATISTICAL EFFECT</small></div><button class="btn" onclick="document.getElementById(\'resultsState\').value=\'fullboard\';document.getElementById(\'resultsState\').dispatchEvent(new Event(\'change\'))">SHOW PILOT BOARDS</button></aside>' : '') +
    '<div class="results-controls"><div class="bigsearch"><span class="ic">&#128269;</span><input id="resultsQ" aria-label="Search race results" placeholder="Driver, race, season, track, year..."></div>' +
    '<label>SHOW<select id="resultsState" aria-label="Filter race results by evidence state"><option value="all">All eligible events</option><option value="fullboard">Full Results pilot boards</option><option value="rundown">Bounded result read available</option><option value="provisional">Provisional broadcast reads</option><option value="winner">Supported winner</option><option value="podium">Complete podium</option><option value="unknown">Unknown qualifier-final P1</option></select></label></div>' +
    '<div class="results-browser-status" id="resultsStatus" aria-live="polite"></div>' +
    '<div class="results-list" id="resultsList"></div><div class="empty" id="resultsEmpty" hidden>No result file matches those filters.</div>' +
    '<div class="results-more"><button class="btn ghost" id="resultsMore" type="button">LOAD 25 MORE RACES</button></div>' +
    '<aside class="results-boundary"><b>RESULTS BOUNDARY</b><p>A matching name elsewhere in a race is not a finishing position. A complete booth rundown is useful playback evidence, but names below the individually reviewed podium remain transcript candidates until the position-to-name relationship is separately bounded.</p></aside></div></div>';
  $app.innerHTML = html;

  var limit = 25;
  function renderResults() {
    var q = (document.getElementById("resultsQ").value || "").trim().toLowerCase();
    var state = document.getElementById("resultsState").value;
    var matches = rows.filter(function (row) {
      var names = row.positions.map(function (item) { return item.claim.name; });
      var search = [row.race.name || row.race.title, row.race.seasonLabel, row.race.track, row.race.date].concat(names).join(" ").toLowerCase();
      var states = [row.fullBoard ? "fullboard" : "", row.rundown ? "rundown" : "", row.rundown && row.rundown.result.provisional ? "provisional" : "", row.winner ? "winner" : "unknown", row.positions.length === 3 ? "podium" : ""];
      return (!q || search.indexOf(q) >= 0) && (state === "all" || states.indexOf(state) >= 0);
    });
    var shown = matches.slice(0, limit);
    document.getElementById("resultsList").innerHTML = shown.map(resultRaceCardHtml).join("");
    document.getElementById("resultsEmpty").hidden = matches.length !== 0;
    document.getElementById("resultsStatus").textContent = matches.length
      ? "SHOWING " + shown.length + " OF " + matches.length + " MATCHING RACES / " + rows.length + " ELIGIBLE EVENTS"
      : "NO MATCHING RACES / " + rows.length + " ELIGIBLE EVENTS";
    var more = document.getElementById("resultsMore");
    more.hidden = shown.length >= matches.length;
    more.textContent = "LOAD " + Math.min(25, matches.length - shown.length) + " MORE RACES";
  }
  document.getElementById("resultsQ").addEventListener("input", function () { limit = 25; renderResults(); });
  document.getElementById("resultsState").addEventListener("change", function () { limit = 25; renderResults(); });
  document.getElementById("resultsMore").addEventListener("click", function () { limit += 25; renderResults(); });
  renderResults();
}

/* ------------------------------------------------------------ RECORD BOOK */
function vRecords() {
  var moms = allMoments();
  var html = '<div class="wrap"><h2 class="page">The Record Book</h2>' +
    '<p class="page-sub">The tote board of everything the tape can prove — winners, wrecks, photo finishes, viewership, iron-man streaks, and who the booth simply cannot shut up about.</p>';

  // Archive totals
  var hours = 0; RACES.forEach(function (r) { hours += r.duration || 0; });
  var dated = R_SORTED.filter(function (r) { return r.date; });
  var spanDays = dated.length ? Math.round((dated[dated.length - 1].ts - dated[0].ts) / 86400) : 0;
  var sb = allSoundbytes();
  html += '<div class="sec"><div class="sec-head"><h2>🧮 The Tote Board</h2><div class="ln"></div></div><div class="stat-row" style="gap:34px">' +
    '<div class="stat"><b>' + RACES.length + '</b><span>Broadcasts</span></div>' +
    '<div class="stat"><b>' + Math.round(hours / 3600).toLocaleString() + '</b><span>Hours of tape</span></div>' +
    '<div class="stat"><b>' + SEASONS.length + '</b><span>Seasons</span></div>' +
    '<div class="stat"><b>' + (spanDays / 365).toFixed(1) + '</b><span>Years running</span></div>' +
    '<div class="stat"><b>' + DRIVERS.length + '</b><span>Driver dossiers</span></div>' +
    '<div class="stat"><b>' + moms.length + '</b><span>Logged moments</span></div>' +
    '<div class="stat"><b>' + sb.length + '</b><span>Soundbytes</span></div>' +
    '</div></div>';

  // Most watched
  var viewed = RACES.filter(function (r) { return r.views; }).sort(function (a, b) { return b.views - a.views; }).slice(0, 6);
  if (viewed.length) {
    html += '<div class="sec"><div class="sec-head"><h2>📺 Most-watched broadcasts</h2><div class="ln"></div></div><div class="grid g3">' +
      viewed.map(function (r) {
        return raceCard(r).replace('</div></a>', '<div class="sub" style="margin-top:6px"><b style="color:var(--txt)">' + r.views.toLocaleString() + '</b> views</div></div></a>');
      }).join("") + "</div></div>";
  }

  // Track atlas
  var tmap = {};
  RACES.forEach(function (r) { if (r.track) { tmap[r.track] = tmap[r.track] || { n: 0, ex: r }; tmap[r.track].n++; } });
  var tracks = Object.keys(tmap).map(function (t) { return [t, tmap[t].n]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 14);
  if (tracks.length) {
    var maxT = tracks[0][1];
    html += '<div class="sec"><div class="sec-head"><h2>🛣️ The Track Atlas</h2><div class="ln"></div><span class="more">where Wednesday nights happen</span></div><div class="card">' +
      tracks.map(function (p, i) {
        return '<div class="tr-line" style="cursor:pointer;align-items:center" onclick="location.hash=\'#/search/' + encodeURIComponent(p[0]) + '\'">' +
          '<span class="t">#' + (i + 1) + '</span><span class="x" style="flex:1"><b>' + esc(p[0]) + "</b> — " + p[1] + " visits" +
          '<span style="display:block;max-width:420px;margin-top:5px;height:5px;border-radius:3px;background:var(--panel2);overflow:hidden"><i style="display:block;height:100%;width:' + Math.round(p[1] / maxT * 100) + '%;background:linear-gradient(90deg,var(--gold),var(--red))"></i></span></span></div>';
      }).join("") + "</div></div>";
  }

  // Marathon nights + Wednesday streak
  var longest = RACES.filter(function (r) { return r.duration; }).sort(function (a, b) { return b.duration - a.duration; }).slice(0, 5);
  var streak = 0, best = 0, bestEnd = null, prev = null;
  dated.forEach(function (r) {
    if (prev !== null) {
      var wk = Math.round((r.ts - prev) / 604800);
      if (wk <= 1) { streak++; } else { streak = 1; }
    } else streak = 1;
    if (streak > best) { best = streak; bestEnd = r; }
    prev = r.ts;
  });
  html += '<div class="sec"><div class="grid g2">' +
    '<div class="card"><h3>⏱️ Marathon nights — longest tapes</h3>' +
    longest.map(function (r) {
      return '<div class="tr-line" style="cursor:pointer" onclick="location.hash=\'#/race/' + r.id + '\'"><span class="t">' + fmtDur(r.duration) + '</span><span class="x">' + esc(r.name || r.title) + " · " + fmtDate(r.date) + "</span></div>";
    }).join("") + "</div>" +
    '<div class="card"><h3>📅 The Wednesday Streak</h3><div class="sub" style="margin-top:8px">Longest unbroken run of weekly broadcasts on tape:</div>' +
    '<div style="font-family:var(--disp);font-size:44px;color:var(--gold);letter-spacing:1px;margin:8px 0">' + best + ' STRAIGHT WEEKS</div>' +
    (bestEnd ? '<div class="sub">ending ' + fmtDate(bestEnd.date) + ' — rain, holidays, real life… the VRL showed up anyway.</div>' : "") +
    "</div></div></div>";

  // Victory Lane
  var wins = [];
  R_NEWEST.forEach(function (r) {
    var result = verifiedOrdinaryEventWinner(r);
    if (result) wins.push([r, result.name]);
  });
  if (wins.length) {
    var tally = {};
    wins.forEach(function (p) { tally[p[1]] = (tally[p[1]] || 0) + 1; });
    var top = Object.keys(tally).map(function (n) { return [n, tally[n]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 10);
    html += '<div class="sec"><div class="sec-head"><h2>🏆 Victory Lane</h2><div class="ln"></div><span class="more">' + wins.length + " receipt-verified wins</span></div>" +
      '<div class="grid g2">' +
      '<div class="card"><h3>All-time win board</h3>' + top.map(function (p, i) {
        var dr = DRIVERS.filter(function (x) { return x.name === p[0]; })[0];
        return '<div class="tr-line" style="cursor:pointer" ' + (dr ? 'onclick="location.hash=\'#/driver/' + dr.id + '\'"' : "") + '><span class="t">#' + (i + 1) + '</span><span class="x"><b>' + esc(p[0]) + "</b> — " + p[1] + " wins on tape</span></div>";
      }).join("") + "</div>" +
      '<div class="card"><h3>Latest checkered flags</h3>' + wins.slice(0, 10).map(function (p) {
        return '<div class="tr-line" style="cursor:pointer" onclick="location.hash=\'#/race/' + p[0].id + '\'"><span class="t">' + yearOf(p[0].date) + '</span><span class="x"><b>' + esc(p[1]) + "</b> · " + esc(p[0].name || p[0].title) + "</span></div>";
      }).join("") + "</div></div></div>";
  }

  // Big One Board
  var wrecks = moms.filter(function (p) { return (p[1].kind || "") === "wreck"; })
    .sort(function (a, b) { return (b[1].heat || 0) - (a[1].heat || 0); }).slice(0, 12);
  if (wrecks.length) {
    html += '<div class="sec"><div class="sec-head"><h2>💥 The Big One Board</h2><div class="ln"></div></div>' +
      wrecks.map(function (p) { return momentRow(p[0], p[1], true); }).join("") + "</div>";
  }

  // Photo finishes
  var fins = moms.filter(function (p) { return (p[1].kind || "") === "finish" && (p[1].heat || 0) >= 4; }).slice(0, 10);
  if (fins.length) {
    html += '<div class="sec"><div class="sec-head"><h2>🏁 Photo Finish Reel</h2><div class="ln"></div></div>' +
      fins.map(function (p) { return momentRow(p[0], p[1], true); }).join("") + "</div>";
  }

  // Most talked about (Mention Machine)
  var talk = Object.keys(MENTIONS).map(function (s) { return [s, MENTIONS[s].n]; })
    .sort(function (a, b) { return b[1] - a[1]; }).slice(0, 12);
  if (talk.length) {
    var maxN = talk[0][1];
    html += '<div class="sec"><div class="sec-head"><h2>🎙️ Most talked-about, all time</h2><div class="ln"></div></div><div class="card">' +
      talk.map(function (p, i) {
        var dr = driverById(p[0]);
        if (!dr) return "";
        return '<div class="tr-line" style="cursor:pointer;align-items:center" onclick="location.hash=\'#/driver/' + dr.id + '\'">' +
          '<span class="t">#' + (i + 1) + '</span>' +
          '<span class="x" style="flex:1"><b>' + esc(dr.name) + "</b> — " + p[1].toLocaleString() + " booth mentions" +
          '<span class="heat-bar" style="display:block;max-width:420px;margin-top:5px;height:5px;border-radius:3px;background:var(--panel2);overflow:hidden"><i style="display:block;height:100%;width:' + Math.round(p[1] / maxN * 100) + '%;background:linear-gradient(90deg,var(--blue),var(--red))"></i></span></span></div>';
      }).join("") + "</div></div>";
  }

  // Iron men
  var iron = DRIVERS.map(function (d) { return [d, raceCountOf(d)]; })
    .sort(function (a, b) { return b[1] - a[1]; }).slice(0, 10);
  if (iron.length && iron[0][1] > 0) {
    html += '<div class="sec"><div class="sec-head"><h2>🔩 Iron Vigilantes — most nights on tape</h2><div class="ln"></div></div><div class="grid g5">' +
      iron.map(function (p) { return wantedCard(p[0], p[1] >= 25 ? "legend" : ""); }).join("") + "</div></div>";
  }

  if (!wins.length && !wrecks.length && !talk.length) {
    html += '<div class="note">The Record Book fills itself in as the overnight archive crew logs winners, wrecks and mentions. First entries land tonight.</div>';
  }
  html += "</div>";
  $app.innerHTML = html;
}

/* ------------------------------------------------------------------ ERAS */
function vEras() {
  var html = '<div class="wrap"><h2 class="page">The broadcast eras</h2>' +
    '<p class="page-sub">VRL has outlived its own broadcasters. Four channels have carried Wednesday nights — this is the history of who held the mic, and where the surviving tape lives.</p>';
  (SHOW.eras || []).forEach(function (e, i) {
    var rr = R_SORTED.filter(function (r) { return r.era === e.id; });
    var first = rr[0], lastR = rr[rr.length - 1];
    html += '<div class="era-band"><h3>' + (i + 1) + ". " + esc(e.name) + "</h3><p>" + esc(e.blurb) + "</p>" +
      '<span class="ch">' + rr.length + " surviving broadcasts" +
      (first && first.date ? " · " + fmtDate(first.date) + " → " + fmtDate(lastR.date) : "") +
      ' · <a href="' + e.channelUrl + '" target="_blank" rel="noopener">channel ↗</a></span></div>';
    html += '<div class="grid g4">' + rr.slice(0, 4).map(raceCard).join("") + "</div>";
  });
  html += '<div class="note red" style="margin-top:22px">📼 <b>The lost era:</b> ' + esc(SHOW.lostMedia || "") + ' <a href="#/lost">The Lost Tape Memorial →</a></div></div>';
  $app.innerHTML = html;
}

/* ------------------------------------------------------ LOST TAPE MEMORIAL */
function vLost() {
  // find gaps: seasons whose round sequences skip numbers + the 2024 dead air
  var gaps = [];
  SEASONS.forEach(function (s) {
    var rounds = s.races.filter(function (r) { return r.round; }).map(function (r) { return r.round; }).sort(function (a, b) { return a - b; });
    if (!rounds.length) return;
    for (var i = 1; i < rounds.length; i++) {
      for (var k = rounds[i - 1] + 1; k < rounds[i]; k++) gaps.push({ season: s.label, round: k });
    }
  });
  var html = '<div class="wrap"><h2 class="page">📼 The Lost Tape Memorial</h2>' +
    '<p class="page-sub">Somewhere between broadcasters, a piece of VRL history walked out the door. A departed broadcaster pulled their uploads — entire Wednesday nights that only exist now in the memories of the people who raced them. This page keeps their empty seats warm.</p>' +
    '<div class="note red"><b>Dead air: August → October 2024.</b> The back half of the Season 9 regular season and the start of its playoffs vanished when their broadcaster left YouTube. If you have local recordings from those nights, you hold lost history — get them to the league.</div>';
  if (gaps.length) {
    html += '<div class="sec"><div class="sec-head"><h2>Known missing rounds</h2><div class="ln"></div></div><div class="grid g3">' +
      gaps.slice(0, 30).map(function (g) {
        return '<div class="card" style="border-style:dashed;opacity:.75"><h3>' + esc(g.season) + " · Round " + g.round + '</h3><div class="sub">Broadcast lost — no surviving tape.</div></div>';
      }).join("") + "</div></div>";
  }
  html += '<div class="sec"><div class="sec-head"><h2>What survives</h2><div class="ln"></div></div>' +
    '<div class="card"><div class="sub">' + RACES.length + " broadcasts are safe in this archive across four channels. The wiki re-scans all four every time it updates — if lost tape ever resurfaces, it takes its seat back automatically.</div></div></div>";
  html += "</div>";
  $app.innerHTML = html;
}

/* ---------------------------------------------------------------- SEARCH */
function deepScan(terms, opt) {
  var ids = TR_INDEX.slice();
  if (opt.priority && opt.priority.length) {
    var pset = {};
    opt.priority.forEach(function (id) { pset[id] = 1; });
    ids = opt.priority.filter(function (id) { return TR_INDEX.indexOf(id) >= 0; })
      .concat(ids.filter(function (id) { return !pset[id]; }));
  }
  var bar = document.getElementById(opt.prog), note = document.getElementById(opt.note), box = document.getElementById(opt.box);
  var lows = terms.map(function (t) { return t.toLowerCase(); }).filter(function (t) { return t.length >= 3; });
  if (!lows.length) { if (note) note.textContent = "Search term too short."; return; }
  var rx = new RegExp("(" + lows.map(rxEsc).join("|") + ")", "ig");
  var hits = 0, done = 0, out = [];
  var run = ++deepScan.run;
  function step(i) {
    if (run !== deepScan.run) return;
    if (i >= ids.length || hits >= (opt.max || 150)) {
      if (bar) bar.style.width = "100%";
      if (note) note.textContent = opt.doneNote ? opt.doneNote(hits, done) : hits + " results.";
      return;
    }
    loadTranscript(ids[i]).then(function (tr) {
      if (run !== deepScan.run) return;
      done++;
      if (bar) bar.style.width = Math.round(done / ids.length * 100) + "%";
      if (tr) {
        var r = byId(ids[i]), per = 0;
        for (var j = 0; j < tr.length && per < (opt.perRace || 3); j++) {
          var low = tr[j][1].toLowerCase(), found = false;
          for (var k = 0; k < lows.length; k++) if (low.indexOf(lows[k]) >= 0) { found = true; break; }
          if (!found) continue;
          hits++; per++;
          var x = esc(tr[j][1]).replace(rx, "<mark>$1</mark>");
          out.push('<div class="moment"><button class="m-play blue" onclick="__play(\'' + r.id + "'," + tr[j][0] + ')">▶ ' + fmtT(tr[j][0]) + "</button>" +
            '<div class="m-body"><div class="m-race"><a href="#/race/' + r.id + '">' + esc(r.name || r.title) + "</a>" + (r.date ? " · " + fmtDate(r.date) : "") + '</div>' +
            '<div class="m-sub">“' + x + '”</div></div></div>');
        }
        if (per && box) box.innerHTML = out.join("");
        if (note) note.textContent = "Scanned " + done + " of " + ids.length + " broadcasts · " + hits + " mentions so far…";
      }
      setTimeout(function () { step(i + 1); }, 0);
    });
  }
  step(0);
}
deepScan.run = 0;

function vSearch(q) {
  q = decodeURIComponent(q || "").trim();
  var html = '<div class="wrap"><h2 class="page">Search the archive</h2>' +
    '<p class="page-sub">Races, drivers, logged moments — and the deep cut: every word the booth ever said, indexed to the second.</p>' +
    '<div class="bigsearch" style="margin-bottom:20px"><span class="ic">🔎</span><input id="sq" value="' + esc(q) + '" placeholder="A driver, a track, a phrase… \'big one at Talladega\'"></div>' +
    '<div id="sres"></div></div>';
  $app.innerHTML = html;
  var inp = document.getElementById("sq");
  inp.focus();
  var tm;
  inp.addEventListener("input", function () { clearTimeout(tm); tm = setTimeout(function () { history.replaceState(null, "", "#/search/" + encodeURIComponent(inp.value.trim())); run(inp.value.trim()); }, 350); });
  function run(q) {
    var res = document.getElementById("sres");
    if (!q || q.length < 2) { res.innerHTML = '<div class="empty">Type at least 2 characters.</div>'; return; }
    var lq = q.toLowerCase(), html = "";

    var dHits = DRIVERS.filter(function (d) {
      return d.name.toLowerCase().indexOf(lq) >= 0 || (d.aka || []).some(function (a) { return a.toLowerCase().indexOf(lq) >= 0; });
    }).slice(0, 6);
    if (dHits.length) {
      html += '<div class="sec"><div class="sec-head"><h2>Vigilantes</h2><div class="ln"></div></div><div class="grid g3">' +
        dHits.map(function (d) {
          return '<div class="driver-chip" onclick="location.hash=\'#/driver/' + d.id + '\'"><div class="d-ava">' + esc(initials(d.name)) + "</div><div><b>" + esc(d.name) + "</b><span>" + raceCountOf(d) + " broadcasts</span></div></div>";
        }).join("") + "</div></div>";
    }

    var rHits = RACES.filter(function (r) {
      return (r.name || r.title).toLowerCase().indexOf(lq) >= 0 || (r.track || "").toLowerCase().indexOf(lq) >= 0 || (r.seasonLabel || "").toLowerCase().indexOf(lq) >= 0;
    }).slice(0, 9);
    if (rHits.length) {
      html += '<div class="sec"><div class="sec-head"><h2>Races</h2><div class="ln"></div></div><div class="grid g3">' + rHits.map(raceCard).join("") + "</div></div>";
    }

    var mHits = [];
    RACES.forEach(function (r) {
      var d = DISTILLED[r.id]; if (!d) return;
      (d.moments || []).forEach(function (m) {
        if ((m.title + " " + (m.summary || "")).toLowerCase().indexOf(lq) >= 0) mHits.push([r, m]);
      });
    });
    if (mHits.length) {
      html += '<div class="sec"><div class="sec-head"><h2>Logged moments</h2><div class="ln"></div></div>' +
        mHits.slice(0, 12).map(function (p) { return momentRow(p[0], p[1], true); }).join("") + "</div>";
    }

    html += '<div class="sec"><div class="sec-head"><h2>On the tape</h2><div class="ln"></div></div>' +
      '<div class="load-note" id="dsNote">Warming up the tape machine…</div><div class="prog"><i id="dsBar"></i></div><div id="dsBox"></div></div>';

    res.innerHTML = html;
    deepScan([q], {
      prog: "dsBar", note: "dsNote", box: "dsBox", perRace: 3, max: 150,
      doneNote: function (hits, scanned) { return "Full archive scanned — " + hits + " mentions across " + scanned + " broadcasts."; }
    });
  }
  if (q) run(q);
}

/* ====================================================== SHOKKER LORE LABS */
function copyText(text, done) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, done);
  } else {
    var area = document.createElement("textarea");
    area.value = text; document.body.appendChild(area); area.select();
    try { document.execCommand("copy"); } catch (e) {}
    area.remove(); done();
  }
}
function shareCurrent(title) {
  var url = location.href;
  var text = title + " — found on the SHOKKER LORE VRL Living Wiki.";
  if (navigator.share) {
    navigator.share({ title: title, text: text, url: url }).catch(function () {});
  } else {
    copyText(text + " " + url, function () {
      var old = document.getElementById("shareToast"); if (old) old.remove();
      var el = document.createElement("div"); el.id = "shareToast"; el.className = "share-toast"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite");
      el.textContent = "LINK COPIED — SEND IT";
      document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2200);
    });
  }
}
window.__shareCurrent = shareCurrent;
window.__shareEncoded = function (encodedTitle) { shareCurrent(decodeURIComponent(encodedTitle || "VRL")); };
window.__shareMoment = function (id, t, encodedTitle) {
  var title = decodeURIComponent(encodedTitle || "VRL moment");
  var url = location.href.split("#")[0] + "#/race/" + id + "/t/" + Math.round(t || 0);
  var text = title + " — play the exact moment on SHOKKER LORE.";
  if (navigator.share) navigator.share({ title: title, text: text, url: url }).catch(function () {});
  else copyText(text + " " + url, function () {
    var old = document.getElementById("shareToast"); if (old) old.remove();
    var el = document.createElement("div"); el.id = "shareToast"; el.className = "share-toast"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite"); el.textContent = "MOMENT LINK COPIED";
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2200);
  });
};

window.__printWikiFile = function () {
  var detailStates = Array.prototype.map.call($app.querySelectorAll("details"), function (detail) {
    var state = { detail: detail, open: detail.open };
    detail.open = true;
    return state;
  });
  document.body.classList.add("printing-wiki-file");
  var restored = false;
  var restore = function () {
    if (restored) return;
    restored = true;
    detailStates.forEach(function (state) { state.detail.open = state.open; });
    document.body.classList.remove("printing-wiki-file");
  };
  window.addEventListener("afterprint", restore, { once: true });
  window.print();
};
window.__printRaceFile = window.__printWikiFile;

/* --------------------------------------------------------- TIME MACHINE */
var TimeMachineUI = (function () {
  var timer = null, currentId = null, currentSourceId = null, active = -1, switching = false;
  function machine() { return currentId ? TIME_MACHINE.races[currentId] : null; }
  function segmentFor(sourceId) {
    var segments = (machine() || {}).segments || [];
    for (var i = 0; i < segments.length; i++) if (segments[i].sourceId === sourceId) return segments[i];
    return segments[0] || { sourceId: currentId, offset: 0, duration: (machine() || {}).duration || 1 };
  }
  function stop() {
    if (timer) clearInterval(timer);
    timer = null; currentId = null; currentSourceId = null; active = -1; switching = false;
  }
  function seek(eventId, sourceId, sourceT) {
    currentId = eventId;
    sourceId = sourceId || eventId;
    sourceT = +(sourceT || 0);
    if (currentSourceId === sourceId) Player.play(sourceId, sourceT);
    else Player.loadInline("tmPlayerHost", sourceId, sourceT, true);
    currentSourceId = sourceId;
    sync(sourceT, sourceId);
  }
  function sync(sourceT, sourceId) {
    if (!currentId) return;
    var tm = machine(), segment = segmentFor(sourceId || currentSourceId);
    var programT = (segment.offset || 0) + Math.max(0, sourceT || 0);
    var duration = tm ? tm.duration : 1;
    var fill = document.getElementById("tmFill");
    if (fill) fill.style.width = Math.max(0, Math.min(100, programT / duration * 100)) + "%";
    var idx = -1;
    (tm.events || []).forEach(function (event, i) { if ((event.programT == null ? event.t : event.programT) <= programT + 2) idx = i; });
    if (idx === active) return;
    active = idx;
    Array.prototype.forEach.call(document.querySelectorAll(".tm-beat"), function (el, i) {
      el.classList.toggle("active", i === idx);
    });
    Array.prototype.forEach.call(document.querySelectorAll(".tm-dot"), function (el, i) {
      el.classList.toggle("passed", i <= idx);
      el.classList.toggle("active", i === idx);
    });
    var state = document.getElementById("tmGhostState");
    if (state) {
      if (idx >= 0) {
        var event = tm.events[idx];
        state.innerHTML = '<span>RECONSTRUCTED STATE · ' + Math.round(event.confidence * 100) + '% CONFIDENCE</span><b>' +
          esc(event.state) + '</b><em>' + esc(event.title) + '</em>';
      } else state.innerHTML = '<span>RECONSTRUCTED STATE</span><b>PRE-RACE / FORMATION</b><em>Waiting for the story to break.</em>';
    }
  }
  function mount(id) {
    stop(); currentId = id; active = -1;
    var tm = machine(), first = ((tm || {}).segments || [])[0] || { sourceId: id };
    currentSourceId = first.sourceId;
    Player.mountInline("tmPlayerHost", currentSourceId, 0, false);
    timer = setInterval(function () {
      var sourceT = Player.inlineTime();
      if (sourceT == null) return;
      sync(sourceT, currentSourceId);
      var segments = (machine() || {}).segments || [], currentIndex = -1;
      segments.forEach(function (segment, index) { if (segment.sourceId === currentSourceId) currentIndex = index; });
      var current = segments[currentIndex], next = segments[currentIndex + 1];
      if (!current || !next || switching || sourceT < current.duration - 1.5) return;
      switching = true; currentSourceId = next.sourceId;
      Player.loadInline("tmPlayerHost", next.sourceId, 0, true);
      sync(0, next.sourceId);
      setTimeout(function () { switching = false; }, 1800);
    }, 700);
  }
  return { mount: mount, stop: stop, seek: seek };
})();
window.__tmSeek = function (eventId, sourceId, sourceT) { TimeMachineUI.seek(eventId, sourceId, sourceT); };
window.__tmSpoilers = function () {
  var root = document.getElementById("tmRoot");
  if (!root) return;
  root.classList.toggle("spoilers-off");
  var button = document.getElementById("tmSpoilerBtn");
  if (button) button.textContent = root.classList.contains("spoilers-off") ? "REVEAL SPOILERS" : "HIDE SPOILERS";
};

function vTimeMachine(id) {
  var ids = TIME_MACHINE.topRaceIds || [];
  if (!id || !TIME_MACHINE.races[id]) id = ids[0];
  var race = byId(id), machine = TIME_MACHINE.races[id];
  if (!race || !machine) {
    $app.innerHTML = '<div class="wrap"><div class="empty">The Time Machine is warming up.</div></div>'; return;
  }
  var data = DISTILLED[id] || {};
  var html = '<div class="tm-root" id="tmRoot"><div class="wrap">' +
    '<div class="tm-mast"><div><div class="kicker">TOP 25 · BROADCAST-SYNCHRONIZED</div><h1>VRL <span>TIME MACHINE</span></h1>' +
    '<p>Don’t just watch the race. Move through its pressure points, see the reconstructed story-state, and jump to the instant the night changed. <strong>' +
    (machine.sourceCount > 1 ? machine.sourceCount + ' official source tapes are stitched into this complete event file.' : 'One official source tape anchors this event file.') + '</strong></p></div>' +
    '<div class="tm-rank"><b>#' + machine.rank + '</b><span>' + machine.score + ' EXCITEMENT</span></div></div>' +
    '<div class="tm-picker">' + ids.map(function (raceId) {
      var item = byId(raceId), tm = TIME_MACHINE.races[raceId];
      return '<a class="' + (raceId === id ? "on" : "") + '" href="#/time-machine/' + raceId + '"><b>#' + tm.rank + '</b><span>' +
        esc(item ? (item.name || item.title) : raceId) + '</span></a>';
    }).join("") + '</div>' +
    '<div class="tm-title"><div><span>' + esc(race.seasonLabel || "") + ' · ' + fmtDate(race.date) + '</span><h2>' +
    esc(race.name || race.title) + '</h2></div><div class="tm-actions"><button class="btn ghost" id="tmSpoilerBtn" onclick="__tmSpoilers()">HIDE SPOILERS</button>' +
    '<button class="btn ghost" onclick="__shareCurrent(\'VRL Time Machine · #' + machine.rank + '\')">SHARE MACHINE</button>' +
    '<a class="btn ghost" href="#/race/' + id + '">FULL RACE FILE</a></div></div>' +
    '<div class="tm-stage"><div class="player-16x9"><div id="tmPlayerHost"></div></div>' +
    '<div class="ghost-console"><div class="ghost-scan"></div><div id="tmGhostState"><span>RECONSTRUCTED STATE</span><b>PRE-RACE / FORMATION</b><em>Waiting for the story to break.</em></div>' +
    '<small>Ghost Telemetry Pilot · story-state inferred from curated broadcast evidence, not official sim telemetry.</small></div></div>' +
    '<div class="tm-line"><div class="tm-track"><i id="tmFill"></i>' +
    machine.events.map(function (event, i) {
      var eventSource = event.sourceId || id;
      var eventTime = event.sourceT == null ? event.t : event.sourceT;
      return '<button class="tm-dot k-' + esc(event.kind) + '" style="left:' + event.x + '%" title="' + esc(event.title) +
        '" aria-label="Play beat ' + (i + 1) + ': ' + esc(event.title) + '" onclick="__tmSeek(\'' + id + '\',\'' +
        eventSource + '\',' + eventTime + ')"><span>' + (i + 1) + '</span></button>';
    }).join("") + '</div><div class="tm-clock"><span>0:00</span><b>THE STORYLINE</b><span>' + fmtT(machine.duration) + '</span></div></div>' +
    (data.recap ? '<div class="recap tm-spoiler"><span class="k">The whole story</span>' + esc(data.recap) + '</div>' : '') +
    '<div class="tm-beats">' + machine.events.map(function (event, i) {
      var drivers = (event.tags || []).map(driverById).filter(Boolean).map(function (driver) { return driver.name; });
      var eventSource = event.sourceId || id;
      var eventTime = event.sourceT == null ? event.t : event.sourceT;
      var tapeLabel = event.sourceRole === "continuation" ? "CONTINUATION TAPE" : "PRIMARY TAPE";
      return '<button type="button" class="tm-beat tm-spoiler k-' + esc(event.kind) + '" onclick="__tmSeek(\'' + id + '\',\'' +
        eventSource + '\',' + eventTime + ')">' +
        '<div class="tm-beat-no">' + String(i + 1).padStart(2, "0") + '</div><div><span>' + fmtT(eventTime) + ' · ' + tapeLabel + ' · ' + esc(event.state) +
        '</span><h3>' + esc(event.title) + '</h3><p>' + esc(event.summary) + '</p>' +
        (drivers.length ? '<small>' + drivers.map(esc).join(" · ") + '</small>' : '') + '</div><b class="tm-heat">H' + event.heat + '</b></button>';
    }).join("") + '</div></div></div>';
  $app.innerHTML = html;
  TimeMachineUI.mount(id);
}

/* ----------------------------------------------------------- ASK THE TAPE */
function tapeSearch(q) {
  if (!window.VRLTapeEngine) {
    return { terms: [q], intent: { primary: "general", types: [] }, drivers: [], directAnswers: [], eventAnswers: [], knowledgeAnswers: [], ambiguities: [], results: [] };
  }
  return window.VRLTapeEngine.search(q, {
    races: RACES,
    distilled: DISTILLED,
    drivers: DRIVERS,
    evidence: LORE_EVIDENCE,
    entityRegistry: ENTITY_REGISTRY,
    resultTruth: RESULT_TRUTH,
    seasonChampions: SEASON_CHAMPIONS,
    driverDossiers: DRIVER_DOSSIERS
  });
}
function vTape(q) {
  q = decodeURIComponent(q || "").trim();
  var examples = ["Who looks strongest right now?", "Who was the Season 14 champion?", "Who drove the number 33?", "What race did Dillon Bryant win?", "Show me the biggest wrecks"];
  var html = '<div class="tape-page"><div class="wrap"><div class="tape-hero"><div class="kicker">NO HALLUCINATIONS · EVERY ANSWER PLAYS</div>' +
    '<h1>ASK <span>THE TAPE</span></h1><p>Ask VRL history a real question. The answer is built only from indexed race evidence and commentary, with the original timestamp attached.</p>' +
    '<div class="tape-ask"><input id="tapeQ" aria-label="Ask the VRL archive" value="' + esc(q) + '" placeholder="Ask: What was the wildest finish at Talladega?"><button onclick="__askTape()">ASK</button></div>' +
    '<div class="tape-examples">' + examples.map(function (example) { return '<button data-q="' + esc(example) + '">' + esc(example) + '</button>'; }).join("") + '</div></div>' +
    '<div id="tapeAnswer" role="region" aria-label="Tape answer" aria-live="polite">' + (!q ? '<div class="tape-idle"><b>THE ARCHIVE IS LISTENING</b><span>' + LORE_EVIDENCE.length + ' curated evidence records · ' + TR_INDEX.length + ' searchable broadcasts</span></div>' : '') + '</div></div></div>';
  $app.innerHTML = html;
  var input = document.getElementById("tapeQ");
  input.addEventListener("keydown", function (event) { if (event.key === "Enter") window.__askTape(); });
  Array.prototype.forEach.call(document.querySelectorAll(".tape-examples button"), function (button) {
    button.onclick = function () { input.value = button.getAttribute("data-q"); window.__askTape(); };
  });
  if (q) renderTapeAnswer(q);
}
function renderTapeAnswer(q) {
  history.replaceState(null, "", "#/tape/" + encodeURIComponent(q));
  var answer = document.getElementById("tapeAnswer"); if (!answer) return;
  var found = tapeSearch(q), rows = found.results || [], direct = found.directAnswers || [];
  var eventAnswers = found.eventAnswers || [], knowledge = found.knowledgeAnswers || [], ambiguities = found.ambiguities || [];
  var uniqueRaces = {}; rows.forEach(function (item) { uniqueRaces[item.race.id] = 1; });
  var html = "";
  var currentFormIntent = /\b(current season|season 15|right now|current form|recent form|lately|this season)\b/i.test(q) &&
    /\b(best|strongest|leading|leader|front|form|doing|running|rank|ranking|standings?)\b/i.test(q);
  if (currentFormIntent) {
    var formRows = currentFormRows(CURRENT_ROSTER).slice(0, 5);
    html += '<section class="tape-direct tape-current-form"><div class="tape-direct-head"><span>DIRECT CURRENT-FORM ANSWER · EXACT RESULT READS</span><h2>' +
      (formRows.length ? esc(formRows[0].member.name) + ' has the strongest classified three-race snapshot on the tape.' : 'Current-form evidence is not complete enough to answer yet.') +
      '</h2><p>Ordered by completed Season 15 result reads, then average finish, then best finish. This is not official VRL points or standings.</p></div>' +
      (formRows.length ? '<div class="tape-form-grid">' + formRows.map(function (row, index) {
        return '<article><b>#' + (index + 1) + '</b><div><span>#' + esc(row.member.number || "?") +
          ' · ' + row.starts + ' CLASSIFIED READS</span><h3>' + esc(row.member.name) + '</h3><p>Average ' +
          row.average.toFixed(1) + ' · best P' + row.best + ' · ' + row.topFive + ' top-five' +
          (row.topFive === 1 ? '' : 's') + '</p><div>' + row.appearances.map(function (appearance) {
            return '<button onclick="__playReceipt(\'' + appearance.sourceId + '\',' + appearance.t + ',' +
              appearance.end + ',\'CURRENT FORM RESULT\')">P' + appearance.position + ' · ' +
              esc(appearance.track) + '</button>';
          }).join("") + '</div><a href="#/driver/' + esc(row.member.driverId) + '">OPEN DRIVER DOSSIER →</a></div></article>';
      }).join("") + '</div><a class="tape-form-roster-link" href="#/drivers/current">OPEN THE COMPLETE CURRENT-SEASON BOARD →</a>' : '') +
      '<small class="tape-form-boundary">Missing broadcasts are not starts, DNFs, or zeroes. Every finish shown above opens the bounded official result read used in the calculation.</small></section>';
  }
  if (knowledge.length) {
    html += '<section class="tape-direct"><div class="tape-direct-head"><span>DIRECT ARCHIVE ANSWER · REVIEWED LEDGER</span></div><div class="tape-direct-grid">' +
      knowledge.map(function (item) {
        var play = item.race && item.record && item.record.t != null
          ? '<button onclick="__play(\'' + item.record.sourceId + '\',' + item.record.t + ')">▶ PLAY THE RECEIPT</button>'
          : '<div></div>';
        var route = item.race ? '<a href="#/race/' + item.race.id + '/t/' + item.record.t + '">OPEN EXACT SOURCE →</a>' : '';
        return '<article class="tape-direct-card">' + play + '<div><span>' + esc(item.label) + ' · ' + esc(String(item.confidence || "reviewed").toUpperCase()) +
          '</span><h3>' + esc(item.heading) + '</h3><p>' + esc(item.text || "") + '</p><small>' + esc(item.basis || "") + '</small>' + route + '</div></article>';
      }).join("") + '</div></section>';
  }
  if (eventAnswers.length) {
    html += '<section class="tape-direct"><div class="tape-direct-head"><span>DIRECT EVENT ANSWER · EXACT OFFICIAL RECEIPT</span></div>' +
      '<div class="tape-direct-grid">' + eventAnswers.map(function (item) {
        return '<article class="tape-direct-card"><button onclick="__play(\'' + item.race.id + '\',' + item.record.t + ')">▶ PLAY THE ANSWER</button>' +
          '<div><span>' + fmtDate(item.race.date) + ' · ' + esc(item.race.seasonLabel || "VRL") + ' · ' + fmtT(item.record.t) + '</span><h3>' +
          esc(item.winnerName) + ' won ' + esc(item.race.name || item.race.title) + '</h3><p>' + esc(item.record.text) +
          '</p><small>Confidence: ' + esc(item.resultConfidence) + ' · winner field and bounded finish receipt share this official source</small>' +
          '<a href="#/race/' + item.race.id + '/t/' + item.record.t + '">OPEN EXACT RACE RECEIPT →</a></div></article>';
      }).join("") + '</div></section>';
  }
  if (ambiguities.length) {
    html += '<section class="tape-direct ambiguity"><div class="tape-direct-head"><span>CLARIFICATION REQUIRED</span><h2>Unknown is better than a plausible wrong answer.</h2>' +
      ambiguities.map(function (item) { return '<p>' + esc(item.message) + '</p>'; }).join("") + '</div></section>';
  }
  if (found.intent && found.intent.types.indexOf("win") >= 0 && found.drivers.length) {
    var askedDriver = found.drivers[0], winCount = direct.length;
    html += '<section class="tape-direct"><div class="tape-direct-head"><span>OFFICIAL WINNER LEDGER</span><h2>' +
      (winCount
        ? esc(askedDriver.name) + " has " + winCount + " documented " + (winCount === 1 ? "victory" : "victories") + " in the eligible VRL archive."
        : "No full-race victory is currently recorded for " + esc(askedDriver.name) + ".") +
      '</h2><p>' + (winCount
        ? "This answers the question first. Supporting moments and raw booth testimony follow below."
        : "The tape may still contain stage wins, heat wins, near-misses, or references; those appear as supporting evidence below.") +
      '</p></div>';
    if (winCount) {
      var directWinCard = function (item) {
        return '<article class="tape-direct-card"><button onclick="__play(\'' + item.race.id + '\',' + item.record.t + ')">▶ PLAY THE WIN</button>' +
          '<div><span>' + fmtDate(item.race.date) + ' · ' + esc(item.race.seasonLabel || "VRL") + '</span><h3>' +
          esc(item.race.name || item.race.title) + '</h3><p>' + esc(item.record.text) + '</p><a href="#/race/' + item.race.id +
          '">OPEN COMPLETE RACE FILE →</a></div></article>';
      };
      html += '<div class="tape-direct-grid">' + direct.slice(0, 3).map(directWinCard).join("") + '</div>';
      if (direct.length > 3) {
        html += '<details class="tape-secondary-vault"><summary>SHOW ' + (direct.length - 3) +
          ' MORE DOCUMENTED WINS</summary><div class="tape-direct-grid">' +
          direct.slice(3).map(directWinCard).join("") + '</div></details>';
      }
    }
    html += '</section>';
  }
  var directNumberLookup = knowledge.some(function (item) { return item.type === "number"; });
  if (directNumberLookup) {
    html += '<div class="tape-verdict"><span>IDENTITY-SAFE ANSWER</span><h2>Only reviewed number-history receipts are shown.</h2>' +
      '<p>Generic booth uses of “number” are intentionally excluded so unrelated cars and drivers cannot muddy this answer.</p></div>';
    answer.innerHTML = html;
    return;
  }
  html += '<div class="tape-verdict"><span>' + ((direct.length || eventAnswers.length || knowledge.length || currentFormIntent) ? "SUPPORTING TAPE" : "EVIDENCE-BACKED ANSWER") + '</span><h2>' +
    (rows.length ? "The tape found " + rows.length + " strong moments across " + Object.keys(uniqueRaces).length + " race nights." : "The curated tape didn’t find a confident supporting moment yet.") +
    '</h2><p>' + (rows.length ? "Matches are ranked by named-driver identity, official results, question intent, moment type, and heat. Raw commentary corroboration continues underneath." : "Try a driver, track, incident, or phrase the booth may have used.") + '</p></div>';
  if (rows.length) {
    var tapeHit = function (item, i) {
      var record = item.record;
      return '<article class="tape-hit"><button onclick="__play(\'' + item.race.id + '\',' + record.t + ')"><b>▶ ' + fmtT(record.t) + '</b><span>PLAY EVIDENCE</span></button>' +
        '<div><span>#' + (i + 1) + ' · ' + esc(record.type).toUpperCase() + ' · ' + fmtDate(item.race.date) + '</span><h3>' + esc(record.title || item.race.name) +
        '</h3><p>' + esc(record.text || record.context || "") + '</p><a href="#/race/' + item.race.id + '">' + esc(item.race.name || item.race.title) + ' →</a></div>' +
        '<em>' + item.score + '</em></article>';
    };
    html += '<div class="tape-results">' + rows.slice(0, 3).map(tapeHit).join("") + '</div>';
    if (rows.length > 3) {
      html += '<details class="tape-secondary-vault"><summary>SHOW ' + (rows.length - 3) +
        ' MORE SUPPORTING MOMENTS</summary><div class="tape-results">' +
        rows.slice(3).map(function (item, index) { return tapeHit(item, index + 3); }).join("") +
        '</div></details>';
    }
  }
  if (ambiguities.length && !direct.length && !eventAnswers.length && !knowledge.length) {
    answer.innerHTML = html;
    return;
  }
  var scanTerms = [];
  (found.drivers || []).forEach(function (driver) {
    var parts = driver.name.toLowerCase().split(/\s+/);
    if (parts.length) scanTerms.push(parts[parts.length - 1]);
  });
  found.terms.forEach(function (term) {
    if (scanTerms.length < 5 && term.indexOf(" ") < 0 && term.length >= 4 && scanTerms.indexOf(term) < 0) scanTerms.push(term);
  });
  html += '<details class="tape-secondary-vault tape-raw-vault"><summary>OPEN RAW BOOTH TESTIMONY · ARCHIVE-WIDE CORROBORATION</summary>' +
    '<div class="sec"><div class="sec-head"><h2>Raw booth testimony</h2><div class="ln"></div></div>' +
    '<div class="load-note" id="tapeScanNote">Opening every transcript for corroborating testimony…</div><div class="prog"><i id="tapeScanBar"></i></div><div id="tapeScanBox"></div></div></details>';
  answer.innerHTML = html;
  deepScan(scanTerms.length ? scanTerms : [q], {
    prog: "tapeScanBar", note: "tapeScanNote", box: "tapeScanBox", perRace: 2, max: 80,
    doneNote: function (hits, scanned) { return "Corroboration complete — " + hits + " exact booth excerpts across " + scanned + " broadcasts."; }
  });
}
window.__askTape = function () {
  var input = document.getElementById("tapeQ"); if (!input || input.value.trim().length < 3) return;
  renderTapeAnswer(input.value.trim());
};

/* --------------------------------------------------------------- VRL MOVIE */
var MoviePlay = (function () {
  var queue = [], index = -1, timer = null;
  function stop() { if (timer) clearInterval(timer); timer = null; queue = []; index = -1; }
  function show() {
    if (!queue.length) return;
    var item = queue[index], race = item[0], moment = item[1];
    Player.play(race.id, moment.t || 0);
    Array.prototype.forEach.call(document.querySelectorAll(".movie-chapter"), function (el, i) { el.classList.toggle("playing", i === index); });
    var now = document.getElementById("movieNow");
    if (now) now.innerHTML = '<span>NOW PLAYING · CHAPTER ' + (index + 1) + ' OF ' + queue.length + '</span><b>' + esc(moment.title || "Booth gold") + '</b><em>' + esc(race.name || race.title) + '</em>';
  }
  function start(items) {
    stop(); queue = items; index = 0; show();
    timer = setInterval(function () {
      var item = queue[index], t = Player.dockTime();
      if (item && t != null && t >= (item[1].t || 0) + 42) next();
    }, 1000);
  }
  function next() { if (!queue.length) return; index = (index + 1) % queue.length; show(); }
  return { start: start, next: next, stop: stop };
})();
function movieCut(theme, count) {
  var all;
  if (theme === "booth") {
    all = LORE_EVIDENCE.filter(function (record) { return record.type === "booth"; }).sort(function (a, b) { return b.heat - a.heat; }).map(function (record) {
      return [byId(record.raceId), { t: record.t, title: "“" + record.text + "”", summary: record.context, kind: "booth", heat: record.heat }];
    }).filter(function (item) { return item[0]; });
  } else {
    all = hot100().map(function (item) { return [item[0], item[1]]; });
    if (theme === "chaos") all = all.filter(function (item) { return item[1].kind === "wreck"; });
    if (theme === "finish") all = all.filter(function (item) { return item[1].kind === "finish"; });
    if (theme === "rivalry") all = all.filter(function (item) { return (item[1].tags || []).length >= 2; });
  }
  var seen = {}, out = [];
  all.forEach(function (item) {
    if (out.length >= count || seen[item[0].id]) return;
    seen[item[0].id] = 1; out.push(item);
  });
  return out;
}
function vMovie(theme, length) {
  theme = theme || "ultimate"; length = +(length || 10);
  var cut = movieCut(theme, length);
  window.__movieQueue = cut;
  var names = { ultimate: "The Ultimate Outlaw Cut", chaos: "The Big One", finish: "To the Stripe", rivalry: "Shared-Tape Cut", booth: "The Booth Goes Nuclear" };
  var html = '<div class="movie-page"><div class="movie-grain"></div><div class="wrap"><div class="movie-mast"><span>A SHOKKER LORE INTERACTIVE FILM</span><h1>VRL: <em>' +
    esc(names[theme] || names.ultimate) + '</em></h1><p>A living documentary assembled from the original broadcasts. Every screening is made of real race moments and returns to the source tape.</p></div>' +
    '<div class="movie-controls"><label>DIRECTOR’S CUT<select id="movieTheme"><option value="ultimate">Ultimate Outlaw</option><option value="chaos">Chaos</option><option value="finish">Closest Finishes</option><option value="rivalry">Shared Tape</option><option value="booth">Booth Gold</option></select></label>' +
    '<label>RUNTIME<select id="movieLength"><option value="6">Trailer · 6 scenes</option><option value="10">Feature · 10 scenes</option><option value="16">Epic · 16 scenes</option></select></label>' +
    '<button class="btn" onclick="__movieStart()">▶ START THE FILM</button><button class="btn ghost" onclick="__shareCurrent(\'VRL Movie · ' + esc(names[theme]).replace(/'/g, "\\'") + '\')">SHARE CUT</button></div>' +
    '<div class="movie-now" id="movieNow"><span>READY TO SCREEN</span><b>' + cut.length + ' CHAPTERS LOADED</b><em>Hit start. The archive takes it from there.</em></div>' +
    '<div class="movie-reel">' + cut.map(function (item, i) {
      return '<article class="movie-chapter" onclick="__play(\'' + item[0].id + '\',' + item[1].t + ')"><div class="movie-frame"><img src="' +
        esc(item[0].thumb) + '" alt=""><span>' + String(i + 1).padStart(2, "0") + '</span><b>▶ ' + fmtT(item[1].t) + '</b></div><div><small>' +
        esc(item[1].kind || "moment").toUpperCase() + ' · ' + fmtDate(item[0].date) + '</small><h3>' + esc(item[1].title) + '</h3><p>' +
        esc(item[1].summary || "") + '</p><em>' + esc(item[0].name || item[0].title) + '</em></div></article>';
    }).join("") + '</div></div></div>';
  $app.innerHTML = html;
  document.getElementById("movieTheme").value = theme;
  document.getElementById("movieLength").value = String(length);
  function change() { go("#/movie/" + document.getElementById("movieTheme").value + "/" + document.getElementById("movieLength").value); }
  document.getElementById("movieTheme").onchange = change;
  document.getElementById("movieLength").onchange = change;
}
window.__movieStart = function () { MoviePlay.start(window.__movieQueue || []); };
window.__movieNext = function () { MoviePlay.next(); };

/* -------------------------------------------------- COMMUNITY MEMORY WALL */
var MEMORY_KEY = "shokker-vrl-community-memory-v1";
function memories() { try { return JSON.parse(localStorage.getItem(MEMORY_KEY) || "[]"); } catch (e) { return []; } }
function memoryWallHtml(raceId) {
  var list = memories().filter(function (item) { return !raceId || item.raceId === raceId; }).slice().reverse();
  if (!list.length) return '<div class="memory-empty">No fan memory has been pinned on this device yet. Be the first witness.</div>';
  return '<div class="memory-wall">' + list.slice(0, 40).map(function (item) {
    var race = byId(item.raceId);
    return '<article><span>“</span><p>' + esc(item.text) + '</p><b>' + esc(item.name || "Anonymous fan") + '</b>' +
      (race ? '<a href="#/race/' + race.id + '">' + esc(race.name || race.title) + '</a>' : '') + '<small>' + fmtDate(item.date) + '</small></article>';
  }).join("") + '</div>';
}
window.__memoryOpen = function (raceId) {
  var old = document.getElementById("memoryModal"); if (old) old.remove();
  var races = R_NEWEST.slice(0, 40);
  var modal = document.createElement("div"); modal.id = "memoryModal"; modal.className = "memory-modal";
  modal.innerHTML = '<div class="memory-sheet"><button class="memory-x" onclick="document.getElementById(\'memoryModal\').remove()">×</button>' +
    '<div class="kicker">COMMUNITY MEMORY</div><h2>PIN YOUR MEMORY TO THE TAPE</h2><p>What do you still remember? A move, a call, a feeling in the Discord. This pilot saves memories on this device and lets you export them.</p>' +
    '<label>YOUR NAME OR HANDLE<input id="memoryName" maxlength="60" placeholder="Anonymous fan"></label>' +
    '<label>RACE<select id="memoryRace">' + races.map(function (race) { return '<option value="' + race.id + '"' + (race.id === raceId ? " selected" : "") + '>' + esc(race.name || race.title) + ' · ' + fmtDate(race.date) + '</option>'; }).join("") + '</select></label>' +
    '<label>THE MEMORY<textarea id="memoryText" maxlength="500" placeholder="I knew the whole race had changed when…"></textarea></label>' +
    '<button class="btn" onclick="__memorySave()">PIN IT TO THE WALL</button><small>Local-first pilot: nothing is uploaded. Export the memory book whenever you want.</small></div>';
  document.body.appendChild(modal);
};
window.__memorySave = function () {
  var textEl = document.getElementById("memoryText"), raceEl = document.getElementById("memoryRace");
  if (!textEl || textEl.value.trim().length < 4) return;
  var list = memories();
  list.push({ id: Date.now(), name: (document.getElementById("memoryName").value || "Anonymous fan").trim(), raceId: raceEl.value, text: textEl.value.trim(), date: new Date().toISOString().slice(0, 10) });
  localStorage.setItem(MEMORY_KEY, JSON.stringify(list));
  document.getElementById("memoryModal").remove();
  var box = document.getElementById("raceMemoryBox");
  if (box) box.innerHTML = '<div class="sec"><div class="sec-head"><h2>Community memory</h2><div class="ln"></div></div>' + memoryWallHtml(raceEl.value) + '</div>';
  var wall = document.getElementById("galaxyMemory"); if (wall) wall.innerHTML = memoryWallHtml();
};
window.__memoryExport = function () {
  var blob = new Blob([JSON.stringify({ product: "SHOKKER LORE", show: "VRL", exported: new Date().toISOString(), memories: memories() }, null, 2)], { type: "application/json" });
  var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "vrl-community-memory.json"; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
};

/* ------------------------------------------------------------ LORE GALAXY */
var Galaxy = (function () {
  var canvas = null, ctx = null, points = [], raf = null, resizeFn = null, hover = -1;
  function stop() { if (raf) cancelAnimationFrame(raf); raf = null; if (resizeFn) window.removeEventListener("resize", resizeFn); resizeFn = null; canvas = null; points = []; }
  function mount() {
    stop(); canvas = document.getElementById("loreCanvas"); if (!canvas) return; ctx = canvas.getContext("2d");
    function layout() {
      var box = canvas.getBoundingClientRect(), ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(box.width * ratio); canvas.height = Math.round(box.height * ratio); ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      var w = box.width, h = box.height, cx = w / 2, cy = h / 2;
      var drivers = LORE_GRAPH.nodes.filter(function (node) { return node.type === "driver"; });
      var tracks = LORE_GRAPH.nodes.filter(function (node) { return node.type === "track"; });
      points = [];
      tracks.forEach(function (node, i) {
        var a = Math.PI * 2 * i / Math.max(tracks.length, 1) - Math.PI / 2;
        points.push({ node: node, x: cx + Math.cos(a) * Math.min(w, h) * .18, y: cy + Math.sin(a) * Math.min(w, h) * .18, r: 8 + node.weight / 2 });
      });
      drivers.forEach(function (node, i) {
        var ring = i % 2 ? .39 : .47, a = Math.PI * 2 * i / Math.max(drivers.length, 1) + (i % 2) * .08;
        points.push({ node: node, x: cx + Math.cos(a) * Math.min(w, h) * ring, y: cy + Math.sin(a) * Math.min(w, h) * ring, r: 3 + Math.min(7, node.weight / 3) });
      });
      draw();
    }
    function draw() {
      if (!canvas) return;
      var w = canvas.getBoundingClientRect().width, h = canvas.getBoundingClientRect().height, map = {};
      points.forEach(function (point, i) { map[point.node.id] = point; point._i = i; });
      ctx.clearRect(0, 0, w, h);
      var glow = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.min(w, h) * .55);
      glow.addColorStop(0, "rgba(61,107,179,.14)"); glow.addColorStop(.6, "rgba(232,48,42,.035)"); glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      LORE_GRAPH.edges.forEach(function (edge) {
        var a = map[edge.a], b = map[edge.b]; if (!a || !b) return;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = edge.type === "track-story" ? "rgba(244,196,48,.12)" : "rgba(110,154,224,.08)";
        ctx.lineWidth = Math.min(2.2, .25 + edge.weight / 80); ctx.stroke();
      });
      points.forEach(function (point, i) {
        var isTrack = point.node.type === "track", hot = i === hover;
        ctx.beginPath(); ctx.arc(point.x, point.y, point.r + (hot ? 4 : 0), 0, Math.PI * 2);
        ctx.fillStyle = isTrack ? "#F4C430" : (hot ? "#FF4B44" : "#6E9AE0"); ctx.fill();
        if (isTrack || hot || point.node.weight >= 12) {
          ctx.font = (isTrack ? "700 12px " : "600 10px ") + "Barlow, sans-serif";
          ctx.fillStyle = hot ? "#fff" : (isTrack ? "#F4C430" : "#aeb9d1");
          ctx.textAlign = "center"; ctx.fillText(point.node.label, point.x, point.y - point.r - 7);
        }
      });
    }
    canvas.onmousemove = function (event) {
      var rect = canvas.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top, found = -1;
      points.forEach(function (point, i) { if (Math.hypot(x - point.x, y - point.y) <= point.r + 8) found = i; });
      if (found !== hover) { hover = found; canvas.style.cursor = found >= 0 ? "pointer" : "grab"; draw(); }
    };
    canvas.onclick = function () { if (hover >= 0 && points[hover].node.href) go(points[hover].node.href); };
    resizeFn = layout; window.addEventListener("resize", resizeFn); layout();
  }
  return { mount: mount, stop: stop };
})();
function vGalaxy() {
  var html = '<div class="galaxy-page"><div class="wrap"><div class="galaxy-head"><div><div class="kicker">PEOPLE · TRACKS · SHARED TAPE · MEMORY</div><h1>THE LORE <span>GALAXY</span></h1><p>Gold suns are tracks. Blue stars are drivers. Lines show shared-tape co-occurrence or driver-tagged track stories; they do not prove a relationship, rivalry, influence, or causality.</p></div>' +
    '<div class="galaxy-count"><b>' + LORE_GRAPH.nodes.length + '</b><span>STORY NODES</span><b>' + LORE_GRAPH.edges.length + '</b><span>CONNECTIONS</span></div></div>' +
    '<div class="galaxy-shell"><canvas id="loreCanvas"></canvas><div class="galaxy-key"><span><i class="track"></i>TRACK</span><span><i></i>DRIVER</span><small>Hover to identify · click to explore</small></div></div>' +
    '<div class="sec"><div class="sec-head"><h2>Community memory wall</h2><div class="ln"></div><span class="more">LOCAL-FIRST PILOT</span></div>' +
    '<p class="page-sub">The official record tells us what happened. The people who were there tell us what it meant.</p><div class="memory-actions"><button class="btn" onclick="__memoryOpen(\'' + (R_NEWEST[0] || {}).id + '\')">PIN A MEMORY</button>' +
    '<button class="btn ghost" onclick="__memoryExport()">EXPORT MEMORY BOOK</button></div><div id="galaxyMemory">' + memoryWallHtml() + '</div></div></div></div>';
  $app.innerHTML = html; Galaxy.mount();
}

/* -------------------------------------------------------- SALES SHOWCASE */
var DEMO_STEPS = [
  { n: "01", title: "Ask a century of tape a question", text: "Natural-language discovery returns exact, playable evidence—not a made-up answer.", href: "#/tape", cta: "ASK THE TAPE" },
  { n: "02", title: "Enter the race instead of opening a video", text: "Time Machine turns a two-hour broadcast into a synchronized, navigable story.", href: "#/time-machine", cta: "ENTER TIME MACHINE" },
  { n: "03", title: "Give every archive identity a front door", text: "Driver Dossiers give " + DRIVERS.length + " canonical identities a reviewable story, number history, voice, and tape receipts while keeping confirmed starts unknown.", href: "#/hall", cta: "OPEN DRIVER DOSSIERS" },
  { n: "04", title: "Let the archive direct its own documentary", text: "VRL Movie assembles interactive cuts from the best original moments.", href: "#/movie", cta: "SCREEN THE MOVIE" },
  { n: "05", title: "Turn history into a place", text: "Lore Galaxy maps disclosed shared-tape co-occurrence and invites the community to remember without authenticating relationships.", href: "#/galaxy", cta: "EXPLORE THE GALAXY" },
  { n: "06", title: "Make the booth a character in the story", text: "Booth Lore catches reviewed praise/adverse-event pairs, reviewed prediction/payoff pairs, and rollover candidates—then plays the bounded evidence back-to-back without claiming causality.", href: "#/booth-lore", cta: "HEAR THE BOOTH LORE" },
  { n: "07", title: "Publish the memory after every race", text: "Vigilante Scene turns each completed race into a source-linked weekly paper, while Vigilante Flashback preserves each finished season as a long-form yearbook.", href: "#/scene", cta: "OPEN THE VIGILANTE PRESS" },
  { n: "08", title: "Make uncertainty easy to correct", text: "Visual Garage turns ambiguous vehicle frames into a source-linked, exportable human review queue instead of pretending machine vision is certain.", href: "#/visual-garage", cta: "OPEN THE VISUAL GARAGE" }
];
function vShowcase(step) {
  step = Math.max(0, Math.min(DEMO_STEPS.length - 1, +(step || 0)));
  var hours = Math.round(RACES.reduce(function (sum, race) { return sum + (race.duration || 0); }, 0) / 3600);
  var reelProof = HIGHLIGHT_REELS.summary || {};
  var resultProof = RESULT_TRUTH.summary || {};
  var html = '<div class="showcase-page"><div class="showcase-hero"><div class="wrap"><div class="kicker">SHOKKER LORE · THE CHANNEL BECOMES A WORLD</div>' +
    '<h1>YOUTUBE IS THE TAPE.<br><span>THIS IS THE UNIVERSE.</span></h1><p>' + CANONICAL_COUNT + ' canonical Wednesday events across ' + RACES.length + ' official source broadcasts. ' + DRIVERS.length + ' driver dossiers. ' + hours + '+ hours of history, all wired back to the tape.</p>' +
    '<div><a class="btn" href="#/showcase/0">START THE 90-SECOND TOUR</a><button class="btn ghost" onclick="__shareCurrent(\'SHOKKER LORE · VRL Living Wiki\')">SHARE THE DEMO</button></div></div></div>' +
    '<div class="wrap"><div class="showcase-proof"><div><b>' + CANONICAL_COUNT + '</b><span>CANONICAL EVENTS</span></div><div><b>' + RACES.length + '</b><span>OFFICIAL SOURCES</span></div><div><b>' +
    allMoments().length + '</b><span>CURATED MOMENTS</span></div><div><b>' + LORE_EVIDENCE.length + '</b><span>EVIDENCE RECORDS</span></div><div><b>' + DRIVERS.length + '</b><span>DRIVER STORIES</span></div></div>' +
    '<div class="demo-deck"><div class="demo-nav">' + DEMO_STEPS.map(function (item, i) { return '<a class="' + (i === step ? "on" : "") + '" href="#/showcase/' + i + '"><b>' + item.n + '</b><span>' + esc(item.title) + '</span></a>'; }).join("") + '</div>' +
    '<div class="demo-screen"><span>LIVE PRODUCT TOUR · ' + DEMO_STEPS[step].n + ' / ' + String(DEMO_STEPS.length).padStart(2, "0") + '</span><h2>' + esc(DEMO_STEPS[step].title) + '</h2><p>' + esc(DEMO_STEPS[step].text) + '</p>' +
    '<a class="btn" href="' + DEMO_STEPS[step].href + '">' + DEMO_STEPS[step].cta + ' →</a>' +
    (step < DEMO_STEPS.length - 1 ? '<a class="demo-next" href="#/showcase/' + (step + 1) + '">NEXT CHAPTER →</a>' : '<a class="demo-next" href="#/showcase/0">RUN IT AGAIN ↻</a>') + '</div></div>' +
    partnerBand() + '<div class="sec"><div class="sec-head"><h2>One engine. Every kind of fandom.</h2><div class="ln"></div></div><div class="universal-grid">' +
    '<article><span>01</span><h3>INGEST THE CANON</h3><p>Episodes, broadcasts, streams, shorts, podcasts, or seasons become one clean, scoped archive.</p></article>' +
    '<article><span>02</span><h3>LEARN THE SHOW’S DNA</h3><p>Races become finishes, strategy, and shared-tape stories. Movie podcasts become hot takes, running gags, rankings, and watchalong lore.</p></article>' +
    '<article><span>03</span><h3>MAKE THE AUDIENCE MATTER</h3><p>Every person, topic, quote, and memory gets a door into the world—then links back to the original creator.</p></article>' +
    '<article><span>04</span><h3>SELL AN EXPERIENCE</h3><p>Not another video list: a white-label, sponsor-ready destination leagues and channels can own.</p></article></div></div>' +
    '<section class="league-offer"><div class="league-offer-head"><span>WHITE-LABEL LEAGUE PILOT</span><h2>START WITH A USEFUL ARCHIVE. EARN THE UNIVERSE.</h2><p>A narrow, caption-ready single-feed build with explicit canon rules, a correction authority, and exact-source acceptance checks. Traffic, revenue, retention, SEO rank, and virality are never promised.</p></div>' +
    '<div class="league-package-grid"><article><span>LEAGUE LORE STARTER</span><b>$250</b><h3>THE CORE RACING ARCHIVE</h3><ul><li>Usable public race catalog</li><li>Canonical event and source split</li><li>Exact official-source playback</li><li>League brand and sponsor layer</li><li>One bounded correction pass</li></ul></article>' +
    '<article class="featured"><span>LEAGUE LORE PLUS</span><b>$500</b><h3>DEEPER RECORDS + ONE SIGNATURE FEATURE</h3><ul><li>Everything in Starter</li><li>Deeper race and driver records</li><li>One signature interaction such as Ask, Time Machine, or Booth Lore</li><li>Evidence and unknown-state QA</li><li>Public demo / acceptance route</li></ul></article></div>' +
    '<div class="league-care"><div><span>ENTRY / $25 MONTH</span><p>Hosting and up to four automated normal-format updates.</p></div><div><span>WEEKLY / $50 MONTH</span><p>Up to four lightly curated updates plus a moment and clip shortlist.</p></div><div><span>STUDIO / $100 MONTH</span><p>Up to twelve updates, deeper clip queue, and priority corrections.</p></div></div>' +
    '<section class="league-acceptance"><div class="league-acceptance-head"><div><span>LIVE VRL ACCEPTANCE PADDOCK</span><h3>DON’T BUY THE PROMISE. TEST THE PRODUCT.</h3><p>These are observable checks on this deployment—not projected business outcomes.</p></div><b>7 / 7<small>PUBLIC CHECKS</small></b></div><div class="league-acceptance-grid">' +
    '<a href="#/highlights"><i>PASS</i><b>' + (reelProof.reelCount || 0) + ' / ' + CANONICAL_COUNT + '</b><span>canonical events have exact-source highlight reels</span><small>' + (reelProof.cutCount || 0) + ' cuts · first and final lap retained</small></a>' +
    '<a href="#/highlights"><i>PASS</i><b>' + (reelProof.cautionCallsCovered || 0) + ' / ' + (reelProof.cautionCallsDetected || 0) + '</b><span>detected caution calls are represented</span><small>' + (reelProof.replayExtendedIncidentCount || 0) + ' incident windows extend through replay analysis</small></a>' +
    '<a href="#/results"><i>PASS</i><b>' + (resultProof.supportedWinnerClaimCount || 0) + ' / ' +
    (resultProof.winnerClaimCount || 0) + '</b><span>source-level P1 claims have same-source position language</span><small>every ordinary event has an event-level P1; the sole source-claim gap is an excluded qualifier final / ' +
    (resultProof.sourceWithResultRundownCount || 0) + ' bounded finishing-order reads</small></a>' +
    '<a href="#/hall"><i>PASS</i><b>' + DRIVERS.length + '</b><span>canonical driver dossiers are public</span><small>aliases merge visibly; unsupported starts remain unknown</small></a>' +
    '<a href="#/scene"><i>PASS</i><b>' + sceneIssues().length + ' + ' + flashbackAnnuals().length + '</b><span>weekly Scene issues and completed-season Flashbacks are published</span><small>' + (VIGILANTE_PUBLICATIONS.summary.receiptCount || 0) + ' bounded publication receipt routes</small></a>' +
    '<a href="#/corrections"><i>PASS</i><b>' + ((ENTITY_REGISTRY.corrections || []).length) + '</b><span>owner corrections have a visible ripple trail</span><small>identity edits stay reviewable instead of silently rewriting tape</small></a>' +
    '<a href="#/results"><i>PASS</i><b>16</b><span>out-of-scope uploads remain excluded</span><small>Monday, Friday, and crossover material cannot leak into official records</small></a>' +
    '</div><p class="league-acceptance-note"><b>Pilot acceptance:</b> the scoped catalog loads; every public moment opens its official source at an exact time; exclusions survive rankings and Ask; aliases resolve to one identity; unsupported facts say unknown; mobile playback exposes a YouTube recovery path.</p></section>' +
    '<div class="league-offer-actions"><button class="btn" id="pilotBriefBtn" onclick="__copyPilotBrief()">COPY PILOT BRIEF</button><a class="btn ghost" href="#/showcase/0">RUN THE VRL DEMO PATH</a></div><small>Normal scope assumes usable captions, one primary public feed, client-supplied brand assets and canon rules, clear approval authority, and defined revision limits. Manual transcription, unusual integrations, and unsupported-data research are quoted separately.</small></section>' +
    '<div class="showcase-close"><span>BUILT AROUND THE PEOPLE WHO MADE VRL HISTORY</span><h2>YOUR BACK CATALOG ISN’T OLD CONTENT.<br>IT’S A LIVING RACING UNIVERSE.</h2><a class="btn" href="#/time-machine">ENTER TIME MACHINE</a> <a class="btn ghost" href="#/hall">OPEN DRIVER DOSSIERS</a></div></div></div>';
  $app.innerHTML = html;
}
window.__copyPilotBrief = function () {
  var brief = [
    "SHOKKER LORE — SIM RACING LEAGUE PILOT",
    "",
    "League Lore Starter — $250 one time",
    "Usable public catalog, canonical race/source split, exact official-source playback, league branding, and one bounded correction pass.",
    "",
    "League Lore Plus — $500 one time",
    "Everything in Starter, deeper race/driver records, one signature interaction, evidence QA, and a public acceptance route.",
    "",
    "Acceptance checks: complete scoped catalog; exact-source playback; enforced exclusions; reviewable aliases/corrections; explicit unknown states; mobile recovery path.",
    "",
    "Ongoing: Entry $25/month; Weekly $50/month; Studio $100/month.",
    "",
    "Normal scope: caption-ready single public feed; league supplies brand assets, canon rules, official data, corrections, and approval authority. No traffic, revenue, SEO, retention, or virality claims."
  ].join("\n");
  var button = document.getElementById("pilotBriefBtn");
  function done() {
    if (!button) return;
    button.textContent = "PILOT BRIEF COPIED";
    setTimeout(function () { if (button) button.textContent = "COPY PILOT BRIEF"; }, 2200);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(brief).then(done).catch(function () {});
  } else {
    var area = document.createElement("textarea");
    area.value = brief; document.body.appendChild(area); area.select();
    try { document.execCommand("copy"); done(); } catch (e) {}
    area.remove();
  }
};

/* ----------------------------------------------------------- BOOTH LORE */
function boothDriverLinks(names) {
  return (names || []).slice(0, 6).map(function (name) {
    var profile = DRIVERS.find(function (driver) { return driver.name === name; });
    return profile
      ? '<a href="#/driver/' + encodeURIComponent(profile.id) + '">' + esc(name) + '</a>'
      : '<span>' + esc(name) + '</span>';
  }).join("");
}
function boothGap(seconds) {
  seconds = Math.max(0, Math.round(seconds || 0));
  if (seconds < 60) return seconds + " seconds later";
  var minutes = Math.floor(seconds / 60), remain = seconds % 60;
  return minutes + "m " + (remain ? remain + "s " : "") + "later";
}
function boothPairCard(item, category) {
  var r = byId(item.raceId);
  var curse = category === "curse";
  var setupLabel = curse ? "THE PRAISE" : "THE CALL";
  var payoffLabel = curse ? "THE PAIN" : "THE PAYOFF";
  return '<article class="booth-pair ' + category + '">' +
    '<div class="booth-pair-head"><div><span>' + (curse ? "ANNOUNCER&#39;S CURSE" : "THE GREAT CARNAC") +
    '</span><h3>' + esc(item.title) + '</h3></div><b>' + boothGap(item.delay) + '</b></div>' +
    '<p class="booth-verdict">' + esc(item.verdict) + '</p>' +
    '<div class="booth-flow"><div class="booth-clip"><span>' + setupLabel + ' · ' + fmtT(item.setup.t) +
    '</span><blockquote>“' + esc(item.setup.quote) + '”</blockquote><button onclick="__play(\'' +
    item.raceId + '\',' + item.setup.t + ')">▶ PLAY SETUP</button></div>' +
    '<div class="booth-arrow"><i></i><b>' + boothGap(item.delay).toUpperCase() + '</b><i></i></div>' +
    '<div class="booth-clip payoff"><span>' + payoffLabel + ' · ' + fmtT(item.payoff.t) +
    '</span><blockquote>“' + esc(item.payoff.quote) + '”</blockquote><button onclick="__play(\'' +
    item.raceId + '\',' + item.payoff.t + ')">▶ PLAY PAYOFF</button></div></div>' +
    '<div class="booth-pair-foot"><div><a href="#/race/' + item.raceId + '">' +
    esc(r ? (r.name || r.title) : item.raceId) + '</a><small>' + (r ? fmtDate(r.date) : "") +
    '</small></div><div class="booth-drivers">' + boothDriverLinks(item.drivers) + '</div>' +
    '<button class="btn" onclick="__playSequence(\'' + item.raceId + '\',' + item.setup.t + ',' +
    item.setup.end + ',' + item.payoff.t + ',' + item.payoff.end + ',\'' + setupLabel + '\',\'' +
    payoffLabel + '\')">▶ PLAY BOTH CLIPS</button></div></article>';
}
function boothUpsideCard(item) {
  var r = byId(item.raceId);
  return '<article class="booth-up"><div class="booth-up-time"><b>' + fmtT(item.t) +
    '</b><span>' + esc(item.phrase).toUpperCase() + '</span></div><h3>' + esc(item.title) +
    '</h3><blockquote>“' + esc(item.quote) + '”</blockquote><div class="booth-drivers">' +
    boothDriverLinks(item.drivers) + '</div><div class="booth-up-foot"><a href="#/race/' +
    item.raceId + '">' + esc(r ? (r.name || r.title) : item.raceId) + '</a><button onclick="__play(\'' +
    item.raceId + '\',' + item.t + ')">▶ PLAY CANDIDATE RECEIPT</button></div></article>';
}
function vBoothLore(active) {
  active = active || "all";
  if (["all", "curse", "carnac", "upside-down"].indexOf(active) < 0) active = "all";
  var curse = BOOTH_LORE.curse || [], carnac = BOOTH_LORE.carnac || [], upside = BOOTH_LORE.upsideDown || [];
  var raceSet = {};
  curse.concat(carnac, upside).forEach(function (item) { raceSet[item.raceId] = 1; });
  var tabs = [
    ["all", "ALL BOOTH LORE", curse.length + carnac.length + upside.length],
    ["curse", "ANNOUNCER'S CURSE", curse.length],
    ["carnac", "THE GREAT CARNAC", carnac.length],
    ["upside-down", "UPSIDE DOWN CANDIDATES", upside.length]
  ];
  var html = '<div class="booth-page"><section class="booth-hero"><div class="wrap">' +
    '<div class="kicker">THE TAPE HEARD EVERYTHING</div><h1>THE BOOTH ALWAYS KNOWS.<br><span>UNTIL IT DOESN&#39;T.</span></h1>' +
    '<p>Praise that detonates on contact. Predictions that make the announcers look psychic. Rollover-language candidates waiting for visual review. Every exhibit is wired to the original eligible official broadcast.</p>' +
    '<div class="booth-scoreboard"><div><b>' + curse.length + '</b><span>CURSES CAUGHT</span></div><div><b>' +
    carnac.length + '</b><span>PROPHECIES FULFILLED</span></div><div><b>' + upside.length +
    '</b><span>ROLLOVER CANDIDATES</span></div><div><b>' + Object.keys(raceSet).length +
    '</b><span>RACE FILES</span></div></div></div></section><div class="wrap">' +
    '<nav class="booth-tabs">' + tabs.map(function (tab) {
      return '<a class="' + (active === tab[0] ? "on" : "") + '" href="#/booth-lore' +
        (tab[0] === "all" ? "" : "/" + tab[0]) + '"><span>' + tab[1] + '</span><b>' + tab[2] + '</b></a>';
    }).join("") + '</nav>';

  if (active === "all" || active === "curse") {
    html += '<section class="booth-section"><div class="booth-section-head"><span>01</span><div><h2>THE ANNOUNCER&#39;S CURSE</h2>' +
      '<p>A reviewed positive booth call followed by a bounded adverse event within 90 seconds. The sequence is chronology, not a claim that the praise caused anything.</p></div></div><div class="booth-pair-list">' +
      curse.map(function (item) { return boothPairCard(item, "curse"); }).join("") + '</div></section>';
  }
  if (active === "all" || active === "carnac") {
    html += '<section class="booth-section"><div class="booth-section-head"><span>02</span><div><h2>THE GREAT CARNAC</h2>' +
      '<p>A reviewed prediction followed later in the same official broadcast by a matching outcome. Hit play to compare the two bounded receipts; chronology is not causality.</p></div></div><div class="booth-pair-list">' +
      carnac.map(function (item) { return boothPairCard(item, "carnac"); }).join("") + '</div></section>';
  }
  if (active === "all" || active === "upside-down") {
    html += '<section class="booth-section"><div class="booth-section-head"><span>03</span><div><h2>UPSIDE DOWN · VISUAL REVIEW QUEUE</h2>' +
      '<p>On the roof. On the lid. End over end. Phrase evidence plus a nearby authored incident creates a candidate, never automatic visual truth. Every row below remains pending frame review.</p></div></div><div class="booth-up-grid">' +
      upside.map(boothUpsideCard).join("") + '</div></section>';
  }
  html += '<div class="booth-method"><b>HOW THIS WAS BUILT</b><p>' +
    esc((BOOTH_LORE.methodology || {}).scope || "") + ' ' +
    esc((BOOTH_LORE.methodology || {}).pairedEditorial || "") + ' ' +
    esc((BOOTH_LORE.methodology || {}).upsideDetector || "") +
    '</p></div></div></div>';
  $app.innerHTML = html;
}

function vMore() {
  var links = [
    ["#/watch", "What Should I Watch?", "Pick a racing mood and get an explainable, receipt-backed race recommendation."],
    ["#/scene", "Vigilante Scene", "The current season reported race by race as an original evidence-linked weekly paper."],
    ["#/flashback", "Vigilante Flashback", "Fourteen long-form season yearbooks with title receipts, accolades, and complete race ledgers."],
    ["#/drivers/current", "Current Season Roster", "The Season 15 field reconstructed from complete official result rundowns."],
    ["#/visual-garage", "Visual Garage", "Review uncertain official-tape vehicle frames and export a correction batch without self-publishing."],
    ["#/results", "Results Room", "Every supported winner and podium receipt, plus every bounded closing result read."],
    ["#/definitive-history", "Definitive Hype History", "A 30-minute exact-source cut across all 15 seasons."],
    ["#/rankings", "Nine Top 25 Boards", "The GOAT board, Plate Kings, excitement, versatility, chaos, and more."],
    ["#/movie", "VRL Movie", "The original race-story movie experience."],
    ["#/galaxy", "Lore Galaxy", "Explore the archive as a connected racing universe."],
    ["#/booth-lore/curse", "The Announcer's Curse", "Praise a driver. Watch the racing gods respond."],
    ["#/booth-lore/carnac", "The Great Carnac", "Predictions and payoffs spliced back-to-back."],
    ["#/booth-lore/upside-down", "Upside Down candidates", "Exact phrase-and-incident receipts waiting for visual review."],
    ["#/corrections", "Correction Ledger", "Owner-verified identity fixes and the public surfaces they changed."],
    ["#/winners", "Winner’s Circle", "Every known winner and the tape that proves it."],
    ["#/firedup", "Fired Up", "The booth at maximum emotional velocity."],
    ["#/jukebox", "Soundbyte Jukebox", "The greatest calls and one-liners."],
    ["#/rivalries", "Shared-Tape Wire", "Co-mentions with exact receipts; no relationship is inferred."],
    ["#/records", "Record Book", "The archive’s results and extremes."],
    ["#/posters", "Poster Vault", "Race nights recut as collectible art."],
    ["#/afterdark", "Vigilante After Dark", "An endless broadcast scanner."],
    ["#/eras", "Broadcast Eras", "Who held the mic across VRL history."],
    ["#/lost", "Lost Tape Memorial", "The broadcasts history could not save."],
    ["#/search", "Archive Search", "Search every entity and transcript."]
  ];
  $app.innerHTML = '<div class="wrap"><h1 class="page">The whole universe</h1><p class="page-sub">Every wing of the VRL Living Wiki.</p><div class="more-grid">' +
    links.map(function (item, i) { return '<a href="' + item[0] + '"><span>' + String(i + 1).padStart(2, "0") + '</span><h3>' + item[1] + '</h3><p>' + item[2] + '</p></a>'; }).join("") + '</div></div>';
}

function vCorrections() {
  var rows = ENTITY_REGISTRY.corrections || [];
  var cards = rows.map(function (item) {
    var previous = (item.previousDisplayNames || []).map(esc).join(" / ") || "No prior public display";
    var affected = (item.affectedSystems || []).map(function (surface) { return "<span>" + esc(surface) + "</span>"; }).join("");
    return '<article class="correction-card"><div class="correction-status">' + esc((item.reviewStatus || "reviewed").toUpperCase()) +
      ' / ' + esc((item.authority || "source").toUpperCase()) + '</div><h2><del>' + previous + '</del><b>&rarr;</b><a href="#/driver/' +
      encodeURIComponent(item.stableId || "") + '">' + esc(item.canonicalName) + '</a></h2>' +
      (item.pronunciation ? '<p class="correction-pronunciation">PRONOUNCED / <strong>' + esc(item.pronunciation) + '</strong></p>' : "") +
      '<p>' + esc(item.note || "") + '</p><div class="correction-ripple"><em>CORRECTION RIPPLE</em>' + affected +
      '</div><small>' + esc(item.correctedAt || "") + ' / Stable route preserved: ' + esc(item.stableId || "") + '</small></article>';
  }).join("");
  $app.innerHTML = '<div class="wrap correction-ledger"><div class="kicker">OWNER-VERIFIED / REVIEWABLE / ALIAS-SAFE</div>' +
    '<h1>THE CORRECTION <span>LEDGER</span></h1><p class="page-sub">A name correction changes the public identity layer, then ripples into Ask, results, stories, rankings, and highlights. Old spellings remain searchable aliases. Literal transcript quotes stay exactly as spoken or captioned.</p>' +
    (cards || '<div class="empty">No reviewed corrections are published.</div>') + '</div>';
}


/* ------------------------------------------------ DRIVER TOP 25 RANKINGS */
function rankingLabel(key) {
  return String(key || "").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
}
function rankingRaw(value) {
  if (value == null) return "0";
  if (typeof value !== "object") return String(value);
  return Object.keys(value).map(function (key) { return rankingLabel(key) + " " + value[key]; }).join(" · ");
}
function rankingClamp(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}
function rankingFormulaRail(board) {
  var weights = board.weights || {};
  return '<div class="ranking-formula-scroll" aria-label="Published scoring formula"><div class="ranking-formula-rail">' +
    Object.keys(weights).map(function (key) {
      return '<span class="ranking-formula-segment" style="--weight:' + rankingClamp(weights[key]) +
        '" title="' + esc(rankingLabel(key)) + ': ' + weights[key] + ' percent"><b>' +
        weights[key] + '%</b><em>' + esc(rankingLabel(key)) + '</em></span>';
    }).join("") + '</div></div>';
}
function rankingScoreGauge(entry) {
  var score = rankingClamp(entry.score);
  return '<div class="ranking-score-gauge" style="--score:' + score + '" aria-label="' +
    score.toFixed(1) + ' point score"><b>' + score.toFixed(1) + '</b><span>SCORE</span></div>';
}
function rankingTelemetry(entry) {
  var keys = Object.keys(entry.components || {});
  var spoken = [];
  var bars = keys.map(function (key) {
    var component = entry.components[key] || {};
    var normalized = rankingClamp(component.normalized);
    var weight = Number(component.weight) || 0;
    spoken.push((component.label || rankingLabel(key)) + " " + normalized.toFixed(0) +
      " normalized, " + weight + " percent weight, " + (component.points || 0) + " points");
    return '<span class="ranking-telemetry-sector" style="--level:' + normalized +
      '" title="' + esc(spoken[spoken.length - 1]) + '"><i></i><b>' +
      esc(String(component.label || rankingLabel(key)).replace(/\s+/g, " ")) + '</b></span>';
  }).join("");
  return '<div class="ranking-telemetry" aria-label="' + esc(spoken.join("; ")) + '">' + bars + '</div>';
}
function rankingEvidence(entry) {
  return (entry.evidence || []).slice(0, 3).map(function (receipt) {
    return '<button onclick="__play(\'' + esc(receipt.sourceId) + '\',' + (receipt.t || 0) + ')" title="' + esc(receipt.reviewStatus || "exact official-source receipt") + '">▶ ' + esc(receipt.kind === "championship" ? receipt.season + " TITLE" : (receipt.position ? "P" + receipt.position : receipt.kind || "RECEIPT")) + ' · ' + fmtT(receipt.t) + '</button>';
  }).join("");
}
function rankingEntryCard(entry, podium) {
  var driver = driverById(entry.driverId);
  var stats = entry.headlineStats || {};
  var components = Object.keys(entry.components || {}).map(function (key) {
    var component = entry.components[key] || {};
    return '<div class="ranking-component"><span>' + esc(component.label || rankingLabel(key)) + '</span><div><i style="width:' + Math.max(0, Math.min(100, component.normalized || 0)) + '%"></i></div><b>' + esc(rankingRaw(component.raw)) + '</b><small>' + (component.weight || 0) + '% / ' + (component.points || 0) + ' pts</small></div>';
  }).join("");
  var statHtml = Object.keys(stats).map(function (key) {
    return '<span><b>' + esc(rankingRaw(stats[key])) + '</b>' + esc(rankingLabel(key)) + '</span>';
  }).join("");
  return '<article class="ranking-entry ' + (podium ? "podium podium-" + entry.rank : "") + '">' +
    '<div class="ranking-rank"><small>RANK</small><b>#' + entry.rank + '</b>' + rankingScoreGauge(entry) + '</div>' +
    '<a class="ranking-art" href="#/driver/' + esc(entry.driverId) + '" aria-label="Open ' + esc(entry.displayName) + ' driver dossier">' +
      (driver ? driverVisual(driver, "ranking-shot") : '<div class="driver-visual number-card ranking-shot"><b>' + esc(entry.primaryNumber || "—") + '</b><span class="dv-proof">ARCHIVE PROFILE</span></div>') + '</a>' +
    '<div class="ranking-driver"><div class="ranking-number">#' + esc(entry.primaryNumber || "—") + '</div><div><a href="#/driver/' + esc(entry.driverId) + '">' + esc(entry.displayName) + '</a><span>' + esc((entry.confidence || {}).tier || "reviewable") + ' confidence · confidence adds 0 points</span></div></div>' +
    rankingTelemetry(entry) + '<div class="ranking-stats">' + statHtml +
    '</div><details class="ranking-breakdown"><summary>SHOW SCORECARD + EXACT RECEIPTS</summary><div class="ranking-components">' +
    components + '</div><div class="ranking-receipts">' + rankingEvidence(entry) + '</div><small>' +
    esc((entry.confidence || {}).basis || "") + ' · ' + esc((entry.confidence || {}).evidenceCoverage || "") +
    '</small></details></article>';
}
function vRankings(categoryId) {
  var order = DRIVER_RANKINGS.categoryOrder || [];
  var active = categoryId && DRIVER_RANKINGS.categories[categoryId] ? categoryId : order[0];
  var board = (DRIVER_RANKINGS.categories || {})[active];
  if (!board) { $app.innerHTML = '<div class="wrap"><div class="empty">Rankings are rebuilding.</div></div>'; return; }
  var entries = board.entries || [], snapshot = DRIVER_RANKINGS.snapshot || {};
  var html = '<div class="rankings-page" data-board="' + esc(active) + '" data-board-type="' +
    esc(board.boardType || "") + '"><section class="rankings-hero"><div class="wrap"><div class="kicker">DOCUMENTED TAPE RÉSUMÉ · NINE DISTINCT BOARDS</div><h1>TOP 25 <span>DRIVERS</span></h1><p>Performance lists use exact position-specific receipts and reviewed championships. Archive-impact lists measure what the surviving tape documents—not an official ability rating, steward ruling, or complete statistical record.</p><div class="rankings-ledger"><div><b>' + order.length + '</b><span>TOP 25 BOARDS</span></div><div><b>' + snapshot.canonicalEvents + '</b><span>CANONICAL EVENTS</span></div><div><b>' + snapshot.championshipEvents + '</b><span>CHAMPIONSHIP RACES</span></div><div><b>' + snapshot.superspeedwayEvents + '</b><span>PLATE EVENTS</span></div></div></div></section><div class="wrap">' +
    '<nav class="ranking-tabs">' + order.map(function (id) { var item = DRIVER_RANKINGS.categories[id]; return '<a class="' + (id === active ? "on" : "") + '" href="#/rankings/' + id + '"><span>' + esc(item.shortName || item.name) + '</span><b>25</b></a>'; }).join("") + '</nav>' +
    '<section class="ranking-board-head"><div><span>' + esc(board.boardType.toUpperCase()) + ' BOARD</span><h2>' + esc(board.name) + '</h2><p>' + esc(board.dek) + '</p></div>' + rankingFormulaRail(board) + '</section>' +
    '<div class="ranking-trust-ribbon"><div><b>ART</b><span>HISTORICAL PLACEHOLDER / APPROVED TAPE / NUMBER FALLBACK</span></div><div><b>OWNER PRIOR</b><span>0 SCORE EFFECT</span></div><details><summary>READ THE EVIDENCE BOUNDARIES</summary><p>' +
    esc(DRIVER_ART.policy || "Paint-library exports are historical placeholders. Official-tape frames and number cards fill the gaps.") +
    ' ' + esc(((DRIVER_RANKINGS.ownerReviewContext || {}).policy) || "Owner context adds no points and breaks no ties.") +
    '</p></details></div>' +
    '<section class="ranking-podium">' + entries.slice(0, 3).map(function (entry) { return rankingEntryCard(entry, true); }).join("") + '</section>' +
    '<section class="ranking-field"><div class="sec-head"><h2>THE REST OF THE TOP 25</h2><div class="ln"></div><span class="more">RANKS 4–25</span></div>' + entries.slice(3).map(function (entry) { return rankingEntryCard(entry, false); }).join("") + '</section>' +
    '<aside class="ranking-caveat"><b>READ THE BOARD CORRECTLY</b><p>' + esc((board.limitations || []).join(" ")) + '</p><small>' + esc((board.notes || []).join(" ")) + ' Unsupported results stay unknown; they never become losses. Stable IDs break display order only, never the score.</small></aside></div></div>';
  $app.innerHTML = html;
}

/* --------------------------------------- THE DEFINITIVE VRL HYPE HISTORY */
function historySegments(units) {
  var out = [];
  (units || []).forEach(function (unit) {
    (unit.segments || []).forEach(function (segment) {
      out.push({ sourceId: segment.sourceId, t: segment.t, end: segment.end, label: "CHAPTER " + String(unit.chapter).padStart(2, "0") + " · " + segment.label });
    });
  });
  return out;
}
window.__playDefinitiveHistory = function () {
  var segments = historySegments(DEFINITIVE_HISTORY.units || []);
  if (segments.length) Player.playSequence(segments[0].sourceId, segments);
};
window.__playHistoryUnit = function (chapter) {
  var unit = (DEFINITIVE_HISTORY.units || []).filter(function (item) { return item.chapter === chapter; })[0];
  if (!unit) return;
  var segments = historySegments([unit]);
  Player.playSequence(segments[0].sourceId, segments);
};
function historyUnitCard(unit) {
  var race = byId(unit.sourceId) || byId(unit.eventId) || {};
  var drivers = (unit.driverIds || []).map(function (id) { var driver = driverById(id); return driver ? '<a href="#/driver/' + id + '">' + esc(driver.name) + '</a>' : ""; }).filter(Boolean).join(" · ");
  var segmentButtons = (unit.segments || []).map(function (segment) {
    return '<a target="_blank" rel="noopener noreferrer" href="' + esc(segment.exactUrl) + '">' + fmtT(segment.t) + '–' + fmtT(segment.end) + ' ↗</a>';
  }).join("");
  var score = unit.selectionScore || {};
  return '<article class="history-unit"><div class="history-chapter"><small>CHAPTER</small><b>' + String(unit.chapter).padStart(2, "0") + '</b><em>' + fmtDur(unit.durationSeconds) + '</em></div><div class="history-frame"><img loading="lazy" src="' + esc(race.thumb || ("https://i.ytimg.com/vi/" + unit.sourceId + "/hqdefault.jpg")) + '" alt="Official broadcast thumbnail for ' + esc(unit.raceTitle) + '"><button onclick="__playHistoryUnit(' + unit.chapter + ')">▶ PLAY CHAPTER</button></div><div class="history-copy"><span>' + esc(unit.season) + ' · ' + fmtDate(unit.date) + ' · ' + esc((unit.category || "moment").toUpperCase()) + (unit.season === "Season 15" ? ' · IN PROGRESS' : '') + '</span><h2>' + esc(unit.title) + '</h2><p>' + esc(unit.summary) + '</p>' + (drivers ? '<div class="history-drivers">' + drivers + '</div>' : '') + '<div class="history-receipts">' + segmentButtons + '</div><details><summary>WHY THIS MADE THE FILM · ' + (score.score || 0) + '</summary><p>' + esc((unit.selectionReasons || []).join(" · ")) + '</p><small>' + esc(unit.reviewStatus || "") + ' · official source · no copied media</small></details></div></article>';
}
function vDefinitiveHistory() {
  var film = DEFINITIVE_HISTORY || {}, method = film.methodology || {};
  var formula = method.selectionFormula || {};
  var weights = Object.keys(formula).map(function (key) { return '<span><b>' + formula[key] + '%</b>' + esc(key) + '</span>'; }).join("");
  var html = '<div class="history-page"><section class="history-hero"><div class="wrap"><div class="kicker">THE ULTIMATE VRL VIDEO · EXACT OFFICIAL TAPE</div><h1>THE DEFINITIVE<br><span>VRL HYPE HISTORY</span></h1><p>' + esc(film.subtitle || "") + ' A continuous SportsCenter-style journey from the first preserved green flag through the newest Wednesday-night finish.</p><div class="history-actions"><button class="btn hot" onclick="__playDefinitiveHistory()">▶ PLAY ALL ' + esc(film.runtimeLabel || "30:00") + '</button><a class="btn" href="#history-cut">EXPLORE THE CUT</a></div><div class="history-ledger"><div><b>' + esc(film.runtimeLabel) + '</b><span>FINAL RUNTIME</span></div><div><b>' + film.seasonCount + '</b><span>SEASONS</span></div><div><b>' + film.unitCount + '</b><span>RACE CHAPTERS</span></div><div><b>' + film.segmentCount + '</b><span>EXACT RECEIPTS</span></div></div></div></section><div class="wrap" id="history-cut"><section class="history-method"><div><span>THE EDITING FORMULA</span><h2>HYPE WITH RECEIPTS</h2><p>Every wreck keeps its full containing incident/replay cut. Every finish keeps the full final lap and requires supported winner language. The two booth-lore sequences preserve setup and payoff separately.</p></div><div class="history-weights">' + weights + '</div></section><div class="history-timeline">' + (film.units || []).map(historyUnitCard).join("") + '</div><aside class="history-boundary"><b>THE FILM’S HONEST BOUNDARY</b><p>' + esc((film.limitations || []).join(" ")) + '</p><small>Season 15 is in progress through ' + esc(film.throughDate) + '. Upside Down candidates are excluded until visual review.</small></aside></div></div>';
  $app.innerHTML = html;
}

/* --------------------------------------------- DRIVER DOSSIERS V1 */
function dossierSpan(ds, d) {
  var years = (ds && ds.yearsActive) || [];
  if (!years.length) return careerSpan(d);
  return years.length === 1 ? String(years[0]) : years[0] + "-" + years[years.length - 1];
}
function confidenceLabel(value) {
  if (typeof value === "number") return Math.round(value * (value <= 1 ? 100 : 1)) + "%";
  return String(value || "archive").toUpperCase();
}
function driverEvidenceMoment(item) {
  var r = byId(item.raceId);
  if (!r) return "";
  return '<article class="dd-evidence"><button class="m-play" onclick="__play(\'' +
    item.raceId + '\',' + (item.t || 0) + ')">PLAY ' + fmtT(item.t) + '</button><div><span>' +
    esc((item.kind || "moment").toUpperCase()) + ' / ' + esc(item.season || r.seasonLabel || "") +
    '</span><h3>' + esc(item.title || "Moment on the tape") + '</h3><p>' +
    esc(item.summary || "") + '</p><a href="#/race/' + item.raceId + '">' +
    esc(r.name || r.title) + ' &rarr;</a></div></article>';
}
function driverResultReceiptRow(item) {
  var race = item.race, claim = item.claim;
  return '<article class="driver-result-row p' + item.position + '"><div class="driver-result-place"><span>' +
    (claim.countsAsOrdinaryEvent ? "FINISH" : "QUALIFIER") + '</span><b>P' + item.position +
    '</b></div><div class="driver-result-race"><span>' + esc(race.seasonLabel || "VRL") +
    (race.round ? ' / ROUND ' + race.round : '') +
    (race.track ? ' / ' + esc(String(race.track).toUpperCase()) : '') +
    '</span><h3><a href="#/race/' + race.id + '">' + esc(race.name || race.title) +
    '</a></h3><small>' + esc(fmtDate(race.date).toUpperCase()) + ' / ' +
    (claim.countsAsOrdinaryEvent
      ? 'ORDINARY EVENT RESULT'
      : 'ALL-STAR QUALIFIER RESULT / EXCLUDED FROM ORDINARY WIN TOTALS') +
    '</small></div><div class="driver-result-proof"><button onclick="__playReceipt(\'' +
    claim.sourceId + '\',' + claim.receipt.t + ',' + claim.receipt.end + ',\'P' +
    item.position + ' RESULT RECEIPT\')">&#9654; PLAY P' + item.position + ' PROOF / ' +
    fmtT(claim.receipt.t) + '</button><a href="#/race/' + race.id +
    '">OPEN RACE FILE &rarr;</a></div></article>';
}
function vHallDossiers() {
  var rawShots = DRIVER_CARSHOTS.drivers || {};
  var currentIds = {};
  (CURRENT_ROSTER.members || []).forEach(function (member) { currentIds[member.driverId] = true; });
  var shotMap = {};
  Object.keys(rawShots).forEach(function (slug) {
    if (!rawShots[slug].reviewStatus || rawShots[slug].reviewStatus === "approved") shotMap[slug] = rawShots[slug];
  });
  var enriched = DRIVERS.map(function (d) {
    var ds = dossierOf(d.id) || {};
    var c = ds.career || {};
    return {
      d: d, ds: ds, starts: c.archiveAppearances == null ? (d.races || []).length : c.archiveAppearances,
      wins: verifiedResultCount(d.name, 1), gauge: (ds.careerGauge || {}).score || 0,
      heard: (mentionsOf(d.id) || {}).n || 0
    };
  });
  enriched.sort(function (a, b) {
    return b.gauge - a.gauge || b.wins - a.wins || b.starts - a.starts || b.heard - a.heard;
  });
  var tiers = [
    { key: "legend", name: "Archive Icons", star: "★★★★★", test: function (x) { return x.gauge >= 75 || x.starts >= 100 || x.wins >= 10; } },
    { key: "winner", name: "Victory Lane", star: "★★★★", test: function (x) { return x.wins > 0; } },
    { key: "veteran", name: "VRL Regulars", star: "★★★", test: function (x) { return x.starts >= 20; } },
    { key: "field", name: "Verified Archive Field", star: "★", test: function () { return true; } }
  ];
  var winnerCount = enriched.filter(function (x) { return x.wins > 0; }).length;
  var numbered = enriched.filter(function (x) { return !!x.ds.primaryNumber; }).length;
  var filters = [
    ["all", "ALL DRIVERS"],
    ["winners", "RACE WINNERS"],
    ["champions", "CHAMPIONS"],
    ["active", "CURRENT SEASON"],
    ["shots", "CAR ON TAPE"]
  ];
  var html = '<div class="wrap"><section class="hall-head dossier-hall"><div class="kicker">EVERY CAREER / EVERY SEASON / EVERY RECEIPT</div>' +
    '<h1>HALL OF <span>VIGILANTES</span></h1><p>A canonical driver archive built from repeated eligible-tape appearances, reviewed results, interviews, recognizable numbers, candidate truck frames, and exact story receipts. Single-broadcast caption debris is hidden unless a result receipt or owner review retains it. Confirmed starts remain unknown until a reviewed entry ledger exists.</p>' +
    '<div class="hall-ledger"><div><b>' + enriched.length + '</b><span>CAREER DOSSIERS</span></div><div><b>' +
    winnerCount + '</b><span>RACE WINNERS</span></div><div><b>' + numbered + '</b><span>NUMBERS RECOVERED</span></div><div><b>' +
    Object.keys(shotMap).length + '</b><span>CAR FRAMES PILOTED</span></div></div>' +
    '<a class="current-roster-cta" href="#/drivers/current"><img src="' +
    esc(SHOW.brand.seriesLogo || SHOW.brand.logo) + '" alt="VRL Premiere Series logo"><span><b>' +
    (CURRENT_ROSTER.memberCount || (CURRENT_ROSTER.members || []).length) +
    ' DRIVERS ON THE CURRENT TAPE</b><small>OPEN THE RECEIPT-BACKED ' +
    esc(CURRENT_ROSTER.season || "CURRENT SEASON") + ' ROSTER THROUGH ' +
    esc(CURRENT_ROSTER.throughDate || "") + '</small></span><strong>VIEW ROSTER</strong></a>' +
    '<div class="bigsearch"><span class="ic">&#128269;</span><input id="hallQ" aria-label="Search drivers and aliases" placeholder="Driver, alias, number, season..."></div>' +
    '<nav class="hall-filters">' + filters.map(function (f) {
      return '<button data-hall-filter="' + f[0] + '" class="' + (f[0] === "all" ? "on" : "") + '">' + f[1] + '</button>';
    }).join("") + '</nav></section><div id="hallBody"></div></div>';
  $app.innerHTML = html;
  var active = "all";
  function render() {
    var q = (document.getElementById("hallQ").value || "").trim().toLowerCase();
    var list = enriched.filter(function (x) {
      var ds = x.ds;
      var hay = [x.d.name, ds.primaryNumber || "", (ds.seasonsActive || []).join(" ")]
        .concat(x.d.aka || [], ds.aliases || []).join(" ").toLowerCase();
      if (q && hay.indexOf(q) < 0) return false;
      if (active === "winners" && x.wins < 1) return false;
      if (active === "champions" && !(TITLES[x.d.name] || []).length) return false;
      if (active === "active" && !currentIds[x.d.id]) return false;
      if (active === "shots" && !shotMap[x.d.id]) return false;
      return true;
    });
    var out = "", used = {};
    tiers.forEach(function (tier) {
      var rows = list.filter(function (x) { return !used[x.d.id] && tier.test(x); });
      rows.forEach(function (x) { used[x.d.id] = 1; });
      if (!rows.length) return;
      out += '<section class="hall-tier"><div class="tier-bar"><h2>' + tier.name +
        '</h2><span class="star">' + tier.star + '</span><div class="ln"></div><span class="ct">' +
        rows.length + '</span></div><div class="grid g5">' +
        rows.map(function (x) { return wantedCard(x.d, tier.key); }).join("") + '</div></section>';
    });
    document.getElementById("hallBody").innerHTML = out ||
      '<div class="empty">No dossier matches that search and filter.</div>';
  }
  var tm;
  document.getElementById("hallQ").addEventListener("input", function () {
    clearTimeout(tm); tm = setTimeout(render, 120);
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-hall-filter]"), function (btn) {
    btn.addEventListener("click", function () {
      active = btn.getAttribute("data-hall-filter");
      Array.prototype.forEach.call(document.querySelectorAll("[data-hall-filter]"), function (b) {
        b.classList.toggle("on", b === btn);
      });
      render();
    });
  });
  render();
}
function currentRosterCard(member) {
  var d = driverById(member.driverId);
  if (!d) return "";
  var ownerImage = ownerDriverImageOf(member.driverId);
  var libraryArt = driverArtOf(member.driverId);
  var rawShot = (DRIVER_CARSHOTS.drivers || {})[member.driverId] || null;
  var shotPath = rawShot && shotSrc(rawShot);
  var approved = rawShot && rawShot.reviewStatus === "approved";
  var latest = member.latestResult || {};
  var hasTopTen = (member.appearances || []).some(function (appearance) {
    var position = +appearance.position;
    return isFinite(position) && position > 0 && position <= 10;
  });
  var visualStatus = ownerImage ? "owner-approved"
    : approved && shotPath ? "approved"
    : libraryArt ? "owner"
    : shotPath ? "candidate"
    : "missing";
  var visual = ownerImage
    ? '<div class="roster-shot owner-approved"><img loading="lazy" src="' +
      esc(ownerImage.path) + '" alt="League-owner-selected truck image for ' + esc(member.name) + '">' +
      '<span>OWNER SELECTED / ' + esc(ownerImage.eraLabel || "IDENTITY ART") + '</span></div>'
    : approved && shotPath
    ? '<div class="roster-shot approved"><img loading="lazy" src="' +
      esc(shotPath) + '" alt="Approved official broadcast frame associated with ' + esc(member.name) + '">' +
      '<span>OFFICIAL TAPE FRAME</span></div>'
    : libraryArt
    ? '<div class="roster-shot owner-library"><img loading="lazy" src="' +
      esc(libraryArt.path) + '" alt="Historical number-matched truck placeholder for ' + esc(member.name) + '">' +
      '<span>HISTORICAL PAINT PLACEHOLDER / NOT CURRENT LIVERY</span></div>'
    : shotPath
    ? '<div class="roster-shot candidate"><img loading="lazy" src="' +
      esc(shotPath) + '" alt="Official broadcast frame candidate associated with ' + esc(member.name) + '">' +
      '<span>CANDIDATE / NEEDS REVIEW</span></div>'
    : '<div class="roster-shot number-only"><b>#' + esc(member.number || "?") +
      '</b><span>TRUCK IMAGE NEEDED</span></div>';
  return '<article class="current-driver-card" data-roster-search="' +
    esc([member.name, member.number || "", (member.aliases || []).join(" ")].join(" ").toLowerCase()) +
    '" data-roster-appearances="' + member.classifiedAppearances +
    '" data-roster-top-ten="' + (hasTopTen ? "1" : "0") +
    '" data-roster-visual="' + visualStatus + '">' +
    visual + '<div class="current-driver-body"><div class="current-driver-number">#' +
    esc(member.number || "?") + '</div><h3>' + esc(member.name) + '</h3><p>' +
    member.classifiedAppearances + ' of ' + (CURRENT_ROSTER.sourceCount || 3) +
    ' completed Season 15 result rundowns</p><div class="current-driver-actions"><a href="#/driver/' +
    esc(member.driverId) + '">OPEN DOSSIER</a><button onclick="__playReceipt(\'' +
    esc(latest.sourceId) + '\',' + (latest.t || 0) + ',' + (latest.end || 0) +
    ',\'SEASON 15 RESULTS\')">PLAY LATEST RESULT</button></div>' +
    (ownerImage ? '<small>' + esc(ownerImage.matchBasis) + ' ' +
      (ownerImage.currentSeasonSchemeCertified ? "Certified as the current scheme." : "Identity-approved; not certified as the current Season 15 livery.") + '</small>' :
    !approved && libraryArt ? '<small>Historical number-matched truck art from the owner paint library; it is not certified as this driver&rsquo;s current Season 15 scheme.</small>' :
    rawShot && !approved ? '<small>Vehicle identity is a human-review candidate from official VRL tape, not an automated identification claim. <button onclick="__play(\'' +
      esc(rawShot.raceId) + '\',' + (rawShot.t || 0) + ')">REVIEW FRAME SOURCE</button></small>' : '') +
    '</div></article>';
}
function currentFormRows(roster) {
  return (roster.members || []).map(function (member) {
    var appearances = (member.appearances || []).slice().sort(function (a, b) {
      return String(a.date || "").localeCompare(String(b.date || ""));
    });
    var positions = appearances.map(function (appearance) { return +appearance.position; })
      .filter(function (position) { return isFinite(position) && position > 0; });
    return {
      member: member,
      appearances: appearances,
      starts: positions.length,
      average: positions.length ? positions.reduce(function (sum, position) { return sum + position; }, 0) / positions.length : null,
      best: positions.length ? Math.min.apply(null, positions) : null,
      topFive: positions.filter(function (position) { return position <= 5; }).length,
      topTen: positions.filter(function (position) { return position <= 10; }).length
    };
  }).filter(function (row) { return row.starts; }).sort(function (a, b) {
    return b.starts - a.starts || a.average - b.average || a.best - b.best ||
      a.member.name.localeCompare(b.member.name);
  });
}
function currentFormTable(roster) {
  var rows = currentFormRows(roster).slice(0, 15);
  return '<section class="current-form-board"><div class="current-form-head"><div><span>THREE-RACE FORM SNAPSHOT</span>' +
    '<h2>WHO HAS BEEN NEAR THE FRONT?</h2><p>Ordered by completed result reads, then average finish, then best finish. This is an archive view of the three classified broadcasts—not official VRL points or standings.</p></div>' +
    '<b>' + rows.length + '<small>DEEPEST SAMPLES</small></b></div><div class="current-form-scroll"><table><thead><tr><th>DRIVER</th><th>READS</th><th>AVG</th><th>BEST</th><th>TOP 5</th><th>TOP 10</th><th>FINISH TAPE</th></tr></thead><tbody>' +
    rows.map(function (row) {
      return '<tr><td><a href="#/driver/' + esc(row.member.driverId) + '"><i>#' +
        esc(row.member.number || "?") + '</i><b>' + esc(row.member.name) + '</b></a></td><td>' +
        row.starts + ' / ' + (roster.sourceCount || 3) + '</td><td>' + row.average.toFixed(1) +
        '</td><td>P' + row.best + '</td><td>' + row.topFive + '</td><td>' + row.topTen +
        '</td><td><div class="current-form-finishes">' + row.appearances.map(function (appearance) {
          return '<button title="' + esc(appearance.track + " · " + fmtDate(appearance.date)) +
            '" onclick="__playReceipt(\'' + esc(appearance.sourceId) + '\',' + appearance.t + ',' +
            appearance.end + ',\'SEASON 15 RESULT\')">P' + appearance.position + '</button>';
        }).join("") + '</div></td></tr>';
    }).join("") + '</tbody></table></div><small class="current-form-boundary">Each finish chip plays the official bounded results receipt used for that row. Missing broadcasts are not treated as starts, DNFs, or zeroes.</small></section>';
}
function vCurrentRoster() {
  var roster = CURRENT_ROSTER || {};
  var sources = roster.sources || [];
  var distribution = roster.appearanceDistribution || {};
  var rosterMembers = roster.members || [];
  var topTenCount = rosterMembers.filter(function (member) {
    return (member.appearances || []).some(function (appearance) {
      var position = +appearance.position;
      return isFinite(position) && position > 0 && position <= 10;
    });
  }).length;
  var artNeededCount = rosterMembers.filter(function (member) {
    var rawShot = (DRIVER_CARSHOTS.drivers || {})[member.driverId] || null;
    return !driverArtOf(member.driverId) && !(rawShot && shotSrc(rawShot));
  }).length;
  var html = '<div class="current-roster-page"><section class="current-roster-hero"><div class="wrap">' +
    '<img src="' + esc(SHOW.brand.seriesLogo || SHOW.brand.logo) + '" alt="VRL Premiere Series logo">' +
    '<div><div class="kicker">CURRENT SEASON / COMPLETE RESULTS RECEIPTS</div><h1>' +
    esc(roster.label || "CURRENT SEASON FIELD ON TAPE") + '</h1><p>' +
    esc(roster.boundary || "") + '</p><div class="current-roster-stats"><div><b>' +
    (roster.memberCount || (roster.members || []).length) + '</b><span>CLASSIFIED DRIVERS</span></div><div><b>' +
    sources.length + '</b><span>COMPLETED RACES</span></div><div><b>' +
    (distribution.allThree || 0) + '</b><span>IN ALL THREE</span></div><div><b>' +
    esc(roster.throughDate || "") + '</b><span>THROUGH DATE</span></div></div><a class="btn ghost roster-garage-link" href="#/visual-garage">OPEN THE VISUAL GARAGE</a></div></div></section>' +
    '<div class="wrap"><section class="roster-receipts"><div><span>THE ADMISSION GATE</span><h2>EVERY NAME HAS A FULL RESULTS RECEIPT</h2><p>' +
    esc((roster.methodology || {}).admission || "") + ' ' + esc((roster.methodology || {}).unknownPolicy || "") +
    '</p></div><div class="roster-source-buttons">' + sources.map(function (source) {
      return '<button onclick="__playReceipt(\'' + esc(source.sourceId) + '\',' + source.t + ',' +
        source.end + ',\'FULL RESULTS RUNDOWN\')"><b>' + esc(source.track) + '</b><span>' +
        source.classifiedCount + ' classified / ' + fmtT(source.t) + '</span></button>';
    }).join("") + '</div></section>' + currentFormTable(roster) +
    '<section class="roster-finder" aria-labelledby="rosterFinderTitle"><div class="roster-finder-copy">' +
    '<span>CURRENT FIELD DIRECTORY</span><h2 id="rosterFinderTitle">FIND YOUR DRIVER</h2>' +
    '<p>Search by name or recognizable number, or use an evidence-backed quick filter.</p></div>' +
    '<div class="bigsearch roster-search"><span class="ic">&#128269;</span><input id="currentRosterQ" aria-label="Search the current VRL roster by driver or number" placeholder="Driver or recognizable number..."></div>' +
    '<div class="roster-filter-bar" role="group" aria-label="Filter the current VRL roster">' +
    '<button class="on" data-roster-filter="all" aria-pressed="true">ALL <b>' + rosterMembers.length + '</b></button>' +
    '<button data-roster-filter="full" aria-pressed="false">ALL THREE TAPES <b>' + (distribution.allThree || 0) + '</b></button>' +
    '<button data-roster-filter="top-ten" aria-pressed="false">TOP-10 ON TAPE <b>' + topTenCount + '</b></button>' +
    '<button data-roster-filter="missing-art" aria-pressed="false">TRUCK IMAGE NEEDED <b>' + artNeededCount + '</b></button></div>' +
    '<p class="roster-filter-status" id="rosterFilterStatus" role="status" aria-live="polite"></p></section>' +
    '<div class="current-roster-grid" id="currentRosterGrid">' +
    rosterMembers.map(currentRosterCard).join("") + '</div>' +
    '<aside class="roster-boundary"><b>IMAGE & ROSTER BOUNDARY</b><p>Approved images are official broadcast frames with a visible identifying cue. Pending images are deliberately labeled candidates until a human confirms the truck, number, or lower-third. This page records classified appearances on tape; it does not claim to be the league registration database.</p></aside>' +
    '</div></div>';
  $app.innerHTML = html;
  var input = document.getElementById("currentRosterQ");
  var rosterFilter = "all";
  function renderRosterFilter() {
    var q = input ? input.value.trim().toLowerCase() : "";
    var visible = 0;
    Array.prototype.forEach.call(document.querySelectorAll("[data-roster-search]"), function (card) {
      var matchesSearch = !q || card.getAttribute("data-roster-search").indexOf(q) >= 0;
      var matchesFilter = rosterFilter === "all" ||
        (rosterFilter === "full" && +card.getAttribute("data-roster-appearances") === sources.length) ||
        (rosterFilter === "top-ten" && card.getAttribute("data-roster-top-ten") === "1") ||
        (rosterFilter === "missing-art" && card.getAttribute("data-roster-visual") === "missing");
      card.hidden = !(matchesSearch && matchesFilter);
      if (!card.hidden) visible += 1;
    });
    var status = document.getElementById("rosterFilterStatus");
    if (status) status.textContent = "Showing " + visible + " of " + rosterMembers.length +
      " classified drivers" + (q ? " matching \"" + q + "\"" : "") + ".";
  }
  if (input) input.addEventListener("input", renderRosterFilter);
  Array.prototype.forEach.call(document.querySelectorAll("[data-roster-filter]"), function (button) {
    button.addEventListener("click", function () {
      rosterFilter = button.getAttribute("data-roster-filter");
      Array.prototype.forEach.call(document.querySelectorAll("[data-roster-filter]"), function (candidate) {
        var selected = candidate === button;
        candidate.classList.toggle("on", selected);
        candidate.setAttribute("aria-pressed", selected ? "true" : "false");
      });
      renderRosterFilter();
    });
  });
  renderRosterFilter();
}
function carFrameReviews() {
  try { return JSON.parse(localStorage.getItem(CAR_REVIEW_KEY) || "{}"); }
  catch (error) { return {}; }
}
function visualGarageCard(item, review) {
  var shot = item.shot;
  var driver = driverById(item.slug);
  var race = byId(shot.raceId);
  var localStatus = review && review.status;
  var statusLabel = localStatus === "confirm" ? "LOCALLY CONFIRMED"
    : localStatus === "reject" ? "WRONG VEHICLE"
    : localStatus === "better" ? "BETTER ANGLE NEEDED"
    : "AWAITING REVIEW";
  return '<article class="visual-garage-card vote-' + esc(localStatus || "pending") +
    '" data-garage-search="' + esc([shot.driver, shot.number || "", race ? race.name : "", localStatus || ""].join(" ").toLowerCase()) +
    '"><div class="visual-garage-frame"><img loading="lazy" src="' + esc(shotSrc(shot)) +
    '" alt="Official VRL broadcast frame candidate for ' + esc(shot.driver) +
    '"><span>' + statusLabel + '</span></div><div class="visual-garage-copy"><div class="visual-garage-name"><b>#' +
    esc(shot.number || (driver && dossierOf(driver.id) || {}).primaryNumber || "?") +
    '</b><div><h2>' + esc(shot.driver) + '</h2><span>' +
    esc(race ? (race.name || race.title) : shot.raceId) + ' / ' +
    esc(race ? fmtDate(race.date) : "date unknown") + ' / ' + fmtT(shot.t) +
    '</span></div></div><p>' + esc(shot.reviewNote || shot.reason || "Candidate frame needs human review.") +
    '</p><details><summary>WHY THE MACHINE NOMINATED THIS FRAME</summary><p>' +
    esc(shot.evidence || shot.reason || "Named official-tape camera cue.") +
    '</p><small>Machine confidence ' + Math.round((shot.confidence || 0) * 100) +
    '% / confidence is not identity proof.</small></details><div class="visual-garage-actions"><button onclick="__carFrameVote(\'' +
    esc(item.slug) + '\',\'confirm\')">THAT IS THE RIGHT VEHICLE</button><button onclick="__carFrameVote(\'' +
    esc(item.slug) + '\',\'reject\')">WRONG VEHICLE</button><button onclick="__carFrameVote(\'' +
    esc(item.slug) + '\',\'better\')">NEEDS A BETTER ANGLE</button><button onclick="__play(\'' +
    esc(shot.raceId) + '\',' + (shot.t || 0) + ')">PLAY SOURCE</button>' +
    (driver ? '<a href="#/driver/' + esc(driver.id) + '">OPEN DOSSIER</a>' : "") +
    '</div></div></article>';
}
function vVisualGarage() {
  var reviews = carFrameReviews();
  var currentIds = {};
  (CURRENT_ROSTER.members || []).forEach(function (member) { currentIds[member.driverId] = 1; });
  var entries = Object.keys(DRIVER_CARSHOTS.drivers || {}).map(function (slug) {
    return { slug: slug, shot: DRIVER_CARSHOTS.drivers[slug] };
  }).filter(function (item) {
    return item.shot && item.shot.path && item.shot.reviewStatus !== "approved";
  }).sort(function (a, b) {
    return (currentIds[b.slug] || 0) - (currentIds[a.slug] || 0) ||
      String(a.shot.driver).localeCompare(String(b.shot.driver));
  });
  var completed = entries.filter(function (item) { return reviews[item.slug] && reviews[item.slug].status; }).length;
  var html = '<div class="visual-garage-page"><section class="visual-garage-hero"><div class="wrap"><div class="kicker">HUMAN-IN-THE-LOOP VEHICLE IDENTITY</div><h1>THE VISUAL <span>GARAGE</span></h1><p>Review candidate truck and car frames against the exact official VRL tape. Your decisions stay on this device until you export them; they never silently rewrite the public archive.</p><div class="visual-garage-ledger"><div><b>' +
    (DRIVER_CARSHOTS.approvedCount || 0) + '</b><span>PIPELINE APPROVED</span></div><div><b>' +
    entries.length + '</b><span>CANDIDATES</span></div><div><b>' + completed +
    '</b><span>LOCALLY REVIEWED</span></div><div><b>' +
    entries.filter(function (item) { return currentIds[item.slug]; }).length +
    '</b><span>CURRENT ROSTER CANDIDATES</span></div></div><div class="visual-garage-tools"><div class="bigsearch"><span class="ic">&#128269;</span><input id="garageQ" placeholder="Driver, number, track, review status..."></div><button class="btn" onclick="__exportCarFrameReviews()">EXPORT REVIEW BATCH</button></div></div></section><div class="wrap"><aside class="visual-garage-boundary"><b>THE GARAGE DOES NOT SELF-PUBLISH</b><p>A local “right vehicle” vote is a correction handoff, not league certification. The frame becomes canonical only after its source cue, visible identifier, and driver mapping are incorporated into the reviewed pipeline.</p></aside><div class="visual-garage-grid" id="visualGarageGrid">' +
    entries.map(function (item) { return visualGarageCard(item, reviews[item.slug]); }).join("") +
    '</div></div></div>';
  $app.innerHTML = html;
  var input = document.getElementById("garageQ");
  if (input) input.addEventListener("input", function () {
    var q = input.value.trim().toLowerCase();
    Array.prototype.forEach.call(document.querySelectorAll("[data-garage-search]"), function (card) {
      card.hidden = !!q && card.getAttribute("data-garage-search").indexOf(q) < 0;
    });
  });
}
window.__carFrameVote = function (slug, status) {
  if (["confirm", "reject", "better"].indexOf(status) < 0) return;
  var reviews = carFrameReviews();
  reviews[slug] = { status: status, reviewedAt: new Date().toISOString() };
  localStorage.setItem(CAR_REVIEW_KEY, JSON.stringify(reviews));
  vVisualGarage();
};
window.__exportCarFrameReviews = function () {
  var payload = {
    product: "VRL Living Wiki Visual Garage",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    boundary: "Local reviewer decisions; pipeline incorporation and evidence review required before public approval.",
    reviews: carFrameReviews()
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  var anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = "vrl-visual-garage-reviews.json";
  anchor.click();
  setTimeout(function () { URL.revokeObjectURL(anchor.href); }, 500);
};
function driverRankingResume(slug) {
  return (DRIVER_RANKINGS.categoryOrder || []).map(function (boardId) {
    var board = (DRIVER_RANKINGS.categories || {})[boardId];
    if (!board) return null;
    var entry = (board.entries || []).filter(function (candidate) {
      return candidate.driverId === slug;
    })[0];
    return entry ? { boardId: boardId, board: board, entry: entry } : null;
  }).filter(Boolean).sort(function (a, b) {
    return a.entry.rank - b.entry.rank ||
      (DRIVER_RANKINGS.categoryOrder || []).indexOf(a.boardId) -
      (DRIVER_RANKINGS.categoryOrder || []).indexOf(b.boardId);
  });
}
function driverRankingResumeCard(item) {
  var stats = item.entry.headlineStats || {};
  var statLine = Object.keys(stats).slice(0, 3).map(function (key) {
    return rankingLabel(key) + " " + rankingRaw(stats[key]);
  }).join(" / ");
  var scope = item.boardId === "podium-resume" ? "CHAMPIONSHIP EVENTS · " :
    (item.boardId === "greatest-overall" ? "ALL SUPPORTED ORDINARY RESULTS · " : "");
  return '<a class="driver-ranking-card rank-' + item.entry.rank + '" href="#/rankings/' +
    esc(item.boardId) + '"><div class="driver-ranking-place"><span>RANK</span><b>#' +
    item.entry.rank + '</b><em>' + item.entry.score.toFixed(1) + '</em></div><div><span>' +
    esc(String(item.board.boardType || "archive").toUpperCase()) + ' BOARD</span><h3>' +
    esc(item.board.shortName || item.board.name) + '</h3><p>' +
    esc((statLine ? scope + statLine : item.board.dek) || "") + '</p><small>' +
    esc(((item.entry.confidence || {}).tier || "reviewable").toUpperCase()) +
    ' CONFIDENCE / OPEN THE COMPLETE SCORECARD</small></div></a>';
}
function vDriverDossier(slug) {
  var d = driverById(slug);
  if (!d) { $app.innerHTML = '<div class="wrap"><div class="empty">Driver not found.</div></div>'; return; }
  var ds = dossierOf(slug) || {
    aliases: d.aka || [], raceIds: d.races || [], appearanceRaceIds: d.races || [], yearsActive: [], seasonsActive: [],
    career: { starts: null, confirmedStarts: null, archiveAppearances: (d.races || []).length, wins: 0, podiums: 0, tracks: 0, moments: d.momentCount || 0 },
    careerGauge: { score: 0, label: "Tape developing", confidence: "limited", components: {} },
    narrative: d.bio ? [d.bio] : ["This driver's dossier is still being assembled from the surviving Wednesday-night tape."],
    seasonStats: [], numberHistory: [], trackAffinity: [], bestQuotes: [], topEvidenceMoments: []
  };
  var c = ds.career || {};
  var gauge = ds.careerGauge || { score: 0, components: {} };
  var m = mentionsOf(slug);
  var startIds = {};
  (ds.appearanceRaceIds || ds.raceIds || d.races || []).forEach(function (id) { startIds[id] = 1; });
  var startRaces = Object.keys(startIds).map(byId).filter(Boolean).sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  var heardRaces = Object.keys((m && m.races) || {}).filter(function (id) { return !startIds[id]; })
    .map(byId).filter(Boolean).sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  var boothHits = [];
  [["curse", BOOTH_LORE.curse || []], ["carnac", BOOTH_LORE.carnac || []], ["upside", BOOTH_LORE.upsideDown || []]].forEach(function (group) {
    group[1].forEach(function (item) {
      if ((item.drivers || []).indexOf(d.name) >= 0) boothHits.push({ category: group[0], item: item });
    });
  });
  var titles = TITLES[d.name] || [];
  var role = ds.careerRole || ds.currentRole || "VRL driver";
  var signatureReel = driverSignatureSequence(ds, d);
  var verifiedResults = verifiedResultsForDriver(d.name);
  var rankingResume = driverRankingResume(slug);
  var pressClippings = pressClippingsForDriver(slug);
  var pressClippingCount = pressClippings.issues.length + pressClippings.annuals.length;
  var currentMember = currentRosterMember(slug);
  var currentLatest = currentMember && currentMember.latestResult;
  var currentForm = currentMember && currentFormRows({ members: [currentMember] })[0];
  var html = '<div class="wrap driver-dossier-page"><div class="crumb"><a href="#/hall">HALL OF VIGILANTES</a> / ' +
    esc(d.name).toUpperCase() + '</div><section class="driver-dossier-hero"><div class="dd-art">' +
    driverVisual(d, "hero-shot") + '</div><div class="dd-identity"><span class="dd-label">DRIVER DOSSIER / ' +
    esc(confidenceLabel(gauge.confidence)) + ' CONFIDENCE</span><h1>' + esc(d.name) + '</h1>' +
    (d.pronunciation ? '<div class="dd-pronunciation">PRONOUNCED / <b>' + esc(d.pronunciation) + '</b></div>' : "") +
    '<p class="dd-role">' + esc(role) + '</p>' +
    (titles.length ? '<div class="dd-champion">VRL CHAMPION / ' + titles.map(esc).join(" / ") + '</div>' : "") +
    ((d.reviewedAliases || []).length ? '<div class="aka">REVIEWED ALIASES / ' +
      d.reviewedAliases.map(esc).join(" / ") + '</div>' : "") +
    (ds.identityNote ? '<p class="dd-identity-note">' + esc(ds.identityNote) + '</p>' : "") +
    '<div class="dd-span">' + esc(dossierSpan(ds, d) || "Career dates developing") + ' / ' +
    (ds.seasonsActive || []).length + ' seasons documented</div>' +
    (currentMember ? '<div class="dd-current"><a href="#/drivers/current"><b>SEASON 15 CURRENT ROSTER</b><span>' +
      currentMember.classifiedAppearances + ' classified appearances on complete result rundowns</span></a>' +
      (currentLatest ? '<button onclick="__playReceipt(\'' + currentLatest.sourceId + '\',' + currentLatest.t + ',' +
        currentLatest.end + ',\'LATEST SEASON 15 RESULT\')">LATEST / P' + currentLatest.position + ' AT ' +
        esc(String(currentLatest.track || "TRACK").toUpperCase()) + ' / PLAY</button>' : "") + '</div>' : "") +
    '<button class="dd-share" onclick="__shareCurrent(\'VRL Driver Dossier / ' +
    esc(d.name).replace(/'/g, "\\'") + '\')">SHARE THIS DOSSIER</button>' +
    '</div>' +
    '<div class="career-gauge" style="--gauge:' + Math.max(0, Math.min(100, gauge.score || 0)) +
    '"><div><b>' + (gauge.score || 0) + '</b><span>CAREER<br>GAUGE</span></div><em>' +
    esc(gauge.label || "Tape developing") + '</em></div></section>' +
    '<section class="dossier-ledger"><div><b>' + (c.archiveAppearances == null ? startRaces.length : c.archiveAppearances) +
    '</b><span>ARCHIVE APPEARANCES*</span></div><div><b>' + verifiedResultCount(d.name, 1) +
    '</b><span>REVIEWED WINS</span></div><div><b>' + (verifiedResultCount(d.name, 1) + verifiedResultCount(d.name, 2) + verifiedResultCount(d.name, 3)) +
    '</b><span>REVIEWED PODIUM POSITIONS</span></div><div><b>' + (c.tracks || 0) +
    '</b><span>TRACKS</span></div><div><b>' + (c.highHeatMoments || 0) +
    '</b><span>HIGH-HEAT MOMENTS</span></div><div><b>' + (ds.bestQuotes || []).length +
    '</b><span>FIRST-PERSON CLIPS</span></div><div><b>' + (m ? m.n : 0) +
    '</b><span>BOOTH MENTIONS</span></div></section>';

  var dossierJumpLinks = [
    currentForm ? ["driver-current", "Season 15"] : null,
    ["driver-story", "Career story"],
    pressClippingCount ? ["driver-press", "Press clippings"] : null,
    rankingResume.length ? ["driver-rankings", "Rankings"] : null,
    verifiedResults.length ? ["driver-results", "Results"] : null,
    (ds.seasonStats || []).length ? ["driver-seasons", "Seasons"] : null,
    (ds.bestQuotes || []).length ? ["driver-interviews", "Interviews"] : null,
    (ds.topEvidenceMoments || []).length ? ["driver-tape", "Signature tape"] : null,
    DRIVER_DNA[slug] ? ["driver-dna", "Driver DNA"] : null,
    (ds.trackAffinity || []).length ? ["driver-tracks", "Tracks"] : null,
    ["driver-deep-search", "Deep search"]
  ].filter(Boolean);
  html += '<nav class="driver-jumpbar" aria-label="Driver dossier sections"><span>JUMP TO</span>' +
    dossierJumpLinks.map(function (item) {
      return '<button type="button" onclick="var el=document.getElementById(\'' + item[0] +
        '\');if(el&&el.tagName===\'DETAILS\')el.open=true;if(el)el.scrollIntoView({behavior:\'smooth\',block:\'start\'})">' +
        esc(item[1]) + '</button>';
    }).join("") + '<button type="button" class="driver-print-file" onclick="__printWikiFile()">PRINT / PDF DOSSIER</button></nav>';

  if (currentForm) {
    html += '<section class="driver-current-form" id="driver-current"><div><span>SEASON 15 / CLASSIFIED RESULT READS</span><h2>CURRENT FORM ON TAPE</h2><p>This is a result-receipt snapshot, not official VRL points or an entry-list claim.</p></div>' +
      '<div class="driver-current-numbers"><div><b>' + currentForm.starts + '</b><span>READS</span></div><div><b>' +
      currentForm.average.toFixed(1) + '</b><span>AVG FINISH</span></div><div><b>P' + currentForm.best +
      '</b><span>BEST</span></div><div><b>' + currentForm.topTen + '</b><span>TOP 10</span></div></div>' +
      '<div class="driver-current-tape">' + currentForm.appearances.map(function (appearance) {
        return '<button onclick="__playReceipt(\'' + appearance.sourceId + '\',' + appearance.t + ',' +
          appearance.end + ',\'SEASON 15 RESULT\')"><span>' + fmtDate(appearance.date) + ' / ' +
          esc(appearance.track) + '</span><b>P' + appearance.position + '</b><small>&#9654; PLAY RESULT READ</small></button>';
      }).join("") + '</div></section>';
  }

  if (signatureReel.length) {
    html += '<section class="driver-reel-cta" id="driver-reel"><div><span>CAREER REEL / ' + signatureReel.length +
      ' RACES / ' + fmtT(storyboardRuntime(signatureReel)) + '</span><h2>WATCH THE DRIVER, NOT THE DATABASE</h2><p>The strongest source-bounded moments on this dossier, sequenced across different race nights. Each chapter returns to the official broadcast.</p></div>' +
      '<button class="btn" onclick="__playDriverReel(\'' + slug + '\')">&#9654; PLAY SIGNATURE REEL</button><div class="driver-reel-strip">' +
      signatureReel.map(function (item, index) {
        var race = byId(item.raceId);
        return '<button onclick="__playReceipt(\'' + item.sourceId + '\',' + item.t + ',' + item.end +
          ',\'CAREER REEL ' + (index + 1) + '\')"><b>' + String(index + 1).padStart(2, "0") +
          '</b><span>' + esc(item.title) + '</span><small>' +
          esc(race ? (race.name || race.title) : item.raceId) + ' / ' + fmtT(item.t) + '</small></button>';
      }).join("") + '</div></section>';
  }

  html += '<p class="note"><b>*Participation boundary:</b> archive appearances come from a mixed participant-or-mention broadcast index. They are not official starts. Confirmed starts remain unknown until a reviewed entry/results ledger is reconstructed.</p>';

  html += '<section class="dossier-story" id="driver-story"><div class="dd-section-kicker">THE CAREER, ACCORDING TO THE TAPE</div>' +
    '<div class="dossier-prose">' + (ds.narrative || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join("") +
    '</div></section>';

  if (ds.profileStory && (ds.storyEvidenceRoutes || []).length) {
    html += '<section class="profile-story-evidence" aria-labelledby="profile-story-evidence-title"><div class="profile-story-evidence-head"><div><span>EDITOR-REVIEWED / SOURCE-BOUNDED</span><h2 id="profile-story-evidence-title">Receipts behind this profile</h2><p>' +
      esc(ds.profileStory.limitations) + '</p></div><b>' + ds.profileStory.wordCount +
      ' WORD STORY<br>' + ds.profileStory.routeCount + ' EXACT ROUTES</b></div><div class="profile-story-route-grid">' +
      ds.storyEvidenceRoutes.map(function (route, index) {
        return '<article><button type="button" onclick="__playReceipt(\'' +
          esc(route.sourceId || route.raceId) + '\',' + route.t + ',' + route.end +
          ',\'DRIVER PROFILE RECEIPT\')"><span>' + String(index + 1).padStart(2, "0") +
          ' / ' + esc(String(route.kind || route.type || "receipt").toUpperCase()) +
          '</span><strong>' + esc(route.title || "Exact profile receipt") +
          '</strong><small>&#9654; ' + fmtT(route.t) + '&ndash;' + fmtT(route.end) +
          (route.track ? ' / ' + esc(String(route.track).toUpperCase()) : "") +
          '</small></button><p>' + esc(route.summary || route.context || "Bounded official-source evidence.") +
          '</p><a href="#/race/' + esc(route.raceId || route.sourceId) +
          '">OPEN RACE FILE &rarr;</a></article>';
      }).join("") + '</div></section>';
  }

  if (pressClippingCount) {
    html += '<section class="sec dossier-module driver-press-clippings" id="driver-press"><div class="sec-head"><h2>Press Clippings</h2><div class="ln"></div><span class="more">' +
      pressClippingCount + ' AUTHORED PUBLICATIONS</span></div><p class="driver-press-rule">A clipping appears only when the authored Scene issue or Flashback annual explicitly names ' +
      esc(d.name) + '. It is a story index, not an official start or entry-list claim.</p><div class="driver-press-grid">' +
      pressClippings.issues.map(function (item) { return driverPressClippingCard(item, "scene"); }).join("") +
      pressClippings.annuals.map(function (item) { return driverPressClippingCard(item, "flashback"); }).join("") +
      '</div></section>';
  }

  if (rankingResume.length) {
    html += '<section class="sec dossier-module driver-ranking-resume" id="driver-rankings"><div class="sec-head"><h2>Top 25 Ranking Resume</h2><div class="ln"></div><span class="more">' +
      rankingResume.length + ' OF ' + (DRIVER_RANKINGS.categoryOrder || []).length +
      ' PUBLIC BOARDS</span></div><div class="driver-ranking-grid">' +
      rankingResume.map(driverRankingResumeCard).join("") +
      '</div><p class="method-note">Performance boards use supported finishes and reviewed championships. Archive-impact boards measure what the surviving tape documents. Owner priors add zero points, confidence adds zero points, and every complete scorecard is public.</p></section>';
  }

  if (verifiedResults.length) {
    var visibleResults = verifiedResults.slice(0, 12);
    var hiddenResults = verifiedResults.slice(12);
    html += '<section class="sec dossier-module driver-results-vault" id="driver-results"><div class="sec-head"><h2>Verified Results Vault</h2><div class="ln"></div><span class="more">' +
      verifiedResults.length + ' EXACT P1 / P2 / P3 RECEIPTS</span></div><div class="driver-result-tote"><div><b>' +
      verifiedResults.filter(function (item) {
        return item.position === 1 && item.claim.countsAsOrdinaryEvent;
      }).length + '</b><span>REVIEWED WINS</span></div><div><b>' +
      verifiedResults.filter(function (item) {
        return item.position === 2 && item.claim.countsAsOrdinaryEvent;
      }).length + '</b><span>REVIEWED P2 FINISHES</span></div><div><b>' +
      verifiedResults.filter(function (item) {
        return item.position === 3 && item.claim.countsAsOrdinaryEvent;
      }).length + '</b><span>REVIEWED P3 FINISHES</span></div><div><b>' +
      new Set(verifiedResults.map(function (item) {
        return item.race.seasonLabel;
      }).filter(Boolean)).size + '</b><span>RESULT SEASONS</span></div></div><div class="driver-result-list">' +
      visibleResults.map(driverResultReceiptRow).join("") + '</div>' +
      (hiddenResults.length ? '<details class="driver-result-more"><summary>SHOW ' +
        hiddenResults.length + ' MORE VERIFIED RESULTS</summary><div class="driver-result-list">' +
        hiddenResults.map(driverResultReceiptRow).join("") + '</div></details>' : '') +
      '<p class="method-note">Only position-specific same-source receipts appear here. All-Star qualifier results remain visibly separated and do not enter ordinary win or podium totals.</p></section>';
  }

  var components = gauge.components || {};
  if (Object.keys(components).length) {
    html += '<section class="sec dossier-module"><div class="sec-head"><h2>Career Gauge</h2><div class="ln"></div><span class="more">ARCHIVE IMPACT, NOT A TALENT RATING</span></div>' +
      '<div class="gauge-components">' + Object.keys(components).map(function (key) {
        var value = Math.max(0, Math.min(100, components[key] || 0));
        return '<div><span>' + esc(key.replace(/_/g, " ").toUpperCase()) + '</span><i><b style="width:' +
          value + '%"></b></i><em>' + value + '</em></div>';
      }).join("") + '</div><p class="method-note">' + esc(gauge.methodology || "Built from documented experience, results, signature moments, range, and tape coverage.") +
      '</p></section>';
  }

  if ((ds.numberHistory || []).length) {
    html += '<section class="sec dossier-module"><div class="sec-head"><h2>Number History</h2><div class="ln"></div><span class="more">TRANSCRIPT-DERIVED / OWNER OVERRIDES LABELED</span></div>' +
      '<div class="number-history">' + ds.numberHistory.map(function (num) {
        return '<article><b>#' + esc(num.number) + '</b><div><strong>' + (num.raceCount || 0) +
          ' race files / ' + (num.mentions || 0) + ' mentions</strong><span>' +
          esc((num.seasons || []).join(" / ") || "Season pending") + ' / ' +
          esc(confidenceLabel(num.confidence)) + '</span><div class="number-receipts">' +
          (num.evidence || []).slice(0, 3).map(function (ev) {
            return ev.raceId
              ? '<button onclick="__play(\'' + ev.raceId + '\',' + (ev.t || 0) + ')" title="' +
                esc(ev.quote || "") + '">PLAY ' + fmtT(ev.t) + '</button>'
              : '<span>OWNER VERIFIED</span>';
          }).join("") + '</div></div></article>';
      }).join("") + '</div></section>';
  }

  if ((ds.seasonStats || []).length) {
    html += '<section class="sec dossier-module" id="driver-seasons"><div class="sec-head"><h2>Season by Season</h2><div class="ln"></div><span class="more">' +
      ds.seasonStats.length + ' SEASONS WITH ARCHIVE APPEARANCES</span></div><div class="season-timeline">' +
      ds.seasonStats.slice().reverse().map(function (s) {
        var best = s.bestMoment;
        return '<article><div class="season-spine"></div><div class="season-year"><b>' + esc(s.season) +
          '</b><span>' + (s.archiveAppearances || 0) + ' archive appearances</span></div><div class="season-line"><span>' +
          verifiedResultCount(d.name, 1, s.season) + ' reviewed wins</span><span>' +
          (verifiedResultCount(d.name, 1, s.season) + verifiedResultCount(d.name, 2, s.season) + verifiedResultCount(d.name, 3, s.season)) + ' reviewed podium positions</span><span>' +
          (s.moments || 0) + ' moments</span>' +
          (best ? '<button onclick="__play(\'' + best.raceId + '\',' + (best.t || 0) + ')">BEST TAPE / ' +
            fmtT(best.t) + '</button>' : "") + '</div></article>';
      }).join("") + '</div></section>';
  }

  if ((ds.bestQuotes || []).length) {
    html += '<section class="sec dossier-module interview-room" id="driver-interviews"><div class="sec-head"><h2>Interview Room</h2><div class="ln"></div><span class="more">THE DRIVER, IN THEIR OWN WORDS</span></div><div class="quote-grid">' +
      ds.bestQuotes.slice(0, 6).map(function (q) {
        var r = byId(q.raceId);
        return '<article><span>ON THE TAPE / ' + esc(confidenceLabel(q.confidence)) +
          '</span><blockquote>&ldquo;' + esc(q.quote) + '&rdquo;</blockquote>' +
          (q.context ? '<p>' + esc(q.context) + '</p>' : "") +
          (q.attributionMethod ? '<small>ATTRIBUTION / ' + esc(String(q.attributionMethod).toUpperCase()) +
            '</small>' : "") +
          '<button onclick="__play(\'' + q.raceId + '\',' + (q.t || 0) + ')">PLAY INTERVIEW / ' +
          fmtT(q.t) + '</button><a href="#/race/' + q.raceId + '">' +
          esc(r ? (r.name || r.title) : q.raceId) + '</a></article>';
      }).join("") + '</div></section>';
  }

  if ((ds.topEvidenceMoments || []).length) {
    html += '<section class="sec dossier-module" id="driver-tape"><div class="sec-head"><h2>Signature Tape</h2><div class="ln"></div><span class="more">THE BEST RECEIPTS, RANKED</span></div><div class="dd-evidence-list">' +
      ds.topEvidenceMoments.slice(0, 24).map(driverEvidenceMoment).join("") + '</div></section>';
  }

  var dna = DRIVER_DNA[slug];
  if (dna) {
    html += '<section class="dna-card dossier-module" id="driver-dna"><div class="dna-stamp">DRIVER DNA</div><div class="dna-title"><div><span>ARCHETYPE</span><h2>' +
      esc(dna.archetype) + '</h2></div></div><div class="dna-grid"><div class="dna-bars">' +
      (dna.traits || []).map(function (trait) {
        return '<div class="dna-trait"><span>' + esc(trait.name) + '</span><i><b style="width:' +
          trait.score + '%"></b></i><em>' + trait.score + '</em></div>';
      }).join("") + '</div><div class="dna-facts"><div><b>' + dna.wins +
      '</b><span>reviewed wins</span></div><div><b>' + dna.podiums +
      '</b><span>reviewed podium positions</span></div><div><b>' + esc(dna.topTrack || "Tape pending") +
      '</b><span>most-seen track</span></div><div><b>' + dna.evidenceCount +
      '</b><span>tagged evidence</span></div></div></div><p class="dna-note"><b>' + esc((dna.confidence || "limited").toUpperCase()) + ' CONFIDENCE · MODEL CANDIDATE.</b> ' +
      esc(dna.evidenceBasis || "Built from curated driver-tagged broadcast story receipts.") + ' ' +
      esc(dna.limitations || "This is not official telemetry, pace, incident, or entry-list data. Human review is required.") + '</p></section>';
  }

  if ((ds.trackAffinity || []).length) {
    html += '<section class="sec dossier-module" id="driver-tracks"><div class="sec-head"><h2>Track Fingerprint</h2><div class="ln"></div></div><div class="track-affinity">' +
      ds.trackAffinity.slice(0, 8).map(function (t) {
        return '<div><b>' + esc(t.track) + '</b><span>' + t.archiveAppearances + ' archive appearances / ' + t.wins +
          ' wins / ' + t.podiums + ' podiums</span><em>' + t.score + '</em></div>';
      }).join("") + '</div></section>';
  }

  if (boothHits.length) {
    html += '<section class="sec dossier-module"><div class="sec-head"><h2>Booth Lore</h2><div class="ln"></div><a href="#/booth-lore">' +
      boothHits.length + ' HITS &rarr;</a></div><div class="booth-mini-grid">' +
      boothHits.slice(0, 8).map(function (hit) {
        var item = hit.item;
        var label = hit.category === "curse" ? "ANNOUNCER'S CURSE" : hit.category === "carnac" ? "GREAT CARNAC" : "UPSIDE DOWN CANDIDATE";
        var action = hit.category === "upside"
          ? "__play('" + item.raceId + "'," + item.t + ")"
          : "__playSequence('" + item.raceId + "'," + item.setup.t + "," + item.setup.end + "," + item.payoff.t + "," + item.payoff.end + ")";
        return '<article class="booth-mini"><span>' + label + '</span><h3>' + esc(item.title) +
          '</h3><button onclick="' + action + '">PLAY THE TAPE</button></article>';
      }).join("") + '</div></section>';
  }

  html += '<details class="sec dossier-module driver-secondary-vault" id="driver-deep-search"><summary><span>Deep Tape Search</span><em>Every surviving caption / open scanner</em></summary><div class="driver-secondary-vault-body">' +
    '<div class="load-note" id="menProg">Scanning commentary for ' + esc(d.name) +
    '...</div><div class="prog"><i id="menBar"></i></div><div id="menBox"></div></div></details>';

  if (startRaces.length) {
    html += '<details class="sec dossier-module driver-secondary-vault"><summary><span>Archive Appearances</span><em>' +
      startRaces.length + ' mixed participant-or-mention files / open archive</em></summary><div class="driver-secondary-vault-body"><div class="grid g3">' +
      startRaces.slice(0, 18).map(raceCard).join("") + '</div></div></details>';
  }
  if (heardRaces.length) {
    html += '<details class="sec dossier-module driver-secondary-vault"><summary><span>Heard Elsewhere</span><em>Additional transcript matches / open tape references</em></summary><div class="driver-secondary-vault-body">' +
      '<p class="note">These are additional commentary references outside the dossier appearance index. Neither section is an official start ledger.</p><div class="grid g3">' +
      heardRaces.slice(0, 12).map(raceCard).join("") + '</div></div></details>';
  }
  html += '</div>';
  $app.innerHTML = html;

  var terms = [d.name].concat(ds.aliases || d.aka || []);
  var last = d.name.split(/\s+/).pop();
  if (last && last.length >= 5 && terms.indexOf(last) < 0) terms.push(last);
  deepScan(terms, {
    prog: "menBar", note: "menProg", box: "menBox", perRace: 4, max: 120,
    priority: Object.keys((m && m.races) || {}),
    doneNote: function (hits, scanned) { return hits + " mentions surfaced across " + scanned + " broadcasts."; }
  });
}

/* ------------------------------------------------------ CAUTION EASTER EGG */
(function () {
  var el = null;
  document.addEventListener("keydown", function (e) {
    if (e.key !== "c" && e.key !== "C") return;
    var tag = (document.activeElement || {}).tagName || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (!el) {
      el = document.createElement("div");
      el.id = "cautionFlag";
      el.innerHTML = '<div class="cf-msg">🟡 CAUTION IS OUT!</div>';
      document.body.appendChild(el);
    }
    el.classList.remove("wave");
    void el.offsetWidth;
    el.classList.add("wave");
    setTimeout(function () { el.classList.remove("wave"); }, 1600);
  });
})();

/* ---------------------------------------------------------------- ROUTER */
function route() {
  TimeMachineUI.stop();
  Galaxy.stop();
  MoviePlay.stop();
  Player.dropInline();
  RaceNight.stop();
  renderNav();
  var h = location.hash || "#/";
  var m;
  window.scrollTo(0, 0);
  if (h === "#/" || h === "") return vHome();
  if (h === "#/showcase") return vShowcase(0);
  if ((m = h.match(/^#\/showcase\/(\d+)$/))) return vShowcase(m[1]);
  if (h === "#/highlights") return vHighlights();
  if (h === "#/scene") return vSceneIndex();
  if ((m = h.match(/^#\/scene\/([\w-]+)$/))) return vSceneIssue(m[1]);
  if (h === "#/flashback") return vFlashbackIndex();
  if ((m = h.match(/^#\/flashback\/(?:season-)?(\d+)$/))) return vFlashback(m[1]);
  if (h === "#/watch") return vWatch("latest");
  if ((m = h.match(/^#\/watch\/([\w-]+)$/))) return vWatch(m[1]);
  if (h === "#/rankings") return vRankings();
  if ((m = h.match(/^#\/rankings\/([\w-]+)$/))) return vRankings(m[1]);
  if (h === "#/definitive-history" || h === "#/history") return vDefinitiveHistory();
  if ((m = h.match(/^#\/highlights\/([\w-]+)$/))) return vHighlight(m[1]);
  if (h === "#/tape") return vTape("");
  if ((m = h.match(/^#\/tape\/(.+)$/))) return vTape(m[1]);
  if (h === "#/time-machine") return vTimeMachine();
  if ((m = h.match(/^#\/time-machine\/([\w-]+)$/))) return vTimeMachine(m[1]);
  if (h === "#/movie") return vMovie();
  if ((m = h.match(/^#\/movie\/([^/]+)\/(\d+)$/))) return vMovie(m[1], m[2]);
  if (h === "#/galaxy") return vGalaxy();
  if (h === "#/exciting") return vExciting();
  if (h === "#/seasons") return vSeasons();
  if ((m = h.match(/^#\/season\/(.+)$/))) return vSeason(decodeURIComponent(m[1]));
  if ((m = h.match(/^#\/race\/([\w-]+)\/t\/(\d+)$/))) return vRace(m[1], m[2]);
  if ((m = h.match(/^#\/race\/([\w-]+)/))) return vRace(m[1]);
  if (h === "#/drivers/current") return vCurrentRoster();
  if (h === "#/visual-garage") return vVisualGarage();
  if (h === "#/results") return vResults();
  if (h === "#/hall" || h === "#/drivers") return vHallDossiers();
  if ((m = h.match(/^#\/driver\/(.+)$/))) return vDriverDossier(decodeURIComponent(m[1]));
  if (h === "#/moments") return vMoments();
  if (h === "#/booth-lore") return vBoothLore("all");
  if ((m = h.match(/^#\/booth-lore\/([\w-]+)$/))) return vBoothLore(m[1]);
  if (h === "#/firedup") return vFiredUp();
  if (h === "#/winners") return vWinners();
  if (h === "#/jukebox") return vJukebox();
  if (h === "#/afterdark") return vAfterDark();
  if (h === "#/rivalries") return vRivalries();
  if ((m = h.match(/^#\/rivalry\/([^/]+)\/(.+)$/))) return vRivalry(decodeURIComponent(m[1]), decodeURIComponent(m[2]));
  if (h === "#/records") return vRecords();
  if (h === "#/posters") return vPosters();
  if (h === "#/eras") return vEras();
  if (h === "#/lost") return vLost();
  if (h === "#/more") return vMore();
  if (h === "#/corrections") return vCorrections();
  if ((m = h.match(/^#\/search\/?(.*)$/))) return vSearch(m[1]);
  vHome();
}
function settleRouteView() {
  window.requestAnimationFrame(function () {
    var heading = $app.querySelector("h1, h2.page, h2");
    var title = heading ? heading.textContent.trim().replace(/\s+/g, " ") : "";
    document.title = title ? title + " · VRL Living Wiki" : "VRL Living Wiki";
    $app.focus({ preventScroll: true });
  });
}
function routeAndSettle() {
  var request = ++routeRequest;
  var hash = location.hash || "#/";
  var needsDeep = routeNeedsDeepArchive(hash);
  var needsRaceDossiers = routeNeedsRaceDossiers(hash);
  var needsDriverDossiers = routeNeedsDriverDossiers(hash);
  var needsFullResults = routeNeedsFullResults(hash);
  var needsDriverRankings = routeNeedsDriverRankings(hash);
  if (!needsDeep && !needsRaceDossiers && !needsDriverDossiers && !needsFullResults && !needsDriverRankings) {
    route();
    settleRouteView();
    return;
  }
  var deepReady = !needsDeep || deepArchiveReady();
  var raceDossiersReady = !needsRaceDossiers || !!window.SOURCE_DOSSIERS;
  var driverDossiersReady = !needsDriverDossiers || !!window.DRIVER_DOSSIERS;
  var fullResultsReady = !needsFullResults || !!window.FULL_RESULTS_BOARDS;
  var driverRankingsReady = !needsDriverRankings || !!window.DRIVER_RANKINGS;
  if (deepReady && raceDossiersReady && driverDossiersReady && fullResultsReady && driverRankingsReady) {
    if (needsDeep) syncDeepArchiveGlobals();
    if (needsRaceDossiers) SOURCE_DOSSIERS = window.SOURCE_DOSSIERS || {};
    if (needsDriverDossiers) DRIVER_DOSSIERS = window.DRIVER_DOSSIERS || {};
    if (needsFullResults) FULL_RESULTS_BOARDS = window.FULL_RESULTS_BOARDS || { boards: [], summary: {}, methodology: {} };
    if (needsDriverRankings) DRIVER_RANKINGS = window.DRIVER_RANKINGS || { categoryOrder: [], categories: {}, snapshot: {} };
    route();
    settleRouteView();
    return;
  }
  renderNav();
  window.scrollTo(0, 0);
  $app.innerHTML = deepArchiveLoadingHtml(needsDeep, needsRaceDossiers, needsDriverDossiers, needsFullResults, needsDriverRankings);
  var loaders = [];
  if (!deepReady) loaders.push(loadDeepArchive());
  if (!raceDossiersReady) loaders.push(loadRaceDossiers());
  if (!driverDossiersReady) loaders.push(loadDriverDossiers());
  if (!fullResultsReady) loaders.push(loadFullResults());
  if (!driverRankingsReady) loaders.push(loadDriverRankings());
  Promise.all(loaders).then(function () {
    if (request !== routeRequest) return;
    route();
    settleRouteView();
  }).catch(function () {
    if (request !== routeRequest) return;
    $app.innerHTML = deepArchiveErrorHtml();
    settleRouteView();
  });
}
window.addEventListener("hashchange", routeAndSettle);
renderFoot();
routeAndSettle();
})();
