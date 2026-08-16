import type { GuideId, InterestId, NodeId, PathId, QuestId, StepId } from './ids';

export type NodeType = 'foundation' | 'skill' | 'experience' | 'project' | 'milestone' | 'resource';

export type NodeSize = 'major' | 'standard' | 'minor';

export type AtlasNode = {
  id: NodeId;
  type: NodeType;
  title: string;
  description: string;
  domainId: InterestId;
  clusterId: string;
  depth: 0 | 1 | 2 | 3;
  size: NodeSize;
  provisional?: { scopeGuideId: GuideId };
};

export type Path = {
  id: PathId;
  title: string;
  status: 'full' | 'stub';
  interestIds: InterestId[];
  featuredGuideId?: GuideId;
  overview: {
    whatItIs: string;
    settings: string[];
    variants: string[];
    realities: string[];
    foundations: string;
  };
  nodeIds: NodeId[];
  neighborPathIds: PathId[];
};

export type RouteRole = 'required' | 'recommended' | 'optional-depth' | 'alternative' | 'checkpoint';

export type Quest = { id: QuestId; prompt: string; kind: 'observe' | 'try' | 'make' | 'meet' };

export type GuideStep = {
  id: StepId;
  nodeId: NodeId;
  role: RouteRole;
  note: string;
  quest?: Quest;
  sortKey: number;
};

export type RouteEdgeKind = 'next' | 'alternative';
export type RouteEdge = { from: StepId; to: StepId; kind: RouteEdgeKind };

export type NodeStance = { nodeId: NodeId; stance: 'excluded'; reason: string };

export type RelationshipKind = 'dependency' | 'related' | 'bridge';

/**
 * A Universe-level link between two shared Nodes.
 * - `dependency` is directed and reads "to relies on from"; the dependency
 *   subgraph must stay acyclic.
 * - `related` is symmetric and stored once.
 * - `bridge` connects different domains and must explain itself in `note`.
 * Ordering advice is deliberately absent: sequence is Guide opinion, not a
 * property of the shared graph.
 */
export type UniverseRelationship = {
  from: NodeId;
  to: NodeId;
  kind: RelationshipKind;
  note?: string;
};

export type GuidePersona = { audience: string; startingPoint: string; outcome: string; assumptions: string[] };

export type Guide = {
  id: GuideId;
  version: number;
  pathId: PathId;
  title: string;
  persona: GuidePersona;
  steps: GuideStep[];
  edges: RouteEdge[];
  stances: NodeStance[];
  rationale: string;
};

export type RoadmapCatalog = {
  contentVersion: number;
  nodes: AtlasNode[];
  paths: Path[];
  guides: Guide[];
  relationships: UniverseRelationship[];
};
