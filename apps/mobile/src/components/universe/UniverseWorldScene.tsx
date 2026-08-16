import {
  Circle,
  DashPathEffect,
  Group,
  Path,
  RadialGradient,
  Skia,
  Text as SkiaText,
  vec,
  type SkFont,
} from '@shopify/react-native-skia';

import { regularPolygonPath } from '@/components/atlas/atlas-geometry';
import type { UniverseRelationship } from '@/domain/roadmap/catalog';
import type { NodeId } from '@/domain/roadmap/ids';
import type { UniverseNodeVm } from '@/domain/roadmap/selectors/universe';
import type { UniverseLayout } from '@/domain/roadmap/universe-layout';
import type { AppTheme } from '@/theme/tokens';
import { domainVisual, isDestination, nodeRimWidth, progressRing, relationshipStyle, withAlpha } from './universe-visuals';

export type UniverseFonts = { label: SkFont; cluster: SkFont };

/**
 * `measureText` throws "Not implemented on React Native Web", which takes the
 * whole Skia tree down with it. Prefer the advance-width API, and fall back to
 * an estimate rather than risk the canvas.
 */
function textWidth(font: SkFont, text: string): number {
  try {
    const width = font.getTextWidth?.(text);
    if (typeof width === 'number' && Number.isFinite(width) && width > 0) return width;
  } catch {
    // fall through to the estimate
  }
  return text.length * font.getSize() * 0.52;
}

export type UniverseWorldSceneProps = {
  layout: UniverseLayout;
  nodes: UniverseNodeVm[];
  relationships: UniverseRelationship[];
  /** Null until the typefaces resolve; the Universe still draws without them. */
  fonts: UniverseFonts | null;
  theme: AppTheme;
  selectedId: NodeId | null;
  highlightedPathId: string | null;
  routeNodeIds: NodeId[];
  tier: 0 | 1 | 2;
};

/**
 * Pure and hook-free: this whole tree is baked to one SkPicture and replayed
 * under the camera transform, so it must never read a SharedValue.
 */
export function UniverseWorldScene({
  layout, nodes, relationships, fonts, theme, selectedId, highlightedPathId, routeNodeIds, tier,
}: UniverseWorldSceneProps) {
  const visible = new Set(nodes.map((n) => n.id));
  const nodeVmById = new Map(nodes.map((n) => [n.id, n]));
  const dimmed = (clusterId: string) => highlightedPathId !== null && clusterId !== highlightedPathId;
  const routeSet = new Set(routeNodeIds);

  const neighbours = new Set<NodeId>();
  if (selectedId) {
    for (const rel of relationships) {
      if (rel.from === selectedId) neighbours.add(rel.to);
      if (rel.to === selectedId) neighbours.add(rel.from);
    }
  }

  const routePath = Skia.Path.Make();
  let routeStarted = false;
  for (const nodeId of routeNodeIds) {
    const seat = layout.byId.get(nodeId);
    if (!seat) continue;
    if (!routeStarted) { routePath.moveTo(seat.x, seat.y); routeStarted = true; }
    else routePath.lineTo(seat.x, seat.y);
  }

  return (
    <Group>
      {/* Constellation fields, tinted by domain. */}
      {layout.clusters.map((cluster) => {
        const visual = domainVisual(cluster.domainId);
        const faded = dimmed(cluster.pathId);
        return (
          <Group key={cluster.pathId}>
            <Circle cx={cluster.x} cy={cluster.y} r={cluster.radius} opacity={faded ? 0.25 : 1}>
              <RadialGradient
                c={vec(cluster.x, cluster.y)}
                r={cluster.radius}
                colors={[withAlpha(visual.core, cluster.status === 'stub' ? 0.1 : 0.18), withAlpha(visual.core, 0)]}
              />
            </Circle>
            {fonts && (
              <SkiaText
                x={cluster.x - textWidth(fonts.cluster, cluster.title) / 2}
                y={cluster.y - cluster.radius + 26}
                text={cluster.title}
                font={fonts.cluster}
                color={faded ? withAlpha(visual.bright, 0.3) : visual.bright}
              />
            )}
          </Group>
        );
      })}

      {/* Typed relationships: solid dependency, dotted related, long bridge. */}
      {relationships.map((rel) => {
        const from = layout.byId.get(rel.from);
        const to = layout.byId.get(rel.to);
        if (!from || !to || !visible.has(rel.from) || !visible.has(rel.to)) return null;
        if (tier === 0 && rel.kind !== 'bridge') return null;
        const style = relationshipStyle[rel.kind];
        const faded = dimmed(from.clusterId) && dimmed(to.clusterId);
        const involved = selectedId !== null && (rel.from === selectedId || rel.to === selectedId);
        const path = Skia.Path.Make();
        path.moveTo(from.x, from.y);
        if (rel.kind === 'bridge') {
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          const bow = Math.hypot(to.x - from.x, to.y - from.y) * 0.16;
          path.quadTo(midX + bow, midY - bow, to.x, to.y);
        } else {
          path.lineTo(to.x, to.y);
        }
        const visual = domainVisual(from.domainId);
        return (
          <Path
            key={`${rel.kind}-${rel.from}-${rel.to}`}
            path={path}
            style="stroke"
            strokeWidth={style.width * (involved ? 1.8 : 1)}
            color={withAlpha(rel.kind === 'bridge' ? visual.bright : theme.inkSecondary, style.opacity * (faded ? 0.3 : 1) * (selectedId && !involved ? 0.5 : 1))}>
            {style.dash && <DashPathEffect intervals={style.dash} />}
          </Path>
        );
      })}

      {/* The active Journey's route, drawn over the graph it runs through. */}
      {routeStarted && (
        <Group>
          <Path path={routePath} style="stroke" strokeWidth={9} color={withAlpha('#F2C14E', 0.16)} />
          <Path path={routePath} style="stroke" strokeWidth={3} color={withAlpha('#F2C14E', 0.75)} />
        </Group>
      )}

      {/* Nodes. */}
      {nodes.map((node) => {
        const seat = layout.byId.get(node.id);
        if (!seat) return null;
        const visual = domainVisual(node.domainId);
        const faded = dimmed(seat.clusterId);
        const selected = node.id === selectedId;
        const related = neighbours.has(node.id);
        const alpha = faded ? 0.28 : selectedId && !selected && !related ? 0.6 : 1;
        const ring = progressRing(node.progressState);
        const vm = nodeVmById.get(node.id);

        return (
          <Group key={node.id} opacity={alpha}>
            <Circle cx={seat.x} cy={seat.y} r={seat.radius * 2.2}>
              <RadialGradient c={vec(seat.x, seat.y)} r={seat.radius * 2.2} colors={[withAlpha(visual.core, 0.28), withAlpha(visual.core, 0)]} />
            </Circle>
            {isDestination(vm?.type ?? 'skill') ? (
              <Path path={regularPolygonPath(seat.x, seat.y, 7, seat.radius)} color={theme.surfaceStrong} />
            ) : (
              <Circle cx={seat.x} cy={seat.y} r={seat.radius} color={theme.surfaceStrong} />
            )}
            {isDestination(vm?.type ?? 'skill') ? (
              <Path
                path={regularPolygonPath(seat.x, seat.y, 7, seat.radius)}
                style="stroke"
                strokeWidth={nodeRimWidth(vm?.type ?? 'skill')}
                color={visual.bright}
              />
            ) : (
              <Circle
                cx={seat.x}
                cy={seat.y}
                r={seat.radius}
                style="stroke"
                strokeWidth={nodeRimWidth(vm?.type ?? 'skill')}
                color={visual.bright}
              />
            )}
            {routeSet.has(node.id) && (
              <Circle cx={seat.x} cy={seat.y} r={seat.radius + 4} style="stroke" strokeWidth={1.5} color={withAlpha('#F2C14E', 0.8)} />
            )}
            {ring && (
              <Circle cx={seat.x} cy={seat.y} r={seat.radius + 7} style="stroke" strokeWidth={2} color={ring} />
            )}
            {selected && (
              <Circle cx={seat.x} cy={seat.y} r={seat.radius + 12} style="stroke" strokeWidth={2} color={theme.accent} />
            )}
            {fonts && (tier >= 2 || (tier === 1 && node.size !== 'minor') || node.size === 'major') && (
              <SkiaText
                x={seat.x - textWidth(fonts.label, node.title) / 2}
                y={seat.y + seat.radius + 16}
                text={node.title}
                font={fonts.label}
                color={faded ? withAlpha(theme.ink, 0.35) : theme.ink}
              />
            )}
          </Group>
        );
      })}
    </Group>
  );
}
