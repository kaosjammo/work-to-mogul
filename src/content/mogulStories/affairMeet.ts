// ============================================================
//  Mogul Story — "The New Face" (Affair arc, Episode 1 of 5). Only after the honeymoon,
//  a warm, unguarded, openly-smitten young woman — Elodie Fontaine, who runs her family's
//  flower farm and is doing the arrangements for one of your events — drifts into your
//  orbit and looks at you the way Quinn, sharp and unimpressed by design, never quite has.
//  The temptation here is mild: it just feels good to be adored. Lean in (indulgent choices
//  load `risk` → a 'bad' read = a small line crossed) or keep it warm-but-innocent (reads
//  great/good). Walk away any time and you end the whole thing and go home to Quinn.
//
//  Nothing physical is depicted; the stakes are trust and choice. Eligibility is bespoke —
//  gated on honeymoon booked + married (see engine/affair.ts).
//
//  All fictional — no real people, brands, or companies.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away = end it, right now, and go home. Available on every stage.
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'End it here. Go home to Quinn.',
  result: 'You make your excuses, warmly, and leave while it’s still nothing but a nice conversation. On the drive home you think about Quinn, and the guilt you don’t quite have yet, and you let it go.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'flowers',
    title: 'The Arrangements',
    speaker: 'narrator',
    text: 'The investor dinner needed flowers, and the flowers came with Elodie Fontaine — late twenties, sleeves pushed up, soil under a manicure she clearly did herself, running her family’s flower farm since her dad’s knees gave out. She’s standing on a chair fixing a garland when you walk in, and she looks down at you and just… lights up, like you’re the best thing that’s wandered into her evening. Nobody has looked at you like that in a long time.',
    choices: [
      {
        id: 'flowers_charm',
        label: 'Turn on the full wattage. Hold the chair, catch her hand, let the moment run.',
        result: 'She laughs — a real, easy, unguarded laugh — and doesn’t let go of your hand as fast as she could. It’s nothing. It’s a hand. It feels like more than nothing.',
        effects: { confidence: 2, risk: 3, founderTrust: -1 },
        next: 'talk',
      },
      {
        id: 'flowers_steady',
        label: 'Steady the chair, say “careful,” and step back to a polite distance.',
        result: 'You keep it kind and keep it wide. She thanks you, hops down on her own, and the moment stays exactly the size it should be.',
        effects: { dueDiligence: 3, valuationDiscipline: 2, founderTrust: 1, risk: -1 },
        next: 'talk',
      },
      walk('flowers'),
    ],
  },
  {
    id: 'talk',
    title: 'The Conversation',
    speaker: 'protagonist',
    text: '"So you’re the one everyone’s terrified of." Elodie says it delighted, not scared, snipping stems as she talks. "The others tonight all have that look — like they’re doing math on me. You don’t. You look at the peonies like you actually like them." She tilts her head. "Do you get to like things? In your life? Or is it all quarters and boards and — sorry, I’m told I ask too many questions."',
    choices: [
      {
        id: 'talk_confide',
        label: '“Honestly? No. I don’t get to like things out loud. It’s… nice, being asked.”',
        result: 'It slips out truer than you meant. Elodie goes soft and pleased, and something opens a door you should probably keep shut.',
        effects: { confidence: 1, risk: 2 },
        next: 'talk2',
      },
      {
        id: 'talk_deflect',
        label: '“I like plenty of things. My wife, mostly.” Say it easily, and mean it.',
        result: 'Elodie doesn’t miss a beat. "Good," she says warmly. "She’s lucky. Tell her the ranunculus were my idea." She’s not chasing anything. Somehow that makes it harder.',
        effects: { founderTrust: 2, dueDiligence: 2, valuationDiscipline: 1 },
        next: 'talk2',
      },
      walk('talk'),
    ],
  },
  {
    id: 'talk2',
    title: 'The Farm',
    speaker: 'protagonist',
    text: '"You should come see the farm sometime," Elodie says, and then immediately, "God, that sounded like a line. It’s not a line. It’s just — everyone I meet wants to buy something or sell something, and the farm makes people remember they’re people. Dahlias the size of your face. Terrible coffee in a tin pot. My gran’s recipe for pretty much everything." She wipes her hands. "You look like someone who forgot he was a person. Occupational hazard, I bet."',
    choices: [
      {
        id: 'farm_yes',
        label: '“Maybe I will. Text me — here.” Give her your personal number, not the office line.',
        result: 'You hand over the number that isn’t supposed to leave the family. She saves it under a little sunflower. Your thumb hovers over your own phone, and Quinn’s name is right there, and you put it away.',
        effects: { confidence: 2, risk: 4, founderTrust: -2 },
        next: 'end',
      },
      {
        id: 'farm_warm',
        label: '“That sounds genuinely lovely. Send an invite through my assistant — bring my wife too, she’d love it.”',
        result: 'You fold Quinn right into the invitation, on purpose, out loud. Elodie brightens. "Bring her! I’ll make the good coffee." The door you almost opened closes gently.',
        effects: { dueDiligence: 4, valuationDiscipline: 3, founderTrust: 2, risk: -1 },
        next: 'end',
      },
      walk('talk2'),
    ],
  },
  {
    id: 'end',
    title: 'The Night Ends',
    speaker: 'narrator',
    text: 'The dinner winds down. Elodie packs the last of her buckets into a battered van, waves at you across the emptying room, and mouths "the peonies were for you." It’s harmless. It’s a florist and a nice night. And yet you notice, walking to the car, that you’re smiling about a stranger — and that you’re a little slow to think about telling Quinn.',
    choices: [
      {
        id: 'end_keep',
        label: 'Keep the smile to yourself. Don’t mention Elodie to Quinn — it’s nothing, why complicate it.',
        result: 'A small omission. The first one. It sits in your chest, feather-light and heavier than it looks. You let it stay.',
        effects: { risk: 6, founderTrust: -2, confidence: 1 },
        next: 'invest',
      },
      {
        id: 'end_tell',
        label: 'Tell Quinn all about it tonight — the flowers, the farm, the funny florist, all of it.',
        result: 'You lay the whole harmless evening out for Quinn over tea, Elodie included. Quinn snorts. "A flower farm. You?" The thing stays exactly as small as it is, because you didn’t give it a secret to grow in.',
        effects: { dueDiligence: 8, valuationDiscipline: 5, founderTrust: 2, risk: -1 },
        next: 'invest',
      },
      walk('end'),
    ],
  },
]

export const AFFAIR_MEET: MogulStory = {
  id: 'affair_meet',
  industryId: 'food',
  icon: '🌷',
  title: 'The New Face',
  hook: 'The florist at the dinner keeps looking at you.',
  subject: 'Elodie',
  protagonist: 'Elodie Fontaine',
  length: 'short',
  firstStage: 'flowers',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: 'A Nice Night, Nothing More',
      line: 'You kept it warm and kept it honest — even folded Quinn into the invitation. Elodie’s lovely, and that’s all she is. You drive home light, with nothing to hide, and tell your wife about the peonies.',
    },
    good: {
      title: 'Harmless. Mostly.',
      line: 'A good evening, an easy laugh, a florist who thinks you hung the moon. You didn’t do anything wrong — you just liked it a little more than you should have, and you know it.',
    },
    neutral: {
      title: 'You Left While It Was Nothing',
      line: 'You ended it before it was anything to end — made your excuses and drove home to Quinn. Some doors are best not even leaned on. The evening stays a nice story and nothing else.',
    },
    bad: {
      title: 'The First Little Secret',
      line: 'Nothing happened. And yet you took her personal number, kept the smile to yourself, and decided — just this once — not to mention a name to Quinn. It’s nothing. It’s a feather. Feathers are how it always starts.',
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
