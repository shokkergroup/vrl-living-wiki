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
      (source.moments || []).length + " exact signals</span></footer></div></article>";
  }

  function momentCard(moment, compactMode) {
    var source = sourceMap[moment.sourceId] || {};
    var driverLinks = (moment.drivers || []).slice(0, 4).map(function (id) {
      var driver = driverMap[id];
      return driver ? '<a href="#/driver/' + esc(id) + '">' + esc(driver.name) + "</a>" : "";
    }).filter(Boolean).join("");
    return '<article class="moment-card ' + esc(moment.category) + ' ' + (compactMode ? "compact" : "") + '">' +
      '<div class="moment-time"><button onclick="__play(\'' + esc(moment.sourceId) + '\',' + moment.t + ',\'' + esc(moment.title) + '\')">▶ ' + fmtTime(moment.t) + "</button><span>" + esc(moment.category.toUpperCase()) + "</span></div>" +
      '<div class="moment-copy"><small>' + esc(laneLabel(moment.lane)) + " · " + esc(moment.track) + "</small>" +
      "<h3>" + esc(moment.title) + "</h3>" +
      (compactMode ? "" : "<p>" + esc(moment.summary) + "</p>") +
      (driverLinks ? '<div class="driver-chips">' + driverLinks + "</div>" : "") +
      '<footer><a href="#/race/' + esc(moment.sourceId) + '/t/' + moment.t + '">OPEN SIGNAL FILE</a><span class="review-state ' + esc(moment.reviewStatus) + '">' +
      esc(String(moment.reviewStatus || "").replace(/-/g, " ").toUpperCase()) + "</span></footer></div></article>";
  }

  function driverCard(driver) {
    var stats = driver.stats || {};
    return '<a class="driver-card" href="#/driver/' + esc(driver.id) + '">' +
      '<div class="driver-monogram">' + esc(driver.name.split(/\s+/).map(function (part) { return part[0]; }).slice(0, 2).join("")) + "</div>" +
      '<div><span>' + esc(driver.team || "TEAM NOT STATED") + "</span><h3>" + esc(driver.name) + "</h3>" +
      '<p>' + stats.officialSourceCount + " official files · " + stats.sourceCount + " total tape files</p></div>" +
      '<aside><b>' + Number(stats.officialMentions || 0).toLocaleString() + "</b><small>OFFICIAL<br>SIGNALS</small></aside></a>";
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
      script.src = "assets/tr/" + id + ".js?v=hlrn-1";
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
      return { title: driver.name + " has " + driver.stats.officialMentions.toLocaleString() + " official mention signals.", text: "The normalized identity appears across " + driver.stats.officialSourceCount + " official race files and " + driver.stats.liveSourceCount + " Highline Live files, with " + driver.stats.momentCount + " surfaced exact moments. These are archive appearances, not official starts.", status: "IDENTITY-SAFE ANSWER", driver: driver };
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
      var lane = state.highlightLane === "all" || item.lane === state.highlightLane;
      var category = state.highlightCategory === "all" || item.category === state.highlightCategory;
      return lane && category;
    }).sort(function (a, b) { return b.score - a.score || b.heat - a.heat; });
    var official = DATA.sources.filter(function (item) { return item.lane === "official"; });
    app.innerHTML = '<div class="highlights-page">' + pageHead("HIGHLIGHT CONTROL / NO COPIED VIDEO", "THE EXACT <em>MOMENT.</em>", "Every card is an edit map into the original HLRN source—not a re-upload, montage, or detached clip.", [
      [DATA.moments.length, "SURFACED SIGNALS"], [official.length, "OFFICIAL RACE FILES"], [DATA.moments.filter(function (m) { return m.category === "restart"; }).length, "RESTART SIGNALS"],
    ]) + '<div class="wrap"><section class="last-lap-lottery"><div><span>HLRN RETURN RITUAL</span><h2>LAST LAP LOTTERY</h2><p>One button. One closing signal. No spoiler until the source player opens.</p></div><button onclick="__lastLap()">DROP ME INTO THE FINISH <b>▶</b></button></section>' +
      '<section class="restart-stack"><header><div><span>HLRN SIGNATURE / RESTART STACK</span><h2>GREEN. YELLOW. DO IT AGAIN.</h2></div><p>Ordered transition signals from the official tape. Machine-surfaced entries stay labeled until editorial review.</p></header><div class="restart-races">' +
      official.map(function (source) {
        var restarts = source.moments.filter(function (item) { return item.category === "restart"; });
        return restarts.length ? '<article><a href="#/race/' + source.id + '"><span>S' + source.season + " / R" + source.race + '</span><b>' + esc(source.track) + "</b></a><div>" + restarts.slice(0, 5).map(function (moment) {
          return '<button onclick="__play(\'' + source.id + '\',' + moment.t + ',\'' + esc(moment.title) + '\')">' + fmtTime(moment.t) + "</button>";
        }).join("") + "</div></article>" : "";
      }).join("") + "</div></section>" +
      '<section class="highlight-library"><header><div><span>THE SIGNAL LIBRARY</span><h2>PLAYABLE MOMENTS</h2></div><div class="filter-row"><select onchange="__highlightLane(this.value)" aria-label="Highlight lane"><option value="official"' + (state.highlightLane === "official" ? " selected" : "") + '>OFFICIAL HLRN</option><option value="highline-live"' + (state.highlightLane === "highline-live" ? " selected" : "") + '>HIGHLINE LIVE</option><option value="all"' + (state.highlightLane === "all" ? " selected" : "") + ">ALL TAPE</option></select><select onchange=\"__highlightCategory(this.value)\" aria-label=\"Highlight category\">" +
      ["all", "finish", "battle", "incident", "restart", "strategy", "booth", "interview"].map(function (category) { return '<option value="' + category + '"' + (state.highlightCategory === category ? " selected" : "") + ">" + category.toUpperCase() + "</option>"; }).join("") +
      "</select></div></header><div class=\"moment-grid\">" + moments.slice(0, 100).map(function (item) { return momentCard(item, false); }).join("") + "</div></section>" +
      evidenceNote("A HIGHLIGHT IS A ROUTE, NOT A VERDICT.", "Machine-surfaced signals are timestamped discovery candidates. Authored receipts have passed a source-bounded editorial review. Both remain recoverable on the original HLRN upload.") +
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

  function central() {
    var official = DATA.sources.filter(function (item) { return item.lane === "official"; }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    var latest = official[0];
    var companions = DATA.auxiliary.filter(function (item) { return item.lane === "the-show"; }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    app.innerHTML = '<div class="central-page">' + pageHead("HIGHLINE CENTRAL / THE NETWORK DESK", "THE RACE.<br><em>THE SHOW.</em><br>THE RECEIPTS.", "Central turns each official race into a desk file and pairs it with HLRN’s own companion episode whenever one exists.", [
      [official.length, "RACE DESK FILES"], [official.filter(function (item) { return item.companion; }).length, "MATCHED COMPANIONS"], [companions.length, "THE SHOW FILES"],
    ]) + '<div class="wrap">' +
      (latest ? '<section class="central-lead"><div class="central-cover"><img src="' + esc(latest.thumb) + '" alt=""><span>DESK FILE ' + String(latest.race).padStart(2, "0") + '</span></div><div class="central-lead-copy"><span>NEWEST OFFICIAL DESK FILE / ' + esc(fmtDate(latest.date).toUpperCase()) + "</span><h2>" + esc(sourceTitle(latest)) + "</h2><p>" + esc(latest.recap) + '</p><div><a class="button hot" href="#/central/' + latest.id + '">READ THE DESK FILE</a><button class="button glass" onclick="__play(\'' + latest.id + '\',0,\'' + esc(sourceTitle(latest)) + '\')">WATCH THE RACE</button></div></div>' +
      (latest.companion ? '<aside class="companion-ticket"><span>AFTER THE CHECKER</span><img src="' + esc(latest.companion.thumb) + '" alt=""><h3>' + esc(latest.companion.title) + '</h3><button onclick="__play(\'' + latest.companion.id + '\',0,\'' + esc(latest.companion.title) + '\')">▶ PLAY THE SHOW</button></aside>' : "") + "</section>" : "") +
      '<section class="central-runs"><div class="section-title"><div><span>THE COMPLETE OFFICIAL RUN</span><h2>DESK FILES / SEASONS 1–2</h2></div></div><div class="desk-file-grid">' +
      official.map(function (source) {
        return '<a class="desk-file" href="#/central/' + source.id + '"><div><span>S' + source.season + " / " + String(source.race).padStart(2, "0") + '</span><b>' + esc(source.track) + "</b></div><h3>" + esc(source.name) + "</h3><p>" + esc(fmtDate(source.date)) + " · " + source.moments.length + " timed signals</p><footer>" + (source.companion ? "<span>THE SHOW CONNECTED</span>" : "<span>COMPANION OPEN</span>") + "<em>READ →</em></footer></a>";
      }).join("") + "</div></section>" +
      '<section class="show-shelf"><div class="section-title"><div><span>THE NETWORK’S OWN RECAP LANE</span><h2>THE SHOW / COMPANION SHELF</h2></div></div><div class="show-scroll">' +
      companions.map(function (item) { return '<article><img src="' + esc(item.thumb) + '" alt=""><span>' + esc(fmtDate(item.date, true).toUpperCase()) + "</span><h3>" + esc(item.title) + '</h3><button onclick="__play(\'' + item.id + '\',0,\'' + esc(item.title) + '\')">▶ ' + fmtDuration(item.duration) + "</button></article>"; }).join("") + "</div></section>" +
      evidenceNote("CENTRAL USES TWO SOURCE LANES.", "The livestream is the primary race tape. The Show is supplemental channel-authored context. When the two differ, the contradiction is preserved for review rather than silently resolved.") +
      "</div></div>";
  }

  function centralIssue(id) {
    var source = sourceMap[id];
    if (!source || source.lane !== "official") return central();
    var moments = source.moments || [];
    var thirds = [
      moments.filter(function (item) { return item.t < source.duration / 3; }),
      moments.filter(function (item) { return item.t >= source.duration / 3 && item.t < source.duration * 2 / 3; }),
      moments.filter(function (item) { return item.t >= source.duration * 2 / 3; }),
    ];
    app.innerHTML = '<article class="central-issue"><div class="central-mast"><div class="wrap"><div><span>HIGHLINE CENTRAL / SEASON ' + source.season + "</span><h1>CENTRAL</h1></div><section><b>DESK FILE " + String(source.race).padStart(2, "0") + "</b><time>" + esc(fmtDate(source.date).toUpperCase()) + "</time><small>" + source.moments.length + " SIGNAL RECEIPTS / " + source.transcriptLines + " TIMED SEGMENTS</small></section></div></div>" +
      '<div class="wrap issue-grid"><main><div class="issue-cover"><img src="' + esc(source.thumb) + '" alt=""><div><span>THE OFFICIAL RACE FILE</span><h2>' + esc(source.name) + "</h2><p>" + esc(source.track) + " / HLRN SEASON " + source.season + " RACE " + source.race + '</p><button onclick="__play(\'' + source.id + '\',0,\'' + esc(sourceTitle(source)) + '\')">▶ WATCH THE RACE</button></div></div>' +
      '<section class="issue-story"><span>THE DESK RECAP</span><h2>WHAT THE TAPE CAN SAY TODAY</h2><p>' + esc(source.recap) + "</p></section>" +
      '<section class="three-act"><header><span>THE RACE IN THREE SIGNAL BANDS</span><h2>OPENING / PRESSURE / CLOSING</h2></header>' +
      thirds.map(function (items, index) { return '<div class="act"><b>0' + (index + 1) + '</b><span>' + ["OPENING BAND", "PRESSURE BAND", "CLOSING BAND"][index] + "</span><div>" + (items.length ? items.map(function (item) { return momentCard(item, true); }).join("") : '<p class="no-signal">No timed signal is published in this band yet.</p>') + "</div></div>"; }).join("") + "</section>" +
      radarForSource(source) + "</main><aside>" +
      '<section class="issue-facts"><span>CONTROL ROOM READOUT</span><div><b>' + source.heat.score + "</b><small>TAPE HEAT</small></div><dl><dt>Track</dt><dd>" + esc(source.track) + "</dd><dt>Runtime</dt><dd>" + fmtDuration(source.duration) + "</dd><dt>Views</dt><dd>" + source.views.toLocaleString() + "</dd><dt>Transcript</dt><dd>" + esc(source.transcriptStatus) + "</dd><dt>Results</dt><dd>" + esc(source.result.status) + "</dd></dl></section>" +
      (source.companion ? '<section class="issue-companion"><span>THE SHOW / COMPANION</span><img src="' + esc(source.companion.thumb) + '" alt=""><h3>' + esc(source.companion.title) + '</h3><p>A separate HLRN-authored companion source. It can support context without replacing the full race tape.</p><button onclick="__play(\'' + source.companion.id + '\',0,\'' + esc(source.companion.title) + '\')">▶ PLAY COMPANION</button></section>' : "") +
      '<section class="result-bay"><span>RESULT BAY</span><h3>' + (source.result.winner ? esc(source.result.winner) : "WINNER OPEN") + "</h3><p>" + esc(source.result.note) + '</p><a href="#/methodology">WHY UNKNOWN STAYS OPEN →</a></section>' +
      "</aside></div></article>";
  }

  function driversPage() {
    var query = state.driverQuery.toLowerCase();
    var drivers = DATA.drivers.filter(function (item) {
      return !query || item.name.toLowerCase().includes(query) || String(item.team || "").toLowerCase().includes(query);
    });
    app.innerHTML = '<div class="drivers-page">' + pageHead("GARAGE PASSES / NORMALIZED IDENTITIES", "WHO'S ON <em>THE TAPE?</em>", "Driver dossiers join aliases, official-season callouts, Highline Live appearances, tracks, and exact moments. Archive appearances are not claimed as official starts.", [
      [DATA.drivers.length, "DOSSIERS"], [DATA.drivers.filter(function (item) { return item.stats.officialSourceCount; }).length, "ON OFFICIAL TAPE"], ["0", "INFERRED STARTS"],
    ]) + '<div class="wrap"><div class="driver-search"><span>FIND A GARAGE PASS</span><input value="' + esc(state.driverQuery) + '" placeholder="Driver or team…" oninput="__driverFilter(this.value)"><b>' + drivers.length + " MATCHES</b></div><div class=\"driver-grid\">" + drivers.map(driverCard).join("") + "</div>" +
      evidenceNote("A DOSSIER IS AN ARCHIVE IDENTITY, NOT AN ENTRY LIST.", "Two or more normalized mentions retain a source appearance. That can include competition, booth discussion, an interview, or another clear reference. Official starts remain unknown until an entry/result ledger exists.") +
      "</div></div>";
  }
  window.__driverFilter = function (value) { state.driverQuery = value; driversPage(); var input = app.querySelector(".driver-search input"); if (input) { input.focus(); input.setSelectionRange(value.length, value.length); } };

  function driverPage(id) {
    var driver = driverMap[id];
    if (!driver) return driversPage();
    var stats = driver.stats;
    var sources = driver.appearances.map(function (item) { return sourceMap[item.sourceId]; }).filter(Boolean);
    var rankings = DATA.rankings.order.map(function (boardId) {
      var board = DATA.rankings.boards[boardId];
      var entry = board.entries.find(function (item) { return item.driverId === driver.id; });
      return entry ? { board: board, entry: entry } : null;
    }).filter(Boolean);
    app.innerHTML = '<article class="driver-page"><section class="driver-hero"><div class="wrap"><div class="driver-hero-mark">' + esc(driver.name.split(/\s+/).map(function (p) { return p[0]; }).slice(0, 2).join("")) + '</div><div><span>GARAGE PASS / ' + esc(String(driver.identityStatus).replace(/-/g, " ").toUpperCase()) + "</span><h1>" + esc(driver.name) + "</h1>" +
      (driver.team ? "<p>" + esc(driver.team) + "</p>" : "<p>TEAM NOT CONSISTENTLY STATED ON REVIEWED TAPE</p>") +
      (driver.aliases && driver.aliases.length ? '<small>TRANSCRIPT ALIASES / ' + driver.aliases.map(esc).join(" / ") + "</small>" : "") + '</div><aside><div><b>' + stats.officialMentions.toLocaleString() + "</b><span>OFFICIAL<br>MENTIONS</span></div><div><b>" + stats.officialSourceCount + "</b><span>OFFICIAL<br>FILES</span></div><div><b>" + stats.momentCount + "</b><span>EXACT<br>MOMENTS</span></div></aside></div></section>" +
      '<div class="wrap driver-body"><main><section class="driver-summary"><span>THE ARCHIVE READ</span><h2>A SIGNAL-BUILT DOSSIER</h2><p>' + esc(driver.name) + " appears in " + stats.sourceCount + " race broadcasts under the current normalized identity, including " + stats.officialSourceCount + " official HLRN files and " + stats.liveSourceCount + " Highline Live files. The current tape index carries " + stats.frontPackSignals + " mentions inside battle or closing-language windows. None of those counts is presented as starts, laps led, incidents, points, or an ability rating.</p></section>" +
      (driver.topMoments.length ? '<section class="driver-moments"><div class="section-title"><div><span>PLAY THE DRIVER, NOT THE DATABASE</span><h2>SIGNATURE TAPE</h2></div></div><div class="moment-grid">' + driver.topMoments.map(function (item) { return momentCard(item, false); }).join("") + "</div></section>" : "") +
      '<section class="driver-sources"><div class="section-title"><div><span>THE APPEARANCE INDEX</span><h2>RACE FILES</h2></div></div><div class="source-grid">' + sources.slice(0, 24).map(sourceCard).join("") + "</div></section></main><aside>" +
      '<section class="driver-fingerprint"><span>TRACK FINGERPRINT</span>' + (driver.topTracks.length ? driver.topTracks.map(function (item) { return '<div><b>' + esc(item.track) + "</b><i><em style=\"width:" + Math.min(100, item.sourceCount * 16) + '%"></em></i><strong>' + item.sourceCount + "</strong></div>"; }).join("") : "<p>No repeated track signal yet.</p>") + "</section>" +
      '<section class="driver-rank-resume"><span>TAPE RANKING RESUME</span>' + (rankings.length ? rankings.map(function (item) { return '<a href="#/rankings/' + item.board.id + '"><b>#' + item.entry.rank + "</b><div><span>" + esc(item.board.name) + "</span><small>" + item.entry.score + " " + esc(item.board.metric) + "</small></div></a>"; }).join("") : "<p>No current Top 25 placement.</p>") + "</section>" +
      '<section class="result-bay"><span>TAPE-SUPPORTED RESULTS</span><h3>' + stats.tapeSupportedWins + ' WIN' + (stats.tapeSupportedWins === 1 ? "" : "S") + '</h3><p>' + stats.tapeSupportedPodiums + ' recovered podium result' + (stats.tapeSupportedPodiums === 1 ? "" : "s") + '. Starts, points, and complete finishing orders still wait for owner result sheets.</p>' + ((driver.winRaceIds || []).length ? '<div class="result-links">' + driver.winRaceIds.map(function (id) { var race = sourceMap[id]; return race ? '<a href="#/race/' + id + '">' + esc(race.track) + ' →</a>' : ""; }).join("") + '</div>' : '') + '</section></aside></div></article>';
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
    app.innerHTML = '<div class="rankings-page">' + pageHead("TOP 25 / TAPE IMPACT ONLY", "RANK WHAT THE<br><em>ARCHIVE CAN PROVE.</em>", "Six explainable boards measure broadcast gravity, exact-moment involvement, and source coverage. No board pretends to be official performance.", [
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
    ]) + '<div class="wrap"><section class="live-manifesto"><b>BONUS DOES NOT MEAN BURIED.</b><p>Every complete Highline Live race receives playback, search, signal moments, tape heat, driver appearances, and a race file. It simply cannot alter official Season 1–2 totals.</p></section><div class="live-search"><span>SCAN THE BONUS SHELF</span><input value="' + esc(state.liveQuery) + '" placeholder="Track, series, special…" oninput="__liveFilter(this.value)"><b>' + sources.length + " FILES</b></div><div class=\"source-grid live-grid\">" + sources.map(sourceCard).join("") + "</div>" +
      '<section class="fragment-shelf"><div class="section-title"><div><span>PRESERVED WITHOUT PRETENSE</span><h2>FRAGMENTS + TECHNICAL TAPE</h2></div></div><div>' + DATA.sources.filter(function (item) { return item.lane === "fragment"; }).map(function (item) {
        return '<a href="#/race/' + item.id + '"><b>' + esc(item.title) + "</b><span>" + esc(item.fragmentNote || "Incomplete source") + "</span><em>" + fmtDuration(item.duration) + "</em></a>";
      }).join("") + "</div></section></div></div>";
  }
  window.__liveFilter = function (value) { state.liveQuery = value; highlineLive(); var input = app.querySelector(".live-search input"); if (input) { input.focus(); input.setSelectionRange(value.length, value.length); } };

  function radarForSource(source) {
    var moments = source.moments || [];
    return '<section class="source-radar"><header><div><span>HLRN SIGNATURE / HIGH LINE RADAR</span><h2>THE WHOLE SIGNAL SWEEP</h2></div><p>Position reflects source time. Color reflects the surfaced signal type.</p></header><div class="radar-track"><i class="radar-beam"></i>' +
      moments.map(function (item) {
        var left = Math.min(99, (item.t / Math.max(1, source.duration)) * 100);
        return '<button class="' + esc(item.category) + '" style="left:' + left + '%" onclick="__play(\'' + source.id + '\',' + item.t + ',\'' + esc(item.title) + '\')" title="' + esc(item.title) + " · " + fmtTime(item.t) + '"><i></i><span>' + fmtTime(item.t) + "</span></button>";
      }).join("") + '<div class="radar-base"><span>0:00</span><span>' + fmtTime(source.duration / 2) + "</span><span>" + fmtTime(source.duration) + "</span></div></div><div class=\"radar-legend\">" +
      ["finish", "battle", "incident", "restart", "strategy", "booth", "interview"].map(function (item) { return '<span class="' + item + '"><i></i>' + item.toUpperCase() + "</span>"; }).join("") + "</div></section>";
  }

  function radarPage() {
    var lane = state.radarLane;
    var sources = DATA.sources.filter(function (item) { return item.lane === lane && item.isComplete && item.moments.length; }).sort(function (a, b) { return b.heat.score - a.heat.score; });
    app.innerHTML = '<div class="radar-page">' + pageHead("HIGH LINE RADAR / STORY-STATE RECONSTRUCTION", "SEE THE RACE<br><em>BEFORE YOU PRESS PLAY.</em>", "Every sweep maps transcript-surfaced story signals across source time. It is a broadcast reconstruction—not official telemetry.", [
      [sources.length, "ACTIVE SWEEPS"], [sources.reduce(function (sum, item) { return sum + item.moments.length; }, 0), "RADAR CONTACTS"], ["0", "TELEMETRY CLAIMS"],
    ]) + '<div class="wrap"><div class="radar-switch"><button class="' + (lane === "official" ? "on" : "") + '" onclick="__radarLane(\'official\')">OFFICIAL HLRN</button><button class="' + (lane === "highline-live" ? "on" : "") + '" onclick="__radarLane(\'highline-live\')">HIGHLINE LIVE</button></div><div class="radar-stack">' +
      sources.map(function (source) { return '<article><a href="#/race/' + source.id + '"><span>' + esc(laneLabel(source.lane)) + "</span><h3>" + esc(sourceTitle(source)) + "</h3><small>" + source.heat.score + " TAPE HEAT</small></a>" + radarForSource(source) + "</article>"; }).join("") + "</div>" +
      evidenceNote("RADAR IS A STORY MAP.", "The dots come from exact transcript windows and authored receipts. Their time is real; their category is editorial. They do not represent car position, speed, incident blame, or race-control data.") + "</div></div>";
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
        return '<a href="#/race/' + source.id + '"><time>' + esc(source.date || "UNKNOWN") + "</time><span class=\"table-lane " + source.lane + '">' + esc(laneLabel(source.lane)) + "</span><b>" + esc(sourceTitle(source)) + "</b><span>" + esc(source.track) + "</span><span>" + esc(source.transcriptStatus) + " / " + source.moments.length + " signals</span><span>" + esc(source.result.status) + "</span></a>";
      }).join("") + "</div>" + evidenceNote("SOURCE AVAILABILITY IS PART OF THE RECORD.", "If a video is later removed, the stable source identity remains as a tombstone with its known metadata and prior receipts. Removed tape is never silently repointed to another upload.") + "</div></div>";
  }

  function methodologyPage() {
    var policy = DATA.meta.canonPolicy || {};
    app.innerHTML = '<div class="method-page">' + pageHead("METHODOLOGY / THE TRUST CONTRACT", "FAST TO EXPLORE.<br><em>SLOW TO CLAIM.</em>", "The invisible engine is reusable. HLRN’s canon, vocabulary, visual world, scoring signals, Central desk, and fan rituals are native to this network.", [
      ["52", "LIVESTREAMS AUDITED"], ["2", "CANON LANES"], ["4", "EVIDENCE STATES"],
    ]) + '<div class="wrap"><section class="method-grid"><article><span>01 / CANON</span><h2>WHAT COUNTS AS OFFICIAL?</h2><p>' + esc(policy.officialRule || "") + "</p></article><article><span>02 / BONUS</span><h2>WHAT IS HIGHLINE LIVE?</h2><p>" + esc(policy.bonusRule || "") + "</p></article><article><span>03 / FRAGMENTS</span><h2>WHY KEEP PARTIAL TAPE?</h2><p>" + esc(policy.fragmentRule || "") + "</p></article><article><span>04 / RESULTS</span><h2>WHY ARE CELLS OPEN?</h2><p>" + esc(policy.resultRule || "") + "</p></article></section>" +
      '<section class="evidence-ladder"><span>EVIDENCE LADDER</span><h2>FOUR STATES THAT NEVER BLUR TOGETHER</h2><div><article><b>1</b><h3>MACHINE SURFACED</h3><p>A timestamp candidate found in captions or ASR. Playable, visibly provisional.</p></article><article><b>2</b><h3>AUTHORED RECEIPT</h3><p>A human-bounded moment or claim tied to the exact source window.</p></article><article><b>3</b><h3>EDITOR VERIFIED</h3><p>Context, identity, and relationship checked against the tape.</p></article><article><b>4</b><h3>CREATOR CERTIFIED</h3><p>HLRN or an authorized owner confirms the record.</p></article></div></section>' +
      '<section class="heat-method"><span>TAPE HEAT / PUBLISHED COMPONENTS</span><h2>THE SIGNAL MODEL</h2><p>Finish, battle, restart, strategy, disruption, booth, and evidence signals each have visible caps. The model ranks editorial usefulness—not guaranteed quality, importance, or virality.</p><div>' + ["finish", "battle", "restart", "strategy", "disruption", "booth", "evidence"].map(function (item) { return '<span>' + item.toUpperCase() + "</span>"; }).join("") + "</div></section>" +
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
    var driverIds = Array.from(new Set(moments.flatMap(function (item) { return item.drivers || []; })));
    var drivers = driverIds.map(function (driverId) { return driverMap[driverId]; }).filter(Boolean);
    app.innerHTML = '<article class="race-page"><section class="race-hero"><div class="race-hero-bg" style="background-image:url(\'' + esc(source.thumb) + '\')"></div><div class="wrap"><div class="race-crumb"><a href="' + (source.lane === "official" ? "#/season/" + source.season : "#/highline-live") + '">' + esc(laneLabel(source.lane)) + "</a><span>/</span>" + esc(source.name) + "</div><div class=\"race-title\">" + laneBadge(source) + '<h1>' + esc(source.name) + "</h1><p>" + esc(source.track) + " · " + esc(fmtDate(source.date)) + " · " + fmtDuration(source.duration) + '</p><div><button class="button hot" onclick="__play(\'' + source.id + '\',' + (timestamp || 0) + ',\'' + esc(sourceTitle(source)) + '\')">▶ ' + (timestamp ? "PLAY AT " + fmtTime(timestamp) : "WATCH FROM START") + '</button><a class="button glass" href="' + esc(source.url) + '" target="_blank" rel="noopener">YOUTUBE SOURCE ↗</a></div></div><aside>' + heatBar(source) + '<div><b>' + source.moments.length + "</b><span>EXACT SIGNALS</span></div><div><b>" + source.transcriptLines.toLocaleString() + "</b><span>TIMED SEGMENTS</span></div></aside></div></section>" +
      '<section class="race-facts"><div class="wrap"><div><span>LANE</span><b>' + esc(laneLabel(source.lane)) + "</b></div><div><span>TRACK</span><b>" + esc(source.track) + "</b></div><div><span>FILE</span><b>" + (source.lane === "official" ? "S" + source.season + " / R" + source.race : esc(source.kind)) + "</b></div><div><span>RESULT</span><b>" + esc(result.status || "unknown") + "</b></div><div><span>TRANSCRIPT</span><b>" + esc(source.transcriptStatus) + "</b></div></div></section>" +
      '<div class="wrap race-layout"><main><section class="race-recap"><span>THE SIGNAL FILE</span><h2>WHAT THE TAPE CAN SAY TODAY</h2><p>' + esc(source.recap) + "</p></section>" +
      radarForSource(source) +
      '<section class="race-moments"><div class="section-title"><div><span>EXACT-SOURCE ENTRY POINTS</span><h2>TURNING SIGNALS</h2></div></div><div class="moment-grid">' + (moments.length ? moments.map(function (item) { return momentCard(item, false); }).join("") : '<div class="empty-state">Timed moment recovery is still in progress for this source. The full race remains playable.</div>') + "</div></section>" +
      '<section class="race-transcript"><div class="section-title"><div><span>DEEP TAPE SEARCH</span><h2>SCAN THIS BROADCAST</h2></div></div><div class="race-scan"><input id="raceScanInput" placeholder="Driver, phrase, incident, strategy…" onkeydown="if(event.key===\'Enter\')__scanRace(\'' + source.id + '\')"><button onclick="__scanRace(\'' + source.id + '\')">SCAN</button></div><div id="raceScanResults"><p>Search only this source and jump to the matching second.</p></div></section></main><aside>' +
      '<section class="signal-components"><span>TAPE HEAT COMPONENTS</span>' + Object.entries(source.heat.components || {}).map(function (entry) { return '<div><b>' + esc(entry[0].toUpperCase()) + '</b><i><em style="width:' + Math.min(100, entry[1] * 5) + '%"></em></i><strong>' + entry[1] + "</strong></div>"; }).join("") + "</section>" +
      '<section class="result-bay"><span>RESULT BAY / ' + esc(String(result.status || "unknown").toUpperCase()) + "</span><h3>" + (result.winner ? esc(result.winner) : "WINNER OPEN") + "</h3><p>" + esc(result.note || "") + "</p>" + ((result.podium || []).length > 1 ? '<ol class="podium-list">' + result.podium.map(function (name, index) { return '<li><b>P' + (index + 1) + '</b><span>' + esc(name) + '</span></li>'; }).join("") + '</ol>' : '') + (result.raceStat ? '<small class="race-stat">' + esc(result.raceStat) + '</small>' : '') + (result.ruling ? '<small class="race-ruling">' + esc(result.ruling) + '</small>' : '') + (result.receipt ? '<button onclick="__play(\'' + (result.receipt.sourceId || source.id) + '\',' + result.receipt.t + ',\'Result receipt\')">▶ PLAY RESULT RECEIPT</button>' : "") + "</section>" +
      (source.companion ? '<section class="race-companion"><span>HIGHLINE CENTRAL CONNECTED</span><img src="' + esc(source.companion.thumb) + '" alt=""><h3>' + esc(source.companion.title) + '</h3><button onclick="__play(\'' + source.companion.id + '\',0,\'' + esc(source.companion.title) + '\')">▶ THE SHOW</button><a href="#/central/' + source.id + '">READ DESK FILE →</a></section>' : "") +
      (drivers.length ? '<section class="race-drivers"><span>DRIVERS IN SURFACED MOMENTS</span>' + drivers.slice(0, 18).map(function (driver) { return '<a href="#/driver/' + driver.id + '">' + esc(driver.name) + "</a>"; }).join("") + "</section>" : "") +
      '<section class="source-contract"><span>SOURCE CONTRACT</span><p>Stable ID <code>' + esc(source.id) + "</code></p><p>No race video is copied. Playback remains on the original HLRN source.</p></section></aside></div></article>";
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
