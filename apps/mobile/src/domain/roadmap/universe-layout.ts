import type { NodeSize } from './catalog';
import type { InterestId, NodeId, PathId } from './ids';
import type { UniverseNodeVm, UniverseVm } from './selectors/universe';

export type LaidOutNode = {
  id: NodeId;
  x: number;
  y: number;
  radius: number;
  clusterId: PathId;
  domainId: InterestId;
  depth: 0 | 1 | 2 | 3;
};

export type LaidOutCluster = {
  pathId: PathId;
  title: string;
  x: number;
  y: number;
  radius: number;
  domainId: InterestId;
  status: 'full' | 'stub';
};

export type UniverseLayout = {
  nodes: LaidOutNode[];
  clusters: LaidOutCluster[];
  byId: Map<NodeId, LaidOutNode>;
  world: { width: number; height: number };
};

const NODE_RADIUS: Record<NodeSize, number> = { major: 22, standard: 13, minor: 8 };
/** Orbital bands: foundation nearest the centre, specialisation at the rim. */
const BAND_RADIUS = [0, 120, 210, 300] as const;
/**
 * Seats are spaced for their labels, not just their discs: a node draws its
 * title beside it, and a dense constellation was unreadable when only the
 * circles were kept apart.
 */
const NODE_GAP = 74;
const CLUSTER_PADDING = 46;
const WORLD_MARGIN = 140;

function bandsOf<T extends { depth: 0 | 1 | 2 | 3 }>(members: T[]): Map<number, T[]> {
  const byDepth = new Map<number, T[]>();
  for (const node of members) {
    byDepth.set(node.depth, [...(byDepth.get(node.depth) ?? []), node]);
  }
  return byDepth;
}

const widestIn = (members: { size: NodeSize }[]) =>
  members.reduce((max, node) => Math.max(max, NODE_RADIUS[node.size]), 0);

/**
 * Band radii, computed outward in one pass. A band must be wide enough to seat
 * its own members side by side (n nodes of radius r need a circumference of at
 * least n * (2r + gap)) AND to clear the band inside it.
 */
function bandRadii(members: { depth: 0 | 1 | 2 | 3; size: NodeSize }[]): Map<number, number> {
  const bands = bandsOf(members);
  const radii = new Map<number, number>();
  let previousRadius = 0;
  let previousWidest = 0;
  for (const depth of [...bands.keys()].sort((a, b) => a - b)) {
    const band = bands.get(depth) ?? [];
    const widest = widestIn(band);
    const alone = band.length === 1 && depth === 0;
    const forCount = band.length <= 1 ? 0 : (band.length * (2 * widest + NODE_GAP)) / (2 * Math.PI) + widest;
    const clearInner = previousRadius + previousWidest + widest + NODE_GAP;
    const radius = alone ? 0 : Math.max(BAND_RADIUS[depth], forCount, clearInner);
    radii.set(depth, radius);
    previousRadius = radius;
    previousWidest = widest;
  }
  return radii;
}

/**
 * A stable hash of the node id. A node keeps its seat in its constellation when
 * unrelated Nodes or Paths are added, so the Universe does not reshuffle itself
 * every time the catalog grows.
 */
function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function clusterRadius(members: UniverseNodeVm[]): number {
  const radii = bandRadii(members);
  let reach = 0;
  for (const [depth, band] of bandsOf(members)) {
    reach = Math.max(reach, (radii.get(depth) ?? 0) + widestIn(band));
  }
  return reach + CLUSTER_PADDING;
}

/**
 * Deterministic, metadata-driven placement: constellations on a ring ordered by
 * domain so related worlds sit near each other, and Nodes in orbital bands by
 * depth within their own constellation. No physics, no hand-placed coordinates.
 */
export function layOutUniverse(vm: UniverseVm): UniverseLayout {
  const membersByCluster = new Map<PathId, UniverseNodeVm[]>();
  for (const node of vm.nodes) {
    membersByCluster.set(node.clusterId, [...(membersByCluster.get(node.clusterId) ?? []), node]);
  }

  const ordered = [...vm.paths].sort((a, b) => {
    const domainA = membersByCluster.get(a.id)?.[0]?.domainId ?? '';
    const domainB = membersByCluster.get(b.id)?.[0]?.domainId ?? '';
    return domainA.localeCompare(domainB) || a.id.localeCompare(b.id);
  });

  const radii = ordered.map((path) => clusterRadius(membersByCluster.get(path.id) ?? []));
  // Two discs seated at angle 2*pi/n apart are 2*R*sin(pi/n) from each other,
  // so the ring has to satisfy that for the widest adjacent pair.
  const count = ordered.length;
  const chord = count <= 1 ? 1 : 2 * Math.sin(Math.PI / count);
  let ringRadius = 0;
  for (let i = 0; i < count && count > 1; i += 1) {
    const pair = radii[i] + radii[(i + 1) % count] + CLUSTER_PADDING;
    ringRadius = Math.max(ringRadius, pair / chord);
  }

  const clusters: LaidOutCluster[] = ordered.map((path, index) => {
    const members = membersByCluster.get(path.id) ?? [];
    const angle = ordered.length <= 1 ? 0 : (index / ordered.length) * Math.PI * 2;
    return {
      pathId: path.id,
      title: path.title,
      x: Math.cos(angle) * ringRadius,
      y: Math.sin(angle) * ringRadius,
      radius: radii[index],
      domainId: members[0]?.domainId ?? 'technology',
      status: path.status,
    };
  });

  const nodes: LaidOutNode[] = [];
  for (const cluster of clusters) {
    const members = membersByCluster.get(cluster.pathId) ?? [];
    const radii = bandRadii(members);
    for (const [depth, band] of bandsOf(members)) {
      // Sorting by the id hash spreads a band evenly without consulting any
      // other band, which is what keeps a seat stable as the catalog grows.
      const seats = [...band].sort((a, b) => hash(a.id) - hash(b.id));
      const bandRadius = radii.get(depth) ?? 0;
      seats.forEach((node, index) => {
        // Seats are evenly spaced; the hash decides which seat a node takes,
        // not where the seat is, so the spacing guarantee always holds.
        const alone = bandRadius === 0;
        const angle = alone ? 0 : (index / seats.length) * Math.PI * 2 + depth * 0.4;
        nodes.push({
          id: node.id,
          x: cluster.x + (alone ? 0 : Math.cos(angle) * bandRadius),
          y: cluster.y + (alone ? 0 : Math.sin(angle) * bandRadius),
          radius: NODE_RADIUS[node.size],
          clusterId: node.clusterId,
          domainId: node.domainId,
          depth: node.depth,
        });
      });
    }
  }

  const extents = [
    ...nodes.map((n) => ({ minX: n.x - n.radius, maxX: n.x + n.radius, minY: n.y - n.radius, maxY: n.y + n.radius })),
    ...clusters.map((c) => ({ minX: c.x - c.radius, maxX: c.x + c.radius, minY: c.y - c.radius, maxY: c.y + c.radius })),
  ];
  const minX = extents.reduce((min, e) => Math.min(min, e.minX), 0) - WORLD_MARGIN;
  const minY = extents.reduce((min, e) => Math.min(min, e.minY), 0) - WORLD_MARGIN;
  const maxX = extents.reduce((max, e) => Math.max(max, e.maxX), 0) + WORLD_MARGIN;
  const maxY = extents.reduce((max, e) => Math.max(max, e.maxY), 0) + WORLD_MARGIN;

  // Shift everything into a positive box so the camera can clamp to it.
  const shifted = nodes.map((n) => ({ ...n, x: n.x - minX, y: n.y - minY }));
  const shiftedClusters = clusters.map((c) => ({ ...c, x: c.x - minX, y: c.y - minY }));

  return {
    nodes: shifted,
    clusters: shiftedClusters,
    byId: new Map(shifted.map((n) => [n.id, n])),
    world: { width: maxX - minX, height: maxY - minY },
  };
}
