import type { AtlasNode, Guide, Path } from '../../catalog';

// Breadth stress-test stub. Pressure point: a long-horizon route with no
// performable milestone — paused/practicing must read sensibly over years,
// with no deadline language anywhere.
export const japaneseNodes: AtlasNode[] = [
  { id: 'kana', type: 'skill', title: 'Kana', description: 'Reading hiragana and katakana fluently — the alphabet floor everything else stands on.', domainId: 'language', clusterId: 'learning-japanese', depth: 0, size: 'standard' },
  { id: 'core-grammar', type: 'foundation', title: 'Core Grammar', description: 'The sentence patterns that make input comprehensible; depth arrives over years, not weeks.', domainId: 'language', clusterId: 'learning-japanese', depth: 0, size: 'major' },
  { id: 'immersion-listening', type: 'experience', title: 'Immersion Listening', description: 'Regular listening to native material slightly above your level — the method wars agree on the input, not the order.', domainId: 'language', clusterId: 'learning-japanese', depth: 1, size: 'standard' },
  { id: 'speaking-practice', type: 'skill', title: 'Speaking Practice', description: 'Producing the language with a partner, tutor, or exchange — uncomfortable early, and that is normal.', domainId: 'language', clusterId: 'learning-japanese', depth: 2, size: 'standard' },
  { id: 'first-conversation', type: 'milestone', title: 'First Real Conversation', description: 'A short, unscripted exchange with a native speaker that both sides understood.', domainId: 'language', clusterId: 'learning-japanese', depth: 3, size: 'major' },
];

export const japanesePath: Path = {
  id: 'learning-japanese',
  title: 'Learning Japanese',
  status: 'stub',
  interestIds: ['language'],
  featuredGuideId: 'guide-immersion-first',
  overview: {
    whatItIs:
      'A long-horizon language practice: kana, grammar, thousands of hours of input, and speaking. Method debates (textbook-first versus immersion-first) are real and unresolved; plateaus are normal and expected. There is no stage, no gig, and no finish line — which is exactly why routes here must feel useful without deadlines.',
    settings: ['Self-study, tutoring, exchanges, and eventually travel or media in the wild.'],
    variants: ['Textbook-first; immersion-first; class-based.'],
    realities: ['Free resources cover the whole route; consistency over years is the actual cost.'],
    foundations: 'Kana first is near-universal; after that, the method wars begin and different Guides take different sides.',
  },
  nodeIds: ['kana', 'core-grammar', 'immersion-listening', 'speaking-practice', 'first-conversation'],
  neighborPathIds: [],
};

export const japaneseGuide: Guide = {
  id: 'guide-immersion-first',
  version: 1,
  pathId: 'learning-japanese',
  title: 'Immersion-first Japanese',
  persona: {
    audience: 'Self-directed learners who prefer input over drills.',
    startingPoint: 'Zero Japanese; an hour most days, indefinitely.',
    outcome: 'A first real conversation — months or years away, and that is fine.',
    assumptions: ['Plateaus are part of the route, not failure.', 'Paused is a respectable state; the route waits.'],
  },
  steps: [
    { id: 'jp1', nodeId: 'kana', role: 'required', note: 'A week or two of focus; everything downstream needs it.', sortKey: 0 },
    { id: 'jp2', nodeId: 'core-grammar', role: 'required', note: 'Just enough to make input comprehensible; return forever.', sortKey: 1 },
    { id: 'jp3', nodeId: 'immersion-listening', role: 'required', note: 'The engine of this route: daily input slightly above your level.', sortKey: 2 },
    { id: 'jp4', nodeId: 'speaking-practice', role: 'recommended', note: 'Later than textbook routes would have it — by design; other Guides disagree.', sortKey: 3 },
    { id: 'jp5', nodeId: 'first-conversation', role: 'checkpoint', note: 'Short, unscripted, mutual understanding. No timetable.', sortKey: 4 },
  ],
  edges: [
    { from: 'jp1', to: 'jp2', kind: 'next' },
    { from: 'jp2', to: 'jp3', kind: 'next' },
    { from: 'jp3', to: 'jp4', kind: 'next' },
    { from: 'jp4', to: 'jp5', kind: 'next' },
  ],
  stances: [],
  rationale: 'Input does the heavy lifting; speaking joins once listening carries it. The route is measured in years and states like practicing and paused, never in streaks or deadlines.',
};
