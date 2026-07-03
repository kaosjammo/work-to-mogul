// ============================================================
//  Mogul Story — "The Secret" (Affair arc, Episode 3 of 5). It stopped being a nice
//  night a while ago. Elodie texts now — funny, warm, constant — and you find yourself
//  turning the phone face-down when Quinn walks in, deleting threads, keeping a whole
//  bright little life in your pocket that your wife knows nothing about. Nothing has
//  happened. Everything has changed. The escalation here is CONCEALMENT: a secret call,
//  a cover story, the low hum of a double life. Lean in (indulgent choices load `risk`;
//  the final decisive one loads it HARD → a 'bad' read = a line crossed — meet her in
//  secret and lie to Quinn's face) or stop hiding — tell Quinn, or draw a hard line with
//  Elodie (reads great/good). Walk away any time and you end the whole thing and go home.
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
  result: 'You type the last message you’ll ever send her — kind, final, honest — and then you delete the thread for real, the way you should have weeks ago. You go find Quinn. You don’t tell her yet, but you stop hiding, and that’s the whole fight, right there.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'thread',
    title: 'The Thread',
    speaker: 'narrator',
    text: 'It’s a Tuesday and there are forty-one messages. A photo of a dahlia the size of a dinner plate. A voice note of her gran swearing at a goat. A running joke you’d have to explain and would ruin by explaining. Elodie texts the way she talks — bright, constant, delighted to be talking to you. And you’ve started doing a thing: when Quinn comes into the room, your thumb finds the button and the screen goes dark, and you don’t even decide to do it anymore. It just happens.',
    choices: [
      {
        id: 'thread_hide',
        label: 'Turn the phone face-down. Answer Elodie under the table, mid-conversation with your wife.',
        result: 'You’re nodding at something Quinn said about the accountants while your thumb writes something that makes Elodie laugh in another postcode. Two conversations, one of them a secret. It’s a small, sick little thrill, and you notice you like it.',
        effects: { confidence: 2, risk: 3, founderTrust: -1 },
        next: 'delete',
      },
      {
        id: 'thread_pause',
        label: 'Leave the phone alone while Quinn’s in the room. Answer Elodie later, honestly, or not at all.',
        result: 'You put it down, screen up, and give your wife the room she’s standing in. It’s a small thing and it costs you nothing, and it’s the first time in a week the phone hasn’t felt like a live wire.',
        effects: { dueDiligence: 3, valuationDiscipline: 2, founderTrust: 1, risk: -1 },
        next: 'delete',
      },
      walk('thread'),
    ],
  },
  {
    id: 'delete',
    title: 'The Cleanup',
    speaker: 'narrator',
    text: 'Quinn borrows your phone to check a train time — she does it all the time, you’ve never had a reason to mind — and for one long second you watch her thumb hover near your messages and your whole chest goes cold. She finds the train, hands it back, says nothing. And afterwards you sit alone and scroll up through weeks of Elodie, and you realise you’re about to do the thing where you clean it up. Just in case. Just so there’s nothing to find.',
    choices: [
      {
        id: 'delete_wipe',
        label: 'Delete the whole thread. Every message. Leave nothing that could be found.',
        result: 'You watch weeks of her disappear, clean, gone, no evidence. It feels responsible, almost — tidy — right up until you understand exactly what you just did and why, and that people who have nothing to hide don’t do this.',
        effects: { confidence: 1, risk: 4, founderTrust: -2 },
        next: 'cover',
      },
      {
        id: 'delete_stop',
        label: 'Don’t delete anything. Sit with the cold feeling and ask yourself why it was there.',
        result: 'You leave the thread exactly where it is and make yourself feel the thing you just felt — the fear of being found — and name it honestly. It wasn’t nothing. It was a warning, in your own voice, and you finally listen to it.',
        effects: { dueDiligence: 3, valuationDiscipline: 3, founderTrust: 1, risk: -1 },
        next: 'cover',
      },
      walk('delete'),
    ],
  },
  {
    id: 'cover',
    title: 'The Cover Story',
    speaker: 'protagonist',
    text: '"Come get a coffee Thursday," Elodie writes. "The real coffee. I want to show you the new field, it’s all sweet peas, it’s ridiculous, you’ll love it." And it’s just coffee, and it’s a field, and it’s the easiest thing in the world — except Thursday you’re supposed to be with Quinn, and to go you’d have to say a thing to your wife that isn’t true. You can feel the little lie forming, pre-loaded, ready. "Client thing ran long." It’s right there.',
    choices: [
      {
        id: 'cover_lie',
        label: 'Say yes to Elodie. Start building the alibi — "client thing," you’ll be late, don’t wait up.',
        result: 'You text Elodie a yes with a sweet-pea emoji, and you draft the cover for Quinn in your head, smooth and plausible, and the frightening part is how good you are at it. The lie fits your mouth like it belongs there.',
        effects: { confidence: 1, risk: 4, founderTrust: -2 },
        next: 'thursday',
      },
      {
        id: 'cover_line',
        label: '“Elodie — I can’t do secret coffees. It’s not fair to my wife, or to you. I mean it.”',
        result: 'You send the hardest, kindest text you’ve sent in weeks. A long pause. Then: "…yeah. I know. I hate that you’re right." She’s gutted and gracious, and the field of sweet peas stays a field you never saw, and your chest unclenches a notch.',
        effects: { dueDiligence: 4, valuationDiscipline: 3, founderTrust: 2, risk: -1 },
        next: 'thursday',
      },
      {
        id: 'cover_open',
        label: '“Only if it’s not a secret. Let me tell Quinn I’m seeing the farm — or it’s a no.”',
        result: 'You make the condition out loud: no hiding, or no coffee. Elodie goes quiet, then soft. "That’s… actually really decent of you." The test of it is simple — a thing you can say to Quinn is safe; a thing you can’t, isn’t. You already know which this is.',
        effects: { dueDiligence: 4, valuationDiscipline: 2, founderTrust: 2, risk: -1 },
        next: 'thursday',
      },
      walk('cover'),
    ],
  },
  {
    id: 'thursday',
    title: 'Thursday',
    speaker: 'narrator',
    text: 'And now it’s the moment the whole secret has been building toward. Quinn’s in the kitchen, keys in hand, asking if you’re still on for tonight — she’s got a place in mind, the one with the bad wine and the good bread you both love. Elodie’s last text is still warm on your phone. Two roads, and only one of them has your wife in it. This is the one that counts. Whatever you say next, you’ll mean.',
    choices: [
      {
        id: 'thursday_go',
        label: 'Look Quinn in the eye, tell her the client thing ran long — and go meet Elodie instead.',
        result: 'You say it clean, straight to your wife’s face — "the Hartley thing’s dragging, don’t wait up" — and she believes you, because why wouldn’t she, and you drive out to a field of sweet peas and a woman who lights up when she sees you. Nothing touches. Nothing has to. You lied to Quinn to be here, and that’s the line, and you just walked all the way across it.',
        effects: { risk: 6, founderTrust: -2, confidence: 1 },
        next: 'invest',
      },
      {
        id: 'thursday_stay',
        label: 'Put the phone in your pocket, take Quinn’s hand, and go to dinner with your wife. Tell Elodie it’s done.',
        result: 'You choose the bad wine and the good bread and the woman you married. In the car you tell Elodie, gently and for the last time, that this is where it ends — and then you put the phone away and give Quinn the whole evening, no secret humming in your pocket. You feel lighter than you have in a month.',
        effects: { dueDiligence: 8, valuationDiscipline: 5, founderTrust: 2, risk: -1 },
        next: 'invest',
      },
      {
        id: 'thursday_tell',
        label: 'Stop, put the keys down, and tell Quinn the truth — all of it, the texts, Elodie, the deleting, everything.',
        result: 'It comes out shaky and complete — the florist, the forty-one messages, the thread you wiped, the coffee you almost lied about. Quinn goes very still. It’s the hardest conversation of your marriage and the most honest thing you’ve done in weeks. Whatever happens now, it happens in the light. No secret survives being said out loud.',
        effects: { dueDiligence: 8, valuationDiscipline: 5, founderTrust: 2, risk: -1 },
        next: 'invest',
      },
      walk('thursday'),
    ],
  },
]

export const AFFAIR_SECRET: MogulStory = {
  id: 'affair_secret',
  industryId: 'food',
  icon: '🤫',
  title: 'The Secret',
  hook: 'You’re deleting the texts now.',
  subject: 'Elodie',
  protagonist: 'Elodie Fontaine',
  length: 'short',
  firstStage: 'thread',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: 'Out of the Dark',
      line: 'You stopped hiding. You told Quinn — or you told Elodie no — and either way you dragged the whole thing into the light where secrets can’t live. Nothing happened, and now nothing’s hidden. You go to dinner with your wife with empty pockets and a clear chest.',
    },
    good: {
      title: 'You Stopped Lying',
      line: 'You didn’t build the cover story. You left the thread where it was, kept the field of sweet peas a field you never saw, and chose the woman in your kitchen over the one on your phone. It was close. You know how close.',
    },
    neutral: {
      title: 'You Deleted the Right One',
      line: 'You ended it before Thursday could arrive — sent the last honest message, deleted the thread for the right reason this time, and went home. The double life closes quietly, with no one ever needing to know it opened.',
    },
    bad: {
      title: 'The Line, Crossed',
      line: 'Still nothing physical. But you deleted the evidence, built the alibi, and then looked your wife in the eye and lied — "client thing ran long" — to go stand in a field with someone else. Nothing touched. It doesn’t matter. You crossed it the second the lie left your mouth.',
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
