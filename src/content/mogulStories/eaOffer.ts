// ============================================================
//  Mogul Story — "The Offer" (Executive-Assistant arc, Episode 3 of 3). The finale
//  of the "poach the rival's EA" arc. Gideon Frost's empire has cracked — a scandal,
//  a brutal quarter, a resignation letter already drafted — and Reyna Vaughn, the
//  unflappable chief-of-staff who ran that empire from the back of the room, is
//  finally, quietly done. Now you make the actual pitch. An 8-stage `standard`
//  professional courtship on the shared runtime: this is NOT romance. Reyna is testing
//  whether you'd treat her as a PARTNER, not a servant — value the talent, listen,
//  respect the judgment, and she's ready to jump (great AND good both advance the
//  arc). Reach for a crass money-grab or a status-flex and you insult her — but it's
//  recoverable, and the circuit is small. industryId 'finance' is trigger context
//  only; eligibility is bespoke, gated on the EA arc's recruit progress, not the
//  Finance industry.
//
//  All fictional — no real people, brands, or companies.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away choice reused on every stage (you can always leave the offer for now).
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'Leave it for now',
  result: 'Some offers land better unhurried. You let the conversation rest where it is — no pressure, no ask — and Reyna, who has spent a career watching people push too soon, notices exactly that you didn’t.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'crack',
    title: 'The Crack',
    speaker: 'narrator',
    text: 'The Frost story breaks at 6:40 a.m. — a compliance scandal, a supplier walkout, and a quarter so ugly the analysts have run out of adjectives. By nine, Frost & Holdings is trending for all the wrong reasons. And your phone lights up with a message from a number you saved months ago but never dared use: "You free? — R."',
    choices: [
      {
        id: 'crack_pounce',
        label: 'Reply instantly: “Perfect timing. Ship’s sinking. Come work for the winning side.”',
        result: 'The typing indicator appears, hangs, and vanishes. Then: "Charming." You have just told Reyna you were watching for the wreck, not for her.',
        effects: { confidence: 2, risk: 3, founderTrust: -2 },
        next: 'coffee',
      },
      {
        id: 'crack_human',
        label: 'Reply simply: “Always. Rough morning — are you okay? Coffee, on your terms, no agenda.”',
        result: '"Define okay," Reyna writes back, then, a beat later: "Coffee. The quiet place on Wells. And I will know if there’s an agenda." There is an agenda. You resolve to earn the right to it.',
        effects: { dueDiligence: 2, founderTrust: 2, risk: -1 },
        next: 'coffee',
        roleBoost: 'operator',
      },
      {
        id: 'crack_wait',
        label: '“Free whenever you are. No rush, no read into it. Tell me where.”',
        result: '"Restraint. Novel." A pin drops onto your phone — a café address, and nothing else. It’s the first time Reyna has ever chosen the ground.',
        effects: { dueDiligence: 1, valuationDiscipline: 1 },
        next: 'coffee',
      },
      walk('crack'),
    ],
  },
  {
    id: 'coffee',
    title: 'The Quiet Place',
    speaker: 'protagonist',
    text: 'The café on Wells is the kind of place people go to not be found. Reyna is already there, coat still on, a resignation letter face-down on the table between two coffees. She looks tired in a way that has nothing to do with sleep. "Eleven years," Reyna says, not looking up. "I built that empire from a folding chair in the back of every room. This morning Frost’s lawyers used the word ‘expendable’ about me. In an email. To a group."',
    choices: [
      {
        id: 'coffee_flex',
        label: '“Their loss, my gain. Name a number — I’ll beat whatever Frost ever paid you, today.”',
        result: 'Reyna finally looks up, and it is not gratitude. "You heard ‘expendable’ and reached for a price tag," she says quietly. "Interesting instinct."',
        effects: { confidence: 2, risk: 3, valuationDiscipline: -1, founderTrust: -1 },
        next: 'letter',
      },
      {
        id: 'coffee_see',
        label: 'Push the letter gently aside. “Eleven years running the whole thing, and he called the engine ‘expendable’. That’s not a pay dispute. That’s a man who never once looked at what he was standing on.”',
        result: 'Reyna goes very still. "No," she says, after a moment. "He didn’t." It is the first true thing either of you has said, and she knows you meant it.',
        effects: { dueDiligence: 2, founderTrust: 2, risk: -1 },
        next: 'letter',
        roleBoost: 'operator',
      },
      {
        id: 'coffee_ask',
        label: 'Say nothing about jobs. “What do you actually want out of the next eleven years? Not from me. From your own life.”',
        result: 'The question visibly lands somewhere Frost never asked. "Nobody’s put it that way before," Reyna admits. "Give me a minute. I’m out of practice being the subject."',
        effects: { dueDiligence: 2, founderTrust: 1, valuationDiscipline: 1 },
        next: 'letter',
      },
      walk('coffee'),
    ],
  },
  {
    id: 'letter',
    title: 'The Letter',
    speaker: 'protagonist',
    text: 'Reyna turns the resignation letter over so you can see it — one crisp paragraph, unsent. "It’s written. Has been for a week. I keep not clicking send, and I’ve stopped pretending I don’t know why." She taps the table twice. "Everyone who’s ever tried to hire me led with money or title. Both are easy to fake and easy to regret. So before you pitch me anything — tell me what you think you’d be buying."',
    choices: [
      {
        id: 'letter_asset',
        label: '“The best operator in the market. An asset that runs itself. Frankly, a bargain at any price.”',
        result: '"An asset," Reyna repeats, tasting the word like it’s gone off. "That runs itself." She slides the letter back toward her own side of the table.',
        effects: { confidence: 1, risk: 2, founderTrust: -2 },
        next: 'test',
      },
      {
        id: 'letter_judgment',
        label: '“Your judgment. Not your hours — anyone can sell hours. The thing where you see the crisis three moves before the room does and quietly fix it before it has a name.”',
        result: 'Something unclenches in Reyna’s shoulders. "That," she says softly, "is the part no one has ever named out loud. Frost thought he was the one seeing three moves ahead."',
        effects: { dueDiligence: 2, founderTrust: 2, valuationDiscipline: 1 },
        next: 'test',
        roleBoost: 'closer',
      },
      {
        id: 'letter_partner',
        label: '“Honestly? A partner. I’m good in the room. I’m worse everywhere the room forgets to look — and that’s exactly where you live.”',
        result: '"A partner." Reyna studies you like a ledger she suspects of a hidden error, then finds none. "People say that word a lot. You’re the first to sound like they’d mean the org chart, not the greeting card."',
        effects: { founderTrust: 2, dueDiligence: 1, leverage: 1 },
        next: 'test',
      },
      walk('letter'),
    ],
  },
  {
    id: 'test',
    title: 'The Test',
    speaker: 'protagonist',
    text: 'Reyna sets down her cup with the precision of someone who does nothing by accident. "Here’s the thing I have to know, and I’ll know if you rehearse it. The day I disagree with you — publicly, in front of your people, on a call that matters — what happens to me?" A pause with teeth in it. "Because with Frost, the answer was ‘the parking lot’. Twice."',
    choices: [
      {
        id: 'test_loyal',
        label: '“I’d expect loyalty in the room. Take the disagreement offline, close ranks in public — that’s just how a tight ship runs.”',
        result: 'Reyna nods slowly, and the warmth drains out by degrees. "So — Frost’s answer, with better manners," she says. "Thank you for being honest about it."',
        effects: { confidence: 1, risk: 3, founderTrust: -2 },
        next: 'money',
      },
      {
        id: 'test_disagree',
        label: '“Then I was probably wrong, and I’d rather find out in front of my people than in front of a court. If you’re only right in private, I’ve hired a very expensive echo.”',
        result: 'Reyna exhales — the first genuinely unguarded breath you’ve seen. "An echo," she repeats, almost smiling. "Frost had a whole department of those. He called it ‘alignment’."',
        effects: { dueDiligence: 2, founderTrust: 2, risk: -1 },
        next: 'money',
        roleBoost: 'operator',
      },
      {
        id: 'test_credit',
        label: '“You disagree, we sort it, and if you were right you get the credit in the same room where you took the risk. Out loud. That’s the whole deal.”',
        result: '"Credit. Out loud." Reyna says it like a phrase in a language she’d stopped expecting to hear. "You understand that’s the entire thing I’ve been starved of. Not money. That."',
        effects: { founderTrust: 2, valuationDiscipline: 1, dueDiligence: 1 },
        next: 'money',
      },
      walk('test'),
    ],
  },
  {
    id: 'money',
    title: 'The Number',
    speaker: 'you',
    text: 'It’s the moment every recruiter botches, and you can feel the ice of it. Reyna has told you, twice now, that money is the lazy answer — and yet an offer with no number is an insult of its own kind. She watches you know it, curious how you’ll thread a needle Frost never even saw.',
    choices: [
      {
        id: 'money_blow',
        label: 'Slide over a napkin with a number on it that would make most people gasp. Let the zeros talk.',
        result: 'Reyna doesn’t pick up the napkin. "You were doing so well," she says, with something close to disappointment. "And then you reached for the checkbook, because that’s the reflex you actually trust."',
        effects: { confidence: 2, risk: 3, valuationDiscipline: -2, founderTrust: -1 },
        next: 'seat',
      },
      {
        id: 'money_fair',
        label: '“I’ll pay you what the judgment is worth — above Frost, not as a flex, just because it’s correct. But the number is the floor of this conversation, not the point of it, and I think you already knew I’d say that.”',
        result: 'A small, real nod. "Correct," Reyna says. "Both that it should be above Frost, and that it shouldn’t be the point. You paid the number the exact amount of attention it deserves — no more."',
        effects: { valuationDiscipline: 2, dueDiligence: 2, founderTrust: 1, risk: -1 },
        next: 'seat',
        roleBoost: 'buyer',
      },
      {
        id: 'money_defer',
        label: '“Fair pay, sorted by people who do this for a living, so neither of us has to haggle over dinner. Let’s spend our air on the part that actually matters.”',
        result: '"Delegated cleanly, no theatre." Reyna almost approves. "Though ‘the part that matters’ is doing a lot of work in that sentence. Say the part that matters."',
        effects: { valuationDiscipline: 1, dueDiligence: 1, founderTrust: 1 },
        next: 'seat',
      },
      walk('money'),
    ],
  },
  {
    id: 'seat',
    title: 'The Seat',
    speaker: 'protagonist',
    text: 'Reyna leans back, arms folded, the tired giving way to something sharper. "Eleven years I ran that empire from a folding chair someone had to go fetch. Frost had a table with fourteen chairs and I was never once in the diagram." Her eyes fix on yours. "So don’t sell me a job. Tell me — in your operation, where do I actually sit?"',
    choices: [
      {
        id: 'seat_right',
        label: '“Right hand at the table, name in the diagram, and a standing veto on anything that touches operations. If you fetch a chair it’s because you like that one.”',
        result: 'Reyna holds your gaze for a long, testing beat, looking for the catch, and doesn’t find one. "A veto," she says quietly. "You’d hand me a veto on day one." It isn’t a question. It’s the sound of a decision starting.',
        effects: { founderTrust: 2, dueDiligence: 1, leverage: 1, risk: -1 },
        next: 'offer',
        roleBoost: 'closer',
      },
      {
        id: 'seat_earn',
        label: '“Second chair from day one, first chair the day you want it. I don’t hand out the corner office as a signing bonus — but I’ll never make you fetch it, either.”',
        result: '"Earned, not gifted. And clearly on the table." Reyna nods, slow and satisfied. "That I believe. Gifts have strings. This sounds like a ladder with the rungs already welded on."',
        effects: { dueDiligence: 2, valuationDiscipline: 1, founderTrust: 1 },
        next: 'offer',
      },
      {
        id: 'seat_vague',
        label: '“Wherever a talent like you wants to sit. Trust me, in my shop the sky’s the limit — we’ll figure the details out later.”',
        result: '"‘We’ll figure it out later’ is what Frost said in year one," Reyna replies, flat. "The details are the job. You just told me you don’t have them yet — or won’t say."',
        effects: { confidence: 1, risk: 2, founderTrust: -1 },
        next: 'offer',
      },
      walk('seat'),
    ],
  },
  {
    id: 'offer',
    title: 'The Pitch',
    speaker: 'you',
    text: 'The two coffees have gone cold. The letter still sits face-up between you, one click from ending a career and starting another. Reyna has stopped testing and started listening — properly listening, the way she listens to a room she’s about to save. Whatever you say next is the actual offer. There is no fourteenth chair to hide behind now.',
    choices: [
      {
        id: 'offer_close',
        label: '“Then let me close it: click send, take the week you’ve earned, and on Monday walk into a company that already knows your name is the reason the lights stay on. I’m not hiring an assistant. I’m hiring the person who’ll tell me when I’m wrong — starting with today.”',
        result: 'Reyna looks at the letter, then at you, and the exhaustion on her face resolves into something you haven’t seen there before: relief.',
        effects: { founderTrust: 2, dueDiligence: 1, valuationDiscipline: 1, leverage: 1, risk: -1 },
        next: 'invest',
        roleBoost: 'closer',
      },
      {
        id: 'offer_honest',
        label: '“No spin left, so here’s the truth: I want you because you’re better than me at the half of this I keep losing. Come do that half. I’ll make sure the whole building knows it was yours.”',
        result: 'For a moment Reyna says nothing at all, and the silence is the warmest thing in the room.',
        effects: { founderTrust: 2, valuationDiscipline: 1, dueDiligence: 1 },
        next: 'invest',
      },
      {
        id: 'offer_push',
        label: '“Sign now, before Frost’s people or three other bidders realize what he just threw away. This offer’s only on the table today — that’s just how leverage works.”',
        result: 'Reyna’s expression cools by a full season. "An ultimatum," she says. "On the one day of my life I have the most leverage and you have the least. You almost understood me."',
        effects: { confidence: 2, risk: 3, founderTrust: -2 },
        next: 'invest',
      },
      walk('offer'),
    ],
  },
]

export const EA_OFFER: MogulStory = {
  id: 'ea_offer',
  industryId: 'finance',
  icon: '🤝',
  title: 'The Offer',
  hook: 'Frost’s empire just cracked — and Reyna is finally answering her phone.',
  subject: 'The Pitch',
  protagonist: 'Reyna Vaughn',
  length: 'standard',
  firstStage: 'crack',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: '“Consider It Sent.”',
      line: 'Reyna turns the letter face-up, and clicks send without breaking eye contact. "Eleven years and one bad email," she says, pocketing the phone. "You didn’t buy me. You out-argued the one person who never bothered to." She stands, offers a hand, and for the first time all morning she’s smiling. "Monday. Second chair. Try to be wrong about something interesting."',
    },
    good: {
      title: 'A Handshake Over Cold Coffee',
      line: 'Reyna weighs it the way she weighs everything — every angle, every string, twice — and finds the offer holds. "Alright," she says, and the resignation letter is suddenly a decision, not a threat. "Not because of the money. Because you listened, which is apparently a competitive advantage now." It isn’t a signed contract yet. It’s better: it’s a yes forming.',
    },
    neutral: {
      title: 'Not Today',
      line: 'You let the offer rest before it curdled into pressure. Reyna pockets the letter, unsent, and gives you a nod that’s almost fond. "Not today," she says. "But you didn’t push, and I’ll remember that when today becomes another day." Nothing’s signed. Nothing’s spoiled. The circuit is small, and Frost is still sinking.',
    },
    bad: {
      title: 'The Wrong Reflex',
      line: 'You reached for the checkbook, or the ultimatum, or the word ‘asset’ — and watched Reyna remember exactly why she’s careful. "You almost got it," she says, sliding the letter back into her coat, still unsent. "Come back when you’ve figured out the difference between valuing someone and pricing them." It stings. But the letter isn’t signed for Frost either — and the circuit is small.',
    },
  },
  hintCopy: {
    highRisk: '🧊 You’re losing her.',
    someRisk: 'That read as a money-grab.',
    solid: 'You’re treating her like a partner — and it lands.',
    leading: 'She’s picturing the corner office.',
    trailing: 'You’re talking price; she’s listening for respect.',
    warm: 'She’s ready to click send.',
  },
}
