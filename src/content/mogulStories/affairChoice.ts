// ============================================================
//  Mogul Story — "The Choice" (Affair arc, Episode 5 of 5 — THE FINALE, the point of
//  no return). It has come to a head. Elodie Fontaine won't be a secret any longer, and
//  the truth she's been too kind to say out loud is finally on the table: you can't have
//  both. Her, or Quinn. There is no version of tonight where you keep everyone.
//
//  This is the mechanical cliff. INDULGENT choices load `risk`, and the final decisive
//  indulgent choice — telling Elodie yes, you'll leave Quinn — reads 'bad', which at the
//  finale sets `cheated = true`: Quinn finds out, and a punitive divorce chains next.
//  FAITHFUL choices load dueDiligence/valuationDiscipline/founderTrust at low risk; the
//  final decisive faithful choice — ending it with Elodie and going home to tell Quinn
//  everything — reads great/good and closes the affair clean, marriage intact. `walk` on
//  any stage is also choosing Quinn: you end it with Elodie, quietly, and go home.
//
//  Nothing physical is depicted; the betrayal is one of trust and choice. Eligibility is
//  bespoke — gated on honeymoon booked + married, current episode only (see engine/affair.ts).
//
//  All fictional — no real people, brands, or companies.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away = end it with Elodie, right now, and go home. This IS choosing Quinn.
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'End it. Say goodbye to Elodie and drive home to Quinn.',
  result: 'You don’t make a speech. You just say it’s over, that it was never fair to her, and that you’re going home. Elodie nods like she already knew, and doesn’t make it harder than it has to be — which somehow makes it harder. You drive home to your wife, and you keep driving even when part of you wants to turn around.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'ultimatum',
    title: 'The Farmhouse Kitchen',
    speaker: 'protagonist',
    text: '"I can’t keep doing this." Elodie says it not angry, just tired, both hands wrapped around a chipped mug of the good coffee. Rain on the tin roof. "I’m not built for half of someone, and you’re not built to lie forever — I’ve watched it cost you. So I’m going to say the thing we’ve been pretending isn’t true." She looks up. "You can’t have both of us. Not anymore. It’s her or it’s me, and I need you to choose, tonight, out loud."',
    choices: [
      {
        id: 'ultimatum_stay',
        label: '“Then I choose to stay. Right now. Here.” Set your keys on her table.',
        result: 'You put the keys down. It’s the smallest gesture and the loudest thing you’ve ever done — keys off the ring your whole life is on, sitting on a florist’s kitchen table. Elodie stares at them, then at you, and something in her face breaks open, terrified and hoping.',
        effects: { confidence: 2, risk: 4, founderTrust: -1 },
        next: 'edge',
      },
      {
        id: 'ultimatum_truth',
        label: '“You’re right. And I owe you the truth: I’m not going to leave her.”',
        result: 'It costs you to say it, because it’s true and because it ends the loveliest thing you’ve had in years. Elodie’s eyes fill, but she nods. "Okay," she says, steady. "Okay. Thank you for not dragging it out." The kindness of it nearly undoes you.',
        effects: { dueDiligence: 3, valuationDiscipline: 2, founderTrust: 1, risk: -1 },
        next: 'edge',
      },
      walk('ultimatum'),
    ],
  },
  {
    id: 'edge',
    title: 'The Long Minute',
    speaker: 'narrator',
    text: 'Nobody says anything for a long minute. This is the edge of it — the last minute where nothing has happened yet, where both lives are still possible and neither is real. Elodie, warm and near and impossibly easy to want. Quinn, at home, sharp and unimpressed and yours, who trusts you exactly because it has never once occurred to her that she shouldn’t. One of those is about to become a thing you did.',
    choices: [
      {
        id: 'edge_close',
        label: 'Close the distance. Let it be her. Let yourself stop fighting it.',
        result: 'You take the last step. Everything in you that’s been holding the line for five episodes just… stops holding. It feels, for one weightless second, like relief. It is the most expensive second of your life, and you don’t even know it yet.',
        effects: { confidence: 1, risk: 5, founderTrust: -2 },
        next: 'decide',
      },
      {
        id: 'edge_quinn',
        label: 'Think of Quinn. Think of the trust you’d be spending. Step back.',
        result: 'You picture Quinn’s face when she says your name like it’s a joke only the two of you get. You picture it if she ever found out. You step back, and the second life folds up and away, and you can breathe again.',
        effects: { dueDiligence: 4, valuationDiscipline: 3, founderTrust: 2, risk: -1 },
        next: 'decide',
      },
      walk('edge'),
    ],
  },
  {
    id: 'decide',
    title: 'Say It Out Loud',
    speaker: 'protagonist',
    text: '"I need the words," Elodie says softly. "Not the keys, not the coffee, not the way you’re looking at me. The words. Am I your life now, or am I the thing you did once and drove away from? Tell me which, and I’ll believe you either way." She’s not begging. She’s offering you a door, both directions, and asking you to walk through one on purpose. There is no more standing in the frame.',
    choices: [
      {
        id: 'decide_her',
        label: '“You. It’s you. I’ll leave Quinn.” Say it, and mean it, and cross the line for good.',
        result: 'You say it. You cross the last line there is to cross — the one you can’t walk back, can’t un-say, can’t explain away as a feather. You are, as of this sentence, a person who left. Elodie exhales like she’s been underwater for months. And somewhere across town, though you don’t know it yet, the clock on the rest of it starts running.',
        effects: { risk: 6, founderTrust: -2, confidence: 1 },
        next: 'invest',
      },
      {
        id: 'decide_quinn',
        label: '“It’s her. It was always going to be her. I’m so sorry, Elodie.” Choose your marriage.',
        result: 'You choose Quinn — out loud, on purpose, with Elodie’s lovely face right in front of you making it cost the maximum. She doesn’t rage. She just closes her eyes, nods once, and says "go home, then." You go. It hurts like hell and it is the only right thing you have done in this whole story.',
        effects: { dueDiligence: 8, valuationDiscipline: 5, founderTrust: 2, risk: -1 },
        next: 'invest',
      },
      walk('decide'),
    ],
  },
]

export const AFFAIR_CHOICE: MogulStory = {
  id: 'affair_choice',
  industryId: 'food',
  icon: '⚖️',
  title: 'The Choice',
  hook: 'Her, or Quinn. Decide.',
  subject: 'Elodie',
  protagonist: 'Elodie Fontaine',
  length: 'short',
  firstStage: 'ultimatum',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: 'You Chose Your Marriage',
      line: 'You said it to Elodie’s face — it was always going to be Quinn — and then you drove home and told your wife everything, the whole arc, start to finish. Quinn goes very quiet, and then very sharp, and then, eventually, she stays. It cost you something real: Elodie was genuinely lovely, and she’s gone. But nothing is hidden anymore, and the marriage is yours again, earned.',
    },
    good: {
      title: 'You Went Home',
      line: 'You chose Quinn. You ended it clean, you left the loveliest thing you’d found in years standing in a farmhouse kitchen, and you drove back to the woman you married. It’s the right call and it doesn’t feel triumphant — it feels like grief you brought on yourself and then did the honest thing about. The affair is over. Your marriage isn’t.',
    },
    neutral: {
      title: 'You Chose Quinn, Quietly',
      line: 'No speeches, no scene. You told Elodie it was over, that it was never fair to her, and you went home to Quinn without making a production of it. Some choices are loudest when you make them plainly. The door is shut. You’re still married, and this time you know exactly what you kept.',
    },
    bad: {
      title: 'The Point Of No Return',
      line: 'You said the words. You told Elodie yes — you’ll leave Quinn — and you crossed the one line there is no walking back from. It felt like relief for exactly one second. Now it’s done, and it can’t be un-done, and some part of you already knows what’s coming: Quinn is going to find out, and you are going to lose more than you can currently imagine. You did this. On purpose. Out loud.',
    },
  },
  hintCopy: {
    highRisk: '🚩 You’re crossing a line.',
    someRisk: 'That was a step too far.',
    solid: 'You’re keeping it honest.',
    leading: 'She’s completely taken with you.',
    trailing: 'You’re the one leaning in.',
    warm: 'It feels good to be adored.',
  },
}
