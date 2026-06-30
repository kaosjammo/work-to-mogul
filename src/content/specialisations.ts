// ============================================================
//  Level-5 employee specialisations (M4b depth).
//  At level 5 an employee may choose ONE specialisation for their role. Each is
//  a permanent-feeling identity pick (re-choosable): either AMPLIFY the role's
//  primary channel, or BRANCH into a useful secondary channel. The deltas are
//  added into the per-employee magnitude exactly like traits (so they scale
//  with rarity × level × affinity) — see engine/employees/composition.ts.
// ============================================================
import type { EffectChannel, RoleId, SpecId } from '../types/domain'

export interface SpecialisationDef {
  id: SpecId
  role: RoleId
  name: string
  icon: string
  blurb: string // plain-language outcome for the UI
  channelDeltas: Partial<Record<EffectChannel, number>>
  mastery?: boolean // a level-10 capstone (a stronger amplify than the base two)
}

export const REQUIRED_SPEC_LEVEL = 5
// A SECOND specialisation slot unlocks at the level cap. Reaching it lets an
// employee hold two of its role's three specs — a genuine "which two?" build
// decision that makes levels 6–10 a goal, not just a magnitude grind.
export const MASTERY_SPEC_LEVEL = 10

// Three picks per role: [A] amplify the primary, [B] branch a secondary, and a
// [M] Mastery capstone (a stronger amplify, flagged `mastery`). A level-5 employee
// picks one; at level 10 it picks a second (different) one — so the leftover spec
// is the real cost of the build.
export const SPECIALISATIONS: Record<string, SpecialisationDef> = {
  // operator (automation is binary — both picks branch a secondary)
  night_owl: { id: 'night_owl', role: 'operator', name: 'Night Owl', icon: '🌙', blurb: 'Also speeds up cycles', channelDeltas: { cycleSpeed: 0.2 } },
  floor_chief: { id: 'floor_chief', role: 'operator', name: 'Floor Chief', icon: '📋', blurb: 'Also lifts team morale', channelDeltas: { morale: 8 } },

  // runner (primary: cycleSpeed)
  sprint_lead: { id: 'sprint_lead', role: 'runner', name: 'Sprint Lead', icon: '💨', blurb: 'Even faster cycles', channelDeltas: { cycleSpeed: 0.18 } },
  road_warrior: { id: 'road_warrior', role: 'runner', name: 'Road Warrior', icon: '📦', blurb: 'Adds a profit boost', channelDeltas: { profitMult: 0.18 } },

  // closer (primary: profitMult)
  rainmaker: { id: 'rainmaker', role: 'closer', name: 'Rainmaker', icon: '🌧️', blurb: 'Even more profit', channelDeltas: { profitMult: 0.3 } },
  upseller: { id: 'upseller', role: 'closer', name: 'Upseller', icon: '🎯', blurb: 'Adds jackpot chance', channelDeltas: { critChance: 0.06 } },

  // buyer (primary: costReduction)
  bulk_buyer: { id: 'bulk_buyer', role: 'buyer', name: 'Bulk Buyer', icon: '📉', blurb: 'Even cheaper to expand', channelDeltas: { costReduction: 0.22 } },
  dealmaker: { id: 'dealmaker', role: 'buyer', name: 'Dealmaker', icon: '🤝', blurb: 'Adds a profit boost', channelDeltas: { profitMult: 0.14 } },

  // gambler (primary: critChance / critMult — two crit dimensions)
  high_roller: { id: 'high_roller', role: 'gambler', name: 'High Roller', icon: '🎰', blurb: 'More jackpot chance', channelDeltas: { critChance: 0.06 } },
  sharpshooter: { id: 'sharpshooter', role: 'gambler', name: 'Sharpshooter', icon: '🎯', blurb: 'Bigger jackpot payouts', channelDeltas: { critMult: 1.0 } },

  // auditor (primary: riskReduction)
  compliance_officer: { id: 'compliance_officer', role: 'auditor', name: 'Compliance Officer', icon: '🛡️', blurb: 'Even less risk build-up', channelDeltas: { riskReduction: 0.25 } },
  risk_analyst: { id: 'risk_analyst', role: 'auditor', name: 'Risk Analyst', icon: '📊', blurb: 'Adds a profit boost', channelDeltas: { profitMult: 0.12 } },

  // hr (primary: morale)
  culture_champion: { id: 'culture_champion', role: 'hr', name: 'Culture Champion', icon: '🎉', blurb: 'Even higher morale', channelDeltas: { morale: 8 } },
  talent_scout: { id: 'talent_scout', role: 'hr', name: 'Talent Scout', icon: '🧲', blurb: 'Adds a speed boost', channelDeltas: { cycleSpeed: 0.12 } },

  // ---------- Mastery capstones (level 10) — one per role, a stronger amplify ----------
  lights_out: { id: 'lights_out', role: 'operator', name: 'Lights-Out', icon: '🤖', blurb: 'Big cycle-speed surge', channelDeltas: { cycleSpeed: 0.35 }, mastery: true },
  slipstream: { id: 'slipstream', role: 'runner', name: 'Slipstream', icon: '🏎️', blurb: 'Huge cycle-speed surge', channelDeltas: { cycleSpeed: 0.35 }, mastery: true },
  kingpin: { id: 'kingpin', role: 'closer', name: 'Kingpin', icon: '👑', blurb: 'Huge profit surge', channelDeltas: { profitMult: 0.5 }, mastery: true },
  monopolist: { id: 'monopolist', role: 'buyer', name: 'Monopolist', icon: '🏛️', blurb: 'Deep expansion discount', channelDeltas: { costReduction: 0.4 }, mastery: true },
  whale: { id: 'whale', role: 'gambler', name: 'Whale', icon: '🐋', blurb: 'More + bigger jackpots', channelDeltas: { critChance: 0.05, critMult: 1.5 }, mastery: true },
  watchdog: { id: 'watchdog', role: 'auditor', name: 'Watchdog', icon: '🐕', blurb: 'Slashes risk, adds profit', channelDeltas: { riskReduction: 0.3, profitMult: 0.1 }, mastery: true },
  luminary: { id: 'luminary', role: 'hr', name: 'Luminary', icon: '✨', blurb: 'Top morale + a speed boost', channelDeltas: { morale: 12, cycleSpeed: 0.08 }, mastery: true },
}

export const SPECS_BY_ROLE: Record<RoleId, SpecialisationDef[]> = (() => {
  const out = {
    operator: [], runner: [], closer: [], buyer: [], gambler: [], auditor: [], hr: [],
  } as Record<RoleId, SpecialisationDef[]>
  for (const s of Object.values(SPECIALISATIONS)) out[s.role].push(s)
  return out
})()

export const SPEC_NAME: Record<string, string> = Object.fromEntries(
  Object.values(SPECIALISATIONS).map((s) => [s.id, s.name]),
)
