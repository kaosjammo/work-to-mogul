import { describe, it, expect } from 'vitest'
import { describeMilestone, newlyReached } from './milestones'

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
