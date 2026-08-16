import { describe, expect, it } from 'vitest';
import type { GuideStep, RouteEdge } from './catalog';
import { linearize, validateGuide, validateRoute } from './graph';

const step = (id: string, sortKey: number, nodeId = `n-${id}`): GuideStep =>
  ({ id, nodeId, role: 'required', note: '', sortKey });
const next = (from: string, to: string): RouteEdge => ({ from, to, kind: 'next' });
const alt = (from: string, to: string): RouteEdge => ({ from, to, kind: 'alternative' });

describe('validateRoute', () => {
  it('accepts a linear route', () => {
    expect(validateRoute([step('a', 0), step('b', 1)], [next('a', 'b')])).toEqual([]);
  });
  it('rejects edges to missing steps, self-edges, and duplicates', () => {
    const steps = [step('a', 0), step('b', 1)];
    expect(validateRoute(steps, [next('a', 'zz')]).map((i) => i.code)).toContain('missing-step');
    expect(validateRoute(steps, [next('a', 'a')]).map((i) => i.code)).toContain('self-edge');
    expect(validateRoute(steps, [next('a', 'b'), next('a', 'b')]).map((i) => i.code)).toContain('duplicate-edge');
  });
  it('rejects cycles', () => {
    const issues = validateRoute([step('a', 0), step('b', 1)], [next('a', 'b'), next('b', 'a')]);
    expect(issues.map((i) => i.code)).toContain('cycle');
  });
  it('rejects duplicate step ids and empty routes', () => {
    expect(validateRoute([step('a', 0), step('a', 1)], []).map((i) => i.code)).toContain('duplicate-step');
    expect(validateRoute([], []).map((i) => i.code)).toContain('no-entry');
  });
});

describe('linearize', () => {
  it('orders by edges, breaking ties by sortKey then id', () => {
    const steps = [step('c', 2), step('a', 0), step('b', 1)];
    expect(linearize(steps, [next('a', 'b'), next('a', 'c')])).toEqual(['a', 'b', 'c']);
  });
  it('is stable under edge-array permutation', () => {
    const steps = [step('a', 0), step('b', 1), step('x', 5), step('y', 4)];
    const edges = [next('a', 'b'), alt('a', 'x'), alt('a', 'y'), next('x', 'b'), next('y', 'b')];
    const shuffled = [edges[3], edges[1], edges[4], edges[0], edges[2]];
    expect(linearize(steps, edges)).toEqual(linearize(steps, shuffled));
  });
  it('isolated steps are entries, positioned by sortKey', () => {
    expect(linearize([step('lone', -1), step('a', 0)], [])).toEqual(['lone', 'a']);
  });
});

describe('validateGuide', () => {
  const nodes = new Set(['n-a', 'n-b', 'theory']);
  const base = {
    id: 'g', version: 1, pathId: 'p', title: 'G',
    persona: { audience: '', startingPoint: '', outcome: '', assumptions: [] },
    steps: [step('a', 0), step('b', 1)], edges: [next('a', 'b')],
    stances: [], rationale: '',
  };
  it('accepts placed nodes that exist and stances on unplaced nodes', () => {
    const guide = { ...base, stances: [{ nodeId: 'theory', stance: 'excluded' as const, reason: 'structure literacy suffices' }] };
    expect(validateGuide(guide, nodes)).toEqual([]);
  });
  it('rejects unknown nodes, stances on placed nodes, and empty stance reasons', () => {
    const g1 = { ...base, steps: [step('a', 0, 'ghost')], edges: [] };
    expect(validateGuide(g1, nodes).map((i) => i.code)).toContain('unknown-node');
    const g2 = { ...base, stances: [{ nodeId: 'n-a', stance: 'excluded' as const, reason: 'r' }] };
    expect(validateGuide(g2, nodes).map((i) => i.code)).toContain('stance-on-placed');
    const g3 = { ...base, stances: [{ nodeId: 'theory', stance: 'excluded' as const, reason: '  ' }] };
    expect(validateGuide(g3, nodes).map((i) => i.code)).toContain('empty-stance-reason');
    const g4 = { ...base, stances: [{ nodeId: 'music-theroy-typo', stance: 'excluded' as const, reason: 'r' }] };
    expect(validateGuide(g4, nodes).map((i) => i.code)).toContain('unknown-node');
  });
});
