import { describe, expect, it } from 'vitest';

import {
  interestLabels,
  recommendPaths,
  timeLabels,
  type JourneyProfile,
} from './recommendations';

const personas: Record<string, JourneyProfile> = {
  Mara: {
    completed: true,
    interests: ['music', 'visual', 'performance'],
    skills: ['starting-fresh'],
    availableTime: '2-hours',
    explorations: ['creative-hobby'],
  },
  Leila: {
    completed: true,
    interests: ['music', 'visual', 'community'],
    skills: ['visual-design'],
    availableTime: '3-4-hours',
    explorations: ['meet-people'],
  },
  Jonas: {
    completed: true,
    interests: ['music', 'technology', 'visual'],
    skills: ['coding'],
    availableTime: '1-hour',
    explorations: ['side-project'],
  },
  Chris: {
    completed: true,
    interests: ['music', 'technology', 'nature'],
    skills: ['starting-fresh'],
    availableTime: '1-hour',
    explorations: ['creative-hobby'],
  },
  Ravi: {
    completed: true,
    interests: ['music', 'technology', 'performance'],
    skills: ['music-production', 'live-performance'],
    availableTime: '5-plus-hours',
    explorations: ['career-possibility'],
  },
  SportsCreative: {
    completed: true,
    interests: ['sports', 'visual'],
    skills: ['starting-fresh'],
    availableTime: '1-hour',
    explorations: ['creative-hobby'],
  },
  StartingFresh: {
    completed: true,
    interests: [],
    skills: ['starting-fresh'],
    availableTime: '1-hour',
    explorations: ['find-a-spark'],
  },
};

describe('path recommendations', () => {
  for (const [name, profile] of Object.entries(personas)) {
    it(`${name} receives deterministic, profile-true explanations`, () => {
      const first = recommendPaths(profile);
      const second = recommendPaths(profile);

      expect(first.map(({ pathId, score }) => ({ pathId, score }))).toEqual(
        second.map(({ pathId, score }) => ({ pathId, score })),
      );
      expect(first.map((item) => item.rank)).toEqual([1, 2, 3, 4, 5, 6]);

      for (const recommendation of first) {
        const matchedInterests = recommendation.matchedSignals
          .filter((signal) => signal.kind === 'interest')
          .map((signal) => signal.id);
        expect(matchedInterests.every((id) => profile.interests.includes(id as JourneyProfile['interests'][number]))).toBe(true);
        expect(recommendation.timeFit).toContain(timeLabels[profile.availableTime]);
        expect(['playable', 'preview']).toContain(recommendation.availability);
        expect(['strong', 'plausible', 'stretch']).toContain(recommendation.personalFit);

        for (const [interestId, label] of Object.entries(interestLabels)) {
          if (!profile.interests.includes(interestId as JourneyProfile['interests'][number])) {
            expect(recommendation.explanation).not.toContain(label);
          }
        }
      }
    });
  }

  it('keeps personal fit separate from Alpha availability', () => {
    const jonas = recommendPaths(personas.Jonas);
    expect(jonas[0]).toMatchObject({ pathId: 'creative-music', personalFit: 'strong', availability: 'preview' });

    const liveAv = jonas.find((item) => item.pathId === 'live-av');
    expect(liveAv).toMatchObject({ availability: 'playable' });
    expect(liveAv?.tradeoffs.join(' ')).toContain('playable bridge');
    expect(liveAv?.tradeoffs.join(' ')).toContain('Creative Coding for Music');
  });

  it('surfaces a tradeoff when the first Quest consumes or exceeds weekly time', () => {
    for (const name of ['Jonas', 'Chris']) {
      const recommendations = recommendPaths(personas[name]);
      expect(recommendations.find((item) => item.pathId === 'live-av')?.tradeoffs.join(' ')).toContain('full selected 1 hour each week');
      expect(recommendations.find((item) => item.pathId === 'installations')?.tradeoffs.join(' ')).toContain('exceeds your selected 1 hour each week');
    }
  });

  it('ranks the five fixtures as the inspectable rules intend', () => {
    expect(recommendPaths(personas.Mara)[0].pathId).toBe('live-av');
    expect(recommendPaths(personas.Leila)[0].pathId).toBe('installations');
    expect(recommendPaths(personas.Jonas)[0].pathId).toBe('creative-music');
    expect(recommendPaths(personas.Chris)[0].pathId).toBe('creative-music');
    expect(recommendPaths(personas.Ravi)[0].pathId).toBe('live-av');
    expect(recommendPaths(personas.SportsCreative)[0].pathId).toBe('sports-storyteller');
    expect(recommendPaths(personas.SportsCreative)[1].pathId).toBe('movement-maker');
    expect(recommendPaths(personas.StartingFresh)[0].pathId).toBe('curiosity-sampler');
  });
});
