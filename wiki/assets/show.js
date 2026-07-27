/* ============================================================================
   SHOW PACK — Vigilante Racing League (SHOKKER LORE build).
   Same Living Wiki backbone as The Lapsed Fan / Center Stage Chronicles,
   re-tooled for a racing series: seasons instead of journeys, races instead
   of episodes, drivers instead of wrestlers, and a YouTube broadcast player
   instead of a podcast audio player.
   ========================================================================== */
window.SHOW = {
  product: "SHOKKER LORE",
  maker: "Shokker",
  name: "Vigilante Racing League",
  short: "VRL",
  series: "The Wednesday Night Wars",
  tagline: "Years of Wednesday-night iRacing outlaw action — eligible race history, canonical driver dossiers, defining wrecks and photo finishes, indexed to the second and wired straight to the broadcast tape.",

  brand: {
    accent: "#E8302A",        // vigilante red
    accent2: "#3D6BB3",       // flag navy-blue
    accent3: "#F2F2F2",       // checkered white
    logoLetter: "V",
    logo: "assets/brand/vrl-wordmark.png",
    navLogo: "assets/brand/vrl-wordmark.png",
    seriesLogo: "assets/brand/vrl-premiere-series.png",
    networkLogo: "assets/brand/shokker-lore.png"
  },

  partners: {
    presenting: {
      name: "Trackside Graphics",
      logo: "assets/brand/trackside-graphics.png"
    },
    supporting: [
      { name: "GC Cruise Travel", logo: "assets/brand/gc-cruise-travel.png" },
      { name: "Wade's Pressure Washing", logo: "assets/brand/wades-pressure-washing.png" }
    ]
  },

  ontology: {
    entityTypes: ["driver", "team", "broadcaster", "track", "series", "sponsor", "event"],
    sections: {
      moments: { label: "Race moments", icon: "🏁", singular: "moment" },
      wrecks:  { label: "Wrecks & chaos", icon: "💥", singular: "wreck" }
    }
  },

  /* The broadcast eras — VRL's history told through who held the camera.
     Channel keys match pipeline data (races[].channel). */
  eras: [
    { id: "mdot", name: "Midwest Days of Thunder", short: "MDOT era", status: "live",
      channelUrl: "https://www.youtube.com/@midwestdaysofthunder8434",
      blurb: "Where it all started. The earliest surviving VRL broadcasts — 'Vigilante Racing Series' nights on the Midwest Days of Thunder channel." },
    { id: "aaa", name: "AAA Broadcasting", short: "AAA era", status: "live",
      channelUrl: "https://www.youtube.com/@aaabroadcasting3649",
      blurb: "The golden grind. AAA Broadcasting called well over a hundred VRL Wednesday nights — season openers, Championship Wednesdays, the VRL Olympics and the All-Star wars." },
    { id: "tln", name: "Track Limits Network", short: "TLN era", status: "live",
      channelUrl: "https://www.youtube.com/@TrackLimitsNetwork",
      blurb: "The clean-sheet era. Track Limits Network numbered every round — Race #1 through the Championship Round — as VRL matured into a full-calendar league." },
    { id: "vrn", name: "Vigilante Racing Network", short: "VRN era", status: "live",
      channelUrl: "https://www.youtube.com/@VigilanteRacingNetwork",
      blurb: "The league gets its own network. VRL Premiere Series broadcasts on the official Vigilante Racing Network channel — the current home of Wednesday nights." }
  ],

  /* Note pinned in the archive: some broadcasts are lost media. */
  lostMedia: "One broadcaster in VRL history pulled their uploads — those Wednesday nights are lost tape. If a race is missing here, it may no longer exist anywhere on YouTube.",

  links: {
    youtube: "https://www.youtube.com/@VigilanteRacingNetwork",
    mdot: "https://www.youtube.com/@midwestdaysofthunder8434",
    aaa: "https://www.youtube.com/@aaabroadcasting3649",
    tln: "https://www.youtube.com/@TrackLimitsNetwork"
  }
};
