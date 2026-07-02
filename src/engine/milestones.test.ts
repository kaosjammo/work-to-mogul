import { describe, it, expect } from 'vitest'
import { describeMilestone, newlyReached, milestoneCelebrations } from './milestones'
import { BUSINESSES } from '../content/businesses'

describe('describeMilestone', () => {
  it('describes a speed milestone (Lemonade at 25)', () => {
    const info = describeMilestone('lemonade_25')
    expect(info).not.toBeNull()
    expect(info!.businessId).toBe('lemonade')
    expect(info!.threshold).toBe(25)
    expect(info!.text).toBe('Lemonade Stand: ×2 speed!')
  })

  it('describes a profit milestone (Lemonade at 50)', () => {
    expect(describeMilestone('lemonade_50')!.text).toBe('Lemonade Stand: ×2 profit!')
  })

  it('handles business ids that contain underscores', () => {
    const info = describeMilestone('food_truck_25')
    expect(info!.businessId).toBe('food_truck')
    expect(info!.businessName).toBe('Food Truck')
  })

  it('returns null for unknown ids', () => {
    expect(describeMilestone('nope_25')).toBeNull()
    expect(describeMilestone('garbage')).toBeNull()
  })
})

describe('newlyReached', () => {
  it('returns only ids not present before', () => {
    expect(newlyReached(['a', 'b'], ['a', 'b', 'c', 'd'])).toEqual(['c', 'd'])
    expect(newlyReached(['a'], ['a'])).toEqual([])
  })
})

describe('milestoneCelebrations — collapse a burst so the toast queue never clogs', () => {
  it('1–2 crossings keep their individual flavour text', () => {
    expect(milestoneCelebrations(['lemonade_25'])).toEqual(['Lemonade Stand: ×2 speed!'])
    expect(milestoneCelebrations(['lemonade_25', 'lemonade_50'])).toEqual([
      'Lemonade Stand: ×2 speed!',
      'Lemonade Stand: ×2 profit!',
    ])
  })

  it('a many-threshold Max buy collapses to ONE summary per business', () => {
    // Take the Startup Combinator's first 6 real milestone ids (the reported bug's
    // business — a big buy crossed many at once and clogged the queue).
    const ids = BUSINESSES.startup_combinator.milestones.slice(0, 6).map((m) => m.id)
    const out = milestoneCelebrations(ids)
    expect(out).toHaveLength(1)
    expect(out[0]).toBe('Startup Combinator: 6 milestones!')
  })

  it('a mixed multi-business burst summarises per business', () => {
    const lemon = BUSINESSES.lemonade.milestones.slice(0, 4).map((m) => m.id)
    const truck = BUSINESSES.food_truck.milestones.slice(0, 3).map((m) => m.id)
    const out = milestoneCelebrations([...lemon, ...truck])
    expect(out).toEqual(['Lemonade Stand: 4 milestones!', 'Food Truck: 3 milestones!'])
  })

  it('ignores unknown ids', () => {
    expect(milestoneCelebrations(['garbage', 'nope_25'])).toEqual([])
  })
})
