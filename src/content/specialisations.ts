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
}

export const REQUIRED_SPEC_LEVEL = 5

// Two picks per role: [A] amplify the primary, [B] branch a secondary.
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
