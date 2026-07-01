// ============================================================
//  Mogul Stories registry. Author a story under this folder, then register it here.
//  Content (stages/choices/outcome copy) is data; each story's trigger, scoring→band
//  logic, and reward side-effects are its own (Angel Investment's live in
//  engine/angelDeal.ts). See mogul-stories.md for how to add a story.
// ============================================================
import type { MogulStory } from './types'
import { ANGEL_DEAL } from './angelInvestment'
import { LEASE_SHOWDOWN } from './leaseShowdown'
import { ENGINE_POACH } from './enginePoach'
import { VIRAL_MOMENT } from './viralMoment'
import { DOCK_DISPUTE } from './dockDispute'

export * from './types'
export { ANGEL_DEAL } from './angelInvestment'
export { LEASE_SHOWDOWN } from './leaseShowdown'
export { ENGINE_POACH } from './enginePoach'
export { VIRAL_MOMENT } from './viralMoment'
export { DOCK_DISPUTE } from './dockDispute'

/** Every registered Mogul Story (Angel Investment is the reference story). */
export const MOGUL_STORIES: MogulStory[] = [
  ANGEL_DEAL,
  LEASE_SHOWDOWN,
  ENGINE_POACH,
  VIRAL_MOMENT,
  DOCK_DISPUTE,
]

export const MOGUL_STORY_BY_ID: Record<string, MogulStory> = Object.fromEntries(
  MOGUL_STORIES.map((s) => [s.id, s]),
)

export function getMogulStory(id: string): MogulStory | undefined {
  return MOGUL_STORY_BY_ID[id]
}
