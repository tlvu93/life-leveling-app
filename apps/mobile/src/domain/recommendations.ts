export type InterestId = 'music' | 'technology' | 'visual' | 'performance' | 'nature' | 'community' | 'sports' | 'making' | 'curiosity';
export type SkillId = 'music-production' | 'coding' | 'visual-design' | 'live-performance' | 'storytelling' | 'photo-video' | 'team-sports' | 'starting-fresh';
export type ExplorationId = 'creative-hobby' | 'side-project' | 'career-possibility' | 'meet-people' | 'find-a-spark';
export type AvailableTime = '1-hour' | '2-hours' | '3-4-hours' | '5-plus-hours';
export type PathId = 'live-av' | 'sports-storyteller' | 'movement-maker' | 'curiosity-sampler' | 'creative-music' | 'installations';
export type QuestPull = 'music-selection' | 'live-control' | 'visual-design' | 'system-building' | 'storytelling' | 'editing' | 'movement' | 'teamwork' | 'making' | 'helping' | 'investigating' | 'none';
export type QuestOutcome = 'completed' | 'stopped';

export type JourneyProfile = {
  completed: boolean;
  interests: InterestId[];
  skills: SkillId[];
  availableTime: AvailableTime;
  explorations: ExplorationId[];
};

export type PathMetadata = {
  id: PathId;
  title: string;
  detail: string;
  firstQuestMinutes: number;
  access: string;
  tone: string;
  availability: 'playable' | 'preview';
  interestWeights: Partial<Record<InterestId, number>>;
  skillWeights: Partial<Record<SkillId, number>>;
  explorationWeights: Partial<Record<ExplorationId, number>>;
  whyNow: string;
};

export type MatchedSignal = {
  kind: 'interest' | 'skill' | 'goal';
  id: InterestId | SkillId | ExplorationId;
  label: string;
};

export type PathRecommendation = {
  pathId: PathId;
  rank: number;
  score: number;
  personalFit: 'strong' | 'plausible' | 'stretch';
  availability: 'playable' | 'preview';
  matchedSignals: MatchedSignal[];
  tradeoffs: string[];
  firstQuestMinutes: number;
  timeFit: string;
  whyNow: string;
  explanation: string;
  path: PathMetadata;
};

export const interestLabels: Record<InterestId, string> = {
  music: 'Music',
  technology: 'Technology',
  visual: 'Visual creativity',
  performance: 'Performance',
  nature: 'Nature',
  community: 'Community',
  sports: 'Sports & movement',
  making: 'Making & crafts',
  curiosity: 'Learning & puzzles',
};

export const skillLabels: Record<SkillId, string> = {
  'music-production': 'Music production',
  coding: 'Coding',
  'visual-design': 'Visual design',
  'live-performance': 'Live performance',
  storytelling: 'Storytelling',
  'photo-video': 'Photo or video',
  'team-sports': 'Team sports',
  'starting-fresh': 'Starting fresh',
};

export const explorationLabels: Record<ExplorationId, string> = {
  'creative-hobby': 'A creative hobby',
  'side-project': 'A side project',
  'career-possibility': 'A career possibility',
  'meet-people': 'A way to meet people',
  'find-a-spark': 'Find what sparks me',
};

export const timeLabels: Record<AvailableTime, string> = {
  '1-hour': '1 hour each week',
  '2-hours': '2 hours each week',
  '3-4-hours': '3–4 hours each week',
  '5-plus-hours': '5+ hours each week',
};

export const timeMinutes: Record<AvailableTime, number> = {
  '1-hour': 60,
  '2-hours': 120,
  '3-4-hours': 180,
  '5-plus-hours': 300,
};

export const pullLabels: Record<QuestPull, string> = {
  'music-selection': 'Music selection',
  'live-control': 'Live control',
  'visual-design': 'Visual design',
  'system-building': 'System building',
  storytelling: 'Storytelling',
  editing: 'Editing and composition',
  movement: 'Movement',
  teamwork: 'People and teamwork',
  making: 'Making something',
  helping: 'Helping someone',
  investigating: 'Investigating an idea',
  none: 'None of these',
};

export const pathCatalog: readonly PathMetadata[] = [
  {
    id: 'live-av',
    title: 'Live Audiovisual Performer',
    detail: 'Turn sound into live image, then shape both together in a short performance.',
    firstQuestMinutes: 60,
    access: 'Free tools · laptop + headphones',
    tone: '#3B8463',
    availability: 'playable',
    interestWeights: { music: 4, visual: 4, performance: 3, technology: 1 },
    skillWeights: { 'music-production': 2, 'visual-design': 2, 'live-performance': 2, 'starting-fresh': 0.5 },
    explorationWeights: { 'creative-hobby': 1, 'side-project': 1, 'career-possibility': 1, 'meet-people': 0.5 },
    whyNow: 'Its complete Alpha Quest lets you test sound, image, and live control privately before making a larger commitment.',
  },
  {
    id: 'sports-storyteller',
    title: 'Sports Storyteller',
    detail: 'Turn one ordinary sports moment into a clear visual story without needing elite skill or public posting.',
    firstQuestMinutes: 45,
    access: 'Phone camera or paper · EUR 0',
    tone: '#E86555',
    availability: 'playable',
    interestWeights: { sports: 4, visual: 3, community: 2, performance: 1, curiosity: 1 },
    skillWeights: { storytelling: 3, 'photo-video': 3, 'team-sports': 2, 'visual-design': 1, 'starting-fresh': 1 },
    explorationWeights: { 'creative-hobby': 2, 'side-project': 2, 'meet-people': 1, 'find-a-spark': 1 },
    whyNow: 'Its first Quest uses a real sports moment and a private three-frame story, so creative fit can be tested without publishing or buying gear.',
  },
  {
    id: 'movement-maker',
    title: 'Movement Pattern Maker',
    detail: 'Invent a short, safe movement pattern and explore rhythm, shape, and expression through the body.',
    firstQuestMinutes: 30,
    access: 'Clear floor space · no equipment',
    tone: '#7B87D3',
    availability: 'playable',
    interestWeights: { sports: 4, performance: 3, visual: 2, music: 1, nature: 1 },
    skillWeights: { 'team-sports': 2, 'live-performance': 2, storytelling: 1, 'starting-fresh': 1 },
    explorationWeights: { 'creative-hobby': 2, 'meet-people': 1, 'find-a-spark': 2 },
    whyNow: 'A four-move private experiment reveals whether designing movement feels more energizing than simply following a routine.',
  },
  {
    id: 'curiosity-sampler',
    title: 'Starting Fresh Sampler',
    detail: 'Compare two tiny, contrasting experiments and use your reaction—not a personality label—to choose what appears next.',
    firstQuestMinutes: 30,
    access: 'Household materials · EUR 0',
    tone: '#D08A08',
    availability: 'playable',
    interestWeights: { curiosity: 2, making: 2, nature: 1, community: 1, sports: 1, visual: 1, technology: 1, music: 1 },
    skillWeights: { 'starting-fresh': 5 },
    explorationWeights: { 'find-a-spark': 6, 'creative-hobby': 1 },
    whyNow: 'This route does not pretend to know your interests. It earns the next recommendation from two low-pressure attempts and a reflection.',
  },
  {
    id: 'creative-music',
    title: 'Creative Coding for Music',
    detail: 'Build playful instruments, sound systems, and musical interactions with code.',
    firstQuestMinutes: 45,
    access: 'Free tools · beginner-friendly',
    tone: '#0798A6',
    availability: 'preview',
    interestWeights: { music: 4, technology: 4, visual: 1 },
    skillWeights: { coding: 3, 'music-production': 2, 'starting-fresh': 0.5 },
    explorationWeights: { 'creative-hobby': 1, 'side-project': 2, 'career-possibility': 2 },
    whyNow: 'This direction gives system building more room, but its full Quest and reflection loop is not available in this Alpha yet.',
  },
  {
    id: 'installations',
    title: 'Interactive Installation Maker',
    detail: 'Combine space, sensors, sound, and visuals into a responsive environment.',
    firstQuestMinutes: 90,
    access: 'Borrowed space helps · no sensor required',
    tone: '#C45B9A',
    availability: 'preview',
    interestWeights: { visual: 4, technology: 3, community: 4, nature: 2, performance: 1 },
    skillWeights: { 'visual-design': 2, coding: 2, 'live-performance': 1, 'starting-fresh': 0.5 },
    explorationWeights: { 'creative-hobby': 1, 'side-project': 1, 'career-possibility': 1, 'meet-people': 3 },
    whyNow: 'This direction tests responsive work in a place or with people, but its full Alpha Quest is still a preview.',
  },
] as const;

const tieOrder: Record<PathId, number> = {
  'live-av': 0,
  'sports-storyteller': 1,
  'movement-maker': 2,
  'curiosity-sampler': 3,
  'creative-music': 4,
  installations: 5,
};

function scoreFor(profile: JourneyProfile, path: PathMetadata) {
  const interestScore = profile.interests.reduce((score, id) => score + (path.interestWeights[id] ?? 0), 0);
  const skillScore = profile.skills.reduce((score, id) => score + (path.skillWeights[id] ?? 0), 0);
  const explorationScore = profile.explorations.reduce((score, id) => score + (path.explorationWeights[id] ?? 0), 0);
  return interestScore + skillScore + explorationScore;
}

function matchedSignals(profile: JourneyProfile, path: PathMetadata): MatchedSignal[] {
  return [
    ...profile.interests
      .filter((id) => (path.interestWeights[id] ?? 0) > 0)
      .map((id) => ({ kind: 'interest' as const, id, label: interestLabels[id] })),
    ...profile.skills
      .filter((id) => (path.skillWeights[id] ?? 0) > 0)
      .map((id) => ({ kind: 'skill' as const, id, label: skillLabels[id] })),
    ...profile.explorations
      .filter((id) => (path.explorationWeights[id] ?? 0) > 0)
      .map((id) => ({ kind: 'goal' as const, id, label: explorationLabels[id] })),
  ];
}

function personalFit(score: number): PathRecommendation['personalFit'] {
  if (score >= 9) return 'strong';
  if (score >= 5) return 'plausible';
  return 'stretch';
}

function timeExplanation(profile: JourneyProfile, path: PathMetadata) {
  const weeklyMinutes = timeMinutes[profile.availableTime];
  const selectedTime = timeLabels[profile.availableTime];
  if (path.firstQuestMinutes > weeklyMinutes) {
    return {
      timeFit: `The ${path.firstQuestMinutes}-minute first Quest exceeds your selected ${selectedTime}.`,
      tradeoff: `The ${path.firstQuestMinutes}-minute first Quest exceeds your selected ${selectedTime}; it would need to be split into two sessions.`,
    };
  }
  if (path.firstQuestMinutes === weeklyMinutes) {
    return {
      timeFit: `The ${path.firstQuestMinutes}-minute first Quest uses your full selected ${selectedTime}.`,
      tradeoff: `The first Quest uses your full selected ${selectedTime}, leaving no extra practice time that week.`,
    };
  }
  return {
    timeFit: `The ${path.firstQuestMinutes}-minute first Quest fits within your selected ${selectedTime}.`,
    tradeoff: null,
  };
}

function matchedSentence(signals: MatchedSignal[]) {
  if (!signals.length) return 'No direct saved signal matched this route yet.';
  return `${signals.map((signal) => signal.label).join(', ')} ${signals.length === 1 ? 'is' : 'are'} the saved ${signals.length === 1 ? 'signal' : 'signals'} supporting this route.`;
}

export function recommendPaths(profile: JourneyProfile): PathRecommendation[] {
  const ranked = pathCatalog
    .map((path) => ({ path, score: scoreFor(profile, path) }))
    .sort((left, right) => right.score - left.score || tieOrder[left.path.id] - tieOrder[right.path.id]);
  const leader = ranked[0];

  return ranked.map(({ path, score }, index) => {
    const signals = matchedSignals(profile, path);
    const timing = timeExplanation(profile, path);
    const tradeoffs = timing.tradeoff ? [timing.tradeoff] : [];
    const playableBridge = ranked.find((candidate) => candidate.path.availability === 'playable');
    if (leader.path.availability === 'preview' && path.id === playableBridge?.path.id) {
      tradeoffs.push(`${leader.path.title} is the stronger personal fit, but it is only a preview. ${path.title} is the closest playable bridge in this Alpha.`);
    }
    const explanation = [matchedSentence(signals), path.whyNow, timing.timeFit, ...tradeoffs].join(' ');
    return {
      pathId: path.id,
      rank: index + 1,
      score,
      personalFit: personalFit(score),
      availability: path.availability,
      matchedSignals: signals,
      tradeoffs,
      firstQuestMinutes: path.firstQuestMinutes,
      timeFit: timing.timeFit,
      whyNow: path.whyNow,
      explanation,
      path,
    };
  });
}

export function getPathRecommendation(profile: JourneyProfile, pathId: PathId) {
  return recommendPaths(profile).find((recommendation) => recommendation.pathId === pathId)!;
}

export type QuestResolutionSignals = {
  outcome: QuestOutcome | null;
  difficulty: number | null;
  enjoyment: number | null;
  pulledIn: QuestPull | null;
};

export type PostQuestRecommendation = {
  nodeId: string;
  title: string;
  mode: 'redirect' | 'deepen' | 'advance';
  outcome: QuestOutcome;
  outcomeLabel: string;
  causeSignals: string[];
  changeSummary: string;
  reason: string;
  whyDifferent: string;
  firstQuestMinutes: number;
  timePlan: string;
  adjacentPathId: PathId | null;
  unlockedNodeIds: string[];
};

type BranchChoice = Pick<PostQuestRecommendation, 'nodeId' | 'title' | 'mode' | 'whyDifferent' | 'firstQuestMinutes' | 'adjacentPathId'>;

const deepenChoices: Partial<Record<QuestPull, BranchChoice>> = {
  'music-selection': { nodeId: 'three-track-mix', title: 'Shape a three-track mini mix', mode: 'deepen', whyDifferent: 'This keeps the musical pull and adds a small arc across several tracks.', firstQuestMinutes: 90, adjacentPathId: 'creative-music' },
  'live-control': { nodeId: 'ten-minute-rehearsal', title: 'Rehearse ten minutes of live control', mode: 'deepen', whyDifferent: 'This deepens the live-control signal with one focused, uninterrupted rehearsal.', firstQuestMinutes: 10, adjacentPathId: null },
  'visual-design': { nodeId: 'projection-sketch', title: 'Build a projection sketch', mode: 'deepen', whyDifferent: 'This deepens the visual signal through one deliberate composition rather than more setup.', firstQuestMinutes: 60, adjacentPathId: 'installations' },
  'system-building': { nodeId: 'coding-sound-system', title: 'Prototype a sound-reactive system', mode: 'deepen', whyDifferent: 'This deepens the systems signal by isolating one sound-to-image behavior.', firstQuestMinutes: 60, adjacentPathId: 'creative-music' },
  none: { nodeId: 'crossroads-sampler', title: 'Compare two tiny creative experiments', mode: 'redirect', whyDifferent: 'No single part pulled clearly, so the next step compares two lower-commitment directions instead of deepening Live AV.', firstQuestMinutes: 40, adjacentPathId: 'creative-music' },
};

function hasRelevantExperience(profile: JourneyProfile, pull: QuestPull) {
  const relevantSkills: Partial<Record<QuestPull, SkillId[]>> = {
    'music-selection': ['music-production'],
    'live-control': ['live-performance'],
    'visual-design': ['visual-design'],
    'system-building': ['coding'],
  };
  return (relevantSkills[pull] ?? []).some((skill) => profile.skills.includes(skill));
}

function redirectChoice(profile: JourneyProfile, pull: QuestPull): BranchChoice {
  if (pull === 'system-building' || profile.skills.includes('coding')) {
    return { nodeId: 'creative-code-postcard', title: 'Make a sound-and-code postcard', mode: 'redirect', whyDifferent: 'This leaves live performance behind and tests a small Creative Coding direction with no rehearsal setup.', firstQuestMinutes: 45, adjacentPathId: 'creative-music' };
  }
  if (pull === 'visual-design' || profile.skills.includes('visual-design')) {
    return { nodeId: 'visual-storyboard', title: 'Storyboard light in three frames', mode: 'redirect', whyDifferent: 'This leaves live control behind and keeps only the visual-composition signal in a low-setup sketch.', firstQuestMinutes: 30, adjacentPathId: 'installations' };
  }
  if (pull === 'live-control') {
    return { nodeId: 'live-set-field-notes', title: 'Observe one live set for control cues', mode: 'redirect', whyDifferent: 'This replaces performing with observation, so you can test the live signal without repeating the rejected activity.', firstQuestMinutes: 30, adjacentPathId: 'creative-music' };
  }
  if (pull === 'music-selection') {
    return { nodeId: 'listening-map', title: 'Map one track by ear', mode: 'redirect', whyDifferent: 'This removes visual software and tests the music-selection signal on its own.', firstQuestMinutes: 25, adjacentPathId: 'creative-music' };
  }
  if (profile.interests.includes('nature') || profile.interests.includes('community')) {
    return { nodeId: 'sound-walk-map', title: 'Make a sound-and-place notebook', mode: 'redirect', whyDifferent: 'This moves away from screen-based performance and tests a nearby sound-and-place direction with almost no setup.', firstQuestMinutes: 30, adjacentPathId: 'installations' };
  }
  return deepenChoices.none!;
}

function timePlanFor(profile: JourneyProfile, minutes: number) {
  const weeklyMinutes = timeMinutes[profile.availableTime];
  if (minutes > weeklyMinutes) {
    const sessions = Math.ceil(minutes / weeklyMinutes);
    return `Split the ${minutes}-minute experiment into ${sessions} sessions within your selected ${timeLabels[profile.availableTime]}.`;
  }
  return `It fits in one ${minutes}-minute session within your selected ${timeLabels[profile.availableTime]}.`;
}

function experiencedSignal(profile: JourneyProfile) {
  const skills = profile.skills.filter((skill) => skill !== 'starting-fresh');
  return skills.length ? skills.map((skill) => skillLabels[skill]).join(' + ') : 'Starting fresh';
}

const exploratoryChoices: Record<'sports-storyteller' | 'movement-maker' | 'curiosity-sampler', Partial<Record<QuestPull, BranchChoice>>> = {
  'sports-storyteller': {
    storytelling: { nodeId: 'sports-commentary', title: 'Narrate a 30-second sports story', mode: 'deepen', whyDifferent: 'This keeps the story signal while replacing visual assembly with a short private narration.', firstQuestMinutes: 25, adjacentPathId: null },
    editing: { nodeId: 'sports-sequence-edit', title: 'Cut a three-shot sports sequence', mode: 'deepen', whyDifferent: 'This isolates the arranging and editing signal in one tiny sequence.', firstQuestMinutes: 35, adjacentPathId: null },
    movement: { nodeId: 'four-move-pattern', title: 'Invent a four-move pattern', mode: 'redirect', whyDifferent: 'The movement itself pulled more strongly than documenting it, so the next experiment removes the camera and tests movement design.', firstQuestMinutes: 30, adjacentPathId: 'movement-maker' },
    teamwork: { nodeId: 'team-role-portrait', title: 'Make a private portrait of one team role', mode: 'deepen', whyDifferent: 'This follows the people signal with a consent-aware story about contribution rather than performance.', firstQuestMinutes: 40, adjacentPathId: null },
    none: { nodeId: 'two-spark-sampler', title: 'Compare two tiny experiments', mode: 'redirect', whyDifferent: 'No part of sports storytelling pulled clearly, so the next route compares contrasting prompts without assuming another sports fit.', firstQuestMinutes: 30, adjacentPathId: 'curiosity-sampler' },
  },
  'movement-maker': {
    movement: { nodeId: 'movement-variation', title: 'Vary one movement three ways', mode: 'deepen', whyDifferent: 'This keeps the physical signal but narrows the next experiment to variation rather than a longer routine.', firstQuestMinutes: 20, adjacentPathId: null },
    'visual-design': { nodeId: 'shape-study', title: 'Draw and perform a shape study', mode: 'deepen', whyDifferent: 'This makes the visual-shape signal explicit with a low-intensity sketch-to-movement experiment.', firstQuestMinutes: 25, adjacentPathId: null },
    storytelling: { nodeId: 'movement-story', title: 'Give a movement pattern a beginning and turn', mode: 'deepen', whyDifferent: 'This follows the narrative signal without adding more physical difficulty.', firstQuestMinutes: 25, adjacentPathId: 'sports-storyteller' },
    editing: { nodeId: 'sequence-remix', title: 'Remix one sequence on paper', mode: 'redirect', whyDifferent: 'This keeps arranging and variation while allowing the next experiment to happen entirely on paper.', firstQuestMinutes: 20, adjacentPathId: null },
    none: { nodeId: 'two-spark-sampler', title: 'Compare two tiny experiments', mode: 'redirect', whyDifferent: 'Movement did not reveal a useful pull, so the next route compares two different kinds of activity.', firstQuestMinutes: 30, adjacentPathId: 'curiosity-sampler' },
  },
  'curiosity-sampler': {
    making: { nodeId: 'material-remix', title: 'Remix one ordinary object or sketch', mode: 'deepen', whyDifferent: 'The making prompt created the strongest signal, so the next experiment gives it a little more room without requiring a new identity.', firstQuestMinutes: 25, adjacentPathId: null },
    movement: { nodeId: 'movement-noticing', title: 'Design a movement-and-noticing break', mode: 'deepen', whyDifferent: 'The movement signal earns a short design experiment rather than a commitment to a sport.', firstQuestMinutes: 20, adjacentPathId: 'movement-maker' },
    helping: { nodeId: 'tiny-help', title: 'Solve one tiny friction for someone', mode: 'deepen', whyDifferent: 'The contribution signal becomes one bounded, consent-aware act with a visible finish.', firstQuestMinutes: 30, adjacentPathId: null },
    investigating: { nodeId: 'curiosity-note', title: 'Follow one question and explain it simply', mode: 'deepen', whyDifferent: 'The investigating signal becomes a small explanation rather than a course or long project.', firstQuestMinutes: 30, adjacentPathId: null },
    none: { nodeId: 'contrast-sampler', title: 'Try two new five-minute contrasts', mode: 'redirect', whyDifferent: 'Neither prompt pulled, so the next comparison becomes shorter and more different instead of pretending the result was positive.', firstQuestMinutes: 15, adjacentPathId: null },
  },
};

type ResolvedQuestSignals = {
  outcome: QuestOutcome;
  difficulty: number;
  enjoyment: number;
  pulledIn: QuestPull;
};

function buildPostQuestRecommendation(profile: JourneyProfile, quest: ResolvedQuestSignals, choice: BranchChoice, pathId: PathId) {
  const outcomeLabel = quest.outcome === 'completed' ? 'Completed after a real attempt' : 'Stopped after a real attempt';
  const pathTitle = pathCatalog.find((path) => path.id === pathId)?.title ?? 'This Path';
  const causeSignals = [
    outcomeLabel,
    `Difficulty ${quest.difficulty}/5`,
    `Enjoyment ${quest.enjoyment}/5`,
    experiencedSignal(profile),
    timeLabels[profile.availableTime],
    pullLabels[quest.pulledIn],
  ];
  const timePlan = timePlanFor(profile, choice.firstQuestMinutes);
  const unlockedNodeIds = [choice.nodeId];
  if (choice.adjacentPathId) unlockedNodeIds.push(choice.adjacentPathId);
  if (pathId === 'live-av' && choice.mode !== 'redirect' && quest.outcome === 'completed') unlockedNodeIds.push('mini-set');

  return {
    ...choice,
    outcome: quest.outcome,
    outcomeLabel,
    causeSignals,
    changeSummary: choice.mode === 'redirect'
      ? `${pathTitle} is marked attempted, and ${choice.title} is now visible as an adjacent experiment.`
      : `The first ${pathTitle} Quest is marked completed, and ${choice.title} is now visible as the next step.`,
    reason: `${outcomeLabel}; difficulty ${quest.difficulty}/5, enjoyment ${quest.enjoyment}/5, ${pullLabels[quest.pulledIn].toLowerCase()}, ${experiencedSignal(profile).toLowerCase()}, and ${timeLabels[profile.availableTime]} shaped this branch.`,
    whyDifferent: `${choice.whyDifferent} ${timePlan}`,
    timePlan,
    unlockedNodeIds,
  } satisfies PostQuestRecommendation;
}

export function getPostQuestRecommendation(profile: JourneyProfile, quest: QuestResolutionSignals, pathId: PathId = 'live-av'): PostQuestRecommendation | null {
  if (!quest.outcome || !quest.difficulty || !quest.enjoyment || !quest.pulledIn) return null;

  const resolvedQuest = quest as ResolvedQuestSignals;
  if (pathId === 'sports-storyteller' || pathId === 'movement-maker' || pathId === 'curiosity-sampler') {
    const negativeResult = quest.outcome === 'stopped' || quest.enjoyment <= 2;
    const fallback = exploratoryChoices[pathId].none!;
    const choice = negativeResult && pathId !== 'curiosity-sampler'
      ? fallback
      : exploratoryChoices[pathId][quest.pulledIn] ?? fallback;
    return buildPostQuestRecommendation(profile, resolvedQuest, choice, pathId);
  }

  if (pathId !== 'live-av') return null;

  const negativeResult = quest.outcome === 'stopped' || quest.enjoyment <= 2;
  const relevantExperience = hasRelevantExperience(profile, quest.pulledIn);
  const hasExistingExperience = profile.skills.some((skill) => skill !== 'starting-fresh');
  let choice: BranchChoice;

  if (negativeResult) {
    choice = redirectChoice(profile, quest.pulledIn);
  } else if ((relevantExperience && quest.difficulty <= 2)
    || (hasExistingExperience && profile.availableTime === '5-plus-hours' && quest.pulledIn === 'live-control')) {
    choice = {
      nodeId: 'multi-track-av-rehearsal',
      title: 'Shape a multi-track AV rehearsal',
      mode: 'advance',
      whyDifferent: 'Your existing experience and available capacity make another beginner rehearsal too small, so this skips to a multi-track structure.',
      firstQuestMinutes: 120,
      adjacentPathId: quest.pulledIn === 'visual-design' ? 'installations' : 'creative-music',
    };
  } else if (quest.difficulty >= 4 && quest.enjoyment === 3) {
    choice = {
      nodeId: 'guided-av-reset',
      title: 'Retry one cue with a no-install setup',
      mode: 'redirect',
      whyDifferent: 'The attempt was difficult without a strong positive pull, so this removes setup and narrows the next test to one cue.',
      firstQuestMinutes: 25,
      adjacentPathId: null,
    };
  } else {
    choice = deepenChoices[quest.pulledIn] ?? deepenChoices.none!;
  }
  return buildPostQuestRecommendation(profile, resolvedQuest, choice, pathId);
}
