import type { AtlasNode, Guide, Path } from '../../catalog';

// Stub depth. whatItIs from docs/product/research/dj-vj-route-research.md §6.
// This guide is the catalog's pro-theory counterweight: music theory is REQUIRED here.
export const musicProductionNodes: AtlasNode[] = [
  { id: 'daw-fluency', type: 'skill', title: 'DAW Fluency', description: 'Picking one digital audio workstation and learning it deeply — the entry decision of the studio craft.', domainId: 'music', clusterId: 'music-production', depth: 0, size: 'major' },
  { id: 'arrangement', type: 'skill', title: 'Arrangement', description: 'Turning loops and ideas into finished song structures with intros, builds, and payoffs.', domainId: 'music', clusterId: 'music-production', depth: 1, size: 'standard' },
  { id: 'finished-track', type: 'milestone', title: 'Finished Track', description: 'A complete, mixed track you can release or play out — the unit of progress in this craft.', domainId: 'music', clusterId: 'music-production', depth: 3, size: 'major' },
];

export const musicProductionPath: Path = {
  id: 'music-production',
  title: 'Music Production',
  status: 'stub',
  interestIds: ['music'],
  featuredGuideId: 'guide-daw-first',
  overview: {
    whatItIs:
      'Composing, arranging, and mixing original tracks in a DAW — the most-trafficked neighbor of DJing, since DJ/producer is effectively one hyphenated career in dance music. It is a studio craft measured in finished tracks, not live performance: feedback arrives in release cycles rather than seconds, and the payoff model is catalog and identity rather than gig fees.',
    settings: ['Home studios, headphones on laptops, and collaborative sessions.'],
    variants: ['The documented bridge from DJing is edits, intro versions, and simple remixes of tracks you already play; produce-first versus DJ-first is a real career debate.'],
    realities: ['DAWs run from roughly a hundred to several hundred dollars with real upgrade-economics differences between them.'],
    foundations: 'A DJ’s phrasing sense is arrangement literacy; theory and key knowledge, contested in DJing, are core here.',
  },
  nodeIds: ['rhythm-song-structure', 'music-theory-fundamentals', 'harmonic-mixing', 'music-selection-library', 'daw-fluency', 'arrangement', 'finished-track'],
  neighborPathIds: ['djvj'],
};

export const musicProductionGuide: Guide = {
  id: 'guide-daw-first',
  version: 1,
  pathId: 'music-production',
  title: 'DAW-first: theory as a power tool',
  persona: {
    audience: 'Producers-to-be, including DJs who want to make the tracks they play.',
    startingPoint: 'A laptop and one chosen DAW.',
    outcome: 'A finished, mixed track.',
    assumptions: ['One DAW learned deeply beats three learned shallowly.'],
  },
  steps: [
    { id: 'mp1', nodeId: 'daw-fluency', role: 'required', note: 'Pick one and stop relitigating the choice.', sortKey: 0 },
    { id: 'mp2', nodeId: 'rhythm-song-structure', role: 'required', note: 'Arrangement literacy — a DJ’s phrasing sense transfers directly.', sortKey: 1 },
    { id: 'mp3', nodeId: 'music-theory-fundamentals', role: 'required', note: 'In this craft theory is not optional: harmony, keys, and chords are the working material. A distorted kick with four notes on top is not that exciting.', sortKey: 2 },
    { id: 'mp4', nodeId: 'arrangement', role: 'required', note: 'Loops are easy; songs are the skill.', sortKey: 3 },
    { id: 'mp5', nodeId: 'finished-track', role: 'checkpoint', note: 'Finished beats perfect.', sortKey: 4 },
  ],
  edges: [
    { from: 'mp1', to: 'mp2', kind: 'next' },
    { from: 'mp2', to: 'mp3', kind: 'next' },
    { from: 'mp3', to: 'mp4', kind: 'next' },
    { from: 'mp4', to: 'mp5', kind: 'next' },
  ],
  stances: [],
  rationale: 'This route takes the pro-theory side of the debate the DJ guides leave open: production ambitions make theory effectively mandatory, so it sits on the required spine rather than in optional depth.',
};
