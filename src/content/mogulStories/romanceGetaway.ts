// ============================================================
//  Mogul Story — "The Getaway" (Romance, episode 3 of 6). Months into the thing with
//  Quinn Harlow, she books a coastal cottage weekend with exactly one rule: no laptops.
//  Then the rain kills every plan, your empire catches fire with Harlow & Co. on the
//  other side of the clashing deal, and somewhere between board games, a sulking
//  espresso machine, and a 2am beach, three words start demanding to be said first.
//  An 8-stage `standard` romance beat on the shared runtime — eligibility is bespoke,
//  gated on the relationship stage (this episode only offers after episode 2 lands).
//
//  All fictional — no real people, brands, or companies.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away choice reused on every stage (you can always let the moment keep).
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'Let the weekend stay simple',
  result: 'You ease off, gently, and let the coast be the coast. Quinn doesn’t push — whatever this is, it’ll keep, and the door stays wide open.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'rule',
    title: 'The One Rule',
    speaker: 'narrator',
    text: 'Months in, and Quinn Harlow — rival CEO, dry wit, undefeated at everything — hands you a key and a printed itinerary for a cottage on the coast. One rule, taped to the door in Quinn’s handwriting: NO LAPTOPS. “The empires will survive us for two days,” she says. “Probably.”',
    choices: [
      {
        id: 'rule_smuggle',
        label: 'Bring the laptop anyway — buried under the sweaters, “just for emergencies.”',
        result: 'You know it’s there, humming under the knitwear. Somehow, you suspect Quinn knows it’s there too.',
        effects: { confidence: 1, risk: 2, founderTrust: -1 },
        next: 'rain',
      },
      {
        id: 'rule_prep',
        label: 'Leave it at home — and brief your best people so nothing needs you until Monday.',
        result: 'Two days off isn’t luck, it’s logistics. You did the work all week so you could actually be here.',
        effects: { valuationDiscipline: 2, dueDiligence: 1, risk: -1 },
        next: 'rain',
        roleBoost: 'operator',
      },
      {
        id: 'rule_gift',
        label: 'Arrive laptop-free, carrying the battered sci-fi paperback Quinn mentioned once, months ago.',
        result: 'Quinn stares at the book, then at you. “You remembered that?” You did.',
        effects: { dueDiligence: 2, founderTrust: 1 },
        next: 'rain',
      },
      walk('rule'),
    ],
  },
  {
    id: 'rain',
    title: 'The Deluge',
    speaker: 'narrator',
    text: 'Day one. The forecast lied. Rain hits the coast sideways, drowning the lighthouse walk, the harbour lunch, the cliff path at golden hour — every line of an itinerary Quinn clearly spent weeks building and is now pretending, very badly, not to care about.',
    choices: [
      {
        id: 'rain_city',
        label: '“We could just head back to the city. Everything works there.”',
        result: 'Quinn’s face does something complicated and then goes politely blank. Wrong coast, wrong answer.',
        effects: { risk: 2, founderTrust: -2 },
        next: 'ping',
      },
      {
        id: 'rain_own',
        label: '“You planned the lighthouse down to the minute, didn’t you? We’re doing it anyway. In the rain. It’ll be terrible and it’ll be ours.”',
        result: 'Quinn tries not to smile and loses. Twenty minutes later you’re both soaked to the bone and neither of you has stopped laughing.',
        effects: { founderTrust: 2, dueDiligence: 1, leverage: 1 },
        next: 'ping',
      },
      {
        id: 'rain_forage',
        label: 'Raid the cottage: firewood, blankets, a shelf of ancient board games. Build a plan B worth having.',
        result: 'By the time the kettle’s on and the fire catches, the storm outside has started to feel like a feature.',
        effects: { valuationDiscipline: 1, founderTrust: 1 },
        next: 'ping',
      },
      walk('rain'),
    ],
  },
  {
    id: 'ping',
    title: 'The Crisis Ping',
    speaker: 'narrator',
    text: 'Your phone shudders on the windowsill: a genuine fire. The Meridian deal is coming apart tonight, your board is spiralling — and the counterparty doing the squeezing is Harlow & Co. Quinn’s company. Quinn, who is currently in the kitchen, humming, losing a fight with a corkscrew.',
    choices: [
      {
        id: 'ping_hide',
        label: 'Take the call in the bathroom. Forty minutes of whispered strategy, then: “That? Nothing. Work thing.”',
        result: 'Quinn doesn’t ask again. The silence where the question should be is worse than any argument.',
        effects: { risk: 3, founderTrust: -2, dueDiligence: -1 },
        next: 'games',
      },
      {
        id: 'ping_open',
        label: '“Quinn — my fire this weekend is Meridian, and your side is the one squeezing. I’m handing it to my deputy and firewalling it. I just didn’t want it sitting between us unsaid.”',
        result: 'Quinn sets down the corkscrew. “Monday, my people will eat yours alive. Tonight — thank you for telling me.”',
        effects: { valuationDiscipline: 2, founderTrust: 2, dueDiligence: 1 },
        next: 'games',
      },
      {
        id: 'ping_porch',
        label: 'One crisp call on the porch, in full view — ten minutes, delegate, done. Then the phone goes in the biscuit tin.',
        result: 'Handled, visible, over. Quinn watches the phone disappear into the tin and says nothing about it. Approvingly.',
        effects: { valuationDiscipline: 1, confidence: 1, dueDiligence: 1 },
        next: 'games',
      },
      walk('ping'),
    ],
  },
  {
    id: 'games',
    title: 'House Rules',
    speaker: 'protagonist',
    text: '“House rules,” Quinn says, dealing cards by firelight. In the corner, unpacked from her car like a family heirloom, sits the ancient espresso machine from her office — the temperamental one she refuses to replace. “It sulks in new places,” she warns. “Don’t take it personally.”',
    choices: [
      {
        id: 'games_gloat',
        label: 'Destroy Quinn at cards, mercilessly, and narrate every winning hand.',
        result: 'You won the game. Quinn’s eyebrow suggests you lost something with considerably better odds.',
        effects: { confidence: 2, risk: 2, founderTrust: -1 },
        next: 'open',
      },
      {
        id: 'games_coax',
        label: 'While Quinn deals, coax the espresso machine: hold the valve, count to three, apologise to it — the exact ritual you watched Quinn perform months ago.',
        result: 'It gurgles, sulks, and produces two perfect cups. Quinn stares. “It doesn’t do that for anyone.” It did for you.',
        effects: { dueDiligence: 2, founderTrust: 2, risk: -1 },
        next: 'open',
        roleBoost: 'buyer',
      },
      {
        id: 'games_rival',
        label: 'Play properly — full rivalry, no mercy asked or given, and grin the whole time.',
        result: 'Quinn wins two, you win two, and the trash talk gets genuinely competitive. This is the good kind of war.',
        effects: { confidence: 1, leverage: 1 },
        next: 'open',
      },
      walk('games'),
    ],
  },
  {
    id: 'open',
    title: 'The Armour',
    speaker: 'protagonist',
    text: 'Late. Fire low. Quinn turns a chess piece over in her fingers and doesn’t look at you. “You know what nobody tells you about being the person across the table? Everyone wants a piece of the company, or a piece of the legend. I stopped bringing people here years ago. It got easier to just… be the armour.” A pause. “You’re the first in a long time.”',
    choices: [
      {
        id: 'open_topthat',
        label: '“I know exactly what you mean — when I closed my third acquisition, the loneliness was unreal—”',
        result: 'You turned her confession into your anecdote. Quinn nods, and the armour slides quietly back on.',
        effects: { confidence: 1, risk: 2, leverage: -1 },
        next: 'fight',
      },
      {
        id: 'open_listen',
        label: 'Say nothing clever. Ask one small question — “When did it get easier to stop trying?” — and then just listen.',
        result: 'Quinn talks for a long time, in a voice you haven’t heard before. Later she’ll pretend she didn’t. You’ll both know she did.',
        effects: { dueDiligence: 2, founderTrust: 2 },
        next: 'fight',
      },
      {
        id: 'open_match',
        label: 'Offer your own truth back, brief and unvarnished: the empty penthouse, the calendar full of people who want something.',
        result: '“Look at us,” Quinn says softly. “Two fortresses comparing moats.” But she’s moved closer on the couch.',
        effects: { founderTrust: 2, valuationDiscipline: 1 },
        next: 'fight',
      },
      walk('open'),
    ],
  },
  {
    id: 'fight',
    title: 'The Near-Fight',
    speaker: 'narrator',
    text: 'It starts as a joke about Meridian and stops being one in under a minute. Quinn’s voice gets that boardroom edge; yours answers it. Suddenly you’re both standing, and you realise — with the strange clarity of a person holding a match in a dry field — that you have the better facts, and you could win this.',
    choices: [
      {
        id: 'fight_win',
        label: 'Win it. Deploy every fact, every number, every weakness in Harlow & Co.’s position. Take the point.',
        result: 'You win the argument. Quinn goes quiet and precise, the way she does with opponents. You’ve just been reclassified.',
        effects: { confidence: 1, leverage: 1, risk: 3, founderTrust: -2 },
        next: 'beach',
      },
      {
        id: 'fight_repair',
        label: 'Stop mid-sentence. “I don’t want to win this one. Monday our companies can fight — I’ll even make it a fair fight. Tonight I’m not the counterparty. I’m just yours.”',
        result: 'The edge goes out of the room like a tide. “That was disgustingly sincere,” Quinn mutters, and reaches for your hand.',
        effects: { founderTrust: 3, valuationDiscipline: 2, risk: -1 },
        next: 'beach',
        roleBoost: 'closer',
      },
      {
        id: 'fight_pause',
        label: 'Call a timeout. Make two terrible espressos, hand one over, and restart the conversation somewhere gentler.',
        result: 'The machine sulks; the coffee is dreadful; the ritual works anyway. You both climb down without saying the word “sorry” out loud.',
        effects: { dueDiligence: 1, founderTrust: 1, risk: -1 },
        next: 'beach',
      },
      walk('fight'),
    ],
  },
  {
    id: 'beach',
    title: 'Two A.M. Clear',
    speaker: 'narrator',
    text: 'Two in the morning, and the storm just — stops. Quinn shakes you half-awake, grinning like a co-conspirator, and marches you down to the beach in borrowed boots. The clouds have torn open. The sea is glass and starlight. Neither of you has said a word in ten minutes, and it isn’t awkward at all.',
    choices: [
      {
        id: 'beach_perform',
        label: 'Fill the silence — a joke, a story, a remark about the view. Perform a little.',
        result: 'Quinn hums politely at the punchline. The silence had been saying something better.',
        effects: { confidence: 1, risk: 2, leverage: -1 },
        next: 'say',
      },
      {
        id: 'beach_sign',
        label: '“You still have the EAT sign plugged in, don’t you. In your hallway. From the auction.” — say it quietly, like the secret it is.',
        result: 'A long pause. “It’s a design statement.” Another pause. “…It’s the night I met you, shut up.” The starlight is doing something to Quinn’s eyes.',
        effects: { dueDiligence: 2, founderTrust: 2, leverage: 1 },
        next: 'say',
      },
      {
        id: 'beach_hand',
        label: 'Say nothing. Take Quinn’s hand.',
        result: 'Cold fingers lace through yours like they were waiting for the invitation. The sea keeps time.',
        effects: { founderTrust: 2, confidence: 1 },
        next: 'say',
      },
      walk('beach'),
    ],
  },
  {
    id: 'say',
    title: 'Three Words',
    speaker: 'you',
    text: 'The words have been sitting in your chest since the espresso machine forgave you — maybe since the rain, maybe since the auction. Quinn stands beside you, salt in her hair, watching the horizon like it owes her money. You could say it right now. First. Out loud. No armour.',
    choices: [
      {
        id: 'say_plain',
        label: '“Quinn. I love you.” — plain, unhedged, first.',
        effects: { confidence: 2, founderTrust: 1 },
        next: 'invest',
      },
      {
        id: 'say_detail',
        label: '“I love you. I’ve known since you apologised to a coffee machine and it worked — since you rebuilt a ruined itinerary in the rain and called it mine too. I love the person under the armour.”',
        result: 'Every word specific, every word true. Nobody has ever accused Quinn Harlow of being seen before.',
        effects: { founderTrust: 2, dueDiligence: 1, valuationDiscipline: 1 },
        next: 'invest',
        roleBoost: 'operator',
      },
      {
        id: 'say_wait',
        label: 'Keep it a little longer. Some words deserve their own perfect night.',
        effects: {},
        next: 'walkaway',
        walkAway: true,
      },
    ],
  },
]

export const ROMANCE_GETAWAY: MogulStory = {
  id: 'love_getaway',
  industryId: 'food',
  icon: '🏝️',
  title: 'The Getaway',
  hook: 'Quinn booked a weekend away — no laptops allowed.',
  subject: 'The Getaway',
  protagonist: 'Quinn Harlow',
  length: 'standard',
  firstStage: 'rule',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: '“I Love You Too, You Absolute Menace”',
      line: 'You said it first, armour off, details right — the machine, the rain, the sign that says EAT. Quinn stares at you for one terrifying second, then breaks into the smile she never uses in boardrooms: “I love you too, you absolute menace.” The horizon can wait.',
    },
    good: {
      title: 'Said Back, Quietly',
      line: 'You said it first. Quinn goes very still — long enough for the sea to fill the silence — then smiles, takes your hand, and says it back, quietly, like a signature on something binding. It’s mutual. It was worth the storm.',
    },
    neutral: {
      title: 'Unspoken, For Now',
      line: 'You let the words keep. The weekend stays perfect — the rain, the cards, the 2am beach — and what’s unspoken hums along underneath it all, patient. Some things can wait for their own perfect night. This one will come.',
    },
    bad: {
      title: 'The Long Drive Home',
      line: 'Somewhere between the hidden laptop and the argument you had to win, you picked the deal over the person — on the one weekend with a single rule. Quinn drives you both home early, radio on, politely unreadable. It isn’t over. But the redo will have to be earned.',
    },
  },
  hintCopy: {
    highRisk: '💔 You\u2019re losing her.',
    someRisk: 'That landed a little awkwardly.',
    solid: 'You\u2019re really listening \u2014 and it shows.',
    leading: 'She\u2019s leaning in.',
    trailing: 'You\u2019re chasing the conversation.',
    warm: 'There\u2019s real chemistry here.',
  },
}
