// ============================================================
//  Space Salvage Shooter — the 5-stage arcade campaign (content only).
//  A rare Space-industry opportunity mini-game hidden inside the idle mogul
//  loop. This file is pure DATA: stage difficulty, rewards, and the over-the-top
//  Central Command dialogue. The engine (engine/spaceShooter.ts) reads these; the
//  canvas UI (ui/shared/SpaceSalvageShooter.tsx) renders them. No React here.
//
//  Tone: ridiculous, dramatic, satirical corporate-space nonsense. No real
//  people/companies, no copyrighted references. Mobile-readable one-liners.
// ============================================================

/** Which enemy fleet pack a stage draws its hostiles from (Foozle Void packs). */
export type FleetId = 1 | 2 | 3

/** Bounded rewards for surviving a stage (scaled by outcome band in the engine). */
export interface SpaceShooterReward {
  /** Base seconds-of-idle-income granted as Space cash (× the outcome-band multiplier). */
  cashIncomeSeconds: number
  /** A temporary Space-only profit buff (Stage 2's signature reward). */
  buffMult?: number
  buffMs?: number
  /** Stage 4: records progress toward the Orbital Salvage Yard (a permanent Space perk). */
  unlockYard?: boolean
  /** Stage 5: unlocks the AI Salvage Pilot (automation; manual stages stop after this). */
  unlockAiPilot?: boolean
}

export interface StageDifficulty {
  /** Extraction timer — survive this long to win (kept within the 60–90s target). */
  durationSec: number
  /** ms between enemy spawns (smaller = more enemies). */
  enemyEveryMs: number
  /** ms between drifting debris (asteroid) spawns. */
  debrisEveryMs: number
  /** ms between salvage-pickup spawns. */
  salvageEveryMs: number
  /** Downward speed of hostiles/debris in px/sec (scaled to the play area height). */
  fallSpeed: number
  /** Enemy hit points (how many player shots to destroy a basic hostile). */
  enemyHp: number
  /** Do enemies fire back? (intro stages don't). */
  enemyFires: boolean
  /** Seconds into the run a Dreadnought "boss" drifts through (undefined = none). */
  bossAtSec?: number
}

export interface SpaceShooterStageDef {
  index: number // 0-based (0..4)
  number: number // 1-based (1..5) — the campaign stage number shown in UI
  id: string
  title: string
  codename: string // short evocative subtitle
  fleet: FleetId
  /** Central Command dialogue shown BEFORE launch. */
  briefing: string[]
  /** Central Command dialogue shown AFTER passing. */
  debrief: string[]
  difficulty: StageDifficulty
  reward: SpaceShooterReward
}

// Shared "you failed" flavour — Central Command spinning a shields-zero into a
// bullish data-gathering exercise. Retry is always allowed after a short cooldown.
export const SPACE_SHOOTER_FAIL_LINES: string[] = [
  'Shields at zero. The salvage got away — and frankly, so did our dignity.',
  "Command is calling this 'a strategic data-gathering exercise'. Investors are calling their lawyers.",
  'Refit the ship and try the run again when the signal returns, Commander.',
]

export const SPACE_SHOOTER_STAGES: SpaceShooterStageDef[] = [
  {
    index: 0,
    number: 1,
    id: 'strange-signal',
    title: 'Strange Signal',
    codename: 'First Contact With The Balance Sheet',
    fleet: 1,
    briefing: [
      'Commander, deep-scan just pinged something enormous adrift past the Frontier belt. It is derelict, it is rich in salvage, and it is broadcasting.',
      'Broadcasting WHAT? Quarterly earnings. In a language made of screaming maths. Legal has reclassified this from "haunted" to "a networking opportunity".',
      'Take a light ship out. Nudge the debris, collect anything that is not actively suing us, and survive until the extraction window opens.',
    ],
    debrief: [
      'First contact: profitable. The board has upgraded "screaming maths" to "promising synergy".',
      'Small salvage payout inbound. Welcome to the Space Salvage program, Commander — try not to enjoy it.',
    ],
    difficulty: {
      durationSec: 60,
      enemyEveryMs: 2200,
      debrisEveryMs: 2600,
      salvageEveryMs: 4200,
      fallSpeed: 90,
      enemyHp: 1,
      enemyFires: false,
    },
    reward: { cashIncomeSeconds: 45 },
  },
  {
    index: 1,
    number: 2,
    id: 'debris-has-opinions',
    title: 'The Debris Has Opinions',
    codename: 'Wreckage That Hates Capitalism',
    fleet: 1,
    briefing: [
      'Update: the wreckage has started MOVING. Not drifting — moving. With intent. Our physicist resigned and left a note that simply reads: "it hates capitalism".',
      "Command's official position is that hostile inventory is still inventory. Fly in, dodge the opinionated scrap, and bring back margin.",
      'If anything out there asks about our carbon footprint, deny everything and out-manoeuvre the messenger. Extraction in ninety seconds.',
    ],
    debrief: [
      'The debris filed a formal complaint. We filed it under "profit".',
      'Salvaged tech is boosting Space operations — morale is up, ethics are down, and the numbers are a beautiful, guiltless green.',
    ],
    difficulty: {
      durationSec: 70,
      enemyEveryMs: 1700,
      debrisEveryMs: 1500,
      salvageEveryMs: 4600,
      fallSpeed: 110,
      enemyHp: 1,
      enemyFires: true,
    },
    reward: { cashIncomeSeconds: 30, buffMult: 1.5, buffMs: 60_000 },
  },
  {
    index: 2,
    number: 3,
    id: 'hostile-acquisition',
    title: 'Hostile Acquisition',
    codename: 'A Merger, With Lasers',
    fleet: 2,
    briefing: [
      'The salvage has DEFENDERS now — a fleet of alien drones. We are reframing this from "looting a graveyard" to "an aggressive but friendly merger".',
      'Good news: the drones respect strength. Bad news: they define strength strictly as missile volume. Bring volume.',
      'Do NOT, under any circumstances, sign anything they hand you. It is either a peace treaty or a hostile takeover of YOU.',
    ],
    debrief: [
      'Merger complete. Shareholders are thrilled, the drones are scrap, and Legal is "fairly confident" that was legal.',
      'Banking a substantial salvage payout. The synergy, Commander, was very real and very explosive.',
    ],
    difficulty: {
      durationSec: 75,
      enemyEveryMs: 1300,
      debrisEveryMs: 1800,
      salvageEveryMs: 5200,
      fallSpeed: 130,
      enemyHp: 2,
      enemyFires: true,
    },
    reward: { cashIncomeSeconds: 150 },
  },
  {
    index: 3,
    number: 4,
    id: 'board-meeting-in-orbit',
    title: 'Board Meeting In Orbit',
    codename: 'Everyone Is Panicking Incorrectly',
    fleet: 3,
    briefing: [
      'Emergency orbital board meeting. Command is panicking, Legal is panicking, Investors are panicking — each in a completely different and unhelpful direction.',
      'Investors want you to "lean in". Legal wants you to "lean out". The CFO is leaning against a window and will not stop. You will lean into the enemy fleet.',
      'Salvage the Orbital Yard, Commander. It is the only agenda item nobody is crying about. Ninety seconds. Go.',
    ],
    debrief: [
      'You salvaged the Orbital Salvage Yard out from under three simultaneous meltdowns. It is now a permanent Space asset.',
      'The board reviewed the footage and decided that fear is, in fact, bullish.',
    ],
    difficulty: {
      durationSec: 80,
      enemyEveryMs: 1050,
      debrisEveryMs: 1300,
      salvageEveryMs: 5200,
      fallSpeed: 155,
      enemyHp: 2,
      enemyFires: true,
      bossAtSec: 45,
    },
    reward: { cashIncomeSeconds: 120, unlockYard: true },
  },
  {
    index: 4,
    number: 5,
    id: 'the-pilot-is-obsolete',
    title: 'The Pilot Is Obsolete',
    codename: 'Your Retirement Party Has Lasers',
    fleet: 3,
    briefing: [
      'Final run, Commander. Everything is out here — every fleet, every grudge, all the debris that ever hated us. R&D is calling it "the total addressable market".',
      'One more thing: while you fly this, Engineering has quietly finished an AI to do YOUR job. They insist it is "nothing personal". It is extremely personal.',
      'Fly like it is the last time a human ever does this — because after today, it is. Extraction, if you reach it, is your retirement party.',
    ],
    debrief: [
      'You survived. And so, regrettably, did the AI Salvage Pilot. It has assumed your duties, your desk, and your parking spot.',
      'Manual salvage command is now obsolete — future salvage runs resolve automatically. Thank you for your service, Commander. You are being "promoted to legend".',
    ],
    difficulty: {
      durationSec: 90,
      enemyEveryMs: 850,
      debrisEveryMs: 1100,
      salvageEveryMs: 5600,
      fallSpeed: 175,
      enemyHp: 3,
      enemyFires: true,
      bossAtSec: 40,
    },
    reward: { cashIncomeSeconds: 240, unlockAiPilot: true },
  },
]

export const SPACE_SHOOTER_STAGE_BY_INDEX: Record<number, SpaceShooterStageDef> =
  Object.fromEntries(SPACE_SHOOTER_STAGES.map((s) => [s.index, s]))

export const SPACE_SHOOTER_TOTAL_STAGES = SPACE_SHOOTER_STAGES.length
