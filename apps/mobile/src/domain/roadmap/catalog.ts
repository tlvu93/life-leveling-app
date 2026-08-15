import type { GuideId, InterestId, NodeId, PathId, QuestId, StepId } from './ids';

export type NodeType = 'foundation' | 'skill' | 'experience' | 'project' | 'milestone' | 'resource';

export type AtlasNode = {
  id: NodeId;
  type: NodeType;
  title: string;
  description: string;
  provisional?: { scopeGuideId: GuideId };
};

export type Path = {
  id: PathId;
  title: string;
  status: 'full' | 'stub';
  interestIds: InterestId[];
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
};
