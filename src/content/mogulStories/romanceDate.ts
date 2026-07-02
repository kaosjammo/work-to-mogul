// ============================================================
//  Mogul Story — "The First Date" (Romance arc, Episode 2 of 4). Quinn Harlow —
//  rival CEO, dry wit, allergic to flattery — actually said yes, and picked the venue:
//  a hole-in-the-wall diner with a temperamental espresso machine. Everything is a
//  test tonight: what you order, where your phone lives, how you pay a two-digit
//  check, and whether you remember why a neon sign that just says EAT matters. An
//  8-stage `standard` romance on the shared runtime (sincerity and attention win;
//  performing wealth at a diner does not). industryId 'food' is trigger context
//  only — eligibility is bespoke, gated on the romance arc's relationship stage.
//
//  All fictional — no real people, brands, or companies.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away choice reused on every stage (you can always end the evening gracefully).
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'Let the night end here',
  result: 'Some evenings are complete exactly as they are. You say goodnight like you mean it — because you do — and Quinn, of all people, respects a clean exit.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'venue',
    title: 'The Venue',
    speaker: 'narrator',
    text: 'The address Quinn texted turns out to be a hole-in-the-wall diner wedged between a laundromat and a locksmith — five booths, a counter, and an espresso machine that hisses like it holds grudges. Quinn is already in the corner booth, watching your face as you take it in. This is not a venue. This is a test.',
    choices: [
      {
        id: 'venue_upgrade',
        label: 'Joke that you know a place with a tasting menu and a wine cellar.',
        result: 'Quinn’s smile stays exactly the same and drops ten degrees. “There it is,” she says, mostly to her coffee.',
        effects: { risk: 2, founderTrust: -2, leverage: -1 },
        next: 'order',
      },
      {
        id: 'venue_settle',
        label: 'Slide into the booth like you belong there. “Good light, better smell. You’ve been coming here for years.”',
        result: 'Quinn blinks — you read the room instead of grading it. “Fifteen years,” she admits. First test: passed.',
        effects: { dueDiligence: 2, founderTrust: 2, risk: -1 },
        next: 'order',
        roleBoost: 'operator',
      },
      {
        id: 'venue_honest',
        label: '“I was braced for a rooftop and a dress code. This is better.”',
        result: '“Everyone’s braced for a rooftop,” Quinn says, pleased. “That’s how I sort people.”',
        effects: { confidence: 1, founderTrust: 1 },
        next: 'order',
      },
      walk('venue'),
    ],
  },
  {
    id: 'order',
    title: 'The Order',
    speaker: 'narrator',
    text: 'The menu is laminated and older than some of your companies. Gus, the counterman, arrives with a pencil behind his ear and the patience of a glacier. Quinn orders “the usual” without looking at anything. Your move.',
    choices: [
      {
        id: 'order_offmenu',
        label: 'Ask for something off-menu — deconstructed, substituted, impressive.',
        result: 'Gus writes nothing. Quinn studies the ceiling like it might rescue you. It does not.',
        effects: { risk: 3, valuationDiscipline: -2, leverage: -1 },
        next: 'phones',
      },
      {
        id: 'order_askgus',
        label: '“What should I get, Gus? Honest answer.”',
        result: '“Hash special, eggs over, don’t touch the hot sauce unless you mean it.” You take the advice like a stock tip, and Quinn watches you do it. Approval — faint, but real.',
        effects: { dueDiligence: 2, valuationDiscipline: 1, founderTrust: 1 },
        next: 'phones',
        roleBoost: 'buyer',
      },
      {
        id: 'order_match',
        label: '“I’ll have whatever the usual is.”',
        result: '“Bold,” Quinn says. “The usual has opinions.” But she’s smiling when she says it.',
        effects: { confidence: 1, leverage: 1 },
        next: 'phones',
      },
      walk('order'),
    ],
  },
  {
    id: 'phones',
    title: 'House Rule',
    speaker: 'protagonist',
    text: '"House rule." Quinn sets her phone face-down between the napkin dispenser and the hot sauce, screen dark. "The empires can burn for ninety minutes. Both of ours." She looks at you over the rim of a chipped coffee cup, waiting to see what you do with your hands.',
    choices: [
      {
        id: 'phones_hedge',
        label: 'Set yours face-up. “I just need line of sight. Big week.”',
        result: '“Line of sight,” Quinn repeats, in the tone she reserves for bad quarterly numbers.',
        effects: { risk: 2, dueDiligence: -1 },
        next: 'buzz',
      },
      {
        id: 'phones_down',
        label: 'Set it face-down next to hers without a word, screens together.',
        result: '“That’s either very smooth or deeply corny,” Quinn observes. She doesn’t move the phones apart, though.',
        effects: { founderTrust: 2, valuationDiscipline: 2, risk: -1 },
        next: 'buzz',
      },
      {
        id: 'phones_stakes',
        label: '“Counter-offer: first one to check pays the bill and admits weakness.”',
        result: '“You’re gambling with a professional,” Quinn says — and shakes on it anyway.',
        effects: { confidence: 2, leverage: 1 },
        next: 'buzz',
      },
      walk('phones'),
    ],
  },
  {
    id: 'buzz',
    title: 'The Buzz',
    speaker: 'narrator',
    text: 'Twenty minutes in — right as Quinn is mid-story about a hostile takeover she once won with a fruit basket — your pocket buzzes. Then again. Then a third time: the pattern your assistant only uses when something is on fire and the fire is expensive.',
    choices: [
      {
        id: 'buzz_take',
        label: '“I’m so sorry — two minutes.” Step outside and take it.',
        result: 'Through the window you can see Quinn very deliberately not watching you. The espresso machine hisses. It sounds like a verdict.',
        effects: { risk: 3, founderTrust: -2, valuationDiscipline: -1 },
        next: 'gran',
      },
      {
        id: 'buzz_sneak',
        label: 'Nod along to Quinn’s story while reading the email under the table.',
        result: 'Quinn stops mid-sentence. “The fruit basket was full of bees. Just checking.” You heard none of it. She noticed all of it.',
        effects: { risk: 2, dueDiligence: -1, leverage: -1 },
        next: 'gran',
      },
      {
        id: 'buzz_kill',
        label: 'Hold the power button until the phone dies. “You were saying — the fruit basket.”',
        result: '“It can wait?” Quinn asks. “It can burn,” you say. Something in her expression un-crosses its arms. You built a company that survives ninety minutes without you — that’s the flex.',
        effects: { dueDiligence: 1, valuationDiscipline: 2, founderTrust: 1, risk: -1 },
        next: 'gran',
        roleBoost: 'operator',
      },
      walk('buzz'),
    ],
  },
  {
    id: 'gran',
    title: 'The Real Talk',
    speaker: 'protagonist',
    text: '"You want to know why a diner." Quinn turns her cup a slow quarter-turn. "My gran ran one. Two counters, five booths, a neon sign out front that just said EAT — no name, no slogan. Her whole philosophy in one word. It went under when I was twelve. The bank took everything except the sign." She stops turning the cup. "I don’t tell people that."',
    choices: [
      {
        id: 'gran_pivot',
        label: '“I get it — my first company nearly died too. So there I was, twenty-three, leveraged to the eyebrows—”',
        result: 'You just took the most fragile thing Quinn owns and used it as a segue. She flags down more coffee like it’s a lifeboat.',
        effects: { risk: 2, founderTrust: -1, leverage: -1 },
        next: 'bill',
      },
      {
        id: 'gran_sign',
        label: '“The charity auction. That’s why you bid like that on the EAT sign — it was hers.”',
        result: 'Quinn goes very still. “You remembered,” she says, quietly, like it costs something. “Nobody ever connects it.” The armor doesn’t come off — but it unbuckles.',
        effects: { dueDiligence: 3, founderTrust: 2, leverage: 1 },
        next: 'bill',
      },
      {
        id: 'gran_listen',
        label: 'Don’t fill the silence. Then, gently: “What was she like — your gran?”',
        result: '“Terrifying. Kind. Kept a wrench behind the register for the espresso machine — the same machine that’s in my office now.” Quinn laughs at something far away. “You’d have liked her.”',
        effects: { founderTrust: 2, valuationDiscipline: 1 },
        next: 'bill',
      },
      walk('gran'),
    ],
  },
  {
    id: 'bill',
    title: 'The Bill',
    speaker: 'narrator',
    text: 'Gus slides the check onto the table face-down — the international signal that someone has to make a decision. It’s a two-digit number. You have tipped valets more. Quinn’s hand and yours reach the little tray at the same moment, and neither withdraws.',
    choices: [
      {
        id: 'bill_flash',
        label: 'Produce the heavy black card and tell Gus to “take care of everyone in here.”',
        result: 'Gus takes the card, because Gus isn’t proud. Quinn watches you turn a two-digit check into a performance. “The diner isn’t a stage,” she says — lightly, in the way that means it wasn’t light.',
        effects: { risk: 3, valuationDiscipline: -2 },
        next: 'stroll',
      },
      {
        id: 'bill_simple',
        label: 'Pay in cash, quietly — the right number plus a good tip, folded under the sugar.',
        result: 'No flourish, no announcement. Gus finds it later and nods at you like a colleague. Quinn clocks the entire transaction and pretends she didn’t.',
        effects: { valuationDiscipline: 2, dueDiligence: 1, founderTrust: 1 },
        next: 'stroll',
        roleBoost: 'buyer',
      },
      {
        id: 'bill_next',
        label: '“Yours. On one condition — the next one’s mine, and I’m picking somewhere with a laminated menu.”',
        result: '“Did you just leverage a diner check into a second date?” Quinn says. “That’s the most romantic thing a rival has ever done to me.”',
        effects: { leverage: 2, confidence: 1 },
        next: 'stroll',
      },
      walk('bill'),
    ],
  },
  {
    id: 'stroll',
    title: 'The Walk After',
    speaker: 'narrator',
    text: 'Outside, the street is all wet asphalt and orange streetlight. Quinn walks slowly — noticeably slowly, for a person who conducts board meetings at a jog — hands in pockets, shoulder almost touching yours. Behind you the diner’s neon buzzes. Neither of you has mentioned where you parked.',
    choices: [
      {
        id: 'stroll_speech',
        label: 'Stop under the streetlight and deliver the speech you’ve been drafting since the appetizer.',
        result: 'It’s a good speech. It is also, unmistakably, a speech. Quinn listens with the expression of someone being pitched at.',
        effects: { risk: 2, confidence: 1, leverage: -1 },
        next: 'night',
      },
      {
        id: 'stroll_notice',
        label: '“You slowed down,” you say. “You never slow down.”',
        result: '“I’m aware,” Quinn tells the pavement. Then, quieter: “Don’t make it a thing.” You don’t. It becomes a thing anyway, gently.',
        effects: { dueDiligence: 2, founderTrust: 2, risk: -1 },
        next: 'night',
      },
      {
        id: 'stroll_banter',
        label: '“For the record, the hash special could carry a franchise.”',
        result: '“Don’t you dare franchise it.” But the laugh that escapes is the unguarded one — the one that never appears at conferences.',
        effects: { confidence: 2, leverage: 1 },
        next: 'night',
      },
      walk('stroll'),
    ],
  },
  {
    id: 'night',
    title: 'The Goodnight',
    speaker: 'protagonist',
    text: 'You end up outside Quinn’s building anyway, both of you pretending it was on the way. Quinn turns, backlit, keys in hand, and does not reach for the door. "Well," she says. "Statistically, this is where the evening ends." She doesn’t move. The word statistically is doing a great deal of work.',
    choices: [
      {
        id: 'night_kiss',
        label: 'Close the distance — slow, sure, and stoppable — and kiss her goodnight.',
        result: 'Stoppable was the important part. Quinn doesn’t stop it.',
        effects: { confidence: 2, founderTrust: 1 },
        next: 'invest',
        roleBoost: 'closer',
      },
      {
        id: 'night_plan',
        label: '“Thursday. Somewhere with a laminated menu. I’m not asking to be polite — I’ll spend the whole week thinking about it either way.”',
        result: 'Plain words, no armor, a date with a day attached. Quinn looks at you like you’ve done something genuinely underhanded: been sincere.',
        effects: { valuationDiscipline: 1, dueDiligence: 1, founderTrust: 1 },
        next: 'invest',
      },
      {
        id: 'night_walk',
        label: '“Goodnight, Quinn.” Nothing more — and mean every letter of it.',
        effects: {},
        next: 'walkaway',
        walkAway: true,
      },
    ],
  },
]

export const ROMANCE_DATE: MogulStory = {
  id: 'love_first_date',
  industryId: 'food',
  icon: '🌹',
  title: 'The First Date',
  hook: 'Quinn Harlow actually said yes.',
  subject: 'The First Date',
  protagonist: 'Quinn Harlow',
  length: 'standard',
  firstStage: 'venue',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: '“Okay. You’re Not Boring.”',
      line: 'The kiss lands — or the plan does, which with Quinn amounts to the same thing. “Okay,” she murmurs. “You’re not boring.” From Quinn Harlow, that is a declaration of intent. Thursday is already circled, and somewhere an ancient espresso machine hisses its blessing.',
    },
    good: {
      title: 'A Warm Goodnight',
      line: 'No fireworks — just the steady kind of warmth that outlasts them. Quinn says yes to Thursday before you’ve finished asking, then pretends she was going to suggest it anyway. The second date is real. So was the smile she carried down the hall.',
    },
    neutral: {
      title: 'Left Perfect',
      line: 'One lovely evening, ended on your own terms — no push, no overtime. Quinn respects a clean exit more than almost anything, and the look she gives you says the ledger stays open. Some other night, then.',
    },
    bad: {
      title: 'Quinn Notices Everything',
      line: 'You performed wealth at a diner and took the call — and Quinn, who misses nothing, watched every second of it. The goodnight is polite and five degrees too cool. The door isn’t closed. But you can hear how close it came.',
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
