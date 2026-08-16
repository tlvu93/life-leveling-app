import type { AtlasNode, RoadmapCatalog, UniverseRelationship } from './catalog';
import type { NodeId, PathId } from './ids';

export type RelationshipIssueCode =
  | 'missing-node' | 'self-link' | 'duplicate' | 'dependency-cycle'
  | 'bridge-same-cluster' | 'bridge-missing-note' | 'missing-featured-guide'
  | 'unknown-cluster';

export type RelationshipIssue = {
  code: RelationshipIssueCode;
  from?: NodeId;
  to?: NodeId;
  pathId?: PathId;
  message: string;
};

/** Symmetric kinds are keyed on the unordered pair so either storage order collides. */
function dedupeKey(rel: UniverseRelationship): string {
  if (rel.kind === 'related' || rel.kind === 'bridge') {
    const [x, y] = rel.from < rel.to ? [rel.from, rel.to] : [rel.to, rel.from];
    return `${rel.kind}|${x}|${y}`;
  }
  return `${rel.kind}|${rel.from}|${rel.to}`;
}

function hasDependencyCycle(relationships: readonly UniverseRelationship[]): boolean {
  const deps = relationships.filter((r) => r.kind === 'dependency' && r.from !== r.to);
  const ids = new Set<string>();
  for (const r of deps) { ids.add(r.from); ids.add(r.to); }
  const incoming = new Map<string, number>();
  const out = new Map<string, string[]>();
  for (const id of ids) incoming.set(id, 0);
  const seen = new Set<string>();
  for (const r of deps) {
    const key = `${r.from}|${r.to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    incoming.set(r.to, (incoming.get(r.to) ?? 0) + 1);
    out.set(r.from, [...(out.get(r.from) ?? []), r.to]);
  }
  const ready = [...ids].filter((id) => (incoming.get(id) ?? 0) === 0);
  let visited = 0;
  while (ready.length > 0) {
    const id = ready.shift() as string;
    visited += 1;
    for (const to of out.get(id) ?? []) {
      const left = (incoming.get(to) ?? 0) - 1;
      incoming.set(to, left);
      if (left === 0) ready.push(to);
    }
  }
  return visited < ids.size;
}

export function validateRelationships(
  nodes: readonly AtlasNode[],
  relationships: readonly UniverseRelationship[],
): RelationshipIssue[] {
  const issues: RelationshipIssue[] = [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const seen = new Set<string>();
  for (const rel of relationships) {
    const from = byId.get(rel.from);
    const to = byId.get(rel.to);
    if (!from || !to) {
      issues.push({ code: 'missing-node', from: rel.from, to: rel.to, message: `Relationship ${rel.from} -> ${rel.to} references a node that is not in the catalog.` });
      continue;
    }
    if (rel.from === rel.to) {
      issues.push({ code: 'self-link', from: rel.from, to: rel.to, message: `Node "${rel.from}" cannot link to itself.` });
      continue;
    }
    const key = dedupeKey(rel);
    if (seen.has(key)) {
      issues.push({ code: 'duplicate', from: rel.from, to: rel.to, message: `Duplicate ${rel.kind} relationship between "${rel.from}" and "${rel.to}".` });
    }
    seen.add(key);
    if (rel.kind === 'bridge') {
      // A bridge earns its name by leaving the constellation. Crossing domains
      // is the common case, not the definition: two technology constellations
      // are still a real crossing, and two nodes inside one constellation are
      // not a bridge however different their domains look.
      if (from.clusterId === to.clusterId) {
        issues.push({ code: 'bridge-same-cluster', from: rel.from, to: rel.to, message: `Bridge ${rel.from} -> ${rel.to} stays inside "${from.clusterId}"; a bridge must cross constellations.` });
      }
      if (!rel.note?.trim()) {
        issues.push({ code: 'bridge-missing-note', from: rel.from, to: rel.to, message: `Bridge ${rel.from} -> ${rel.to} needs a note explaining the crossing.` });
      }
    }
  }
  if (hasDependencyCycle(relationships)) {
    issues.push({ code: 'dependency-cycle', message: 'The dependency relationships contain a cycle.' });
  }
  return issues;
}

/** Relationship rules plus the catalog-level cluster and featured-guide rules. */
export function validateCatalog(catalog: RoadmapCatalog): RelationshipIssue[] {
  const issues = validateRelationships(catalog.nodes, catalog.relationships);
  const pathIds = new Set(catalog.paths.map((p) => p.id));
  for (const node of catalog.nodes) {
    if (!pathIds.has(node.clusterId)) {
      issues.push({ code: 'unknown-cluster', from: node.id, message: `Node "${node.id}" claims constellation "${node.clusterId}", which is not a Path in this catalog.` });
    }
  }
  for (const path of catalog.paths) {
    if (path.featuredGuideId === undefined) continue;
    const guide = catalog.guides.find((g) => g.id === path.featuredGuideId);
    if (!guide || guide.pathId !== path.id) {
      issues.push({ code: 'missing-featured-guide', pathId: path.id, message: `Path "${path.id}" features guide "${path.featuredGuideId}", which does not exist on this Path.` });
    }
  }
  return issues;
}
