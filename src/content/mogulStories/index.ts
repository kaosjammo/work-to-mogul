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
import { INSPECTION } from './inspection'
import { LAUNCH } from './launchGamble'
import { ROMANCE_SPARK } from './romanceSpark'
import { ROMANCE_DATE } from './romanceDate'
import { ROMANCE_GETAWAY } from './romanceGetaway'
import { ROMANCE_PUBLIC } from './romancePublic'
import { ROMANCE_KEY } from './romanceKey'
import { ROMANCE_PROPOSAL } from './romanceProposal'
import { EA_SUMMIT } from './eaSummit'
import { EA_WARROOM } from './eaWarRoom'
import { EA_OFFER } from './eaOffer'
import { DIVORCE_SETTLEMENT } from './divorceSettlement'
import { AFFAIR_MEET } from './affairMeet'
import { AFFAIR_SPARK } from './affairSpark'
import { AFFAIR_SECRET } from './affairSecret'
import { AFFAIR_PULL } from './affairPull'
import { AFFAIR_CHOICE } from './affairChoice'
import { AFFAIR_CAUGHT } from './affairCaught'
import { AFFAIR_REYNA } from './affairReyna'

export * from './types'
export { ANGEL_DEAL } from './angelInvestment'
export { LEASE_SHOWDOWN } from './leaseShowdown'
export { ENGINE_POACH } from './enginePoach'
export { VIRAL_MOMENT } from './viralMoment'
export { DOCK_DISPUTE } from './dockDispute'
export { INSPECTION } from './inspection'
export { LAUNCH } from './launchGamble'
export { ROMANCE_SPARK } from './romanceSpark'
export { ROMANCE_DATE } from './romanceDate'
export { ROMANCE_GETAWAY } from './romanceGetaway'
export { ROMANCE_PUBLIC } from './romancePublic'
export { ROMANCE_KEY } from './romanceKey'
export { ROMANCE_PROPOSAL } from './romanceProposal'
export { EA_SUMMIT } from './eaSummit'
export { EA_WARROOM } from './eaWarRoom'
export { EA_OFFER } from './eaOffer'
export { DIVORCE_SETTLEMENT } from './divorceSettlement'
export { AFFAIR_MEET } from './affairMeet'
export { AFFAIR_SPARK } from './affairSpark'
export { AFFAIR_SECRET } from './affairSecret'
export { AFFAIR_PULL } from './affairPull'
export { AFFAIR_CHOICE } from './affairChoice'
export { AFFAIR_CAUGHT } from './affairCaught'
export { AFFAIR_REYNA } from './affairReyna'

/** Every registered Mogul Story (Angel Investment is the reference story).
 *  The six `love_*` entries form the romance ARC — offered one at a time,
 *  gated on relationship progress (see engine/romance.ts), not an industry. */
export const MOGUL_STORIES: MogulStory[] = [
  ANGEL_DEAL,
  LEASE_SHOWDOWN,
  ENGINE_POACH,
  VIRAL_MOMENT,
  DOCK_DISPUTE,
  INSPECTION,
  LAUNCH,
  ROMANCE_SPARK,
  ROMANCE_DATE,
  ROMANCE_GETAWAY,
  ROMANCE_PUBLIC,
  ROMANCE_KEY,
  ROMANCE_PROPOSAL,
  // Executive Assistant arc (poach a rival CEO's right hand) — gated on EA-arc progress.
  EA_SUMMIT,
  EA_WARROOM,
  EA_OFFER,
  // Player-triggered only (never auto-offered — see eligibleStories): the divorce.
  DIVORCE_SETTLEMENT,
  // The Affair arc (post-honeymoon temptation) + its cheating fallout. Episodes are
  // offered on affair progress; the caught/Reyna fallout stories are forced, never offered.
  AFFAIR_MEET,
  AFFAIR_SPARK,
  AFFAIR_SECRET,
  AFFAIR_PULL,
  AFFAIR_CHOICE,
  AFFAIR_CAUGHT,
  AFFAIR_REYNA,
]

export const MOGUL_STORY_BY_ID: Record<string, MogulStory> = Object.fromEntries(
  MOGUL_STORIES.map((s) => [s.id, s]),
)

export function getMogulStory(id: string): MogulStory | undefined {
  return MOGUL_STORY_BY_ID[id]
}
