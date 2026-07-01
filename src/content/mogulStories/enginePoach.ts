// ============================================================
//  Mogul Story — "The Poach" (Tech). A rival lab is trying to hire away your star
//  engineer; you have one conversation to keep them — by reading WHY they're really
//  leaving, not just out-bidding. An 8-stage `standard` retention drama that reuses the
//  shared negotiation scores + generic resolution (a strong finish → a timed Tech profit
//  boost; a bidding-war blunder → a Tech dip; walk away → they leave gracefully, neutral).
//
//  All fictional — no real people, labs, or companies.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away choice reused on every stage (you can always let them go).
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'Let it go',
  result: 'You decide not to fight for this one. Some people are already halfway out the door.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'warning',
    title: 'The Rumour',
    speaker: 'narrator',
    text: 'Kit Nakamura — the engineer who quietly rewrote your whole billing system over one weekend — has been showing up late, camera off, "in meetings." Then your CTO forwards you a screenshot: a recruiter from Vireo Labs, sliding into Kit’s inbox with a 🚀 and the word "founding."',
    choices: [
      {
        id: 'warn_ignore',
        label: 'Engineers get poached weekly. It’ll blow over.',
        result: 'Denial is cheap. Replacing Kit would not be.',
        effects: { confidence: 2, dueDiligence: -2, risk: 2 },
        next: 'confront',
      },
      {
        id: 'warn_prepare',
        label: 'Pull Kit’s comp, tenure, and last three project wins before you say a word.',
        result: 'You walk in with facts instead of feelings. Good.',
        effects: { dueDiligence: 2, valuationDiscipline: 1, leverage: 1 },
        next: 'confront',
        roleBoost: 'operator',
      },
      {
        id: 'warn_grapevine',
        label: 'Quietly ask the team how Kit’s really been doing.',
        result: '"Burned out since the migration," someone says. "Nobody said thanks." Noted.',
        effects: { dueDiligence: 2, founderTrust: 1, risk: -1 },
        next: 'confront',
      },
      walk('warning'),
    ],
  },
  {
    id: 'confront',
    title: 'The Conversation',
    speaker: 'protagonist',
    text: 'You catch Kit by the good coffee machine. They don’t dodge it. "Yeah. Vireo made an offer. It’s… a lot. I wasn’t going to bring it up until I’d decided." They look tired, not triumphant.',
    choices: [
      {
        id: 'con_hardball',
        label: '“After everything we’ve invested in you? That feels disloyal.”',
        result: 'Guilt-tripping a burned-out person. They fold their arms. Wrong move.',
        effects: { founderTrust: -3, risk: 2, leverage: -1 },
        next: 'offer',
      },
      {
        id: 'con_open',
        label: '“I’m glad you told me. Walk me through it — no pressure.”',
        result: 'Kit exhales. The wall comes down a little.',
        effects: { founderTrust: 3, dueDiligence: 1, risk: -1 },
        next: 'offer',
        roleBoost: 'closer',
      },
      {
        id: 'con_cool',
        label: '“What would it actually take to keep you?”',
        result: '"Honestly? I’m not sure it’s about money." Interesting.',
        effects: { dueDiligence: 2, leverage: 1 },
        next: 'offer',
      },
      walk('confront'),
    ],
  },
  {
    id: 'offer',
    title: 'The Offer',
    speaker: 'protagonist',
    text: '"They’re offering forty percent more," Kit says, "a staff title, and a team of my own. And equity that could be worth… nothing, or a house." They slide their phone over. The number is real. So is the risk they’re not telling you everything.',
    choices: [
      {
        id: 'off_match',
        label: '“Done. We’ll beat forty percent right now.”',
        result: 'You just started a bidding war you can’t obviously win. And you still don’t know why they’re leaving.',
        effects: { valuationDiscipline: -3, risk: 3, founderTrust: 1 },
        next: 'dig',
      },
      {
        id: 'off_probe',
        label: '“Equity that could be nothing. You’ve read enough cap tables to know that.”',
        result: 'Kit almost smiles. "…Yeah. The number’s seductive." Leverage shifts back.',
        effects: { leverage: 2, dueDiligence: 1, valuationDiscipline: 1 },
        next: 'dig',
        roleBoost: 'buyer',
      },
      {
        id: 'off_title',
        label: '“Forget the money a second. Is it the title? The team?”',
        result: 'They go quiet. You’re getting warmer.',
        effects: { dueDiligence: 2, founderTrust: 1 },
        next: 'dig',
      },
      walk('offer'),
    ],
  },
  {
    id: 'dig',
    title: 'The Real Reason',
    speaker: 'you',
    text: 'You resist the urge to talk about salary bands. Instead you ask the question that actually matters: “Kit — if the money were identical, would you still be leaving?”',
    choices: [
      {
        id: 'dig_assume',
        label: 'Assume it’s money anyway and start drafting a raise.',
        result: 'You answered your own question instead of theirs. They notice.',
        effects: { dueDiligence: -2, risk: 2, founderTrust: -1 },
        next: 'reason',
      },
      {
        id: 'dig_listen',
        label: 'Say nothing. Let the silence do the work.',
        result: 'Ten long seconds. Then it comes out.',
        effects: { dueDiligence: 3, founderTrust: 2, risk: -1 },
        next: 'reason',
        roleBoost: 'operator',
      },
      {
        id: 'dig_own',
        label: '“And be honest if the answer is partly me.”',
        result: 'They blink — they didn’t expect you to open that door.',
        effects: { founderTrust: 2, dueDiligence: 1 },
        next: 'reason',
      },
      walk('dig'),
    ],
  },
  {
    id: 'reason',
    title: 'The Truth',
    speaker: 'protagonist',
    text: '"I shipped the biggest thing this company has and then got handed more tickets," Kit says. "No growth. No say in what we build next. Vireo’s offer isn’t really about money. It’s that someone finally acted like what I do matters."',
    choices: [
      {
        id: 'rsn_dismiss',
        label: '“Everyone feels underappreciated sometimes. That’s just work.”',
        result: 'You just proved their point out loud. Ouch.',
        effects: { founderTrust: -3, risk: 3 },
        next: 'counter',
      },
      {
        id: 'rsn_growth',
        label: '“So the fix isn’t a raise. It’s a real path — architecture lead, a say in the roadmap.”',
        result: 'Kit sits up. For the first time, they look like they might stay.',
        effects: { dueDiligence: 2, valuationDiscipline: 2, founderTrust: 2, risk: -2 },
        next: 'counter',
        roleBoost: 'closer',
      },
      {
        id: 'rsn_credit',
        label: '“You’re right — we let that win go unmarked. That’s on me, and I’ll fix it publicly.”',
        result: 'Owning it lands harder than any number could.',
        effects: { founderTrust: 3, dueDiligence: 1, risk: -1 },
        next: 'counter',
      },
      walk('reason'),
    ],
  },
  {
    id: 'counter',
    title: 'The Counter',
    speaker: 'you',
    text: 'Now you build the offer that keeps them. You have real levers — a fair bump, ownership of the next big system, a title that means something — and a temptation to just throw money at it and hope.',
    choices: [
      {
        id: 'ctr_overpay',
        label: 'Blow past Vireo’s number. Whatever it takes tonight.',
        result: 'Now every engineer who hears about it will want the same. Precedent set.',
        effects: { valuationDiscipline: -3, risk: 2, confidence: 1 },
        next: 'bidding',
      },
      {
        id: 'ctr_package',
        label: 'A fair raise + architecture lead + a public retro on the migration win.',
        result: 'Money you can afford, meaning you can’t fake. A clean package.',
        effects: { valuationDiscipline: 2, dueDiligence: 2, founderTrust: 1 },
        next: 'bidding',
        roleBoost: 'buyer',
      },
      {
        id: 'ctr_growth',
        label: 'Under-match on cash, over-deliver on ownership and growth.',
        result: 'A bet that they’re telling the truth about what matters. If they are, it’s a steal.',
        effects: { valuationDiscipline: 3, leverage: 1, risk: -1 },
        next: 'bidding',
        roleBoost: 'closer',
      },
      walk('counter'),
    ],
  },
  {
    id: 'bidding',
    title: 'The Bidding War',
    speaker: 'narrator',
    text: 'Kit texts Vireo out of courtesy. Their recruiter responds in ninety seconds: they’ll raise again, and add a signing bonus. The number on the table is now genuinely silly. Kit watches your face to see if you’ll chase it.',
    choices: [
      {
        id: 'bid_chase',
        label: 'Chase it. Match the new number too.',
        result: 'You’re negotiating against a lab that doesn’t have to make payroll. This ends badly.',
        effects: { risk: 3, valuationDiscipline: -2, leverage: -2 },
        next: 'decision',
      },
      {
        id: 'bid_hold',
        label: '“I won’t out-bid them, and you’d be suspicious if I tried. My offer is the real one.”',
        result: 'Discipline reads as confidence. Kit nods slowly.',
        effects: { valuationDiscipline: 3, leverage: 2, founderTrust: 1 },
        next: 'decision',
        roleBoost: 'buyer',
      },
      {
        id: 'bid_frame',
        label: '“They’re bidding for a hire. I’m offering you a career. Different things.”',
        result: 'The distinction lands. Money was never going to win this on its own.',
        effects: { leverage: 2, founderTrust: 2, dueDiligence: 1 },
        next: 'decision',
        roleBoost: 'closer',
      },
      walk('bidding'),
    ],
  },
  {
    id: 'decision',
    title: 'Stay or Go',
    speaker: 'narrator',
    text: 'Two offers on the table: Vireo’s dazzling, uncertain rocket ship, and yours — steadier, and finally pointed at what Kit said they wanted. Kit looks at you. "Okay. Make it real. Are you in on this, or is this just tonight’s save?"',
    choices: [
      {
        id: 'dec_commit',
        label: 'Commit. Put the growth path in writing, tonight.',
        effects: { confidence: 1 },
        next: 'invest',
      },
      {
        id: 'dec_trial',
        label: 'Commit — with a 90-day check-in built in, so it’s a promise you both keep.',
        result: 'A promise with a follow-up date is a promise that survives Monday.',
        effects: { valuationDiscipline: 2, dueDiligence: 1, risk: -1 },
        next: 'invest',
        roleBoost: 'operator',
      },
      {
        id: 'dec_walk',
        label: '“I think Vireo is right for you. Go — with a good reference.”',
        effects: {},
        next: 'walkaway',
        walkAway: true,
      },
    ],
  },
]

export const ENGINE_POACH: MogulStory = {
  id: 'poach_nakamura',
  industryId: 'tech',
  title: 'The Poach',
  hook: 'A rival lab is trying to poach your star engineer.',
  subject: 'The Counter-Offer',
  protagonist: 'Kit Nakamura',
  length: 'standard',
  firstStage: 'warning',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: 'They Stayed',
      line: 'You didn’t out-bid Vireo — you out-listened them. Kit takes the architecture lead, the win gets its public due, and your best engineer is now your most loyal one. Tech ships like it’s on fire.',
    },
    good: {
      title: 'Retained',
      line: 'A fair package and a real growth path kept Kit on board. They’re not floating on air, but they’re staying — and they’ll remember you fought smart, not desperate. Tech hums.',
    },
    neutral: {
      title: 'A Clean Goodbye',
      line: 'You let Kit go with a great reference and no hard feelings. It stings, and the migration knowledge walks out with them — but a graceful exit keeps the door open, and the team saw you handle it with class.',
    },
    bad: {
      title: 'The Bidding War',
      line: 'You chased Vireo’s number into the stratosphere. Maybe Kit stays for now, resentful and overpaid, and every other engineer just learned that the way to a raise is a competing offer. Morale — and Tech — take the hit.',
    },
  },
}
