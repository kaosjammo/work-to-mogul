// ============================================================
//  Mogul Story — "Scrub or Fly" (Space). The finale. A closing launch window, a twitchy
//  valve sensor from a supplier who's cut corners before, and a customer screaming to fly.
//  Read the telemetry, resist the schedule pressure, and make the GO/NO-GO call. FLY on a
//  clean board and it's a historic success whose halo lifts the WHOLE empire; FLY on a
//  hunch and you scatter your rocket across the range; SCRUB and you live to launch another
//  day. A 9-stage `standard` launch drama — the ONE story with a bespoke, cross-industry
//  reward (a great launch → an empire-wide profit halo, wired in engine/angelDeal.ts).
//
//  All fictional — no real agencies, rockets, or people.
// ============================================================
import type { MogulStory, MogulStoryChoice, MogulStoryStage } from './types'

// Walk-away choice reused on every stage: call a hold and scrub the attempt.
const walk = (from: string): MogulStoryChoice => ({
  id: `${from}_walk`,
  label: 'Call a hold — scrub for today',
  result: 'You call the hold. The window closes, the rocket stays on the pad, and everyone exhales. A scrub is not a failure.',
  effects: {},
  next: 'walkaway',
  walkAway: true,
})

const STAGES: MogulStoryStage[] = [
  {
    id: 'window',
    title: 'The Window',
    speaker: 'protagonist',
    text: 'Flight Director Renn Okafor’s voice is tight in your headset. "Meridian-1 is fueled and green across the board — except one. Valve sensor four is flickering. Window opens in forty minutes and it does not reopen for three weeks. Customer’s watching. What’s the word, boss?"',
    choices: [
      {
        id: 'win_hype',
        label: '“One flaky sensor? Light this candle. We fly.”',
        result: 'You made the call before the data did. Renn’s pause says he noticed.',
        effects: { confidence: 3, risk: 3, dueDiligence: -2 },
        next: 'anomaly',
      },
      {
        id: 'win_data',
        label: '“Nobody’s flying on a hunch. Get me the sensor’s full history — now.”',
        result: 'Renn exhales. "Copy. Pulling the trend data." That’s how you run a range.',
        effects: { dueDiligence: 3, valuationDiscipline: 1 },
        next: 'anomaly',
        roleBoost: 'operator',
      },
      {
        id: 'win_calm',
        label: '“Forty minutes is plenty. Walk me through it, calmly, from the top.”',
        result: 'Setting an unhurried tone at T-minus-forty is its own kind of leadership.',
        effects: { founderTrust: 2, dueDiligence: 1, risk: -1 },
        next: 'anomaly',
      },
      walk('window'),
    ],
  },
  {
    id: 'anomaly',
    title: 'The Anomaly',
    speaker: 'narrator',
    text: 'The trace comes up on the big screen. Sensor four reads nominal, then spikes, then nominal again — a sawtooth. Either the valve is sticking (mission-ending) or the sensor itself is flaky (harmless). The two look identical from here. The only way to know is to dig.',
    choices: [
      {
        id: 'anm_assume_good',
        label: 'Assume it’s just a bad sensor. Sensors lie all the time.',
        result: 'Maybe. "All the time" is also what people say right before the time it wasn’t.',
        effects: { confidence: 1, risk: 3, dueDiligence: -1 },
        next: 'supplier',
      },
      {
        id: 'anm_crosscheck',
        label: 'Cross-check against the redundant sensor and the actuator current.',
        result: 'Redundant reads clean; actuator current is textbook. The valve is moving fine — it’s the sensor.',
        effects: { dueDiligence: 3, risk: -2, leverage: 1 },
        next: 'supplier',
        roleBoost: 'operator',
      },
      {
        id: 'anm_assume_bad',
        label: 'Assume the worst and start prepping a scrub.',
        result: 'Safe, but you haven’t actually looked. Caution without data is just a different guess.',
        effects: { risk: -1, dueDiligence: -1, valuationDiscipline: 1 },
        next: 'supplier',
      },
      walk('anomaly'),
    ],
  },
  {
    id: 'supplier',
    title: 'The Supplier',
    speaker: 'narrator',
    text: 'That sensor came from Halcyon Components — the vendor who shipped you out-of-spec bolts last year and buried it in a footnote. If the flicker is their hardware again, it could be the sensor… or it could be the valve they also built, cutting the same corners.',
    choices: [
      {
        id: 'sup_trust',
        label: 'They fixed the bolt thing. Give them the benefit of the doubt.',
        result: 'The benefit of the doubt is a loan. Halcyon has a history of not repaying it.',
        effects: { founderTrust: 1, risk: 2, dueDiligence: -1 },
        next: 'pressure',
      },
      {
        id: 'sup_records',
        label: 'Pull Halcyon’s lot numbers and the acceptance tests for THIS valve.',
        result: 'This valve passed an independent acceptance test two weeks ago. Documented. That matters.',
        effects: { dueDiligence: 3, leverage: 2, risk: -2 },
        next: 'pressure',
        roleBoost: 'buyer',
      },
      {
        id: 'sup_call',
        label: 'Get Halcyon’s chief engineer on the line, right now, on the record.',
        result: '"…Sensor batch had a known noise issue. The valves are clean, I’ll put it in writing." On the record, at last.',
        effects: { dueDiligence: 2, leverage: 1, founderTrust: 1 },
        next: 'pressure',
      },
      walk('supplier'),
    ],
  },
  {
    id: 'pressure',
    title: 'The Customer',
    speaker: 'narrator',
    text: 'A call patches through: the payload customer, who has a satellite window, a board meeting, and a temper. "I have paid for TODAY. Every scrub costs me a fortune and costs YOU the next contract. I don’t care about a blinking light. Launch my bird."',
    choices: [
      {
        id: 'prs_cave',
        label: '“Understood. We’ll make it work. We’re launching.”',
        result: 'You just let a man with a board meeting override your flight data. That’s how rockets end up in the sea.',
        effects: { risk: 3, valuationDiscipline: -3, founderTrust: 1 },
        next: 'review',
      },
      {
        id: 'prs_hold',
        label: '“You paid for a satellite in orbit, not a fireball. The data decides, not the clock.”',
        result: 'He swears. He also, somewhere under the swearing, knows you’re right.',
        effects: { valuationDiscipline: 3, leverage: 2, founderTrust: -1 },
        next: 'review',
        roleBoost: 'closer',
      },
      {
        id: 'prs_partner',
        label: '“Give me twenty minutes to clear the anomaly properly. Then we fly, or we scrub, together.”',
        result: 'Bringing the furious customer inside the decision instead of fighting him through it.',
        effects: { founderTrust: 2, valuationDiscipline: 1, dueDiligence: 1 },
        next: 'review',
      },
      walk('pressure'),
    ],
  },
  {
    id: 'review',
    title: 'The Data Review',
    speaker: 'you',
    text: 'You put it all on one screen: the sawtooth, the clean redundant sensor, the textbook actuator current, Halcyon’s "known noise issue" on the record. The picture is coming together — but a launch decision is only as honest as the question you’re willing to ask it.',
    choices: [
      {
        id: 'rev_confirm',
        label: 'Ask only the data that says GO. Build the case to fly.',
        result: 'Cherry-picking your own telemetry to agree with you. The most dangerous review there is.',
        effects: { dueDiligence: -2, risk: 3, confidence: 1 },
        next: 'weather',
      },
      {
        id: 'rev_falsify',
        label: 'Actively try to PROVE it’s the valve. If you can’t, it isn’t.',
        result: 'You attack your own GO case and it holds. Every path says "flaky sensor, sound valve."',
        effects: { dueDiligence: 3, valuationDiscipline: 2, risk: -3 },
        next: 'weather',
        roleBoost: 'operator',
      },
      {
        id: 'rev_secondopinion',
        label: 'Hand the raw data to an engineer who wasn’t in the room and ask them cold.',
        result: 'Fresh eyes, no sunk-cost. "It’s the sensor. I’d fly." Independent confirmation.',
        effects: { dueDiligence: 2, leverage: 1, risk: -1 },
        next: 'weather',
      },
      walk('review'),
    ],
  },
  {
    id: 'weather',
    title: 'Upper Winds',
    speaker: 'narrator',
    text: 'Range control chimes in: upper-level winds are at the edge of the envelope and shifting. Not a hard no — but one more variable stacking on the clock. The window is now twenty minutes and shrinking.',
    choices: [
      {
        id: 'wx_ignore',
        label: 'Winds are "edge of envelope," which means legal. Press on, ignore it.',
        result: '"Edge of envelope" is where margins go to die. You’re stacking risks and calling it momentum.',
        effects: { risk: 3, dueDiligence: -1 },
        next: 'dissent',
      },
      {
        id: 'wx_model',
        label: 'Get the latest balloon data and run the load model against real numbers.',
        result: 'The model closes with margin to spare. The winds are inside the lines, provably.',
        effects: { dueDiligence: 2, valuationDiscipline: 1, risk: -1 },
        next: 'dissent',
        roleBoost: 'operator',
      },
      {
        id: 'wx_trigger',
        label: 'Set a hard wind red-line: cross it and we scrub, no debate.',
        result: 'A bright line drawn in advance, before adrenaline can argue with it. Discipline.',
        effects: { valuationDiscipline: 3, leverage: 1, risk: -2 },
        next: 'dissent',
        roleBoost: 'buyer',
      },
      walk('weather'),
    ],
  },
  {
    id: 'dissent',
    title: 'The Dissenting Voice',
    speaker: 'protagonist',
    text: 'A young propulsion engineer keys her mic, voice shaking. "Ma’am — I know the data says go. But I have a bad feeling about that valve and I’d never forgive myself if I didn’t say it out loud." The whole control room goes quiet, watching how you treat the one person brave enough to dissent.',
    choices: [
      {
        id: 'dis_squash',
        label: '“Feelings aren’t telemetry. Stay off the loop unless you have data.”',
        result: 'You just taught every engineer in the room to swallow their doubts. That’s how you lose the next one.',
        effects: { founderTrust: -3, risk: 2, dueDiligence: -1 },
        next: 'poll',
      },
      {
        id: 'dis_honor',
        label: '“Thank you. Tell me exactly what your gut is snagging on — let’s go check it.”',
        result: 'You take the dissent seriously, chase it to ground, and it resolves clean. Now the whole room trusts the GO.',
        effects: { founderTrust: 3, dueDiligence: 3, risk: -2 },
        next: 'poll',
        roleBoost: 'closer',
      },
      {
        id: 'dis_note',
        label: '“Logged, and it counts. If anything else snags, you call a hold yourself.”',
        result: 'Giving the most junior voice a hand on the abort switch. Courage, rewarded and empowered.',
        effects: { founderTrust: 2, valuationDiscipline: 1, dueDiligence: 1 },
        next: 'poll',
      },
      walk('dissent'),
    ],
  },
  {
    id: 'poll',
    title: 'GO / NO-GO',
    speaker: 'protagonist',
    text: 'T-minus-eight and holding. Renn runs the poll. "Propulsion?" — "Go." "Guidance?" — "Go." "Range?" — "Go." "Payload?" — "…Go." He turns to you, the last voice. "Flight’s go on my board. It comes down to you. Are we flying, boss?"',
    choices: [
      {
        id: 'poll_gut',
        label: 'Poll the room’s energy, not the data. If it feels go, it’s go.',
        result: 'Vibes are not a flight rule. You’re about to bet a rocket on the mood of a room.',
        effects: { risk: 2, dueDiligence: -1, confidence: 1 },
        next: 'decision',
      },
      {
        id: 'poll_verify',
        label: 'Read back the anomaly closure one last time, out loud, for the record.',
        result: 'Sensor noise, confirmed; valve sound, confirmed; winds in-envelope, confirmed. Said aloud, it’s solid.',
        effects: { dueDiligence: 2, valuationDiscipline: 2, risk: -1 },
        next: 'decision',
        roleBoost: 'operator',
      },
      {
        id: 'poll_own',
        label: '“Whatever we call, it’s my call and my name on it. Everyone clear on that.”',
        result: 'Taking the weight off the team and onto yourself. They stand a little straighter.',
        effects: { founderTrust: 2, leverage: 1 },
        next: 'decision',
      },
      walk('poll'),
    ],
  },
  {
    id: 'decision',
    title: 'Scrub or Fly',
    speaker: 'narrator',
    text: 'The clock is stopped at T-minus-eight. One word sends Meridian-1 to orbit or keeps her on the pad. Renn’s thumb hovers. The customer’s on the line. The young engineer is watching. Everything you did in the last forty minutes comes down to the next second.',
    choices: [
      {
        id: 'dec_fly',
        label: '“Flight, you are GO. Let’s fly.”',
        effects: { confidence: 1 },
        next: 'invest',
      },
      {
        id: 'dec_fly_safe',
        label: 'Fly — but arm the abort triggers wide and brief the team to kill it at the first real anomaly.',
        result: 'Committing to the launch and to stopping it if the rocket says stop. Bold and disciplined at once.',
        effects: { valuationDiscipline: 2, dueDiligence: 1, risk: -1 },
        next: 'invest',
        roleBoost: 'operator',
      },
      {
        id: 'dec_scrub',
        label: '“Flight, we are NO-GO. Safe the vehicle. We scrub.”',
        effects: {},
        next: 'walkaway',
        walkAway: true,
      },
    ],
  },
]

export const LAUNCH: MogulStory = {
  id: 'launch_meridian',
  industryId: 'space',
  title: 'Scrub or Fly',
  hook: 'Your launch window is closing and a sensor won’t behave.',
  subject: 'Meridian-1',
  protagonist: 'Renn Okafor',
  length: 'standard',
  firstStage: 'window',
  order: STAGES.map((s) => s.id),
  stages: Object.fromEntries(STAGES.map((s) => [s.id, s])),
  outcome: {
    great: {
      title: 'Liftoff — Flawless',
      line: 'You cleared the anomaly the honest way, held the line against the clock, and honoured the voice that spoke up. Meridian-1 threads the window and puts the payload dead-centre in orbit. The launch is a global event — and the halo of a flawless flight lifts every business you own. The whole empire is flying.',
    },
    good: {
      title: 'Nominal',
      line: 'A clean launch and a satisfied customer. Not every call was perfect, but the bird’s in orbit, the payload’s alive, and your launch record just got another checkmark. Space hums with the win.',
    },
    neutral: {
      title: 'Scrubbed',
      line: 'You called NO-GO and stood the rocket down. The window’s gone and the customer’s grumbling, but the vehicle’s safe on the pad and every soul in that room learned you’ll never let a clock fly a rocket. You’ll launch another day.',
    },
    bad: {
      title: 'Rapid Unscheduled Disassembly',
      line: 'You flew on a hunch, a hope, and a customer’s temper — and eight minutes later Meridian-1 was a cloud of very expensive confetti over the range. No one was hurt, but the payload’s gone, the inquiry is starting, and Space wears the scorch marks.',
    },
  },
}
