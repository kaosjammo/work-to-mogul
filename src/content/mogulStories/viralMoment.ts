// ============================================================
//  Mogul Story — "Gone Viral" (Food). Overnight, a clip of your diner's signature dish
//  explodes and a queue wraps the block. Fame is a double-edged knife: ride it with grace
//  and it makes the location; chase it greedily and the backlash (or the burnout, or the
//  supply crunch) sinks it. A punchy 5-stage `short` crisis-opportunity that reuses the
//  shared negotiation scores + generic resolution (a graceful finish → a timed Food profit
//  boost; a greedy fumble → a Food dip; stay quiet and let it fade → neutral).
//
//  All fictional — no real influencers, critics, or places.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away choice reused on every stage (you can always just let the moment pass).
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'Let it blow over',
  result: 'You keep your head down and let the internet move on, like it always does.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'spike',
    title: 'The Spike',
    speaker: 'narrator',
    text: 'At 6:04am a fifteen-second clip of your diner’s messy, glorious "Copper Melt" hits eleven million views. By the time you unlock your phone, the queue is around the block and a stranger is livestreaming your dumpster. Margo Vane — the influencer who started it — DMs: "You’re welcome. Let’s talk."',
    choices: [
      {
        id: 'spike_panic',
        label: 'Post a frantic "WE’RE OVERWHELMED PLEASE BE PATIENT" to every channel.',
        result: 'Fear reads as fear online. The comments smell blood.',
        effects: { confidence: -1, risk: 2, founderTrust: -1 },
        next: 'margo',
      },
      {
        id: 'spike_assess',
        label: 'Say nothing publicly yet. Count the queue, the stock, the staff on shift.',
        result: 'Forty-minute wait, two hours of patties left, three exhausted cooks. Now you know the board.',
        effects: { dueDiligence: 3, leverage: 1, risk: -1 },
        next: 'margo',
        roleBoost: 'operator',
      },
      {
        id: 'spike_ride',
        label: 'Lean all the way in — pin the clip, blast "COME GET THE COPPER MELT 🔥".',
        result: 'The crowd doubles. So does everything that can go wrong.',
        effects: { confidence: 2, risk: 3, dueDiligence: -1 },
        next: 'margo',
      },
      walk('spike'),
    ],
  },
  {
    id: 'margo',
    title: 'The Influencer',
    speaker: 'protagonist',
    text: 'Margo Vane sweeps in past the queue like she owns it. "Here’s the deal. I made you. I can make you a chain — or I can post the follow-up where the magic fades. I want a cut, a booth with my name on it, and exclusives. Say yes before the algorithm gets bored."',
    choices: [
      {
        id: 'margo_cave',
        label: '“Whatever you want — just don’t post anything bad.”',
        result: 'You handed a stranger the keys to your kitchen out of fear. She grins.',
        effects: { leverage: -3, risk: 2, valuationDiscipline: -2, founderTrust: 1 },
        next: 'supply',
      },
      {
        id: 'margo_terms',
        label: '“A fair collab, yes. Ownership of my diner, no. Name your realistic number.”',
        result: 'She respects the line more than she’d admit. The tone shifts to business.',
        effects: { leverage: 2, valuationDiscipline: 2, dueDiligence: 1 },
        next: 'supply',
        roleBoost: 'closer',
      },
      {
        id: 'margo_pass',
        label: '“The clip’s already out. I don’t need you to stay viral — I need to not burn the place down today.”',
        result: 'Calling the leverage bluff stings her, but it’s true. You keep control.',
        effects: { leverage: 3, valuationDiscipline: 1, founderTrust: -1 },
        next: 'supply',
      },
      walk('margo'),
    ],
  },
  {
    id: 'supply',
    title: 'The Crunch',
    speaker: 'narrator',
    text: 'The kitchen is 40 minutes from running out of the one thing everyone queued for. Your supplier can rush a delivery — at triple cost — or you can stretch what you have. The crowd filming every plate will absolutely notice if the Copper Melt gets… smaller.',
    choices: [
      {
        id: 'sup_cutcorners',
        label: 'Shrink the portion and thin the sauce. Nobody’ll clock it.',
        result: 'Three people already have. "Shrinkflation" is trending by lunch.',
        effects: { risk: 3, founderTrust: -2, valuationDiscipline: 1 },
        next: 'backlash',
      },
      {
        id: 'sup_honest',
        label: 'Cap sales at what you can make RIGHT, and say so, openly, with a smile.',
        result: '"Sold out by 2, made properly." Scarcity + honesty is its own hype.',
        effects: { founderTrust: 3, dueDiligence: 2, risk: -2 },
        next: 'backlash',
        roleBoost: 'operator',
      },
      {
        id: 'sup_rush',
        label: 'Pay triple for the rush delivery and keep the line moving.',
        result: 'Margins take a hit, but the machine keeps humming. Defensible.',
        effects: { valuationDiscipline: -1, dueDiligence: 1, risk: -1 },
        next: 'backlash',
        roleBoost: 'buyer',
      },
      walk('supply'),
    ],
  },
  {
    id: 'backlash',
    title: 'The Backlash',
    speaker: 'protagonist',
    text: 'By afternoon a rival account posts: "Overhyped, overpriced, and I found a HAIR." No proof, huge reach. Margo texts, delighted at the drama: "This is content GOLD. Fire back at them?" The whole timeline is watching how you handle it.',
    choices: [
      {
        id: 'bk_warring',
        label: 'Clap back hard — quote-post them and let your fans swarm.',
        result: 'A public brawl. Engagement spikes; your brand becomes "that place that fights online."',
        effects: { risk: 3, confidence: 1, founderTrust: -2 },
        next: 'decision',
      },
      {
        id: 'bk_grace',
        label: 'Reply once, kindly: “Come back on us — we’ll make it right in person.”',
        result: 'Grace under fire ages better than any dunk. The mood turns your way.',
        effects: { founderTrust: 3, leverage: 2, risk: -2 },
        next: 'decision',
        roleBoost: 'closer',
      },
      {
        id: 'bk_receipts',
        label: 'Calmly post the kitchen cam + hairnet policy. Let the facts sit there.',
        result: 'Receipts, no rage. The accusation quietly deflates.',
        effects: { dueDiligence: 3, risk: -2, leverage: 1 },
        next: 'decision',
        roleBoost: 'operator',
      },
      walk('backlash'),
    ],
  },
  {
    id: 'decision',
    title: 'Ride or Fade',
    speaker: 'narrator',
    text: 'The wave is cresting. You can lock in what the moment built — a real, repeatable thing — or squeeze it for every last dollar before it breaks, or simply let it recede and go back to being a great little diner. What’s the play?',
    choices: [
      {
        id: 'dec_ride',
        label: 'Turn the moment into a keeper: a signature the regulars will love long after the hype.',
        effects: { confidence: 1 },
        next: 'invest',
      },
      {
        id: 'dec_milk',
        label: 'Cash in NOW — surge prices, flimsy merch, a limited "drop" you can’t deliver.',
        result: 'You’ll bank a fast weekend and torch the goodwill that made it. Classic.',
        effects: { valuationDiscipline: -2, risk: 3, founderTrust: -2 },
        next: 'invest',
      },
      {
        id: 'dec_fade',
        label: 'Let it fade gracefully. Thank everyone, keep the recipe, don’t chase the dragon.',
        effects: {},
        next: 'walkaway',
        walkAway: true,
      },
    ],
  },
]

export const VIRAL_MOMENT: MogulStory = {
  id: 'viral_copper_spoon',
  industryId: 'food',
  icon: '📱',
  title: 'Gone Viral',
  hook: 'An influencer just made your diner blow up overnight.',
  subject: 'Gone Viral',
  protagonist: 'Margo Vane',
  length: 'short',
  firstStage: 'spike',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: 'A Legend Is Born',
      line: 'You rode the wave without letting it ride you — honest scarcity, grace under fire, a signature dish that outlives the algorithm. The queue never fully went away, and the regulars are prouder than ever. Food is on fire (the good kind).',
    },
    good: {
      title: 'Rode the Wave',
      line: 'You caught the moment, kept your head, and came out with a bump in name and business. Not every choice was perfect, but the diner’s reputation grew — and Food hums for a while.',
    },
    neutral: {
      title: 'It Faded',
      line: 'You let the internet do what it does and move on. No windfall, no scars — just a quiet week and the same good diner you had before. Sometimes not chasing the dragon is the whole win.',
    },
    bad: {
      title: 'Flash in the Pan',
      line: 'You squeezed the moment dry — shrunk the portions, picked fights, cashed in on merch you couldn’t deliver. The clip that made you became the case study in how to blow it. Food takes the hit.',
    },
  },
}
