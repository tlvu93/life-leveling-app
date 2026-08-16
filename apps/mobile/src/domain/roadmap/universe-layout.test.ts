import { describe, expect, it } from 'vitest';
import { roadmapCatalog } from './fixtures/catalog';
import { defaultRoadmapState } from './state';
import { universeView } from './selectors/universe';
import { layOutUniverse } from './universe-layout';

const vm = universeView(roadmapCatalog, defaultRoadmapState);
const layout = layOutUniverse(vm);

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

describe('layOutUniverse', () => {
  it('places every visible node exactly once', () => {
    expect(layout.nodes).toHaveLength(vm.nodes.length);
    expect(new Set(layout.nodes.map((n) => n.id)).size).toBe(vm.nodes.length);
    expect(layout.byId.size).toBe(vm.nodes.length);
  });
  it('is deterministic', () => {
    const again = layOutUniverse(universeView(roadmapCatalog, defaultRoadmapState));
    expect(again.nodes).toEqual(layout.nodes);
    expect(again.clusters).toEqual(layout.clusters);
    expect(again.world).toEqual(layout.world);
  });
  it('gives every Path a cluster', () => {
    expect(layout.clusters.map((c) => c.pathId).sort()).toEqual(vm.paths.map((p) => p.id).sort());
  });
  it('keeps cluster discs apart', () => {
    for (const a of layout.clusters) {
      for (const b of layout.clusters) {
        if (a.pathId >= b.pathId) continue;
        expect({ pair: `${a.pathId}/${b.pathId}`, apart: distance(a, b) >= a.radius + b.radius })
          .toEqual({ pair: `${a.pathId}/${b.pathId}`, apart: true });
      }
    }
  });
  it('keeps every node inside its own cluster disc', () => {
    const clusterOf = new Map(layout.clusters.map((c) => [c.pathId, c]));
    for (const node of layout.nodes) {
      const cluster = clusterOf.get(node.clusterId);
      expect({ node: node.id, hasCluster: Boolean(cluster) }).toEqual({ node: node.id, hasCluster: true });
      if (!cluster) continue;
      expect({ node: node.id, inside: distance(node, cluster) + node.radius <= cluster.radius + 0.001 })
        .toEqual({ node: node.id, inside: true });
    }
  });
  it('pushes deeper nodes further from their cluster centre', () => {
    const clusterOf = new Map(layout.clusters.map((c) => [c.pathId, c]));
    const djvj = layout.nodes.filter((n) => n.clusterId === 'djvj');
    const radiusOf = (depth: number) => {
      const sample = djvj.find((n) => n.depth === depth);
      const cluster = clusterOf.get('djvj');
      return sample && cluster ? distance(sample, cluster) : null;
    };
    const [r0, r1, r2, r3] = [radiusOf(0), radiusOf(1), radiusOf(2), radiusOf(3)];
    expect(r0).not.toBeNull();
    if (r0 !== null && r1 !== null) expect(r1).toBeGreaterThan(r0);
    if (r1 !== null && r2 !== null) expect(r2).toBeGreaterThan(r1);
    if (r2 !== null && r3 !== null) expect(r3).toBeGreaterThan(r2);
  });
  it('never lets two nodes overlap', () => {
    for (let i = 0; i < layout.nodes.length; i += 1) {
      for (let j = i + 1; j < layout.nodes.length; j += 1) {
        const a = layout.nodes[i];
        const b = layout.nodes[j];
        expect({ pair: `${a.id}/${b.id}`, apart: distance(a, b) > a.radius + b.radius })
          .toEqual({ pair: `${a.id}/${b.id}`, apart: true });
      }
    }
  });
  it('sizes node radius by its size tier', () => {
    const radiusFor = (id: string) => layout.byId.get(id)?.radius ?? 0;
    expect(radiusFor('rhythm-song-structure')).toBeGreaterThan(radiusFor('music-selection-library'));
    expect(radiusFor('music-selection-library')).toBeGreaterThan(radiusFor('observing-a-live-set'));
  });
  it('produces a world box that contains everything', () => {
    for (const node of layout.nodes) {
      expect({
        node: node.id,
        inside: node.x - node.radius >= 0 && node.y - node.radius >= 0
          && node.x + node.radius <= layout.world.width && node.y + node.radius <= layout.world.height,
      }).toEqual({ node: node.id, inside: true });
    }
    expect(layout.world.width).toBeGreaterThan(0);
    expect(layout.world.height).toBeGreaterThan(0);
  });
  it('keeps a node in its seat when an unrelated Path is added', () => {
    const trimmed = { ...vm, paths: vm.paths.filter((p) => p.id !== 'ux-design'), nodes: vm.nodes.filter((n) => n.clusterId !== 'ux-design') };
    const before = layOutUniverse(trimmed);
    const seat = before.byId.get('rhythm-song-structure');
    const cluster = before.clusters.find((c) => c.pathId === 'djvj');
    expect(seat && cluster).toBeTruthy();
    // The angle a node holds within its own constellation is stable; only the
    // constellation's own placement may move as the Universe grows.
    const angleBefore = seat && cluster ? Math.atan2(seat.y - cluster.y, seat.x - cluster.x) : 0;
    const after = layout.byId.get('rhythm-song-structure');
    const afterCluster = layout.clusters.find((c) => c.pathId === 'djvj');
    const angleAfter = after && afterCluster ? Math.atan2(after.y - afterCluster.y, after.x - afterCluster.x) : 1;
    expect(angleAfter).toBeCloseTo(angleBefore, 6);
  });
  it('lays out a single-cluster universe', () => {
    const single = {
      ...vm,
      paths: vm.paths.filter((p) => p.id === 'bouldering'),
      nodes: vm.nodes.filter((n) => n.clusterId === 'bouldering'),
    };
    const only = layOutUniverse(single);
    expect(only.clusters).toHaveLength(1);
    expect(only.nodes.length).toBeGreaterThan(0);
    expect(only.world.width).toBeGreaterThan(0);
  });
});
