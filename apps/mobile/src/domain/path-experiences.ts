import { pathCatalog, type PathId, type QuestPull } from './recommendations';

export type PlayablePathId = Extract<PathId, 'live-av' | 'sports-storyteller' | 'movement-maker' | 'curiosity-sampler'>;

export type PathExperience = {
  id: PlayablePathId;
  eyebrow: string;
  summary: string;
  equipment: { value: string; detail: string };
  skills: { value: string; detail: string };
  community: { value: string; detail: string };
  goodFit: string[];
  lessFit: string[];
  routeSteps: { title: string; detail: string; commitment: string }[];
  branches: { title: string; detail: string; meta: string; tone: string }[];
  quest: {
    nodeId: string;
    title: string;
    detail: string;
    finishCondition: string;
    stages: { time: string; title: string; detail: string }[];
    toolLabel: string;
    toolNote: string;
    pulls: { id: QuestPull; label: string }[];
  };
};

export const pathExperiences: Record<PlayablePathId, PathExperience> = {
  'live-av': {
    id: 'live-av',
    eyebrow: 'PATH / CREATIVE PRACTICE',
    summary: 'Combine music and projected imagery in real time, from a private one-track experiment to a small live set.',
    equipment: { value: 'Laptop + headphones', detail: 'Free tools; phone capture is enough' },
    skills: { value: 'None to start', detail: 'Rhythm and visual curiosity help' },
    community: { value: '4.7 helpful', detail: '214 verified attempts; checked Jul 2026' },
    goodFit: ['You enjoy adjusting things live', 'You want sound and image in the same practice', 'A private first attempt feels safer than publishing'],
    lessFit: ['You want an entirely screen-free practice', 'Software setup currently feels like a hard limit', 'You only want to compose finished tracks'],
    routeSteps: [
      { title: 'Taste', detail: 'Make one track visible', commitment: '60 min' },
      { title: 'Learn', detail: 'Shape a three-track mini mix', commitment: '2-3 hr' },
      { title: 'Connect', detail: 'Observe a local or online live set', commitment: '90 min' },
      { title: 'Combine', detail: 'Perform a ten-minute audiovisual set', commitment: '4-6 hr' },
    ],
    branches: [
      { title: 'DJ + reactive visuals', detail: 'Balanced sound and image using free software and your current setup.', meta: 'Recommended; EUR 0-40', tone: '#3B8463' },
      { title: 'No-code VJ', detail: 'Fastest visual route with less setup and no programming.', meta: 'Visual emphasis; EUR 0-40', tone: '#D08A08' },
      { title: 'Generative visuals', detail: 'More technical, with code driving image and motion.', meta: 'Coding emphasis; EUR 0-60', tone: '#0798A6' },
      { title: 'DJ craft first', detail: 'Build confidence in music selection and transitions before visuals.', meta: 'Audio emphasis; EUR 40-100', tone: '#E86555' },
    ],
    quest: {
      nodeId: 'make-track-visible',
      title: 'Make one track visible',
      detail: 'Play one familiar track while mapping at least two visual changes to its rhythm or sections. Capture what happened, not whether it looked impressive.',
      finishCondition: 'Make a real attempt, then save a private reflection, difficulty, enjoyment, and strongest pull. Evidence is optional.',
      stages: [
        { time: '10 min', title: 'Set up', detail: 'Open a familiar track and a free visual tool.' },
        { time: '35 min', title: 'Experiment', detail: 'Map at least two visible changes to rhythm or song sections.' },
        { time: '5 min', title: 'Capture', detail: 'Save a screenshot, short clip, link, or private note.' },
        { time: '10 min', title: 'Reflect', detail: 'Notice fit, friction, and what you want to try next.' },
      ],
      toolLabel: 'NO-PURCHASE SETUP',
      toolNote: 'Use a browser visualizer or free VJ software. No-install fallback: film light, color, or shapes reacting on a second screen.',
      pulls: [
        { id: 'music-selection', label: 'Music selection' },
        { id: 'live-control', label: 'Live control' },
        { id: 'visual-design', label: 'Visual design' },
        { id: 'system-building', label: 'System building' },
        { id: 'none', label: 'None of these' },
      ],
    },
  },
  'sports-storyteller': {
    id: 'sports-storyteller',
    eyebrow: 'PATH / SPORTS + CREATIVE',
    summary: 'Notice the story inside an ordinary sports moment, then shape it with framing, words, or a simple sequence.',
    equipment: { value: 'Phone or paper', detail: 'Use your own moment or ask before recording anyone' },
    skills: { value: 'None to start', detail: 'Sports knowledge is useful but not required' },
    community: { value: 'Field-test route', detail: 'Curated for private, consent-aware attempts' },
    goodFit: ['You notice small moments during sport', 'You like explaining why a play or movement matters', 'You want a creative role that does not require elite performance'],
    lessFit: ['You do not want to observe or document sport', 'Camera use is not possible and drawing feels unappealing', 'You want the first Quest to be physically demanding'],
    routeSteps: [
      { title: 'Notice', detail: 'Capture one moment in three frames', commitment: '45 min' },
      { title: 'Shape', detail: 'Add a beginning, turn, and finish', commitment: '60 min' },
      { title: 'Explain', detail: 'Record a short private commentary', commitment: '30 min' },
      { title: 'Share', detail: 'Make a consent-safe team or event story', commitment: '2-3 hr' },
    ],
    branches: [
      { title: 'Three-frame story', detail: 'Use still images, sketches, or screenshots to show one meaningful change.', meta: 'Lowest setup; EUR 0', tone: '#E86555' },
      { title: 'Voice commentary', detail: 'Explain what changed and why it mattered without editing video.', meta: 'Story emphasis; EUR 0', tone: '#7B87D3' },
      { title: 'Mini highlight edit', detail: 'Cut three short clips into a clear beginning, turn, and finish.', meta: 'Editing emphasis; EUR 0', tone: '#0798A6' },
      { title: 'Team portrait', detail: 'Tell the story of a role, ritual, or contribution with permission.', meta: 'Community emphasis; consent required', tone: '#C45B9A' },
    ],
    quest: {
      nodeId: 'three-frame-sports-story',
      title: 'Tell one sports moment in three frames',
      detail: 'Choose a safe, ordinary sports moment and turn it into three frames: before, change, and after. Photos, sketches, or written frames all count.',
      finishCondition: 'Make three private frames about one real moment, then reflect on which part of the process pulled you in. Do not record another person without permission.',
      stages: [
        { time: '10 min', title: 'Choose', detail: 'Pick one moment you experienced, observed, or can safely recreate.' },
        { time: '20 min', title: 'Frame', detail: 'Make a before, change, and after using photos, sketches, or words.' },
        { time: '5 min', title: 'Title', detail: 'Give the sequence a title that says what changed.' },
        { time: '10 min', title: 'Reflect', detail: 'Notice whether observation, storytelling, editing, or people pulled you in.' },
      ],
      toolLabel: 'PRIVATE + CONSENT-AWARE',
      toolNote: 'Your own memory, objects, or drawings are enough. If another person is identifiable, ask before recording and keep the result private for this experiment.',
      pulls: [
        { id: 'storytelling', label: 'Finding the story' },
        { id: 'editing', label: 'Choosing and arranging frames' },
        { id: 'movement', label: 'The sports movement itself' },
        { id: 'teamwork', label: 'People and teamwork' },
        { id: 'none', label: 'None of these' },
      ],
    },
  },
  'movement-maker': {
    id: 'movement-maker',
    eyebrow: 'PATH / SPORTS + EXPRESSION',
    summary: 'Treat movement like a material: invent a short pattern, change one quality, and notice whether designing motion feels energizing.',
    equipment: { value: 'Clear floor space', detail: 'No equipment; a seated or hand-only version counts' },
    skills: { value: 'None to start', detail: 'Use comfortable, familiar movements only' },
    community: { value: 'Field-test route', detail: 'No public video or comparison required' },
    goodFit: ['You like movement but want more creative control', 'Rhythm, shape, or sequence catches your attention', 'A short private experiment feels approachable'],
    lessFit: ['Movement is painful or medically restricted today', 'You want coaching for a competitive sport', 'You prefer an entirely observational first Quest'],
    routeSteps: [
      { title: 'Taste', detail: 'Invent four comfortable moves', commitment: '30 min' },
      { title: 'Vary', detail: 'Change speed, level, or direction', commitment: '30 min' },
      { title: 'Compose', detail: 'Build a one-minute movement phrase', commitment: '60 min' },
      { title: 'Connect', detail: 'Adapt the pattern with a partner', commitment: '60-90 min' },
    ],
    branches: [
      { title: 'Rhythm pattern', detail: 'Build the sequence around timing and repetition.', meta: 'Music optional; EUR 0', tone: '#7B87D3' },
      { title: 'Shape study', detail: 'Focus on lines, levels, and direction rather than speed.', meta: 'Visual emphasis; EUR 0', tone: '#D08A08' },
      { title: 'Skill remix', detail: 'Safely rearrange movements you already know from a sport.', meta: 'Sports emphasis; familiar moves only', tone: '#E86555' },
      { title: 'Partner mirror', detail: 'Take turns leading a slow, consent-based pattern.', meta: 'Social emphasis; optional', tone: '#3B8463' },
    ],
    quest: {
      nodeId: 'four-move-pattern',
      title: 'Invent a four-move pattern',
      detail: 'Choose four comfortable movements, arrange them, then change one quality such as speed, direction, size, or rhythm.',
      finishCondition: 'Try the pattern twice and record a reflection. Keep it low intensity, use a seated version if preferred, and stop if anything hurts.',
      stages: [
        { time: '5 min', title: 'Prepare', detail: 'Clear a small space and choose four comfortable movements.' },
        { time: '10 min', title: 'Arrange', detail: 'Put the movements in an order you can repeat safely.' },
        { time: '10 min', title: 'Transform', detail: 'Change one quality: speed, size, level, rhythm, or direction.' },
        { time: '5 min', title: 'Reflect', detail: 'Notice whether movement, visual shape, story, or variation was interesting.' },
      ],
      toolLabel: 'COMFORT FIRST',
      toolNote: 'This is a creative experiment, not training advice. Use only familiar, comfortable movement; a seated, hand-only, or drawn sequence is equally valid.',
      pulls: [
        { id: 'movement', label: 'Moving and repeating' },
        { id: 'visual-design', label: 'Shapes and direction' },
        { id: 'storytelling', label: 'Giving the pattern meaning' },
        { id: 'editing', label: 'Reordering and varying it' },
        { id: 'none', label: 'None of these' },
      ],
    },
  },
  'curiosity-sampler': {
    id: 'curiosity-sampler',
    eyebrow: 'PATH / STARTING FRESH',
    summary: 'Use two contrasting mini experiments to discover a signal. No declared passion, hobby, or strength is required.',
    equipment: { value: 'What you already have', detail: 'Paper and ordinary household objects are enough' },
    skills: { value: 'No prior strengths', detail: 'The result is evidence, not a performance' },
    community: { value: 'Private by default', detail: 'Your reactions choose the next branch' },
    goodFit: ['Nothing stands out as an interest yet', 'Personality quizzes feel too abstract', 'You can spare two short blocks of attention'],
    lessFit: ['You already know the exact Path you want', 'You need a formal assessment or diagnosis', 'You only want passive recommendations'],
    routeSteps: [
      { title: 'Compare', detail: 'Try one making and one noticing prompt', commitment: '30 min' },
      { title: 'Follow', detail: 'Repeat the stronger signal once', commitment: '30 min' },
      { title: 'Widen', detail: 'Try an adjacent type of activity', commitment: '45 min' },
      { title: 'Choose', detail: 'Start a named Path or design a private one', commitment: '15 min' },
    ],
    branches: [
      { title: 'Make something', detail: 'Change an ordinary object, sketch, sound, or arrangement.', meta: 'Hands-on signal; EUR 0', tone: '#D08A08' },
      { title: 'Move and notice', detail: 'Take a short walk or movement break with one observation prompt.', meta: 'Movement signal; EUR 0', tone: '#7B87D3' },
      { title: 'Help one person', detail: 'Solve one small, concrete friction for somebody you know.', meta: 'Contribution signal; EUR 0', tone: '#3B8463' },
      { title: 'Investigate a question', detail: 'Follow one curiosity and make a tiny explanation of what you found.', meta: 'Learning signal; EUR 0', tone: '#0798A6' },
    ],
    quest: {
      nodeId: 'two-spark-sampler',
      title: 'Compare two tiny experiments',
      detail: 'Spend ten minutes changing or making something, then ten minutes investigating or noticing something. Compare your energy rather than the quality of the result.',
      finishCondition: 'Attempt both contrasting prompts and record which one created more curiosity, energy, or desire to continue. "Neither" is useful evidence too.',
      stages: [
        { time: '3 min', title: 'Choose', detail: 'Pick one making prompt and one noticing, helping, moving, or investigating prompt.' },
        { time: '10 min', title: 'Experiment A', detail: 'Make or change something small using what is nearby.' },
        { time: '10 min', title: 'Experiment B', detail: 'Try a contrasting prompt without trying to be good at it.' },
        { time: '7 min', title: 'Compare', detail: 'Record energy, friction, and which prompt you would repeat.' },
      ],
      toolLabel: 'NO IDENTITY REQUIRED',
      toolNote: 'Choose disposable, reversible experiments. The goal is to notice a signal, including the valid result that neither prompt fits.',
      pulls: [
        { id: 'making', label: 'Making or changing something' },
        { id: 'movement', label: 'Moving or observing outside' },
        { id: 'helping', label: 'Helping someone' },
        { id: 'investigating', label: 'Investigating a question' },
        { id: 'none', label: 'Neither experiment' },
      ],
    },
  },
};

export function isPlayablePathId(value: unknown): value is PlayablePathId {
  return typeof value === 'string'
    && Object.prototype.hasOwnProperty.call(pathExperiences, value)
    && pathCatalog.some((path) => path.id === value && path.availability === 'playable');
}

export function getPathExperience(pathId: PlayablePathId) {
  return pathExperiences[pathId];
}
