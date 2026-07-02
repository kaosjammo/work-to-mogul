// ============================================================
//  Mogul Story — "The Spark" (Romance, Episode 1 of 4). A black-tie charity gala,
//  and lot seven — a rusty neon diner sign that just says EAT — turns into a
//  paddle-for-paddle duel with a stranger who turns out to be Quinn Harlow, the
//  rival CEO from the headlines. Episode 1 of 6. A 9-stage `standard` enemies-to-lovers opener on
//  the shared runtime: listen more than you flex and the night ends with a yes
//  (great AND good both advance the arc); walk away and it stays a perfect story
//  you can pick up later; showboat and you flop — stingingly, recoverably.
//  NOTE: eligibility for this story is bespoke — it is gated on the romance
//  relationship stage, not the usual Food-industry trigger (industryId is nominal).
//
//  All fictional — no real people, brands, or companies.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away choice reused on every stage (you can always let the evening rest).
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'Let the night end here',
  result: 'Some nights are better kept than spent. You make a graceful exit — unhurried, unexplained — and you could swear you feel someone watching you go.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'lot7',
    title: 'Lot Seven',
    speaker: 'narrator',
    text: 'A charity gala, black tie, a ballroom that smells like lilies and money. Lot seven is the odd one out: a rusty neon diner sign that just says EAT, half the tubes dead, salvage-yard honest among the yachts and wine lots. You raise a paddle on a whim — and across the room a stranger raises hers. You raise; she raises. Paddle for paddle, like a metronome. And she’s smiling.',
    choices: [
      {
        id: 'lot7_flex',
        label: 'Raise the paddle without looking up from your phone. Let the room see the number bores you.',
        result: 'The room sees. So does the stranger — and her smile sharpens, like you’ve just made this interesting for the wrong reason.',
        effects: { confidence: 2, risk: 2, valuationDiscipline: -1 },
        next: 'war',
      },
      {
        id: 'lot7_watch',
        label: 'Lower the paddle a beat and watch the stranger instead. Who fights this hard for a broken sign?',
        result: 'You notice things: no entourage, a thumb tapping the paddle like a countdown, and eyes that keep returning to lot seven like it owes her a memory.',
        effects: { dueDiligence: 2, leverage: 1 },
        next: 'war',
        roleBoost: 'operator',
      },
      {
        id: 'lot7_eyebrow',
        label: 'Catch her eye across the ballroom and raise an eyebrow before you raise the paddle.',
        result: 'She raises an eyebrow right back. Somewhere in there, a bid becomes a conversation.',
        effects: { confidence: 1, leverage: 1 },
        next: 'war',
      },
      walk('lot7'),
    ],
  },
  {
    id: 'war',
    title: 'The Bidding War',
    speaker: 'narrator',
    text: 'The auctioneer has abandoned the script and the room has abandoned its conversations. Lot seven is now worth more than lot three, which was a boat. The stranger doesn’t check a phone, doesn’t consult a companion — just watches you between bids, as if the sign were incidental and you were the lot.',
    choices: [
      {
        id: 'war_double',
        label: 'Double the bid in one jump. End this with a number nobody sane will follow.',
        result: 'Gasps. Scattered applause. The stranger looks neither wounded nor finished — just thoroughly entertained, which was not the plan.',
        effects: { confidence: 2, risk: 3, founderTrust: -1 },
        next: 'hammer',
      },
      {
        id: 'war_steady',
        label: 'Bid in small, patient increments. You want the sign, not the applause.',
        result: 'Calm, unhurried, unbothered. Across the room, something in the stranger’s posture shifts from combat to curiosity.',
        effects: { valuationDiscipline: 2, dueDiligence: 1, confidence: 1 },
        next: 'hammer',
        roleBoost: 'buyer',
      },
      {
        id: 'war_charity',
        label: 'Keep bidding, and mouth “it’s for charity” across the room with a shrug.',
        result: 'She mouths back "so noble" with an eye-roll you can hear from here. The duel acquires a soundtrack.',
        effects: { founderTrust: 1, leverage: 1 },
        next: 'hammer',
      },
      walk('war'),
    ],
  },
  {
    id: 'hammer',
    title: 'The Hammer',
    speaker: 'narrator',
    text: 'The hammer falls — the sign is yours, for a figure the charity will be quoting at board meetings for years. Applause, flashbulbs. And then the stranger is crossing the floor toward you with two glasses of champagne and zero embarrassment. "You overpaid," she says, offering you one. "Magnificently."',
    choices: [
      {
        id: 'hammer_brag',
        label: '“I don’t lose auctions. I don’t lose anything, actually.”',
        result: '"How exhausting for everyone," the stranger says pleasantly, and drinks the champagne she had meant to hand you.',
        effects: { confidence: 2, risk: 2, leverage: -1 },
        next: 'rival',
      },
      {
        id: 'hammer_banter',
        label: '“I overpaid for the sign. The look on your face when the hammer fell? That part was free.”',
        result: 'The laugh escapes before she can stop it — quick, real, immediately repossessed. "Fine," she concedes. "That was worth something."',
        effects: { founderTrust: 2, leverage: 1, risk: -1 },
        next: 'rival',
      },
      {
        id: 'hammer_why',
        label: '“Out of every lot in this room — why that sign?”',
        result: 'The wit pauses. "Because it’s honest," she says at last. "One word, half-broken, still on." There’s a story under that, and you both know you nearly touched it.',
        effects: { dueDiligence: 1, leverage: 1 },
        next: 'rival',
      },
      walk('hammer'),
    ],
  },
  {
    id: 'rival',
    title: 'The Headline',
    speaker: 'you',
    text: 'The stranger shifts the glass to her left hand and offers the right. "Quinn Harlow." The name detonates quietly. Harlow & Co. — the rival. The counter-bid that cost you a shipping line last spring; the quarterly calls that read like dares; the profile you claimed you never finished. You’ve studied this person’s footnotes. The temperature of the evening changes.',
    choices: [
      {
        id: 'rival_score',
        label: '“I know exactly who you are. I read your numbers every morning. They looked soft this quarter.”',
        result: '"And there it is," Quinn says, the shutters sliding halfway down. "I was starting to think you were interesting."',
        effects: { confidence: 1, risk: 3, founderTrust: -2 },
        next: 'terrace',
      },
      {
        id: 'rival_line',
        label: '“The Quinn Harlow who called acquisitions ‘adopting other people’s regrets’. I laughed at that for a week.”',
        result: 'Quinn stops mid-sip. "You read past the headline. Nobody reads past the headline." The shutters, halfway down, go back up.',
        effects: { dueDiligence: 2, valuationDiscipline: 1 },
        next: 'terrace',
      },
      {
        id: 'rival_light',
        label: 'Shake the hand. “That explains the bidding. Your reputation for not blinking is well earned.”',
        result: '"And yours for buying the room is under-reported," Quinn returns — but she’s still standing here, which is its own information.',
        effects: { leverage: 1, valuationDiscipline: 1 },
        next: 'terrace',
      },
      walk('rival'),
    ],
  },
  {
    id: 'terrace',
    title: 'The Terrace',
    speaker: 'protagonist',
    text: 'The terrace bar, later. "Everyone in that ballroom wants something from me," Quinn says, claiming a corner stool like it owes her rent. "A term sheet, a quote, a kidney. You wanted a broken diner sign. I can’t decide if that’s the dumbest or the most honest thing I’ve seen all year." Behind the bar, an elderly espresso machine coughs; Quinn regards it with real tenderness. "Mine’s older than that. Louder. People keep telling me to replace it."',
    choices: [
      {
        id: 'terrace_bottle',
        label: 'Signal the bartender and order the most expensive bottle on the list without reading it.',
        result: '"Ah," Quinn says, in the tone of someone updating a spreadsheet. "You’re one of those." The bottle arrives. It tastes like a missed exit.',
        effects: { confidence: 2, risk: 2, valuationDiscipline: -1 },
        next: 'barb',
      },
      {
        id: 'terrace_machine',
        label: '“Don’t replace it. So — what would you have done with the sign?” Then actually wait for the answer.',
        result: 'Quinn blinks at the question behind the question. The answer starts flippant and lands somewhere true, and you keep every word of it.',
        effects: { dueDiligence: 2, founderTrust: 2, risk: -1 },
        next: 'barb',
        roleBoost: 'operator',
      },
      {
        id: 'terrace_trade',
        label: 'Trade her one true story about your worst quarter for one of hers.',
        result: 'A fair exchange, honestly brokered. Quinn’s story is funnier and sadder than the headlines ever told it.',
        effects: { founderTrust: 1, valuationDiscipline: 1 },
        next: 'barb',
      },
      walk('terrace'),
    ],
  },
  {
    id: 'barb',
    title: 'The Test',
    speaker: 'protagonist',
    text: 'Quinn sets the glass down with the click of a chess piece. "Question. And I’ll know if you rehearse the answer." A measured pause. "Is everything a transaction to you? The gala, the sign, this drink — me. Is there one thing in your week that doesn’t have a return baked in?" Her voice is light. Her eyes are not.',
    choices: [
      {
        id: 'barb_mic',
        label: '“Everything’s a transaction. That’s why I win.” Grin like it’s a mic drop.',
        result: 'The temperature drops four degrees. "Thank you for your candour," Quinn says, in the voice she uses on analysts.',
        effects: { confidence: 1, risk: 3, founderTrust: -2 },
        next: 'gran',
      },
      {
        id: 'barb_true',
        label: '“Most things, honestly. It’s simpler that way. Tonight keeps refusing to fit the model, and I haven’t decided how I feel about that.”',
        result: 'Silence — the good kind. "Huh," Quinn says at last, softer than anything she’s said all night. "An honest answer. Those trade at a premium."',
        effects: { valuationDiscipline: 2, founderTrust: 2, risk: -1 },
        next: 'gran',
        roleBoost: 'closer',
      },
      {
        id: 'barb_turn',
        label: '“You bid on a rusted sign until it cost real money. You tell me what a transaction looks like.”',
        result: 'Quinn’s mouth twitches — caught, and not entirely unhappy about it. "Deflection," she notes. "Competent deflection."',
        effects: { leverage: 2, dueDiligence: 1 },
        next: 'gran',
      },
      walk('barb'),
    ],
  },
  {
    id: 'gran',
    title: 'The Sign',
    speaker: 'protagonist',
    text: 'Quinn turns the glass a slow quarter-turn, and something in her posture unlocks. "My gran ran a diner," she says, mostly to the skyline. "Neon sign over the door, half the letters burnt out, so it just said EAT. She’d flip it on at five in the morning and call it her sunrise." A breath. "I saw lot seven in the catalogue and — I wasn’t bidding against you. I was bidding against time." She stops, visibly surprised at her own mouth.',
    choices: [
      {
        id: 'gran_buy',
        label: '“I’ll have a new one made for you. Custom. Any word you like, every letter working.”',
        result: '"Every letter working," Quinn repeats slowly, and you hear it land wrong — you’ve offered to fix the exact thing that made it hers. The skyline gets her attention back.',
        effects: { confidence: 1, risk: 2, dueDiligence: -1, founderTrust: -1 },
        next: 'valet',
      },
      {
        id: 'gran_ask',
        label: 'Say nothing clever. Ask the diner’s name, and where it stood.',
        result: '"Rosie’s. Corner of nowhere and a county road." Quinn talks for ten unguarded minutes, and you keep every detail like it’s due diligence on something priceless.',
        effects: { dueDiligence: 2, founderTrust: 2, leverage: 1 },
        next: 'valet',
      },
      {
        id: 'gran_give',
        label: '“Then it was never my sign to win. It’s yours — no trade, no terms.”',
        result: 'Quinn goes very still. "I’ll pay you back," she says automatically, and then, quieter: "Nobody’s done that in a while."',
        effects: { founderTrust: 2, valuationDiscipline: 1 },
        next: 'valet',
      },
      walk('gran'),
    ],
  },
  {
    id: 'valet',
    title: 'The Valet',
    speaker: 'narrator',
    text: 'Coats. The valet lane. The city doing its glittering thing beyond the awning while someone’s taillights write red cursive down the avenue. Behind you, lot seven is being crated with more care than it has known in forty years. Quinn stands holding a claim ticket and, notably, not handing it to the valet. A pause opens — the kind you could park a whole other life inside.',
    choices: [
      {
        id: 'valet_card',
        label: 'Produce a business card. “My people will set something up with your people.”',
        result: 'Quinn looks at the card like it’s a subpoena. "People," she repeats. The pause you could have lived in closes, politely.',
        effects: { risk: 2, founderTrust: -1, leverage: -1 },
        next: 'ask',
      },
      {
        id: 'valet_rosie',
        label: '“For what it’s worth — I think I’d have liked Rosie’s. Terrible coffee, sunrise at five, all of it.”',
        result: 'Quinn’s guard doesn’t drop so much as forget its job. "The coffee was legendarily bad," she agrees, and neither of you signals the valet.',
        effects: { founderTrust: 2, valuationDiscipline: 1, leverage: 1, risk: -1 },
        next: 'ask',
      },
      {
        id: 'valet_joke',
        label: '“Admit it — losing that sign to anyone else tonight would have ruined your whole quarter.”',
        result: '"Catastrophically," Quinn says, deadpan. The banter is back, and it’s carrying something heavier than banter now.',
        effects: { leverage: 1, confidence: 1 },
        next: 'ask',
      },
      walk('valet'),
    ],
  },
  {
    id: 'ask',
    title: 'Ten Seconds',
    speaker: 'you',
    text: 'Quinn’s car pulls up. Yours idles behind it. Ten seconds, maybe less, before tonight becomes a story you tell instead of a thing that’s happening. You’ve closed nine-figure deals on tighter clocks — and not one of them ever made your pulse do this.',
    choices: [
      {
        id: 'ask_bold',
        label: '“Have dinner with me. Saturday. Somewhere with terrible coffee and a sign that barely works.”',
        effects: { confidence: 2, leverage: 1 },
        next: 'invest',
      },
      {
        id: 'ask_soft',
        label: '“I don’t know what tonight was. I’d like to find out — slowly, off the record, no press releases.”',
        result: 'It comes out quieter than you meant, and truer.',
        effects: { founderTrust: 2, valuationDiscipline: 1, dueDiligence: 1 },
        next: 'invest',
        roleBoost: 'closer',
      },
      walk('ask'),
    ],
  },
]

export const ROMANCE_SPARK: MogulStory = {
  id: 'love_spark',
  industryId: 'food',
  icon: '💘',
  title: 'The Spark',
  hook: 'Someone keeps outbidding you at the charity auction.',
  subject: 'The Auction',
  protagonist: 'Quinn Harlow',
  length: 'standard',
  firstStage: 'lot7',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: '“One Date. Don’t Be Boring.”',
      line: 'Quinn stares at you for three long seconds, then laughs — a real one, ambushed out of her. "One date. Don’t be boring." She’s in the car before you can gloat, but the window rolls down: "Bring the sign."',
    },
    good: {
      title: 'A Guarded Yes',
      line: 'Quinn studies you like a term sheet with one suspicious clause, then nods. "Fine. One dinner. If you say ‘synergy’ I’m leaving." It isn’t fireworks — it’s better. It’s real, and it’s a yes.',
    },
    neutral: {
      title: 'A Perfect Story',
      line: 'You let the night end where it peaked. Quinn half-smiles across the valet lane — no numbers exchanged, nothing spent, nothing spoiled — and the whole evening stays a story you’ll both privately keep. The city is small. It isn’t over.',
    },
    bad: {
      title: 'The Bill and the Sign',
      line: 'You flexed the net worth one time too many and watched the light go out of the banter. Quinn wishes lot seven "a better home than the ego it’s marrying" and leaves you with the bill and the sign. It stings. But the city is small, and so is the circuit — this isn’t over.',
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
