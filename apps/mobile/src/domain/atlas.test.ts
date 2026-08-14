import { describe, expect, it } from 'vitest';

import {
  ATLAS_MAX_SCALE,
  ATLAS_MIN_SCALE,
  atlasEdgePath,
  atlasGraphEdges,
  atlasGraphNodes,
  atlasNodeIndex,
  atlasShowcaseEdges,
  atlasShowcaseNodes,
  cameraTranslationForAnchor,
  fitWorldCamera,
  focusedCamera,
  semanticZoomForScale,
  visibleAtlasEdges,
  visibleAtlasNodes,
} from './atlas';

describe('Atlas graph', () => {
  it('uses unique node and edge identifiers with valid endpoints', () => {
    expect(new Set(atlasGraphNodes.map((node) => node.id)).size).toBe(atlasGraphNodes.length);
    expect(new Set(atlasGraphEdges.map((edge) => edge.id)).size).toBe(atlasGraphEdges.length);

    for (const edge of atlasGraphEdges) {
      expect(atlasNodeIndex.has(edge.from), `${edge.id} has a missing source`).toBe(true);
      expect(atlasNodeIndex.has(edge.to), `${edge.id} has a missing destination`).toBe(true);
      expect(atlasEdgePath(edge)).toMatch(/^M .+ C .+$/);
    }
  });

  it('reveals more information at each semantic zoom level', () => {
    expect(semanticZoomForScale(0.5)).toBe(0);
    expect(semanticZoomForScale(0.9)).toBe(1);
    expect(semanticZoomForScale(1.4)).toBe(2);
    expect(visibleAtlasNodes(0).length).toBeLessThan(visibleAtlasNodes(1).length);
    expect(visibleAtlasNodes(1).length).toBeLessThan(visibleAtlasNodes(2).length);
  });

  it('keeps community routes optional without hiding the personal route', () => {
    const withoutGuide = visibleAtlasEdges(1, false);
    const withGuide = visibleAtlasEdges(1, true);

    expect(withoutGuide.some((edge) => edge.kind === 'guide')).toBe(false);
    expect(withGuide.some((edge) => edge.kind === 'guide')).toBe(true);
    expect(withoutGuide.some((edge) => edge.kind === 'personal')).toBe(true);
  });

  it('reveals quest territory only after real journey progress', () => {
    const beforeStart = { pathStarted: false, questStatus: 'not-started' as const, unlockedNodeIds: [] };
    const active = { pathStarted: true, questStatus: 'active' as const, unlockedNodeIds: ['make-track-visible'] };
    const completed = {
      pathStarted: true,
      questStatus: 'completed' as const,
      unlockedNodeIds: ['make-track-visible', 'projection-sketch', 'installations', 'mini-set'],
    };
    const stopped = {
      pathStarted: true,
      questStatus: 'stopped' as const,
      unlockedNodeIds: ['make-track-visible', 'visual-storyboard', 'installations'],
    };

    expect(visibleAtlasNodes(2, beforeStart).some((node) => node.id === 'make-track-visible')).toBe(false);
    expect(visibleAtlasNodes(2, beforeStart).some((node) => node.id === 'choose-track-stage')).toBe(false);
    expect(visibleAtlasNodes(2, active).find((node) => node.id === 'choose-track-stage')?.status).toBe('attempted');
    expect(visibleAtlasNodes(2, active).find((node) => node.id === 'reactive-visuals-stage')?.status).toBe('attempted');
    expect(visibleAtlasNodes(2, active).find((node) => node.id === 'make-track-visible')?.status).toBe('attempted');
    expect(visibleAtlasNodes(2, completed).find((node) => node.id === 'choose-track-stage')?.status).toBe('completed');
    expect(visibleAtlasNodes(2, completed).find((node) => node.id === 'make-track-visible')?.status).toBe('completed');
    expect(visibleAtlasNodes(2, stopped).find((node) => node.id === 'make-track-visible')?.status).toBe('attempted');
    expect(visibleAtlasNodes(2, stopped).find((node) => node.id === 'visual-storyboard')?.status).toBe('discovered');
    expect(visibleAtlasNodes(2, completed).find((node) => node.id === 'projection-sketch')?.status).toBe('discovered');
    expect(visibleAtlasNodes(2, completed).length).toBeGreaterThan(visibleAtlasNodes(2, active).length);
  });
});

describe('Atlas showcase mode', () => {
  it('shows the entire graph without gating', () => {
    const nodes = atlasShowcaseNodes();
    expect(nodes.length).toBe(atlasGraphNodes.length);
    expect(nodes.some((node) => node.id === 'make-track-visible')).toBe(true);
    expect(nodes.some((node) => node.id === 'mini-set')).toBe(true);
  });

  it('marks a handful of nodes completed for badge variety', () => {
    const nodes = atlasShowcaseNodes();
    expect(nodes.filter((node) => node.status === 'completed').length).toBeGreaterThanOrEqual(4);
    expect(nodes.find((node) => node.id === 'live-av')?.status).toBe('attempted');
  });

  it('keeps only detail-zoom edges with valid endpoints and recolors other routes as navigator routes', () => {
    const edges = atlasShowcaseEdges();
    const ids = new Set(atlasShowcaseNodes().map((node) => node.id));
    for (const edge of edges) {
      expect(ids.has(edge.from), `${edge.id} has a missing source`).toBe(true);
      expect(ids.has(edge.to), `${edge.id} has a missing destination`).toBe(true);
      expect(edge.maxZoom === undefined || edge.maxZoom >= 2).toBe(true);
    }
    expect(edges.some((edge) => edge.kind === 'personal' && edge.routeId === 'live-av')).toBe(true);
    expect(edges.some((edge) => edge.kind === 'personal' && edge.routeId && edge.routeId !== 'live-av')).toBe(false);
    const navigatorRouteIds = new Set(edges.filter((edge) => edge.kind === 'guide').map((edge) => edge.routeId));
    expect(navigatorRouteIds.size).toBeGreaterThanOrEqual(3);
  });
});

describe('Atlas camera', () => {
  it('fits the whole world inside representative phone and desktop viewports', () => {
    for (const [width, height] of [[390, 844], [844, 390], [1440, 900]]) {
      const camera = fitWorldCamera(width, height, 16);
      expect(camera.scale).toBeGreaterThanOrEqual(ATLAS_MIN_SCALE);
      expect(camera.scale).toBeLessThanOrEqual(0.94);
      expect(Number.isFinite(camera.x)).toBe(true);
      expect(Number.isFinite(camera.y)).toBe(true);
    }
  });

  it('centers a selected node and clamps its requested scale', () => {
    const node = atlasNodeIndex.get('live-av')!;
    const camera = focusedCamera(node, 390, 844, 99);

    expect(camera.scale).toBe(ATLAS_MAX_SCALE);
    expect(node.x * camera.scale + camera.x).toBeCloseTo(195);
    expect(node.y * camera.scale + camera.y).toBeCloseTo(422);
  });

  it('keeps the anchored world point underneath the moving pinch focal point', () => {
    const worldPoint = { x: 320, y: 210 };
    const focal = { x: 175, y: 360 };
    const scale = 1.75;
    const translation = cameraTranslationForAnchor(worldPoint.x, worldPoint.y, focal.x, focal.y, scale);

    expect(worldPoint.x * scale + translation.x).toBeCloseTo(focal.x);
    expect(worldPoint.y * scale + translation.y).toBeCloseTo(focal.y);
  });
});
