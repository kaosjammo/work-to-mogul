// ============================================================
//  Mogul Story — "The Question" (Romance, Episode 4 of 4 — the finale). The ring has
//  been in your pocket for three weeks and Quinn Harlow — rival, partner, owner of one
//  ancient espresso machine — has started to notice. Pick the place, get the blessing,
//  survive the fake-out, and bring the rusty neon EAT sign home for the backdrop. Ask
//  it true and simple and the answer is yes; over-produce it and the ring goes back in
//  the pocket (a setback, never a breakup). A 9-stage `standard` proposal on the shared
//  runtime. industryId is 'food' for trigger context only — eligibility is bespoke,
//  gated on the relationship stage (the first three episodes), not on the Food industry.
//
//  All fictional — no real people, brands, or companies.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away choice reused on every stage (the ring keeps — there is always another night).
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'Not tonight. Keep the ring a little longer.',
  result: 'You fold the plan away, gently. The ring keeps its secret, and nothing between you is any smaller for the waiting.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'ring',
    title: 'Three Weeks',
    speaker: 'narrator',
    text: 'The ring has been in your left inside pocket for three weeks. Through two board meetings, a quarterly review, and one long weekend, it has sat there with the specific gravity of a small collapsed star. Quinn has nearly caught you touching it twice. Tonight, walking past the auction house where you first met, you feel it again — not doubt. Weight. There’s a difference, and it’s time to learn which one you’re carrying.',
    choices: [
      {
        id: 'ring_check',
        label: 'Take it out at the office to check it again. Fourth time today.',
        result: 'Your head of comms sees the box before you can palm it. Now two people in the building are terrified.',
        effects: { risk: 2, leverage: -1 },
        next: 'venue',
      },
      {
        id: 'ring_decide',
        label: 'Stop carrying it like contraband. Start carrying it like a decision.',
        result: 'The weight doesn’t change. What it’s made of does.',
        effects: { valuationDiscipline: 2, founderTrust: 1, risk: -1 },
        next: 'venue',
      },
      {
        id: 'ring_list',
        label: 'Write down the three moments that put the ring in your pocket in the first place.',
        result: 'The auction paddle. The diner booth. The espresso machine hissing at dawn. You keep the list.',
        effects: { dueDiligence: 2, confidence: 1 },
        next: 'venue',
      },
      walk('ring'),
    ],
  },
  {
    id: 'venue',
    title: 'The Where',
    speaker: 'you',
    text: 'Where do you ask? You’ve built companies from nothing; this should not be the hardest logistics problem of your career, and yet. Your events people could have the stadium jumbotron by Thursday. The diner from your first real date still holds your booth. And the auction house where Quinn ran your bidding into the stratosphere out of pure spite has a certain symmetry.',
    choices: [
      {
        id: 'venue_jumbo',
        label: 'The jumbotron. Forty feet tall, prime time, undeniable.',
        result: 'You put a hold on the stadium. Somewhere across town, you can already feel Quinn’s eyebrow rising.',
        effects: { confidence: 2, risk: 3 },
        next: 'priya',
      },
      {
        id: 'venue_diner',
        label: 'The diner. The wobbly booth, the bad coffee, the place where the banter first dropped its guard.',
        result: 'Small, specific, yours. You book nothing. You just plan to show up, the way you did the first time.',
        effects: { dueDiligence: 2, founderTrust: 2, risk: -1 },
        next: 'priya',
        roleBoost: 'operator',
      },
      {
        id: 'venue_auction',
        label: 'The auction house. Full circle — ask where the rivalry started.',
        result: 'There’s a poetry to it, even if the room feels a little grand for what you actually want to say.',
        effects: { dueDiligence: 1, leverage: 1, valuationDiscipline: 1 },
        next: 'priya',
      },
      walk('venue'),
    ],
  },
  {
    id: 'priya',
    title: 'The Blessing',
    speaker: 'narrator',
    text: 'Priya has run Quinn’s calendar for eleven years and Quinn’s life slightly longer. She agrees to coffee, orders tea, and studies you the way auditors study a suspicious invoice. "You have seven minutes," she says, "and I already know what this is about, so use them well."',
    choices: [
      {
        id: 'priya_charm',
        label: 'Deploy the full charm offensive — compliments, a gift, your best boardroom smile.',
        result: 'Priya watches the performance the way you’d watch weather. "Six minutes," she says.',
        effects: { risk: 2, leverage: -1 },
        next: 'suspect',
      },
      {
        id: 'priya_ask',
        label: 'Ask her straight: "What does Quinn actually want that she’d never say out loud?"',
        result: 'Priya sets down her tea. Then, for four unbroken minutes, she tells you — and you write nothing down, because you will forget none of it.',
        effects: { dueDiligence: 3, founderTrust: 1 },
        next: 'suspect',
        roleBoost: 'operator',
      },
      {
        id: 'priya_honest',
        label: '"I’m not asking permission. I’m asking if I’ve missed anything that matters."',
        result: '"Better question than I expected," Priya admits. "She hates surprises but loves being known. Don’t confuse the two."',
        effects: { dueDiligence: 1, valuationDiscipline: 1, leverage: 1 },
        next: 'suspect',
      },
      walk('priya'),
    ],
  },
  {
    id: 'suspect',
    title: 'Made',
    speaker: 'protagonist',
    text: '"Okay, no," Quinn says, setting down her cup — the ancient espresso machine behind her still ticking as it cools. "You’ve been weird for three weeks. You check your left pocket like it owes you money. You turned down a hostile takeover on a Friday. Either you’re dying or you’re up to something, and you don’t have the decency to look guilty about either. So."',
    choices: [
      {
        id: 'suspect_deny',
        label: '"Weird? Me? I have literally never been weird in my life."',
        result: 'Quinn stares at you for a full three seconds. "Sure," she says, in the voice she uses on inflated valuations.',
        effects: { risk: 2, founderTrust: -1 },
        next: 'fakeout',
      },
      {
        id: 'suspect_half',
        label: '"I’m working on something. It’s for you. That’s all you get — and I need you to trust me a little longer."',
        result: 'Quinn holds your eyes, then nods once, slowly. "Fine. But if it’s a surprise party, I want it on the record that I objected."',
        effects: { founderTrust: 2, leverage: 2, risk: -1 },
        next: 'fakeout',
        roleBoost: 'closer',
      },
      {
        id: 'suspect_tease',
        label: '"I’ve been weird? You’ve threatened to replace that espresso machine for a decade. We all live with mystery."',
        result: '"That machine is load-bearing," Quinn says, and lets the subject drop. Mostly.',
        effects: { leverage: 1, confidence: 1 },
        next: 'fakeout',
      },
      walk('suspect'),
    ],
  },
  {
    id: 'fakeout',
    title: 'Almost',
    speaker: 'narrator',
    text: 'The dinner is perfect, which is the problem. Candlelight, Quinn mid-story about ruining a rival’s quarter, the ring one pocket away — and your moment arrives, opens like a door… and the dessert trolley appears, and Quinn’s phone buzzes with a board alert, and the door swings shut. Your pulse is doing something ridiculous. The box stays where it is.',
    choices: [
      {
        id: 'fakeout_force',
        label: 'Force it anyway — go for one knee between the trolley and the board alert.',
        result: 'You get halfway down before you catch Quinn’s face — startled, not lit. You convert the whole motion into retrieving a dropped napkin. Smooth. Almost.',
        effects: { risk: 3, confidence: 1 },
        next: 'sign',
      },
      {
        id: 'fakeout_grace',
        label: 'Let it go. Enjoy the dessert, the story, the night — and quietly note what the right moment would feel like.',
        result: 'The nerves drain out and the evening comes back. It felt wrong because it wasn’t yours — it belonged to a nice restaurant. Now you know exactly what you’re waiting for.',
        effects: { dueDiligence: 2, valuationDiscipline: 2 },
        next: 'sign',
        roleBoost: 'buyer',
      },
      {
        id: 'fakeout_laugh',
        label: 'Laugh at yourself, order the most ridiculous thing on the trolley, split it.',
        result: 'Quinn steals the last bite, obviously. Whatever almost happened, the night stays easy.',
        effects: { confidence: 1, founderTrust: 1 },
        next: 'sign',
      },
      walk('fakeout'),
    ],
  },
  {
    id: 'sign',
    title: 'EAT',
    speaker: 'narrator',
    text: 'The rusty neon sign from the charity auction — the one that just says EAT, the one you overpaid for magnificently and Quinn quietly claimed for her hallway — has hung there ever since, humming its warm red hum at everyone who visits. It takes nine days, three favours, and one deeply unimpressed Priya to smuggle it out for a single night without Quinn noticing. Now the crate sits in your loading bay. The question is what you build around it.',
    choices: [
      {
        id: 'sign_spectacle',
        label: 'Build the reveal out — a rooftop, a lighting rig, a string quartet, the sign as centrepiece of a production.',
        result: 'The mood board alone has a budget line. Somewhere in the planning, the sign quietly stops being the point.',
        effects: { risk: 3, confidence: 1 },
        next: 'speech',
      },
      {
        id: 'sign_simple',
        label: 'Hang it over the little terrace where you two drink terrible espresso, plug it in, and let it hum.',
        result: 'No rig, no quartet. Just the rust, the buzz, and the warm red letters. It looks like it has always been there. That’s the whole idea.',
        effects: { valuationDiscipline: 2, founderTrust: 2, risk: -1 },
        next: 'speech',
        roleBoost: 'buyer',
      },
      {
        id: 'sign_restore',
        label: 'Have the electrics quietly rebuilt so it can’t die mid-moment — but keep every scratch and all the rust.',
        result: 'The restorer offers to repaint it. You physically stand between him and the sign. It keeps its history and gains a heartbeat.',
        effects: { dueDiligence: 2, leverage: 1 },
        next: 'speech',
      },
      walk('sign'),
    ],
  },
  {
    id: 'speech',
    title: 'The Words',
    speaker: 'you',
    text: 'The night of. The terrace is swept, the sign is wired, and you’re at your desk with a legal pad, drafting the most important pitch of your life. Drafts one through six read like eulogies. Draft seven is a shareholder letter. Downstairs, Quinn’s espresso machine — moved into your place months ago, still refusing to die — clears its throat like it’s waiting to hear what you’ve got.',
    choices: [
      {
        id: 'speech_script',
        label: 'Memorise the full five-minute version. Every beat, every pause, bulletproof.',
        result: 'By midnight you can recite it flawlessly, which is exactly the problem — it sounds recited. Even the espresso machine seems unconvinced.',
        effects: { risk: 2, valuationDiscipline: -1 },
        next: 'doorway',
      },
      {
        id: 'speech_true',
        label: 'Throw out the drafts. Keep three true things — one of them about that machine, and how Quinn keeps what she loves and fixes it.',
        result: 'Three lines on an index card you will never look at. The machine hisses downstairs, right on cue. You finally know what you’re going to say, because it’s just what’s true.',
        effects: { founderTrust: 2, dueDiligence: 2, valuationDiscipline: 1 },
        next: 'doorway',
      },
      {
        id: 'speech_card',
        label: 'Write it all out and fold it into your pocket next to the ring — insurance, not a script.',
        result: 'You’ll never read it, and knowing it’s there settles your hands. Belt and braces. It’s very you.',
        effects: { confidence: 1, valuationDiscipline: 1 },
        next: 'doorway',
      },
      walk('speech'),
    ],
  },
  {
    id: 'doorway',
    title: 'The Hum',
    speaker: 'narrator',
    text: 'Quinn arrives at eight, mid-complaint about a regulator, and stops one step onto the terrace. The EAT sign hums its warm red hum against the dusk. You watch her read it — the squint, the recognition, the slow turn towards you with an expression you have never once seen across a negotiating table. Nobody says anything. The city is very quiet.',
    choices: [
      {
        id: 'doorway_rush',
        label: 'Fill the silence fast — start explaining the sign, the heist, Priya’s part in it, the logistics.',
        result: 'You’re three sentences into provenance before you hear yourself. Quinn’s mouth twitches: nervous suits you, but hush.',
        effects: { risk: 2, leverage: -1 },
        next: 'ask',
      },
      {
        id: 'doorway_wait',
        label: 'Say nothing. Let the sign hum. Wait for Quinn’s eyes to come back to you.',
        result: 'It takes eleven seconds. When her eyes find yours they’re bright, and the banter is nowhere in sight — maybe for the first time ever.',
        effects: { dueDiligence: 2, founderTrust: 2, leverage: 1 },
        next: 'ask',
      },
      {
        id: 'doorway_coffee',
        label: 'Hand her a cup from the ancient machine — pulled just before eight, the way she takes it.',
        result: 'Quinn holds the cup, looks at the sign, looks at you. "You’re up to something," she says softly, and it isn’t a complaint.',
        effects: { founderTrust: 1, confidence: 1 },
        next: 'ask',
      },
      walk('doorway'),
    ],
  },
  {
    id: 'ask',
    title: 'The Question',
    speaker: 'protagonist',
    text: '"Okay," Quinn says, and her voice does something small on the second syllable. She’s standing under the sign, red light on her face, cup in hand. "You bought the sign. You’ve been strange for three weeks. Priya has been suspiciously kind to me. Say the thing — or I’m going to say it first, and you know how much I hate letting you win."',
    choices: [
      {
        id: 'ask_plain',
        label: '"Marry me."',
        effects: { confidence: 1, founderTrust: 1 },
        next: 'invest',
      },
      {
        id: 'ask_story',
        label: '"You ran me up at an auction, judged my diner order, booked us into a rainstorm and called it a getaway. I’d like to keep losing to you forever. Marry me, Quinn."',
        result: 'Quinn’s cup goes down blind onto the rail. The sign hums. The city holds its breath with you.',
        effects: { founderTrust: 2, dueDiligence: 1, leverage: 1 },
        next: 'invest',
        roleBoost: 'closer',
      },
      {
        id: 'ask_pocket',
        label: '"…I was going to ask what you want for dinner." Not tonight. The ring stays where it is.',
        result: 'Quinn narrows her eyes, smiles, and lets it go. Whatever it is, she’ll let you keep it a little longer.',
        effects: {},
        next: 'walkaway',
        walkAway: true,
      },
    ],
  },
]

export const ROMANCE_PROPOSAL: MogulStory = {
  id: 'love_proposal',
  industryId: 'food',
  icon: '💍',
  title: 'The Question',
  hook: 'You’ve been carrying a ring for three weeks.',
  subject: 'The Question',
  protagonist: 'Quinn Harlow',
  length: 'standard',
  firstStage: 'ring',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: '"Yes. Obviously Yes."',
      line: '"What took you so long?" Quinn says it against your collar, laughing, the ring not even on yet. The auction, the diner, the sign humming warm and red above you — the whole long rivalry pays off in one word. The espresso machine stays. So does she.',
    },
    good: {
      title: 'A Tearful, Laughing Yes',
      line: 'Quinn cries, then laughs at herself for crying, then says yes twice more so it’s on the record. It wasn’t flawless — it didn’t need to be. Under the hum of the EAT sign, the rival you couldn’t beat becomes the partner you never will.',
    },
    neutral: {
      title: 'Another Night Will Come',
      line: 'The moment never quite turned its face to you, so you let the evening just be an evening. Quinn went home happy and none the wiser, and the ring rides in your pocket a little longer. It keeps. So does the question.',
    },
    bad: {
      title: '"Not Like This."',
      line: 'Somewhere between the jumbotron and the production budget, the question stopped being about Quinn — and standing inside the spectacle, she whispered it: "Not like this." Not a no. Not tonight. The ring goes back in the pocket, Quinn takes your hand anyway, and you learn the difference between an audience and a witness.',
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
