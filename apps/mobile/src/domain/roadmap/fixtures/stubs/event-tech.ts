import type { AtlasNode, Guide, Path } from '../../catalog';

// Stub depth. whatItIs from docs/product/research/dj-vj-route-research.md §6.
// Schema pressure point: an apprenticeship-shaped route (show up, learn on real rigs).
export const eventTechNodes: AtlasNode[] = [
  { id: 'live-sound-basics', type: 'skill', title: 'Live Sound Basics', description: 'PA systems, consoles, gain structure, and mixing a room rather than a recording.', domainId: 'technology', clusterId: 'event-technology', depth: 1, size: 'standard' },
  { id: 'stage-lighting-dmx', type: 'skill', title: 'Stage Lighting & DMX', description: 'Fixtures, DMX control, and programming looks with free open-source lighting software and a cheap interface.', domainId: 'technology', clusterId: 'event-technology', depth: 1, size: 'standard' },
  { id: 'stagehand-apprenticeship', type: 'experience', title: 'Stagehand Apprenticeship', description: 'Volunteering or working as a stagehand at venues, churches, and community events — the trade’s canonical entry point.', domainId: 'technology', clusterId: 'event-technology', depth: 0, size: 'major' },
  { id: 'show-call', type: 'milestone', title: 'Working a Show Call', description: 'Crewing a real event from load-in to load-out, where success means the show going right and nobody noticing you.', domainId: 'technology', clusterId: 'event-technology', depth: 3, size: 'major' },
];

export const eventTechPath: Path = {
  id: 'event-technology',
  title: 'Event Technology',
  status: 'stub',
  interestIds: ['technology', 'making'],
  featuredGuideId: 'guide-stagehand-route',
  overview: {
    whatItIs:
      'The crew-side craft that makes shows happen: PA and consoles, stage lighting and DMX control, power, rigging. Its canonical entry is not software but showing up — working as a stagehand and learning on real rigs. It is a service trade with a job ladder, not a creative performance identity: the measure of success is the show going right and nobody noticing you.',
    settings: ['Venues, festivals, churches, corporate events, and community stages — wherever a show needs crew.'],
    variants: ['Sound-first, lighting-first, or general stage tech; freelance crewing versus venue staff.'],
    realities: ['Entry is labor and reliability, not gear ownership; free lighting-control software plus a cheap interface covers home practice.'],
    foundations: 'Signal flow is the single biggest overlap with performance crafts — the most important skill a live-sound engineer can have.',
  },
  nodeIds: ['signal-flow-rig-setup', 'live-sound-basics', 'stage-lighting-dmx', 'stagehand-apprenticeship', 'show-call'],
  neighborPathIds: ['djvj'],
};

export const eventTechGuide: Guide = {
  id: 'guide-stagehand-route',
  version: 1,
  pathId: 'event-technology',
  title: 'Stagehand-first: learn on real rigs',
  persona: {
    audience: 'People who like making shows work and want a route that starts with showing up, not buying gear.',
    startingPoint: 'No equipment, no training — willingness to load trucks and take direction.',
    outcome: 'Crew a full show call with a defined role.',
    assumptions: ['Local venues and community events take volunteers.', 'Learning happens on real rigs under supervision.'],
  },
  steps: [
    { id: 'et1', nodeId: 'stagehand-apprenticeship', role: 'required', note: 'The route IS the apprenticeship: everything else is learned inside it.', sortKey: 0 },
    { id: 'et2', nodeId: 'signal-flow-rig-setup', role: 'required', note: 'The most important skill you can have as a live-sound engineer.', sortKey: 1 },
    { id: 'et3', nodeId: 'live-sound-basics', role: 'recommended', note: 'Mixing is only a small share of the job; reliability is the rest.', sortKey: 2 },
    { id: 'et4', nodeId: 'stage-lighting-dmx', role: 'recommended', note: 'Free control software and a cheap interface make a zero-cost practice rig.', sortKey: 3 },
    { id: 'et5', nodeId: 'show-call', role: 'checkpoint', note: 'Load-in to load-out, one defined role, no surprises.', sortKey: 4 },
  ],
  edges: [
    { from: 'et1', to: 'et2', kind: 'next' },
    { from: 'et2', to: 'et3', kind: 'next' },
    { from: 'et3', to: 'et4', kind: 'next' },
    { from: 'et4', to: 'et5', kind: 'next' },
  ],
  stances: [],
  rationale: 'This trade is learned by crewing. The route places the apprenticeship first and treats named skills as things you pick up inside it, which is how the real career ladder works.',
};
