import { describe, expect, it } from 'vitest';
import { roadmapCatalog } from '../fixtures/catalog';
import { compareGuides } from './guide-comparison';

describe('compareGuides', () => {
  const vm = compareGuides(roadmapCatalog, 'guide-club-first', 'guide-visual-first');

  it('returns null for unknown guides', () => {
    expect(compareGuides(roadmapCatalog, 'ghost', 'guide-club-first')).toBeNull();
  });
  it('finds at least three material differences between the DJ/VJ fixture guides', () => {
    expect(vm?.materialDifferences.length).toBeGreaterThanOrEqual(3);
  });
  it('renders the contested-node rows as placed-vs-excluded with reasons', () => {
    const theory = vm?.rows.find((r) => r.nodeId === 'music-theory-fundamentals');
    expect(theory?.a).toEqual({ kind: 'placed', role: 'optional-depth', note: expect.any(String) });
    expect(theory?.b.kind).toBe('excluded');
    if (theory?.b.kind === 'excluded') expect(theory.b.reason.length).toBeGreaterThan(0);
    const instrument = vm?.rows.find((r) => r.nodeId === 'playing-an-instrument');
    expect(instrument?.a.kind).toBe('placed');
    expect(instrument?.b.kind).toBe('excluded');
  });
  it('lists both contested nodes as stance disagreements', () => {
    const ids = vm?.stanceDisagreements.map((d) => d.nodeId).sort();
    expect(ids).toEqual(['music-theory-fundamentals', 'playing-an-instrument']);
    expect(vm?.stanceDisagreements[0].excludedIn).toBe('guide-visual-first');
  });
  it('renders absent as absent, not excluded', () => {
    const row = vm?.rows.find((r) => r.nodeId === 'club-media-player-workflow');
    expect(row?.a.kind).toBe('placed');
    expect(row?.b).toEqual({ kind: 'absent' });
  });
  it('comparing a guide with itself yields no differences', () => {
    const self = compareGuides(roadmapCatalog, 'guide-club-first', 'guide-club-first');
    expect(self?.materialDifferences).toEqual([]);
    expect(self?.stanceDisagreements).toEqual([]);
    expect(self?.personaDiffs).toEqual([]);
  });
});
