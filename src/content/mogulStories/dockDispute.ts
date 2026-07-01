// ============================================================
//  Mogul Story — "The Walkout" (Logistics). Peak shipping season, and your dockworkers
//  are threatening to strike. You have one night to read the real grievance (it's rarely
//  only about pay), hold the budget without holding the line too hard, and keep the cargo
//  moving — settle it right and the whole operation runs smoother than before; fumble it
//  and the pier goes quiet at the worst possible time. An 8-stage `standard` labour
//  negotiation on the shared runtime (a fair settlement → a timed Logistics profit boost;
//  a strike → a Logistics dip; let them walk → neutral).
//
//  All fictional — no real unions, ports, or people.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away choice reused on every stage (you can always refuse to negotiate).
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'Refuse to negotiate',
  result: 'You decide this isn’t a conversation you’re willing to have. The stewards read that loud and clear.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'threat',
    title: 'The Threat',
    speaker: 'narrator',
    text: 'Peak season. Forty containers a day, three ships in the roads, and a note taped to your office door: the dock crew votes on a walkout at dawn. Miss this window and the penalties from your shippers will make a strike look cheap. Sal Rourke, the crew’s steward, is waiting by the cranes with her arms folded.',
    choices: [
      {
        id: 'thr_threaten',
        label: 'Remind them there are plenty of people who’d want these jobs.',
        result: 'You threatened your own crew at peak season. Sal’s jaw sets like concrete.',
        effects: { founderTrust: -3, risk: 3, leverage: -1 },
        next: 'grievance',
      },
      {
        id: 'thr_listen',
        label: 'Walk down to the cranes. “Talk to me, Sal. Before anyone votes.”',
        result: 'Showing up in person, at the cranes, on their turf. Sal notices.',
        effects: { founderTrust: 2, dueDiligence: 1, risk: -1 },
        next: 'grievance',
        roleBoost: 'operator',
      },
      {
        id: 'thr_facts',
        label: 'Pull the shift logs, the injury reports, and the contract before you say a word.',
        result: 'You arrive knowing exactly how many doubles they’ve pulled. That matters.',
        effects: { dueDiligence: 3, leverage: 1 },
        next: 'grievance',
        roleBoost: 'operator',
      },
      walk('threat'),
    ],
  },
  {
    id: 'grievance',
    title: 'The Grievance',
    speaker: 'protagonist',
    text: '"It’s not just the money," Sal says, "though the money’s insulting. It’s the mandatory doubles, the busted safety winch on Pier 9 nobody’s fixed, and being treated like forklifts that talk. My people are exhausted and they’re done being invisible."',
    choices: [
      {
        id: 'grv_dismiss',
        label: '“Everyone’s tired at peak season. That’s the job.”',
        result: 'You just told exhausted people their exhaustion is the job. Wrong answer.',
        effects: { founderTrust: -3, risk: 2 },
        next: 'books',
      },
      {
        id: 'grv_safety',
        label: '“The busted winch — that’s a real one. That gets fixed regardless of the vote.”',
        result: 'Conceding the safety point for free, immediately, resets the whole room.',
        effects: { founderTrust: 3, dueDiligence: 2, risk: -2 },
        next: 'books',
        roleBoost: 'closer',
      },
      {
        id: 'grv_probe',
        label: '“If the pay were fixed tomorrow, would you still walk?”',
        result: '"…Probably not. But it isn’t just the pay, and you know it." Now you know the shape of it.',
        effects: { dueDiligence: 3, leverage: 1 },
        next: 'books',
      },
      walk('grievance'),
    ],
  },
  {
    id: 'books',
    title: 'The Books',
    speaker: 'narrator',
    text: 'Back in the office, the numbers are stubborn. A full pay bump across the crew, at peak volume, would eat the season’s margin. But the penalties for a stalled dock would eat more — and the safety fix is cheap, and respect is free. The expensive demand and the cheap ones aren’t the same lever.',
    choices: [
      {
        id: 'bks_cave',
        label: 'Just meet the full pay demand. Make the problem go away tonight.',
        result: 'You bought peace at a price you can’t repeat, and set a number every crew will now expect.',
        effects: { valuationDiscipline: -3, risk: 1, founderTrust: 1 },
        next: 'inbound',
      },
      {
        id: 'bks_unbundle',
        label: 'Separate the cheap wins (safety, scheduling, respect) from the expensive one (across-the-board pay).',
        result: 'Solve four of the five for pennies, and the fifth stops being a hill to die on.',
        effects: { valuationDiscipline: 3, dueDiligence: 2, leverage: 1 },
        next: 'inbound',
        roleBoost: 'buyer',
      },
      {
        id: 'bks_lowball',
        label: 'Offer the bare minimum and dare them to strike at peak.',
        result: 'Daring exhausted people at their moment of maximum leverage. Bold. Reckless.',
        effects: { risk: 3, leverage: -2, founderTrust: -2 },
        next: 'inbound',
      },
      walk('books'),
    ],
  },
  {
    id: 'inbound',
    title: 'Ship Inbound',
    speaker: 'narrator',
    text: 'A horn cuts the night: the first of three ships is early, sliding into the roads six hours ahead of schedule. If the cranes aren’t crewed by dawn, it sits in the harbour racking demurrage by the hour — and the shippers are already watching their trackers.',
    choices: [
      {
        id: 'inb_panic',
        label: 'Fold on everything, fast — you cannot afford that ship waiting.',
        result: 'Sal sees the horn spook you. Your leverage sails in with the ship.',
        effects: { leverage: -3, valuationDiscipline: -2, risk: 1 },
        next: 'wedge',
      },
      {
        id: 'inb_transparent',
        label: '“Here’s the ship, here’s the clock, here’s what I can actually do. Help me crew it and I’ll show you the books.”',
        result: 'Radical honesty at 3am. Sal blinks — nobody shows dockworkers the books.',
        effects: { founderTrust: 3, dueDiligence: 1, leverage: 1 },
        next: 'wedge',
        roleBoost: 'closer',
      },
      {
        id: 'inb_contingency',
        label: 'Quietly line up a skeleton crew as a backstop, then keep negotiating in good faith.',
        result: 'A safety net you don’t brandish. It steadies your voice without threatening theirs.',
        effects: { leverage: 2, valuationDiscipline: 1, risk: -1 },
        next: 'wedge',
        roleBoost: 'operator',
      },
      walk('inbound'),
    ],
  },
  {
    id: 'wedge',
    title: 'The Wedge',
    speaker: 'narrator',
    text: 'Your ops manager pulls you aside with a grin: a few senior hands are wavering. Peel them off with a private bonus, he says, and the walkout collapses without you giving the crew a thing. It would work. It would also be the last time anyone on this dock trusts a word you say.',
    choices: [
      {
        id: 'wdg_split',
        label: 'Do it. Buy off the ringleaders quietly and break the vote.',
        result: 'It works tonight. It poisons the well for every season after.',
        effects: { leverage: 1, founderTrust: -3, risk: 3 },
        next: 'offer',
      },
      {
        id: 'wdg_refuse',
        label: '“No. Whatever we do, we do it with the whole crew, in the open.”',
        result: 'You turn down the cheap trick. Sal will never know you did — but you will.',
        effects: { founderTrust: 2, valuationDiscipline: 1, risk: -2 },
        next: 'offer',
        roleBoost: 'closer',
      },
      {
        id: 'wdg_tell',
        label: 'Tell Sal you were offered the play — and that you said no.',
        result: 'Handing her the knife you chose not to use. Trust, banked at the exact right moment.',
        effects: { founderTrust: 3, leverage: 2, dueDiligence: 1, risk: -1 },
        next: 'offer',
      },
      walk('wedge'),
    ],
  },
  {
    id: 'offer',
    title: 'The Offer',
    speaker: 'you',
    text: 'Dawn is an hour out. Time to put a real number on the table — a package the crew can vote yes to and you can actually sustain past this season.',
    choices: [
      {
        id: 'off_overpay',
        label: 'Big across-the-board raise, damn the margin. Make it impossible to refuse.',
        result: 'They’ll take it. You’ll be renegotiating from a worse spot next season, forever.',
        effects: { valuationDiscipline: -3, confidence: 1, risk: 1 },
        next: 'brink',
      },
      {
        id: 'off_package',
        label: 'Fix the winch tonight, end mandatory doubles, a fair modest bump, and a seat for Sal on scheduling.',
        result: 'Money you can carry, changes they can feel. A package with a spine.',
        effects: { valuationDiscipline: 2, dueDiligence: 2, founderTrust: 2 },
        next: 'brink',
        roleBoost: 'buyer',
      },
      {
        id: 'off_profit',
        label: 'Modest base bump + a peak-season bonus tied to throughput, so a good season pays them too.',
        result: 'Skin in the game on both sides. Sal reads it twice, then nods slowly.',
        effects: { valuationDiscipline: 3, leverage: 1, founderTrust: 1 },
        next: 'brink',
        roleBoost: 'closer',
      },
      walk('offer'),
    ],
  },
  {
    id: 'brink',
    title: 'The Brink',
    speaker: 'protagonist',
    text: 'Sal takes the offer to the crew, huddled under the sodium lights. You can’t hear the words, only the tone — rising, arguing, then quieter. She walks back. "It’s close. They want to know if this is real, or just something that evaporates the day the ships stop coming."',
    choices: [
      {
        id: 'brk_pressure',
        label: '“The ship’s waiting. Tell them to decide now or the offer drops.”',
        result: 'A gun to the table at the last second. The good will you built cracks.',
        effects: { risk: 3, founderTrust: -2, leverage: -1 },
        next: 'decision',
      },
      {
        id: 'brk_writing',
        label: '“It’s real. Put my name on it, in writing, with a review date — so it survives me.”',
        result: 'A promise with a signature and a follow-up. That’s what "real" sounds like.',
        effects: { valuationDiscipline: 2, dueDiligence: 1, founderTrust: 2, risk: -2 },
        next: 'decision',
        roleBoost: 'operator',
      },
      {
        id: 'brk_respect',
        label: '“Whatever they decide, the winch gets fixed and nobody gets punished for the vote.”',
        result: 'Taking retaliation off the table, unprompted, changes the whole calculus.',
        effects: { founderTrust: 3, leverage: 1, risk: -1 },
        next: 'decision',
      },
      walk('brink'),
    ],
  },
  {
    id: 'decision',
    title: 'Settle or Strike',
    speaker: 'narrator',
    text: 'The crew is one show of hands from either crewing the cranes or walking into the dawn. Sal looks at you, waiting to see what you do in the last thirty seconds. Close it, hold your line, or let the pier go quiet?',
    choices: [
      {
        id: 'dec_settle',
        label: 'Shake Sal’s hand on the package. Get the cranes turning.',
        effects: { confidence: 1 },
        next: 'invest',
      },
      {
        id: 'dec_partner',
        label: 'Settle — and make Sal the standing liaison, so next season starts as a conversation, not a threat.',
        result: 'You didn’t just avoid a strike; you built the thing that prevents the next one.',
        effects: { valuationDiscipline: 1, dueDiligence: 1, founderTrust: 2, risk: -1 },
        next: 'invest',
        roleBoost: 'closer',
      },
      {
        id: 'dec_walk',
        label: '“I can’t meet that and mean it. I won’t sign something I can’t keep.”',
        effects: {},
        next: 'walkaway',
        walkAway: true,
      },
    ],
  },
]

export const DOCK_DISPUTE: MogulStory = {
  id: 'walkout_pier_nine',
  industryId: 'logistics',
  icon: '🏗️',
  title: 'The Walkout',
  hook: 'Your dockworkers are threatening to strike at peak season.',
  subject: 'Pier 9',
  protagonist: 'Sal Rourke',
  length: 'standard',
  firstStage: 'threat',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: 'The Dock Runs Deep',
      line: 'You unbundled the real grievances from the expensive one, fixed the winch, shared the books, and refused the cheap trick. The crew crewed the cranes by dawn — and now the whole operation runs smoother, safer, and more loyal than before. Logistics is humming.',
    },
    good: {
      title: 'Settled',
      line: 'A fair package kept the cargo moving and the crew on side. Not every move was perfect, but the ships got worked and nobody’s planning the next walkout. Logistics keeps its rhythm.',
    },
    neutral: {
      title: 'They Walked',
      line: 'You couldn’t sign something you couldn’t keep, and the crew went into the dawn. It costs you the peak, but you didn’t make a promise you’d break — and the ones who walked would take your call next season.',
    },
    bad: {
      title: 'The Pier Went Quiet',
      line: 'You threatened, split the crew, or lowballed at the worst moment — and the dock struck anyway, hard. Ships sit racking demurrage, the shippers are furious, and the trust you torched will take seasons to rebuild. Logistics grinds.',
    },
  },
}
