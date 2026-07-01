// ============================================================
//  Mogul Story: "Angel Investment" (the reference story).
//  A ~10-stage (standard length) visual-novel negotiation in the Finance industry with
//  the fictional startup FridgeMind. Six hidden score variables, four outcome bands.
//  Conforms to the Mogul Stories vocabulary (./types); its outcome→band logic and
//  reward side-effects (the Startup Combinator business) live in engine/angelDeal.ts.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage, MogulStoryRoleBoost } from './types'

// Angel Investment's hidden score variables (each story names its own).
export type ScoreKey = 'confidence' | 'leverage' | 'dueDiligence' | 'founderTrust' | 'risk' | 'valuationDiscipline'
export const SCORE_KEYS: ScoreKey[] = [
  'confidence',
  'leverage',
  'dueDiligence',
  'founderTrust',
  'risk',
  'valuationDiscipline',
]

// Angel's fully-typed score object (matches domain AngelScores) — used by the engine +
// state. The generic MogulStoryScores (below, for choice effects) is a looser Record.
export type Scores = Record<ScoreKey, number>
// Re-export the generic vocabulary under this story's legacy names (kept so the existing
// Angel engine/modal imports resolve unchanged via the content/angelDeal.ts shim).
export type RoleBoost = MogulStoryRoleBoost
export type DealChoice = MogulStoryChoice
export type DealStage = MogulStoryStage
export type DealDef = MogulStory

// Walk-away choice reused on every stage (a story is never mandatory).
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'Walk away',
  result: 'You button your coat and leave. Some of the best deals are the ones you don’t do.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

// ── FridgeMind — the fictional startup (no real companies / people) ──────────────
const STAGES: MogulStoryStage[] = [
  {
    id: 'pitch',
    title: 'The Pitch',
    speaker: 'protagonist',
    text: 'Dex Callahan slides a napkin across the table. "We’re not a fridge company. We’re a data company that happens to live in your kitchen. FridgeMind is the operating system for hunger. Every fridge, one network, infinite insight."',
    choices: [
      {
        id: 'pitch_hype',
        label: '“The operating system for hunger. I’m listening.”',
        result: 'Dex beams. He can tell he’s got a live one.',
        effects: { confidence: 2, founderTrust: 2, dueDiligence: -1, risk: 1 },
        next: 'impression',
      },
      {
        id: 'pitch_probe',
        label: '“Skip the poetry. What does it actually do?”',
        result: 'Dex blinks, recalibrates. Fewer adjectives now.',
        effects: { dueDiligence: 2, founderTrust: -1, valuationDiscipline: 1 },
        next: 'impression',
      },
      {
        id: 'pitch_dismiss',
        label: '“Everyone and their dog has a smart-fridge idea.”',
        result: 'He leans in, unbothered. "Everyone has a fridge. Nobody owns the network."',
        effects: { leverage: 2, founderTrust: -2 },
        next: 'impression',
      },
      walk('pitch'),
    ],
  },
  {
    id: 'impression',
    title: 'First Impression',
    speaker: 'narrator',
    text: 'He’s magnetic — the kind of founder who says "frankly" a lot and means "trust me." His deck has a hockey-stick chart with no y-axis labels. His shoes cost more than his MVP.',
    choices: [
      {
        id: 'imp_charm',
        label: 'Let yourself be charmed — this guy could sell winter to a penguin.',
        result: 'Charisma is real. It’s also not a balance sheet.',
        effects: { founderTrust: 2, confidence: 1, dueDiligence: -2, risk: 1 },
        next: 'demo',
      },
      {
        id: 'imp_read',
        label: 'Watch the tells: what does he skip past quickly?',
        result: 'He speeds up around "retention" and "hardware cost." Noted.',
        effects: { dueDiligence: 2, leverage: 1 },
        next: 'demo',
        roleBoost: 'operator',
      },
      {
        id: 'imp_flat',
        label: 'Stay flat. Give him nothing to read.',
        result: 'Dex hates a poker face. Good — he negotiates worse when nervous.',
        effects: { leverage: 2, valuationDiscipline: 1, founderTrust: -1 },
        next: 'demo',
        roleBoost: 'closer',
      },
      walk('impression'),
    ],
  },
  {
    id: 'demo',
    title: 'Product Demo',
    speaker: 'protagonist',
    text: 'He opens the app. The fridge reports "3 oat milks" — there are clearly none. "Edge case," he says smoothly, tapping to a different screen. "But look at this heat-map of national snack sentiment."',
    choices: [
      {
        id: 'demo_wow',
        label: '“Ooh, the heat-map. Very Bloomberg-terminal-for-dairy.”',
        result: 'You forgot the fridge just lied to you. He didn’t.',
        effects: { confidence: 2, founderTrust: 1, dueDiligence: -1, risk: 2 },
        next: 'market',
      },
      {
        id: 'demo_callout',
        label: '“Back up. Your fridge just hallucinated three oat milks.”',
        result: 'Dex laughs a half-second too late. "Sensor calibration. Ships in v2."',
        effects: { dueDiligence: 3, risk: -1, founderTrust: -1, leverage: 1 },
        next: 'market',
        roleBoost: 'operator',
      },
      {
        id: 'demo_again',
        label: '“Run the inventory demo again. Slowly.”',
        result: 'It fails differently the second time. That’s… worse, actually.',
        effects: { dueDiligence: 2, risk: -1, confidence: -1 },
        next: 'market',
      },
      walk('demo'),
    ],
  },
  {
    id: 'market',
    title: 'The Market',
    speaker: 'protagonist',
    text: '"TAM is everyone who eats," Dex says, drawing a circle around the entire planet. "Conservatively, that’s a forty-trillion-dollar opportunity. We only need zero-point-one percent."',
    choices: [
      {
        id: 'mkt_believe',
        label: '“Zero-point-one percent of everyone. That’s… a lot of fridges.”',
        result: 'You did the multiplication. You did not do the division.',
        effects: { confidence: 2, dueDiligence: -1, risk: 1 },
        next: 'pressure',
      },
      {
        id: 'mkt_challenge',
        label: '“Your real market is people who’ll pay $40/mo to be told they’re out of milk.”',
        result: 'Dex’s circle shrinks to the size of a coaster. Leverage is yours.',
        effects: { dueDiligence: 2, leverage: 2, valuationDiscipline: 1, founderTrust: -1 },
        next: 'pressure',
        roleBoost: 'buyer',
      },
      {
        id: 'mkt_reframe',
        label: '“The moat isn’t the fridge. It’s the data. Convince me you keep it.”',
        result: 'A real question. He almost respects you for it.',
        effects: { dueDiligence: 1, confidence: 1, founderTrust: 1 },
        next: 'pressure',
      },
      walk('market'),
    ],
  },
  {
    id: 'pressure',
    title: 'Founder Pressure',
    speaker: 'protagonist',
    text: '"Look, I like you," Dex says, checking a phone that didn’t buzz. "But I’ve got two other angels circling and a term sheet by Friday. I need to know you’re serious tonight."',
    choices: [
      {
        id: 'prs_fomo',
        label: '“Two others? Okay, okay — I don’t want to miss this.”',
        result: 'You just handed him the whole table. He tries not to smile.',
        effects: { risk: 2, leverage: -2, founderTrust: 1, valuationDiscipline: -1 },
        next: 'financials',
      },
      {
        id: 'prs_callbluff',
        label: '“Name them. Real firms have real partners with real names.”',
        result: 'A long pause. "…It’s early conversations." The pressure evaporates.',
        effects: { leverage: 3, dueDiligence: 1, founderTrust: -1 },
        next: 'financials',
        roleBoost: 'closer',
      },
      {
        id: 'prs_calm',
        label: '“Then I’ll pass and wish you luck with the others.” (bluff back)',
        result: 'Suddenly Friday is very flexible. Discipline pays.',
        effects: { leverage: 2, valuationDiscipline: 2, risk: -1 },
        next: 'financials',
      },
      walk('pressure'),
    ],
  },
  {
    id: 'financials',
    title: 'The Financials',
    speaker: 'you',
    text: 'You ask the boring question that separates investors from fans: “Show me the numbers. Revenue, burn, CAC, churn. All of it.”',
    choices: [
      {
        id: 'fin_full',
        label: 'Demand the full data room before you say another word.',
        result: 'He stalls, then shares a folder named "Financials_FINAL_v7_real."',
        effects: { dueDiligence: 3, leverage: 1, founderTrust: -1 },
        next: 'redflag',
        roleBoost: 'operator',
      },
      {
        id: 'fin_trust',
        label: '“I trust you — ballpark it for me.”',
        result: 'His ballpark is a stadium. You’ll regret this.',
        effects: { founderTrust: 2, dueDiligence: -2, risk: 2 },
        next: 'redflag',
      },
      {
        id: 'fin_burn',
        label: 'Zero in on burn rate and runway only.',
        result: '“Eighteen months,” he says. The folder says eleven. Interesting.',
        effects: { dueDiligence: 2, leverage: 2, risk: -1 },
        next: 'redflag',
        roleBoost: 'buyer',
      },
      walk('financials'),
    ],
  },
  {
    id: 'redflag',
    title: 'Red Flag',
    speaker: 'narrator',
    text: 'Buried in the data room: the "national network" is 214 fridges. 90% of revenue is one pilot — with a deli chain owned by Dex’s uncle. The retention chart is technically a straight line because it only has two data points.',
    choices: [
      {
        id: 'rf_ignore',
        label: 'Every startup has warts. Focus on the vision.',
        result: 'The vision does not pay the electricity bill on 214 fridges.',
        effects: { confidence: 1, risk: 3, dueDiligence: -1 },
        next: 'valuation',
      },
      {
        id: 'rf_call',
        label: '“Your network is 214 fridges and your uncle. Explain.”',
        result: 'Dex’s smile finally cracks. "The uncle thing is… complicated." You’re protected now.',
        effects: { dueDiligence: 3, risk: -3, leverage: 2, founderTrust: -2 },
        next: 'valuation',
        roleBoost: 'operator',
      },
      {
        id: 'rf_charmed',
        label: '“But imagine 214 million fridges.” (say it with him)',
        result: 'You’re quoting his deck back to him. He’s winning and you don’t know it.',
        effects: { founderTrust: 2, confidence: 2, risk: 3, dueDiligence: -2 },
        next: 'valuation',
      },
      walk('redflag'),
    ],
  },
  {
    id: 'valuation',
    title: 'Valuation',
    speaker: 'protagonist',
    text: '"Forty million post-money," Dex says, as if reading a weather report. "Frankly it’s a steal. We turned down fifty from a firm I can’t name."',
    choices: [
      {
        id: 'val_accept',
        label: '“Forty’s fair for a category-definer.”',
        result: 'You paid vision prices for a garage project. The cap table remembers.',
        effects: { valuationDiscipline: -2, risk: 2, founderTrust: 2 },
        next: 'terms',
      },
      {
        id: 'val_hardball',
        label: '“Six. And I’m being generous because the coffee was good.”',
        result: 'Dex clutches his chest theatrically. You settle in the low teens. That’s a win.',
        effects: { leverage: 2, valuationDiscipline: 3, founderTrust: -2 },
        next: 'terms',
        roleBoost: 'closer',
      },
      {
        id: 'val_fair',
        label: 'Anchor on revenue multiples and let the math argue.',
        result: '“Twelve,” you say, sliding the comps across. He can’t argue with a spreadsheet.',
        effects: { valuationDiscipline: 2, dueDiligence: 1, leverage: 1 },
        next: 'terms',
        roleBoost: 'buyer',
      },
      walk('valuation'),
    ],
  },
  {
    id: 'terms',
    title: 'Final Terms',
    speaker: 'you',
    text: 'The term sheet is one page and suspiciously founder-friendly: no board seat, no liquidation preference, no information rights. Just vibes and a big number.',
    choices: [
      {
        id: 'trm_protect',
        label: 'Demand a board seat, a 1x pref, and monthly reporting.',
        result: 'He grumbles about "trust," signs anyway. Your downside is covered.',
        effects: { valuationDiscipline: 2, dueDiligence: 2, risk: -2, founderTrust: -1 },
        next: 'decision',
        roleBoost: 'operator',
      },
      {
        id: 'trm_friendly',
        label: 'Keep it founder-friendly to preserve the relationship.',
        result: 'He loves you. Your lawyer will not.',
        effects: { founderTrust: 3, valuationDiscipline: -2, risk: 1 },
        next: 'decision',
      },
      {
        id: 'trm_info',
        label: 'Concede the board seat, but never the information rights.',
        result: 'A clean trade. You’ll always know where the money went.',
        effects: { valuationDiscipline: 1, dueDiligence: 1, confidence: 1 },
        next: 'decision',
      },
      walk('terms'),
    ],
  },
  {
    id: 'decision',
    title: 'The Decision',
    speaker: 'narrator',
    text: 'Pen hovering over the term sheet. Dex watches, radiating the calm of a man who has already spent your money. This is the moment. In or out?',
    choices: [
      {
        id: 'dec_invest',
        label: 'Sign. Write the cheque.',
        effects: { confidence: 1 },
        next: 'invest',
      },
      {
        id: 'dec_small',
        label: 'Sign — but a smaller cheque than he wanted. Hedge it.',
        result: 'Half in, half sane. Dex is annoyed, which is usually a good sign.',
        effects: { valuationDiscipline: 2, risk: -1, confidence: -1 },
        next: 'invest',
        roleBoost: 'buyer',
      },
      {
        id: 'dec_walk',
        label: 'Cap the pen. “I’m out. Good luck, Dex.”',
        effects: {},
        next: 'walkaway',
        walkAway: true,
      },
    ],
  },
]

export const ANGEL_DEAL: MogulStory = {
  id: 'angel_fridgemind',
  industryId: 'finance',
  icon: '💼',
  title: 'Angel Investment',
  hook: 'A founder wants to pitch you',
  subject: 'FridgeMind',
  protagonist: 'Dex Callahan',
  length: 'standard',
  firstStage: 'pitch',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: 'Home Run',
      line: 'Clean diligence, hard terms, a fair price. Six months later FridgeMind pivots to “ambient grocery intelligence” and gets acquired. Your cheque comes back many times over — and you walk away having founded the 🚀 Startup Combinator: a standalone business paying steady income plus periodic exit jackpots. Find it at the top of the Business screen.',
    },
    good: {
      title: 'Solid Deal',
      line: 'Not perfect, but you got in at a sane price with real protections. It won’t change your life, but it won’t embarrass you at the next partner meeting either.',
    },
    neutral: {
      title: 'You Walked',
      line: 'You kept your pen capped and your capital dry. Not every pitch deserves a cheque — knowing which is the whole job.',
    },
    bad: {
      title: 'Expensive Lesson',
      line: 'The 214 fridges became 190. The uncle’s deli “paused” its pilot. Dex is now “heads-down on a stealth thing.” You’ll frame this term sheet as a reminder.',
    },
  },
}
