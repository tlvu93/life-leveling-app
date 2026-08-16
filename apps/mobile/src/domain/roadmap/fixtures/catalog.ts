import type { RoadmapCatalog } from '../catalog';
import { djvjNodes } from './djvj/nodes';
import { djvjPath } from './djvj/path';
import { guideClubFirst } from './djvj/guide-club-first';
import { guideVisualFirst } from './djvj/guide-visual-first';
import { boulderingGuide, boulderingNodes, boulderingPath } from './stubs/bouldering';
import { creativeCodingGuide, creativeCodingNodes, creativeCodingPath } from './stubs/creative-coding';
import { eventTechGuide, eventTechNodes, eventTechPath } from './stubs/event-tech';
import { japaneseGuide, japaneseNodes, japanesePath } from './stubs/japanese';
import { musicProductionGuide, musicProductionNodes, musicProductionPath } from './stubs/music-production';
import { projectionMappingGuide, projectionMappingNodes, projectionMappingPath } from './stubs/projection-mapping';
import { uxDesignGuide, uxDesignNodes, uxDesignPath } from './stubs/ux-design';
import { woodworkingGuide, woodworkingNodes, woodworkingPath } from './stubs/woodworking';

// A node id appears exactly once: stubs referencing shared DJ/VJ nodes list the
// id in their path's nodeIds but do not redefine the node.
export const roadmapCatalog: RoadmapCatalog = {
  contentVersion: 1,
  nodes: [
    ...djvjNodes,
    ...eventTechNodes,
    ...creativeCodingNodes,
    ...projectionMappingNodes,
    ...musicProductionNodes,
    ...boulderingNodes,
    ...japaneseNodes,
    ...woodworkingNodes,
    ...uxDesignNodes,
  ],
  paths: [
    djvjPath,
    musicProductionPath,
    creativeCodingPath,
    projectionMappingPath,
    eventTechPath,
    boulderingPath,
    japanesePath,
    woodworkingPath,
    uxDesignPath,
  ],
  guides: [
    guideClubFirst,
    guideVisualFirst,
    musicProductionGuide,
    creativeCodingGuide,
    projectionMappingGuide,
    eventTechGuide,
    boulderingGuide,
    japaneseGuide,
    woodworkingGuide,
    uxDesignGuide,
  ],
  relationships: [],
};
