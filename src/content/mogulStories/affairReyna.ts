// ============================================================
//  Mogul Story — "Keeping Reyna" (Affair fallout, forced beat). The wreckage reaches
//  your Executive Assistant. You cheated on Quinn Harlow, got caught, and the divorce
//  halved the empire — and now Reyna Vaughn, the razor-sharp chief-of-staff you POACHED
//  from Gideon Frost after a three-episode courtship, has cleared her calendar to tell
//  you she's thinking of leaving. A man who broke his wife's trust is a man whose word
//  she now doubts, and Quinn's world is one Reyna moves in too; her own reputation is on
//  the line for staying. This is the negotiation to KEEP her — a losable one.
//
//  MECHANIC (see engine/affair.ts → applyReyna): great/good = Reyna STAYS; bad/neutral =
//  she WALKS and the EA unlock is LOST (re-winnable via the arc again). Handling it well
//  is HONESTY, owning the mistake without excuses, and appealing to the working
//  relationship you actually built — not money, not guilt, not treating her like property.
//  Those choices load dueDiligence/valuationDiscipline/founderTrust at low risk. Lying,
//  buying, guilt-tripping, or getting defensive loads `risk` hard → 'bad' → she's gone.
//  The `walk` on every stage = you don't fight for her → she leaves (neutral, also lost).
//
//  This is professional-but-personal, tasteful, grown-up. NOT romance. Eligibility is
//  bespoke and FORCED — it only fires after the caught-cheating divorce, and only if you
//  actually poached her (see nextForcedAffairStory). industryId 'food' is nominal.
//
//  All fictional — no real people, brands, or companies.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away = you don't fight for her. On any stage this lets Reyna go — she leaves,
// and the EA unlock leaves with her. You don't have the standing to ask her to stay.
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'Let her go. You don’t have the standing to ask.',
  result: 'You don’t reach for an argument, because you can’t find one that isn’t about you. "Okay," you say, and mean it as a release. Reyna studies you for a moment — almost disappointed you didn’t at least try — then gathers her coat. "Okay," she echoes. She’s already thinking about the door, and you let her walk toward it.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'calendar',
    title: 'A Cleared Calendar',
    speaker: 'protagonist',
    text: 'Reyna doesn’t clear her calendar for anything. She has cleared it for this. She sits across the desk you have left, in the office that is now half the size it was, and does not touch the coffee she poured you both. "I’m going to be direct, because you’ve earned that much and not much more right now," she says. "You lied to Quinn for months. To her face. I found out the same day the analysts did. And it made me ask a question I don’t like asking about the people I work for: if he’ll do that to the person he married — what exactly is my word worth to him?"',
    choices: [
      {
        id: 'calendar_deflect',
        label: '“That was my marriage, Reyna. It’s got nothing to do with the job — you of all people know how to keep those separate.”',
        result: 'Reyna sets down her pen with a precision that is somehow worse than a slam. "Nothing to do with the job," she repeats. "I moved my whole reputation to come work for you. Quinn and I know the same forty people. You don’t get to draw the line where it happens to be convenient for you."',
        effects: { confidence: 1, risk: 3, founderTrust: -2 },
        next: 'doubt',
      },
      {
        id: 'calendar_own',
        label: '“It has everything to do with the job. You came here on my word. I broke my word to someone else, and I’m not going to insult you by pretending you didn’t notice.”',
        result: 'Reyna goes still, the way she does when someone says the true thing before she has to. "No," she says quietly. "Don’t insult me. That’s the whole ask." It is not forgiveness. It is permission to keep talking, which is more than you were owed walking in.',
        effects: { dueDiligence: 2, founderTrust: 2, risk: -1 },
        next: 'doubt',
        roleBoost: 'operator',
      },
      {
        id: 'calendar_credit',
        label: '“You’re right to ask it. I’d ask it too. So ask it — all the way — and I’ll answer straight, even the parts that don’t flatter me.”',
        result: '"Straight," Reyna says, testing the word against everything she knows. "We’ll see." She picks the coffee up now, both hands around it, settling in. "Alright. You’ve bought yourself the meeting. Don’t waste it telling me what I want to hear."',
        effects: { dueDiligence: 1, valuationDiscipline: 1, founderTrust: 1 },
        next: 'doubt',
      },
      walk('calendar'),
    ],
  },
  {
    id: 'doubt',
    title: 'The Doubt',
    speaker: 'protagonist',
    text: '"Here’s what actually keeps me up," Reyna says. "It’s not the scandal. Scandals blow over. It’s that I built my name on reading people — on knowing who’ll hold and who’ll fold when it matters. I read you. I left Frost’s empire for you. And then you did a thing I did not see coming." She lets that sit. "So either I misjudged you, and I should update everything — or you did something out of character, and I should understand it. I need to know which. And you don’t get to just tell me it’s the second one."',
    choices: [
      {
        id: 'doubt_excuse',
        label: '“It was a hard year. The marriage was already dead — you weren’t there, you didn’t see it. Anyone might’ve slipped.”',
        result: 'The temperature in the room drops. "‘Anyone might’ve slipped,’" Reyna repeats, flat. "There it is. You just told me it wasn’t really your fault. That’s the tell, actually — that’s the thing I was afraid I’d misread." She has her answer, and it isn’t the one you wanted her to have.',
        effects: { confidence: 1, risk: 3, founderTrust: -2 },
        next: 'offer',
      },
      {
        id: 'doubt_noexcuse',
        label: '“I’m not going to hand you a reason, because a reason is just an excuse that’s learned to dress itself. I did it. It was mine. No ‘hard year’, no ‘it was already over’. Me.”',
        result: 'Reyna exhales slowly, and something in her recalculates. "You’ve clearly practised not saying the excuse," she observes. "But you didn’t say it. People who mean to do better start exactly there — by refusing the sentence that lets them off." She isn’t warm yet. But she’s still in the chair.',
        effects: { dueDiligence: 2, valuationDiscipline: 1, founderTrust: 2, risk: -1 },
        next: 'offer',
        roleBoost: 'operator',
      },
      {
        id: 'doubt_ownchar',
        label: '“I’m not going to argue it was out of character. It was my character, on a bad stretch, doing the easy thing. If you need me to be the guy who never would — I can’t sell you that, and I won’t.”',
        result: '"You won’t sell it to me." Reyna almost — almost — smiles, though there’s no humour in it. "Do you know how rare that is, in this building? The instinct in that chair is always to sell. You just declined to." She notes it, the way she notes the thing that changes a verdict.',
        effects: { dueDiligence: 2, founderTrust: 1, valuationDiscipline: 1 },
        next: 'offer',
      },
      walk('doubt'),
    ],
  },
  {
    id: 'offer',
    title: 'What You’re Offering',
    speaker: 'you',
    text: 'This is the part every rattled boss botches — the moment you say why she should stay. And you can feel the two wrong doors on either side of it: the checkbook, and the guilt trip. Reyna has heard both a hundred times from lesser men and filed them both under "reasons people leave." She watches you locate the narrow space between them, curious whether you can stand in it without reaching for either wall.',
    choices: [
      {
        id: 'offer_money',
        label: 'Slide a revised package across the desk. A raise, equity, a title bump — enough that leaving would cost her real money.',
        result: 'Reyna doesn’t look at the paper. "You did the divorce math and now you’re doing mine," she says. "You think this is a retention problem. It’s a trust problem, and you just tried to solve it with the one instrument that proves you still don’t get the difference." She slides the paper back, untouched.',
        effects: { confidence: 1, risk: 3, valuationDiscipline: -2, founderTrust: -1 },
        next: 'crux',
      },
      {
        id: 'offer_respect',
        label: '“I’m not offering you money — you’d see through it, and it’d be an insult besides. I’m offering you the thing we actually built: a room where your judgment runs and your name is on the wins. That part I didn’t break. That part is still true.”',
        result: 'Reyna considers it for a long moment. "The work was real," she concedes, almost reluctantly. "I’ll give you that. The seat you gave me, the veto, the credit out loud — none of that was a lie. It’s the only thing you’ve said today that I already knew was true before you said it."',
        effects: { dueDiligence: 2, founderTrust: 2, valuationDiscipline: 1, risk: -1 },
        next: 'crux',
        roleBoost: 'closer',
      },
      {
        id: 'offer_guilt',
        label: '“After everything I gave you? I pulled you out of Frost’s sinking ship, built you a seat, made your name here. You’d really walk over my personal life?”',
        result: 'Reyna’s expression closes like a ledger. "After everything you gave me," she repeats. "You just made staying a debt I owe you. That’s the same move Frost made, dressed nicer. I don’t leave fires for cheques, and I don’t stay in them out of guilt. You should know that better than anyone — you’re the one who told me so."',
        effects: { confidence: 1, risk: 3, founderTrust: -3 },
        next: 'crux',
      },
      walk('offer'),
    ],
  },
  {
    id: 'crux',
    title: 'The Real Question',
    speaker: 'protagonist',
    text: 'Reyna leans forward, and now it’s just the two of you and the actual thing. "Forget Quinn for a second. Forget the money. Here’s what I need to know, and I’ll know if you rehearse it." Her eyes don’t leave yours. "You weren’t straight with the person who trusted you most in the world. So tell me — why on earth should I believe you’ll be straight with me? What makes my desk different from her kitchen table?"',
    choices: [
      {
        id: 'crux_promise',
        label: '“Because I’d never do that to you. You have my word — the same word, I know, but I mean it this time. You’re different. This is different.”',
        result: '"‘My word, but I mean it this time.’" Reyna lets the sentence hang until it curdles. "You hear how that sounds. The word’s the exact thing that failed. Handing me a fresh one, shinier, isn’t a plan — it’s the same promise with the paint still wet."',
        effects: { confidence: 1, risk: 3, founderTrust: -2 },
        next: 'decision',
      },
      {
        id: 'crux_structure',
        label: '“It shouldn’t rest on my word — my word’s the thing that failed, and I’m not going to ask you to re-trust it on faith. So don’t. Keep your veto. Keep the open books. Hold me to what you can see, not what I promise. I’d rather earn it slow than ask you to take it on credit.”',
        result: 'Reyna sits back, and for the first time all meeting the wariness has something underneath it that might be respect. "You just told me not to trust your word and to trust the structure instead," she says slowly. "That’s the only answer that isn’t another version of the lie. You can’t re-earn trust by asking for it. You earn it by making it unnecessary to ask."',
        effects: { dueDiligence: 2, valuationDiscipline: 2, founderTrust: 2, risk: -1 },
        next: 'decision',
        roleBoost: 'operator',
      },
      {
        id: 'crux_honest',
        label: '“Honestly? Maybe you shouldn’t believe me yet. I don’t think I get to be believed on schedule. What I can tell you is Quinn never got to watch me try to be better — you would. That’s the only difference I can actually offer, and I won’t pretend it’s more than it is.”',
        result: 'Something in Reyna’s posture eases by a degree. "‘Maybe you shouldn’t believe me yet.’" She turns it over. "That’s the first thing you’ve said that a liar wouldn’t. A liar always wants the belief now, all of it, today. You just asked me for time instead of trust. Those aren’t the same, and I think you know it."',
        effects: { dueDiligence: 2, founderTrust: 1, valuationDiscipline: 1 },
        next: 'decision',
      },
      walk('crux'),
    ],
  },
  {
    id: 'decision',
    title: 'Her Decision',
    speaker: 'protagonist',
    text: 'Reyna is quiet for a while. Outside, the smaller empire hums along, half of it gone to the settlement. Finally she squares the coffee cup to the edge of the desk — a tell you’ve learned means she’s reached a verdict. "I came in here at seventy-thirty toward the door," she says. "You’ve moved me. I want to know how far before I say a number out loud. So — last word. What are you actually asking me for?"',
    choices: [
      {
        id: 'decision_beg',
        label: '“I’m asking you to stay because I need you. The place doesn’t run without you, especially not now. Name whatever it takes — I’ll match it, beat it, sign it today.”',
        result: 'Reyna closes her eyes briefly, and when she opens them the small warmth you earned has gone cold and businesslike. "You need me," she says. "That’s about you again. And ‘name whatever it takes’ is the checkbook, back for one more try." She reaches for her coat. "You almost had it. You reached for the wallet on the last word."',
        effects: { risk: 8, founderTrust: -3 },
        next: 'invest',
      },
      {
        id: 'decision_straight',
        label: '“I’m asking you to stay because the work we built is worth staying for — and to hold me to every inch of it, out loud, no benefit of the doubt. Not because I’ve earned trust back. Because I haven’t, and I’d rather you watch me earn it than take my word for it.”',
        result: 'Reyna looks at you for a long, weighing beat — the ledger reconciled at last. "That," she says quietly, "is the only sentence that would have kept me in this chair. You didn’t ask me to forgive you and you didn’t try to buy me. You asked me to keep score, and to stay while you settled the account." She sets the coat back down.',
        effects: { dueDiligence: 3, valuationDiscipline: 2, founderTrust: 2, risk: -1 },
        next: 'invest',
        roleBoost: 'closer',
      },
      {
        id: 'decision_honest',
        label: '“Straight? I’m asking you to give me the chance to prove the working relationship was the real thing — even if the marriage wasn’t. No promises you have to swallow whole. Just the room to be better than my worst month, with you watching.”',
        result: 'Reyna exhales, and the tired wariness finally has something steadier under it. "The room to be better, with me watching," she repeats. "Not a promise. A probation, and you handed it to me yourself." She almost smiles. "You understand I’ll actually use it. Loudly."',
        effects: { dueDiligence: 2, founderTrust: 2, valuationDiscipline: 1 },
        next: 'invest',
      },
      walk('decision'),
    ],
  },
]

export const AFFAIR_REYNA: MogulStory = {
  id: 'affair_reyna',
  industryId: 'food',
  icon: '🧾',
  title: 'Keeping Reyna',
  hook: 'Reyna’s cleared her calendar to talk.',
  subject: 'The Negotiation',
  protagonist: 'Reyna Vaughn',
  length: 'standard',
  firstStage: 'calendar',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: 'She Stays',
      line: 'Reyna sets the coat back down and pulls her chair in. "Alright," she says. "I’m staying. Not because I’ve forgiven it — that’s not mine to do — but because you didn’t once ask me to. You owned it, you didn’t buy me, and you handed me the scoreboard instead of a promise." Her eyes are level, and there’s a warning folded into the yes. "I’ll be watching the account. Closely. But the working relationship was real, and I don’t leave real things over other people’s wreckage." It’s a wary, earned yes — the only kind she gives.',
    },
    good: {
      title: 'A Conditional Stay',
      line: 'Reyna weighs it the way she weighs everything, twice, and lands just on the right side of the line. "I’ll stay," she says. "On terms. Full veto, open books, and the first time your word and your actions disagree in front of me, I revisit this whole conversation." It isn’t warmth and it isn’t forgiveness. It’s a professional deciding the work still holds even though the man cracked — and choosing to keep score rather than keep walking. You keep your EA. You also keep the debt.',
    },
    neutral: {
      title: 'Reyna Walks',
      line: 'You didn’t fight for her — not really, not with anything that wasn’t about you. And Reyna, who has spent a career watching people decline to fight for the right things, gathered her coat and went. "You didn’t even try to keep me," she says at the door, not unkindly. "Which is its own kind of answer." She goes back to the market that made her — maybe back to Gideon, who’ll take her in a heartbeat. The seat you built her sits empty. You’ve lost your EA, and you handed her the exit yourself.',
    },
    bad: {
      title: 'Gone',
      line: 'You reached for the checkbook, or the guilt, or the excuse — and watched Reyna remember precisely why she reads people for a living. "I moved my whole reputation to work for a man whose word meant something," she says, coat already on. "You spent that, and then you tried to buy it back with the exact instrument that proves you learned nothing." She doesn’t slam the door. She never does. She’ll be back at Gideon Frost’s side within the week, and this time she won’t be poachable. The EA is gone.',
    },
  },
  hintCopy: {
    highRisk: '💼 You’re losing her.',
    someRisk: 'That read as buying or blaming.',
    solid: 'You’re being straight with her.',
    leading: 'She’s picturing staying.',
    trailing: 'You’re making it about you.',
    warm: 'She still respects you.',
  },
}
