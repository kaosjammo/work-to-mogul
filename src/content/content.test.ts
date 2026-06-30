import { describe, it, expect } from 'vitest'
import { validateContent } from '../engine/validateContent'
import { INDUSTRIES, INDUSTRY_ORDER } from './industries'
import { BUSINESSES } from './businesses'
import { UPGRADES, UPGRADE_ORDER } from './upgrades'
import { purchase } from '../engine/buy'
import { initialGameState } from '../store/initialState'
import { SIGNATURE_PERKS } from '../engine/economy'
import { EMPLOYEE_TEMPLATES, HIRE_ORDER } from './employeeTemplates'

describe('content integrity', () => {
  it('passes referential validation with all industries', () => {
    expect(validateContent()).toEqual([])
  })

  it('every industry business id resolves and back-references its industry', () => {
    for (const iid of INDUSTRY_ORDER) {
      for (const bid of INDUSTRIES[iid].businessIds) {
        expect(BUSINESSES[bid]).toBeDefined()
        expect(BUSINESSES[bid].industryId).toBe(iid)
      }
    }
  })

  it('every industry signature perk has a wired effect (no dead perks)', () => {
    for (const iid of INDUSTRY_ORDER) {
      const perkId = INDUSTRIES[iid].bonus.signaturePerkId
      const perk = SIGNATURE_PERKS[perkId]
      expect(perk, `${iid}'s perk "${perkId}" must be wired in SIGNATURE_PERKS`).toBeDefined()
      // A perk must actually change profit or speed, else it's a no-op identity.
      expect((perk.profit ?? 1) > 1 || (perk.speed ?? 1) > 1).toBe(true)
    }
  })

  it('every employee template is hireable (HIRE_ORDER ⇔ templates, no orphans)', () => {
    const templateIds = Object.keys(EMPLOYEE_TEMPLATES)
    const ordered = new Set(HIRE_ORDER)
    // No template defined but missing from the hire pool (would be unhireable).
    for (const id of templateIds) {
      expect(ordered.has(id), `${id} is defined but missing from HIRE_ORDER (unhireable)`).toBe(true)
    }
    // No HIRE_ORDER entry pointing at a non-existent template.
    for (const id of HIRE_ORDER) {
      expect(EMPLOYEE_TEMPLATES[id], `HIRE_ORDER lists unknown template "${id}"`).toBeDefined()
    }
    expect(HIRE_ORDER.length).toBe(templateIds.length)
  })
})

describe('Logistics industry', () => {
  it('is present and visible from the start', () => {
    expect(INDUSTRY_ORDER).toContain('logistics')
    const s = initialGameState(0)
    expect(s.industries.logistics.unlocked).toBe(true)
  })

  it('first business (Courier) is gated only by affordability', () => {
    const s = initialGameState(0)
    expect(purchase(s, 'courier', 1)).toBe(false) // broke
    s.cash = BUSINESSES.courier.baseCost
    expect(purchase(s, 'courier', 1)).toBe(true)
    expect(s.businesses.courier.owned).toBe(1)
  })
})

describe('Energy industry', () => {
  it('is present and visible from the start', () => {
    expect(INDUSTRY_ORDER).toContain('energy')
    expect(initialGameState(0).industries.energy.unlocked).toBe(true)
  })

  it('first business (Solar Farm) is gated only by affordability', () => {
    const s = initialGameState(0)
    s.cash = BUSINESSES.solar_farm.baseCost
    expect(purchase(s, 'solar_farm', 1)).toBe(true)
    expect(s.businesses.solar_farm.owned).toBe(1)
  })
})

describe('content scale target', () => {
  it('has at least 7 industries and 24+ businesses', () => {
    expect(INDUSTRY_ORDER.length).toBeGreaterThanOrEqual(7)
    expect(Object.keys(BUSINESSES).length).toBeGreaterThanOrEqual(24)
  })

  it('Space (capstone) is present and its first business is affordability-gated', () => {
    expect(INDUSTRY_ORDER).toContain('space')
    const s = initialGameState(0)
    s.cash = BUSINESSES.satellite.baseCost
    expect(purchase(s, 'satellite', 1)).toBe(true)
  })
})

describe('upgrades catalog', () => {
  it('UPGRADE_ORDER matches the UPGRADES keys exactly', () => {
    expect([...UPGRADE_ORDER].sort()).toEqual(Object.keys(UPGRADES).sort())
  })

  it('offers a healthy catalog (>=12) with at least one upgrade per industry', () => {
    expect(UPGRADE_ORDER.length).toBeGreaterThanOrEqual(12)
    for (const iid of INDUSTRY_ORDER) {
      const hasIndustryUpgrade = Object.values(UPGRADES).some(
        (u) => u.scope.kind === 'industry' && u.scope.industryId === iid,
      )
      expect(hasIndustryUpgrade, `industry ${iid} should have an upgrade`).toBe(true)
    }
  })
})
