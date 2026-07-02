// ============================================================
//  Lunch Rush — the Vampire-Survivors-style food-truck mini-game. Pure DATA:
//  the three escalating rush tiers (arena difficulty + bounded rewards), the
//  level-up upgrade pool, and the flavour lines. engine/foodFrenzy.ts owns the
//  offer gating + reward application; ui/shared/FoodFrenzyGame.tsx runs the
//  actual swarm on <canvas> and reports final metrics only.
//
//  All fictional; sprites are emoji (zero assets, zero licences).
// ============================================================

export interface FrenzyTierDef {
  index: number // 0..2
  name: string // "Lunch Rush" / "Dinner Rush" / "Festival Night"
  codename: string
  intro: string[] // briefing lines from your fry cook, Nacho
  debrief: string[] // shown on a cleared run
  durationSec: number // survive this long to clear the tier
  // --- swarm difficulty ---
  spawnEveryMs: number // base fan spawn cadence (ramps down over the run)
  fanSpeed: number // base walk speed px/s
  fastShare: number // 0..1 share of sprinting fans
  superAtSec: number | null // 🤩 superfan (tank) waves start at this second
  stampedeEverySec: number | null // a ring of fans every N seconds
  // --- bounded rewards (engine applies) ---
  cashIncomeSeconds: number // idle-income seconds × band mult
  cashFloor: number // flat floor so pre-automation players still get paid
  buffMult: number // Food-only timed profit buff on a clear
  buffMs: number
  // --- band thresholds ---
  goodFans: number // fans fed for a 'good' read
  greatFans: number // fans fed (with composure) for 'great'
}

export const FOOD_FRENZY_TIERS: FrenzyTierDef[] = [
  {
    index: 0,
    name: 'Lunch Rush',
    codename: 'CODE MUSTARD',
    intro: [
      'Boss! Someone posted the truck on SnackTok and now the WHOLE OFFICE DISTRICT is sprinting here on their lunch break.',
      'Grab the tongs. Feed anyone who gets close — a fed fan is a happy fan. Don’t let them mob the truck or we’ll lose our composure.',
      'Steer with the on-screen stick on mobile, or WASD / hold-click on desktop. The tongs throw themselves. Go go go!',
    ],
    debrief: [
      'The crowd is fed, the till is FULL, and somebody started a fan club. Nacho salutes you with the spatula.',
      'That kind of buzz is good for business, boss. The whole Food wing is cooking.',
    ],
    durationSec: 75,
    spawnEveryMs: 1050,
    fanSpeed: 46,
    fastShare: 0.12,
    superAtSec: null,
    stampedeEverySec: null,
    cashIncomeSeconds: 60,
    cashFloor: 1_500,
    buffMult: 1.5,
    buffMs: 60_000,
    goodFans: 25,
    greatFans: 45,
  },
  {
    index: 1,
    name: 'Dinner Rush',
    codename: 'CODE RELISH',
    intro: [
      'It got worse, boss. A food critic called our dog “a transcendent tube” and now the DINNER crowd is here. They are faster. They are hungrier.',
      'Watch for the sprinters — and around half past, the big superfans arrive. They take three dogs each. THREE.',
      'Same drill: feed everyone, keep your composure, trust the tongs.',
    ],
    debrief: [
      'The critic came back for seconds. SECONDS, boss. Nacho is framing the receipt.',
      'Word of a truck that survived the dinner rush travels. Food profits are sizzling.',
    ],
    durationSec: 90,
    spawnEveryMs: 900,
    fanSpeed: 54,
    fastShare: 0.22,
    superAtSec: 35,
    stampedeEverySec: null,
    cashIncomeSeconds: 90,
    cashFloor: 6_000,
    buffMult: 1.6,
    buffMs: 75_000,
    goodFans: 35,
    greatFans: 65,
  },
  {
    index: 2,
    name: 'Festival Night',
    codename: 'CODE GLIZZY',
    intro: [
      'This is it, boss. The night festival. Ten thousand people, one truck, and a rumour that we might run out.',
      'They will come in WAVES — actual stampedes, every half minute, from every direction at once. The superfans brought friends.',
      'Clear tonight and you retire the golden spatula. Legends get remembered. Trucks get FUNDED.',
    ],
    debrief: [
      'They’ll talk about tonight for years. The truck is empty, the crowd is chanting, and Nacho is crying into the onions (happy tears).',
      'The GOLDEN SPATULA is yours — the whole Food empire cooks hotter, forever.',
    ],
    durationSec: 105,
    spawnEveryMs: 780,
    fanSpeed: 60,
    fastShare: 0.3,
    superAtSec: 20,
    stampedeEverySec: 30,
    cashIncomeSeconds: 150,
    cashFloor: 20_000,
    buffMult: 1.7,
    buffMs: 90_000,
    goodFans: 45,
    greatFans: 85,
  },
]

export const FOOD_FRENZY_TOTAL_TIERS = FOOD_FRENZY_TIERS.length

export const FOOD_FRENZY_FAIL_LINES = [
  'The crowd mobbed the truck, boss. We lost the tongs. We lost our composure. We did NOT lose our spirit.',
  'Every legend has a rough service. Restock, breathe, and the rush will come back around.',
]

// ── The Vampire-Survivors bit: mid-run level-up upgrades ─────────────────────
export interface FrenzyUpgradeDef {
  id: string
  name: string
  icon: string
  blurb: string
  maxStacks: number
}

export const FRENZY_UPGRADES: FrenzyUpgradeDef[] = [
  { id: 'double_dogs', name: 'Double Dogs', icon: '🌭', blurb: '+1 hotdog per throw', maxStacks: 3 },
  { id: 'turbo_grill', name: 'Turbo Grill', icon: '🔥', blurb: 'Throw 25% faster', maxStacks: 4 },
  { id: 'extra_mustard', name: 'Extra Mustard', icon: '🟡', blurb: 'Hits splash nearby fans', maxStacks: 3 },
  { id: 'long_toss', name: 'Long Toss', icon: '💪', blurb: '+30% throw range', maxStacks: 3 },
  { id: 'roller_skates', name: 'Roller Skates', icon: '🛼', blurb: 'Truck moves 20% faster', maxStacks: 3 },
  { id: 'big_dog', name: 'The Big Dog', icon: '🐕', blurb: 'Dogs pierce through fans', maxStacks: 1 },
  { id: 'snack_magnet', name: 'Snack Magnet', icon: '🧲', blurb: 'Tips fly to you from further', maxStacks: 3 },
  { id: 'combo_sauce', name: 'Combo Sauce', icon: '🥫', blurb: 'Each dog satisfies +1 hunger', maxStacks: 2 },
]

export const FRENZY_UPGRADE_BY_ID: Record<string, FrenzyUpgradeDef> = Object.fromEntries(
  FRENZY_UPGRADES.map((u) => [u.id, u]),
)
