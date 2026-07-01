// ============================================================
//  Mogul Story — "The Lease" (Retail). A short (7-stage) landlord showdown over a
//  flagship storefront: read the location, hold the line on terms, and spot the trap
//  buried in the fine print. Demonstrates variable length (shorter than Angel) and a
//  fully self-contained story that reuses the shared negotiation scores + generic
//  resolution (owns-industry trigger, band→reward, timed Retail profit boost).
//
//  All fictional — no real landlords, chains, or places.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away choice reused on every stage (you can always walk from a lease).
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'Walk away',
  result: 'You slide the keys back across the desk and leave. There is always another corner.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'offer',
    title: 'The Offer',
    speaker: 'protagonist',
    text: 'Bianca Thorne doesn’t shake hands — she gestures at the empty corner unit like it’s a cathedral. "Thorne Plaza. Best footfall in the district. I don’t lease this space to just anyone. But you… you have the look of an anchor tenant."',
    choices: [
      {
        id: 'offer_flatter',
        label: '“An anchor tenant. I like the sound of that.”',
        result: 'Bianca smiles. She’s decided you’re easy.',
        effects: { confidence: 2, founderTrust: 2, dueDiligence: -1, risk: 1 },
        next: 'location',
      },
      {
        id: 'offer_numbers',
        label: '“Footfall is a word. Show me the counter data.”',
        result: 'She blinks. The word "data" was not in the script.',
        effects: { dueDiligence: 2, valuationDiscipline: 1, founderTrust: -1 },
        next: 'location',
        roleBoost: 'buyer',
      },
      {
        id: 'offer_cool',
        label: '“It’s been empty six months. Why?”',
        result: '"Renovations," she says, a half-beat too fast. Leverage tilts your way.',
        effects: { leverage: 2, dueDiligence: 1, founderTrust: -1 },
        next: 'location',
      },
      walk('offer'),
    ],
  },
  {
    id: 'location',
    title: 'Location Scout',
    speaker: 'narrator',
    text: 'You walk the block. The morning crowd is real — but half of it pours out of a transit exit that a city notice says is closing for a two-year rebuild. Bianca’s "best footfall in the district" has an expiry date.',
    choices: [
      {
        id: 'loc_ignore',
        label: 'Crowds are crowds. Trust the energy of the place.',
        result: 'Vibes are not a lease term. But they feel great.',
        effects: { confidence: 2, dueDiligence: -2, risk: 2 },
        next: 'terms',
      },
      {
        id: 'loc_clock',
        label: 'Count heads before and after the transit rush. Twice.',
        result: 'Two-thirds of the traffic is the station. Noted, quietly.',
        effects: { dueDiligence: 3, leverage: 2, risk: -1 },
        next: 'terms',
        roleBoost: 'operator',
      },
      {
        id: 'loc_neighbors',
        label: 'Ask the neighbouring shopkeepers how business really is.',
        result: '"Slow since the arcade closed," one mutters. Useful.',
        effects: { dueDiligence: 2, leverage: 1, confidence: -1 },
        next: 'terms',
      },
      walk('location'),
    ],
  },
  {
    id: 'terms',
    title: 'The Terms',
    speaker: 'protagonist',
    text: '"Ten-year term," Bianca says, sliding a sheet across. "Rent escalates eight percent a year — standard. And a modest percentage of your gross, of course. For the privilege of the address."',
    choices: [
      {
        id: 'terms_accept',
        label: '“Eight percent a year sounds standard enough.”',
        result: 'Eight percent compounding is not standard. It’s a mortgage on her retirement.',
        effects: { valuationDiscipline: -2, risk: 2, founderTrust: 1 },
        next: 'pressure',
      },
      {
        id: 'terms_push',
        label: '“Three percent, capped. And no percentage of gross.”',
        result: 'She clutches the sheet like you insulted her ancestors. Good.',
        effects: { valuationDiscipline: 3, leverage: 2, founderTrust: -1 },
        next: 'pressure',
        roleBoost: 'closer',
      },
      {
        id: 'terms_short',
        label: '“Five-year term with a break clause, or no deal.”',
        result: 'A shorter leash means her risk, not yours. She hates that.',
        effects: { valuationDiscipline: 2, dueDiligence: 1, risk: -1 },
        next: 'pressure',
        roleBoost: 'buyer',
      },
      walk('terms'),
    ],
  },
  {
    id: 'pressure',
    title: 'Another Tenant',
    speaker: 'protagonist',
    text: 'Her phone lights up; she lets you see it. "That’s a coffee chain. National. They’ll sign tonight for full asking." She sets the phone down, face-up. "I’d rather it be you. But I won’t wait."',
    choices: [
      {
        id: 'prs_panic',
        label: '“Okay — I’ll match the asking. Just don’t give it away.”',
        result: 'You handed her the whole negotiation in one sentence.',
        effects: { risk: 2, leverage: -2, valuationDiscipline: -1, founderTrust: 1 },
        next: 'fineprint',
      },
      {
        id: 'prs_callbluff',
        label: '“A national chain wants a shrinking corner? Show me the letter of intent.”',
        result: 'The phone goes back in the drawer. "…They’re still deciding." The pressure dies.',
        effects: { leverage: 3, dueDiligence: 1, founderTrust: -1 },
        next: 'fineprint',
        roleBoost: 'closer',
      },
      {
        id: 'prs_walkpose',
        label: '“Then sign them. I’ll wish you both luck.” (start to leave)',
        result: 'You reach the door before she names a better number. Discipline pays.',
        effects: { leverage: 2, valuationDiscipline: 2, risk: -1 },
        next: 'fineprint',
      },
      walk('pressure'),
    ],
  },
  {
    id: 'fineprint',
    title: 'The Fine Print',
    speaker: 'narrator',
    text: 'Page nine, in grey type: a demolition clause lets the landlord terminate with 60 days’ notice "for redevelopment." Page eleven: the percentage-rent has no ceiling. Sign as-is and you could pour a fortune into a fit-out she can evict on a whim.',
    choices: [
      {
        id: 'fp_ignore',
        label: 'Every lease has scary clauses nobody ever enforces.',
        result: 'People say that right up until the day it’s enforced.',
        effects: { confidence: 1, risk: 3, dueDiligence: -1 },
        next: 'counter',
      },
      {
        id: 'fp_strike',
        label: 'Circle both clauses in red. “These go, or I do.”',
        result: 'Bianca’s smile finally slips. "The demolition clause is… negotiable." Now you’re protected.',
        effects: { dueDiligence: 3, valuationDiscipline: 2, risk: -3, leverage: 2, founderTrust: -1 },
        next: 'counter',
        roleBoost: 'operator',
      },
      {
        id: 'fp_cap',
        label: 'Leave the clause, but cap the percentage-rent and demand a fit-out payout on early termination.',
        result: 'A clean trade — if she evicts you, she pays for the privilege.',
        effects: { valuationDiscipline: 2, dueDiligence: 1, risk: -1 },
        next: 'counter',
        roleBoost: 'buyer',
      },
      walk('fineprint'),
    ],
  },
  {
    id: 'counter',
    title: 'The Counter',
    speaker: 'protagonist',
    text: 'Bianca leans back, recalculating. "You’re more work than the coffee people. Make me a number I can live with, and mean it — I don’t re-trade twice."',
    choices: [
      {
        id: 'ctr_lowball',
        label: 'Anchor low: half her asking, three-percent cap, break clause at year three.',
        result: 'She groans theatrically and meets you near the middle. That’s a win.',
        effects: { leverage: 2, valuationDiscipline: 3, founderTrust: -1 },
        next: 'decision',
        roleBoost: 'closer',
      },
      {
        id: 'ctr_fair',
        label: 'Anchor on the real footfall math and let the spreadsheet argue.',
        result: '"Fine," she says, not looking at it. She can’t argue with the station closure.',
        effects: { valuationDiscipline: 2, dueDiligence: 2, leverage: 1 },
        next: 'decision',
        roleBoost: 'buyer',
      },
      {
        id: 'ctr_cave',
        label: 'Split the difference to keep her sweet — the address is worth it.',
        result: 'She’s delighted. Your accountant, less so.',
        effects: { founderTrust: 2, valuationDiscipline: -1, risk: 1 },
        next: 'decision',
      },
      walk('counter'),
    ],
  },
  {
    id: 'decision',
    title: 'Sign or Walk',
    speaker: 'narrator',
    text: 'The revised lease sits between you, pen on top. Bianca watches with the stillness of someone who has already spent the deposit. Prime corner, expiring crowd, whatever protections you fought for. In or out?',
    choices: [
      {
        // 'invest' is the framework's terminal "commit to the deal" token (shared with the
        // Angel story) — it resolves the story to an outcome band, it is not a stage id.
        id: 'dec_sign',
        label: 'Sign. Plant the flag on the corner.',
        effects: { confidence: 1 },
        next: 'invest',
      },
      {
        id: 'dec_hedge',
        label: 'Sign — but only the short term with the break clause. Test it for a year.',
        result: 'One foot in, an exit already drawn. Bianca frowns, which means it’s smart.',
        effects: { valuationDiscipline: 2, risk: -1, confidence: -1 },
        next: 'invest',
        roleBoost: 'buyer',
      },
      {
        id: 'dec_walk',
        label: 'Cap the pen. “Not this corner. Good luck, Bianca.”',
        effects: {},
        next: 'walkaway',
        walkAway: true,
      },
    ],
  },
]

export const LEASE_SHOWDOWN: MogulStory = {
  id: 'lease_thorne_plaza',
  industryId: 'retail',
  title: 'The Lease',
  hook: 'A landlord wants to sign you to a flagship lease.',
  subject: 'Thorne Plaza',
  protagonist: 'Bianca Thorne',
  length: 'short',
  firstStage: 'offer',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: 'Anchor Tenant',
      line: 'Below-market rent, a capped percentage, and a break clause with teeth. You didn’t rent a shop — you licensed the busiest corner in the district on your terms.',
    },
    good: {
      title: 'Prime Corner',
      line: 'A fair lease on a strong pitch. You’ll pay a small premium for the address, and the footfall earns it back. Retail hums for a while.',
    },
    neutral: {
      title: 'You Passed',
      line: 'You let the corner go. No fit-out, no risk, no regrets — the right storefront will come along, and you’ll know it when the numbers work.',
    },
    bad: {
      title: 'Locked In',
      line: 'You signed into an uncapped percentage-rent and a demolition clause. The crowd thinned, the rent didn’t, and the fit-out money is walking out the door.',
    },
  },
}
