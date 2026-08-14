import type { InterestId, JourneyProfile } from './recommendations';
import type { PlayablePathId } from './path-experiences';

export type GuideDecision = 'saved' | 'skipped';

export type CuratedGuide = {
  id: string;
  title: string;
  author: string;
  authorContext: string;
  pathId: PlayablePathId;
  outcome: string;
  summary: string;
  minutes: number;
  cost: string;
  equipment: string;
  intendedAudience: string;
  verifiedAttempts: number;
  validation: 'Community tested' | 'Editorially verified';
  interestSignals: InterestId[];
  startingFresh: boolean;
  steps: string[];
};

export type UserGuide = {
  id: string;
  title: string;
  outcome: string;
  steps: string[];
  visibility: 'private' | 'unlisted';
  source: 'created' | 'imported';
  createdAt: string;
};

export const curatedGuides: CuratedGuide[] = [
  {
    id: 'sound-to-screen',
    title: 'Sound to Screen',
    author: 'Mara Nordin',
    authorContext: 'AV performer; 6 years',
    pathId: 'live-av',
    outcome: 'Record a private ten-minute reactive-visual mini set.',
    summary: 'A no-buy beginner route using one familiar track, free software, and borrowed controls only if they help.',
    minutes: 60,
    cost: 'EUR 0-40',
    equipment: 'Laptop + headphones',
    intendedAudience: 'Music and visual beginners who want a private first attempt.',
    verifiedAttempts: 57,
    validation: 'Editorially verified',
    interestSignals: ['music', 'visual', 'technology'],
    startingFresh: false,
    steps: ['Choose a familiar track', 'Create two reactive visual rules', 'Borrow a controller only if useful', 'Record a private mini set'],
  },
  {
    id: 'three-frame-match',
    title: 'The Match in Three Frames',
    author: 'Noah Bell',
    authorContext: 'Community coach + illustrator',
    pathId: 'sports-storyteller',
    outcome: 'Tell one ordinary sports moment as a before, change, and after.',
    summary: 'A consent-aware route that works with photos, sketches, or words and does not require posting the result.',
    minutes: 45,
    cost: 'EUR 0',
    equipment: 'Phone or paper',
    intendedAudience: 'Sports-curious makers, including people who do not want to perform publicly.',
    verifiedAttempts: 18,
    validation: 'Community tested',
    interestSignals: ['sports', 'visual', 'community'],
    startingFresh: true,
    steps: ['Choose one safe sports moment', 'Make a before frame', 'Show what changed', 'Finish with the result and a title'],
  },
  {
    id: 'four-moves-no-mirror',
    title: 'Four Moves, No Mirror',
    author: 'Inez Park',
    authorContext: 'Movement facilitator; adaptive practice',
    pathId: 'movement-maker',
    outcome: 'Invent and vary a comfortable four-move pattern.',
    summary: 'A low-intensity route with seated and hand-only variants. The result stays private and comparison is unnecessary.',
    minutes: 30,
    cost: 'EUR 0',
    equipment: 'Small clear space',
    intendedAudience: 'People curious about movement design rather than exercise performance.',
    verifiedAttempts: 31,
    validation: 'Editorially verified',
    interestSignals: ['sports', 'performance', 'visual'],
    startingFresh: true,
    steps: ['Choose four comfortable moves', 'Put them in an order', 'Change speed or direction', 'Repeat once and reflect'],
  },
  {
    id: 'two-sparks',
    title: 'Two Sparks, Zero Labels',
    author: 'Life Leveling field team',
    authorContext: 'Starting-fresh research route',
    pathId: 'curiosity-sampler',
    outcome: 'Compare two tiny experiments and find one honest signal.',
    summary: 'No passion or strength is assumed. Try one making prompt and one contrasting prompt, then compare energy and curiosity.',
    minutes: 30,
    cost: 'EUR 0',
    equipment: 'Household materials',
    intendedAudience: 'People who cannot yet name an interest, hobby, or strength.',
    verifiedAttempts: 12,
    validation: 'Community tested',
    interestSignals: ['curiosity', 'making'],
    startingFresh: true,
    steps: ['Choose two contrasting prompts', 'Try the first for ten minutes', 'Try the second for ten minutes', 'Compare energy, friction, and curiosity'],
  },
  {
    id: 'voice-of-the-play',
    title: 'Voice of the Play',
    author: 'Samira Okafor',
    authorContext: 'Amateur commentator + youth mentor',
    pathId: 'sports-storyteller',
    outcome: 'Record a clear 30-second private commentary about one play.',
    summary: 'A screen-light storytelling route for someone more interested in explaining a moment than editing footage.',
    minutes: 25,
    cost: 'EUR 0',
    equipment: 'Voice recorder or paper',
    intendedAudience: 'Sports fans who enjoy noticing decisions, roles, and turning points.',
    verifiedAttempts: 22,
    validation: 'Community tested',
    interestSignals: ['sports', 'community', 'performance'],
    startingFresh: false,
    steps: ['Recall or observe one play', 'Name the turning point', 'Explain why it mattered', 'Record or write a 30-second version'],
  },
];

export function recommendGuides(profile: JourneyProfile) {
  return curatedGuides
    .map((guide, order) => ({
      guide,
      order,
      score: guide.interestSignals.filter((signal) => profile.interests.includes(signal)).length * 3
        + (guide.startingFresh && profile.skills.includes('starting-fresh') ? 2 : 0)
        + (guide.pathId === 'curiosity-sampler' && profile.explorations.includes('find-a-spark') ? 5 : 0),
    }))
    .sort((left, right) => right.score - left.score || left.order - right.order)
    .map(({ guide }) => guide);
}

type SharedGuidePayload = Pick<UserGuide, 'title' | 'outcome' | 'steps'> & { version: 1 };

export function serializeSharedGuide(guide: UserGuide) {
  const payload: SharedGuidePayload = { version: 1, title: guide.title, outcome: guide.outcome, steps: guide.steps };
  return encodeURIComponent(JSON.stringify(payload));
}

export function parseSharedGuide(value: unknown, createdAt = new Date().toISOString()): UserGuide | null {
  if (typeof value !== 'string' || value.length > 6000) return null;
  try {
    const decoded = decodeURIComponent(value);
    const payload = JSON.parse(decoded) as Partial<SharedGuidePayload>;
    if (payload.version !== 1 || typeof payload.title !== 'string' || typeof payload.outcome !== 'string' || !Array.isArray(payload.steps)) return null;
    const title = payload.title.trim().slice(0, 80);
    const outcome = payload.outcome.trim().slice(0, 180);
    const steps = payload.steps.filter((step): step is string => typeof step === 'string').map((step) => step.trim().slice(0, 140)).filter(Boolean).slice(0, 6);
    if (!title || !outcome || steps.length < 2) return null;
    return {
      id: `imported-${hashSharedGuide(`${title}|${outcome}|${steps.join('|')}`)}`,
      title,
      outcome,
      steps,
      visibility: 'private',
      source: 'imported',
      createdAt,
    };
  } catch {
    return null;
  }
}

function hashSharedGuide(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
