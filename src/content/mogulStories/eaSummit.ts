// ============================================================
//  Mogul Story — "The Summit" (EA Arc, Episode 1 of 3). A high-finance summit,
//  and the most valuable person in the room is in the back row. Reyna Vaughn runs
//  Gideon Frost's entire empire off a phone while the keynote drones on — and
//  you're the only one who clocks it. You get one conversation. Flex your power
//  and Reyna files you under "another one"; respect the competence, listen more
//  than you posture, and she leaves intrigued. A 7-stage `standard` opener on the
//  shared runtime: great AND good both advance the arc; walk away and Reyna stays a
//  name you'll circle back to; grandstand and you flop — pointedly, recoverably.
//
//  NOTE: eligibility for this story is bespoke — it is gated on the EA-arc
//  progress, not the usual Finance-industry trigger (industryId is nominal).
//
//  This is a PROFESSIONAL courtship, not romance: Reyna is testing whether you'd
//  treat talent as a partner or as furniture. Warmth is earned through respect
//  and judgment, never through money-flexing.
//
//  All fictional — no real people, brands, or companies.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away choice reused on every stage (you can always leave the recruit for another day).
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'Leave it for now',
  result: 'Not every hire happens in a hallway. You let the moment pass, unpushed and unspoiled — and you catch Reyna clock the fact that you knew when to stop. That, too, is information.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'backrow',
    title: 'The Back Row',
    speaker: 'narrator',
    text: 'The Meridian Capital Summit: a ballroom of nine-figure egos nodding along to a keynote about "disciplined conviction." You stopped listening minutes ago. Your eye keeps drifting to the back row, to someone who hasn’t looked up from a phone once — thumbs moving, jaw set, radiating the specific calm of a person defusing something. Three seats down, Gideon Frost holds court, oblivious, while the person actually running his empire works in the dark behind him.',
    choices: [
      {
        id: 'backrow_ignore',
        label: 'Assistant on her phone. Turn back to the keynote and the people who matter.',
        result: 'You give the stage your attention for another ninety seconds — and in that ninety seconds the person in the back row quietly saves a deal you’ll read about next week. You almost missed the only interesting thing in the room.',
        effects: { confidence: 1, risk: 2, dueDiligence: -1 },
        next: 'read',
      },
      {
        id: 'backrow_watch',
        label: 'Watch her work. Nobody sweats a phone like that over an email.',
        result: 'You read the tells: two devices, a legal pad she doesn’t need, a supplier’s name mouthed once with a flicker of contempt. This isn’t admin. This is triage. This is someone holding a wobbling tower up with both hands and no credit.',
        effects: { dueDiligence: 2, valuationDiscipline: 1 },
        next: 'read',
        roleBoost: 'operator',
      },
      {
        id: 'backrow_frost',
        label: 'Read the room politics — who’s deferring to whom, and who Frost keeps glancing back at.',
        result: 'Frost turns to the back row four times without meeting an eye — a hand held out for a figure, a name, a fixed problem, each one supplied before he finishes asking. He never says thank you. You start counting the ways that ends.',
        effects: { dueDiligence: 1, leverage: 1 },
        next: 'read',
      },
      walk('backrow'),
    ],
  },
  {
    id: 'read',
    title: 'The Tell',
    speaker: 'narrator',
    text: 'The keynote breaks for the networking hour and the ballroom empties toward the champagne. The back-row operative doesn’t move. A crisis is clearly live on that phone — you catch the shape of it: a lender getting cold feet on a Frost deal before the close. And then, without theatrics, she types three lines, makes one call, and the tension drains out of her shoulders. Solved. Nobody in the room noticed it happen but you.',
    choices: [
      {
        id: 'read_flex',
        label: 'Wait to be recognised. Someone at your level doesn’t chase a staffer across a ballroom.',
        result: 'You hover near the good champagne and let your reputation do the walking. It doesn’t walk. The operative packs the second phone away, entirely unbothered by who you are.',
        effects: { confidence: 2, risk: 2, leverage: -1 },
        next: 'approach',
      },
      {
        id: 'read_respect',
        label: 'Cross the room yourself. Someone who just did that has earned five minutes of your time.',
        result: 'You go to her, not the other way around — and you see her register it: a mogul crossing a floor for an assistant. Her eyebrow moves a single, skeptical millimetre. So far, you’re a curiosity rather than a threat.',
        effects: { dueDiligence: 1, founderTrust: 2, risk: -1 },
        next: 'approach',
        roleBoost: 'closer',
      },
      {
        id: 'read_intel',
        label: 'Place the deal first. Whose lender was that, and how close was it to blowing up?',
        result: 'You run the math before you run your mouth: that was Frost’s aviation financing, forty minutes from collapse, and it just… didn’t. You approach knowing exactly how large a thing you watched her do.',
        effects: { dueDiligence: 2, valuationDiscipline: 1 },
        next: 'approach',
      },
      walk('read'),
    ],
  },
  {
    id: 'approach',
    title: 'The Introduction',
    speaker: 'protagonist',
    text: 'She looks up before you’ve said a word, unhurried, already three steps ahead. "Reyna Vaughn." No title offered — a deliberate omission. "You’ve been watching me for the better part of an hour instead of the keynote. Either you’re very lost, or you saw something. Most people in this room can’t see past Mr. Frost’s cufflinks." A dry, waiting pause. "So. Which is it?"',
    choices: [
      {
        id: 'approach_name',
        label: '“I run more capital than half this ballroom. I don’t get lost.”',
        result: 'Reyna blinks slowly. "Congratulations on the capital," she says, in a tone that could ice a martini. "I asked what you saw." You led with your balance sheet. She was asking about her work.',
        effects: { confidence: 2, risk: 3, founderTrust: -2 },
        next: 'test',
      },
      {
        id: 'approach_saw',
        label: '“I saw you save a lender from walking, from the back row, without breaking a sweat. Nobody else in here noticed. I did.”',
        result: 'Something flickers — surprise, quickly repossessed. "Huh." Reyna sets the phone face-down: the closest thing to full attention she’s given anyone all day. "People don’t usually notice the save. Only the mess when there isn’t one."',
        effects: { dueDiligence: 2, founderTrust: 2, risk: -1 },
        next: 'test',
        roleBoost: 'operator',
      },
      {
        id: 'approach_title',
        label: '“No title after your name. That was on purpose. What does the org chart call you, and what does the org chart get wrong?”',
        result: 'A real, brief flash of amusement. "The org chart says ‘Executive Assistant’," Reyna says. "The org chart is an optimist." You’ve asked the one question that assumes the chart is lying — and she clearly agrees.',
        effects: { dueDiligence: 1, leverage: 2 },
        next: 'test',
      },
      walk('approach'),
    ],
  },
  {
    id: 'test',
    title: 'The Test',
    speaker: 'protagonist',
    text: 'Reyna tilts her head, and you feel the interview flip — you’re the one being assessed now. "Alright. A quiet one, since you’re paying attention." Her voice stays light; her eyes do not. "That lender who nearly walked. Do you think I fixed a problem tonight — or do you think I bought Mr. Frost about six weeks before the same problem comes back wearing a different tie?"',
    choices: [
      {
        id: 'test_hero',
        label: '“You fixed it. That was a masterclass. Frost’s lucky to have you cleaning up like that.”',
        result: '"Cleaning up," Reyna repeats, and the warmth drops a few degrees. You called a strategic save a mop-and-bucket job. She was fishing to see if you’d hear the difference. You didn’t.',
        effects: { confidence: 1, risk: 2, founderTrust: -1 },
        next: 'frost',
      },
      {
        id: 'test_root',
        label: '“You bought six weeks. The lender didn’t get cold feet over one deal — they got cold feet over Frost. You can’t patch a reputation from the back row.”',
        result: 'Reyna goes very still, then exhales something close to a laugh. "There it is," she murmurs. "Nobody says that part out loud. Least of all to me." You named the real problem — and made it clear you’d let her name it too.',
        effects: { dueDiligence: 2, valuationDiscipline: 2, founderTrust: 1, risk: -1 },
        next: 'frost',
        roleBoost: 'operator',
      },
      {
        id: 'test_defer',
        label: '“You tell me. You’re the one holding the tower up — I’d rather hear your read than sell you mine.”',
        result: '"Smart," Reyna allows. "Make the person with the answer do the work. Mr. Frost does that too." A beat. "The difference is you asked like it was worth my time." She gives you the read — and it’s sharper than anything on the main stage.',
        effects: { founderTrust: 2, leverage: 1 },
        next: 'frost',
      },
      walk('test'),
    ],
  },
  {
    id: 'frost',
    title: 'The Boss',
    speaker: 'narrator',
    text: 'Across the ballroom, Frost’s laugh carries — too loud, aimed at a camera. Without looking, he raises a hand toward the back row, two fingers, a summons for a figure or a fixer, the gesture you’d use for a waiter. Reyna watches it come and doesn’t move yet. "That," she says quietly, "is my performance review. Every day. A hand, no name." The mask is very good, but you can see the cost of it now, sitting right at the seam.',
    choices: [
      {
        id: 'frost_poach',
        label: '“He doesn’t deserve you. Name your number — I’ll double whatever he pays and you walk out with me tonight.”',
        result: 'The shutters slam. "Ah. You’re a buyer." Reyna’s smile goes professional and final. "I’m not a lot at auction, and I don’t leave a fire because someone waved a bigger cheque over it. That’s not a rescue. That’s the same hand, more money."',
        effects: { confidence: 2, risk: 3, founderTrust: -2, valuationDiscipline: -1 },
        next: 'card',
      },
      {
        id: 'frost_see',
        label: 'Say nothing about money. “He waves. You built the thing he’s waving in front of. I noticed. For whatever that’s worth from a stranger.”',
        result: 'Reyna doesn’t answer for a moment. "It’s worth… more than it should be, from a stranger," she admits, almost annoyed at herself. You didn’t pitch. You witnessed. It lands somewhere a cheque never reaches.',
        effects: { founderTrust: 3, dueDiligence: 1, risk: -1 },
        next: 'card',
        roleBoost: 'closer',
      },
      {
        id: 'frost_ask',
        label: '“What would you do with all that — if a hand pointed at you and it wasn’t a summons? If it was a seat?”',
        result: 'The question stops her cold. "Nobody’s ever framed it as a seat," Reyna says slowly, and for a second you watch her let herself want something. "Give me a room and a mandate and I’d fix things before they became fires. I’m tired of the mop." She catches herself. But you both heard it.',
        effects: { dueDiligence: 2, founderTrust: 2, leverage: 1, risk: -1 },
        next: 'card',
        roleBoost: 'operator',
      },
      walk('frost'),
    ],
  },
  {
    id: 'card',
    title: 'The Hand-Off',
    speaker: 'protagonist',
    text: 'Frost’s two fingers are still up, more insistent now. Reyna pockets the phone and the private conversation with it, back to armour. "I have to go make a hand feel obeyed," she says, dry as gravel. "But you crossed a whole ballroom for someone with no title, and you didn’t once try to hire the phone instead of the person. That’s rarer than you’d think." A pause, weighing you. "How does this go — you and me?"',
    choices: [
      {
        id: 'card_close',
        label: 'Business card, firm handshake. “My people will reach out. We should formalise something before Frost’s ship finishes sinking.”',
        result: '"Formalise," Reyna echoes, and the small warmth you earned cools by half. "My people, your people." She takes the card the way you’d accept a receipt. "You were doing so well without the vocabulary."',
        effects: { confidence: 1, risk: 2, founderTrust: -1, leverage: -1 },
        next: 'close',
      },
      {
        id: 'card_slow',
        label: '“No pitch tonight. You’re mid-crisis and I’m not going to be one more person wanting something from you. When it’s quiet — coffee. Terrible coffee. Just to talk.”',
        result: 'Reyna actually smiles — small, unguarded, gone in a blink. "You read the room again," she says. "Twice in one night. That’s a record for this ballroom." She doesn’t say yes. She doesn’t say no. She memorises your face, which is better.',
        effects: { founderTrust: 2, valuationDiscipline: 2, dueDiligence: 1, risk: -1 },
        next: 'close',
        roleBoost: 'closer',
      },
      {
        id: 'card_honest',
        label: '“Honestly? I don’t know yet. I came over because you were the most competent person in the room and nobody was looking. Everything after that, we figure out when you’re not on fire.”',
        result: '"An honest answer," Reyna notes, "at a summit built on the other kind." She glances at Frost’s waiting hand, then back at you, recalculating something. "Those are worth more here than the champagne. Considerably more."',
        effects: { founderTrust: 2, valuationDiscipline: 1, leverage: 1 },
        next: 'close',
      },
      walk('card'),
    ],
  },
  {
    id: 'close',
    title: 'One Line',
    speaker: 'you',
    text: 'Frost’s hand has become a snap. Reyna is already half-turned toward it, back into the role, the armour sealing over the person you glimpsed underneath. You have one line before she crosses the ballroom and this becomes just another face at just another summit. Make it the line she’s still turning over on the drive home.',
    choices: [
      {
        id: 'close_flex',
        label: '“When you’re ready to be paid what you’re worth, you know where the real money is.”',
        result: 'You reach for the wallet with your last word. Reyna’s expression doesn’t change, which is somehow the worst part.',
        effects: { confidence: 2, risk: 2, founderTrust: -1 },
        next: 'invest',
      },
      {
        id: 'close_line',
        label: '“For what it’s worth — a hand that points at you should be offering you a chair, not a task. Somebody should’ve told you that years ago.”',
        result: 'It comes out quieter than you meant, and truer. Reyna stops mid-turn, just for a beat — long enough that Frost’s hand goes ignored, which you suspect has never happened before.',
        effects: { founderTrust: 2, valuationDiscipline: 1, leverage: 1 },
        next: 'invest',
        roleBoost: 'closer',
      },
      walk('close'),
    ],
  },
]

export const EA_SUMMIT: MogulStory = {
  id: 'ea_summit',
  industryId: 'finance',
  icon: '🗂️',
  title: 'The Summit',
  hook: 'The most valuable person at the summit is in the back row.',
  subject: 'The Summit',
  protagonist: 'Reyna Vaughn',
  length: 'standard',
  firstStage: 'backrow',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: '“Coffee. When It’s Quiet.”',
      line: 'Reyna pauses with Frost’s hand still hanging in the air, and does something you suspect she rarely does: she chooses. "Coffee," she says. "When it’s quiet. Bring your questions, not your chequebook — I liked the questions." Then she’s gone into the role again, but she looked back once. People like Reyna don’t look back.',
    },
    good: {
      title: 'A Curious Nod',
      line: 'Reyna doesn’t commit to anything — she can’t, not tonight, not with the tower still swaying. But the nod she gives you is real, and unguarded, and it means you’ve stopped being scenery. "Interesting," she says, mostly to herself, and files your face somewhere it’ll keep. You’re on her radar now. That’s the whole game tonight, and you won it.',
    },
    neutral: {
      title: 'A Name to Circle Back To',
      line: 'You let the moment rest before it curdled — no pitch, no pressure, nothing spent or spoiled. Reyna crosses the ballroom to Frost’s hand, but she clocks your restraint on the way, and restraint reads loud in a room this hungry. Nothing’s begun. Nothing’s ruined. The circuit is small, and you know where to find her now.',
    },
    bad: {
      title: 'Another Buyer',
      line: 'You waved the net worth one time too many, and watched Reyna file you under a heading she keeps for people who mistake talent for inventory: buyer. "Good luck with your capital," she says, already walking, and the armour’s so complete you’d never guess you’d cracked it for a minute. It stings. But the circuit is small, and Frost’s ship is still taking water — this isn’t over.',
    },
  },
  hintCopy: {
    highRisk: '🧊 You’re reading as just another buyer.',
    someRisk: 'That landed as a flex, not a read.',
    solid: 'You’re seeing the operator, not the assistant.',
    leading: 'She’s actually engaging with you.',
    trailing: 'You’re talking past her.',
    warm: 'She’s starting to picture the corner office.',
  },
}
