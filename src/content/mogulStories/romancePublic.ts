// ============================================================
//  Mogul Story — "Going Public" (Romance, Episode 4 of 6). Months after the coast and
//  the words on the beach, a long-lens photo of two rival CEOs holding hands lands on
//  every front page. Both boards panic, the analysts smell a merger, and comms wants a
//  bloodless one-liner by five. The real question isn't the stock — it's whether Quinn
//  Harlow, who spent fifteen years making sure nobody could use her, will let herself be
//  seen caring about something. A short 5-stage romance beat on the shared runtime; own
//  it and she walks in on your arm, hedge it and she gets filed under "no comment."
//  industryId 'food' is trigger context only — eligibility is bespoke, gated on the
//  relationship stage (this episode only offers after "The Getaway" lands).
//
//  All fictional — no real people, brands, or companies.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away choice reused on every stage (you can always let the noise die down).
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'Let the story fade on its own',
  result: 'You stop feeding it and let the news cycle move on, the way news cycles do. Whatever the two of you are, it keeps — quietly, out of frame, and none the worse for the waiting.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'photo',
    title: 'The Photo',
    speaker: 'narrator',
    text: 'A long-lens shot, taken at a Saturday farmers’ market: the two of you, the rival CEOs the business press loves to headline, hands unmistakably laced over a crate of tomatoes. By breakfast it is everywhere — MERGER?!, the pun headlines, the think-pieces about market signals. Your phone will not stop. Neither, you suspect, will Quinn’s.',
    choices: [
      {
        id: 'photo_deny',
        label: 'Have comms kill it — “two colleagues, coincidental, no story here.”',
        result: 'The denial goes out fast and lands wrong. Somewhere across town, a person who has been photographed being happy for the first time in years watches you call it nothing.',
        effects: { risk: 2, founderTrust: -2, valuationDiscipline: -1 },
        next: 'boards',
      },
      {
        id: 'photo_wait',
        label: 'Don’t react to any of it. Call Quinn first — before either of you says a word to anyone else.',
        result: 'You leave the headlines unanswered and dial the only number that matters. Quinn picks up on the first ring. “Well,” she says. “That’s one way to skip the ‘what are we’ conversation.”',
        effects: { dueDiligence: 2, founderTrust: 2, valuationDiscipline: 1, risk: -1 },
        next: 'boards',
        roleBoost: 'operator',
      },
      {
        id: 'photo_joke',
        label: 'Post the photo yourself with a dry caption, before the tabloids frame it for you.',
        result: 'You seize the narrative with a one-liner. It’s a good line, and it works — though you notice, afterward, that you framed the two of you before you asked how she wanted to be framed.',
        effects: { confidence: 1, leverage: 1 },
        next: 'boards',
      },
      walk('photo'),
    ],
  },
  {
    id: 'boards',
    title: 'The Boards',
    speaker: 'narrator',
    text: 'Both boards convene emergency calls inside the hour. Analysts are asking whether a romance between direct rivals is a governance risk, a conflict of interest, or a merger tell to trade on. Your general counsel has drafted three "clarifying statements," and not one of them contains the word happy.',
    choices: [
      {
        id: 'boards_firewall',
        label: 'Recuse yourselves from anything competitive in writing — then tell the board the personal part isn’t theirs to vote on.',
        result: 'Clean, documented, unarguable: a wall around the conflict and a door closed on the intrusion. The board grumbles and complies. Quinn, cc’d on the memo, sends back a single line: “Efficient. I’m into it.”',
        effects: { valuationDiscipline: 2, founderTrust: 2, dueDiligence: 1 },
        next: 'talk',
        roleBoost: 'operator',
      },
      {
        id: 'boards_spin',
        label: 'Let comms run the “strictly professional, no conflict” line to calm the stock.',
        result: 'The stock steadies. So does the story — into a shape where the truest thing about your year is officially a non-event.',
        effects: { leverage: 1, confidence: 1, risk: 1 },
        next: 'talk',
      },
      {
        id: 'boards_dismiss',
        label: 'Tell the board to mind their own balance sheet — loudly, on the record.',
        result: 'It feels great for exactly four seconds. Then the clip leaks, and now there are two stories: the romance, and the CEO who lost his composure defending it.',
        effects: { risk: 3, founderTrust: -1 },
        next: 'talk',
      },
      walk('boards'),
    ],
  },
  {
    id: 'talk',
    title: 'The Ask',
    speaker: 'protagonist',
    text: 'Quinn calls that night, and for once she leads with the quiet voice, not the boardroom one. "So. We’re a headline." A pause you can hear her choosing. "I have spent fifteen years making sure nobody could use me to get to anything I care about. And now there is a photograph of me caring about something, on every screen in the country. I’ll follow your read on this. What do you want us to be — on the record?"',
    choices: [
      {
        id: 'talk_hide',
        label: '“Let’s keep it quiet a while longer. Less noise, less risk, less to manage.”',
        result: '“Sure,” Quinn says, in the even tone she saves for numbers she doesn’t believe. She agrees instantly, which is how you know it was the wrong answer.',
        effects: { risk: 2, founderTrust: -2, leverage: -1 },
        next: 'line',
      },
      {
        id: 'talk_us',
        label: '“I want to be the person you’re seen with. No ‘colleagues,’ no hedge. Us — on the record, and in your handwriting.”',
        result: 'Silence on the line, the good kind. “In my handwriting,” Quinn repeats, like she’s testing whether it holds weight. It does. “Okay,” she says. “Then we don’t hide.”',
        effects: { founderTrust: 2, dueDiligence: 1, valuationDiscipline: 1, risk: -1 },
        next: 'line',
        roleBoost: 'closer',
      },
      {
        id: 'talk_her',
        label: '“Whatever costs you the least. You’ve guarded this longer than I’ve known you — you get to set the price.”',
        result: '“Careful,” Quinn says softly. “Keep being that considerate and I’ll have to reassess my whole personality.” It’s a joke. It isn’t only a joke.',
        effects: { founderTrust: 1, dueDiligence: 1 },
        next: 'line',
      },
      walk('talk'),
    ],
  },
  {
    id: 'line',
    title: 'The Statement',
    speaker: 'narrator',
    text: 'Comms needs one sentence by five. The stock is jittery, the group chat of billionaires is feral, and a morning show has offered to fly you both to a couch. Whatever goes out under your two names is the thing history will quote. Your assistant hovers, thumb over send.',
    choices: [
      {
        id: 'line_corporate',
        label: 'A bloodless non-denial: “The parties maintain full competitive independence.”',
        result: 'It ships. The stock exhales. And a sentence with no pulse in it becomes the official record of the best thing that ever happened to either of you.',
        effects: { valuationDiscipline: 1, risk: 2, founderTrust: -1 },
        next: 'gala',
      },
      {
        id: 'line_true',
        label: 'One true line: “Rivals in business, nowhere else. Yes, it’s real. No, it’s not for sale.”',
        result: 'You read it to Quinn first. She’s quiet, then: “Send it.” It goes out. It’s screenshotted more than any earnings call you’ve ever given.',
        effects: { founderTrust: 2, confidence: 1, dueDiligence: 1, risk: -1 },
        next: 'gala',
        roleBoost: 'closer',
      },
      {
        id: 'line_silence',
        label: 'Issue nothing at all — let the photo stand, unspun, and let people make of it what they will.',
        result: 'No statement is its own statement. The absence of a denial says more than any press release could, and it says it in a voice nobody can accuse of spin.',
        effects: { dueDiligence: 1, valuationDiscipline: 1, leverage: 1 },
        next: 'gala',
      },
      walk('line'),
    ],
  },
  {
    id: 'gala',
    title: 'The Room',
    speaker: 'narrator',
    text: 'That Friday: the industry’s big charity gala — the same circuit, the same chandeliers, the room where you first bid against each other over a broken sign. Every camera is waiting to learn whether you’ll arrive apart and "keep it professional," or walk in together and end the speculation with a photograph nobody had to steal with a long lens.',
    choices: [
      {
        id: 'gala_solo',
        label: 'Arrive separately, work opposite ends of the room, give the lenses nothing.',
        result: 'You spend the evening performing distance. Across the floor Quinn does the same, flawlessly, and neither of you enjoys a second of it.',
        effects: { risk: 2, founderTrust: -1, leverage: -1 },
        next: 'invest',
      },
      {
        id: 'gala_together',
        label: 'Walk in together, her hand in yours, and let the flashbulbs do their worst — a nod to the auctioneer’s podium on the way past.',
        result: 'The room turns. The cameras go off like weather. Quinn doesn’t flinch — she squeezes your hand once, glances at the podium where a rusty sign once started all this, and murmurs, “Overpaid for that, too.”',
        effects: { confidence: 1, founderTrust: 2, dueDiligence: 1, risk: -1 },
        next: 'invest',
        roleBoost: 'closer',
      },
      {
        id: 'gala_quiet',
        label: 'Skip the gala entirely — terrible takeout, the coverage on mute, the two of you on the couch, unbothered.',
        result: 'You let the industry speculate at its own party while you split cold noodles at home. It’s the least public thing you could do, and somehow it settles the question more than any red carpet would.',
        effects: { founderTrust: 1, valuationDiscipline: 1, dueDiligence: 1 },
        next: 'invest',
      },
      walk('gala'),
    ],
  },
]

export const ROMANCE_PUBLIC: MogulStory = {
  id: 'love_public',
  industryId: 'food',
  icon: '📰',
  title: 'Going Public',
  hook: 'A long lens caught the two rival CEOs holding hands.',
  subject: 'The Headline',
  protagonist: 'Quinn Harlow',
  length: 'short',
  firstStage: 'photo',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: '“Rivals In Business, Nowhere Else”',
      line: 'They ran the photo of the two of you under the auction-house chandeliers on every front page, and for once Quinn didn’t flinch at a single camera. "Well," she says, reading the coverage over your shoulder, "the whole world knows I have a weakness now." She doesn’t sound worried. She sounds, for the first time in fifteen years, free.',
    },
    good: {
      title: 'On The Record',
      line: 'No spin, no hedge — you let it be true and let the noise burn itself out. By Monday the story is old news, and the thing underneath it is stronger for having been said out loud with both your names on it.',
    },
    neutral: {
      title: 'Kept Quiet, For Now',
      line: 'You let the headline fade without feeding it and kept the two of you out of frame a little longer. Nothing is wrong — it’s just still yours alone. The world can wait for the rest of it.',
    },
    bad: {
      title: 'The Non-Denial',
      line: 'You let the lawyers write a sentence with no pulse in it, and Quinn watched herself get filed under "no comment." It isn’t a breakup — but she guarded her heart in public because you wouldn’t, and that takes a little time to mend.',
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
