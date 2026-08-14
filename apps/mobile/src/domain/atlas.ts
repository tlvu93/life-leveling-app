export type AtlasZoom = 0 | 1 | 2;
export type AtlasNodeKind = 'interest' | 'skill' | 'path' | 'quest' | 'milestone' | 'nearby';
export type AtlasCluster = 'music' | 'technology' | 'visual' | 'nature' | 'movement' | 'purpose' | 'crossroads';
export type AtlasNodeStatus = 'discovered' | 'attempted' | 'nearby' | 'completed';

export type AtlasProgress = {
  pathStarted: boolean;
  activePathId?: string | null;
  firstQuestNodeId?: string | null;
  questStatus: 'not-started' | 'active' | 'completed' | 'stopped';
  unlockedNodeIds: string[];
};

export type AtlasGraphNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: AtlasNodeKind;
  cluster: AtlasCluster;
  minZoom: AtlasZoom;
  status?: AtlasNodeStatus;
  step?: string;
  labelSide?: 'right' | 'below';
  description?: string;
};

export type AtlasGraphEdge = {
  id: string;
  from: string;
  to: string;
  kind: 'relation' | 'personal' | 'guide';
  minZoom: AtlasZoom;
  maxZoom?: AtlasZoom;
  routeId?: string;
};

export type AtlasRegion = {
  id: Exclude<AtlasCluster, 'crossroads'>;
  label: string;
  path: string;
  labelX: number;
  labelY: number;
};

export const ATLAS_WORLD = { width: 1200, height: 650, centerX: 610, centerY: 330 } as const;
export const ATLAS_MIN_SCALE = 0.34;
export const ATLAS_MAX_SCALE = 2.4;

export const atlasGraphNodes: AtlasGraphNode[] = [
  { id: 'music', label: 'Music', x: 170, y: 280, kind: 'interest', cluster: 'music', minZoom: 0, status: 'discovered', description: 'Sound, rhythm, composition, performance, and listening.' },
  { id: 'technology', label: 'Technology', x: 1005, y: 230, kind: 'interest', cluster: 'technology', minZoom: 0, status: 'discovered', description: 'Tools, systems, interaction, software, and hardware.' },
  { id: 'visual', label: 'Visual Creativity', x: 500, y: 520, kind: 'interest', cluster: 'visual', minZoom: 0, status: 'discovered', description: 'Image, motion, composition, light, and spatial expression.' },
  { id: 'nature', label: 'Nature', x: 520, y: 90, kind: 'interest', cluster: 'nature', minZoom: 0, status: 'nearby', description: 'Ecology, place, observation, and the outdoors.' },
  { id: 'movement', label: 'Movement', x: 105, y: 520, kind: 'interest', cluster: 'movement', minZoom: 0, status: 'nearby', description: 'Body, performance, coordination, and physical expression.' },
  { id: 'purpose', label: 'Purpose & Impact', x: 1035, y: 520, kind: 'interest', cluster: 'purpose', minZoom: 0, status: 'nearby', description: 'Teaching, community, contribution, and visible outcomes.' },
  { id: 'rhythm', label: 'Rhythm', x: 60, y: 200, kind: 'skill', cluster: 'music', minZoom: 1 },
  { id: 'theory', label: 'Theory & Ear', x: 150, y: 150, kind: 'skill', cluster: 'music', minZoom: 1 },
  { id: 'performance', label: 'Performance', x: 275, y: 220, kind: 'skill', cluster: 'music', minZoom: 1 },
  { id: 'mixing', label: 'DJ & Mixing', x: 80, y: 370, kind: 'skill', cluster: 'music', minZoom: 1 },
  { id: 'production', label: 'Music Production', x: 325, y: 350, kind: 'skill', cluster: 'music', minZoom: 1, status: 'attempted' },
  { id: 'synthesis', label: 'Synthesis', x: 275, y: 130, kind: 'skill', cluster: 'music', minZoom: 1 },
  { id: 'sound-design', label: 'Sound Design', x: 450, y: 300, kind: 'skill', cluster: 'music', minZoom: 1, status: 'attempted' },
  { id: 'field-recording', label: 'Field Recording', x: 410, y: 175, kind: 'skill', cluster: 'nature', minZoom: 1 },
  { id: 'creative-coding', label: 'Creative Coding', x: 830, y: 275, kind: 'skill', cluster: 'technology', minZoom: 1, status: 'attempted' },
  { id: 'realtime', label: 'Realtime Systems', x: 915, y: 355, kind: 'skill', cluster: 'technology', minZoom: 1 },
  { id: 'web-apps', label: 'Web & Apps', x: 1110, y: 330, kind: 'skill', cluster: 'technology', minZoom: 1 },
  { id: 'hardware', label: 'Sensors & Hardware', x: 1090, y: 135, kind: 'skill', cluster: 'technology', minZoom: 1 },
  { id: 'shaders', label: 'Shaders', x: 1050, y: 420, kind: 'skill', cluster: 'technology', minZoom: 1 },
  { id: 'data-viz', label: 'Data Viz', x: 1160, y: 250, kind: 'skill', cluster: 'technology', minZoom: 1 },
  { id: 'generative', label: 'Generative Visuals', x: 720, y: 470, kind: 'skill', cluster: 'visual', minZoom: 1, status: 'attempted' },
  { id: 'motion', label: 'Motion Design', x: 315, y: 455, kind: 'skill', cluster: 'visual', minZoom: 1 },
  { id: 'projection', label: 'Projection Mapping', x: 700, y: 560, kind: 'skill', cluster: 'visual', minZoom: 1 },
  { id: 'colour', label: 'Colour & Light', x: 420, y: 600, kind: 'skill', cluster: 'visual', minZoom: 1 },
  { id: '3d', label: '3D Graphics', x: 580, y: 595, kind: 'skill', cluster: 'visual', minZoom: 1 },
  { id: 'stage-craft', label: 'Stage Craft', x: 275, y: 430, kind: 'skill', cluster: 'movement', minZoom: 1 },
  { id: 'live-av', label: 'Live Audiovisual|Performer', x: 610, y: 350, kind: 'path', cluster: 'crossroads', minZoom: 0, status: 'discovered', description: 'Combine music and projected imagery in real time, from a small private experiment to a live set.' },
  { id: 'sports-storyteller', label: 'Sports|Storyteller', x: 350, y: 525, kind: 'path', cluster: 'crossroads', minZoom: 0, status: 'nearby', description: 'Turn an ordinary sports moment into a private visual, written, or spoken story.' },
  { id: 'movement-maker', label: 'Movement Pattern|Maker', x: 175, y: 465, kind: 'path', cluster: 'movement', minZoom: 0, status: 'nearby', description: 'Invent safe, comfortable movement patterns and explore rhythm, shape, and expression.' },
  { id: 'curiosity-sampler', label: 'Starting Fresh|Sampler', x: 490, y: 185, kind: 'path', cluster: 'crossroads', minZoom: 0, status: 'nearby', description: 'Compare tiny experiments and let lived reactions reveal the next useful signal.' },
  { id: 'creative-music', label: 'Creative Coding|for Music', x: 690, y: 145, kind: 'nearby', cluster: 'crossroads', minZoom: 1, status: 'nearby', description: 'Build playful sound systems and musical interactions with code.' },
  { id: 'installations', label: 'Interactive|Installations', x: 905, y: 500, kind: 'nearby', cluster: 'crossroads', minZoom: 1, status: 'nearby', description: 'Combine space, sensors, sound, and visuals into responsive environments.' },
  { id: 'choose-track-stage', label: 'Choose a track', x: 685, y: 312, kind: 'quest', cluster: 'crossroads', minZoom: 2, status: 'nearby', step: '1', labelSide: 'right', description: 'Choose one familiar track so the experiment starts with known material.' },
  { id: 'reactive-visuals-stage', label: 'Try reactive visuals', x: 742, y: 258, kind: 'quest', cluster: 'crossroads', minZoom: 2, status: 'nearby', step: '2', labelSide: 'right', description: 'Map two visual changes to the track and notice which response feels worth shaping.' },
  { id: 'make-track-visible', label: 'Make one track visible', x: 800, y: 195, kind: 'quest', cluster: 'crossroads', minZoom: 1, status: 'nearby', step: '3', labelSide: 'right', description: 'Save one small audiovisual result as private evidence, then reflect on the attempt.' },
  { id: 'three-frame-sports-story', label: 'Tell a sports moment|in three frames', x: 425, y: 575, kind: 'quest', cluster: 'visual', minZoom: 1, status: 'nearby', step: '1', labelSide: 'right', description: 'Make a before, change, and after from one safe sports moment.' },
  { id: 'four-move-pattern', label: 'Invent a four-move|pattern', x: 205, y: 390, kind: 'quest', cluster: 'movement', minZoom: 1, status: 'nearby', step: '1', labelSide: 'right', description: 'Arrange four comfortable movements and vary one quality.' },
  { id: 'two-spark-sampler', label: 'Compare two tiny|experiments', x: 530, y: 115, kind: 'quest', cluster: 'crossroads', minZoom: 1, status: 'nearby', step: '1', labelSide: 'right', description: 'Try two contrasting prompts and compare energy, curiosity, and friction.' },
  { id: 'sports-commentary', label: 'Narrate a short|sports story', x: 405, y: 480, kind: 'quest', cluster: 'purpose', minZoom: 2, status: 'nearby', step: '2A', labelSide: 'right', description: 'Follow the story signal with a short private narration.' },
  { id: 'sports-sequence-edit', label: 'Cut a three-shot|sports sequence', x: 470, y: 610, kind: 'quest', cluster: 'visual', minZoom: 2, status: 'nearby', step: '2B', labelSide: 'right', description: 'Follow the editing signal in one tiny sequence.' },
  { id: 'team-role-portrait', label: 'Portrait of one|team role', x: 300, y: 610, kind: 'quest', cluster: 'purpose', minZoom: 2, status: 'nearby', step: '2C', labelSide: 'below', description: 'Make a private, consent-aware story about contribution.' },
  { id: 'movement-variation', label: 'Vary one movement|three ways', x: 95, y: 405, kind: 'quest', cluster: 'movement', minZoom: 2, status: 'nearby', step: '2A', labelSide: 'right', description: 'Explore variation without increasing physical difficulty.' },
  { id: 'shape-study', label: 'Draw and perform|a shape study', x: 275, y: 485, kind: 'quest', cluster: 'visual', minZoom: 2, status: 'nearby', step: '2B', labelSide: 'right', description: 'Translate a simple drawn shape into comfortable movement.' },
  { id: 'movement-story', label: 'Give movement|a beginning and turn', x: 250, y: 350, kind: 'quest', cluster: 'movement', minZoom: 2, status: 'nearby', step: '2C', labelSide: 'right', description: 'Follow the narrative signal without adding intensity.' },
  { id: 'sequence-remix', label: 'Remix a sequence|on paper', x: 330, y: 405, kind: 'quest', cluster: 'visual', minZoom: 2, status: 'nearby', step: '2R', labelSide: 'right', description: 'Keep arranging and variation while removing movement.' },
  { id: 'material-remix', label: 'Remix one ordinary|object or sketch', x: 540, y: 410, kind: 'quest', cluster: 'visual', minZoom: 2, status: 'nearby', step: '2A', labelSide: 'below', description: 'Give the making signal one slightly deeper attempt.' },
  { id: 'movement-noticing', label: 'Movement-and-noticing|break', x: 370, y: 300, kind: 'quest', cluster: 'movement', minZoom: 2, status: 'nearby', step: '2B', labelSide: 'below', description: 'Follow movement without assuming a sports identity.' },
  { id: 'tiny-help', label: 'Solve one tiny|friction', x: 970, y: 555, kind: 'quest', cluster: 'purpose', minZoom: 2, status: 'nearby', step: '2C', labelSide: 'right', description: 'Turn the helping signal into one bounded contribution.' },
  { id: 'curiosity-note', label: 'Follow and explain|one question', x: 845, y: 110, kind: 'quest', cluster: 'technology', minZoom: 2, status: 'nearby', step: '2D', labelSide: 'right', description: 'Turn curiosity into a small explanation rather than a long course.' },
  { id: 'contrast-sampler', label: 'Try two new|five-minute contrasts', x: 625, y: 205, kind: 'quest', cluster: 'crossroads', minZoom: 2, status: 'nearby', step: '2R', labelSide: 'right', description: 'Use shorter, more different prompts after neither first experiment fit.' },
  { id: 'three-track-mix', label: 'Shape a three-track|mini mix', x: 805, y: 190, kind: 'quest', cluster: 'music', minZoom: 2, status: 'nearby', step: '2A', labelSide: 'right', description: 'Follow the audio-led branch by shaping a small musical arc across three tracks.' },
  { id: 'projection-sketch', label: 'Build a projection|sketch', x: 780, y: 430, kind: 'quest', cluster: 'visual', minZoom: 2, status: 'nearby', step: '2B', labelSide: 'right', description: 'Follow the visual-led branch with one deliberate composition for projected light.' },
  { id: 'ten-minute-rehearsal', label: 'Rehearse live|control', x: 880, y: 315, kind: 'quest', cluster: 'crossroads', minZoom: 2, status: 'nearby', step: '2C', labelSide: 'right', description: 'Follow the performance-led branch with ten uninterrupted minutes of live control.' },
  { id: 'coding-sound-system', label: 'Prototype a|sound-reactive system', x: 880, y: 225, kind: 'quest', cluster: 'technology', minZoom: 2, status: 'nearby', step: '2D', labelSide: 'right', description: 'Follow the systems-led branch by connecting one sound signal to a visible behavior.' },
  { id: 'visual-storyboard', label: 'Storyboard light|in three frames', x: 675, y: 445, kind: 'quest', cluster: 'visual', minZoom: 2, status: 'nearby', step: '2R', labelSide: 'below', description: 'A lower-setup redirect that keeps visual composition while leaving live control behind.' },
  { id: 'creative-code-postcard', label: 'Make a sound-and-code|postcard', x: 965, y: 285, kind: 'quest', cluster: 'technology', minZoom: 2, status: 'nearby', step: '2R', labelSide: 'right', description: 'A compact Creative Coding experiment with no live-performance setup.' },
  { id: 'live-set-field-notes', label: 'Observe live|control cues', x: 770, y: 385, kind: 'quest', cluster: 'movement', minZoom: 2, status: 'nearby', step: '2R', labelSide: 'below', description: 'Observe a set instead of performing, and note which control decisions hold attention.' },
  { id: 'listening-map', label: 'Map one track|by ear', x: 610, y: 225, kind: 'quest', cluster: 'music', minZoom: 2, status: 'nearby', step: '2R', labelSide: 'right', description: 'Remove visual software and test music selection on its own.' },
  { id: 'sound-walk-map', label: 'Make a sound-and-place|notebook', x: 515, y: 205, kind: 'quest', cluster: 'nature', minZoom: 2, status: 'nearby', step: '2R', labelSide: 'right', description: 'A screen-light redirect that connects attentive listening with place.' },
  { id: 'crossroads-sampler', label: 'Compare two tiny|experiments', x: 695, y: 300, kind: 'quest', cluster: 'crossroads', minZoom: 2, status: 'nearby', step: '2R', labelSide: 'below', description: 'Compare two small adjacent directions when no part of the first Quest pulled clearly.' },
  { id: 'guided-av-reset', label: 'Retry one cue|without setup', x: 705, y: 405, kind: 'quest', cluster: 'crossroads', minZoom: 2, status: 'nearby', step: '2R', labelSide: 'below', description: 'Narrow a difficult attempt to one cue using a no-install setup.' },
  { id: 'multi-track-av-rehearsal', label: 'Shape a multi-track|AV rehearsal', x: 800, y: 135, kind: 'quest', cluster: 'crossroads', minZoom: 2, status: 'nearby', step: '2+', labelSide: 'right', description: 'Skip beginner rehearsal and structure a longer multi-track attempt using relevant experience.' },
  { id: 'mini-set', label: 'Perform a 10-minute|audiovisual set', x: 850, y: 118, kind: 'milestone', cluster: 'purpose', minZoom: 0, status: 'nearby', step: '3', labelSide: 'right', description: 'The first observable milestone: a coherent ten-minute set for yourself or a small audience.' },
];

export const atlasGraphEdges: AtlasGraphEdge[] = [
  ...[
    ['music-rhythm', 'music', 'rhythm'], ['music-theory', 'music', 'theory'], ['music-performance', 'music', 'performance'],
    ['music-mixing', 'music', 'mixing'], ['music-production', 'music', 'production'], ['music-synthesis', 'music', 'synthesis'],
    ['production-sound', 'production', 'sound-design'], ['field-sound', 'field-recording', 'sound-design'],
    ['tech-code', 'technology', 'creative-coding'], ['tech-realtime', 'technology', 'realtime'], ['tech-web', 'technology', 'web-apps'],
    ['tech-hardware', 'technology', 'hardware'], ['tech-shaders', 'technology', 'shaders'], ['tech-data', 'technology', 'data-viz'],
    ['visual-generative', 'visual', 'generative'], ['visual-motion', 'visual', 'motion'], ['visual-projection', 'visual', 'projection'],
    ['visual-colour', 'visual', 'colour'], ['visual-3d', 'visual', '3d'], ['movement-stage', 'movement', 'stage-craft'],
    ['code-nearby', 'creative-coding', 'creative-music'], ['realtime-install', 'realtime', 'installations'], ['generative-install', 'generative', 'installations'],
  ].map(([id, from, to]) => ({ id, from, to, kind: 'relation' as const, minZoom: 1 as const })),
  { id: 'overview-music', from: 'music', to: 'live-av', kind: 'personal', minZoom: 0, maxZoom: 0, routeId: 'live-av' },
  { id: 'overview-tech', from: 'technology', to: 'live-av', kind: 'personal', minZoom: 0, maxZoom: 0, routeId: 'live-av' },
  { id: 'overview-visual', from: 'visual', to: 'live-av', kind: 'personal', minZoom: 0, maxZoom: 0, routeId: 'live-av' },
  { id: 'overview-goal', from: 'live-av', to: 'mini-set', kind: 'personal', minZoom: 0, maxZoom: 1, routeId: 'live-av' },
  ...[
    ['route-music', 'music', 'production'], ['route-production', 'production', 'sound-design'], ['route-sound', 'sound-design', 'live-av'],
    ['route-tech', 'technology', 'creative-coding'], ['route-code', 'creative-coding', 'live-av'], ['route-visual', 'visual', 'generative'],
    ['route-generative', 'generative', 'live-av'],
  ].map(([id, from, to]) => ({ id, from, to, kind: 'personal' as const, minZoom: 1 as const, routeId: 'live-av' })),
  { id: 'route-stage-1', from: 'live-av', to: 'choose-track-stage', kind: 'personal', minZoom: 2, routeId: 'live-av' },
  { id: 'route-stage-2', from: 'choose-track-stage', to: 'reactive-visuals-stage', kind: 'personal', minZoom: 2, routeId: 'live-av' },
  { id: 'route-q1', from: 'reactive-visuals-stage', to: 'make-track-visible', kind: 'personal', minZoom: 2, routeId: 'live-av' },
  ...[
    ['route-audio', 'make-track-visible', 'three-track-mix'],
    ['route-visuals', 'make-track-visible', 'projection-sketch'], ['route-live', 'make-track-visible', 'ten-minute-rehearsal'],
    ['route-system', 'make-track-visible', 'coding-sound-system'],
    ['route-visual-redirect', 'make-track-visible', 'visual-storyboard'],
    ['route-code-redirect', 'make-track-visible', 'creative-code-postcard'],
    ['route-live-observe', 'make-track-visible', 'live-set-field-notes'],
    ['route-listening', 'make-track-visible', 'listening-map'],
    ['route-sound-walk', 'make-track-visible', 'sound-walk-map'],
    ['route-sampler', 'make-track-visible', 'crossroads-sampler'],
    ['route-reset', 'make-track-visible', 'guided-av-reset'],
    ['route-advanced', 'make-track-visible', 'multi-track-av-rehearsal'],
    ['route-audio-goal', 'three-track-mix', 'mini-set'], ['route-visual-goal', 'projection-sketch', 'mini-set'],
    ['route-live-goal', 'ten-minute-rehearsal', 'mini-set'], ['route-system-goal', 'coding-sound-system', 'mini-set'],
    ['route-advanced-goal', 'multi-track-av-rehearsal', 'mini-set'],
  ].map(([id, from, to]) => ({ id, from, to, kind: 'personal' as const, minZoom: 2 as const, routeId: 'live-av' })),
  ...[
    ['guide-mix', 'mixing', 'production'], ['guide-live', 'production', 'live-av'],
    ['guide-projection', 'live-av', 'projection'], ['guide-finish', 'projection', 'mini-set'],
  ].map(([id, from, to]) => ({ id, from, to, kind: 'guide' as const, minZoom: 1 as const, routeId: 'live-av' })),
  ...[
    ['sports-overview-movement', 'movement', 'sports-storyteller'], ['sports-overview-visual', 'visual', 'sports-storyteller'],
    ['sports-q1', 'sports-storyteller', 'three-frame-sports-story'], ['sports-story', 'three-frame-sports-story', 'sports-commentary'],
    ['sports-edit', 'three-frame-sports-story', 'sports-sequence-edit'], ['sports-team', 'three-frame-sports-story', 'team-role-portrait'],
  ].map(([id, from, to]) => ({ id, from, to, kind: 'personal' as const, minZoom: id.includes('overview') ? 0 as const : 1 as const, routeId: 'sports-storyteller' })),
  ...[
    ['movement-overview', 'movement', 'movement-maker'], ['movement-q1', 'movement-maker', 'four-move-pattern'],
    ['movement-vary', 'four-move-pattern', 'movement-variation'], ['movement-shape', 'four-move-pattern', 'shape-study'],
    ['movement-narrative', 'four-move-pattern', 'movement-story'], ['movement-remix', 'four-move-pattern', 'sequence-remix'],
  ].map(([id, from, to]) => ({ id, from, to, kind: 'personal' as const, minZoom: id === 'movement-overview' ? 0 as const : 1 as const, routeId: 'movement-maker' })),
  ...[
    ['sampler-overview', 'curiosity-sampler', 'two-spark-sampler'], ['sampler-making', 'two-spark-sampler', 'material-remix'],
    ['sampler-moving', 'two-spark-sampler', 'movement-noticing'], ['sampler-helping', 'two-spark-sampler', 'tiny-help'],
    ['sampler-question', 'two-spark-sampler', 'curiosity-note'], ['sampler-contrast', 'two-spark-sampler', 'contrast-sampler'],
  ].map(([id, from, to]) => ({ id, from, to, kind: 'personal' as const, minZoom: id === 'sampler-overview' ? 0 as const : 1 as const, routeId: 'curiosity-sampler' })),
];

export const atlasRegions: AtlasRegion[] = [
  { id: 'music', label: 'MUSIC', path: 'M18 158 C54 74 254 80 380 139 C443 169 435 355 350 409 C260 464 47 431 20 333 C1 266 0 207 18 158 Z', labelX: 62, labelY: 116 },
  { id: 'nature', label: 'NATURE', path: 'M345 16 C427 -12 645 5 694 83 C728 137 642 211 534 211 C430 211 334 162 345 16 Z', labelX: 470, labelY: 50 },
  { id: 'technology', label: 'TECHNOLOGY', path: 'M765 36 C866 -1 1166 29 1190 139 C1210 227 1175 426 1040 450 C925 471 760 408 747 304 C736 219 689 84 765 36 Z', labelX: 950, labelY: 82 },
  { id: 'visual', label: 'VISUAL CREATIVITY', path: 'M236 401 C302 333 683 353 810 438 C894 495 795 628 633 641 L342 632 C240 600 176 486 236 401 Z', labelX: 420, labelY: 470 },
  { id: 'movement', label: 'MOVEMENT', path: 'M0 402 C78 365 211 400 259 488 C291 548 219 637 83 635 C15 634 -14 546 0 402 Z', labelX: 38, labelY: 600 },
  { id: 'purpose', label: 'PURPOSE & IMPACT', path: 'M819 422 C914 381 1188 425 1207 514 C1226 604 1107 654 950 638 C833 626 767 536 819 422 Z', labelX: 930, labelY: 600 },
];

export const atlasNodeIndex = new Map(atlasGraphNodes.map((node) => [node.id, node]));
export const atlasZoomLabels = ['Regions', 'Paths', 'Details'] as const;

export const atlasDust = Array.from({ length: 96 }, (_, index) => ({
  x: 24 + ((index * 137) % 1152),
  y: 18 + ((index * 83) % 604),
  radius: index % 11 === 0 ? 2.2 : index % 4 === 0 ? 1.4 : 0.8,
  opacity: 0.18 + ((index * 17) % 44) / 100,
}));

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function cameraTranslationForAnchor(worldX: number, worldY: number, focalX: number, focalY: number, scale: number) {
  'worklet';
  return { x: focalX - worldX * scale, y: focalY - worldY * scale };
}

export function semanticZoomForScale(scale: number): AtlasZoom {
  return scale < 0.72 ? 0 : scale < 1.18 ? 1 : 2;
}

const hiddenUntilUnlocked = new Set([
  'make-track-visible',
  'three-frame-sports-story',
  'four-move-pattern',
  'two-spark-sampler',
  'sports-commentary',
  'sports-sequence-edit',
  'team-role-portrait',
  'movement-variation',
  'shape-study',
  'movement-story',
  'sequence-remix',
  'material-remix',
  'movement-noticing',
  'tiny-help',
  'curiosity-note',
  'contrast-sampler',
  'three-track-mix',
  'projection-sketch',
  'ten-minute-rehearsal',
  'coding-sound-system',
  'visual-storyboard',
  'creative-code-postcard',
  'live-set-field-notes',
  'listening-map',
  'sound-walk-map',
  'crossroads-sampler',
  'guided-av-reset',
  'multi-track-av-rehearsal',
  'mini-set',
]);

const liveAvStageNodeIds = new Set(['choose-track-stage', 'reactive-visuals-stage']);

export function atlasNodesForProgress(progress?: AtlasProgress) {
  if (!progress) return atlasGraphNodes;
  const unlocked = new Set(progress.unlockedNodeIds);
  const activePathId = progress.activePathId ?? 'live-av';
  const firstQuestNodeId = progress.firstQuestNodeId ?? 'make-track-visible';
  return atlasGraphNodes
    .filter((node) => {
      if (liveAvStageNodeIds.has(node.id)) return activePathId === 'live-av' && progress.pathStarted;
      return !hiddenUntilUnlocked.has(node.id) || unlocked.has(node.id);
    })
    .map((node) => {
      if (node.id === activePathId) return { ...node, status: progress.pathStarted ? 'attempted' as const : 'discovered' as const };
      if (liveAvStageNodeIds.has(node.id)) return { ...node, status: progress.questStatus === 'completed' ? 'completed' as const : 'attempted' as const };
      if (node.id === firstQuestNodeId) return { ...node, status: progress.questStatus === 'completed' ? 'completed' as const : 'attempted' as const };
      if (unlocked.has(node.id)) return { ...node, status: 'discovered' as const };
      return node;
    });
}

export function visibleAtlasNodes(zoom: AtlasZoom, progress?: AtlasProgress) {
  return atlasNodesForProgress(progress).filter((node) => node.minZoom <= zoom);
}

export function visibleAtlasEdges(zoom: AtlasZoom, showGuide: boolean, progress?: AtlasProgress) {
  const visibleIds = new Set(visibleAtlasNodes(zoom, progress).map((node) => node.id));
  const activeRouteId = progress?.activePathId ?? 'live-av';
  return atlasGraphEdges.filter((edge) => edge.minZoom <= zoom
    && (edge.maxZoom === undefined || zoom <= edge.maxZoom)
    && visibleIds.has(edge.from)
    && visibleIds.has(edge.to)
    && (!edge.routeId || edge.routeId === activeRouteId)
    && (edge.kind !== 'guide' || showGuide));
}

const showcaseCompletedNodeIds = new Set(['production', 'sound-design', 'creative-coding', 'generative', 'choose-track-stage', 'reactive-visuals-stage']);

/**
 * Showcase mode (dev-only, `?showcase=1`): the full graph with no zoom or
 * progress gating, used by the visual-verification screenshot harness so the
 * atlas renders at mock-like density. A few nodes are forced `completed` to
 * exercise the completed-badge visuals; the active path reads as attempted.
 */
export function atlasShowcaseNodes(): AtlasGraphNode[] {
  return atlasGraphNodes.map((node) => {
    if (showcaseCompletedNodeIds.has(node.id)) return { ...node, status: 'completed' as const };
    if (node.id === 'live-av') return { ...node, status: 'attempted' as const };
    return node;
  });
}

/**
 * All edges for showcase mode. Overview-only duplicates (edges capped below
 * zoom 2) are dropped, and personal chains of non-active routes render as
 * dashed navigator routes (`guide` kind) keyed by their own routeId.
 */
export function atlasShowcaseEdges(): AtlasGraphEdge[] {
  return atlasGraphEdges
    .filter((edge) => edge.maxZoom === undefined || edge.maxZoom >= 2)
    .map((edge) => edge.kind === 'personal' && edge.routeId && edge.routeId !== 'live-av'
      ? { ...edge, kind: 'guide' as const }
      : edge);
}

export function atlasEdgePath(edge: AtlasGraphEdge) {
  const from = atlasNodeIndex.get(edge.from);
  const to = atlasNodeIndex.get(edge.to);
  if (!from || !to) return '';
  const dx = to.x - from.x;
  return `M ${from.x} ${from.y} C ${from.x + dx * 0.42} ${from.y}, ${to.x - dx * 0.42} ${to.y}, ${to.x} ${to.y}`;
}

export function fitWorldCamera(viewportWidth: number, viewportHeight: number, padding = 32) {
  const usableWidth = Math.max(1, viewportWidth - padding * 2);
  const usableHeight = Math.max(1, viewportHeight - padding * 2);
  const scale = clamp(Math.min(usableWidth / ATLAS_WORLD.width, usableHeight / ATLAS_WORLD.height), ATLAS_MIN_SCALE, 0.94);
  return {
    scale,
    x: (viewportWidth - ATLAS_WORLD.width * scale) / 2,
    y: (viewportHeight - ATLAS_WORLD.height * scale) / 2,
  };
}

/**
 * Cover-fit: scales the world so it fills the viewport edge-to-edge (small
 * overflow is cropped). Used by showcase captures to match the mock's framing.
 */
export function fillWorldCamera(viewportWidth: number, viewportHeight: number, topInset = 0) {
  const usableHeight = Math.max(1, viewportHeight - topInset);
  const scale = clamp(Math.max(viewportWidth / ATLAS_WORLD.width, usableHeight / ATLAS_WORLD.height), ATLAS_MIN_SCALE, ATLAS_MAX_SCALE);
  return {
    scale,
    x: (viewportWidth - ATLAS_WORLD.width * scale) / 2,
    y: topInset + (usableHeight - ATLAS_WORLD.height * scale) / 2,
  };
}

export function focusedCamera(node: AtlasGraphNode, viewportWidth: number, viewportHeight: number, scale: number) {
  const nextScale = clamp(scale, ATLAS_MIN_SCALE, ATLAS_MAX_SCALE);
  return {
    scale: nextScale,
    x: viewportWidth / 2 - node.x * nextScale,
    y: viewportHeight / 2 - node.y * nextScale,
  };
}
