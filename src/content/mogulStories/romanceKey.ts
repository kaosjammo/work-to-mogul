// ============================================================
//  Mogul Story — "The Key" (Romance, Episode 5 of 6). Public now, and steady, Quinn
//  Harlow shows up at your door one Tuesday with the one thing she'd never trust to a
//  mover: her gran's ancient espresso machine — the last surviving piece of Rosie's
//  diner. The renovation is the excuse; the ask underneath is whether "somewhere I
//  trust" can mean here, with you. Give the machine the good outlet and the sunny
//  corner and you earn the brass key that follows — and quietly set the stage for the
//  proposal, where that machine has "lived in your place for months." A short 5-stage
//  romance beat on the shared runtime. industryId 'food' is trigger context only —
//  eligibility is bespoke, gated on the relationship stage (offers after "Going Public").
//
//  All fictional — no real people, brands, or companies.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away choice reused on every stage (no need to rush a thing this size).
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'Don’t rush it — let it keep',
  result: 'You ease off and let the moment stay unfinished. Some doors are better opened slowly, and Quinn — of all people — knows the value of not being hurried.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'crate',
    title: 'The Crate',
    speaker: 'narrator',
    text: 'Quinn arrives at your door at nine on a Tuesday with no warning and a wooden crate the size of a small safe, breathing hard from the stairs and refusing every offer of help. "They’re gutting my building for eighteen months," she says — which is true, and is not why she is here. Inside the crate, wrapped in a moving blanket like a sleeping animal, is the ancient espresso machine. Gran’s machine. The last standing brick of Rosie’s.',
    choices: [
      {
        id: 'crate_movers',
        label: '“You know professional art movers exist, right? I’ll have a white-glove crew handle it.”',
        result: 'Quinn’s face closes by a degree. "Handle it," she repeats. You have offered logistics to a woman who carried this up three flights herself rather than let a stranger touch it.',
        effects: { risk: 2, founderTrust: -1, dueDiligence: -1 },
        next: 'ask',
      },
      {
        id: 'crate_take',
        label: 'Take the weight without a word, set it gently on the counter, and ask where the water line is.',
        result: 'You lift before you ask why. Quinn watches you cradle it like it’s fragile — because to her it is — and something in her shoulders comes down an inch.',
        effects: { founderTrust: 2, valuationDiscipline: 1, dueDiligence: 1, risk: -1 },
        next: 'ask',
        roleBoost: 'operator',
      },
      {
        id: 'crate_read',
        label: 'Don’t touch the crate at all. Look at her face instead. “Eighteen months is the excuse. What’s the actual ask?”',
        result: 'Quinn goes still, caught. "You read past the excuse," she says. "You always read past the excuse. It’s deeply inconvenient." But she’s not leaving.',
        effects: { dueDiligence: 2, founderTrust: 1, leverage: 1 },
        next: 'ask',
      },
      walk('crate'),
    ],
  },
  {
    id: 'ask',
    title: 'The Real Ask',
    speaker: 'protagonist',
    text: 'Quinn stops pretending it’s about storage. "It’s the only thing of Gran’s I have left. Not the sign — the sign is decoration. This is the thing her hands were on every morning at five." She sets a palm flat on the blanket. "I don’t leave it with facilities. I don’t leave it in a unit. I need it somewhere I trust more than I trust my own building." The boardroom voice is nowhere. "I’m asking if ‘somewhere I trust’ can be here. With you."',
    choices: [
      {
        id: 'ask_deflect',
        label: '“It’s just a coffee machine, Quinn. Obviously — stash it wherever’s easiest.”',
        result: 'The words land like a dropped tray. "Right," Quinn says, very lightly. "Just a coffee machine." She has never looked more like she’s reconsidering something.',
        effects: { risk: 2, founderTrust: -2 },
        next: 'corner',
      },
      {
        id: 'ask_honor',
        label: '“It’s not a coffee machine and we both know it. Yes. It lives here — and it gets the good outlet, the one that never trips.”',
        result: 'Quinn exhales like she’d been holding it since the stairs. "The good outlet," she says. "You understand." It’s the highest compliment she owns.',
        effects: { founderTrust: 2, dueDiligence: 1, valuationDiscipline: 1, risk: -1 },
        next: 'corner',
        roleBoost: 'closer',
      },
      {
        id: 'ask_promise',
        label: '“I’ll guard it like it’s mine. Which — I think, somewhere in the last year, it kind of became.”',
        result: '"Careful," Quinn warns, but she’s already unbuckling the crate straps, which is a yes in every language she speaks.',
        effects: { founderTrust: 1, dueDiligence: 1 },
        next: 'corner',
      },
      walk('ask'),
    ],
  },
  {
    id: 'corner',
    title: 'Where It Goes',
    speaker: 'narrator',
    text: 'The machine needs a home in yours — a corner, a counter, a shelf you’ll have to clear to make room. Where it lands is going to say something, and Quinn is watching to learn whether you’ll tuck it discreetly out of the way or give it pride of place in a life you’ve kept very carefully arranged.',
    choices: [
      {
        id: 'corner_closet',
        label: 'Find a tidy spot in the pantry where it won’t clash with the kitchen’s design language.',
        result: 'You reach for the cabinet with the label maker on it. Quinn clocks exactly what "won’t clash with the design language" means: out of sight. She says nothing. She notices everything.',
        effects: { risk: 1, valuationDiscipline: -1, founderTrust: -1 },
        next: 'ritual',
      },
      {
        id: 'corner_window',
        label: 'Clear the sunny stretch of counter by the window — the spot you actually use — so it catches the morning the way Rosie’s did at five a.m.',
        result: 'You move your own things to make room for hers, in the best light in the house. Quinn watches the machine settle into the sunrise spot and has to look out the window for a moment.',
        effects: { founderTrust: 2, dueDiligence: 1, valuationDiscipline: 1, risk: -1 },
        next: 'ritual',
        roleBoost: 'operator',
      },
      {
        id: 'corner_shrine',
        label: 'Give it the whole console by the front door, where everyone who visits will have to ask about it.',
        result: '"Subtle," Quinn says, but she doesn’t move it. Pride of place, first thing anyone sees — she pretends to object and fails.',
        effects: { founderTrust: 1, leverage: 1 },
        next: 'ritual',
      },
      walk('corner'),
    ],
  },
  {
    id: 'ritual',
    title: 'The Handover',
    speaker: 'protagonist',
    text: 'Quinn walks you through it like she’s handing over launch codes: the valve you hold, the count to three, the exact apology it wants before dawn. "It sulked for a week when it moved to my office. It’ll sulk here too — don’t take it personally." A warning finger. "And do not, ever, let anyone ‘fix’ it. People keep offering. Gran would have chased them off with the wrench." You’ve watched her do this once, on the coast. Now it’s yours to keep alive.',
    choices: [
      {
        id: 'ritual_upgrade',
        label: '“I could have it properly serviced — new group head, new gaskets, running like the day it left the factory.”',
        result: 'You’ve offered to fix the exact thing that makes it hers — the same misfire you nearly made with the sign. Quinn’s jaw sets. "It runs like the day Gran left it. That’s the point."',
        effects: { risk: 2, founderTrust: -1, valuationDiscipline: -1 },
        next: 'key',
      },
      {
        id: 'ritual_learn',
        label: 'Hold the valve, count to three, murmur the apology under your breath — and pull two cups on the first try.',
        result: 'It gurgles, sulks, forgives you, and delivers. Quinn stares at the two cups. "It did not do that for me for a month," she says, and it comes out somewhere between outraged and undone.',
        effects: { founderTrust: 2, dueDiligence: 2, risk: -1 },
        next: 'key',
        roleBoost: 'buyer',
      },
      {
        id: 'ritual_wrench',
        label: 'Ask where the wrench goes — the one her gran kept behind the register — and clear a drawer for it.',
        result: '"You remembered the wrench." Quinn hands it over like a relic, and you give it its own drawer, right beside the machine. "Okay," she says, quietly. "Okay."',
        effects: { founderTrust: 1, dueDiligence: 1 },
        next: 'key',
      },
      walk('ritual'),
    ],
  },
  {
    id: 'key',
    title: 'The Key',
    speaker: 'protagonist',
    text: 'Late. The machine is installed and sulking exactly on schedule. At the door, Quinn digs in her coat and comes out with a single brass key on a plain ring — not the fob to her building, the old cut key, the one to the place she actually lives. She turns it over in her fingers, deciding something. "You’ll need to get in. To feed the machine. When I travel." The machine is the reason she can give. Everyone standing in the room knows it isn’t the reason.',
    choices: [
      {
        id: 'key_transaction',
        label: 'Take it, and offer yours straight back — “fair’s fair.” Make it even, make it a clean swap.',
        result: 'You turn a key into a transaction. Quinn takes yours, nods like a deal closed, and the softness that was in the room a second ago tidies itself away.',
        effects: { risk: 1, leverage: -1, founderTrust: -1 },
        next: 'invest',
      },
      {
        id: 'key_meaning',
        label: 'Don’t reach for it. “Say what it actually is, Quinn. Out loud. Then I’ll take it.”',
        result: 'A long breath. "It’s a key to my home, given to a man I said I’d never let close enough to have one. There. Now take the thing before I lose my nerve." You take it.',
        effects: { founderTrust: 2, dueDiligence: 1, valuationDiscipline: 1, risk: -1 },
        next: 'invest',
        roleBoost: 'closer',
      },
      {
        id: 'key_quiet',
        label: 'Take the key, thread it onto your own ring where it’ll live, and press the spare to yours into her hand without a word.',
        result: 'No speech, no ceremony — just two keys quietly changing hands and staying changed. Quinn closes her fingers around yours. "Well," she says. "That’s that, then."',
        effects: { founderTrust: 1, confidence: 1 },
        next: 'invest',
      },
      walk('key'),
    ],
  },
]

export const ROMANCE_KEY: MogulStory = {
  id: 'love_key',
  industryId: 'food',
  icon: '🔑',
  title: 'The Key',
  hook: 'Quinn showed up with her gran’s espresso machine and no explanation.',
  subject: 'Moving In',
  protagonist: 'Quinn Harlow',
  length: 'short',
  firstStage: 'crate',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: 'A Key And A Machine',
      line: 'Gran’s espresso machine has the sunny corner by the window, and your kitchen finally smells like five a.m. Quinn’s key rides on your ring; yours rides on hers. "For the record," she says, pulling the door shut behind the both of you, "this was never about the coffee." You knew. You gave it the good outlet anyway.',
    },
    good: {
      title: 'It Lives Here Now',
      line: 'The machine sulks into its new home and produces, grudgingly, two perfect cups. Quinn leaves the key and makes no speech about it — which, from Quinn, is the entire speech. Your place is a little more hers now, and neither of you is going to say so out loud.',
    },
    neutral: {
      title: 'Left On The Counter',
      line: 'You kept it easy and low-stakes — the machine stays, the key question stays open, nothing rushed. Quinn heads home lighter than she arrived, and the offer she almost made keeps for another night. It’ll come back around.',
    },
    bad: {
      title: '“Just A Coffee Machine”',
      line: 'You treated the most precious thing she owns like an appliance and her hardest-won trust like a swap to be balanced. Quinn takes the machine back to a storage unit she trusts less than she was starting to trust you — and that’s exactly the point. It isn’t over. But some keys have to be re-earned.',
    },
  },
  hintCopy: {
    highRisk: '💔 You’re losing her.',
    someRisk: 'That landed a little awkwardly.',
    solid: 'You’re really listening — and it shows.',
    leading: 'She’s leaning in.',
    trailing: 'You’re chasing the conversation.',
    warm: 'There’s real chemistry here.',
  },
}
