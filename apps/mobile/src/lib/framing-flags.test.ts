import { describe, expect, it } from 'vitest';
import { framingFlagsFrom, progressLabel } from './framing-flags';

describe('framingFlagsFrom', () => {
  it('defaults to count framing with no marker', () => {
    expect(framingFlagsFrom({})).toEqual({ framing: 'count', marker: false });
  });
  it('reads the moderator overrides', () => {
    expect(framingFlagsFrom({ framing: 'percent' })).toEqual({ framing: 'percent', marker: false });
    expect(framingFlagsFrom({ marker: '1' })).toEqual({ framing: 'count', marker: true });
  });
  it('ignores unknown framing values', () => {
    expect(framingFlagsFrom({ framing: 'nonsense' }).framing).toBe('count');
  });
  it('tolerates repeated query params', () => {
    expect(framingFlagsFrom({ framing: ['percent', 'count'] }).framing).toBe('percent');
  });
});

describe('progressLabel', () => {
  it('counts by default, never implying a deficit', () => {
    expect(progressLabel({ framing: 'count', marker: false }, 3, 17)).toBe('3 things you have practised apply here');
    expect(progressLabel({ framing: 'count', marker: false }, 1, 17)).toBe('1 thing you have practised apply here');
    expect(progressLabel({ framing: 'count', marker: false }, 0, 17)).toBe('Nothing here yet — that is a starting point, not a gap');
  });
  it('switches to the percentage variant under test', () => {
    expect(progressLabel({ framing: 'percent', marker: false }, 3, 12)).toBe('25% explored');
    expect(progressLabel({ framing: 'percent', marker: false }, 0, 0)).toBe('0% explored');
  });
});
