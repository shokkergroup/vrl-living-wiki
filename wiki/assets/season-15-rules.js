window.SEASON_RULES = {
  "Season 15": {
    seasonLabel: "Season 15",
    status: "active",
    reviewStatus: "league-owner-supplied",
    suppliedAt: "2026-07-27",
    sourceLabel: "VRL league owner",
    schedule: {
      totalWeeks: 17,
      regularSeasonRaces: 12,
      chaseRaces: 5
    },
    qualification: {
      winAndIn: false,
      label: "No win-and-you're-in",
      context: "Continues the Season 14 approach; NASCAR 2026 format."
    },
    drops: {
      count: 2,
      appliesToRounds: "1–12"
    },
    bonuses: [
      {
        id: "hard-charger",
        label: "Hard Charger",
        points: 3,
        condition: "Awarded for the race's Hard Charger."
      },
      {
        id: "zero-incidents",
        label: "Zero incident points",
        points: 2,
        condition: "Awarded for zero incident points unless a penalty is issued during the league owner's post-race review."
      }
    ],
    limitations: [
      "Owner-supplied rulebook, not a claim inferred from broadcast captions.",
      "Does not establish standings, penalty decisions, drop-week selections, or a Season 15 champion.",
      "Race outcomes remain subject to the reviewed result and championship evidence ledgers."
    ]
  }
};
