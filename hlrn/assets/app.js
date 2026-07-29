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
      ((source.moments || []).length ? (source.moments || []).length + " reviewed cuts" : "source-first file") + "</span></footer></div></article>";
  }

  function momentCard(moment, compactMode) {
    var driverLinks = (moment.drivers || []).slice(0, 4).map(function (id) {
      var driver = driverMap[id];
      return driver ? '<a href="#/driver/' + esc(id) + '">' + esc(driver.name) + "</a>" : "";
    }).filter(Boolean).join("");
    return '<article class="moment-card ' + esc(moment.category) + ' ' + (compactMode ? "compact" : "") + '">' +
      '<div class="moment-time"><button onclick="__play(\'' + esc(moment.sourceId) + '\',' + moment.t + ',\'' + esc(moment.title) + '\')">â–¶ ' + fmtTime(moment.t) + "</button><span>" + esc(moment.category.toUpperCase()) + "</span></div>" +
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
      '<div class="hero-copy"><span class="eyebrow"><i></i>EVERY SI×ÏxÖÚ$z{-®éÜj×FW2G&—fW"6–væGW&R&VVÂãÂ÷ãÆF—câr²²&f–æ—6‚"Â&&GFÆR"Â'&W7F'B"Â'7G&FVw’"Â&F—7'WF–öâ"Â&&ö÷F‚"Â&Wf–FVæ6R%ÒæÖ†gVæ7F–öâ†—FVÒ’²&WGW&âsÇ7ãâr²—FVÒçFõWW$66R‚’²#Â÷7ãâ#²Ò’æ¦ö–â‚""’²#ÂöF—cãÂ÷6V7F–öãâ"°¢sÇ6V7F–öâ6Æ73Ò&ÖWF†öB×Væ¶æ÷vç2#ãÆF—cãÇ7ãä´äõtâäõsÂ÷7ããÇVÃãÆÆ“å6÷W&6R–FVçF—F–W2æBFFW3ÂöÆ“ãÆÆ“ä÷&–v–æÂÆ–&6²U$Ç3ÂöÆ“ãÆÆ“äöff–6–ÂfW'7W2&öçW2ÆæSÂöÆ“ãÆÆ“åF–ÖVBG&ç67&—B6–væÇ3ÂöÆ“ãÆÆ“äÆÂ#öff–6–Âv–ææW'3ÂöÆ“ãÆÆ“å6V6öâ6†×–öâ&V6V—CÂöÆ“ãÆÆ“ä6†ææVÂÖWF†÷&VB6ö×æ–öâW—6öFW3ÂöÆ“ãÂ÷VÃãÂöF—cãÆF—cãÇ7ãåt•D”ärdõ"õtäU"$T4õ$E3Â÷7ããÇVÃãÆÆ“ä6ö×ÆWFRf–æ—6†–ær÷&FW'3ÂöÆ“ãÆÆ“äöff–6–Â7F'G2æBö–çG3ÂöÆ“ãÆÆ“ägVÆÂ7FæF–æw2F&ÆW3ÂöÆ“ãÆÆ“äöff–6–Â–æ6–FVçB6÷VçG3ÂöÆ“ãÆÆ“ä6ö×ÆWFRçVÖ&W"æBFVÒ†—7F÷'“ÂöÆ“ãÂ÷VÃãÂöF—cãÂ÷6V7F–öããÂöF—cãÂöF—câs°¢Ğ ¢gVæ7F–öâW‡Æ÷&UvR‚’°¢f"6&G2Ò°¢²$„”t„Ä”äRÄ•dR"Â%F†R6ö×ÆWFRæöâÖÆVwVR÷G÷W'&’ÂgVÆÇ’6÷fW&VBæBW‡Æ–6—FÇ’6W&FVBâ"Â"2ö†–v†Æ–æRÖÆ—fR"ÂDDç&V6÷&G2æÆ—fT6÷VçB²"$4U2%ÒÀ¢²$„”t‚Ä”äR$D""Â%&6R7F÷'’6–væÇ2Æ÷GFVB7&÷72W†7B6÷W&6RF–ÖRâ"Â"2÷&F""ÂDDæÖöÖVçG2æÆVæwF‚²"4ôåD5E2%ÒÀ¢²$„”t„Ä”äRe$UTTä5’"Â%&V7W'&–æræWGv÷&²ÆæwVvRv—F‚Æ–&ÆRW†7B&V6V—G2â"Â"2ög&WVVæ7’"ÂDDç‡&6W2æÆVæwF‚²"e$UTTä4”U2%ÒÀ¢²%$T4õ$B$ô$B"Â$&6†—fRF÷FÇ2Â'VçF–ÖRÂf–Ww2ÂG&6·2ÂæB6÷W&6R&V6÷&G2â"Â"2÷&V6÷&G2"ÂDDç&V6÷&G2æ†÷W'2²"„õU%2%ÒÀ¢²%4õU$4RÄTDtU""Â$WfW'’7F&ÆRÆ—fW7G&VÒ–FVçF—G’æBWf–FVæ6R7FFRâ"Â"2÷6÷W&6W2"ÂDDç&V6÷&G2ç6÷W&6T6÷VçB²"4õU$4U2%ÒÀ¢²$ÔUD„ôDôÄôu’"Â$6æöâÂWf–FVæ6R7FFW2Â66÷&–ærÂVæ¶æ÷vç2ÂæB6÷'&V7F–öç2â"Â"2öÖWF†öFöÆöw’"Â$õTâ4ôåE$5B%ÒÀ¢Ó°¢æ–ææW$…DÔÂÒsÆF—b6Æ73Ò&W‡Æ÷&R×vR#âr²vT†VB‚%D„RDTU4”täÂDT4²ò$U”ôäBD„RÔ”âD%2"Â%D„Rt„ôÄSÆ'#ãÆVÓääUEtõ$²Tä•dU%4RãÂöVÓâ"Â%6—‚FVWW"FööÇ2GW&âF†R6†ææVÂ&6†—fR–çFòÆ6RFò–çfW7F–vFRÂ&Wf—6—BÂæB6÷'&V7Bâ"Â°¢¶6&G2æÆVæwF‚Â$DTUDôôÅ2%ÒÂ´DDç&V6÷&G2æW†–Æ–'”6÷VçBÂ$4ôÕä”ôâd”ÄU2%ÒÂ´DDç&V6÷&G2æg&vÖVçD6÷VçBÂ%$U4U%dTBe$tÔTåE2%ÒÀ¢Ò’²sÆF—b6Æ73Ò'w&#ãÆF—b6Æ73Ò&W‡Æ÷&RÖw&–B#âr²6&G2æÖ†gVæ7F–öâ†—FVÒÂ–æFW‚’°¢&WGW&âsÆ‡&VcÒ"r²—FVÕ³%Ò²r#ãÆ#âr²7G&–ær†–æFW‚²’çE7F'Bƒ"Â#"’²#Âö#ãÇ7ãâ"²W62†—FVÕ³5Ò’²#Â÷7ããÆƒ#â"²W62†—FVÕ³Ò’²#Âöƒ#ãÇâ"²W62†—FVÕ³Ò’²#Â÷ãÆVÓäõTâDôôÂ(i#ÂöVÓãÂöâ#°¢Ò’æ¦ö–â‚""’²sÂöF—cãÇ6V7F–öâ6Æ73Ò&W‡Æ÷&R×&—GVÇ2#ãÆF—cãÇ7ãå$UEU$â$•ETÃÂ÷7ããÆƒ#äÄ5BÄÄõEDU%“Âöƒ#ãÇäG&÷–çFò7W÷'FVB6Æ÷6–ær6–væÂg&öÒç—v†W&R–âF†RæWGv÷&²ãÂ÷ãÆ'WGFöâöæ6Æ–6³Ò%õöÆ7DÆ‚’#å%TâD„RÄõEDU%’)kcÂö'WGFöããÂöF—cãÆF—cãÇ7ãä´U”$ô$B$•ETÃÂ÷7ããÆƒ#å$U52ƒÂöƒ#ãÇä÷VâF†R†–v‚Æ–æRg&öÒç’vRæB&V6V—fR&æFöÒW†7B&GFÆR6–væÂãÂ÷ãÆ'WGFöâöæ6Æ–6³Ò%õö÷Vä†–v„Æ–æR‚’#äõTâD„R„”t‚Ä”äR)kcÂö'WGFöããÂöF—cãÂ÷6V7F–öããÂöF—cãÂöF—câs°¢Ğ ¢gVæ7F–öâ&6UvR†–BÂF–ÖW7F×’°¢f"6÷W&6RÒ6÷W&6TÖ¶–EÓ°¢–b‚6÷W&6R’&WGW&â†öÖR‚“°¢f"ÖöÖVçG2Ò6÷W&6RæÖöÖVçG2ÇÂµÓ°¢f"&W7VÇBÒ6÷W&6Rç&W7VÇBÇÂ·Ó°¢f"—77VRÒV&Æ–6F–öäÖ¶–EÓ°¢f"G&—fW$–G2Ò'&’æg&öÒ†æWr6WB†ÖöÖVçG2æfÆDÖ†gVæ7F–öâ†—FVÒ’²&WGW&â—FVÒæG&—fW'2ÇÂµÓ²Ò’’“°¢f"G&—fW'2ÒG&—fW$–G2æÖ†gVæ7F–öâ†G&—fW$–B’²&WGW&âG&—fW$Ö¶G&—fW$–EÓ²Ò’æf–ÇFW"„&ööÆVâ“°¢f"†W&ô–ÖvRÒ—77VRbb—77VRæ–ÖvRò—77VRæ–ÖvRæf–ÆR¢6÷W&6RçF‡VÖ#°¢f"7G2Ò²&÷Væ–ær"Â&Ö–FFÆR"Â&6Æ÷6–ær%Ó°¢æ–ææW$…DÔÂÒsÆ'F–6ÆR6Æ73Ò'&6R×vRFVWÖF—fR#ãÇ6V7F–öâ6Æ73Ò'&6RÖ†W&ò#ãÆF—b6Æ73Ò'&6RÖ†W&òÖ&r"7G–ÆSÒ&&6¶w&÷VæBÖ–ÖvS§W&Â…Ârr²W62††W&ô–ÖvR’²uÂr’#ãÂöF—cãÆF—b6Æ73Ò'w&#ãÆF—b6Æ73Ò'&6RÖ7'VÖ"#ãÆ‡&VcÒ"r²‡6÷W&6RæÆæRÓÓÒ&öff–6–Â"ò"2÷6V6öâò"²6÷W&6Rç6V6öâ¢"2ö†–v†Æ–æRÖÆ—fR"’²r#âr²W62†ÆæTÆ&VÂ‡6÷W&6RæÆæR’’²#ÂöãÇ7ãâóÂ÷7ãâ"²W62‡6÷W&6RææÖR’²#ÂöF—cãÆF—b6Æ73ÕÂ'&6R×F—FÆUÂ#â"²ÆæT&FvR‡6÷W&6R’²sÇ7â6Æ73Ò'&6RÖf–ÆRÖÆ&VÂ#âr²‡6÷W&6RæÆæRÓÓÒ&öff–6–Â"ò$ôdd”4”Â$4RDTUD•dR"¢$„”t„Ä”äRÄ•dR4õU$4Rd”ÄR"’²sÂ÷7ããÆƒâr²W62†—77VRò—77VRæ†VFÆ–æR¢6÷W&6RææÖR’²#ÂöƒãÇâ"²W62‡6÷W&6RçG&6²’²"+r"²W62†f×DFFR‡6÷W&6RæFFR’’²"+r"²f×DGW&F–öâ‡6÷W&6RæGW&F–öâ’²sÂ÷ãÆF—cãÆ'WGFöâ6Æ73Ò&'WGFöâ†÷B"öæ6Æ–6³Ò%õ÷Æ’…Ârr²6÷W&6Ræ–B²uÂrÂr²‡F–ÖW7F×ÇÂ’²rÅÂrr²W62‡6÷W&6UF—FÆR‡6÷W&6R’’²uÂr’#î)kbr²‡F–ÖW7F×ò%Ä’B"²f×EF–ÖR‡F–ÖW7F×’¢%tD4‚e$ôÒ5D%B"’²sÂö'WGFöããÆ6Æ73Ò&'WGFöâvÆ72"‡&VcÒ"r²W62‡6÷W&6RçW&Â’²r"F&vWCÒ%ö&Ææ²"&VÃÒ&æö÷VæW"#å”õUET$R4õU$4R(isÂöâr²†—77VRòsÆ6Æ73Ò&'WGFöâvÆ72"‡&VcÒ"2ö6VçG&Âòr²6÷W&6Ræ–B²r#å$TB4TåE$ÂTD•D”ôãÂöâr¢rr’²sÂöF—cãÂöF—cãÆ6–FSâr²†VD&"‡6÷W&6R’²sÆF—cãÆ#âr²6÷W&6RæÖöÖVçG2æÆVæwF‚²#Âö#ãÇ7ãå$Ud”UtTB5UE3Â÷7ããÂöF—cãÆF—cãÆ#â"²6÷W&6RçG&ç67&—DÆ–æW2çFôÆö6ÆU7G&–ær‚’²#Âö#ãÇ7ãåD”ÔTB4TtÔTåE3Â÷7ããÂöF—cãÂö6–FSãÂöF—cãÂ÷6V7F–öãâ"°¢sÇ6V7F–öâ6Æ73Ò'&6RÖf7G2#ãÆF—b6Æ73Ò'w&#ãÆF—cãÇ7ãäÄäSÂ÷7ããÆ#âr²W62†ÆæTÆ&VÂ‡6÷W&6RæÆæR’’²#Âö#ãÂöF—cãÆF—cãÇ7ãåE$4³Â÷7ããÆ#â"²W62‡6÷W&6RçG&6²’²#Âö#ãÂöF—cãÆF—cãÇ7ãäd”ÄSÂ÷7ããÆ#â"²‡6÷W&6RæÆæRÓÓÒ&öff–6–Â"ò%2"²6÷W&6Rç6V6öâ²"ò""²6÷W&6Rç&6R¢W62‡6÷W&6Ræ¶–æB’’²#Âö#ãÂöF—cãÆF—cãÇ7ãå$U5TÅCÂ÷7ããÆ#â"²W62‡&W7VÇBç7FGW2ÇÂ'Væ¶æ÷vâ"’²#Âö#ãÂöF—cãÆF—cãÇ7ãåE$å45$•CÂ÷7ããÆ#â"²W62‡6÷W&6RçG&ç67&—E7FGW2’²#Âö#ãÂöF—cãÂöF—cãÂ÷6V7F–öãâ"°¢sÇ6V7F–öâ6Æ73Ò&Wf–FVæ6R×F÷vW"#ãÆF—b6Æ73Ò'w&#ãÆ'F–6ÆR6Æ73Ò&FöæR#ãÆ#ãÂö#ãÇ7ãå$”Ô%’$4RDSÂ÷7ããÇ7G&öæsâr²6÷W&6RçG&ç67&—DÆ–æW2çFôÆö6ÆU7G&–ær‚’²rD”ÔTB4TtÔTåE3Â÷7G&öæsãÂö'F–6ÆSãÆ'F–6ÆR6Æ73Ò"r²‡6÷W&6Ræ6ö×æ–öâò&FöæR"¢""’²r#ãÆ#ã#Âö#ãÇ7ãä„Å$â4ôÕä”ôãÂ÷7ããÇ7G&öæsâr²‡6÷W&6Ræ6ö×æ–öâò$ÔD4„TB"¢$äõBdõTäB"’²sÂ÷7G&öæsãÂö'F–6ÆSãÆ'F–6ÆR6Æ73Ò"r²†—77VRò&FöæR"¢""’²r#ãÆ#ã3Âö#ãÇ7ãäTD•Dõ$”Â$Ud”UsÂ÷7ããÇ7G&öæsâr²†—77VRòÖöÖVçG2æÆVæwF‚²"$õTäDTB5UE2"¢6÷W&6Ræ6æF–FFT6÷VçB²"4äD”DDU2T$åD”äTB"’²sÂ÷7G&öæsãÂö'F–6ÆSãÆ'F–6ÆR6Æ73Ò"r²‡&W7VÇBç7FGW2ÓÒ'Væ¶æ÷vâ"ò&FöæR"¢""’²r#ãÆ#ãCÂö#ãÇ7ãå$U5TÅB$T4T•CÂ÷7ããÇ7G&öæsâr²W62…7G&–ær‡&W7VÇBç7FGW2ÇÂ'Væ¶æ÷vâ"’çFõWW$66R‚’’²sÂ÷7G&öæsãÂö'F–6ÆSãÂöF—cãÂ÷6V7F–öãâr°¢sÆF—b6Æ73Ò'w&&6RÖÆ–÷WB#ãÆÖ–ãâr°¢†—77VRòsÇ6V7F–öâ6Æ73Ò'&6R×&V6WF†÷&VB#ãÇ7ãä„”t„Ä”äR4TåE$Â$4R$TCÂ÷7ããÆƒ#âr²W62†—77VRæ†VFÆ–æR’²sÂöƒ#ãÇ6Æ73Ò'&6RÖFV6²#âr²W62†—77VRæFV6²’²sÂ÷âr²—77VRæÆVBæÖ†gVæ7F–öâ‡&w&‚’²&WGW&âsÇâr²W62‡&w&‚’²sÂ÷âs²Ò’æ¦ö–â‚""’²sÆ‡&VcÒ"2ö6VçG&Âòr²6÷W&6Ræ–B²r#å$TBD„RäUu5U"TD•D”ôâ(i#ÂöãÂ÷6V7F–öãâr¢sÇ6V7F–öâ6Æ73Ò'&6R×&V6#ãÇ7ãä„”t„Ä”äRÄ•dRò4õU$4RÔd•%5Bd”ÄSÂ÷7ããÆƒ#åD„R$ôåU2$4R$TÔ”å2eTÄÅ’õTãÂöƒ#ãÇâr²W62‡6÷W&6Rç&V6’²sÂ÷ãÇâr²6÷W&6Ræ6æF–FFT6÷VçB²rWFöÖFVBG&ç67&—B6æF–FFW2vW&R&WF–æVBf÷"&W6V&6‚'WB&Ræ÷BV&Æ—6†VB2†–v†Æ–v‡G2VçF–Â‡VÖâ&Wf–Wrv—fW2F†VÒVæ—VRF—FÆW2Â6öçFW‡BÂæB&÷VæF&–W2ãÂ÷ãÂ÷6V7F–öãâr’°¢†ÖöÖVçG2æÆVæwF‚ò&F$f÷%6÷W&6R‡6÷W&6R’¢rr’°¢†—77VRòsÇ6V7F–öâ6Æ73Ò'&6R×F‡&VRÖ7B#ãÆF—b6Æ73Ò'6V7F–öâ×F—FÆR#ãÆF—cãÇ7ãäõ$DU$TB$4R5Dõ%“Â÷7ããÆƒ#åD„Rä”t…B”âD…$TR5E3Âöƒ#ãÂöF—cãÂöF—câr²7G2æÖ†gVæ7F–öâ‡†6RÂ7D–æFW‚’²f"7DÖöÖVçG2ÒÖöÖVçG2æf–ÇFW"†gVæ7F–öâ†ÖöÖVçB’²&WGW&âÖöÖVçBç†6RÓÓÒ†6S²Ò“²&WGW&âsÆ'F–6ÆSãÆ†VFW#ãÆ#ãr²†7D–æFW‚²’²sÂö#ãÆF—cãÇ7ãâr²²$õTä”är"Â%$U55U$R"Â$4Äõ4”är%Õ¶7D–æFW…Ò²sÂ÷7ããÆƒ3âr²²%D„R$ô$B•24UB"Â%D„R$4R4„ätU24„R"Â%D„R$U5TÅB%$•dU2%Õ¶7D–æFW…Ò²sÂöƒ3ãÂöF—cãÂö†VFW#ãÆF—b6Æ73Ò&ÖöÖVçBÖw&–B#âr²7DÖöÖVçG2æÖ†gVæ7F–öâ†ÖöÖVçB’²&WGW&âÖöÖVçD6&B†ÖöÖVçBÂfÇ6R“²Ò’æ¦ö–â‚""’²sÂöF—cãÂö'F–6ÆSâs²Ò’æ¦ö–â‚""’²sÂ÷6V7F–öãâr¢rr’°¢sÇ6V7F–öâ6Æ73Ò'&6RÖÖöÖVçG2#ãÆF—b6Æ73Ò'6V7F–öâ×F—FÆR#ãÆF—cãÇ7ãâr²†ÖöÖVçG2æÆVæwF‚ò%D„RTD•Dõ"u25UB"¢%4õU$4R44U52"’²sÂ÷7ããÆƒ#âr²†ÖöÖVçG2æÆVæwF‚ò$UdU%’$Ud”UtTBTåE%’ô”åB"¢$eTÄÂDRÂäòd´R„”t„Ä”t…E2"’²sÂöƒ#ãÂöF—cãÂöF—câr²†ÖöÖVçG2æÆVæwF‚òsÆF—b6Æ73Ò&ÖöÖVçBÖw&–B#âr²ÖöÖVçG2æÖ†gVæ7F–öâ†—FVÒ’²&WGW&âÖöÖVçD6&B†—FVÒÂfÇ6R“²Ò’æ¦ö–â‚""’²sÂöF—câr¢sÆF—b6Æ73Ò&V×G’×7FFR#åF†—2&öçW2f–ÆR&VÖ–ç2Æ–&ÆRæB6V&6†&ÆRâæòÖ6†–æRÖvVæW&FVB6&B—2&öÖ÷FVB2âVF—F÷&–Â†–v†Æ–v‡BãÂöF—câr’²#Â÷6V7F–öãâ"°¢sÇ6V7F–öâ6Æ73Ò'&6R×G&ç67&—B#ãÆF—b6Æ73Ò'6V7F–öâ×F—FÆR#ãÆF—cãÇ7ãäDTUDR4T$4ƒÂ÷7ããÆƒ#å44âD„•2%$ôD45CÂöƒ#ãÂöF—cãÂöF—cãÆF—b6Æ73Ò'&6R×66â#ãÆ–çWB–CÒ'&6U66ä–çWB"Æ6V†öÆFW#Ò$G&—fW"Â‡&6RÂ–æ6–FVçBÂ7G&FVw(
b"öæ¶W–F÷vãÒ&–b†WfVçBæ¶W“ÓÓÕÂtVçFW%Âr•õ÷66å&6R…Ârr²6÷W&6Ræ–B²uÂr’#ãÆ'WGFöâöæ6Æ–6³Ò%õ÷66å&6R…Ârr²6÷W&6Ræ–B²uÂr’#å44ãÂö'WGFöããÂöF—cãÆF—b–CÒ'&6U66å&W7VÇG2#ãÇå6V&6‚öæÇ’F†—26÷W&6RæB§V×FòF†RÖF6†–ær6V6öæBãÂ÷ãÂöF—cãÂ÷6V7F–öããÂöÖ–ããÆ6–FSâr°¢sÇ6V7F–öâ6Æ73Ò'&W7VÇBÖ&’#ãÇ7ãå$U5TÅB$’òr²W62…7G&–ær‡&W7VÇBç7FGW2ÇÂ'Væ¶æ÷vâ"’çFõWW$66R‚’’²#Â÷7ããÆƒ3â"²‡&W7VÇBçv–ææW"òW62‡&W7VÇBçv–ææW"’¢%t”ääU"õTâ"’²#Âöƒ3ãÇâ"²W62‡&W7VÇBææ÷FRÇÂ""’²#Â÷â"²‚‡&W7VÇBçöF—VÒÇÂµÒ’æÆVæwF‚âòsÆöÂ6Æ73Ò'öF—VÒÖÆ—7B#âr²&W7VÇBçöF—VÒæÖ†gVæ7F–öâ†æÖRÂ–æFW‚’²&WGW&âsÆÆ“ãÆ#år²†–æFW‚²’²sÂö#ãÇ7ãâr²W62†æÖR’²sÂ÷7ããÂöÆ“âs²Ò’æ¦ö–â‚""’²sÂööÃâr¢rr’²‡&W7VÇBç&6U7FBòsÇ6ÖÆÂ6Æ73Ò'&6R×7FB#âr²W62‡&W7VÇBç&6U7FB’²sÂ÷6ÖÆÃâr¢rr’²‡&W7VÇBç'VÆ–æròsÇ6ÖÆÂ6Æ73Ò'&6R×'VÆ–ær#âr²W62‡&W7VÇBç'VÆ–ær’²sÂ÷6ÖÆÃâr¢rr’²‡&W7VÇBç&V6V—BòsÆ'WGFöâöæ6Æ–6³Ò%õ÷Æ’…Ârr²‡&W7VÇBç&V6V—Bç6÷W&6T–BÇÂ6÷W&6Ræ–B’²uÂrÂr²&W7VÇBç&V6V—BçB²rÅÂu&W7VÇB&V6V—EÂr’#î)kbÄ’$U5TÅB$T4T•CÂö'WGFöãâr¢""’²#Â÷6V7F–öãâ"°¢‡6÷W&6Ræ6ö×æ–öâòsÇ6V7F–öâ6Æ73Ò'&6RÖ6ö×æ–öâ#ãÇ7ãåD„R4„õrò4ôääT5DTB4õU$4SÂ÷7ããÆ–Ör7&3Ò"r²W62‡6÷W&6Ræ6ö×æ–öâçF‡VÖ"’²r"ÇCÒ"#ãÆƒ3âr²W62‡6÷W&6Ræ6ö×æ–öâçF—FÆR’²sÂöƒ3ãÇä„Å$âÖWF†÷&VB6öçFW‡BæBVçFW'F–æÖVçBÂ6W&FVBg&öÒF†R&–Ö'’66÷&–ærÆæRãÂ÷ãÆ'WGFöâöæ6Æ–6³Ò%õ÷Æ’…Ârr²6÷W&6Ræ6ö×æ–öâæ–B²uÂrÃÅÂrr²W62‡6÷W&6Ræ6ö×æ–öâçF—FÆR’²uÂr’#î)kbÄ’D„R4„õsÂö'WGFöãâr²†—77VRòsÆ‡&VcÒ"2ö6VçG&Âòr²6÷W&6Ræ–B²r#å$TB4TåE$ÂTD•D”ôâ(i#Âöâr¢rr’²sÂ÷6V7F–öãâr¢""’°¢†G&—fW'2æÆVæwF‚òsÇ6V7F–öâ6Æ73Ò'&6RÖG&—fW'2#ãÇ7ãäE$•dU%2”â$Ud”UtTB5Dõ%“Â÷7ãâr²G&—fW'2ç6Æ–6RƒÂ‚’æÖ†gVæ7F–öâ†G&—fW"’²&WGW&âsÆ‡&VcÒ"2öG&—fW"òr²G&—fW"æ–B²r#âr²W62†G&—fW"ææÖR’²#Âöâ#²Ò’æ¦ö–â‚""’²#Â÷6V7F–öãâ"¢""’°¢sÇ6V7F–öâ6Æ73Ò'6–væÂÖ6ö×öæVçG2#ãÇ7ãåDR„TBòD•44õdU%’ÔôDTÃÂ÷7ãâr²ö&¦V7BæVçG&–W2‡6÷W&6Ræ†VBæ6ö×öæVçG2ÇÂ·Ò’æÖ†gVæ7F–öâ†VçG'’’²&WGW&âsÆF—cãÆ#âr²W62†VçG'•³ÒçFõWW$66R‚’’²sÂö#ãÆ“ãÆVÒ7G–ÆSÒ'v–GFƒ¢r²ÖF‚æÖ–âƒÂVçG'•³Ò¢R’²rR#ãÂöVÓãÂö“ãÇ7G&öæsâr²VçG'•³Ò²#Â÷7G&öæsãÂöF—câ#²Ò’æ¦ö–â‚""’²sÇåF†—266÷&R&æ·2&W6V&6‚W6VgVÆæW72â—BFöW2æ÷BFV6–FRF†RVF—F÷&–Â7F÷'’ãÂ÷ãÂ÷6V7F–öãâr°¢sÇ6V7F–öâ6Æ73Ò'6÷W&6RÖ6öçG&7B#ãÇ7ãå4õU$4R4ôåE$5CÂ÷7ããÇå7F&ÆR”BÆ6öFSâr²W62‡6÷W&6Ræ–B’²#Âö6öFSãÂ÷ãÇäæò&6Rf–FVò—26÷–VBâWfW'’7WB÷Vç2„Å$âw2÷&–v–æÂWÆöB÷"—G2ÖF6†VB6ö×æ–öâãÂ÷ãÂ÷6V7F–öããÂö6–FSãÂöF—cãÂö'F–6ÆSâ#°¢–b‡F–ÖW7F×’6WEF–ÖV÷WB†gVæ7F–öâ‚’²v–æF÷råõ÷Æ’‡6÷W&6Ræ–BÂF–ÖW7F×Â6÷W&6UF—FÆR‡6÷W&6R’“²ÒÂ“°¢Ğ ¢v–æF÷råõ÷66å&6RÒ7–æ2gVæ7F–öâ†–B’°¢f"–çWBÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'&6U66ä–çWB"“°¢f"&÷‚ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'&6U66å&W7VÇG2"“°¢–b‚–çWBÇÂ&÷‚ÇÂ–çWBçfÇVRçG&–Ò‚’’&WGW&ã°¢&÷‚æ–ææW$…DÔÂÒ#ÇäÄô4´”ärôåDò4õU$4^(
cÂ÷â#°¢f"Æ–æW2Òv—BÆöEG&ç67&—B†–B“°¢f"FW&×2Ò–çWBçfÇVRçFôÆ÷vW$66R‚’ç7Æ—B‚õÇ2²ò’æf–ÇFW"„&ööÆVâ“°¢f"†—G2ÒÆ–æW2æf–ÇFW"†gVæ7F–öâ†Æ–æR’²f"FW‡BÒÆ–æU³ÒçFôÆ÷vW$66R‚“²&WGW&âFW&×2æWfW'’†gVæ7F–öâ‡FW&Ò’²&WGW&âFW‡Bæ–æ6ÇVFW2‡FW&Ò“²Ò“²Ò’ç6Æ–6RƒÂc“°¢&÷‚æ–ææW$…DÔÂÒ†—G2æÆVæwF‚òsÆF—b6Æ73Ò'&6R×66âÖ†—G2#âr²†—G2æÖ†gVæ7F–öâ†Æ–æR’²&WGW&âsÆ'WGFöâöæ6Æ–6³Ò%õ÷Æ’…Ârr²–B²uÂrÂr²Æ–æU³Ò²rÅÂuG&ç67&—B6V&6…Âr’#ãÆ#î)kbr²f×EF–ÖR†Æ–æU³Ò’²#Âö#ãÇ7ãâ"²W62†6ö×7B†Æ–æU³ÒÂ3’’²#Â÷7ããÂö'WGFöãâ#²Ò’æ¦ö–â‚""’²#ÂöF—câ"¢#ÇäæòW†7BÆ–æRÖF6‚–âF†—26÷W&6RâG'’6†÷'FW"‡&6R÷"7W&æÖRãÂ÷â#°¢Ó° ¢v–æF÷råõö÷Vä†–v„Æ–æRÒgVæ7F–öâ‚’°¢f"&GFÆW2ÒDDæÖöÖVçG2æf–ÇFW"†gVæ7F–öâ†—FVÒ’²&WGW&â—FVÒæ6FVv÷'’ÓÓÒ&&GFÆR"bb‡7FFRæ6æöâÓÓÒ&ÆÂ"ÇÂ—FVÒæÆæRÓÓÒ&öff–6–Â"“²Ò“°¢–b‚&GFÆW2æÆVæwF‚’&WGW&âFö7B‚%F†R&GFÆRg&WVVæ7’—27F–ÆÂ&V6÷fW&–ær"“°¢f"ÖöÖVçBÒ&GFÆW5´ÖF‚æfÆö÷"„ÖF‚ç&æFöÒ‚’¢&GFÆW2æÆVæwF‚•Ó°¢Fö7VÖVçBæ&öG’æ6Æ74Æ—7BæFB‚&†–v†Æ–æRÖ÷Vâ"“°¢6WEF–ÖV÷WB†gVæ7F–öâ‚’²Fö7VÖVçBæ&öG’æ6Æ74Æ—7Bç&VÖ÷fR‚&†–v†Æ–æRÖ÷Vâ"“²ÒÂ3“°¢v–æF÷råõ÷Æ’†ÖöÖVçBç6÷W&6T–BÂÖöÖVçBçBÂ%F†R†–v‚Æ–æR—2÷Vâ"“°¢Ó° ¢Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚&¶W–F÷vâ"ÂgVæ7F–öâ†WfVçB’°¢f"FrÒ†Fö7VÖVçBæ7F—fTVÆVÖVçBÇÂ·Ò’çFtæÖRÇÂ"#°¢–b‚†WfVçBæ¶W’ÓÓÒ&‚"ÇÂWfVçBæ¶W’ÓÓÒ$‚"’bbFrÓÒ$”åUB"bbFrÓÒ%DU…D$T"bbFrÓÒ%4TÄT5B"’°¢v–æF÷råõö÷Vä†–v„Æ–æR‚“°¢Ğ¢–b†WfVçBæ¶W’ÓÓÒ$W66R"bbFö7VÖVçBæ&öG’æ6Æ74Æ—7Bæ6öçF–ç2‚'Æ–W"Ö÷Vâ"’’v–æF÷råõö6Æ÷6UÆ–W"‚“°¢Ò“° ¢gVæ7F–öâæ÷Df÷VæB‚’°¢æ–ææW$…DÔÂÒsÆF—b6Æ73Ò&æ÷BÖf÷VæB#ãÇ7ãääò4%$”U#Â÷7ããÆƒåD„R4”täÂÔ•54TBãÂöƒãÇåF†B&÷WFRFöW2æ÷BW†—7B–âF†R7W'&VçB„Å$â&6†—fRãÂ÷ãÆ6Æ73Ò&'WGFöâ†÷B"‡&VcÒ"2ò#å$UEU$âDò4TåE$ÃÂöãÂöF—câs°¢Ğ ¢gVæ7F–öâ&÷WFR‚’°¢&VæFW$æb‚“°¢f"†6‚ÒÆö6F–öâæ†6‚ÇÂ"2ò#°¢f"ÖF6ƒ°¢v–æF÷rç67&öÆÅFòƒÂ“°¢–b††6‚ÓÓÒ"2ò"ÇÂ†6‚ÓÓÒ""’†öÖR‚“°¢VÇ6R–b††6‚ÓÓÒ"2÷vF6‚"’vF6‚‚“°¢VÇ6R–b††6‚ÓÓÒ"2ö6²"’6µvR‚""“°¢VÇ6R–b‚†ÖF6‚Ò†6‚æÖF6‚‚õâ5Âö6µÂò‚â²’Bò’’’6µvR†FV6öFUU$”6ö×öæVçB†ÖF6…³Ò’“°¢VÇ6R–b††6‚ÓÓÒ"2ö†–v†Æ–v‡G2"’†–v†Æ–v‡EvR‚“°¢VÇ6R–b††6‚ÓÓÒ"2ö6VçG&Â"’6VçG&Â‚“°¢VÇ6R–b‚†ÖF6‚Ò†6‚æÖF6‚‚õâ5Âö6VçG&ÅÂò…µÇrÕÒ²’Bò’’’6VçG&Ä—77VR†ÖF6…³Ò“°¢VÇ6R–b††6‚ÓÓÒ"2öG&—fW'2"’G&—fW'5vR‚“°¢VÇ6R–b‚†ÖF6‚Ò†6‚æÖF6‚‚õâ5ÂöG&—fW%Âò…µÇrÕÒ²’Bò’’’G&—fW%vR†ÖF6…³Ò“°¢VÇ6R–b††6‚ÓÓÒ"2÷6V6öç2"’6V6öç5vR‚“°¢VÇ6R–b‚†ÖF6‚Ò†6‚æÖF6‚‚õâ5Â÷6V6öåÂò…ÆB²’Bò’’’6V6öåvR†ÖF6…³Ò“°¢VÇ6R–b††6‚ÓÓÒ"2÷&æ¶–æw2"’&æ¶–æw5vR‚“°¢VÇ6R–b‚†ÖF6‚Ò†6‚æÖF6‚‚õâ5Â÷&æ¶–æw5Âò…µÇrÕÒ²’Bò’’’&æ¶–æw5vR†ÖF6…³Ò“°¢VÇ6R–b††6‚ÓÓÒ"2ö†–v†Æ–æRÖÆ—fR"’†–v†Æ–æTÆ—fR‚“°¢VÇ6R–b††6‚ÓÓÒ"2÷&F""’&F%vR‚“°¢VÇ6R–b††6‚ÓÓÒ"2ög&WVVæ7’"’g&WVVæ7•vR‚“°¢VÇ6R–b††6‚ÓÓÒ"2÷&V6÷&G2"’&V6÷&G5vR‚“°¢VÇ6R–b††6‚ÓÓÒ"2÷6÷W&6W2"’6÷W&6W5vR‚“°¢VÇ6R–b††6‚ÓÓÒ"2öÖWF†öFöÆöw’"’ÖWF†öFöÆöw•vR‚“°¢VÇ6R–b††6‚ÓÓÒ"2öW‡Æ÷&R"’W‡Æ÷&UvR‚“°¢VÇ6R–b‚†ÖF6‚Ò†6‚æÖF6‚‚õâ5Â÷&6UÂò…µÇrÕÒ²•Â÷EÂò…ÆB²’Bò’’’&6UvR†ÖF6…³ÒÂçVÖ&W"†ÖF6…³%Ò’“°¢VÇ6R–b‚†ÖF6‚Ò†6‚æÖF6‚‚õâ5Â÷&6UÂò…µÇrÕÒ²’Bò’’’&6UvR†ÖF6…³Ò“°¢VÇ6Ræ÷Df÷VæB‚“°¢f"†VF–ærÒçVW'•6VÆV7F÷"‚&ƒ"“°¢Fö7VÖVçBçF—FÆRÒ††VF–ærò†VF–ærçFW‡D6öçFVçBç&WÆ6R‚õÇ2²örÂ""’çG&–Ò‚’²"+r"¢""’²$„Å$âÆ—f–ærv–¶’#°¢æfö7W2‡²&WfVçE67&öÆÃ¢G'VRÒ“°¢Ğ ¢v–æF÷ræFDWfVçDÆ—7FVæW"‚&†6†6†ævR"Â&÷WFR“°¢&VæFW$fö÷FW"‚“°¢&÷WFR‚“°§Ò’‚“°