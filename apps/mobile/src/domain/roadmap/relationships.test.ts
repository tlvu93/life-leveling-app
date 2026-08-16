import { describe, expect, it } from 'vitest';
import type { AtlasNode, RoadmapCatalog, UniverseRelationship } from './catalog';
import { validateCatalog, validateRelationships } from './relationships';

const node = (id: string, domainId: AtlasNode['domainId']): AtlasNode => ({
  id, type: 'skill', title: id, description: '', domainId, clusterId: 'p1', depth: 0, size: 'standard',
});
const clustered = (id: string, domainId: AtlasNode['domainId'], clusterId: string): AtlasNode =>
  ({ ...node(id, domainId), clusterId });
const nodes: AtlasNode[] = [
  node('a', 'music'),
  node('b', 'music'),
  clustered('c', 'technology', 'other'),
];
const rel = (from: string, to: string, kind: UniverseRelationship['kind'], note?: string): UniverseRelationship =>
  ({ from, to, kind, ...(note ? { note } : {}) });

describe('validateRelationships', () => {
  it('accepts a clean set', () => {
    expect(validateRelationships(nodes, [
      rel('a', 'b', 'dependency'),
      rel('a', 'c', 'related'),
      rel('b', 'c', 'bridge', 'rhythm shows up in code'),
    ])).toEqual([]);
  });
  it('rejects missing nodes and self-links', () => {
    expect(validateRelationships(nodes, [rel('a', 'ghost', 'related')]).map((i) => i.code)).toContain('missing-node');
    expect(validateRelationships(nodes, [rel('a', 'a', 'related')]).map((i) => i.code)).toContain('self-link');
  });
  it('rejects duplicates, including related pairs stored in either order', () => {
    expect(validateRelationships(nodes, [rel('a', 'b', 'dependency'), rel('a', 'b', 'dependency')]).map((i) => i.code)).toContain('duplicate');
    expect(validateRelationships(nodes, [rel('a', 'b', 'related'), rel('b', 'a', 'related')]).map((i) => i.code)).toContain('duplicate');
  });
  it('allows the same pair with different kinds', () => {
    expect(validateRelationships(nodes, [rel('a', 'b', 'dependency'), rel('a', 'b', 'related')])).toEqual([]);
  });
  it('rejects dependency cycles but tolerates cycles through other kinds', () => {
    expect(validateRelationships(nodes, [
      rel('a', 'b', 'dependency'), rel('b', 'c', 'dependency'), rel('c', 'a', 'dependency'),
    ]).map((i) => i.code)).toContain('dependency-cycle');
    expect(validateRelationships(nodes, [
      rel('a', 'b', 'dependency'), rel('b', 'a', 'related'),
    ])).toEqual([]);
  });
  it('rejects bridges that stay inside one constellation, and bridges without a note', () => {
    expect(validateRelationships(nodes, [rel('a', 'b', 'bridge', 'same constellation')]).map((i) => i.code)).toContain('bridge-same-cluster');
    expect(validateRelationships(nodes, [rel('a', 'c', 'bridge')]).map((i) => i.code)).toContain('bridge-missing-note');
    expect(validateRelationships(nodes, [rel('a', 'c', 'bridge', '   ')]).map((i) => i.code)).toContain('bridge-missing-note');
  });
  it('accepts a same-domain bridge that genuinely crosses constellations', () => {
    const crossCluster = [node('x', 'technology'), clustered('y', 'technology', 'far-away')];
    expect(validateRelationships(crossCluster, [rel('x', 'y', 'bridge', 'the same craft reached from the other side')])).toEqual([]);
  });
});

describe('validateCatalog', () => {
  const base: RoadmapCatalog = {
    contentVersion: 1,
    nodes,
    paths: [{
      id: 'p1', title: 'P1', status: 'full', interestIds: ['music'],
      overview: { whatItIs: 'x', settings: [], variants: [], realities: [], foundations: 'x' },
      nodeIds: ['a'], neighborPathIds: [],
    }, {
      id: 'other', title: 'Other', status: 'stub', interestIds: ['technology'],
      overview: { whatItIs: 'x', settings: [], variants: [], realities: [], foundations: 'x' },
      nodeIds: ['c'], neighborPathIds: [],
    }],
    guides: [{
      id: 'g1', version: 1, pathId: 'p1', title: 'G1',
      persona: { audience: '', startingPoint: '', outcome: '', assumptions: [] },
      steps: [{ id: 's1', nodeId: 'a', role: 'required', note: '', sortKey: 0 }],
      edges: [], stances: [], rationale: '',
    }],
    relationships: [],
  };
  it('accepts a catalog whose featured guide belongs to its path', () => {
    expect(validateCatalog({
      ...base,
      paths: [{ ...base.paths[0], featuredGuideId: 'g1' }, base.paths[1]],
    })).toEqual([]);
  });
  it('rejects a featured guide that is missing or belongs to another path', () => {
    expect(validateCatalog({ ...base, paths: [{ ...base.paths[0], featuredGuideId: 'ghost' }, base.paths[1]] }).map((i) => i.code))
      .toContain('missing-featured-guide');
    const twoPaths = {
      ...base,
      paths: [
        { ...base.paths[0], featuredGuideId: 'g1' },
        base.paths[1],
        { ...base.paths[0], id: 'p2', featuredGuideId: 'g1' },
      ],
    };
    expect(validateCatalog(twoPaths).map((i) => i.code)).toContain('missing-featured-guide');
  });
  it('rejects a node whose constellation is not a Path in the catalog', () => {
    const typo = { ...base, nodes: [...nodes, clustered('d', 'music', 'creative-coding')] };
    expect(validateCatalog(typo).map((i) => i.code)).toContain('unknown-cluster');
  });
  it('surfaces relationship issues too', () => {
    expect(validateCatalog({ ...base, relationships: [rel('a', 'ghost', 'related')] }).map((i) => i.code))
      .toContain('missing-node');
  });
});
