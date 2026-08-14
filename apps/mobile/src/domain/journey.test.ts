import { describe, expect, it } from 'vitest';

import {
  canResolveQuest,
  defaultJourneyState,
  migrateJourneyState,
  resolveJourneyQuest,
  startPathInJourney,
  type JourneyState,
} from './journey';

function activeState(overrides: Partial<JourneyState['quest']> = {}, profile: Partial<JourneyState['profile']> = {}): JourneyState {
  return {
    ...defaultJourneyState,
    profile: { ...defaultJourneyState.profile, completed: true, ...profile },
    selectedPathId: 'live-av',
    pathStartedAt: '2026-08-11T12:00:00.000Z',
    quest: {
      ...defaultJourneyState.quest,
      status: 'active',
      reflection: 'I learned something concrete from the attempt.',
      difficulty: 3,
      enjoyment: 4,
      pulledIn: 'visual-design',
      ...overrides,
    },
    unlockedNodeIds: ['make-track-visible'],
  };
}

describe('journey version 3', () => {
  it('migrates version 1 completion and artifact data without loss', () => {
    const artifact = {
      id: 'artifact-1', kind: 'file' as const, mimeType: 'text/plain', name: 'attempt.txt', size: 12,
      uri: 'life-leveling-evidence://artifact-1', createdAt: '2026-08-11T12:00:00.000Z',
    };
    const migrated = migrateJourneyState({
      version: 1,
      profile: { completed: true, interests: ['music', 'visual'], skills: ['visual-design'], availableTime: '1-hour', explorations: ['side-project'] },
      selectedPathId: 'live-av',
      pathStartedAt: '2026-08-11T12:00:00.000Z',
      quest: {
        status: 'completed', evidenceKind: 'note', evidence: 'private evidence', artifact,
        reflection: 'kept reflection', difficulty: 2, enjoyment: 5, pulledIn: 'visual-design', completedAt: '2026-08-11T13:00:00.000Z',
      },
      unlockedNodeIds: ['make-track-visible', 'projection-sketch'],
    });

    expect(migrated.version).toBe(3);
    expect(migrated.profile.availableTime).toBe('1-hour');
    expect(migrated.quest).toMatchObject({ status: 'completed', outcome: 'completed', resolvedAt: '2026-08-11T13:00:00.000Z', artifact });
    expect(migrated.unlockedNodeIds).toEqual(expect.arrayContaining(['make-track-visible', 'projection-sketch']));
    expect(migrated.userGuides).toEqual([]);
  });

  it('persists completed and stopped outcomes distinctly', () => {
    const completed = resolveJourneyQuest(activeState(), 'completed', '2026-08-12T10:00:00.000Z');
    const stopped = resolveJourneyQuest(activeState(), 'stopped', '2026-08-12T10:00:00.000Z');

    expect(completed?.quest).toMatchObject({ status: 'completed', outcome: 'completed', resolvedAt: '2026-08-12T10:00:00.000Z' });
    expect(stopped?.quest).toMatchObject({ status: 'stopped', outcome: 'stopped', resolvedAt: '2026-08-12T10:00:00.000Z' });
    expect(stopped?.quest.status).not.toBe('completed');
  });

  it('enforces reflection, difficulty, enjoyment, pull, and an active attempt for both outcomes', () => {
    const valid = activeState({ evidence: '', artifact: null, pulledIn: 'none' });
    expect(canResolveQuest(valid.quest)).toBe(true);
    expect(resolveJourneyQuest(valid, 'completed')).not.toBeNull();
    expect(resolveJourneyQuest(valid, 'stopped')).not.toBeNull();

    for (const quest of [
      activeState({ status: 'not-started' }).quest,
      activeState({ reflection: ' ' }).quest,
      activeState({ difficulty: null }).quest,
      activeState({ enjoyment: null }).quest,
      activeState({ pulledIn: null }).quest,
    ]) {
      expect(canResolveQuest(quest)).toBe(false);
    }
  });

  it('uses profile, outcome, difficulty, enjoyment, time, and pull in the branch recommendation', () => {
    const novice = activeState({}, { skills: ['starting-fresh'], availableTime: '1-hour' });
    const experienced = activeState({ difficulty: 1, pulledIn: 'visual-design' }, { skills: ['visual-design'], availableTime: '5-plus-hours' });
    const stopped = resolveJourneyQuest(novice, 'stopped')!;
    const advanced = resolveJourneyQuest(experienced, 'completed')!;
    const lowEnjoyment = resolveJourneyQuest(activeState({ enjoyment: 2 }), 'completed')!;
    const musicPull = resolveJourneyQuest(activeState({ pulledIn: 'music-selection' }), 'completed')!;

    expect(stopped.unlockedNodeIds).toContain('visual-storyboard');
    expect(advanced.unlockedNodeIds).toContain('multi-track-av-rehearsal');
    expect(lowEnjoyment.unlockedNodeIds).toContain('visual-storyboard');
    expect(musicPull.unlockedNodeIds).toContain('three-track-mix');
    expect(advanced.unlockedNodeIds).not.toEqual(stopped.unlockedNodeIds);
  });

  it('splits longer recommendations for a one-hour profile and skips beginner rehearsal for experienced 5+ hours', () => {
    const oneHour = resolveJourneyQuest(activeState({ pulledIn: 'music-selection' }, { availableTime: '1-hour' }), 'completed')!;
    const experienced = resolveJourneyQuest(activeState(
      { difficulty: 1, pulledIn: 'live-control' },
      { skills: ['music-production', 'live-performance'], availableTime: '5-plus-hours' },
    ), 'completed')!;

    expect(oneHour.unlockedNodeIds).toContain('three-track-mix');
    expect(oneHour.branchRecommendation!.timePlan).toContain('2 sessions');
    expect(experienced.branchRecommendation!.nodeId).toBe('multi-track-av-rehearsal');
    expect(experienced.branchRecommendation!.nodeId).not.toBe('ten-minute-rehearsal');

    const broadlyExperienced = resolveJourneyQuest(activeState(
      { difficulty: 3, pulledIn: 'live-control' },
      { skills: ['coding'], availableTime: '5-plus-hours' },
    ), 'completed')!;
    expect(broadlyExperienced.branchRecommendation!.nodeId).toBe('multi-track-av-rehearsal');
  });

  it('starts a different playable Path as a fresh private Build', () => {
    const previous = activeState({ evidence: 'old evidence', reflection: 'old reflection' });
    const switched = startPathInJourney(previous, 'sports-storyteller', '2026-08-12T15:00:00.000Z');

    expect(switched.selectedPathId).toBe('sports-storyteller');
    expect(switched.pathStartedAt).toBe('2026-08-12T15:00:00.000Z');
    expect(switched.quest).toMatchObject({ status: 'active', evidence: '', reflection: '', pulledIn: null });
    expect(switched.unlockedNodeIds).toEqual(expect.arrayContaining(['sports-storyteller', 'three-frame-sports-story']));
  });

  it('resolves Sports + Creative and Starting Fresh Quests into path-specific branches', () => {
    const sports = startPathInJourney(activeState(), 'sports-storyteller');
    sports.quest = { ...sports.quest, status: 'active', reflection: 'Story structure was the interesting part.', difficulty: 2, enjoyment: 5, pulledIn: 'storytelling' };
    const sampler = startPathInJourney(activeState(), 'curiosity-sampler');
    sampler.quest = { ...sampler.quest, status: 'active', reflection: 'Investigating made me want to continue.', difficulty: 2, enjoyment: 4, pulledIn: 'investigating' };

    expect(resolveJourneyQuest(sports, 'completed')?.branchRecommendation?.nodeId).toBe('sports-commentary');
    expect(resolveJourneyQuest(sampler, 'completed')?.branchRecommendation?.nodeId).toBe('curiosity-note');
  });
});
