import type { AtlasNode, Guide, Path } from '../../catalog';

// Stub depth. whatItIs from docs/product/research/dj-vj-route-research.md §6.
export const creativeCodingNodes: AtlasNode[] = [
  { id: 'live-coding-patterns', type: 'skill', title: 'Live-Coding Musical Patterns', description: 'Writing and editing cyclic musical patterns in code, live, with the screen projected.', domainId: 'technology', clusterId: 'creative-coding-music', depth: 1, size: 'major' },
  { id: 'browser-video-synthesis', type: 'skill', title: 'Browser Video Synthesis', description: 'Live-coding visuals in a browser-based video synth — free, zero-install, and performable.', domainId: 'technology', clusterId: 'creative-coding-music', depth: 2, size: 'standard' },
  { id: 'algorave-set', type: 'milestone', title: 'Algorave Set', description: 'Performing live-coded music or visuals for a dancing audience, code on screen.', domainId: 'music', clusterId: 'creative-coding-music', depth: 3, size: 'major' },
];

export const creativeCodingPath: Path = {
  id: 'creative-coding-music',
  title: 'Creative Coding for Music',
  status: 'stub',
  interestIds: ['music', 'technology'],
  overview: {
    whatItIs:
      'Performing music and visuals by writing and editing code live, with the code projected — the live-coding scene’s founding ethic is showing your screen. The entry point is uniquely frictionless: open a browser-based pattern or video-synth environment and make sound or image in under a minute, then graduate to deeper stacks. Material is generated from algorithms rather than mixed from recordings, and the entire toolchain is free.',
    settings: ['Algoraves, art spaces, and browser-first practice at home.'],
    variants: ['Pattern-language music, live-coded visuals, or both at once.'],
    realities: ['The full toolchain is free; the skill floor is text and code fluency rather than beatmatching.'],
    foundations: 'The pattern model is cyclic — rhythm and song structure carry over directly from performance crafts.',
  },
  nodeIds: ['rhythm-song-structure', 'live-coding-patterns', 'browser-video-synthesis', 'algorave-set'],
  neighborPathIds: ['djvj'],
};

export const creativeCodingGuide: Guide = {
  id: 'guide-browser-first',
  version: 1,
  pathId: 'creative-coding-music',
  title: 'Browser-first live coding',
  persona: {
    audience: 'Coders and code-curious musicians who want to perform from a text editor.',
    startingPoint: 'A browser. Nothing to install, nothing to buy.',
    outcome: 'Perform a short live-coded set with the code projected.',
    assumptions: ['Free browser environments are the whole starter toolchain.'],
  },
  steps: [
    { id: 'cc1', nodeId: 'rhythm-song-structure', role: 'required', note: 'The pattern model is cyclic; phrasing is the material.', sortKey: 0 },
    { id: 'cc2', nodeId: 'live-coding-patterns', role: 'required', note: 'Sound in under a minute; depth over months.', sortKey: 1 },
    { id: 'cc3', nodeId: 'browser-video-synthesis', role: 'recommended', note: 'The live-coded video synth doubles as a lightweight visual rig.', sortKey: 2 },
    { id: 'cc4', nodeId: 'algorave-set', role: 'checkpoint', note: 'Show us your screens.', sortKey: 3 },
  ],
  edges: [
    { from: 'cc1', to: 'cc2', kind: 'next' },
    { from: 'cc2', to: 'cc3', kind: 'next' },
    { from: 'cc3', to: 'cc4', kind: 'next' },
  ],
  stances: [],
  rationale: 'Everything here is free and browser-first, so the route optimizes for making sound today and performing early.',
};
