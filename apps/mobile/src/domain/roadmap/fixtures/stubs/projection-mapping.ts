import type { AtlasNode, Guide, Path } from '../../catalog';

// Stub depth. whatItIs from docs/product/research/dj-vj-route-research.md §6.
export const projectionMappingNodes: AtlasNode[] = [
  { id: 'surface-mapping', type: 'skill', title: 'Surface Mapping & Warping', description: 'Warping and masking video to fit real three-dimensional surfaces — façades, stage sets, sculptures.', domainId: 'design', clusterId: 'projection-mapping', depth: 1, size: 'major' },
  { id: 'site-survey', type: 'experience', title: 'Site Survey', description: 'Measuring a real surface, planning projector placement, and testing throw and brightness before the show.', domainId: 'design', clusterId: 'projection-mapping', depth: 1, size: 'minor' },
  { id: 'mapped-installation', type: 'milestone', title: 'Mapped Installation', description: 'A finished projection onto a real object or wall, aligned, blended, and reliable over hours.', domainId: 'design', clusterId: 'projection-mapping', depth: 3, size: 'major' },
];

export const projectionMappingPath: Path = {
  id: 'projection-mapping',
  title: 'Projection Mapping',
  status: 'stub',
  interestIds: ['design', 'technology'],
  featuredGuideId: 'guide-home-mapping-first',
  overview: {
    whatItIs:
      'Warping and masking video to fit real three-dimensional surfaces — façades, stage sets, sculptures — rather than flat screens. Entry is one mid-brightness projector, a textured wall or cardboard sculpture at home, and a mapping tool’s trial. The work is site- and geometry-driven rather than beat-driven: success is measured in alignment, blending, and reliability over hours, and much of it is installation rather than performance.',
    settings: ['Building façades, galleries, stages, and home practice walls.'],
    variants: ['Event mapping for stages and brands; art installations; architectural shows.'],
    realities: ['A realistic first home setup is a few hundred to around a thousand dollars; note that the common VJ tool’s cheaper tier cannot map — mapping features sit in top tiers.'],
    foundations: 'Visual composition and display fundamentals carry over from performance visuals; geometry and site discipline are the new craft.',
  },
  nodeIds: ['visual-composition', 'projection-display-basics', 'surface-mapping', 'site-survey', 'mapped-installation'],
  neighborPathIds: ['djvj'],
};

export const projectionMappingGuide: Guide = {
  id: 'guide-home-mapping-first',
  version: 1,
  pathId: 'projection-mapping',
  title: 'Home-first projection mapping',
  persona: {
    audience: 'Designers and tinkerers who want video to leave the rectangle.',
    startingPoint: 'A used projector and a textured wall or cardboard model.',
    outcome: 'A mapped installation on a real object, running reliably.',
    assumptions: ['Trial-tier software covers learning; venues and clients rent the big projectors.'],
  },
  steps: [
    { id: 'pm1', nodeId: 'visual-composition', role: 'required', note: 'The content still has to read as intentional once it lands on geometry.', sortKey: 0 },
    { id: 'pm2', nodeId: 'projection-display-basics', role: 'required', note: 'Throw, brightness, resolution, and cabling decide what is even possible.', sortKey: 1 },
    { id: 'pm3', nodeId: 'surface-mapping', role: 'required', note: 'Warp and mask onto a home object before touching a façade.', sortKey: 2 },
    { id: 'pm4', nodeId: 'site-survey', role: 'recommended', note: 'Measure before you promise.', sortKey: 3 },
    { id: 'pm5', nodeId: 'mapped-installation', role: 'checkpoint', note: 'Aligned, blended, reliable over hours.', sortKey: 4 },
  ],
  edges: [
    { from: 'pm1', to: 'pm2', kind: 'next' },
    { from: 'pm2', to: 'pm3', kind: 'next' },
    { from: 'pm3', to: 'pm4', kind: 'next' },
    { from: 'pm4', to: 'pm5', kind: 'next' },
  ],
  stances: [],
  rationale: 'Geometry is the craft: the route drills mapping on cheap home objects so site work is repetition, not improvisation.',
};
