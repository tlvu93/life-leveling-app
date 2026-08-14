import { describe, expect, it } from 'vitest';

import { curatedGuides, parseSharedGuide, recommendGuides, serializeSharedGuide, type UserGuide } from './guides';
import type { JourneyProfile } from './recommendations';

const sportsProfile: JourneyProfile = {
  completed: true,
  interests: ['sports', 'visual'],
  skills: ['starting-fresh'],
  availableTime: '1-hour',
  explorations: ['creative-hobby'],
};

describe('Guide discovery', () => {
  it('returns one finite, deterministic deck with every curated Guide exactly once', () => {
    const first = recommendGuides(sportsProfile);
    const second = recommendGuides(sportsProfile);

    expect(first.map((guide) => guide.id)).toEqual(second.map((guide) => guide.id));
    expect(first).toHaveLength(curatedGuides.length);
    expect(new Set(first.map((guide) => guide.id)).size).toBe(curatedGuides.length);
    expect(first[0].pathId).toBe('sports-storyteller');
  });

  it('prioritizes the Starting Fresh Guide when no interests or strengths are declared', () => {
    const profile: JourneyProfile = {
      completed: true,
      interests: [],
      skills: ['starting-fresh'],
      availableTime: '1-hour',
      explorations: ['find-a-spark'],
    };

    expect(recommendGuides(profile)[0].pathId).toBe('curiosity-sampler');
  });
});

describe('unlisted Guide links', () => {
  it('round-trips only the bounded route fields and imports privately', () => {
    const guide: UserGuide = {
      id: 'local-only-id',
      title: 'A route worth sharing',
      outcome: 'Make one small, visible result.',
      steps: ['Try the smallest version', 'Change one thing', 'Reflect on fit'],
      visibility: 'unlisted',
      source: 'created',
      createdAt: '2026-08-12T12:00:00.000Z',
    };
    const imported = parseSharedGuide(serializeSharedGuide(guide), '2026-08-12T13:00:00.000Z');

    expect(imported).toMatchObject({
      title: guide.title,
      outcome: guide.outcome,
      steps: guide.steps,
      visibility: 'private',
      source: 'imported',
      createdAt: '2026-08-12T13:00:00.000Z',
    });
    expect(imported?.id).not.toBe(guide.id);
  });

  it('rejects malformed or underspecified shared routes', () => {
    expect(parseSharedGuide('not-json')).toBeNull();
    expect(parseSharedGuide(encodeURIComponent(JSON.stringify({ version: 1, title: 'Too short', outcome: 'No route', steps: ['One'] })))).toBeNull();
  });
});
