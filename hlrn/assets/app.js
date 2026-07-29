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
    return text.length <= limit ? text : text.slice(0, limit).replace(/\s+\S*$/, "") + "â€¦";
  }

  function laneLabel(lane) {
    return lane === "official" ? "OFFICIAL HLRN" : lane === "highline-live" ? "HIGHLINE LIVE" : "SOURCE LEDGER";
  }

  function laneBadge(source) {
    return '<span class="lane-badge ' + esc(source.lane) + '">' + laneLabel(source.lane) + "</span>";
  }

  function sourceTitle(source) {
    if (source.lane === "official") {
      return "S" + source.season + " Â· R" + String(source.race).padStart(2, "0") + " / " + source.name;
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
      ? '<button class="icon-play" onclick="__play(\'' + esc(source.id) + '\',0,\'' + esc(sourceTitle(source)) + '\')" aria-label="Play ' + esc(sourceTitle(source)) + '">â–¶</button>'
      : '<span class="fragment-mark">FRAGMENT</span>';
    return '<article class="source-card ' + esc(extraClass || "") + ' ' + esc(source.lane) + '">' +
      '<a class="source-frame" href="#/race/' + esc(source.id) + '">' +
      '<img loading="lazy" src="' + esc(source.thumb) + '" alt="Official broadcast thumbnail for ' + esc(sourceTitle(source)) + '">' +
      '<span class="source-shade"></span>' + action +
      '<small>' + fmtDuration(source.duration) + "</small></a>" +
      '<div class="source-copy">' +
      '<div class="source-meta">' + laneBadge(source) + '<time>' + esc(fmtDate(source.date, true).toUpperCase()) + "</time></div>" +
      '<h3><a href="#/race/' + esc(source.id) + '">' + esc(sourceTitle(source)) + "</a></h3>" +
      '<p>' + esc(source.track) + " Â· " + esc(source.kind) + "</p>" +
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
      '<div class="moment-time"><button onclick="__play(\'' + esc(moment.sourceId) + '\',' + moment.t + ',\'' + esc(moment.title) + '\')">â–¶ ' + fmtTime(moment.t) + "</button><span>" + esc(moment.category.toUpperCase()) + "</span></div>" +
      '<div class="moment-copy"><small>' + esc(laneLabel(moment.lane)) + " Â· " + esc(moment.track) + "</small>" +
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
      '<p>' + stats.officialSourceCount + " official files Â· " + stats.sourceCount + " total tape files</p></div>" +
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
      (state.canon === "official" ? "OFFICIAL" : "ALL TAPE") + '</span></button><button class="nav-search" onclick="location.hash=\'#/ask\'" aria-label="Search the archive">âŒ•</button></div></div>' +
      '<div class="signal-rail"><i></i><span>HIGH LINE RACING NETWORK</span><b></b></div>';
  }

  function renderFooter() {
    footer.innerHTML = '<div class="wrap footer-grid"><div class="footer-brand"><img src="assets/media/hlrn-avatar.jpg" alt="High Line Racing Network"><div><b>HLRN LIVING WIKI</b><p>A SHOKKER LORE creator memory world.</p></div></div>' +
      '<div><b>THE SOURCE PROMISE</b><p>Every playable receipt returns to the original High Line Racing Network upload. The wiki copies no race video.</p></div>' +
      '<div><b>THE RESULT PROMISE</b><p>Unknown stays unknown. Official sheets can be added later without breaking race or driver routes.</p></div>' +
      '<div class="footer-links"><a href="#/methodology">Methodology</a><a href="#/sources">Source ledger</a><a href="' + esc(DATA.meta.channelUrl) + '" target="_blank" rel="noopener">YouTube channel â†—</a></div></div>' +
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
      '<header><div><span>ORIGINAL NETWORK TAPE / ' + fmtTime(start) + "</span><b>" + esc(label) + '</b></div><button onclick="__closePlayer()" aria-label="Close player">Ã—</button></header>' +
      '<div class="player-video"><iframe src="https://www.youtube-nocookie.com/embed/' + esc(id) + "?autoplay=1&rel=0&start=" + Math.floor(start) + '" title="' + esc(label) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>' +
      '<footer><div><span>SOURCE</span><b>' + esc(source.title || source.name || id) + '</b></div><a href="' + youtube + '" target="_blank" rel="noopener">RECOVER ON YOUTUBE â†—</a></footer></aside>';
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
      script.src = "assets/tr/" + id + ".js";
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
      '<p>Official HLRN Seasons 1â€“2 and the complete Highline Live shelfâ€”searchable, playable, indexed to the moment, and backed by a recovered winner receipt for every official race.</p>' +
      '<div class="hero-actions"><a class="button hot" href="#/watch">FIND A RACE</a><a class="button glass" href="#/central">ENTER CENTRAL</a></div>' +
      '<div class="hero-ledger"><div><b>' + records.officialCount + '</b><span>OFFICIAL<br>RACES</span></div><div><b>' + records.liveCount + '</b><span>HIGHLINE LIVE<br>FILES</span></div><div><b>' + records.hours + '</b><span>HOURS OF<br>TAPE</span></div><div><b>' + records.transcriptSegments.toLocaleString() + '</b><span>TIMED<br>SEGMENTS</span></div></div></div>' +
      '<aside class="hero-live-card"><div class="on-air"><i></i>SEASON 2 / CURRENT SIGNAL</div><img src="' + esc(latest.thumb) + '" alt="Latest official HLRN broadcast"><div class="hero-live-copy">' +
      laneBadge(latest) + '<h2>' + esc(sourceTitle(latest)) + '</h2><p>' + esc(latest.track) + " Â· " + esc(fmtDate(latest.date)) + "</p>" +
      heatBar(latest) + '<div><button onclick="__play(\'' + latest.id + '\',0,\'' + esc(sourceTitle(latest)) + '\')">â–¶ WATCH FROM START</button><a href="#/race/' + latest.id + '">OPEN SIGNAL FILE</a></div></div></aside></div></section>' +
      '<section class="route-console"><div class="wrap"><header><span>CHOOSE YOUR FREQUENCY</span><h2>EIGHT WAYS INTO THE NETWORK</h2></header><div class="route-grid">' +
      featureRoutes.map(function (item) { return '<a href="' + item[3] + '"><b>' + item[0] + '</b><span>' + item[1] + '</span><p>' + item[2] + '</p><em>OPEN â†—</em></a>'; }).join("") +
      '</div></div></section>' +
      '<section class="home-current"><div class="wrap"><div class="section-title"><div><span>THE OFFICIAL ROAD</span><h2>HOT SIGNALS FROM THE SEASONS</h2></div><a href="#/seasons">ALL OFFICIAL RACES â†’</a></div><div class="source-grid">' + hotOfficial.map(sourceCard).join("") + "</div></div></section>" +
      '<section class="central-tease"><div class="wrap"><div class="central-word"><span>RACE DESK / COMPANION SHOW / EXACT TAPE</span><h2>HIGHLINE<br><em>CENTRAL</em></h2><p>The league already has something VRL never did: its own short-form companion show. Central pairs each race file with The Show whenever the channel published one.</p><a class="button hot" href="#/central">OPEN THE DESK</a></div>' +
      '<div class="central-screen"><span>THE SHOW CONNECTION</span>' +
      (latest.companion ? '<img src="' + esc(latest.companion.thumb) + '" alt="Companion episode thumbnail"><h3>' + esc(latest.companion.title) + '</h3><button onclick="__play(\'' + latest.companion.id + '\',0,\'' + esc(latest.companion.title) + '\')">â–¶ PLAY COMPANION</button>' : '<div class="no-signal">COMPANION MAPPING IN REVIEW</div>') +
      "</div></div></section>" +
      (latestLive ? '<section class="live-tease"><div class="wrap"><div><span>THE BONUS FREQUENCY</span><h2>HIGHLINE LIVE</h2><p>Other leagues, specials, memorials, throwdowns, practice races, and beautiful one-off chaosâ€”covered completely, kept outside the official season math.</p><a href="#/highline-live">OPEN ALL ' + records.liveCount + ' BONUS RACES â†’</a></div>' + sourceCard(latestLive, "featured-live") + "</div></section>" : "") +
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
    return '<section class="pack-finder"><header><div><span>HLRN SIGNATURE / PACK FINDER</span><h2>FIND THE RACE BY ITS SHAPE</h2><p>Horizontal position measures battle and finish language. Vertical position measures disruption and restart language. Every point opens the underlying race file.</p></…9786 tokens truncated…><span>' + esc(laneLabel(source.lane)) + "</span><h3>" + esc(sourceTitle(source)) + "</h3><small>" + source.heat.score + " TAPE HEAT</small></a>" + radarForSource(source) + "</article>"; }).join("") + "</div>" +
      evidenceNote("RADAR IS A STORY MAP.", "The dots come from exact transcript windows and authored receipts. Their time is real; their category is editorial. They do not represent car position, speed, incident blame, or race-control data.") + "</div></div>";
  }
  window.__radarLane = function (lane) { state.radarLane = lane; radarPage(); };

  function frequencyPage() {
    app.innerHTML = '<div class="frequency-page">' + pageHead("HIGHLINE FREQUENCY / THE BOOTH AS A CHARACTER", "WHAT DOES THE<br><em>NETWORK SOUND LIKE?</em>", "Recurring race language becomes a playable frequency board. Counts are phrase hits, not separate events or verified speaker quotes.", [
      [DATA.phrases.length, "TRACKED FREQUENCIES"], [DATA.phrases.reduce(function (sum, item) { return sum + item.count; }, 0), "PHRASE HITS"], [DATA.records.transcriptSources, "TIMED SOURCES"],
    ]) + '<div class="wrap"><div class="frequency-board">' + DATA.phrases.map(function (phrase, index) {
      return '<article><header><span>FREQ ' + String(index + 1).padStart(2, "0") + "</span><b>" + phrase.count.toLocaleString() + "</b></header><h2>" + esc(phrase.label) + "</h2><p>" + phrase.sourceCount + " race sources</p><div>" + phrase.receipts.slice(0, 5).map(function (receipt) {
        return '<button onclick="__play(\'' + receipt.sourceId + '\',' + receipt.t + ',\'' + esc(phrase.label) + '\')"><span>â–¶ ' + fmtTime(receipt.t) + "</span><small>" + esc(compact(receipt.text, 105)) + "</small></button>";
      }).join("") + "</div></article>";
    }).join("") + "</div>" +
      evidenceNote("PHRASE COUNTS ARE SEARCH COUNTS.", "Rolling captions and repeated booth calls can produce multiple hits around one sequence. The board describes recurring language on the surviving tape; it does not assign a line to a specific speaker without identity review.") + "</div></div>";
  }

  function recordsPage() {
    var records = DATA.records;
    app.innerHTML = '<div class="records-page">' + pageHead("CONTROL ROOM TOTALS / THE TAPE AT A GLANCE", "THE NETWORK<br><em>RECORD BOARD.</em>", "Source metadata, archive coverage, track frequency, runtime, and view countsâ€”kept separate from unavailable competition results.", [
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
    app.innerHTML = '<div class="method-page">' + pageHead("METHODOLOGY / THE TRUST CONTRACT", "FAST TO EXPLORE.<br><em>SLOW TO CLAIM.</em>", "The invisible engine is reusable. HLRNâ€™s canon, vocabulary, visual world, scoring signals, Central desk, and fan rituals are native to this network.", [
      ["52", "LIVESTREAMS AUDITED"], ["2", "CANON LANES"], ["4", "EVIDENCE STATES"],
    ]) + '<div class="wrap"><section class="method-grid"><article><span>01 / CANON</span><h2>WHAT COUNTS AS OFFICIAL?</h2><p>' + esc(policy.officialRule || "") + "</p></article><article><span>02 / BONUS</span><h2>WHAT IS HIGHLINE LIVE?</h2><p>" + esc(policy.bonusRule || "") + "</p></article><article><span>03 / FRAGMENTS</span><h2>WHY KEEP PARTIAL TAPE?</h2><p>" + esc(policy.fragmentRule || "") + "</p></article><article><span>04 / RESULTS</span><h2>WHY ARE CELLS OPEN?</h2><p>" + esc(policy.resultRule || "") + "</p></article></section>" +
      '<section class="evidence-ladder"><span>EVIDENCE LADDER</span><h2>FOUR STATES THAT NEVER BLUR TOGETHER</h2><div><article><b>1</b><h3>MACHINE SURFACED</h3><p>A timestamp candidate found in captions or ASR. Playable, visibly provisional.</p></article><article><b>2</b><h3>AUTHORED RECEIPT</h3><p>A human-bounded moment or claim tied to the exact source window.</p></article><article><b>3</b><h3>EDITOR VERIFIED</h3><p>Context, identity, and relationship checked against the tape.</p></article><article><b>4</b><h3>CREATOR CERTIFIED</h3><p>HLRN or an authorized owner confirms the record.</p></article></div></section>' +
      '<section class="heat-method"><span>TAPE HEAT / PUBLISHED COMPONENTS</span><h2>THE SIGNAL MODEL</h2><p>Finish, battle, restart, strategy, disruption, booth, and evidence signals each have visible caps. The model ranks editorial usefulnessâ€”not guaranteed quality, importance, or virality.</p><div>' + ["finish", "battle", "restart", "strategy", "disruption", "booth", "evidence"].map(function (item) { return '<span>' + item.toUpperCase() + "</span>"; }).join("") + "</div></section>" +
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
      return '<a href="' + item[2] + '"><b>' + String(index + 1).padStart(2, "0") + "</b><span>" + esc(item[3]) + "</span><h2>" + esc(item[0]) + "</h2><p>" + esc(item[1]) + "</p><em>OPEN TOOL â†’</em></a>";
    }).join("") + '</div><section class="explore-rituals"><div><span>RETURN RITUAL</span><h2>LAST LAP LOTTERY</h2><p>Drop into a supported closing signal from anywhere in the network.</p><button onclick="__lastLap()">RUN THE LOTTERY â–¶</button></div><div><span>KEYBOARD RITUAL</span><h2>PRESS H</h2><p>Open the high line from any page and receive a random exact battle signal.</p><button onclick="__openHighLine()">OPEN THE HIGH LINE â–¶</button></div></section></div></div>';
  }

  function racePage(id, timestamp) {
    var source = sourceMap[id];
    if (!source) return home();
    var moments = source.moments || [];
    var result = source.result || {};
    var driverIds = Array.from(new Set(moments.flatMap(function (item) { return item.drivers || []; })));
    var drivers = driverIds.map(function (driverId) { return driverMap[driverId]; }).filter(Boolean);
    app.innerHTML = '<article class="race-page"><section class="race-hero"><div class="race-hero-bg" style="background-image:url(\'' + esc(source.thumb) + '\')"></div><div class="wrap"><div class="race-crumb"><a href="' + (source.lane === "official" ? "#/season/" + source.season : "#/highline-live") + '">' + esc(laneLabel(source.lane)) + "</a><span>/</span>" + esc(source.name) + "</div><div class=\"race-title\">" + laneBadge(source) + '<h1>' + esc(source.name) + "</h1><p>" + esc(source.track) + " Â· " + esc(fmtDate(source.date)) + " Â· " + fmtDuration(source.duration) + '</p><div><button class="button hot" onclick="__play(\'' + source.id + '\',' + (timestamp || 0) + ',\'' + esc(sourceTitle(source)) + '\')">â–¶ ' + (timestamp ? "PLAY AT " + fmtTime(timestamp) : "WATCH FROM START") + '</button><a class="button glass" href="' + esc(source.url) + '" target="_blank" rel="noopener">YOUTUBE SOURCE â†—</a></div></div><aside>' + heatBar(source) + '<div><b>' + source.moments.length + "</b><span>EXACT SIGNALS</span></div><div><b>" + source.transcriptLines.toLocaleString() + "</b><span>TIMED SEGMENTS</span></div></aside></div></section>" +
      '<section class="race-facts"><div class="wrap"><div><span>LANE</span><b>' + esc(laneLabel(source.lane)) + "</b></div><div><span>TRACK</span><b>" + esc(source.track) + "</b></div><div><span>FILE</span><b>" + (source.lane === "official" ? "S" + source.season + " / R" + source.race : esc(source.kind)) + "</b></div><div><span>RESULT</span><b>" + esc(result.status || "unknown") + "</b></div><div><span>TRANSCRIPT</span><b>" + esc(source.transcriptStatus) + "</b></div></div></section>" +
      '<div class="wrap race-layout"><main><section class="race-recap"><span>THE SIGNAL FILE</span><h2>WHAT THE TAPE CAN SAY TODAY</h2><p>' + esc(source.recap) + "</p></section>" +
      radarForSource(source) +
      '<section class="race-moments"><div class="section-title"><div><span>EXACT-SOURCE ENTRY POINTS</span><h2>TURNING SIGNALS</h2></div></div><div class="moment-grid">' + (moments.length ? moments.map(function (item) { return momentCard(item, false); }).join("") : '<div class="empty-state">Timed moment recovery is still in progress for this source. The full race remains playable.</div>') + "</div></section>" +
      '<section class="race-transcript"><div class="section-title"><div><span>DEEP TAPE SEARCH</span><h2>SCAN THIS BROADCAST</h2></div></div><div class="race-scan"><input id="raceScanInput" placeholder="Driver, phrase, incident, strategyâ€¦" onkeydown="if(event.key===\'Enter\')__scanRace(\'' + source.id + '\')"><button onclick="__scanRace(\'' + source.id + '\')">SCAN</button></div><div id="raceScanResults"><p>Search only this source and jump to the matching second.</p></div></section></main><aside>' +
      '<section class="signal-components"><span>TAPE HEAT COMPONENTS</span>' + Object.entries(source.heat.components || {}).map(function (entry) { return '<div><b>' + esc(entry[0].toUpperCase()) + '</b><i><em style="width:' + Math.min(100, entry[1] * 5) + '%"></em></i><strong>' + entry[1] + "</strong></div>"; }).join("") + "</section>" +
      '<section class="result-bay"><span>RESULT BAY / ' + esc(String(result.status || "unknown").toUpperCase()) + "</span><h3>" + (result.winner ? esc(result.winner) : "WINNER OPEN") + "</h3><p>" + esc(result.note || "") + "</p>" + ((result.podium || []).length > 1 ? '<ol class="podium-list">' + result.podium.map(function (name, index) { return '<li><b>P' + (index + 1) + '</b><span>' + esc(name) + '</span></li>'; }).join("") + '</ol>' : '') + (result.raceStat ? '<small class="race-stat">' + esc(result.raceStat) + '</small>' : '') + (result.ruling ? '<small class="race-ruling">' + esc(result.ruling) + '</small>' : '') + (result.receipt ? '<button onclick="__play(\'' + (result.receipt.sourceId || source.id) + '\',' + result.receipt.t + ',\'Result receipt\')">â–¶ PLAY RESULT RECEIPT</button>' : "") + "</section>" +
      (source.companion ? '<section class="race-companion"><span>HIGHLINE CENTRAL CONNECTED</span><img src="' + esc(source.companion.thumb) + '" alt=""><h3>' + esc(source.companion.title) + '</h3><button onclick="__play(\'' + source.companion.id + '\',0,\'' + esc(source.companion.title) + '\')">â–¶ THE SHOW</button><a href="#/central/' + source.id + '">READ DESK FILE â†’</a></section>' : "") +
      (drivers.length ? '<section class="race-drivers"><span>DRIVERS IN SURFACED MOMENTS</span>' + drivers.slice(0, 18).map(function (driver) { return '<a href="#/driver/' + driver.id + '">' + esc(driver.name) + "</a>"; }).join("") + "</section>" : "") +
      '<section class="source-contract"><span>SOURCE CONTRACT</span><p>Stable ID <code>' + esc(source.id) + "</code></p><p>No race video is copied. Playback remains on the original HLRN source.</p></section></aside></div></article>";
    if (timestamp) setTimeout(function () { window.__play(source.id, timestamp, sourceTitle(source)); }, 100);
  }

  window.__scanRace = async function (id) {
    var input = document.getElementById("raceScanInput");
    var box = document.getElementById("raceScanResults");
    if (!input || !box || !input.value.trim()) return;
    box.innerHTML = "<p>LOCKING ONTO SOURCEâ€¦</p>";
    var lines = await loadTranscript(id);
    var terms = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    var hits = lines.filter(function (line) { var text = line[1].toLowerCase(); return terms.every(function (term) { return text.includes(term); }); }).slice(0, 60);
    box.innerHTML = hits.length ? '<div class="race-scan-hits">' + hits.map(function (line) { return '<button onclick="__play(\'' + id + '\',' + line[0] + ',\'Transcript search\')"><b>â–¶ ' + fmtTime(line[0]) + "</b><span>" + esc(compact(line[1], 300)) + "</span></button>"; }).join("") + "</div>" : "<p>No exact line match in this source. Try a shorter phrase or surname.</p>";
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
    document.title = (heading ? heading.textContent.replace(/\s+/g, " ").trim() + " Â· " : "") + "HLRN Living Wiki";
    app.focus({ preventScroll: true });
  }

  window.addEventListener("hashchange", route);
  renderFooter();
  route();
})();
