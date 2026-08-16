import type { AtlasNode, Guide, Path } from '../../catalog';

// Breadth stress-test stub. Pressure point: an external grading culture (V-scales)
// exists in the real world, and the product deliberately does not import it —
// progress states stay the standard seven.
export const boulderingNodes: AtlasNode[] = [
  { id: 'movement-fundamentals', type: 'foundation', title: 'Movement Fundamentals', description: 'Body position, footwork, and weight shift — the technique that outlasts strength.' },
  { id: 'gym-access', type: 'resource', title: 'Gym Access', description: 'A climbing gym membership or day passes — the practical gate to regular practice.' },
  { id: 'falling-safely', type: 'skill', title: 'Falling Safely', description: 'Controlled falls onto mats, spotting awareness, and knowing when to drop.' },
  { id: 'reading-problems', type: 'skill', title: 'Reading Problems', description: 'Studying a boulder problem before pulling on — sequences, holds, and rests. Gyms grade problems on their own scales; that is the gym’s language, not a score this route keeps.' },
  { id: 'outdoor-session', type: 'experience', title: 'Outdoor Session', description: 'A first session on real rock with experienced climbers, pads, and conservative choices.' },
];

export const boulderingPath: Path = {
  id: 'bouldering',
  title: 'Bouldering',
  status: 'stub',
  interestIds: ['movement'],
  overview: {
    whatItIs:
      'Climbing short, hard problems close to the ground, without ropes, over pads. Gyms made it one of the most accessible ways into climbing: technique and reading matter as much as strength, and progress is famously nonlinear.',
    settings: ['Climbing gyms; outdoor boulders with pads and partners.'],
    variants: ['Gym-first (the common route); outdoor-first where local rock and mentors exist.'],
    realities: ['A membership is the main recurring cost; shoes are the main gear. Grades vary by gym and are a conversation tool, not a report card.'],
    foundations: 'Movement fundamentals and safe falling come before strength; reading problems is the craft that compounds.',
  },
  nodeIds: ['movement-fundamentals', 'gym-access', 'falling-safely', 'reading-problems', 'outdoor-session'],
  neighborPathIds: [],
};

export const boulderingGuide: Guide = {
  id: 'guide-gym-first-bouldering',
  version: 1,
  pathId: 'bouldering',
  title: 'Gym-first bouldering',
  persona: {
    audience: 'Adults who want a physical practice with visible problem-solving.',
    startingPoint: 'No climbing experience; a gym within reach.',
    outcome: 'Confident, safe regular sessions and a first outdoor day.',
    assumptions: ['Rental shoes are fine at the start.', 'Grades are the gym’s language — this route never treats them as a score.'],
  },
  steps: [
    { id: 'bo1', nodeId: 'gym-access', role: 'required', note: 'The access gate: without a wall there is no practice.', sortKey: 0 },
    { id: 'bo2', nodeId: 'falling-safely', role: 'required', note: 'Before trying hard: learn to come off the wall.', sortKey: 1 },
    { id: 'bo3', nodeId: 'movement-fundamentals', role: 'required', note: 'Feet first; strength arrives on its own schedule.', sortKey: 2 },
    { id: 'bo4', nodeId: 'reading-problems', role: 'recommended', note: 'Study before pulling on; sequences are the puzzle.', sortKey: 3 },
    { id: 'bo5', nodeId: 'outdoor-session', role: 'checkpoint', note: 'With experienced climbers, pads, and conservative choices.', sortKey: 4 },
  ],
  edges: [
    { from: 'bo1', to: 'bo2', kind: 'next' },
    { from: 'bo2', to: 'bo3', kind: 'next' },
    { from: 'bo3', to: 'bo4', kind: 'next' },
    { from: 'bo4', to: 'bo5', kind: 'next' },
  ],
  stances: [],
  rationale: 'Safety and technique before strength, and the world’s grading scales stay outside the model: progress here is the standard non-coercive states, nothing more.',
};
