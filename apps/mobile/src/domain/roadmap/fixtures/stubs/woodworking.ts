import type { AtlasNode, Guide, Path } from '../../catalog';

// Breadth stress-test stub. Pressure point: access- and safety-gated Resource
// nodes sit on the required spine, and projects ARE the milestones.
export const woodworkingNodes: AtlasNode[] = [
  { id: 'tool-safety', type: 'foundation', title: 'Tool Safety', description: 'Sharp tools, guarded machines, eyes and ears — the non-negotiable floor of the craft.', domainId: 'making', clusterId: 'woodworking', depth: 0, size: 'standard' },
  { id: 'workshop-access', type: 'resource', title: 'Workshop Access', description: 'A community workshop, makerspace, class shop, or a corner of your own — access gates everything.', domainId: 'making', clusterId: 'woodworking', depth: 0, size: 'standard' },
  { id: 'joinery-basics', type: 'skill', title: 'Joinery Basics', description: 'Cutting wood so it stays together: butt, lap, and simple box joints before anything fancy.', domainId: 'making', clusterId: 'woodworking', depth: 1, size: 'major' },
  { id: 'first-box', type: 'project', title: 'First Box', description: 'The classic first project: four corners, a bottom, and every beginner mistake in one small package.', domainId: 'making', clusterId: 'woodworking', depth: 2, size: 'standard' },
  { id: 'finished-piece', type: 'milestone', title: 'Finished Piece', description: 'A completed piece someone actually uses — the craft’s unit of progress.', domainId: 'making', clusterId: 'woodworking', depth: 3, size: 'major' },
];

export const woodworkingPath: Path = {
  id: 'woodworking',
  title: 'Woodworking',
  status: 'stub',
  interestIds: ['making'],
  overview: {
    whatItIs:
      'Making things from wood, by hand and by machine. Access and safety gate everything: the route runs through a workshop you can actually use, and projects are the milestones. The hand-tool versus power-tool split is a genuine authorial divide.',
    settings: ['Community workshops, makerspaces, classes, garages.'],
    variants: ['Hand-tool-first; power-tool-first; class-based.'],
    realities: ['Shared workshops make the craft affordable; wood and time are the recurring costs.'],
    foundations: 'Safety and access come before technique; the first box teaches more than any video.',
  },
  nodeIds: ['tool-safety', 'workshop-access', 'joinery-basics', 'first-box', 'finished-piece'],
  neighborPathIds: [],
};

export const woodworkingGuide: Guide = {
  id: 'guide-community-workshop',
  version: 1,
  pathId: 'woodworking',
  title: 'Community-workshop woodworking',
  persona: {
    audience: 'People who want to make real objects without owning a shop.',
    startingPoint: 'No tools, no shop; a community workshop within reach.',
    outcome: 'A finished piece someone uses.',
    assumptions: ['Shared shops provide the machines and the induction training.'],
  },
  steps: [
    { id: 'ww1', nodeId: 'tool-safety', role: 'required', note: 'Before anything spins or cuts.', sortKey: 0 },
    { id: 'ww2', nodeId: 'workshop-access', role: 'required', note: 'The access gate on the spine: no shop, no craft.', sortKey: 1 },
    { id: 'ww3', nodeId: 'joinery-basics', role: 'required', note: 'Simple joints, done cleanly, beat clever joints done badly.', sortKey: 2 },
    { id: 'ww4', nodeId: 'first-box', role: 'checkpoint', note: 'Four corners and a bottom — every beginner lesson in one project.', sortKey: 3 },
    { id: 'ww5', nodeId: 'finished-piece', role: 'required', note: 'Something someone actually uses.', sortKey: 4 },
  ],
  edges: [
    { from: 'ww1', to: 'ww2', kind: 'next' },
    { from: 'ww2', to: 'ww3', kind: 'next' },
    { from: 'ww3', to: 'ww4', kind: 'next' },
    { from: 'ww4', to: 'ww5', kind: 'next' },
  ],
  stances: [],
  rationale: 'Access and safety sit on the required spine because the real world gates them there; projects are the milestones because that is how woodworkers measure progress.',
};
