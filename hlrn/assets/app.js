(function () {
  "use strict";

  var DATA = window.HLRN_DATA || {
    meta: {},
    sources: [],
    seasons: [],
    drivers: [],
    moments: [],
    auxiliary: [],
    rankings: { order: [], boards: {} },
    publications: [],
    editorialMethodology: {},
    phrases: [],
    records: {},
  };
  var TR_INDEX = window.HLRN_TR_INDEX || [];
  window.HLRN_TR = window.HLRN_TR || {};

  var app = document.getElementById("app");
  var nav = document.getElementById("nav");
  var footer = document.getElementById("footer");
  var playerRoot = document.getElementById("playerRoot");
  var toastRoot = document.getElementById("toastRoot");
  var sourceMap = Object.fromEntries(DATA.sources.map(function (item) { return [item.id, item]; }));
  var driverMap = Object.fromEntries(DATA.drivers.map(function (item) { return [item.id, item]; }));
  var momentMap = Object.fromEntries(DATA.moments.map(function (item) { return [item.id, item]; }));
  var seasonMap = Object.fromEntries(DATA.seasons.map(function (item) { return [String(item.number), item]; }));
  var publicationMap = Object.fromEntries((DATA.publications || []).map(function (item) { return [item.id, item]; }));
  var loadedTranscripts = {};
  var state = {
    canon: localStorage.getItem("hlrn.canon") || "official",
    watchMood: "latest",
    highlightLane: "official",
    highlightCategory: "all",
    liveQuery: "",
    driverQuery: "",
    radarLane: "official",
  };

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function fmtDate(value, short) {
    if (!value) return "DATE UNKNOWN";
    var date = new Date(value + "T12:00:00");
    return date.toLocaleDateString("en-US", short
      ? { month: "short", day: "numeric", year: "numeric" }
      : { month: "long", day: "numeric", year: "numeric" });
  }

  function fmtTime(seconds) {
    var value = Math.max(0, Math.floor(Number(seconds) || 0));
    var hours = Math.floor(value / 3600);
    var mins = Math.floor((value % 3600) / 60);
    var secs = value % 60;
    return (hours ? hours + ":" + String(mins).padStart(2, "0") : mins) + ":" + String(secs).padStart(2, "0");
  }

  function fmtDuration(seconds) {
    var value = Math.max(0, Math.floor(Number(seconds) || 0));
    var hours = Math.floor(value / 3600);
    var mins = Math.floor((value % 3600) / 60);
    return hours ? hours + "h " + mins + "m" : mins + "m";
  }

  function compact(value, limit) {
    var text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length <= limit ? text : text.slice(0, limit).replace(/\s+\S*$/, "") + "…";
  }

  function laneLabel(lane) {
    return lane === "official" ? "OFFICIAL HLRN" : lane === "highline-live" ? "HIGHLINE LIVE" : "SOURCE LEDGER";
  }

  function laneBadge(source) {
    return '<span class="lane-badge ' + esc(source.lane) + '">' + laneLabel(source.lane) + "</span>";
  }

  function sourceTitle(source) {
    if (source.lane === "official") {
      return "S" + source.season + " · R" + String(source.race).padStart(2, "0") + " / " + source.name;
    }
    return source.name || source.title;
  }

  function heatBar(source, small) {
    var score = Number((source.heat || {}).score || 0);
    return '<div class="heat-readout ' + (small ? "small" : "") + '" aria-label="Tape heat ' + score + ' out of 100">' +
      '<span>TAPE HEAT</span><i><b style="width:' + Math.min(100, score) + '%"></b></i><strong>' + score + "</strong></div>";
  }

  function sourceCard(source, extraClass) {
    var action = source.isComplete
      ? '<button class="icon-play" onclick="__play(\'' + esc(source.id) + '\',0,\'' + esc(sourceTitle(source)) + '\')" aria-label="Play ' + esc(sourceTitle(source)) + '">▶</button>'
      : '<span class="fragment-mark">FRAGMENT</span>';
    return '<article class="source-card ' + esc(extraClass || "") + ' ' + esc(source.lane) + '">' +
      '<a class="source-frame" href="#/race/' + esc(source.id) + '">' +
      '<img loading="lazy" src="' + esc(source.thumb) + '" alt="Official broadcast thumbnail for ' + esc(sourceTitle(source)) + '">' +
      '<span class="source-shade"></span>' + action +
      '<small>' + fmtDuration(source.duration) + "</small></a>" +
      '<div class="source-copy">' +
      '<div class="source-meta">' + laneBadge(source) + '<time>' + esc(fmtDate(source.date, true).toUpperCase()) + "</time></div>" +
      '<h3><a href="#/race/' + esc(source.id) + '">' + esc(sourceTitle(source)) + "</a></h3>" +
      '<p>' + esc(source.track) + " · " + esc(source.kind) + "</p>" +
      heatBar(source, true) +
      '<footer><span>' + Number(source.views || 0).toLocaleString() + ' views</span><span>' +
      ((source.moments || []).length ? (source.moments || []).length + " reviewed cuts" : "source-first file") + "</span></footer></div></article>";
  }

  function momentCard(moment, compactMode) {
    var driverLinks = (moment.drivers || []).slice(0, 4).map(function (id) {
      var driver = driverMap[id];
      return driver ? '<a href="#/driver/' + esc(id) + '">' + esc(driver.name) + "</a>" : "";
    }).filter(Boolean).join("");
    return '<article class="moment-card ' + esc(moment.category) + ' ' + (compactMode ? "compact" : "") + '">' +
      '<div class="moment-time"><button onclick="__play(\'' + esc(moment.sourceId) + '\',' + moment.t + ',\'' + esc(moment.title) + '\')">▶ ' + fmtTime(moment.t) + "</button><span>" + esc(moment.category.toUpperCase()) + "</span></div>" +
      '<div class="moment-copy"><small>' + esc(moment.sourceType || "RACE TAPE") + " / " + esc(moment.track) + " / " + esc(String(moment.phase || "").toUpperCase()) + "</small>" +
      "<h3>" + esc(moment.title) + "</h3>" +
      (compactMode ? "" : "<p>" + esc(moment.summary) + "</p>") +
      (driverLinks ? '<div class="driver-chips">' + driverLinks + "</div>" : "") +
      '<footer><a href="#/race/' + esc(moment.raceId || moment.sourceId) + '">OPEN RACE DEEP DIVE</a><span class="review-state editor-reviewed">EDITOR REVIEWED</span></footer></div></article>';
  }

  function driverCard(driver) {
    var stats = driver.stats || {};
    return '<a class="driver-card" href="#/driver/' + esc(driver.id) + '">' +
      (driver.image
        ? '<figure><img loading="lazy" src="' + esc(driver.image.file) + '" alt="HLRN race-tape frame connected to ' + esc(driver.name) + '"><figcaption>HLRN SOURCE FRAME</figcaption></figure>'
        : '<div class="driver-monogram">' + esc(driver.name.split(/\s+/).map(function (part) { return part[0]; }).slice(0, 2).join("")) + "</div>") +
      '<div class="driver-card-copy"><span>' + esc(driver.team || "TEAM NOT STATED") + "</span><h3>" + esc(driver.name) + "</h3>" +
      '<p>' + stats.tapeSupportedWins + " wins / " + stats.tapeSupportedPodiums + " podiums / " + stats.centralIssueCount + " Central editions</p></div>" +
      '<aside><b>' + stats.officialSourceCount + "</b><small>OFFICIAL<br>FILES</small></aside></a>";
  }

  function pageHead(kicker, title, intro, stats) {
    return '<section class="page-head"><div class="wrap"><span class="eyebrow">' + esc(kicker) + "</span><h1>" + title + "</h1><p>" + intro + "</p>" +
      (stats && stats.length ? '<div class="head-stats">' + stats.map(function (item) {
        return "<div><b>" + esc(item[0]) + "</b><span>" + esc(item[1]) + "</span></div>";
      }).join("") + "</div>" : "") + "</div></section>";
  }

  function evidenceNote(title, text) {
    return '<aside class="evidence-note"><span>BOUNDARY</span><div><b>' + esc(title) + "</b><p>" + esc(text) + "</p></div></aside>";
  }

  function renderNav() {
    var links = [
      ["#/watch", "Watch"],
      ["#/ask", "Ask"],
      ["#/highlights", "Highlights"],
      ["#/central", "Central"],
      ["#/drivers", "Drivers"],
      ["#/seasons", "Seasons"],
      ["#/rankings", "Rankings"],
    ];
    var explore = [
      ["#/explore", "Explore deck"],
      ["#/highline-live", "Highline Live"],
      ["#/radar", "High Line Radar"],
      ["#/frequency", "Highline Frequency"],
      ["#/records", "Record Board"],
      ["#/sources", "Source Ledger"],
      ["#/methodology", "Methodology"],
    ];
    var hash = location.hash || "#/";
    function isOn(path) {
      return path === "#/" ? hash === "#/" : hash.indexOf(path) === 0;
    }
    function navLink(item) {
      return '<a class="' + (isOn(item[0]) ? "on" : "") + '" href="' + item[0] + '" onclick="__closeNav()">' + item[1] + "</a>";
    }
    nav.innerHTML = '<div class="nav-wrap"><a class="brand" href="#/" aria-label="HLRN Living Wiki home">' +
      '<img src="assets/media/hlrn-avatar.jpg" alt=""><div><b>HLRN</b><small>LIVING WIKI / SHOKKER LORE</small></div></a>' +
      '<button class="mobile-menu" aria-expanded="false" onclick="__toggleNav(this)">MENU</button>' +
      '<nav id="primaryNav" aria-label="Primary">' + links.map(navLink).join("") +
      '<details class="explore-menu"><summary class="' + (explore.some(function (item) { return isOn(item[0]); }) ? "on" : "") + '">Explore</summary><div>' +
      explore.map(navLink).join("") + "</div></details></nav>" +
      '<div class="nav-controls"><button class="canon-switch ' + esc(state.canon) + '" onclick="__toggleCanon()" title="Switch between official HLRN and the whole network archive"><i></i><span>' +
      (state.canon === "official" ? "OFFICIAL" : "ALL TAPE") + '</span></button><button class="nav-search" onclick="location.hash=\'#/ask\'" aria-label="Search the archive">⌕</button></div></div>' +
      '<div class="signal-rail"><i></i><span>HIGH LINE RACING NETWORK</span><b></b></div>';
  }

  function renderFooter() {
    footer.innerHTML = '<div class="wrap footer-grid"><div class="footer-brand"><img src="assets/media/hlrn-avatar.jpg" alt="High Line Racing Network"><div><b>HLRN LIVING WIKI</b><p>A SHOKKER LORE creator memory world.</p></div></div>' +
      '<div><b>THE SOURCE PROMISE</b><p>Every playable receipt returns to the original High Line Racing Network upload. The wiki copies no race video.</p></div>' +
      '<div><b>THE RESULT PROMISE</b><p>Unknown stays unknown. Official sheets can be added later without breaking race or driver routes.</p></div>' +
      '<div class="footer-links"><a href="#/methodology">Methodology</a><a href="#/sources">Source ledger</a><a href="' + esc(DATA.meta.channelUrl) + '" target="_blank" rel="noopener">YouTube channel ↗</a></div></div>' +
      '<div class="footer-bottom"><span>SNAPSHOT ' + esc(DATA.meta.snapshotDate || "") + '</span><span>PRESS H ANYWHERE TO OPEN THE HIGH LINE</span></div>';
  }

  window.__toggleNav = function (button) {
    var element = document.getElementById("primaryNav");
    var open = element.classList.toggle("open");
    button.setAttribute("aria-expanded", open ? "true" : "false");
    button.textContent = open ? "CLOSE" : "MENU";
  };
  window.__closeNav = function () {
    var element = document.getElementById("primaryNav");
    var button = nav.querySelector(".mobile-menu");
    if (element) element.classList.remove("open");
    if (button) {
      button.textContent = "MENU";
      button.setAttribute("aria-expanded", "false");
    }
  };
  window.__toggleCanon = function () {
    state.canon = state.canon === "official" ? "all" : "official";
    localStorage.setItem("hlrn.canon", state.canon);
    renderNav();
    toast(state.canon === "official" ? "Official HLRN lane locked" : "Whole network tape is open");
    route();
  };

  function toast(message) {
    toastRoot.innerHTML = '<div class="toast">' + esc(message) + "</div>";
    setTimeout(function () { toastRoot.innerHTML = ""; }, 2200);
  }

  window.__play = function (id, timestamp, title, end) {
    var source = sourceMap[id] || DATA.auxiliary.find(function (item) { return item.id === id; });
    if (!source) return;
    var start = Math.max(0, Number(timestamp) || 0);
    var label = title || sourceTitle(source);
    var youtube = "https://www.youtube.com/watch?v=" + encodeURIComponent(id) + "&t=" + Math.floor(start) + "s";
    playerRoot.innerHTML = '<div class="player-backdrop" onclick="__closePlayer()"></div><aside class="player-drawer" role="dialog" aria-modal="true" aria-label="HLRN source player">' +
      '<header><div><span>ORIGINAL NETWORK TAPE / ' + fmtTime(start) + "</span><b>" + esc(label) + '</b></div><button onclick="__closePlayer()" aria-label="Close player">×</button></header>' +
      '<div class="player-video"><iframe src="https://www.youtube-nocookie.com/embed/' + esc(id) + "?autoplay=1&rel=0&start=" + Math.floor(start) + '" title="' + esc(label) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>' +
      '<footer><div><span>SOURCE</span><b>' + esc(source.title || source.name || id) + '</b></div><a href="' + youtube + '" target="_blank" rel="noopener">RECOVER ON YOUTUBE ↗</a></footer></aside>';
    document.body.classList.add("player-open");
  };
  window.__closePlayer = function () {
    playerRoot.innerHTML = "";
    document.body.classList.remove("player-open");
  };

  function loadTranscript(id) {
    if (window.HLRN_TR[id]) return Promise.resolve(window.HLRN_TR[id]);
    if (TR_INDEX.indexOf(id) < 0) return Promise.resolve([]);
    if (loadedTranscripts[id]) return loadedTranscripts[id];
    loadedTranscripts[id] = new Promise(function (resolve) {
      var script = document.createElement("script");
      script.src = "assets/tr/" + id + ".js?v=hlrn-3";
      script.onload = function () { resolve(window.HLRN_TR[id] || []); };
      script.onerror = function () { resolve([]); };
      document.head.appendChild(script);
    });
    return loadedTranscripts[id];
  }

  function home() {
    var records = DATA.records;
    var latest = sourceMap[DATA.meta.latestOfficialId] || DATA.sources.find(function (item) { return item.lane === "official"; });
    var latestLive = sourceMap[DATA.meta.latestLiveId];
    var hotOfficial = DATA.sources.filter(function (item) { return item.lane === "official" && item.isComplete; })
      .sort(function (a, b) { return b.heat.score - a.heat.score; }).slice(0, 3);
    var featureRoutes = [
      ["01", "WATCH", "Find the race your mood wants", "#/watch"],
      ["02", "ASK", "Question every timed broadcast", "#/ask"],
      ["03", "HIGHLIGHTS", "Jump to the exact second", "#/highlights"],
      ["04", "CENTRAL", "Race desk + The Show", "#/central"],
      ["05", "DRIVERS", "Open the garage passes", "#/drivers"],
      ["06", "SEASONS", "Follow the official road", "#/seasons"],
      ["07", "RANKINGS", "Compare tape impact", "#/rankings"],
      ["08", "EXPLORE", "Open the whole signal deck", "#/explore"],
    ];
    app.innerHTML = '<div class="home">' +
      '<section class="hero"><div class="hero-grid"></div><div class="hero-lines"><i></i><i></i><i></i></div><div class="wrap hero-inner">' +
      '<div class="hero-copy"><span class="eyebrow"><i></i>EVERY SIGNAL LEADS BACK TO THE RACE</span><h1>THE HIGH LINE<br><em>NEVER ENDS.</em></h1>' +
      '<p>Official HLRN Seasons 1–2 and the complete Highline Live shelf—searchable, playable, indexed to the moment, and backed by a recovered winner receipt for every official race.</p>' +
      '<div class="hero-actions"><a class="button hot" href="#/watch">FIND A RACE</a><a class="button glass" href="#/central">ENTER CENTRAL</a></div>' +
      '<div class="hero-ledger"><div><b>' + records.officialCount + '</b><span>OFFICIAL<br>RACES</span></div><div><b>' + records.liveCount + '</b><span>HIGHLINE LIVE<br>FILES</span></div><div><b>' + records.hours + '</b><span>HOURS OF<br>TAPE</span></div><div><b>' + records.transcriptSegments.toLocaleString() + '</b><span>TIMED<br>SEGMENTS</span></div></div></div>' +
      '<aside class="hero-live-card"><div class="on-air"><i></i>SEASON 2 / CURRENT SIGNAL</div><img src="' + esc(latest.thumb) + '" alt="Latest official HLRN broadcast"><div class="hero-live-copy">' +
      laneBadge(latest) + '<h2>' + esc(sourceTitle(latest)) + '</h2><p>' + esc(latest.track) + " · " + esc(fmtDate(latest.date)) + "</p>" +
      heatBar(latest) + '<div><button onclick="__play(\'' + latest.id + '\',0,\'' + esc(sourceTitle(latest)) + '\')">▶ WATCH FROM START</button><a href="#/race/' + latest.id + '">OPEN SIGNAL FILE</a></div></div></aside></div></section>' +
      '<section class="route-console"><div class="wrap"><header><span>CHOOSE YOUR FREQUENCY</span><h2>EIGHT WAYS INTO THE NETWORK</h2></header><div class="route-grid">' +
      featureRoutes.map(function (item) { return '<a href="' + item[3] + '"><b>' + item[0] + '</b><span>' + item[1] + '</span><p>' + item[2] + '</p><em>OPEN ↗</em></a>'; }).join("") +
      '</div></div></section>' +
      '<section class="home-current"><div class="wrap"><div class="section-title"><div><span>THE OFFICIAL ROAD</span><h2>HOT SIGNALS FROM THE SEASONS</h2></div><a href="#/seasons">ALL OFFICIAL RACES →</a></div><div class="source-grid">' + hotOfficial.map(sourceCard).join("") + "</div></div></section>" +
      '<section class="central-tease"><div class="wrap"><div class="central-word"><span>RACE DESK / COMPANION SHOW / EXACT TAPE</span><h2>HIGHLINE<br><em>CENTRAL</em></h2><p>The league already has something VRL never did: its own short-form companion show. Central pairs each race file with The Show whenever the channel published one.</p><a class="button hot" href="#/central">OPEN THE DESK</a></div>' +
      '<div class="central-screen"><span>THE SHOW CONNECTION</span>' +
      (latest.companion ? '<img src="' + esc(latest.companion.thumb) + '" alt="Companion episode thumbnail"><h3>' + esc(latest.companion.title) + '</h3><button onclick="__play(\'' + latest.companion.id + '\',0,\'' + esc(latest.companion.title) + '\')">▶ PLAY COMPANION</button>' : '<div class="no-signal">COMPANION MAPPING IN REVIEW</div>') +
      "</div></div></section>" +
      (latestLive ? '<section class="live-tease"><div class="wrap"><div><span>THE BONUS FREQUENCY</span><h2>HIGHLINE LIVE</h2><p>Other leagues, specials, memorials, throwdowns, practice races, and beautiful one-off chaos—covered completely, kept outside the official season math.</p><a href="#/highline-live">OPEN ALL ' + records.liveCount + ' BONUS RACES →</a></div>' + sourceCard(latestLive, "featured-live") + "</div></section>" : "") +
      evidenceNote("TAPE-SUPPORTED RESULTS. OPEN LEDGER EDGES.", DATA.meta.resultBoundary) + "</div>";
  }

  var WATCH_MOODS = [
    ["latest", "CURRENT SIGNAL", "Newest official race"],
    ["pack", "PACK PRESSURE", "Battle and finish language"],
    ["restart", "RESTART HEAVY", "Green/yellow transitions"],
    ["strategy", "PIT WINDOW", "Fuel, tires, and strategy"],
    ["chaos", "SCANNER RED", "Incident and caution gravity"],
    ["live", "HIGHLINE LIVE", "Bonus-race potpourri"],
    ["surprise", "DROP ME IN", "Random strong tape"],
  ];

  function watchRank(mood) {
    var sources = DATA.sources.filter(function (item) {
      if (!item.isComplete) return false;
      if (mood === "live") return item.lane === "highline-live";
      return state.canon === "all" ? item.lane !== "fragment" : item.lane === "official";
    });
    if (mood === "latest") return sources.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    if (mood === "surprise") {
      var strong = sources.filter(function (item) { return item.heat.score >= 65; });
      return strong.slice().sort(function () { return Math.random() - 0.5; });
    }
    var key = mood === "pack" ? "battle" : mood === "chaos" ? "disruption" : mood;
    return sources.sort(function (a, b) {
      var av = Number(((a.heat || {}).components || {})[key] || 0);
      var bv = Number(((b.heat || {}).components || {})[key] || 0);
      if (mood === "pack") {
        av += Number(a.heat.components.finish || 0);
        bv += Number(b.heat.components.finish || 0);
      }
      return bv - av || b.heat.score - a.heat.score;
    });
  }

  function packFinder(sources) {
    return '<section class="pack-finder"><header><div><span>HLRN SIGNATURE / PACK FINDER</span><h2>FIND THE RACE BY ITS SHAPE</h2><p>Horizontal position measures battle and finish language. Vertical position measures disruption and restart language. Every point opens the underlying race file.</p></div><div class="finder-legend"><span>MORE DISRUPTION ↑</span><span>MORE PACK PRESSURE →</span></div></header><div class="pack-plot">' +
      sources.slice(0, 32).map(function (source) {
        var components = source.heat.components || {};
        var x = Math.min(96, 4 + Number(components.battle || 0) * 2.8 + Number(components.finish || 0) * 1.5);
        var y = Math.min(92, 4 + Number(components.disruption || 0) * 2.9 + Number(components.restart || 0) * 1.8);
        return '<a href="#/race/' + source.id + '" class="pack-point ' + source.lane + '" style="left:' + x + "%;bottom:" + y + '%" title="' + esc(sourceTitle(source)) + ' · tape heat ' + source.heat.score + '"><i></i><span>' + (source.lane === "official" ? "S" + source.season + "R" + source.race : source.track.slice(0, 3).toUpperCase()) + "</span></a>";
      }).join("") + '<div class="plot-axis x">PACK / FINISH SIGNAL</div><div class="plot-axis y">DISRUPTION / RESTART</div></div></section>';
  }

  function watch() {
    var ranked = watchRank(state.watchMood);
    var pick = ranked[0];
    var pool = DATA.sources.filter(function (item) { return item.isComplete && (state.canon === "all" ? item.lane !== "fragment" : item.lane === "official"); });
    app.innerHTML = '<div class="watch-page">' + pageHead("WATCH DESK / HUMAN-READABLE SIGNALS", "WHAT SHOULD I <em>WATCH?</em>", "Choose the kind of racing you want. Recommendations use visible transcript signals and never owner taste or hidden weights.", [
      [WATCH_MOODS.length, "WATCH MODES"], [pool.length, "ELIGIBLE RACES"], ["0", "SECRET EDITOR POINTS"],
    ]) + '<div class="wrap"><div class="mood-deck">' + WATCH_MOODS.map(function (item) {
      return '<button class="' + (state.watchMood === item[0] ? "on" : "") + '" onclick="__watchMood(\'' + item[0] + '\')"><span>' + item[1] + "</span><small>" + item[2] + "</small></button>";
    }).join("") + "</div>" +
      (pick ? '<section class="watch-pick"><div class="watch-pick-image"><img src="' + esc(pick.thumb) + '" alt=""><button onclick="__play(\'' + pick.id + '\',0,\'' + esc(sourceTitle(pick)) + '\')">▶</button></div><div class="watch-pick-copy">' + laneBadge(pick) + '<span>THE DESK PICK / ' + esc(state.watchMood.toUpperCase()) + "</span><h2>" + esc(sourceTitle(pick)) + "</h2><p>" + esc(pick.recap) + "</p>" + heatBar(pick) + '<div class="component-bars">' +
      Object.entries(pick.heat.components || {}).map(function (entry) { return '<div><span>' + esc(entry[0].toUpperCase()) + '</span><i><b style="width:' + Math.min(100, entry[1] * 5) + '%"></b></i><em>' + entry[1] + "</em></div>"; }).join("") +
      '</div><div class="watch-actions"><button class="button hot" onclick="__play(\'' + pick.id + '\',0,\'' + esc(sourceTitle(pick)) + '\')">WATCH NOW</button><a class="button glass" href="#/race/' + pick.id + '">WHY THIS RACE</a></div></div></section>' : "") +
      '<div class="section-title"><div><span>ALTERNATE FREQUENCIES</span><h2>NEXT ON THE BOARD</h2></div></div><div class="source-grid">' + ranked.slice(1, 7).map(sourceCard).join("") + "</div>" +
      packFinder(pool) + evidenceNote("THE WATCH DESK RANKS SIGNALS, NOT QUALITY.", "A high tape-heat score means the transcript carries more finish, battle, restart, strategy, disruption, and booth language under the published caps. It is not an official race rating.") +
      "</div></div>";
  }
  window.__watchMood = function (mood) { state.watchMood = mood; watch(); window.scrollTo(0, 0); };

  function askPage(query) {
    app.innerHTML = '<div class="ask-page">' + pageHead("ASK THE HIGH LINE / SOURCE-BOUNDED DISCOVERY", "ASK <em>THE TAPE.</em>", "Type a driver, track, race, incident, phrase, or question. The answer stays inside indexed HLRN evidence and returns a playable receipt.", [
      [DATA.sources.length, "RACE SOURCES"], [DATA.records.transcriptSegments.toLocaleString(), "TIMED SEGMENTS"], [DATA.drivers.length, "NORMALIZED IDENTITIES"],
    ]) + '<div class="wrap"><section class="ask-console"><div class="ask-input"><span>HLRN://QUERY</span><input id="askInput" value="' + esc(query || "") + '" placeholder="Try: Who is on the tape at Talladega?" onkeydown="if(event.key===\'Enter\')__ask()"><button onclick="__ask()">ASK</button></div>' +
      '<div class="ask-suggestions"><button onclick="__askPreset(\'What is the highest heat official race?\')">Highest heat official race</button><button onclick="__askPreset(\'Trevor Haley\')">Trevor Haley</button><button onclick="__askPreset(\'Talladega final lap\')">Talladega final lap</button><button onclick="__askPreset(\'Season 2 cautions\')">Season 2 cautions</button><button onclick="__askPreset(\'Who won Season 1?\')">Who won Season 1?</button></div></section>' +
      '<div id="askResults">' + (query ? '<div class="ask-loading"><i></i>SCANNING THE NETWORK TAPE…</div>' : '<section class="ask-idle"><div class="scan-rings"><i></i><i></i><i></i></div><h2>THE ARCHIVE IS LISTENING.</h2><p>Structured race and driver records answer first. Transcript lines fill in the exact source context. Unsupported results return an honest unknown.</p></section>') + "</div>" +
      evidenceNote("ASK NEVER PROMOTES PROXIMITY INTO FACT.", "A driver name near a result phrase is a discovery lead, not automatically a finishing position. Direct result answers require a curated position-specific receipt.") +
      "</div></div>";
    if (query) setTimeout(function () { runAsk(query); }, 50);
  }
  window.__ask = function () {
    var input = document.getElementById("askInput");
    if (!input || !input.value.trim()) return;
    var query = input.value.trim();
    history.replaceState(null, "", "#/ask/" + encodeURIComponent(query));
    runAsk(query);
  };
  window.__askPreset = function (query) {
    var input = document.getElementById("askInput");
    if (input) input.value = query;
    history.replaceState(null, "", "#/ask/" + encodeURIComponent(query));
    runAsk(query);
  };

  function structuredAnswer(query) {
    var lower = query.toLowerCase();
    if (/who won season|season \d champion|champion/.test(lower)) {
      var seasonNumber = Number((lower.match(/season\s*(\d)/) || [])[1] || 1);
      var season = seasonMap[String(seasonNumber)];
      if (season && season.champion) {
        return { title: season.champion + " is channel-supported as the Season " + season.number + " champion.", text: season.championStatus, status: "CHANNEL COMPANION RECEIPT", season: season };
      }
      return { title: "The Season " + seasonNumber + " championship is not adjudicated yet.", text: season ? season.championStatus : "No position-specific championship receipt is indexed.", status: "UNKNOWN IS VALID" };
    }
    if (/highest|most exciting|hottest|best race/.test(lower)) {
      var lane = /live/.test(lower) ? "highline-live" : "official";
      var top = DATA.sources.filter(function (item) { return item.lane === lane && item.isComplete; }).sort(function (a, b) { return b.heat.score - a.heat.score; })[0];
      if (top) return { title: sourceTitle(top), text: "This is the current highest tape-heat file in the requested lane at " + top.heat.score + "/100. The score measures bounded transcript signals, not official race quality.", status: "STRUCTURED SIGNAL ANSWER", source: top };
    }
    var driver = DATA.drivers.find(function (item) {
      return lower.includes(item.name.toLowerCase()) || (item.aliases || []).some(function (alias) { return lower.includes(alias.toLowerCase()); });
    });
    if (driver) {
      return { title: driver.name + " has " + driver.stats.officialMentions.toLocaleString() + " official mention signals.", text: "The dossier connects " + driver.stats.centralIssueCount + " Central editions, " + driver.stats.momentCount + " editor-reviewed race beats, " + driver.stats.tapeSupportedWins + " recovered wins, and " + driver.stats.tapeSupportedPodiums + " recovered podiums. Tape appearances are not claimed as official starts.", status: "IDENTITY-SAFE ANSWER", driver: driver };
    }
    var source = DATA.sources.find(function (item) {
      return lower.includes(item.track.toLowerCase()) && (lower.includes("race") || lower.includes("won") || lower.includes("winner"));
    });
    if (source && /who won|winner/.test(lower)) {
      if (source.result && source.result.winner) {
        return { title: source.result.winner + " is tape-supported as the winner.", text: source.result.note, status: "POSITION-SPECIFIC RECEIPT", source: source };
      }
      return { title: "The reviewed winner is still open.", text: source.name + " is fully playable, but the result ledger has not yet accepted a position-specific winner receipt.", status: "RESULT UNKNOWN", source: source };
    }
    return null;
  }

  async function runAsk(query) {
    var box = document.getElementById("askResults");
    if (!box) return;
    box.innerHTML = '<div class="ask-loading"><i></i>SCANNING ' + TR_INDEX.length + " TIMED SOURCES…</div>";
    var direct = structuredAnswer(query);
    var terms = query.toLowerCase().split(/[^a-z0-9']+/).filter(function (term) { return term.length >= 3 && !["what", "when", "where", "which", "that", "this", "with", "from", "race"].includes(term); });
    var searchableSources = state.canon === "official"
      ? DATA.sources.filter(function (item) { return item.lane === "official"; })
      : DATA.sources;
    await Promise.all(searchableSources.map(function (source) { return loadTranscript(source.id); }));
    var hits = [];
    searchableSources.forEach(function (source) {
      (window.HLRN_TR[source.id] || []).forEach(function (line) {
        var lower = line[1].toLowerCase();
        var matched = terms.filter(function (term) { return lower.includes(term); });
        if (matched.length) {
          hits.push({ source: source, t: line[0], text: line[1], score: matched.length * 10 + (matched.length === terms.length ? 10 : 0) });
        }
      });
    });
    hits.sort(function (a, b) { return b.score - a.score || String(b.source.date).localeCompare(String(a.source.date)); });
    var sourceHits = DATA.sources.filter(function (source) {
      var hay = [source.title, source.name, source.track, source.kind].join(" ").toLowerCase();
      return terms.some(function (term) { return hay.includes(term); });
    }).slice(0, 6);
    var html = direct ? '<section class="direct-answer"><span>' + esc(direct.status) + "</span><h2>" + esc(direct.title) + "</h2><p>" + esc(direct.text) + "</p>" +
      (direct.source ? '<a href="#/race/' + direct.source.id + '">OPEN RACE FILE →</a>' : direct.driver ? '<a href="#/driver/' + direct.driver.id + '">OPEN DRIVER DOSSIER →</a>' : direct.season ? '<a href="#/season/' + direct.season.number + '">OPEN SEASON FILE →</a>' : "") + "</section>" : "";
    html += '<section class="ask-hit-section"><header><span>EXACT TRANSCRIPT RECEIPTS</span><b>' + hits.length + " MATCHES</b></header><div class=\"ask-hit-list\">" +
      (hits.length ? hits.slice(0, 30).map(function (hit) {
        return '<article><button onclick="__play(\'' + hit.source.id + '\',' + hit.t + ',\'Transcript receipt\')">▶ ' + fmtTime(hit.t) + '</button><div><span>' + esc(laneLabel(hit.source.lane)) + " · " + esc(sourceTitle(hit.source)) + "</span><p>" + esc(compact(hit.text, 340)) + '</p><a href="#/race/' + hit.source.id + "/t/" + Math.floor(hit.t) + '">OPEN IN RACE FILE</a></div></article>';
      }).join("") : '<div class="empty-state">No exact transcript line matches every useful term. Try a driver surname, track, or shorter phrase.</div>') + "</div></section>";
    if (sourceHits.length) html += '<section class="ask-source-section"><header><span>RELATED SIGNAL FILES</span></header><div class="source-grid">' + sourceHits.map(sourceCard).join("") + "</div></section>";
    box.innerHTML = html;
  }

  function highlightPage() {
    var moments = DATA.moments.filter(function (item) {
      var category = state.highlightCategory === "all" || item.category === state.highlightCategory;
      return category;
    }).sort(function (a, b) { return b.score - a.score || b.heat - a.heat; });
    var official = DATA.sources.filter(function (item) { return item.lane === "official"; });
    app.innerHTML = '<div class="highlights-page">' + pageHead("HIGHLIGHT CONTROL / REVIEWED EDIT MAPS", "THE RACE,<br><em>CUT TO THE TURN.</em>", "Every public card was written and bounded against a specific HLRN race or companion source. Automated transcript candidates stay out of this library.", [
      [DATA.moments.length, "EDITOR-REVIEWED CUTS"], [official.length, "OFFICIAL RACE FILES"], [new Set(DATA.moments.map(function (m) { return m.title; })).size, "UNIQUE HEADLINES"],
    ]) + '<div class="wrap"><section class="last-lap-lottery"><div><span>HLRN RETURN RITUAL</span><h2>LAST LAP LOTTERY</h2><p>One button. One reviewed closing sequence. No generic white-flag filler.</p></div><button onclick="__lastLap()">DROP ME INTO THE FINISH <b>▶</b></button></section>' +
      '<section class="restart-stack"><header><div><span>HLRN SIGNATURE / RACE STORY STACK</span><h2>OPENING. PRESSURE. CLOSING.</h2></div><p>The complete official run, organized by reviewed story phases instead of raw word proximity.</p></header><div class="restart-races">' +
      official.map(function (source) {
        var restarts = source.moments || [];
        return restarts.length ? '<article><a href="#/race/' + source.id + '"><span>S' + source.season + " / R" + source.race + '</span><b>' + esc(source.track) + "</b></a><div>" + restarts.slice(0, 5).map(function (moment) {
          return '<button onclick="__play(\'' + moment.sourceId + '\',' + moment.t + ',\'' + esc(moment.title) + '\')">' + fmtTime(moment.t) + "</button>";
        }).join("") + "</div></article>" : "";
      }).join("") + "</div></section>" +
      '<section class="highlight-library"><header><div><span>THE REVIEWED CUT LIBRARY</span><h2>PLAYABLE RACE BEATS</h2></div><div class="filter-row"><select onchange="__highlightCategory(this.value)" aria-label="Highlight category">' +
      ["all", "finish", "result", "battle", "incident", "stage", "record", "interview"].map(function (category) { return '<option value="' + category + '"' + (state.highlightCategory === category ? " selected" : "") + ">" + category.toUpperCase() + "</option>"; }).join("") +
      "</select></div></header><div class=\"moment-grid\">" + (moments.length ? moments.map(function (item) { return momentCard(item, false); }).join("") : '<div class="empty-state">No reviewed cuts match this category yet.</div>') + "</div></section>" +
      evidenceNote("HIGHLINE LIVE STAYS A BONUS SHELF.", "All 29 non-league streams remain fully playable and searchable in Highline Live. Their automated candidates are quarantined until they receive the same human editorial pass as the official seasons.") +
      "</div></div>";
  }
  window.__highlightLane = function (value) { state.highlightLane = value; highlightPage(); };
  window.__highlightCategory = function (value) { state.highlightCategory = value; highlightPage(); };
  window.__lastLap = function () {
    var closes = DATA.moments.filter(function (item) { return item.category === "finish" && (state.canon === "all" || item.lane === "official"); });
    if (!closes.length) return toast("No closing signal is currently indexed");
    var item = closes[Math.floor(Math.random() * closes.length)];
    window.__play(item.sourceId, item.t, "Last Lap Lottery");
  };

  function editionCard(issue) {
    var image = issue.image ? issue.image.file : (sourceMap[issue.id] || {}).thumb;
    return '<a class="central-edition-card" href="#/central/' + issue.id + '">' +
      '<figure><img loading="lazy" src="' + esc(image) + '" alt="HLRN source frame for ' + esc(issue.headline) + '"><span>S' + issue.season + " / EDITION " + String(issue.race).padStart(2, "0") + "</span></figure>" +
      '<div><small>' + esc(issue.coverLine) + '</small><h3>' + esc(issue.headline) + '</h3><p>' + esc(issue.deck) + '</p><footer><span>' + issue.wordCount + ' EDITORIAL WORDS</span><b>READ EDITION →</b></footer></div></a>';
  }

  function central() {
    var editions = (DATA.publications || []).slice().sort(function (a, b) { return b.season - a.season || b.race - a.race; });
    var latest = editions[0];
    var seasonOne = editions.filter(function (item) { return item.season === 1; });
    var seasonTwo = editions.filter(function (item) { return item.season === 2; });
    var latestImage = latest && latest.image ? latest.image.file : (sourceMap[latest.id] || {}).thumb;
    app.innerHTML = '<div class="central-page newspaper-front"><header class="central-news-mast"><div class="wrap"><span>THE OFFICIAL RACE PAPER OF THE HIGH LINE</span><h1>HIGHLINE <i>CENTRAL</i></h1><div><b>' + editions.length + ' EDITIONS</b><b>' + Number(DATA.records.editorialWordCount || 0).toLocaleString() + ' EDITORIAL WORDS</b><b>ALL CUTS SOURCE-LINKED</b></div></div></header><div class="wrap">' +
      (latest ? '<section class="central-front-lead"><figure><img src="' + esc(latestImage) + '" alt="HLRN source frame for ' + esc(latest.headline) + '"><figcaption>' + esc((latest.image || {}).caption || "HLRN source frame") + ' / ' + fmtTime((latest.image || {}).t || 0) + '</figcaption></figure><article><span>' + esc(latest.coverLine) + '</span><h2>' + esc(latest.headline) + '</h2><p class="central-deck">' + esc(latest.deck) + '</p><p>' + esc(latest.lead[0]) + '</p><div><a class="button hot" href="#/central/' + latest.id + '">READ THE FULL EDITION</a><button class="button ink" onclick="__play(\'' + latest.id + '\',0,\'' + esc(latest.headline) + '\')">WATCH RACE TAPE</button></div></article><aside><span>INSIDE THIS EDITION</span>' + latest.notebook.map(function (note) { return '<div><b>' + esc(note.label) + '</b><h3>' + esc(note.headline) + '</h3></div>'; }).join("") + '</aside></section>' : "") +
      '<section class="central-edition-run"><header><span>THE CURRENT RUN</span><h2>SEASON 2 / THE FRONT PAGE</h2></header><div class="central-edition-grid">' + seasonTwo.map(editionCard).join("") + '</div></section>' +
      '<section class="central-edition-run"><header><span>THE COMPLETE FOUNDING RUN</span><h2>SEASON 1 / SIXTEEN EDITIONS</h2></header><div class="central-edition-grid">' + seasonOne.slice().reverse().map(editionCard).join("") + '</div></section>' +
      '<section class="central-editorial-code"><span>CENTRAL EDITORIAL CODE</span><h2>Race fact, source receipt, and show-world flavor stay in separate columns.</h2><p>' + esc((DATA.editorialMethodology || {}).showRule || "") + '</p><a href="#/methodology">OPEN THE TRUST CONTRACT →</a></section>' +
      "</div></div>";
  }

  function centralIssue(id) {
    var issue = publicationMap[id];
    var source = sourceMap[id];
    if (!issue || !source) return central();
    var phases = ["opening", "middle", "closing"];
    var result = issue.result || source.result || {};
    var image = issue.image ? issue.image.file : source.thumb;
    var allIssues = (DATA.publications || []).slice().sort(function (a, b) { return a.season - b.season || a.race - b.race; });
    var index = allIssues.findIndex(function (item) { return item.id === issue.id; });
    var previous = allIssues[index - 1];
    var next = allIssues[index + 1];
    app.innerHTML = '<article class="central-issue paper-edition"><header class="paper-mast"><div class="wrap"><div><small>THE OFFICIAL RACE PAPER OF THE HIGH LINE</small><h1>HIGHLINE <i>CENTRAL</i></h1></div><section><b>SEASON ' + issue.season + " / EDITION " + String(issue.race).padStart(2, "0") + '</b><time>' + esc(fmtDate(issue.date).toUpperCase()) + '</time><span>' + issue.wordCount + ' EDITORIAL WORDS</span></section></div></header>' +
      '<div class="wrap paper-grid"><main><section class="paper-headline"><span>' + esc(issue.coverLine) + '</span><h2>' + esc(issue.headline) + '</h2><p>' + esc(issue.deck) + '</p><div><b>BY HIGHLINE CENTRAL ARCHIVE DESK</b><small>Reviewed against HLRN race and companion tape</small></div></section>' +
      '<figure class="paper-hero"><img src="' + esc(image) + '" alt="HLRN source frame for ' + esc(issue.headline) + '"><button onclick="__play(\'' + esc((issue.image || {}).sourceId || source.id) + '\',' + Number((issue.image || {}).t || 0) + ',\'' + esc(issue.headline) + '\')">▶ PLAY THIS SOURCE FRAME</button><figcaption>' + esc((issue.image || {}).caption || source.name) + ' / HLRN SOURCE / ' + fmtTime((issue.image || {}).t || 0) + '</figcaption></figure>' +
      '<section class="paper-lead">' + issue.lead.map(function (paragraph, paragraphIndex) { return '<p class="' + (paragraphIndex === 0 ? "dropcap" : "") + '">' + esc(paragraph) + '</p>'; }).join("") + '</section>' +
      '<section class="paper-three-act"><header><span>THE RACE IN THREE ACTS</span><h2>OPENING / PRESSURE / CLOSING</h2></header>' + phases.map(function (phase, phaseIndex) { var items = issue.moments.filter(function (moment) { return moment.phase === phase; }); return '<div class="paper-act"><b>0' + (phaseIndex + 1) + '</b><h3>' + ["THE BOARD IS SET", "THE RACE TURNS", "THE RESULT ARRIVES"][phaseIndex] + '</h3><div>' + items.map(function (moment) { return momentCard(moment, false); }).join("") + '</div></div>'; }).join("") + '</section>' +
      '<section class="paper-notebook"><header><span>NOTEBOOK</span><h2>THREE THINGS TO CARRY FORWARD</h2></header><div>' + issue.notebook.map(function (note) { return '<article><span>' + esc(note.label) + '</span><h3>' + esc(note.headline) + '</h3><p>' + esc(note.body) + '</p></article>'; }).join("") + '</div></section>' +
      '<section class="paper-after-hours"><span>AFTER HOURS / THE SHOW</span><h2>' + esc(issue.afterHours.headline) + '</h2><p>' + esc(issue.afterHours.body) + '</p><button onclick="__play(\'' + esc(issue.afterHours.sourceId) + '\',' + Number(issue.afterHours.t || 0) + ',\'After Hours\')">▶ PLAY THE SHOW COLUMN</button></section>' +
      '<nav class="paper-pagination">' + (previous ? '<a href="#/central/' + previous.id + '">← ' + esc(previous.headline) + '</a>' : '<span></span>') + (next ? '<a href="#/central/' + next.id + '">' + esc(next.headline) + ' →</a>' : '<a href="#/central">CENTRAL INDEX →</a>') + '</nav></main><aside>' +
      '<section class="paper-result"><span>RESULT LEDGER</span><h3>' + (result.winner ? esc(result.winner) : "P1 OPEN") + '</h3>' + ((result.podium || []).length ? '<ol>' + result.podium.map(function (name, resultIndex) { return '<li><b>P' + (resultIndex + 1) + '</b>' + esc(name) + '</li>'; }).join("") + '</ol>' : '') + '<p>' + esc(result.note || "") + '</p>' + (result.receipt ? '<button onclick="__play(\'' + esc(result.receipt.sourceId || source.id) + '\',' + Number(result.receipt.t || 0) + ',\'Result receipt\')">▶ PLAY RESULT RECEIPT</button>' : '') + '</section>' +
      '<section class="paper-facts"><span>EDITION INDEX</span><dl><dt>Track</dt><dd>' + esc(issue.track) + '</dd><dt>Race file</dt><dd>S' + issue.season + ' / R' + issue.race + '</dd><dt>Reviewed cuts</dt><dd>' + issue.moments.length + '</dd><dt>Timed segments</dt><dd>' + source.transcriptLines.toLocaleString() + '</dd><dt>Primary tape</dt><dd><a href="#/race/' + source.id + '">Open deep dive →</a></dd></dl></section>' +
      '<section class="paper-limits"><span>WHAT THIS EDITION DOES NOT CLAIM</span><ul>' + issue.limitations.map(function (item) { return '<li>' + esc(item) + '</li>'; }).join("") + '</ul></section>' +
      (issue.companion ? '<section class="issue-companion"><span>CONNECTED COMPANION</span><img src="' + esc(issue.companion.thumb) + '" alt=""><h3>' + esc(issue.companion.title) + '</h3><button onclick="__play(\'' + issue.companion.id + '\',0,\'' + esc(issue.companion.title) + '\')">▶ PLAY THE SHOW</button></section>' : '') +
      "</aside></div></article>";
  }

  function driversPage() {
    var query = state.driverQuery.toLowerCase();
    var drivers = DATA.drivers.filter(function (item) {
      return !query || item.name.toLowerCase().includes(query) || String(item.team || "").toLowerCase().includes(query);
    });
    var featured = DATA.drivers.filter(function (item) { return item.image && (item.stats.tapeSupportedPodiums || item.stats.centralIssueCount >= 3); }).sort(function (a, b) {
      return b.stats.tapeSupportedWins - a.stats.tapeSupportedWins || b.stats.tapeSupportedPodiums - a.stats.tapeSupportedPodiums || b.stats.centralIssueCount - a.stats.centralIssueCount;
    }).slice(0, 18);
    app.innerHTML = '<div class="drivers-page">' + pageHead("FRONTLINE GARAGE / DRIVER DOSSIERS", "THE CARS.<br><em>THE RESULTS.</em><br>THE STORIES.", "Source-backed car and race frames lead the garage. Every dossier then connects result receipts, Central coverage, signature tape, track history, and the broader appearance index.", [
      [DATA.drivers.length, "DOSSIERS"], [DATA.records.driverImageCount, "SOURCE-FRAME DOSSIERS"], [DATA.drivers.filter(function (item) { return item.stats.tapeSupportedWins; }).length, "RECOVERED WINNERS"],
    ]) + '<div class="wrap">' +
      (!query ? '<section class="frontline-garage"><header><span>THE FRONT ROW</span><h2>RESULT-BACKED NAMES / CARS ON TAPE</h2><p>Frames are captured from HLRN race or companion programs at the cited second. They are visual dossier art—not a substitute for an owner-supplied car photo archive.</p></header><div class="driver-feature-grid">' + featured.map(driverCard).join("") + '</div></section>' : '') +
      '<section class="garage-register"><header><div><span>THE COMPLETE IDENTITY REGISTER</span><h2>' + (query ? "SEARCH RESULTS" : "EVERY NORMALIZED DRIVER") + '</h2></div><div class="driver-search"><span>FIND A GARAGE PASS</span><input value="' + esc(state.driverQuery) + '" placeholder="Driver or team…" oninput="__driverFilter(this.value)"><b>' + drivers.length + " MATCHES</b></div></header><div class=\"driver-grid\">" + drivers.map(driverCard).join("") + "</div></section>" +
      evidenceNote("PICTURES ARE SOURCE-ATTRIBUTED, NOT INVENTED.", "The current image pass uses HLRN's own race and companion footage. Where no safely mapped frame exists, the dossier keeps a monogram. Owner-supplied car art can replace or expand these frames later without changing the evidence record.") +
      "</div></div>";
  }
  window.__driverFilter = function (value) { state.driverQuery = value; driversPage(); var input = app.querySelector(".driver-search input"); if (input) { input.focus(); input.setSelectionRange(value.length, value.length); } };

  function driverPage(id) {
    var driver = driverMap[id];
    if (!driver) return driversPage();
    var stats = driver.stats;
    var sources = driver.appearances.map(function (item) { return sourceMap[item.sourceId]; }).filter(Boolean);
    var resultRaces = (driver.resultRaceIds || []).map(function (raceId) { return sourceMap[raceId]; }).filter(Boolean);
    var clippings = (driver.centralIssueIds || []).map(function (issueId) { return publicationMap[issueId]; }).filter(Boolean).sort(function (a, b) { return b.season - a.season || b.race - a.race; });
    var rankings = DATA.rankings.order.map(function (boardId) {
      var board = DATA.rankings.boards[boardId];
      var entry = board.entries.find(function (item) { return item.driverId === driver.id; });
      return entry ? { board: board, entry: entry } : null;
    }).filter(Boolean);
    app.innerHTML = '<article class="driver-page"><section class="driver-hero dossier-hero"><div class="wrap">' +
      (driver.image ? '<figure><img src="' + esc(driver.image.file) + '" alt="HLRN source frame connected to ' + esc(driver.name) + '"><figcaption><span>' + esc(driver.image.label) + '</span><b>' + esc(driver.image.caption) + '</b><button onclick="__play(\'' + driver.image.sourceId + '\',' + driver.image.t + ',\'' + esc(driver.name) + ' source frame\')">▶ ' + fmtTime(driver.image.t) + '</button></figcaption></figure>' : '<div class="driver-hero-mark">' + esc(driver.name.split(/\s+/).map(function (p) { return p[0]; }).slice(0, 2).join("")) + '</div>') +
      '<div class="driver-identity"><span>DRIVER DOSSIER / ' + esc(String(driver.identityStatus).replace(/-/g, " ").toUpperCase()) + "</span><h1>" + esc(driver.name) + "</h1>" +
      (driver.team ? "<p>" + esc(driver.team) + "</p>" : "<p>TEAM NOT CONSISTENTLY STATED ON REVIEWED TAPE</p>") +
      '<div class="dossier-badges">' + (driver.name === "Trevor Haley" ? '<b>SEASON 1 CHAMPION</b>' : '') + (stats.tapeSupportedWins ? '<b>' + stats.tapeSupportedWins + '× RACE WINNER</b>' : '') + (stats.tapeSupportedPodiums ? '<b>' + stats.tapeSupportedPodiums + '× RECOVERED PODIUM</b>' : '') + '</div>' +
      (driver.aliases && driver.aliases.length ? '<small>TRANSCRIPT ALIASES / ' + driver.aliases.map(esc).join(" / ") + "</small>" : "") + '</div><aside><div><b>' + stats.tapeSupportedWins + "</b><span>WINS</span></div><div><b>" + stats.tapeSupportedPodiums + "</b><span>PODIUMS</span></div><div><b>" + stats.centralIssueCount + "</b><span>CENTRAL<br>EDITIONS</span></div><div><b>" + stats.officialSourceCount + "</b><span>OFFICIAL<br>FILES</span></div></aside></div></section>" +
      '<div class="wrap driver-body"><main><section class="driver-summary dossier-story"><span>THE CAREER READ</span><h2>' + (driver.name === "Trevor Haley" ? "THE CHAMPION AT THE CENTER OF THE STORM" : "A CAREER RECONSTRUCTED FROM THE RACE") + '</h2>' + (driver.story || []).map(function (paragraph) { return '<p>' + esc(paragraph) + '</p>'; }).join("") + '</section>' +
      (resultRaces.length ? '<section class="driver-results"><div class="section-title"><div><span>THE RESULT FORM</span><h2>RECOVERED TOP-THREE RUNS</h2></div></div><div>' + resultRaces.map(function (race) { var position = race.result.winner === driver.name ? "P1" : "P" + ((race.result.podium || []).indexOf(driver.name) + 1); return '<a href="#/race/' + race.id + '"><b>' + position + '</b><span>S' + race.season + ' / R' + race.race + '</span><h3>' + esc(race.track) + '</h3><small>' + esc(fmtDate(race.date, true)) + '</small></a>'; }).join("") + '</div></section>' : '') +
      (driver.topMoments.length ? '<section class="driver-moments"><div class="section-title"><div><span>FIVE CLICKS INTO THE CAREER</span><h2>SIGNATURE TAPE</h2></div><p>Only editor-reviewed race beats appear here.</p></div><div class="moment-grid">' + driver.topMoments.slice(0, 6).map(function (item) { return momentCard(item, false); }).join("") + "</div></section>" : "") +
      (clippings.length ? '<section class="driver-clippings"><div class="section-title"><div><span>FROM HIGHLINE CENTRAL</span><h2>PRESS CLIPPINGS</h2></div><b>' + clippings.length + ' EDITIONS</b></div><div class="clipping-grid">' + clippings.map(function (issue) { return '<a href="#/central/' + issue.id + '"><span>S' + issue.season + ' / ' + String(issue.race).padStart(2, "0") + '</span><h3>' + esc(issue.headline) + '</h3><p>' + esc(issue.deck) + '</p><b>READ EDITION →</b></a>'; }).join("") + '</div></section>' : '') +
      '<section class="driver-sources"><div class="section-title"><div><span>THE FULL TAPE INDEX</span><h2>RACE FILE APPEARANCES</h2></div><p>Appearance is not claimed as an official start.</p></div><div class="source-grid">' + sources.slice(0, 24).map(sourceCard).join("") + "</div></section></main><aside>" +
      '<section class="driver-fingerprint"><span>TRACK FINGERPRINT</span>' + (driver.topTracks.length ? driver.topTracks.map(function (item) { return '<div><b>' + esc(item.track) + "</b><i><em style=\"width:" + Math.min(100, item.sourceCount * 16) + '%"></em></i><strong>' + item.sourceCount + "</strong></div>"; }).join("") : "<p>No repeated track signal yet.</p>") + "</section>" +
      '<section class="driver-rank-resume"><span>TAPE RANKING RESUME</span>' + (rankings.length ? rankings.map(function (item) { return '<a href="#/rankings/' + item.board.id + '"><b>#' + item.entry.rank + "</b><div><span>" + esc(item.board.name) + "</span><small>" + item.entry.score + " " + esc(item.board.metric) + "</small></div></a>"; }).join("") : "<p>No current Top 25 placement.</p>") + "</section>" +
      '<section class="dossier-ledger"><span>EVIDENCE LEDGER</span><dl><dt>Official tape files</dt><dd>' + stats.officialSourceCount + '</dd><dt>Highline Live files</dt><dd>' + stats.liveSourceCount + '</dd><dt>Reviewed race beats</dt><dd>' + stats.momentCount + '</dd><dt>Official name signals</dt><dd>' + stats.officialMentions.toLocaleString() + '</dd><dt>First tape date</dt><dd>' + esc(fmtDate(stats.firstDate, true)) + '</dd><dt>Latest tape date</dt><dd>' + esc(fmtDate(stats.lastDate, true)) + '</dd></dl><p>Mention counts aid discovery. They do not measure pace, fault, starts, points, or ability.</p></section></aside></div></article>';
  }

  function seasonsPage() {
    app.innerHTML = '<div class="seasons-page">' + pageHead("THE OFFICIAL ROAD / TWO DISTINCT RUNS", "TWO SEASONS.<br><em>ONE SOURCE OF TRUTH.</em>", "The official lane follows the channel's numbered league run and The Show chronology. Highline Live never leaks into these totals.", [
      [DATA.records.officialCount, "OFFICIAL RACES"], [DATA.records.officialHours, "OFFICIAL HOURS"], [DATA.seasons.reduce(function (sum, item) { return sum + item.trackCount; }, 0), "SEASON TRACK STOPS"],
    ]) + '<div class="wrap"><div class="season-pair">' + DATA.seasons.map(function (season) {
      var races = season.raceIds.map(function (id) { return sourceMap[id]; }).filter(Boolean);
      var newest = races[races.length - 1];
      return '<a class="season-panel season-' + season.number + '" href="#/season/' + season.number + '"><div class="season-panel-bg" style="background-image:url(\'' + esc(newest ? newest.thumb : "") + '\')"></div><span>' + esc(season.status.toUpperCase()) + "</span><h2>SEASON <b>" + season.number + "</b></h2><p>" + season.raceCount + " official races · " + season.sourceHours + " hours · " + season.trackCount + " track stops</p><div><span>" + season.momentCount + " SIGNALS</span><span>" + season.transcriptCoverage + "/" + season.raceCount + " TIMED</span></div><footer>OPEN THE SEASON →</footer></a>";
    }).join("") + '</div><section class="season-boundary"><div><span>CHAMPIONSHIP LEDGER</span><h2>TAPE FIRST. SHEETS NEXT.</h2></div><p>Season 1’s champion is supported by a later HLRN channel recap. Season 2 remains active in this snapshot. Full standings, points, starts, and complete finishing orders remain open until owner records arrive.</p></section>' +
      '<section class="official-roadmap"><div class="section-title"><div><span>SOURCE CHRONOLOGY</span><h2>THE ROAD SO FAR</h2></div></div>' +
      DATA.seasons.map(function (season) { return '<div class="roadmap-run"><header><b>SEASON ' + season.number + "</b><span>" + esc(season.status.toUpperCase()) + "</span></header><div>" + season.raceIds.map(function (id) {
        var source = sourceMap[id]; return source ? '<a href="#/race/' + id + '"><b>' + String(source.race).padStart(2, "0") + "</b><span>" + esc(source.track) + "</span><small>" + esc(fmtDate(source.date, true)) + "</small></a>" : "";
      }).join("") + "</div></div>"; }).join("") + "</section></div></div>";
  }

  function seasonPage(number) {
    var season = seasonMap[String(number)];
    if (!season) return seasonsPage();
    var races = season.raceIds.map(function (id) { return sourceMap[id]; }).filter(Boolean);
    var top = races.slice().sort(function (a, b) { return b.heat.score - a.heat.score; })[0];
    app.innerHTML = '<div class="season-page"><section class="season-hero season-' + season.number + '"><div class="wrap"><div><span>THE OFFICIAL ROAD / ' + esc(season.status.toUpperCase()) + "</span><h1>SEASON <em>" + season.number + "</em></h1><p>" + season.raceCount + " race files across " + season.trackCount + " track stops. " + season.sourceHours + " hours of original HLRN tape.</p></div><aside><b>" + season.transcriptCoverage + "/" + season.raceCount + "</b><span>TIMED RACE FILES</span><b>" + season.resultCoverage + "</b><span>RESULT FILES REVIEWED</span></aside></div></section>" +
      '<div class="wrap"><section class="season-champion-open"><span>CHAMPIONSHIP STATUS / ' + esc(String(season.championEvidenceStatus || "unknown").toUpperCase()) + '</span><h2>' + (season.champion ? esc(season.champion) : "NOT YET ADJUDICATED") + '</h2><p>' + esc(season.championStatus) + '</p>' + (season.championReceipt ? '<button onclick="__play(\'' + season.championReceipt.sourceId + '\',' + season.championReceipt.t + ',\'Championship receipt\')">▶ PLAY CHAMPIONSHIP RECEIPT</button>' : '') + "</section>" +
      (top ? '<section class="season-feature"><div><span>HIGHEST CURRENT TAPE HEAT</span><h2>' + esc(top.name) + "</h2><p>" + esc(top.recap) + '</p><a href="#/race/' + top.id + '">OPEN THE RACE FILE →</a></div>' + sourceCard(top) + "</section>" : "") +
      '<section class="season-races"><div class="section-title"><div><span>RACE BY RACE</span><h2>THE COMPLETE RUN</h2></div></div><div class="source-grid">' + races.map(sourceCard).join("") + "</div></section>" +
      packFinder(races) + "</div></div>";
  }

  function rankingsPage(boardId) {
    var id = DATA.rankings.boards[boardId] ? boardId : DATA.rankings.order[0];
    var board = DATA.rankings.boards[id];
    app.innerHTML = '<div class="rankings-page">' + pageHead("TOP 25 / EVIDENCE-BOUND BOARDS", "RANK WHAT THE<br><em>ARCHIVE CAN PROVE.</em>", "Seven explainable boards separate recovered outcomes, Central coverage, official file presence, and broadcast gravity. No board pretends to be a complete points table.", [
      [DATA.rankings.order.length, "DISTINCT BOARDS"], [DATA.drivers.length, "NORMALIZED DOSSIERS"], ["0", "CONFIDENCE POINTS"],
    ]) + '<div class="wrap"><nav class="ranking-tabs">' + DATA.rankings.order.map(function (itemId) {
      var item = DATA.rankings.boards[itemId]; return '<a class="' + (itemId === id ? "on" : "") + '" href="#/rankings/' + itemId + '"><span>' + esc(item.name) + "</span><b>25</b></a>";
    }).join("") + '</nav><section class="ranking-method"><span>' + esc(board.metric.toUpperCase()) + "</span><h2>" + esc(board.name) + "</h2><p>" + esc(board.note) + "</p></section><div class=\"ranking-board\">" +
      board.entries.map(function (entry) {
        return '<article><b class="rank-num">' + String(entry.rank).padStart(2, "0") + '</b><div class="rank-driver"><span>' + esc(entry.team || "TEAM NOT STATED") + '</span><a href="#/driver/' + entry.driverId + '">' + esc(entry.name) + "</a><small>" + entry.sourceCount + " tape files · " + entry.momentCount + " exact moments</small></div><div class=\"rank-score\"><b>" + entry.score.toLocaleString() + "</b><span>" + esc(board.metric) + "</span></div></article>";
      }).join("") + "</div>" + evidenceNote("THESE ARE NOT DRIVER ABILITY RATINGS.", "Performance data is incomplete. Every board is an archive-impact view with a single visible metric; confidence, owner opinion, team reputation, and unsupported results add zero points.") + "</div></div>";
  }

  function highlineLive() {
    var query = state.liveQuery.toLowerCase();
    var sources = DATA.sources.filter(function (item) {
      if (item.lane !== "highline-live") return false;
      if (!query) return true;
      return [item.title, item.track, item.kind, item.description].join(" ").toLowerCase().includes(query);
    }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    app.innerHTML = '<div class="live-page">' + pageHead("THE BONUS FREQUENCY / EXPLICITLY NON-CANON", "HIGHLINE <em>LIVE.</em>", "The network's potpourri: partner leagues, throwdowns, memorials, recruitment nights, practice races, format experiments, and one-off shows.", [
      [DATA.records.liveCount, "COMPLETE BONUS RACES"], [Math.round(DATA.sources.filter(function (s) { return s.lane === "highline-live"; }).reduce(function (sum, s) { return sum + s.duration; }, 0) / 3600), "HOURS"], [DATA.sources.filter(function (s) { return s.lane === "fragment"; }).length, "LEDGER-ONLY FRAGMENTS"],
    ]) + '<div class="wrap"><section class="live-manifesto"><b>BONUS DOES NOT MEAN BURIED.</b><p>Every complete Highline Live race receives original playback, transcript search, source metadata, tape heat, driver discovery, and a stable race file. Automated moment candidates stay backstage until a human editorial pass; none can alter official Season 1–2 totals.</p></section><div class="live-search"><span>SCAN THE BONUS SHELF</span><input value="' + esc(state.liveQuery) + '" placeholder="Track, series, special…" oninput="__liveFilter(this.value)"><b>' + sources.length + " FILES</b></div><div class=\"source-grid live-grid\">" + sources.map(sourceCard).join("") + "</div>" +
      '<section class="fragment-shelf"><div class="section-title"><div><span>PRESERVED WITHOUT PRETENSE</span><h2>FRAGMENTS + TECHNICAL TAPE</h2></div></div><div>' + DATA.sources.filter(function (item) { return item.lane === "fragment"; }).map(function (item) {
        return '<a href="#/race/' + item.id + '"><b>' + esc(item.title) + "</b><span>" + esc(item.fragmentNote || "Incomplete source") + "</span><em>" + fmtDuration(item.duration) + "</em></a>";
      }).join("") + "</div></section></div></div>";
  }
  window.__liveFilter = function (value) { state.liveQuery = value; highlineLive(); var input = app.querySelector(".live-search input"); if (input) { input.focus(); input.setSelectionRange(value.length, value.length); } };

  function radarForSource(source) {
    var moments = source.moments || [];
    return '<section class="source-radar"><header><div><span>HLRN SIGNATURE / HIGH LINE RADAR</span><h2>THE REVIEWED STORY SWEEP</h2></div><p>Position reflects editorial race phase. Each contact opens the cited HLRN source second.</p></header><div class="radar-track"><i class="radar-beam"></i>' +
      moments.map(function (item, itemIndex) {
        var phaseBase = item.phase === "opening" ? 12 : item.phase === "closing" ? 76 : 44;
        var left = Math.min(96, phaseBase + (itemIndex % 4) * 5);
        return '<button class="' + esc(item.category) + '" style="left:' + left + '%" onclick="__play(\'' + item.sourceId + '\',' + item.t + ',\'' + esc(item.title) + '\')" title="' + esc(item.title) + " · " + fmtTime(item.t) + '"><i></i><span>' + fmtTime(item.t) + "</span></button>";
      }).join("") + '<div class="radar-base"><span>OPENING</span><span>PRESSURE</span><span>CLOSING</span></div></div><div class="radar-legend">' +
      ["finish", "result", "battle", "incident", "stage", "record", "interview"].map(function (item) { return '<span class="' + item + '"><i></i>' + item.toUpperCase() + "</span>"; }).join("") + "</div></section>";
  }

  function radarPage() {
    var sources = DATA.sources.filter(function (item) { return item.lane === "official" && item.isComplete && item.moments.length; }).sort(function (a, b) { return a.season - b.season || a.race - b.race; });
    app.innerHTML = '<div class="radar-page">' + pageHead("HIGH LINE RADAR / EDITORIAL STORY MAPS", "SEE THE RACE<br><em>BEFORE YOU PRESS PLAY.</em>", "Every sweep maps reviewed opening, pressure, and closing beats. It is a navigable story reconstruction—not official telemetry.", [
      [sources.length, "ACTIVE SWEEPS"], [sources.reduce(function (sum, item) { return sum + item.moments.length; }, 0), "RADAR CONTACTS"], ["0", "TELEMETRY CLAIMS"],
    ]) + '<div class="wrap"><div class="radar-stack">' +
      sources.map(function (source) { return '<article><a href="#/race/' + source.id + '"><span>' + esc(laneLabel(source.lane)) + "</span><h3>" + esc(sourceTitle(source)) + "</h3><small>" + source.heat.score + " TAPE HEAT</small></a>" + radarForSource(source) + "</article>"; }).join("") + "</div>" +
      evidenceNote("RADAR IS A STORY MAP.", "The dots come only from the 83 editor-reviewed receipts. Highline Live's research candidates remain backstage. Radar positions indicate story phase, not car position, speed, incident blame, or race-control data.") + "</div></div>";
  }
  window.__radarLane = function (lane) { state.radarLane = lane; radarPage(); };

  function frequencyPage() {
    app.innerHTML = '<div class="frequency-page">' + pageHead("HIGHLINE FREQUENCY / THE BOOTH AS A CHARACTER", "WHAT DOES THE<br><em>NETWORK SOUND LIKE?</em>", "Recurring race language becomes a playable frequency board. Counts are phrase hits, not separate events or verified speaker quotes.", [
      [DATA.phrases.length, "TRACKED FREQUENCIES"], [DATA.phrases.reduce(function (sum, item) { return sum + item.count; }, 0), "PHRASE HITS"], [DATA.records.transcriptSources, "TIMED SOURCES"],
    ]) + '<div class="wrap"><div class="frequency-board">' + DATA.phrases.map(function (phrase, index) {
      return '<article><header><span>FREQ ' + String(index + 1).padStart(2, "0") + "</span><b>" + phrase.count.toLocaleString() + "</b></header><h2>" + esc(phrase.label) + "</h2><p>" + phrase.sourceCount + " race sources</p><div>" + phrase.receipts.slice(0, 5).map(function (receipt) {
        return '<button onclick="__play(\'' + receipt.sourceId + '\',' + receipt.t + ',\'' + esc(phrase.label) + '\')"><span>▶ ' + fmtTime(receipt.t) + "</span><small>" + esc(compact(receipt.text, 105)) + "</small></button>";
      }).join("") + "</div></article>";
    }).join("") + "</div>" +
      evidenceNote("PHRASE COUNTS ARE SEARCH COUNTS.", "Rolling captions and repeated booth calls can produce multiple hits around one sequence. The board describes recurring language on the surviving tape; it does not assign a line to a specific speaker without identity review.") + "</div></div>";
  }

  function recordsPage() {
    var records = DATA.records;
    app.innerHTML = '<div class="records-page">' + pageHead("CONTROL ROOM TOTALS / THE TAPE AT A GLANCE", "THE NETWORK<br><em>RECORD BOARD.</em>", "Source metadata, archive coverage, track frequency, runtime, and view counts—kept separate from unavailable competition results.", [
      [records.sourceCount, "LIVESTREAM SOURCES"], [records.hours, "ARCHIVE HOURS"], [records.views.toLocaleString(), "CAPTURED VIEWS"],
    ]) + '<div class="wrap"><section class="record-totes"><div><b>' + records.officialCount + "</b><span>OFFICIAL HLRN</span></div><div><b>" + records.liveCount + "</b><span>HIGHLINE LIVE</span></div><div><b>" + records.fragmentCount + "</b><span>FRAGMENTS</span></div><div><b>" + records.driverCount + "</b><span>DRIVER DOSSIERS</span></div><div><b>" + records.momentCount + "</b><span>EXACT MOMENTS</span></div><div><b>" + records.auxiliaryCount + "</b><span>CENTRAL COMPANIONS</span></div></section>" +
      '<div class="record-columns"><section><span>TRACK PASSPORT</span><h2>MOST VISITED ON TAPE</h2>' + records.tracks.map(function (item, index) { return '<div class="record-row"><b>' + String(index + 1).padStart(2, "0") + "</b><span>" + esc(item.track) + "</span><i><em style=\"width:" + Math.min(100, item.sources * 9) + '%"></em></i><strong>' + item.sources + "</strong></div>"; }).join("") + '</section><section><span>MARATHON NIGHTS</span><h2>LONGEST SOURCES</h2>' + records.longest.map(function (item, index) { return '<a class="record-row" href="#/race/' + item.id + '"><b>' + String(index + 1).padStart(2, "0") + "</b><span>" + esc(compact(item.name, 42)) + "</span><strong>" + fmtDuration(item.duration) + "</strong></a>"; }).join("") + '</section><section><span>PUBLIC SIGNAL</span><h2>MOST WATCHED</h2>' + records.mostWatched.map(function (item, index) { return '<a class="record-row" href="#/race/' + item.id + '"><b>' + String(index + 1).padStart(2, "0") + "</b><span>" + esc(compact(item.name, 42)) + "</span><strong>" + item.views.toLocaleString() + "</strong></a>"; }).join("") + "</section></div>" +
      evidenceNote("THE RECORD BOARD STOPS AT SOURCE METADATA.", "Views are a captured snapshot and will drift. Track counts are source counts. Competition records, starts, wins, laps led, incidents, and points wait for reviewed results data.") + "</div></div>";
  }

  function sourcesPage() {
    var chronological = DATA.sources.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    app.innerHTML = '<div class="sources-page">' + pageHead("SOURCE LEDGER / NOTHING SILENTLY DISAPPEARS", "EVERY FILE.<br><em>ONE STABLE ID.</em>", "The full livestream shelf, including official races, Highline Live, fragments, transcript coverage, and result state.", [
      [DATA.sources.length, "SOURCE IDENTITIES"], [DATA.records.transcriptSources, "TIMED"], [DATA.records.fragmentCount, "FRAGMENTS RETAINED"],
    ]) + '<div class="wrap"><div class="source-table"><header><span>DATE</span><span>LANE</span><span>SOURCE</span><span>TRACK</span><span>EVIDENCE</span><span>RESULTS</span></header>' +
      chronological.map(function (source) {
        return '<a href="#/race/' + source.id + '"><time>' + esc(source.date || "UNKNOWN") + "</time><span class=\"table-lane " + source.lane + '">' + esc(laneLabel(source.lane)) + "</span><b>" + esc(sourceTitle(source)) + "</b><span>" + esc(source.track) + "</span><span>" + esc(source.transcriptStatus) + " / " + source.moments.length + " reviewed cuts</span><span>" + esc(source.result.status) + "</span></a>";
      }).join("") + "</div>" + evidenceNote("SOURCE AVAILABILITY IS PART OF THE RECORD.", "If a video is later removed, the stable source identity remains as a tombstone with its known metadata and prior receipts. Removed tape is never silently repointed to another upload.") + "</div></div>";
  }

  function methodologyPage() {
    var policy = DATA.meta.canonPolicy || {};
    app.innerHTML = '<div class="method-page">' + pageHead("METHODOLOGY / THE TRUST CONTRACT", "FAST TO EXPLORE.<br><em>SLOW TO CLAIM.</em>", "The invisible engine is reusable. HLRN’s canon, vocabulary, visual world, scoring signals, Central desk, and fan rituals are native to this network.", [
      ["52", "LIVESTREAMS AUDITED"], ["2", "CANON LANES"], ["4", "EVIDENCE STATES"],
    ]) + '<div class="wrap"><section class="method-grid"><article><span>01 / CANON</span><h2>WHAT COUNTS AS OFFICIAL?</h2><p>' + esc(policy.officialRule || "") + "</p></article><article><span>02 / BONUS</span><h2>WHAT IS HIGHLINE LIVE?</h2><p>" + esc(policy.bonusRule || "") + "</p></article><article><span>03 / FRAGMENTS</span><h2>WHY KEEP PARTIAL TAPE?</h2><p>" + esc(policy.fragmentRule || "") + "</p></article><article><span>04 / RESULTS</span><h2>WHY ARE CELLS OPEN?</h2><p>" + esc(policy.resultRule || "") + "</p></article></section>" +
      '<section class="evidence-ladder"><span>EVIDENCE LADDER</span><h2>FOUR STATES THAT NEVER BLUR TOGETHER</h2><div><article><b>1</b><h3>RESEARCH CANDIDATE</h3><p>A machine-found timestamp kept backstage. It never becomes a public highlight by proximity alone.</p></article><article><b>2</b><h3>AUTHORED RECEIPT</h3><p>A human-bounded moment or claim tied to the exact source window.</p></article><article><b>3</b><h3>EDITOR REVIEWED</h3><p>Context, identity, title, and relationship checked against the tape.</p></article><article><b>4</b><h3>CREATOR CERTIFIED</h3><p>HLRN or an authorized owner confirms the record.</p></article></div></section>' +
      '<section class="heat-method"><span>RESEARCH PIPELINE / PUBLIC FIREWALL</span><h2>' + DATA.records.quarantinedCandidateCount + ' CANDIDATES BACKSTAGE. ' + DATA.moments.length + ' REVIEWED CUTS PUBLIC.</h2><p>Tape Heat helps prioritize research. Highline Central and the highlight library publish only authored, source-bounded receipts. The score never writes a headline, assigns a result, or populates a driver signature reel.</p><div>' + ["finish", "battle", "restart", "strategy", "disruption", "booth", "evidence"].map(function (item) { return '<span>' + item.toUpperCase() + "</span>"; }).join("") + "</div></section>" +
      '<section class="method-unknowns"><div><span>KNOWN NOW</span><ul><li>Source identities and dates</li><li>Original playback URLs</li><li>Official versus bonus lane</li><li>Timed transcript signals</li><li>All 20 official winners</li><li>Season 1 champion receipt</li><li>Channel-authored companion episodes</li></ul></div><div><span>WAITING FOR OWNER RECORDS</span><ul><li>Complete finishing orders</li><li>Official starts and points</li><li>Full standings tables</li><li>Official incident counts</li><li>Complete number and team history</li></ul></div></section></div></div>';
  }

  function explorePage() {
    var cards = [
      ["HIGHLINE LIVE", "The complete non-league potpourri, fully covered and explicitly separated.", "#/highline-live", DATA.records.liveCount + " RACES"],
      ["HIGH LINE RADAR", "Race story signals plotted across exact source time.", "#/radar", DATA.moments.length + " CONTACTS"],
      ["HIGHLINE FREQUENCY", "Recurring network language with playable exact receipts.", "#/frequency", DATA.phrases.length + " FREQUENCIES"],
      ["RECORD BOARD", "Archive totals, runtime, views, tracks, and source records.", "#/records", DATA.records.hours + " HOURS"],
      ["SOURCE LEDGER", "Every stable livestream identity and evidence state.", "#/sources", DATA.records.sourceCount + " SOURCES"],
      ["METHODOLOGY", "Canon, evidence states, scoring, unknowns, and corrections.", "#/methodology", "OPEN CONTRACT"],
    ];
    app.innerHTML = '<div class="explore-page">' + pageHead("THE DEEP SIGNAL DECK / BEYOND THE MAIN TABS", "THE WHOLE<br><em>NETWORK UNIVERSE.</em>", "Six deeper tools turn the channel archive into a place to investigate, revisit, and correct.", [
      [cards.length, "DEEP TOOLS"], [DATA.records.auxiliaryCount, "COMPANION FILES"], [DATA.records.fragmentCount, "PRESERVED FRAGMENTS"],
    ]) + '<div class="wrap"><div class="explore-grid">' + cards.map(function (item, index) {
      return '<a href="' + item[2] + '"><b>' + String(index + 1).padStart(2, "0") + "</b><span>" + esc(item[3]) + "</span><h2>" + esc(item[0]) + "</h2><p>" + esc(item[1]) + "</p><em>OPEN TOOL →</em></a>";
    }).join("") + '</div><section class="explore-rituals"><div><span>RETURN RITUAL</span><h2>LAST LAP LOTTERY</h2><p>Drop into a supported closing signal from anywhere in the network.</p><button onclick="__lastLap()">RUN THE LOTTERY ▶</button></div><div><span>KEYBOARD RITUAL</span><h2>PRESS H</h2><p>Open the high line from any page and receive a random exact battle signal.</p><button onclick="__openHighLine()">OPEN THE HIGH LINE ▶</button></div></section></div></div>';
  }

  function racePage(id, timestamp) {
    var source = sourceMap[id];
    if (!source) return home();
    var moments = source.moments || [];
    var result = source.result || {};
    var issue = publicationMap[id];
    var driverIds = Array.from(new Set(moments.flatMap(function (item) { return item.drivers || []; })));
    var drivers = driverIds.map(function (driverId) { return driverMap[driverId]; }).filter(Boolean);
    var heroImage = issue && issue.image ? issue.image.file : source.thumb;
    var acts = ["opening", "middle", "closing"];
    app.innerHTML = '<article class="race-page deep-dive"><section class="race-hero"><div class="race-hero-bg" style="background-image:url(\'' + esc(heroImage) + '\')"></div><div class="wrap"><div class="race-crumb"><a href="' + (source.lane === "official" ? "#/season/" + source.season : "#/highline-live") + '">' + esc(laneLabel(source.lane)) + "</a><span>/</span>" + esc(source.name) + "</div><div class=\"race-title\">" + laneBadge(source) + '<span class="race-file-label">' + (source.lane === "official" ? "OFFICIAL RACE DEEP DIVE" : "HIGHLINE LIVE SOURCE FILE") + '</span><h1>' + esc(issue ? issue.headline : source.name) + "</h1><p>" + esc(source.track) + " · " + esc(fmtDate(source.date)) + " · " + fmtDuration(source.duration) + '</p><div><button class="button hot" onclick="__play(\'' + source.id + '\',' + (timestamp || 0) + ',\'' + esc(sourceTitle(source)) + '\')">▶ ' + (timestamp ? "PLAY AT " + fmtTime(timestamp) : "WATCH FROM START") + '</button><a class="button glass" href="' + esc(source.url) + '" target="_blank" rel="noopener">YOUTUBE SOURCE ↗</a>' + (issue ? '<a class="button glass" href="#/central/' + source.id + '">READ CENTRAL EDITION</a>' : '') + '</div></div><aside>' + heatBar(source) + '<div><b>' + source.moments.length + "</b><span>REVIEWED CUTS</span></div><div><b>" + source.transcriptLines.toLocaleString() + "</b><span>TIMED SEGMENTS</span></div></aside></div></section>" +
      '<section class="race-facts"><div class="wrap"><div><span>LANE</span><b>' + esc(laneLabel(source.lane)) + "</b></div><div><span>TRACK</span><b>" + esc(source.track) + "</b></div><div><span>FILE</span><b>" + (source.lane === "official" ? "S" + source.season + " / R" + source.race : esc(source.kind)) + "</b></div><div><span>RESULT</span><b>" + esc(result.status || "unknown") + "</b></div><div><span>TRANSCRIPT</span><b>" + esc(source.transcriptStatus) + "</b></div></div></section>" +
      '<section class="evidence-tower"><div class="wrap"><article class="done"><b>01</b><span>PRIMARY RACE TAPE</span><strong>' + source.transcriptLines.toLocaleString() + ' TIMED SEGMENTS</strong></article><article class="' + (source.companion ? "done" : "") + '"><b>02</b><span>HLRN COMPANION</span><strong>' + (source.companion ? "MATCHED" : "NOT FOUND") + '</strong></article><article class="' + (issue ? "done" : "") + '"><b>03</b><span>EDITORIAL REVIEW</span><strong>' + (issue ? moments.length + " BOUNDED CUTS" : source.candidateCount + " CANDIDATES QUARANTINED") + '</strong></article><article class="' + (result.status !== "unknown" ? "done" : "") + '"><b>04</b><span>RESULT RECEIPT</span><strong>' + esc(String(result.status || "unknown").toUpperCase()) + '</strong></article></div></section>' +
      '<div class="wrap race-layout"><main>' +
      (issue ? '<section class="race-recap authored"><span>HIGHLINE CENTRAL RACE READ</span><h2>' + esc(issue.headline) + '</h2><p class="race-deck">' + esc(issue.deck) + '</p>' + issue.lead.map(function (paragraph) { return '<p>' + esc(paragraph) + '</p>'; }).join("") + '<a href="#/central/' + source.id + '">READ THE NEWSPAPER EDITION →</a></section>' : '<section class="race-recap"><span>HIGHLINE LIVE / SOURCE-FIRST FILE</span><h2>THE BONUS RACE REMAINS FULLY OPEN</h2><p>' + esc(source.recap) + '</p><p>' + source.candidateCount + ' automated transcript candidates were retained for research but are not published as highlights until a human review gives them unique titles, context, and boundaries.</p></section>') +
      (moments.length ? radarForSource(source) : '') +
      (issue ? '<section class="race-three-act"><div class="section-title"><div><span>ORDERED RACE STORY</span><h2>THE NIGHT IN THREE ACTS</h2></div></div>' + acts.map(function (phase, actIndex) { var actMoments = moments.filter(function (moment) { return moment.phase === phase; }); return '<article><header><b>0' + (actIndex + 1) + '</b><div><span>' + ["OPENING", "PRESSURE", "CLOSING"][actIndex] + '</span><h3>' + ["THE BOARD IS SET", "THE RACE CHANGES SHAPE", "THE RESULT ARRIVES"][actIndex] + '</h3></div></header><div class="moment-grid">' + actMoments.map(function (moment) { return momentCard(moment, false); }).join("") + '</div></article>'; }).join("") + '</section>' : '') +
      '<section class="race-moments"><div class="section-title"><div><span>' + (moments.length ? "THE EDITOR'S CUT" : "SOURCE ACCESS") + '</span><h2>' + (moments.length ? "EVERY REVIEWED ENTRY POINT" : "FULL TAPE, NO FAKE HIGHLIGHTS") + '</h2></div></div>' + (moments.length ? '<div class="moment-grid">' + moments.map(function (item) { return momentCard(item, false); }).join("") + '</div>' : '<div class="empty-state">This bonus file remains playable and searchable. No machine-generated card is promoted as an editorial highlight.</div>') + "</section>" +
      '<section class="race-transcript"><div class="section-title"><div><span>DEEP TAPE SEARCH</span><h2>SCAN THIS BROADCAST</h2></div></div><div class="race-scan"><input id="raceScanInput" placeholder="Driver, phrase, incident, strategy…" onkeydown="if(event.key===\'Enter\')__scanRace(\'' + source.id + '\')"><button onclick="__scanRace(\'' + source.id + '\')">SCAN</button></div><div id="raceScanResults"><p>Search only this source and jump to the matching second.</p></div></section></main><aside>' +
      '<section class="result-bay"><span>RESULT BAY / ' + esc(String(result.status || "unknown").toUpperCase()) + "</span><h3>" + (result.winner ? esc(result.winner) : "WINNER OPEN") + "</h3><p>" + esc(result.note || "") + "</p>" + ((result.podium || []).length > 1 ? '<ol class="podium-list">' + result.podium.map(function (name, index) { return '<li><b>P' + (index + 1) + '</b><span>' + esc(name) + '</span></li>'; }).join("") + '</ol>' : '') + (result.raceStat ? '<small class="race-stat">' + esc(result.raceStat) + '</small>' : '') + (result.ruling ? '<small class="race-ruling">' + esc(result.ruling) + '</small>' : '') + (result.receipt ? '<button onclick="__play(\'' + (result.receipt.sourceId || source.id) + '\',' + result.receipt.t + ',\'Result receipt\')">▶ PLAY RESULT RECEIPT</button>' : "") + "</section>" +
      (source.companion ? '<section class="race-companion"><span>THE SHOW / CONNECTED SOURCE</span><img src="' + esc(source.companion.thumb) + '" alt=""><h3>' + esc(source.companion.title) + '</h3><p>HLRN-authored context and entertainment, separated from the primary scoring lane.</p><button onclick="__play(\'' + source.companion.id + '\',0,\'' + esc(source.companion.title) + '\')">▶ PLAY THE SHOW</button>' + (issue ? '<a href="#/central/' + source.id + '">READ CENTRAL EDITION →</a>' : '') + '</section>' : "") +
      (drivers.length ? '<section class="race-drivers"><span>DRIVERS IN REVIEWED STORY</span>' + drivers.slice(0, 18).map(function (driver) { return '<a href="#/driver/' + driver.id + '">' + esc(driver.name) + "</a>"; }).join("") + "</section>" : "") +
      '<section class="signal-components"><span>TAPE HEAT / DISCOVERY MODEL</span>' + Object.entries(source.heat.components || {}).map(function (entry) { return '<div><b>' + esc(entry[0].toUpperCase()) + '</b><i><em style="width:' + Math.min(100, entry[1] * 5) + '%"></em></i><strong>' + entry[1] + "</strong></div>"; }).join("") + '<p>This score ranks research usefulness. It does not decide the editorial story.</p></section>' +
      '<section class="source-contract"><span>SOURCE CONTRACT</span><p>Stable ID <code>' + esc(source.id) + "</code></p><p>No race video is copied. Every cut opens HLRN's original upload or its matched companion.</p></section></aside></div></article>";
    if (timestamp) setTimeout(function () { window.__play(source.id, timestamp, sourceTitle(source)); }, 100);
  }

  window.__scanRace = async function (id) {
    var input = document.getElementById("raceScanInput");
    var box = document.getElementById("raceScanResults");
    if (!input || !box || !input.value.trim()) return;
    box.innerHTML = "<p>LOCKING ONTO SOURCE…</p>";
    var lines = await loadTranscript(id);
    var terms = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    var hits = lines.filter(function (line) { var text = line[1].toLowerCase(); return terms.every(function (term) { return text.includes(term); }); }).slice(0, 60);
    box.innerHTML = hits.length ? '<div class="race-scan-hits">' + hits.map(function (line) { return '<button onclick="__play(\'' + id + '\',' + line[0] + ',\'Transcript search\')"><b>▶ ' + fmtTime(line[0]) + "</b><span>" + esc(compact(line[1], 300)) + "</span></button>"; }).join("") + "</div>" : "<p>No exact line match in this source. Try a shorter phrase or surname.</p>";
  };

  window.__openHighLine = function () {
    var battles = DATA.moments.filter(function (item) { return item.category === "battle" && (state.canon === "all" || item.lane === "official"); });
    if (!battles.length) return toast("The battle frequency is still recovering");
    var moment = battles[Math.floor(Math.random() * battles.length)];
    document.body.classList.add("highline-open");
    setTimeout(function () { document.body.classList.remove("highline-open"); }, 1300);
    window.__play(moment.sourceId, moment.t, "The high line is open");
  };

  document.addEventListener("keydown", function (event) {
    var tag = (document.activeElement || {}).tagName || "";
    if ((event.key === "h" || event.key === "H") && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
      window.__openHighLine();
    }
    if (event.key === "Escape" && document.body.classList.contains("player-open")) window.__closePlayer();
  });

  function notFound() {
    app.innerHTML = '<div class="not-found"><span>NO CARRIER</span><h1>THE SIGNAL MISSED.</h1><p>That route does not exist in the current HLRN archive.</p><a class="button hot" href="#/">RETURN TO CENTRAL</a></div>';
  }

  function route() {
    renderNav();
    var hash = location.hash || "#/";
    var match;
    window.scrollTo(0, 0);
    if (hash === "#/" || hash === "") home();
    else if (hash === "#/watch") watch();
    else if (hash === "#/ask") askPage("");
    else if ((match = hash.match(/^#\/ask\/(.+)$/))) askPage(decodeURIComponent(match[1]));
    else if (hash === "#/highlights") highlightPage();
    else if (hash === "#/central") central();
    else if ((match = hash.match(/^#\/central\/([\w-]+)$/))) centralIssue(match[1]);
    else if (hash === "#/drivers") driversPage();
    else if ((match = hash.match(/^#\/driver\/([\w-]+)$/))) driverPage(match[1]);
    else if (hash === "#/seasons") seasonsPage();
    else if ((match = hash.match(/^#\/season\/(\d+)$/))) seasonPage(match[1]);
    else if (hash === "#/rankings") rankingsPage();
    else if ((match = hash.match(/^#\/rankings\/([\w-]+)$/))) rankingsPage(match[1]);
    else if (hash === "#/highline-live") highlineLive();
    else if (hash === "#/radar") radarPage();
    else if (hash === "#/frequency") frequencyPage();
    else if (hash === "#/records") recordsPage();
    else if (hash === "#/sources") sourcesPage();
    else if (hash === "#/methodology") methodologyPage();
    else if (hash === "#/explore") explorePage();
    else if ((match = hash.match(/^#\/race\/([\w-]+)\/t\/(\d+)$/))) racePage(match[1], Number(match[2]));
    else if ((match = hash.match(/^#\/race\/([\w-]+)$/))) racePage(match[1]);
    else notFound();
    var heading = app.querySelector("h1");
    document.title = (heading ? heading.textContent.replace(/\s+/g, " ").trim() + " · " : "") + "HLRN Living Wiki";
    app.focus({ preventScroll: true });
  }

  window.addEventListener("hashchange", route);
  renderFooter();
  route();
})();
