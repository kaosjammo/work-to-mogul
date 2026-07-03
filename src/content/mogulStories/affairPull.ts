// ============================================================
//  Mogul Story — "The Pull" (Affair arc, Episode 4 of 5 — the emotional peak).
//  By now Elodie Fontaine has stopped hiding it. On a warm evening at the farm she says
//  the thing out loud — plainly, without games — that she's falling for you and thinks you
//  feel it too. This is the strongest pull of the arc: an almost-moment, a charged silence,
//  the ache of a simpler, warmer life you can half-taste. She isn't manipulating you; she's
//  being honest, which is exactly what makes it hard. The finale is next.
//
//  The final decisive fork lives here: stand in the almost-moment / tell her you feel it too
//  (indulgent → loads `risk` → a 'bad' read = the line crossed), or stop it — gently, firmly,
//  and at real cost, because she's lovely and it hurts to end it ("I love my wife; I can't do
//  this to her, or to you") which reads great/good. Walk away any time and go home to Quinn.
//
//  Nothing physical is depicted; the stakes are trust and choice. Eligibility is bespoke —
//  gated on honeymoon booked + married, and only as the current arc episode (see engine/affair.ts).
//
//  All fictional — no real people, brands, or companies.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away = end it, right now, and go home. Available on every stage.
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'End it here. Go home to Quinn.',
  result: 'You don’t give her an answer. You give her a soft, sorry look, and your keys, and the door. On the drive home you think about Quinn, and about the ache you’re carrying that you’ve got no right to, and you let it go.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'porch',
    title: 'The Porch',
    speaker: 'narrator',
    text: 'It’s late at the farm — the good part of the evening, the part after the work, when the light goes gold and low and everything smells of cut stems and warm dust. Elodie hands you a chipped mug of the terrible tin-pot coffee and sits on the step beside you, close, her shoulder not quite against yours. She’s quiet for once. Then she looks at you — not playful, not teasing, just steady — and you feel the whole evening lean toward something you’ve both been walking around for weeks.',
    choices: [
      {
        id: 'porch_lean',
        label: 'Let your shoulder settle against hers. Don’t fill the silence. See what she does.',
        result: 'She doesn’t move away. Her shoulder warms against yours and she lets out a small breath, like she’s been holding it. The quiet gets heavier and softer at once. You are, you realize, deciding not to decide — which is its own kind of decision.',
        effects: { confidence: 1, risk: 3, founderTrust: -1 },
        next: 'said',
      },
      {
        id: 'porch_room',
        label: 'Shift a little, make room, wrap both hands around the mug. Keep the air breathable.',
        result: 'You give the moment somewhere to go that isn’t toward you. She notices — of course she notices — and smiles at the coffee instead of at you. "That bad?" she says about the coffee, meaning something else. Neither of you says the something else. Yet.',
        effects: { dueDiligence: 3, valuationDiscipline: 2, founderTrust: 1, risk: -1 },
        next: 'said',
      },
      walk('porch'),
    ],
  },
  {
    id: 'said',
    title: 'She Says It',
    speaker: 'protagonist',
    text: '"I’m going to say a thing," Elodie says, "and I need you to let me finish, because if I stop I won’t start again." She turns the mug in her hands. "I’m falling for you. There. Not a crush, not a bit of fun with the scary rich man — I know the difference. I think about you when you’re not here. I think you feel it too; I’m not making that up. I’m not asking you for anything. I just got so tired of pretending I didn’t, so I’m not, anymore." She looks up. "You can say whatever you want back. Even nothing."',
    choices: [
      {
        id: 'said_true',
        label: '“You’re not making it up.” Say it low, because it’s true, and let her hear that it’s true.',
        result: 'The words are out before your good sense can catch them, and they land like a match. Her eyes go bright and wet and so relieved. Something between you clicks over from almost to nearly — and nearly is a place you have absolutely no business standing.',
        effects: { confidence: 1, risk: 4, founderTrust: -1 },
        next: 'almost',
      },
      {
        id: 'said_hold',
        label: '“Elodie —” Just her name, gently, and don’t hand her the yes she’s bracing for.',
        result: 'You say her name like a full sentence, and she hears the whole thing inside it — the tenderness and the no, both. Her jaw sets, brave. "Right," she says softly. "Okay. I still meant it." You’ve told her the truth without telling her a lie, and it costs you both.',
        effects: { dueDiligence: 3, valuationDiscipline: 2, founderTrust: 1 },
        next: 'almost',
      },
      walk('said'),
    ],
  },
  {
    id: 'almost',
    title: 'The Almost',
    speaker: 'narrator',
    text: 'The distance between you has quietly gone. Her face is close now, tipped up, the gold light on it, and everything in you that’s tired and hungry for something easy and warm is pulling one direction. It would be so simple. It would feel, for exactly one moment, like relief. And under it, cold and clear, is Quinn — dry, exact, unromantic Quinn, who married you knowing precisely who you are and did it anyway. The whole thing is balanced on the next second. Nothing has happened. Everything is about to be decided.',
    choices: [
      {
        id: 'almost_stay',
        label: 'Don’t step back. Stay in it. Let the almost become a yes.',
        result: 'You hold the moment instead of breaking it — a hand at her jaw, the last inch of distance yours to keep or close, and you keep it, which is the same as closing it. Nothing further happens on that porch. It doesn’t need to. In your chest you feel the exact instant a line stops being a line and becomes a thing you did.',
        effects: { risk: 6, founderTrust: -2, confidence: 1 },
        next: 'invest',
      },
      {
        id: 'almost_stop',
        label: '“I can’t.” Pull back — gently, both hands, no cruelty. “I love my wife. I can’t do this to her. Or to you.”',
        result: 'You lean back, slow, so it doesn’t read as a flinch, and you keep hold of her hands while you do it so she knows it isn’t disgust — it’s the opposite. "I love my wife," you say, and it’s true, and it still hurts to say it here, to this good, honest face. "I can’t do this to her. And I won’t do it to you — you deserve someone who can say yes with his whole chest. That’s not me." Her eyes spill over. She nods. It is the hardest, cleanest thing you’ve done in a long time.',
        effects: { dueDiligence: 8, valuationDiscipline: 5, founderTrust: 2, risk: -1 },
        next: 'after',
      },
      walk('almost'),
    ],
  },
  {
    id: 'after',
    title: 'After',
    speaker: 'protagonist',
    text: 'She wipes her face with the back of a wrist, half a laugh coming through the tears. "Well," she says. "Can’t fault a girl for asking." She stands, gathers the mugs, steadier than you feel. "You’re a good man, and it’s deeply annoying." A pause. "Go home to your wife. Properly. Don’t come back and be my friend for a while — it’d be a kindness not to." She means it, and she’s right, and it lands in your chest like a stone you’ll carry a bit.',
    choices: [
      {
        id: 'after_home',
        label: 'Take the ache home to Quinn — the real one, no secrets, and be there like you mean it.',
        result: 'You drive home carrying it — the ache, and the fact that you turned it down. You don’t confess a play-by-play; there was nothing to confess. But you’re *present* with Quinn that night in a way you hadn’t been in a while, and she squints at you across the kitchen and says "you’re being weird," and you say "I love you," and mean it like a decision.',
        effects: { dueDiligence: 4, valuationDiscipline: 3, founderTrust: 2, risk: -1 },
        next: 'invest',
      },
      {
        id: 'after_linger',
        label: 'Say you’ll “still be around.” Leave the door cracked, just a little, just in case.',
        result: 'You can’t quite make the ending clean — you tell her you’ll pop by, no big deal, friends. She gives you a look that knows better than you do. The door you should have shut stays ajar, and an ajar door is an invitation you haven’t admitted you’ve sent.',
        effects: { risk: 3, founderTrust: -1 },
        next: 'invest',
      },
      walk('after'),
    ],
  },
]

export const AFFAIR_PULL: MogulStory = {
  id: 'affair_pull',
  industryId: 'food',
  icon: '🔥',
  title: 'The Pull',
  hook: 'Elodie said it out loud.',
  subject: 'Elodie',
  protagonist: 'Elodie Fontaine',
  length: 'short',
  firstStage: 'porch',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: 'You Chose Her. Your Wife.',
      line: 'She said it plainly, and you were plain right back: I love my wife, I can’t do this to her, or to you. It cost you — she’s lovely, and it hurt to end it — and you did it anyway, gently, and drove home to Quinn carrying the ache and nothing to hide. That’s what faithful looks like when it isn’t easy.',
    },
    good: {
      title: 'You Held the Line',
      line: 'You didn’t cross it. You told her the truth without telling her a lie, pulled back before the almost became a yes, and went home to your wife. You left the door a hair too far ajar for comfort — but you left, and that’s the part that counts.',
    },
    neutral: {
      title: 'You Left Before You Answered',
      line: 'You didn’t stand in the almost long enough to find out what you’d do. You gave her a soft look and the door and drove home to Quinn. Some moments are safest not finished. This one you didn’t finish.',
    },
    bad: {
      title: 'The Line, Crossed',
      line: 'She was honest, and it undid you. You stayed in the almost, kept the last inch instead of breaking it, let it tip from nearly into a thing you did. Nothing further happened on that porch. It didn’t have to. You know exactly what you chose — and so, soon, will Quinn.',
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
