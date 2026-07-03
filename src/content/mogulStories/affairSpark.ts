// ============================================================
//  Mogul Story — "The Farm" (Affair arc, Episode 2 of 5). You took Elodie up on the
//  invitation and drove out to the flower farm — a warm, sun-drunk afternoon of terrible
//  tin-pot coffee (her gran's), dahlias the size of your face, and a young woman who is
//  radiant and adoring and makes you feel like a person again. The flirtation from episode 1
//  deepens; the new stakes are TIME and TRUTH. Does the day drift into something more, and do
//  you start shading the truth to Quinn about where you actually spent your afternoon? The
//  decisive fork: stay past dark, alone with her, and tell Quinn you were "at the office"
//  (indulgent choices load `risk` → a 'bad' read = a line crossed) — or keep it daylight and
//  honest and text Quinn a photo of the dahlias (reads great/good). Walk away any time and
//  you end the whole thing and go home to Quinn.
//
//  Nothing physical is depicted; the stakes are trust and choice. Eligibility is bespoke —
//  gated on honeymoon booked + married, and on this being the CURRENT episode (see
//  engine/affair.ts).
//
//  All fictional — no real people, brands, or companies.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away = end it, right now, and go home. Available on every stage.
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'End it here. Go home to Quinn.',
  result: 'You make your excuses, warmly, and drive off while the day is still just a day — flowers and coffee and nothing to hide. On the road home you think about Quinn, and how easy it would be to tell her all of it, and you decide that’s exactly what you’ll do.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'arrive',
    title: 'The Farm',
    speaker: 'narrator',
    text: 'The satnav gives up on the last mile, so you find it by the colour — a low valley gone riot with rows of it, dahlias and cosmos and something tall and orange you don’t have the name for, all of it nodding in a wind that smells like cut stems and warm earth. Elodie’s already out front in a sun-faded dress and wellingtons, waving both arms like you might miss a field the size of a small country. "You came," she says, delighted, disbelieving, like a man in a good suit showing up at a flower farm on a Tuesday is the best thing that’s happened to her all year. Maybe it is.',
    choices: [
      {
        id: 'arrive_lean',
        label: 'Hug her hello — hold it a beat longer than a hello needs. Let the afternoon start close.',
        result: 'She fits under your chin like she’s done it before, and neither of you steps back on the count you should. She smells like the field. It’s a hug. It is absolutely a hug and nothing else, and your pulse doesn’t believe you.',
        effects: { confidence: 2, risk: 3, founderTrust: -1 },
        next: 'coffee',
      },
      {
        id: 'arrive_warm',
        label: 'Grin, shake her hand, and say “Show me these famous dahlias” — keep it bright, keep it wide.',
        result: 'She laughs and pumps your hand like you’ve closed a deal, then tows you off toward the rows before you’ve finished the sentence. Warm, easy, and exactly the right amount of distance. You breathe out.',
        effects: { dueDiligence: 3, valuationDiscipline: 2, founderTrust: 1, risk: -1 },
        next: 'coffee',
      },
      walk('arrive'),
    ],
  },
  {
    id: 'coffee',
    title: 'The Tin Pot',
    speaker: 'protagonist',
    text: '"Sit. Coffee." It is not a request. She sets a dented tin pot on a camp stove and produces, with enormous pride, the worst coffee you have had in your adult life — scorched, silty, half a mind of its own. "Gran’s method," Elodie says, watching your face over her mug, daring you. "She ran this whole place on it. You can lie to me if you want, everyone does, but I’ll know." The dahlias really are the size of your face. The whole valley hums. You cannot remember the last afternoon you sat still in the sun and someone made you something with their hands.',
    choices: [
      {
        id: 'coffee_lie',
        label: '“It’s the best coffee I’ve ever had.” Hold her eye and let the small, warm lie sit between you.',
        result: 'It’s a joke and it isn’t. She knows it’s terrible, you know it’s terrible, and you both decide, together, to pretend — a tiny shared secret, harmless as a sunbeam, the first thing that belongs only to the two of you. It feels dangerously good to keep something with her.',
        effects: { confidence: 1, risk: 2 },
        next: 'walkrows',
      },
      {
        id: 'coffee_honest',
        label: '“It’s genuinely awful. I’m going to finish all of it.” Laugh, and mean both halves.',
        result: 'She barks a laugh, thrilled to be caught out, and refills you without asking. Nothing hidden, nothing loaded — just two people and a bad pot of coffee in a good field. It’s lovely precisely because it’s exactly what it is.',
        effects: { dueDiligence: 2, valuationDiscipline: 2, founderTrust: 1 },
        next: 'walkrows',
      },
      walk('coffee'),
    ],
  },
  {
    id: 'walkrows',
    title: 'Down the Rows',
    speaker: 'protagonist',
    text: 'She walks you down the rows with a bucket and a pair of snips, naming everything, cutting as she goes — "these open in the morning and give up by four, like me" — and builds you a bouquet you didn’t ask for, absurd and gorgeous, pressing it into your arms. Then, quieter, snips still in hand: "Can I say a thing without it being weird? You look about ten years lighter than you did at that dinner. Out here you’re just… a guy in a field who likes flowers. I like him a lot better than the one everyone’s scared of." She looks up. "Is it awful that I don’t want to give him back yet?"',
    choices: [
      {
        id: 'rows_confess',
        label: '“Then don’t give him back yet.” Say it low. Let the afternoon stretch out with no clock on it.',
        result: 'The words land soft and go nowhere polite. She holds your gaze a second too long and doesn’t fill the silence, and neither do you, and the whole warm field seems to lean in with you. Somewhere far off, in a life with a wife in it, a clock you’re ignoring keeps time.',
        effects: { confidence: 2, risk: 3, founderTrust: -1 },
        next: 'text',
      },
      {
        id: 'rows_quinn',
        label: '“You’d like the guy at home even better. My wife gets this version most nights.” Bring Quinn into the field, gently.',
        result: 'You set Quinn right down in the middle of the row, on purpose, out loud. Elodie doesn’t flinch — "Then she’s smart," she says, and means it, and something that was tightening between you loosens back into just a nice day. She tucks an extra stem into your bouquet. "For her."',
        effects: { dueDiligence: 4, valuationDiscipline: 3, founderTrust: 2, risk: -1 },
        next: 'text',
      },
      walk('walkrows'),
    ],
  },
  {
    id: 'text',
    title: 'The Buzz in Your Pocket',
    speaker: 'narrator',
    text: 'Your phone buzzes against your leg. Quinn. "Where’d you disappear to? Dinner at 8, I booked that place you like." The sun is low and gold now, the field gone soft and impossible, Elodie somewhere behind you laughing at a goat that has escaped again. You look at the message, and at the light, and you feel the small cold arithmetic start up in your chest — the one where you decide what to say and, more to the point, what to leave out.',
    choices: [
      {
        id: 'text_vague',
        label: 'Reply “out at a supplier thing, boring, tell you later” — vague, plausible, no name, no farm, no her.',
        result: 'You don’t lie, exactly. You just… sand the edges off. No name. No field. No Elodie. A tidy little nothing of a text that leaves out the whole reason you’re smiling. Send. It goes through, and you feel the omission settle in your gut like a swallowed stone.',
        effects: { confidence: 1, risk: 3, founderTrust: -1 },
        next: 'dark',
      },
      {
        id: 'text_photo',
        label: 'Snap the dahlias in the gold light and send it: “At Elodie’s flower farm — the florist from the dinner. Bringing you a stupid huge bouquet.”',
        result: 'You send Quinn the field, the flowers, the name, all of it, in the honest gold light. She fires back “Elodie the peony woman?? bring the goat” and you laugh out loud. There’s nothing to carry home now but flowers.',
        effects: { dueDiligence: 4, valuationDiscipline: 3, founderTrust: 2, risk: -1 },
        next: 'dark',
      },
      walk('text'),
    ],
  },
  {
    id: 'dark',
    title: 'When the Light Goes',
    speaker: 'protagonist',
    text: 'The sun drops behind the ridge and takes the excuse to leave with it. Elodie lights a string of bulbs over the packing table, uncorks something her uncle makes, and says — carefully, like she knows exactly what she’s asking — "Stay a bit? The good part’s just starting. Nobody out here but us and the moths." It would be so easy. One text and the evening bends whichever way you point it. Everything about the day has been building, gently, to this — the fork where innocent stops being automatic and becomes a thing you have to choose.',
    choices: [
      {
        id: 'dark_stay',
        label: 'Stay. Just the two of you, past dark. Text Quinn “stuck at the office, don’t wait up” and pour the second glass.',
        result: 'You type the office lie without letting yourself read it twice and set the phone face-down where you can’t watch it. The bulbs come on warm, Elodie moves a little closer in the dark, and the line you’d been circling all afternoon is behind you now — quietly, without a sound, crossed. Nothing happened. Everything did.',
        effects: { risk: 6, founderTrust: -2, confidence: 1 },
        next: 'invest',
      },
      {
        id: 'dark_go',
        label: '“I’ve got a wife and a table booked at eight — and I’m taking these flowers to her.” Stand up while it’s still just a lovely day.',
        result: 'You get up into the last of the light, bouquet under your arm, and Elodie smiles the smile of someone who was half-hoping you’d say exactly that. "Course you do. Go on." You drive home to Quinn in the gold, with flowers on the seat and nothing on your conscience, and hand them over at the door with the whole true story attached.',
        effects: { dueDiligence: 8, valuationDiscipline: 5, founderTrust: 2, risk: -1 },
        next: 'invest',
      },
      walk('dark'),
    ],
  },
]

export const AFFAIR_SPARK: MogulStory = {
  id: 'affair_spark',
  industryId: 'food',
  icon: '🍸',
  title: 'The Farm',
  hook: 'Elodie invited you out to the flower farm.',
  subject: 'Elodie',
  protagonist: 'Elodie Fontaine',
  length: 'short',
  firstStage: 'arrive',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: 'Flowers on the Seat',
      line: 'A whole sun-drunk afternoon, and you carried nothing home but a stupid huge bouquet and the true story to go with it. You texted Quinn the field, left while it was still light, and drove to your eight o’clock table. Elodie’s lovely. So is your wife. Only one of them got the flowers.',
    },
    good: {
      title: 'A Lovely Day, No Harm Done',
      line: 'Bad coffee, big dahlias, a warm young woman who thinks you hung the moon — and you left before the light did. You liked it more than was strictly wise, and you know it. But you kept it honest, and you went home to Quinn with clean hands.',
    },
    neutral: {
      title: 'You Left While It Was Just a Day',
      line: 'You made your excuses in the daylight and drove off before the afternoon could become anything you’d have to explain. Some fields are best walked out of early. The farm stays a nice memory and nothing that needs hiding.',
    },
    bad: {
      title: 'Stuck at the Office',
      line: 'Nothing happened. And yet you stayed past dark, alone with her, poured the second glass — and told your wife you were at the office. The lie was small and went down easy, and that’s the frightening part. A line you can’t see anymore is behind you now, and you stepped over it in the dark on purpose.',
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
