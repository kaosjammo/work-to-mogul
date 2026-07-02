// ============================================================
//  Mogul Story — "The War Room" (EA arc, Episode 2 of 3). It's 1 a.m. in a
//  glass deal room high over the city. A hostile counter-bid is unravelling a
//  deal that, tonight, happens to serve BOTH your interests and Gideon Frost's —
//  which is how you and Reyna Vaughn, Frost's Executive Assistant, end up on the
//  same side of the table for the first time. Reyna quietly steers the room, feeds
//  you the read nobody else has, and — under all of it — runs one long test:
//  will you actually LISTEN, or will you talk over the only person here who knows
//  what's happening? Listen, respect the read, hold your discipline (dueDiligence
//  + founderTrust + valuationDiscipline, risk LOW) and trust builds — Reyna starts
//  to picture working for you (great AND good both advance the arc). Steamroll the
//  room to look decisive and you win the battle, lose the point — stingingly,
//  recoverably. Walk-away keeps the night unspent for later.
//
//  This is a PROFESSIONAL courtship, not romance — you are trying to POACH Reyna.
//  Warmth is earned through respect + judgment, never through money-flexing.
//
//  Eligibility is bespoke: gated on the EA arc's relationship progress (Episode 1
//  cleared), NOT the Finance-industry trigger — industryId is nominal.
//
//  All fictional — no real people, brands, or companies.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away choice reused on every stage (you can always leave the room for tonight).
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'Leave it for tonight',
  result: 'You gather your notes, thank the room, and step out into the quiet hallway. Some deals keep. Behind the glass, Reyna watches you go — and, notably, doesn’t look relieved to see the back of you.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'room',
    title: 'The War Room',
    speaker: 'narrator',
    text: 'One a.m. Forty-first floor. A hostile counter-bid dropped at nine and has been eating a deal alive ever since — a deal that, tonight, quietly serves both you and Gideon Frost. Which is why the far end of the table is occupied by Reyna Vaughn, Frost’s Executive Assistant, three phones and a legal pad deep, running Frost’s side of a fire from memory. Frost himself is asleep in a hotel two time zones east. Reyna glances up, clocks you, and something almost like relief crosses her face before the shutters come down. "Well," she says. "The room just got more interesting."',
    choices: [
      {
        id: 'room_takeover',
        label: '“Good — you’re here. Sit tight, I’ll run the room from my side. My deal, my call.”',
        result: 'The shutters, which had lifted an inch, close all the way. "Your deal," Reyna repeats, mild as anaesthetic, and goes back to the legal pad you just told her not to need.',
        effects: { confidence: 2, risk: 3, founderTrust: -2 },
        next: 'brief',
      },
      {
        id: 'room_sameside',
        label: '“Frost’s people and mine both want this bid dead. For one night, we’re on the same side of the table. Walk me through what you’ve got.”',
        result: 'Reyna sets one phone face-down — a small, deliberate act of attention. "On the same side," she echoes. "Novel. All right. Pull up a chair and I’ll show you what nobody in this building has noticed yet."',
        effects: { dueDiligence: 2, founderTrust: 2, risk: -1 },
        next: 'brief',
        roleBoost: 'operator',
      },
      {
        id: 'room_read',
        label: 'Say nothing yet. Sit down across from Reyna and read the table — the three phones, the legal pad, which lights are blinking — the way she taught you to at the summit.',
        result: 'You take the room in before you take it over. Reyna notices you noticing, and the corner of her mouth does something it hasn’t been paid to do.',
        effects: { dueDiligence: 2, valuationDiscipline: 1 },
        next: 'brief',
      },
      walk('room'),
    ],
  },
  {
    id: 'brief',
    title: 'The Brief',
    speaker: 'protagonist',
    text: 'Reyna turns the legal pad so you can both read it, upside down to her, which she doesn’t seem to need. "Here’s the shape of it. The counter-bidder isn’t bidding to win — they’re bidding to make us overpay, then walk, and leave us holding a deal we talked ourselves into. Everyone in this room is arguing about the number. The number is a decoy." A pause, and the test lands soft as a feather: "But you already know all this, so tell me — what do you do first?"',
    choices: [
      {
        id: 'brief_number',
        label: '“We win the number. Whatever they bid, we top it — decisively, tonight. Nobody out-bids me.”',
        result: 'Reyna doesn’t sigh. She just looks at you the way you look at a spreadsheet with a hidden error. "You do the one thing they built the whole trap to make you do," she says quietly. "Noted."',
        effects: { confidence: 2, risk: 3, valuationDiscipline: -2 },
        next: 'pull',
      },
      {
        id: 'brief_listen',
        label: 'Push the pad back. “You said the number’s a decoy. So I don’t touch the number — I go find out what they actually want. Show me where you’d look.”',
        result: '"There it is," Reyna murmurs, and turns the pad back to a column you hadn’t reached yet. "You listened to the whole sentence. You’d be amazed how few people do." For the first time all night, she leans in instead of out.',
        effects: { dueDiligence: 2, founderTrust: 2, valuationDiscipline: 1, risk: -1 },
        next: 'pull',
        roleBoost: 'operator',
      },
      {
        id: 'brief_ask',
        label: '“Before I do anything — what would you do first, if it were only your call?”',
        result: 'Reyna pauses, genuinely caught. Nobody asks Reyna what she’d do; they ask Reyna to fetch what someone else decided. "Honestly?" she says, and tells you — a cleaner read than anything you’d have reached alone.',
        effects: { dueDiligence: 1, founderTrust: 2, leverage: 1 },
        next: 'pull',
      },
      walk('brief'),
    ],
  },
  {
    id: 'pull',
    title: 'The Pull',
    speaker: 'narrator',
    text: 'Your own head of M&A — sharp, loyal, and running on cold coffee and adrenaline — leans in and murmurs the obvious play: match the bid, close it out, be home by two. It’s the safe-looking move, the one that photographs well in the morning. Across the table, Reyna says nothing. But one eyebrow lifts a precise, editorial millimetre, and her eyes flick — once — to the column on the legal pad you haven’t addressed yet.',
    choices: [
      {
        id: 'pull_own',
        label: 'Go with your own people. They report to you; Reyna reports to Frost. “Match it. Close it. We’re done here.”',
        result: 'Your M&A lead nods, relieved. Reyna’s eyebrow returns to neutral and the legal pad turns face-down — the read withdrawn, unoffered. You just told the smartest person in the room her information isn’t welcome.',
        effects: { confidence: 1, risk: 3, founderTrust: -2, dueDiligence: -1 },
        next: 'seam',
      },
      {
        id: 'pull_wes',
        label: 'Hold up a hand to your own lead. “One second.” Turn to Reyna. “You flicked at that column. Say it out loud.”',
        result: 'The room goes quiet at a boss overruling their own M&A chief to hear out the rival’s assistant. Reyna clocks exactly what it cost you to do that — and says the column out loud. It reframes the entire deal.',
        effects: { dueDiligence: 2, founderTrust: 2, leverage: 1, risk: -1 },
        next: 'seam',
        roleBoost: 'buyer',
      },
      {
        id: 'pull_both',
        label: '“Both of you — thirty seconds each, then I decide.” Give your lead the floor first, then Reyna, and weigh them evenly.',
        result: 'You make the rival’s assistant an equal voice against your own chief, on merit alone. Reyna files that away somewhere it clearly matters, and gives you the sharper thirty seconds of the two.',
        effects: { dueDiligence: 2, founderTrust: 1, valuationDiscipline: 1 },
        next: 'seam',
      },
      walk('pull'),
    ],
  },
  {
    id: 'seam',
    title: 'The Seam',
    speaker: 'protagonist',
    text: 'Reyna taps the pad twice. "Here’s the seam. Their lead investor has a redemption cliff in six weeks — they need cash out, not a company. They’re not trying to buy this deal; they’re trying to get paid to disappear from it." A thin smile. "Which means the whole thing is smaller than everyone in this building is panicking about. The question is how you use that without tipping them that you’ve seen it."',
    choices: [
      {
        id: 'seam_blast',
        label: '“Then I call their bluff to their face. Get them on the phone — I’ll tell them we see the cliff and dare them to hold.”',
        result: 'Reyna’s hand comes down flat on the pad. "And now they know we know, and they price the leak into the exit," she says, evenly. "You had the only edge in the room and you spent it to feel decisive. Please don’t make the call."',
        effects: { confidence: 2, risk: 3, dueDiligence: -1 },
        next: 'frost',
      },
      {
        id: 'seam_quiet',
        label: '“So we don’t chase them out — we build them a quiet door. A structured exit that pays the cliff and lets them save face. You draft it, I fund it.”',
        result: '"You draft it, I fund it," Reyna repeats, and something settles in her posture — the specific calm of a plan she’d have built herself. "That’s the move. That’s exactly the move. All right. Let me show you the terms nobody else will think to include."',
        effects: { dueDiligence: 2, valuationDiscipline: 2, founderTrust: 2, risk: -1 },
        next: 'frost',
        roleBoost: 'closer',
      },
      {
        id: 'seam_check',
        label: '“Before we build anything — where could you be wrong about the cliff? Walk me through what would blow this up.”',
        result: 'Reyna actually stops. "You’re pressure-testing my read instead of swallowing it whole," she says, almost approving. "Good. Here’s the one assumption that would sink it —" and she hands you the failure mode most people never ask for.',
        effects: { dueDiligence: 2, valuationDiscipline: 1, founderTrust: 1 },
        next: 'frost',
      },
      walk('seam'),
    ],
  },
  {
    id: 'frost',
    title: 'The Call',
    speaker: 'narrator',
    text: 'A phone lights the table — Reyna’s middle one, the one that never rings. Frost. Two time zones east and awake after all. Reyna answers without inflection, listens, and you watch a familiar thing happen: Frost is talking over her, fast and dismissive, ordering exactly the reckless bid-match Reyna just steered you both away from. Reyna says "Understood" three times and hangs up looking like someone who has swallowed the same stone for the ninth year running. "My boss," she says flatly, "has opinions."',
    choices: [
      {
        id: 'frost_dunk',
        label: '“He’s about to blow up his own deal from a hotel bar. You know that. Why do you still cover for him?”',
        result: 'It lands as an attack, not sympathy, and Reyna’s face closes like a vault. "Because it’s my job," she says, cold. "Which you’d do well to remember you’re not currently offering me." You reached for the wound and grabbed it too hard.',
        effects: { confidence: 1, risk: 3, founderTrust: -2 },
        next: 'terms',
      },
      {
        id: 'frost_respect',
        label: 'Say nothing about Frost. “That was a hard call to take and you took it clean. Do you want to run your read, or his order? Your call — I’ll follow whichever you pick.”',
        result: 'Reyna goes very still. Nobody offers Reyna the choice; they hand Reyna the order. "My read," she says quietly, after a moment that costs her something. "Let’s run my read." It’s the closest thing to defection you’ve heard all night.',
        effects: { founderTrust: 3, valuationDiscipline: 1, leverage: 1, risk: -1 },
        next: 'terms',
        roleBoost: 'closer',
      },
      {
        id: 'frost_cover',
        label: '“Then let’s make his bad order look like a good one. We run the quiet exit — and let Frost tell the morning he ordered it.”',
        result: 'Reyna exhales something that isn’t quite a laugh. "You’d let him take the credit to get the right outcome," she says. "That’s... not how the people at your level usually think." The read stays on the table, and so does she.',
        effects: { dueDiligence: 1, founderTrust: 2, valuationDiscipline: 1 },
        next: 'terms',
      },
      walk('frost'),
    ],
  },
  {
    id: 'terms',
    title: 'The Terms',
    speaker: 'protagonist',
    text: 'Two a.m. now. The quiet-exit structure is taking shape on the whiteboard in Reyna’s handwriting and your capital. It’s elegant — tighter than either side would have built alone. Reyna caps the marker and studies it. "This clause here," she says, tapping one line, "is aggressive. It’s good for you and slightly cruel to them. I put it in because Frost would want it there." A beat. "I don’t think you need it. But it’s your money, so — your call. I just wanted you to see me flag it."',
    choices: [
      {
        id: 'terms_keep',
        label: '“Leave it in. Cruel is fine if it’s legal, and I didn’t get here by leaving edges on the table.”',
        result: 'Reyna nods once and doesn’t argue — but she caps the marker a fraction harder than necessary. "Your call," she says, and you notice it’s the same phrase she uses for Frost. You just taught her where you file.',
        effects: { confidence: 2, risk: 2, founderTrust: -1 },
        next: 'wire',
      },
      {
        id: 'terms_cut',
        label: '“Cut it. You flagged it because it’s wrong, and you were right to. We win clean or we don’t win — I’d rather they say yes than can’t-say-no.”',
        result: 'Reyna erases the clause slowly, like she’s making sure it’s real. "You cut a term that favoured you because I told you it was ugly," she says. "Do you understand how rarely anyone above me does that?" It isn’t a rhetorical question, and you both know the answer.',
        effects: { founderTrust: 3, valuationDiscipline: 2, dueDiligence: 1, risk: -1 },
        next: 'wire',
        roleBoost: 'buyer',
      },
      {
        id: 'terms_defer',
        label: '“You know their side better than I do. If you were sitting in my chair — keep it or cut it?”',
        result: '"Cut it," Reyna says without hesitation, then blinks at how fast she answered. "...I’d cut it." You put her in your chair for three seconds, and she clearly liked the view more than she expected to.',
        effects: { founderTrust: 2, valuationDiscipline: 1, leverage: 1 },
        next: 'wire',
      },
      walk('terms'),
    ],
  },
  {
    id: 'wire',
    title: 'The Wire',
    speaker: 'narrator',
    text: 'Three a.m. The other side takes the quiet door. The counter-bidder gets their clean exit, both empires get the outcome they needed, and the fire is out — killed not with a bigger number but with a better read. The room empties in ones and twos until it’s just you and Reyna and a whiteboard full of a plan you built together. Reyna packs the three phones away slowly, and for once doesn’t reach immediately for the next fire. "That," she says, "was a good night’s work." She almost sounds surprised to have had one.',
    choices: [
      {
        id: 'wire_mine',
        label: '“It was. And for the record — that was my capital that closed it.”',
        result: 'The warmth that had crept into the room retreats a step. "Of course," Reyna says smoothly, phones away, shutters down. "Your capital. My mistake." You reminded her exactly whose name goes on the win — hers was never in the running.',
        effects: { confidence: 1, risk: 2, founderTrust: -1 },
        next: 'invest',
      },
      {
        id: 'wire_credit',
        label: '“It was your read that closed it. I just signed the cheque your thinking told me to sign. Frost is lucky to have you. So would anyone be.”',
        result: 'Reyna stops packing. "Frost is lucky to have me," she repeats, testing the shape of a sentence nobody says to her, and then, carefully, the second half you left hanging: "...so would anyone." She doesn’t answer it. But she heard it — and she didn’t say no.',
        effects: { founderTrust: 3, valuationDiscipline: 1, leverage: 1, risk: -1 },
        next: 'invest',
        roleBoost: 'closer',
      },
      {
        id: 'wire_next',
        label: '“Same side again sometime? I’ll bring the coffee and the capital. You bring the read nobody else has.”',
        result: '"That’s a strange thing to look forward to," Reyna admits, and doesn’t take it back. "But I think I might." It isn’t a yes to anything you can put in writing. It’s better — it’s a door left unlatched.',
        effects: { founderTrust: 2, dueDiligence: 1, leverage: 1 },
        next: 'invest',
      },
      walk('wire'),
    ],
  },
]

export const EA_WARROOM: MogulStory = {
  id: 'ea_warroom',
  industryId: 'finance',
  icon: '🌙',
  title: 'The War Room',
  hook: 'A 1 a.m. counter-bid, and you and Reyna end up on the same side.',
  subject: 'The Deal Room',
  protagonist: 'Reyna Vaughn',
  length: 'standard',
  firstStage: 'room',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: 'The Corner Office, Imagined',
      line: 'You killed the bid with a read instead of a number, cut the ugly clause because Reyna told you to, and gave her the credit her own boss never has. At the elevator Reyna looks at you a beat too long. "Gideon would have matched the bid at nine and lost the company by ten," she says quietly. "You listened to me. That’s... rarer than capital." The doors close on someone who has started, privately, to picture a different desk.',
    },
    good: {
      title: 'Trust, Wired',
      line: 'It wasn’t flawless — you reached once or twice — but you held your discipline, took Reyna’s read seriously, and put the outcome above the ego. "Good night’s work," Reyna says again at the door, and means it. She doesn’t offer anything. But she’s stopped treating you like a mark and started treating you like a colleague — and for Reyna, that’s the harder door to open.',
    },
    neutral: {
      title: 'A Fire, Handled',
      line: 'You let the night end where it stood — the bid dead, the deal clean, nothing overspent and nothing overpromised. Reyna gives you a professional nod across the emptying room, the plan on the whiteboard unerased between you. No trust won, none lost. The city runs on nights like this, and there will be others.',
    },
    bad: {
      title: 'Your Deal, Your Call',
      line: 'You had the sharpest read in the building sitting across the table and you talked over it to look decisive — matched the number, kept the cruel clause, put your name on the win. The bid died anyway, expensively, and Reyna’s shutters never came back up. "Your deal," she says at the door, flat as a closed ledger. "Your call." It stings. But the empire’s still wobbling, and the circuit is small — this isn’t over.',
    },
  },
  hintCopy: {
    highRisk: '🌙 You’re talking over the only person who sees it.',
    someRisk: 'That came off as steamrolling.',
    solid: 'You’re actually listening — and it’s registering.',
    leading: 'She’s steering, and you’re following well.',
    trailing: 'You’re missing the read she’s handing you.',
    warm: 'She’s starting to picture the corner office.',
  },
}
