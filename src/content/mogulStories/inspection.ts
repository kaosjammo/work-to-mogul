// ============================================================
//  Mogul Story — "The Inspection" (Energy). A regulator arrives unannounced, and there's
//  a real flaw buried in your logs: a three-week gap in the reactor's containment record
//  nobody flagged. You can meet it with transparency and a fix (and turn the regulator
//  into an ally), try to charm or bury it (and risk a shutdown when it surfaces), or
//  stonewall behind lawyers (neutral). An 8-stage `standard` compliance drama on the shared
//  runtime (a clean, honest handling → a timed Energy profit boost; a caught cover-up →
//  an Energy dip; lawyer up and say nothing → neutral).
//
//  All fictional — no real regulators, agencies, or plants.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away choice reused on every stage: stonewall behind the lawyers.
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'Say nothing — refer her to legal',
  result: 'You go quiet and hand her a lawyer’s card. The inspection stalls; she’ll be back, colder.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'arrival',
    title: 'The Knock',
    speaker: 'protagonist',
    text: 'No appointment, no warning. Inspector Della Voss is already in your lobby in a grey coat, laminated ID held at eye level. "Surprise compliance audit of the reactor block. I’d like the containment logs, the maintenance records, and about six hours of your undivided attention. Shall we?"',
    choices: [
      {
        id: 'arr_stall',
        label: '“Now’s really not a good time. Can we reschedule?”',
        result: 'Nothing says "we’re hiding something" like stalling a surprise audit. She writes that down.',
        effects: { risk: 2, founderTrust: -2, leverage: -1 },
        next: 'flaw',
      },
      {
        id: 'arr_welcome',
        label: '“Of course. Full access, my personal escort. Coffee’s on us.”',
        result: 'Cooperation, immediate and total. Voss’s pen hesitates — she expected friction.',
        effects: { founderTrust: 2, leverage: 1, dueDiligence: 1 },
        next: 'flaw',
        roleBoost: 'closer',
      },
      {
        id: 'arr_prep',
        label: 'Quietly ask your ops lead where you actually stand before you say a word.',
        result: 'One whispered sentence back: "…there’s a gap in the containment logs." Your stomach drops.',
        effects: { dueDiligence: 3, risk: -1 },
        next: 'flaw',
        roleBoost: 'operator',
      },
      walk('arrival'),
    ],
  },
  {
    id: 'flaw',
    title: 'The Gap',
    speaker: 'narrator',
    text: 'It’s real: three weeks last quarter where the reactor’s containment telemetry simply wasn’t logged — a firmware bug during a rushed upgrade. Nothing failed. Nothing leaked. But on paper it looks exactly like the kind of hole people fall into prison through, and Voss will find it if she pulls that quarter.',
    choices: [
      {
        id: 'flaw_deny',
        label: 'Decide right now: she will not be looking at that quarter.',
        result: 'You’ve just made steering an auditor away from data your whole strategy. Bold. Illegal-adjacent.',
        effects: { risk: 3, valuationDiscipline: -1, dueDiligence: -1 },
        next: 'tone',
      },
      {
        id: 'flaw_own',
        label: 'Decide to get ahead of it — you’ll raise the gap yourself, with the root cause.',
        result: 'Disclosing your own flaw before they find it changes everything about how it reads.',
        effects: { dueDiligence: 3, founderTrust: 2, risk: -2 },
        next: 'tone',
        roleBoost: 'operator',
      },
      {
        id: 'flaw_assess',
        label: 'Pull the firmware ticket and the sensor cross-checks before deciding anything.',
        result: 'Backup sensors covered the gap — the reactor was safe, you just can’t prove it the easy way. Useful.',
        effects: { dueDiligence: 2, leverage: 1 },
        next: 'tone',
      },
      walk('flaw'),
    ],
  },
  {
    id: 'tone',
    title: 'Setting the Tone',
    speaker: 'protagonist',
    text: '"Before we start," Voss says, not unkindly, "you should know I’ve shut two plants this year and cleared five. The difference was never how clean they were. It was whether they lied to me. So." She clicks her pen. "How do you want to do this?"',
    choices: [
      {
        id: 'tone_charm',
        label: 'Turn on the charm — talk up your safety awards, steer to the good wings first.',
        result: 'She’s been charmed by better. The good-wing tour reads as a magic trick with something up your sleeve.',
        effects: { confidence: 1, risk: 2, founderTrust: -1 },
        next: 'walkthrough',
      },
      {
        id: 'tone_straight',
        label: '“Straight. Anything you ask, you get the real answer, including the ugly ones.”',
        result: 'She almost smiles. "We’ll see if you mean that." But the frame is set in your favour.',
        effects: { founderTrust: 3, leverage: 1, dueDiligence: 1 },
        next: 'walkthrough',
        roleBoost: 'closer',
      },
      {
        id: 'tone_lawyer',
        label: 'Keep it clipped and minimal — answer only exactly what’s asked, nothing more.',
        result: 'Technically fine. Reads as guarded. She recalibrates to "assume the worst and dig."',
        effects: { leverage: 1, founderTrust: -1, risk: 1 },
        next: 'walkthrough',
      },
      walk('tone'),
    ],
  },
  {
    id: 'walkthrough',
    title: 'The Walkthrough',
    speaker: 'narrator',
    text: 'Voss moves through the reactor block like she built it — checking seals, scanning maintenance tags, photographing a valve you’d forgotten existed. She’s methodical, fast, and clearly counting down to the moment she asks for the logs by quarter.',
    choices: [
      {
        id: 'wlk_distract',
        label: 'Keep her busy in the spotless wings, run the clock, hope she skips the bad quarter.',
        result: 'Every minute you burn steering her, she notices you steering. The clock is not your friend.',
        effects: { risk: 3, dueDiligence: -1, leverage: -1 },
        next: 'question',
      },
      {
        id: 'wlk_show',
        label: 'Show her the backup-sensor array that actually covered the logging gap.',
        result: 'Hard evidence the reactor stayed safe even when the primary log didn’t write. That’s gold.',
        effects: { dueDiligence: 3, leverage: 2, risk: -2 },
        next: 'question',
        roleBoost: 'operator',
      },
      {
        id: 'wlk_narrate',
        label: 'Walk her through the rushed-upgrade timeline honestly as you go.',
        result: 'Context, offered freely, before the gotcha. It defuses the gotcha.',
        effects: { founderTrust: 2, dueDiligence: 1 },
        next: 'question',
      },
      walk('walkthrough'),
    ],
  },
  {
    id: 'question',
    title: 'The Question',
    speaker: 'protagonist',
    text: 'She stops at a terminal and pulls up the log index. "Q-two containment record. There’s three weeks here that just… aren’t. Firmware timestamps are missing." She turns, expression flat, giving you all the rope you want. "Walk me through that."',
    choices: [
      {
        id: 'q_lie',
        label: '“Must be a display glitch on your end. The data’s all there.”',
        result: 'A flat lie about data she can pull three ways. If she does, you’re finished, not fined.',
        effects: { risk: 4, founderTrust: -3, valuationDiscipline: -1 },
        next: 'temptation',
      },
      {
        id: 'q_truth',
        label: '“Firmware bug during the upgrade. Three weeks unlogged. Backups show it stayed in spec. Here’s the ticket.”',
        result: 'The whole ugly truth, plus the mitigating evidence, in one breath. Voss exhales.',
        effects: { dueDiligence: 3, founderTrust: 3, risk: -3 },
        next: 'temptation',
        roleBoost: 'operator',
      },
      {
        id: 'q_minimize',
        label: '“A minor gap. Totally routine, honestly not worth the ink.”',
        result: 'Downplaying it tells her exactly where to dig hardest. She underlines the quarter.',
        effects: { risk: 2, dueDiligence: -1, founderTrust: -1 },
        next: 'temptation',
      },
      walk('question'),
    ],
  },
  {
    id: 'temptation',
    title: 'The Envelope',
    speaker: 'narrator',
    text: 'During a break, your compliance manager sidles up, pale. "Voss’s agency has a discretionary fund. A generous… expediting contribution to the right foundation, and gaps like this get classified as clerical. I can make the call." He’s already holding his phone. It would be a felony with a smile on it.',
    choices: [
      {
        id: 'tmp_bribe',
        label: 'Make the call. Money solves most things, quietly.',
        result: 'You just turned a firmware bug into a bribery case. The worst trade in this whole building.',
        effects: { risk: 4, valuationDiscipline: -3, founderTrust: -1 },
        next: 'remedy',
      },
      {
        id: 'tmp_refuse',
        label: '“Absolutely not. Put the phone away and never suggest that again.”',
        result: 'You kill it flat. Whatever happens with the logs, it stays a compliance issue, not a crime.',
        effects: { valuationDiscipline: 3, founderTrust: 1, risk: -2 },
        next: 'remedy',
        roleBoost: 'buyer',
      },
      {
        id: 'tmp_report',
        label: 'Refuse — and quietly tell Voss you were offered the play and shut it down.',
        result: 'Handing the regulator the one card that could have sunk you. She recalibrates entirely.',
        effects: { founderTrust: 3, leverage: 2, valuationDiscipline: 1, risk: -1 },
        next: 'remedy',
      },
      walk('temptation'),
    ],
  },
  {
    id: 'remedy',
    title: 'The Remedy',
    speaker: 'you',
    text: 'Voss sits down with her clipboard. "Here’s where it goes one of two ways. A finding with a corrective plan I believe in, or a referral. Convince me the gap can’t happen again." This is the part you actually control.',
    choices: [
      {
        id: 'rem_vague',
        label: '“We’ll look into it and tighten things up. You have our word.”',
        result: '"Look into it" is what the plants I closed said. Vagueness reads as no plan at all.',
        effects: { dueDiligence: -2, risk: 2, founderTrust: -1 },
        next: 'ruling',
      },
      {
        id: 'rem_plan',
        label: 'Lay out a concrete fix: firmware watchdog, redundant logging, monthly third-party audit.',
        result: 'Specifics, dates, an outside auditor. A plan she could sign her name next to.',
        effects: { dueDiligence: 3, valuationDiscipline: 2, founderTrust: 1 },
        next: 'ruling',
        roleBoost: 'operator',
      },
      {
        id: 'rem_invite',
        label: 'Invite her agency to co-design the fix and re-inspect on their schedule.',
        result: 'Making the regulator a partner in the solution. Hard to shut a plant you’re helping build.',
        effects: { founderTrust: 3, leverage: 2, dueDiligence: 1 },
        next: 'ruling',
        roleBoost: 'closer',
      },
      walk('remedy'),
    ],
  },
  {
    id: 'ruling',
    title: 'The Ruling',
    speaker: 'protagonist',
    text: 'Voss caps her pen and looks at you for a long moment. "I came in expecting to close you. Instead I’m holding a firmware bug, a backup array, and a plan." She slides the clipboard across. "Sign the corrective order and I’ll write it up honest. Or lawyer up and we do this the long, ugly way. Your call."',
    choices: [
      {
        id: 'rul_sign',
        label: 'Sign the corrective order. Own it fully, on the record.',
        effects: { confidence: 1 },
        next: 'invest',
      },
      {
        id: 'rul_partner',
        label: 'Sign — and ask her to be the standing auditor, so "compliant" is provable, not promised.',
        result: 'Turning the inspector who almost closed you into the reason nobody else ever can.',
        effects: { valuationDiscipline: 1, dueDiligence: 1, founderTrust: 2, risk: -1 },
        next: 'invest',
        roleBoost: 'operator',
      },
      {
        id: 'rul_lawyer',
        label: '“I’m not signing anything today. Talk to my lawyers.”',
        effects: {},
        next: 'walkaway',
        walkAway: true,
      },
    ],
  },
]

export const INSPECTION: MogulStory = {
  id: 'inspection_voss',
  industryId: 'energy',
  title: 'The Inspection',
  hook: 'A regulator showed up for a surprise reactor audit.',
  subject: 'The Inspection',
  protagonist: 'Della Voss',
  length: 'standard',
  firstStage: 'arrival',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: 'Cleared — and Then Some',
      line: 'You met the gap with the whole truth, killed the bribe, and handed Voss a fix she could sign her name to. She leaves an ally, your permits move faster, and "the plant that told the regulator the truth" becomes a reputation worth money. Energy surges.',
    },
    good: {
      title: 'A Clean Finding',
      line: 'A corrective order, honestly earned. It cost you a fix and some pride, but the reactor keeps running, the record’s clean, and Voss will vouch that you played it straight. Energy holds steady and hums.',
    },
    neutral: {
      title: 'Lawyered Up',
      line: 'You said nothing and let the lawyers take it. No admission, no disaster — just an inconclusive audit and an inspector who’ll be back, less patient. You dodged the worst and forfeited the best.',
    },
    bad: {
      title: 'Referred',
      line: 'You lied about the logs, or reached for the envelope, and Voss caught the shape of it. A firmware bug became a referral — fines, a partial shutdown pending review, and a headline you’ll be explaining for a year. Energy takes the hit.',
    },
  },
}
