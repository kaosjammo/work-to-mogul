// ============================================================
//  Mogul Story — "The Settlement" (the divorce negotiation). Player-triggered from the
//  💍 Married panel (not the random cadence). Quinn Harlow is already mega-rich and does
//  not need a cent of yours — so grace, fairness, and restraint end in a clean break
//  where nobody loses an asset. Greed, aggression, and low blows turn it into a war she
//  is far better funded to win: a bad settlement costs you HALF of everything. Walking
//  away from the table means you couldn't go through with it — you RECONCILE, still
//  married. Resolution lives in engine/divorce.ts (applyDivorceOutcome / halveAssets).
//
//  All fictional — no real people, brands, or companies.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away = call the whole thing off. Leaving the table reconciles the marriage.
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'Push the papers back. You can’t do this.',
  result: 'Your hand stops over the signature line and just… stays there. Across the table, Quinn watches you not sign, and something in her face unclenches. The lawyers exchange a look. Nobody’s getting divorced tonight.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'table',
    title: 'The Table',
    speaker: 'narrator',
    text: 'A long glass table, two banks of lawyers in expensive silence, and Quinn across from you — not the Quinn from the terrace with the warm red sign, the other one, the one that ran your bidding into the stratosphere out of pure spite. Somewhere a clock ticks. Your marriage is now a schedule of assets, and everyone in the room is waiting to see how ugly you want to make this.',
    choices: [
      {
        id: 'table_war',
        label: 'Open hard — instruct your lead counsel to “protect every dollar, no exceptions.”',
        result: 'The word dollar lands on the glass like a dropped glove. Quinn’s lawyers straighten. Hers tilts her head a fraction: challenge accepted.',
        effects: { confidence: 2, risk: 3, founderTrust: -2 },
        next: 'tone',
      },
      {
        id: 'table_grace',
        label: 'Set the tone yourself: “Nobody built anything to take it from the other. Let’s do this like adults.”',
        result: 'You wave your own lawyer down before he can posture. Quinn blinks — she came braced for a war, and you handed her a truce instead.',
        effects: { valuationDiscipline: 2, founderTrust: 2, risk: -1 },
        next: 'tone',
        roleBoost: 'operator',
      },
      {
        id: 'table_quiet',
        label: 'Say nothing yet. Slide the water across to her, and wait for her to speak first.',
        result: 'A small kindness at a hostile table. Quinn takes the glass, studies you over the rim, and recalibrates whatever plan she walked in with.',
        effects: { dueDiligence: 1, founderTrust: 1 },
        next: 'tone',
      },
      walk('table'),
    ],
  },
  {
    id: 'tone',
    title: 'Her Terms',
    speaker: 'protagonist',
    text: '"Let me save everyone some billable hours." Quinn folds her hands. "I have more money than either of us can spend in three lifetimes. I do not want your businesses. I do not want your cash. What I want is to know whether the person I married is the one who gave a stranger a broken sign — or the one his lawyers think he is." A beat. "So. Which of you showed up today?"',
    choices: [
      {
        id: 'tone_leverage',
        label: '“Everyone says that until the numbers are on the table. I’d be a fool not to press the advantage.”',
        result: '"There he is," Quinn says softly, and it is not a compliment. Her counsel starts drafting in earnest.',
        effects: { confidence: 1, risk: 3, founderTrust: -2 },
        next: 'schedule',
      },
      {
        id: 'tone_true',
        label: '“The one who gave you the sign. I don’t want a cent of yours, Quinn. I don’t want to win this. I just want it over, clean.”',
        result: 'Quinn holds your eyes for a long, dangerous moment, then nods once. "Okay," she says. "Then let’s make it clean." The temperature in the room drops ten degrees of hostility.',
        effects: { founderTrust: 2, valuationDiscipline: 2, risk: -1 },
        next: 'schedule',
        roleBoost: 'closer',
      },
      {
        id: 'tone_fair',
        label: '“I want whatever’s fair. Not what’s maximal — what lets us both walk out of here able to look at each other.”',
        result: '"Fair," Quinn repeats, like she’s testing it for weight. "I can work with fair." Two lawyers visibly deflate.',
        effects: { valuationDiscipline: 1, founderTrust: 1, dueDiligence: 1 },
        next: 'schedule',
      },
      walk('tone'),
    ],
  },
  {
    id: 'schedule',
    title: 'The Schedule',
    speaker: 'narrator',
    text: 'Then comes the paper: every business, every holding, every account, laid out in twelve-point font. Your whole empire as a spreadsheet, hers beside it — dwarfing it, honestly. The lawyers have prepared three ways to divide it. Your pen hovers.',
    choices: [
      {
        id: 'schedule_raid',
        label: 'Argue that her fortune means she can spare a slice of yours “to be equitable.”',
        result: 'It’s a clever argument and a bad one. Quinn’s smile goes flat. "Equitable," she says. "Now we’re negotiating." The knives come out.',
        effects: { leverage: 1, risk: 3, founderTrust: -2 },
        next: 'lowblow',
      },
      {
        id: 'schedule_keep',
        label: '“What’s mine stays mine, what’s yours stays yours. We each walk out with exactly what we walked in with.”',
        result: '"Separate estates, no cross-claims," Quinn says, and her lead counsel actually smiles. "That’s the cleanest thing anyone’s said in this room all week."',
        effects: { valuationDiscipline: 2, founderTrust: 2, risk: -1 },
        next: 'lowblow',
        roleBoost: 'buyer',
      },
      {
        id: 'schedule_generous',
        label: 'Offer HER the tie-breaker on anything contested — you’d rather be generous than right.',
        result: 'Quinn stares at you. "You’re giving me the gavel." She sets it right back down. "I don’t need it. But… thank you." Something eases.',
        effects: { founderTrust: 2, dueDiligence: 1 },
        next: 'lowblow',
      },
      walk('schedule'),
    ],
  },
  {
    id: 'lowblow',
    title: 'The Low Blow',
    speaker: 'narrator',
    text: 'Your lead counsel leans in and murmurs the thing lawyers murmur: there’s a pressure point. A regulatory soft spot in Harlow & Co., a filing you could weaponise, a way to make walking away expensive enough that she gives you whatever you ask. It would work. It would also be the cruelest thing you’ve ever done to a person who once trusted you with a wrench and a coffee machine.',
    choices: [
      {
        id: 'lowblow_use',
        label: 'Use it. This is a negotiation, not a friendship — take the leverage.',
        result: 'You say the words. You watch them land. Quinn doesn’t flinch — she just writes something down, and the last of the warmth leaves her eyes for good.',
        effects: { confidence: 1, leverage: 1, risk: 3, founderTrust: -2 },
        next: 'sign',
      },
      {
        id: 'lowblow_refuse',
        label: 'Shut it down. “We’re not doing that. Strike it from the file.” Loud enough for her side to hear.',
        result: 'Your counsel blinks. Across the table, Quinn’s did too — she heard you refuse to hurt her when you had the knife in your hand. She won’t forget it.',
        effects: { founderTrust: 3, valuationDiscipline: 2, risk: -1 },
        next: 'sign',
        roleBoost: 'closer',
      },
      {
        id: 'lowblow_ignore',
        label: 'Wave it off without a word and move on. Not everything needs a speech.',
        result: 'You just shake your head and turn the page. Quiet, unremarkable, decent. Quinn notices anyway.',
        effects: { valuationDiscipline: 1, founderTrust: 1 },
        next: 'sign',
      },
      walk('lowblow'),
    ],
  },
  {
    id: 'sign',
    title: 'The Sign',
    speaker: 'protagonist',
    text: 'One line item stops everything. The rusty neon EAT sign — hers, always hers, hung in the hallway of the home you shared. It’s on the schedule as a jointly-held asset now. Quinn looks at it on the page, then at you, and for the first time all day the lawyer-face slips. "That one," she says quietly, "isn’t really up for division, is it."',
    choices: [
      {
        id: 'sign_claim',
        label: '“I paid for it. Magnificently, you said. It’s on the schedule — it’s in play.”',
        result: 'You watch yourself say it. So does Quinn. Whatever you were to each other, that sentence just put a price on the night you met.',
        effects: { risk: 3, founderTrust: -2, leverage: 1 },
        next: 'close',
      },
      {
        id: 'sign_give',
        label: '“Strike it. It was never mine to win — it’s Rosie’s, it’s yours, it always was.”',
        result: 'Quinn goes very still. "You’re sure." You are. Her counsel strikes the line, and Quinn mouths two words across the table that the stenographer doesn’t catch.',
        effects: { founderTrust: 3, valuationDiscipline: 2, risk: -1 },
        next: 'close',
        roleBoost: 'operator',
      },
      {
        id: 'sign_split',
        label: '“It stays plugged in wherever you are. Consider it permanently loaned — no terms, no takebacks.”',
        result: '"A permanent loan," Quinn repeats, and almost smiles. "Only you would find the one clause that isn’t about money."',
        effects: { founderTrust: 2, dueDiligence: 1 },
        next: 'close',
      },
      walk('sign'),
    ],
  },
  {
    id: 'close',
    title: 'The Signature',
    speaker: 'narrator',
    text: 'And then it’s just the last page, and a pen, and the two of you — the lawyers have run out of things to argue about, which tells you everything about how the day went. Sign it well and you both walk out whole; sign it badly and one of you leaves with half the other’s life. Quinn caps her pen and waits for you to decide who you were, in the end.',
    choices: [
      {
        id: 'close_war',
        label: 'Sign the aggressive draft — take every point you fought for, consequences be damned.',
        result: 'The pen scratches. You got your maximal position. You also just handed a mega-billionaire a reason to make the next year of your life a case study — and her lawyers are so much better funded than yours.',
        effects: { confidence: 1, risk: 3, founderTrust: -2 },
        next: 'invest',
      },
      {
        id: 'close_clean',
        label: 'Sign the clean draft — separate estates, nothing taken, nobody bled.',
        result: 'Two signatures, no blood on the table. Quinn slides the pen back into her jacket. "Well," she says. "That’s the most civilised thing we’ve ever done to each other."',
        effects: { founderTrust: 2, valuationDiscipline: 2, risk: -1 },
        next: 'invest',
        roleBoost: 'closer',
      },
      {
        id: 'close_generous',
        label: 'Sign, and leave a little more on her side than you had to — a last kindness.',
        result: 'You give up a point you could have kept. Quinn catches it, of course she does. She doesn’t say thank you. She doesn’t have to.',
        effects: { founderTrust: 2, dueDiligence: 1, valuationDiscipline: 1 },
        next: 'invest',
      },
      walk('close'),
    ],
  },
]

export const DIVORCE_SETTLEMENT: MogulStory = {
  id: 'divorce_settlement',
  industryId: 'food',
  icon: '💔',
  title: 'The Settlement',
  hook: 'The lawyers are in the room.',
  subject: 'The Divorce',
  protagonist: 'Quinn Harlow',
  length: 'standard',
  firstStage: 'table',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: 'A Clean Break',
      line: 'Nobody lost a thing. Separate estates, the sign left plugged in at hers, two signatures and a strange, sad grace. "For the record," Quinn says at the elevator, "you were the good one after all." The empire is intact. The marriage is not — but you can still look each other in the eye.',
    },
    good: {
      title: 'Amicably Yours',
      line: 'A little friction, a few tense hours, but you kept it clean — nothing seized, nothing scorched. You each walk out with exactly what you walked in with. It isn’t a happy ending. It’s a decent one, which at a divorce table is rarer.',
    },
    neutral: {
      title: 'You Couldn’t Do It',
      line: 'The pen hovered over the last page and just… stopped. You pushed the papers back. Whatever brought you to that table, it wasn’t bigger than the rest of it — so the marriage stands, the sign stays humming, and everyone goes home still, somehow, married.',
    },
    bad: {
      title: 'Scorched Earth',
      line: 'You went for the throat at a table across from someone with far deeper pockets and far better lawyers — and she went for yours right back, and won. You keep the marriage certificate as a souvenir and roughly half of everything you built. The other half is Quinn’s now. Some victories cost more than the loss.',
    },
  },
  hintCopy: {
    highRisk: '💔 This is turning into a war.',
    someRisk: 'That was needlessly sharp.',
    solid: 'You’re keeping it clean — and it shows.',
    leading: 'She’s ready to make this painless.',
    trailing: 'The lawyers are winning, not you.',
    warm: 'There’s still decency between you.',
  },
}
