// ============================================================
//  Mogul Story — "The Reckoning" (Affair arc, the FALLOUT). Force-launched, never offered:
//  Quinn Harlow found out. There is no reconciling this one — you cheated — so this story
//  runs on STANDARD band semantics (unlike the temptation episodes): being CONTRITE, honest,
//  and taking responsibility loads dueDiligence/valuationDiscipline/founderTrust → great/good,
//  and you lose the estate half but KEEP your ascension tokens. Denying, lying, lawyering-up,
//  or being cruel loads `risk` → 'bad', and you lose EVERYTHING, prestige included. The
//  walk-away here is NOT reconciliation — you can't reconcile a betrayal — it's refusing to
//  even face her (cowardice), which the engine reads as 'neutral' → also loses the tokens.
//  Resolution lives in engine/affair.ts (applyCaught → applyDivorceOutcome(state, band, true)).
//
//  Nothing physical was ever depicted; the wound is one of trust. Emotionally heavy by design —
//  this is the consequence beat of a morality mechanic.
//
//  All fictional — no real people, brands, or companies.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away = don't even show up. Not reconciliation — you can't reconcile a betrayal — but
// cowardice: you let the lawyers do the hardest thing you've ever done so you don't have to
// look at her. The engine reads it as 'neutral' → you still lose everything, tokens included.
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'Don’t even show up. Let the lawyers handle it.',
  result: 'You send counsel and stay home. Somewhere across town Quinn sits at a table you refused to sit at, and the last thing you ever do to her is not be in the room. It is the smallest you have ever been.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'kitchen',
    title: 'The Kitchen',
    speaker: 'narrator',
    text: 'She’s at the counter when you come in, still in her coat, her phone face-up beside her keys. She doesn’t look up. "I wasn’t snooping," Quinn says, in the flat voice she uses on people who’ve wasted her time. "A friend saw you. Then I looked. Then I stopped being able to un-look." She finally lifts her eyes, and they are dry, and level, and worse than any tears. "So. There she is. The flower one." Behind her, gran’s espresso machine ticks as it cools, oblivious. "Don’t you dare lie to me in my own kitchen."',
    choices: [
      {
        id: 'kitchen_own',
        label: '“It’s true. I did it. You don’t have to un-look — I’ll say it out loud. I cheated on you.”',
        result: 'You say the ugliest sentence of your life plainly, without a single softening word around it. Quinn flinches once — not at the news, at the honesty — and nods, slowly, like she’s filing it somewhere permanent.',
        effects: { dueDiligence: 2, valuationDiscipline: 2, founderTrust: 2, risk: -1 },
        next: 'why',
        roleBoost: 'operator',
      },
      {
        id: 'kitchen_minimise',
        label: '“It’s not — Quinn, it’s not what it looks like. Nothing actually happened. Let me explain.”',
        result: '"Nothing happened," she repeats, tasting the lie in it. "You’re standing in our kitchen doing damage control. You’re lawyering me and you haven’t even called a lawyer yet." Her jaw sets. Whatever door was still open just shut.',
        effects: { confidence: 1, risk: 3, founderTrust: -2 },
        next: 'why',
      },
      {
        id: 'kitchen_deny',
        label: '“Whoever your friend is, they’re wrong. You’re seeing something that isn’t there.”',
        result: 'She slides the phone across the counter to you, screen up, and lets it sit there between you like a body. "Say that again," she says quietly, "with this in your hand." You can’t.',
        effects: { risk: 4, founderTrust: -3 },
        next: 'why',
      },
      walk('kitchen'),
    ],
  },
  {
    id: 'why',
    title: 'The Question',
    speaker: 'protagonist',
    text: '"I don’t want the details. I will never want the details." Quinn pulls out a stool and sits, because her legs have decided the matter for her. "I want one thing. I gave you the sign. I moved my gran’s machine into your kitchen — do you understand what that machine is? It’s the last standing brick of Rosie’s. I trusted you with the last piece of the only person who ever raised me." Her voice doesn’t rise. It goes colder. "So. Why. And don’t you dare say it just happened."',
    choices: [
      {
        id: 'why_honest',
        label: '“Because I liked being adored and I was too much of a coward to tell you I felt invisible. That’s not your fault. It’s mine. All of it.”',
        result: 'It is not an excuse and you don’t let it become one. Quinn stares at you for a long moment. "At least you’re not lying to me now," she says. It is the last kind thing she will say tonight, and she means it as an epitaph.',
        effects: { dueDiligence: 2, valuationDiscipline: 2, founderTrust: 2, risk: -1 },
        next: 'blame',
        roleBoost: 'closer',
      },
      {
        id: 'why_deflect',
        label: '“You were never here, Quinn. You ran your empire twenty hours a day. What was I supposed to do?”',
        result: 'The temperature in the room drops through the floor. "There it is," Quinn says. "You found a way to make me the reason you did it. In my kitchen. To my face." She stands. "We’re done talking."',
        effects: { risk: 4, founderTrust: -3 },
        next: 'blame',
      },
      {
        id: 'why_shutdown',
        label: 'Say nothing. You don’t have an answer that isn’t an insult, so you give her silence.',
        result: 'The silence stretches until it becomes its own answer, and not a good one. "Right," Quinn says, to the empty air where your reason should have been. "Right."',
        effects: { risk: 2, founderTrust: -1 },
        next: 'blame',
      },
      walk('why'),
    ],
  },
  {
    id: 'blame',
    title: 'The Fury',
    speaker: 'narrator',
    text: 'And then — for exactly one sentence — the cold breaks. "I built a wall around myself my whole life," Quinn says, and her voice finally cracks down the middle, "and I took it down for exactly one person, and it was you, and you —" She stops. Reassembles. The wall comes back up in real time, brick by visible brick, and when she speaks again she is all corporate again, which is how you know how badly it landed. "Okay. That’s the last of that. From here it’s just logistics."',
    choices: [
      {
        id: 'blame_hold',
        label: 'Don’t reach for her, don’t defend yourself, don’t make her manage your guilt. Just: “I know. I’m so sorry, Quinn. You don’t owe me a soft landing.”',
        result: 'You give her the one thing you still can — you don’t make her comfort you for the crime you committed against her. She exhales, steadier for it. "No," she agrees. "I don’t."',
        effects: { dueDiligence: 2, valuationDiscipline: 2, founderTrust: 2, risk: -1 },
        next: 'sign',
        roleBoost: 'operator',
      },
      {
        id: 'blame_selfpity',
        label: '“Do you think I don’t hate myself for this? Do you think this is easy for me?”',
        result: '"Oh, we’re doing your feelings now," Quinn says, and something in her closes for good. "You cheated and you’d like me to console you about it. Get a lawyer. Mine will call yours."',
        effects: { confidence: 1, risk: 3, founderTrust: -2 },
        next: 'sign',
      },
      walk('blame'),
    ],
  },
  {
    id: 'sign',
    title: 'The Sign',
    speaker: 'protagonist',
    text: 'The settlement is drafted within a week — she does not drag it out, and neither should you. But there is one line item that stops you both. The rusty neon EAT sign. The one you outbid the world for at the auction where you met her; the one you hung, humming and warm and red, over the terrace where you asked her to marry you. Quinn’s counsel has it listed as a jointly-held asset. Quinn looks at it on the page like it’s a photograph of a person who died.',
    choices: [
      {
        id: 'sign_give',
        label: '“Strike it. It goes with her. It was always about her — I just didn’t deserve to be the one who bought it.”',
        result: 'Quinn’s pen stops over the page. "You’re not going to fight me for the sign." It isn’t a question and it isn’t gratitude — it’s something quieter, the recognition of a decency you spent on the wrong day. "Fine," she says. "It’s struck."',
        effects: { dueDiligence: 2, valuationDiscipline: 2, founderTrust: 2, risk: -1 },
        next: 'settle',
        roleBoost: 'closer',
      },
      {
        id: 'sign_claim',
        label: '“Actually — I paid for it. It’s on the schedule as joint. I’m entitled to half its value and you know it.”',
        result: 'For one second Quinn just looks at you, genuinely awed by the smallness of it. "You want to put a price," she says, "on the night we met. Okay. My lawyers will price it. And everything else." The gloves are off, and hers are lined with lead.',
        effects: { risk: 4, founderTrust: -3, confidence: 1 },
        next: 'settle',
      },
      walk('sign'),
    ],
  },
  {
    id: 'settle',
    title: 'The Terms',
    speaker: 'narrator',
    text: 'Now the money. This part was always going to cost you half — that’s the law and the fact of it, and you earned the bill. The only thing still up for grabs is how it goes: quiet and clean, or a scorched-earth contest between your counsel and hers. Yours leans in and murmurs that there’s room to fight — motions to file, delays to run, discovery to make miserable. It wouldn’t win. It would just make the last thing between you and Quinn a knife fight.',
    choices: [
      {
        id: 'settle_clean',
        label: '“No motions. No delays. Give her everything she’s owed and we sign it Friday. She’s bled enough because of me.”',
        result: 'Your lawyer blinks; hers, across the table, actually pauses. Quinn signs her half without a word, then says, to the paper, not to you: "That’s the first considerate thing you’ve done since the kitchen." From her, right now, it is enormous.',
        effects: { dueDiligence: 3, valuationDiscipline: 2, founderTrust: 2, risk: -1 },
        next: 'close',
        roleBoost: 'operator',
      },
      {
        id: 'settle_grind',
        label: '“File everything. Slow it down. Make walking away expensive — maybe she settles for less to be rid of me.”',
        result: 'You weaponise the one thing left: her wanting to be done with you. It is the cruelest move in a cruel process, and Quinn is far, far better funded to grind back. She matches every motion and buries you in three more. This will cost you everything before it’s over.',
        effects: { risk: 5, founderTrust: -3, confidence: 1 },
        next: 'close',
      },
      walk('settle'),
    ],
  },
  {
    id: 'close',
    title: 'The Signature',
    speaker: 'narrator',
    text: 'And then it’s the last page. A pen, the two of you, and the marriage rendered down to a stack of paper. Sign it like a person who did a terrible thing and knows it, and you walk out with half a life and your dignity intact. Sign it like a man still fighting the woman he wronged, and you walk out with nothing — she is better lawyered, better funded, and entirely, righteously done with you. Quinn caps her pen and waits to see, one last time, who you are.',
    choices: [
      {
        id: 'close_own',
        label: 'Sign the clean draft. Take the loss you earned, thank her lawyers, and go — no speeches, no fight left in you to have.',
        result: 'Two signatures. Half your empire is Quinn’s now, and you don’t contest a cent of it. At the door she doesn’t say goodbye. She just says, "The machine stays with me." You nod. Of course it does. It was always hers.',
        effects: { dueDiligence: 2, valuationDiscipline: 2, founderTrust: 2, risk: -1 },
        next: 'invest',
        roleBoost: 'closer',
      },
      {
        id: 'close_messy',
        label: 'Sign it, but get one last shot in — remind her, on the record, that she pushed you to this.',
        result: 'You cross the line one final time on the way out the door. Quinn doesn’t rise to it; she just lets your counsel’s bill and her counsel’s bill both come due, and hers ends the day owning more of your life than the settlement even required.',
        effects: { risk: 8, founderTrust: -3 },
        next: 'invest',
      },
      {
        id: 'close_fight',
        label: 'Refuse the draft. Tear into her terms line by line and make her earn every dollar.',
        result: 'You turn the last page into a battlefield. She has the deeper pockets and the moral high ground, which is an undefeated combination, and when the dust settles she has all of it — the estate, the tokens, the whole climb. You kept the fight. You lost the war and the ground under it.',
        effects: { risk: 8, founderTrust: -3, confidence: 1 },
        next: 'invest',
      },
      walk('close'),
    ],
  },
]

export const AFFAIR_CAUGHT: MogulStory = {
  id: 'affair_caught',
  industryId: 'food',
  icon: '🧨',
  title: 'The Reckoning',
  hook: 'Quinn found out.',
  subject: 'The Fallout',
  protagonist: 'Quinn Harlow',
  length: 'standard',
  firstStage: 'kitchen',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: 'You Didn’t Fight It',
      line: 'You owned it in the kitchen, you never once made her manage your guilt, and you signed away half without a single motion filed. You lose the estate split — deservedly, and the law of it — but you kept your dignity and every hard-won token of the climb, because you didn’t drag a wounded person through the mud to keep a dollar. The sign went with Quinn. So did the machine. So did she. "For what it’s worth," she says at the door, "you ended it like the person I thought I married." It’s the last thing she ever says to you.',
    },
    good: {
      title: 'Owned, If Messily',
      line: 'It got sharp in places — a deflection you shouldn’t have reached for, a beat where you made it about you — but in the end you took responsibility and you didn’t contest the split. You lose half the estate and keep the tokens of your ascension, which is the best a caught man can do. Not a clean exit. A survivable one, which at a reckoning is rare.',
    },
    neutral: {
      title: 'You Let It Burn',
      line: 'You didn’t deny it. You didn’t fight it. You just… didn’t show up — sent the lawyers and stayed home so you’d never have to sit across from what you did. The court doesn’t reward cowardice. She takes half the estate AND the whole climb — every ascension token gone — while you weren’t even in the room. The last thing you did to Quinn Harlow was not be there. It costs you everything, and you never once looked her in the eye.',
    },
    bad: {
      title: 'Scorched, And Deserved',
      line: 'You lied, you blamed her, you put a price on the sign and a knife in the settlement — you fought the woman you betrayed as if the betrayal were hers. She is better funded, better lawyered, and entirely in the right, and she takes all of it: half the estate the law owes her, and the rest of the climb for the way you made her earn it — every ascension token gone. You kept the fight all the way to the bottom. There was never a version of this where you won.',
    },
  },
  hintCopy: {
    highRisk: '💥 You’re making it worse.',
    someRisk: 'That was cruel, and it’ll cost you.',
    solid: 'You’re owning it.',
    leading: 'She’s ready to do this cleanly.',
    trailing: 'You’re turning this into a war you can’t win.',
    warm: 'She sees you taking responsibility.',
  },
}
