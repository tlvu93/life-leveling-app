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
import type { AtlasVisualTheme } from '@/theme/atlas-style';
import type { AppTheme } from '@/theme/tokens';
import { domainVisual, progressRing, relationshipStyle, shellSidesFor, starField, withAlpha, type DomainVisual } from './universe-visuals';

export type UniverseFonts = { label: SkFont; cluster: SkFont };

export type UniverseWorldSceneProps = {
  layout: UniverseLayout;
  nodes: UniverseNodeVm[];
  relationships: UniverseRelationship[];
  /** Null until the typefaces resolve; the Universe still draws without them. */
  fonts: UniverseFonts | null;
  theme: AppTheme;
  visual: AtlasVisualTheme;
  selectedId: NodeId | null;
  highlightedPathId: string | null;
  routeNodeIds: NodeId[];
  tier: 0 | 1 | 2;
};

const LABEL_HALO_OFFSETS: [number, number][] = [[1.3, 0], [-1.3, 0], [0, 1.3], [0, -1.3]];

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

/** Halo, optional bloom rims, gradient body, crisp rim — the Atlas recipe. */
function NodeShell({ x, y, radius, sides, domain, active }: {
  x: number; y: number; radius: number; sides: number | null; domain: DomainVisual; active: boolean;
}) {
  const shell = sides ? regularPolygonPath(x, y, sides, radius) : null;
  const haloRadius = radius * 1.85;
  const body = (key: string, extra: Record<string, unknown>) => (shell
    ? <Path key={key} path={shell} strokeJoin="round" {...extra} />
    : <Circle key={key} cx={x} cy={y} r={radius} {...extra} />);

  return (
    <Group>
      <Circle cx={x} cy={y} r={haloRadius}>
        <RadialGradient
          c={vec(x, y)}
          r={haloRadius}
          colors={active
            ? [withAlpha(domain.glow, 0.4), withAlpha(domain.glow, 0.18), withAlpha(domain.glow, 0)]
            : [withAlpha(domain.glow, 0.16), withAlpha(domain.glow, 0.06), withAlpha(domain.glow, 0)]}
          positions={[0.28, 0.55, 1]}
        />
      </Circle>
      {active && body('bloom-wide', { style: 'stroke', strokeWidth: radius * 0.44, color: domain.rim, opacity: 0.26 })}
      {active && body('bloom-mid', { style: 'stroke', strokeWidth: radius * 0.26, color: domain.rim, opacity: 0.55 })}
      {active && body('bloom-tight', { style: 'stroke', strokeWidth: radius * 0.14, color: domain.rim, opacity: 0.9 })}
      {shell ? (
        <Path path={shell} opacity={active ? 0.94 : 0.74}>
          <RadialGradient c={vec(x, y)} r={radius * 1.35} colors={[domain.bright, domain.core]} />
        </Path>
      ) : (
        <Circle cx={x} cy={y} r={radius} opacity={active ? 0.94 : 0.74}>
          <RadialGradient c={vec(x, y)} r={radius * 1.35} colors={[domain.bright, domain.core]} />
        </Circle>
      )}
      {body('rim', {
        style: 'stroke',
        strokeWidth: active ? Math.max(1.5, radius * 0.086) : Math.max(1.1, radius * 0.05),
        color: active ? '#FFFFFF' : domain.bright,
        opacity: active ? 1 : 0.85,
      })}
    </Group>
  );
}

/** Letter-spaced constellation title with a halo, as the Atlas draws regions. */
function SpacedTitle({ x, y, text, font, color, halo, tracking = 2.6 }: {
  x: number; y: number; text: string; font: SkFont; color: string; halo: string; tracking?: number;
}) {
  const glyphs = [...text];
  const total = glyphs.reduce((sum, glyph) => sum + textWidth(font, glyph) + tracking, -tracking);
  let cursor = x - total / 2;
  return (
    <Group>
      {glyphs.map((glyph, index) => {
        const at = cursor;
        cursor += textWidth(font, glyph) + tracking;
        return (
          <Group key={`${glyph}-${index}`}>
            {LABEL_HALO_OFFSETS.map(([dx, dy], offset) => (
              <SkiaText key={offset} x={at + dx} y={y + dy} text={glyph} font={font} color={halo} />
            ))}
            <SkiaText x={at} y={y} text={glyph} font={font} color={color} />
          </Group>
        );
      })}
    </Group>
  );
}

/**
 * Pure and hook-free: this whole tree is baked to one SkPicture and replayed
 * under the camera transform, so it must never read a SharedValue.
 */
export function UniverseWorldScene({
  layout, nodes, relationships, fonts, theme, visual, selectedId, highlightedPathId, routeNodeIds, tier,
}: UniverseWorldSceneProps) {
  const visible = new Set(nodes.map((n) => n.id));
  const nodeVmById = new Map(nodes.map((n) => [n.id, n]));
  const dimmed = (clusterId: string) => highlightedPathId !== null && clusterId !== highlightedPathId;
  const routeSet = new Set(routeNodeIds);
  const stars = starField(layout.world.width, layout.world.height);

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
      {stars.map((star, index) => (
        <Circle key={`star-${index}`} cx={star.x} cy={star.y} r={star.r} color={visual.starTiny} opacity={0.55} />
      ))}

      {/* Constellation nebula fields, tinted by domain. */}
      {layout.clusters.map((cluster) => {
        const domain = domainVisual(cluster.domainId);
        const faded = dimmed(cluster.pathId);
        const fieldRadius = cluster.radius * 1.15;
        return (
          <Group key={cluster.pathId} opacity={faded ? 0.32 : 1}>
            <Circle cx={cluster.x} cy={cluster.y} r={fieldRadius}>
              <RadialGradient
                c={vec(cluster.x, cluster.y)}
                r={fieldRadius}
                colors={[
                  withAlpha(domain.nebula, cluster.status === 'stub' ? 0.5 : 1),
                  withAlpha(domain.nebula, 0.35),
                  withAlpha(domain.nebula, 0),
                ]}
                positions={[0, 0.55, 1]}
              />
            </Circle>
            {fonts && (
              <SpacedTitle
                x={cluster.x}
                y={cluster.y - cluster.radius + 4}
                text={cluster.title.toUpperCase()}
                font={fonts.cluster}
                color={domain.bright}
                halo={visual.regionLabelHalo}
              />
            )}
          </Group>
        );
      })}

      {/* Typed relationships: solid dependency, dotted related, bowed bridge. */}
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
          const bow = Math.hypot(to.x - from.x, to.y - from.y) * 0.16;
          path.quadTo((from.x + to.x) / 2 + bow, (from.y + to.y) / 2 - bow, to.x, to.y);
        } else {
          path.lineTo(to.x, to.y);
        }
        const domain = domainVisual(from.domainId);
        const alpha = style.opacity * (faded ? 0.25 : 1) * (selectedId && !involved ? 0.45 : 1);
        return (
          <Group key={`${rel.kind}-${rel.from}-${rel.to}`}>
            {/* Wide faint stroke under a narrow bright one fakes a glow pass. */}
            <Path path={path} style="stroke" strokeWidth={style.width * 3.2} color={withAlpha(domain.web, alpha * 0.22)}>
              {style.dash && <DashPathEffect intervals={style.dash.map((d) => d * 3)} />}
            </Path>
            <Path
              path={path}
              style="stroke"
              strokeWidth={style.width * (involved ? 1.7 : 1)}
              color={withAlpha(rel.kind === 'bridge' ? domain.bright : domain.web, alpha)}>
              {style.dash && <DashPathEffect intervals={style.dash} />}
            </Path>
          </Group>
        );
      })}

      {/* The active Journey's route, over the graph it runs through. */}
      {routeStarted && (
        <Group>
          <Path path={routePath} style="stroke" strokeWidth={14} color={visual.routeBloom} opacity={0.5} />
          <Path path={routePath} style="stroke" strokeWidth={6} color={visual.routeSoft} opacity={0.7} />
          <Path path={routePath} style="stroke" strokeWidth={2.4} color={visual.routeCore} />
        </Group>
      )}

      {nodes.map((node) => {
        const seat = layout.byId.get(node.id);
        if (!seat) return null;
        const domain = domainVisual(node.domainId);
        const faded = dimmed(seat.clusterId);
        const selected = node.id === selectedId;
        const related = neighbours.has(node.id);
        const onRoute = routeSet.has(node.id);
        const active = selected || onRoute || node.progressState !== null;
        const ring = progressRing(node.progressState);
        const vm = nodeVmById.get(node.id);
        // At the Regions tier the constellation titles carry the map; the
        // Constellations tier names only the major concepts, because labelling
        // every standard node there collides in a dense cluster.
        const showLabel = fonts && (tier >= 2 || (tier === 1 && node.size === 'major'));

        return (
          <Group key={node.id} opacity={faded ? 0.3 : selectedId && !selected && !related ? 0.55 : 1}>
            <NodeShell
              x={seat.x}
              y={seat.y}
              radius={seat.radius}
              sides={shellSidesFor(vm?.type ?? 'skill')}
              domain={domain}
              active={active}
            />
            {ring && <Circle cx={seat.x} cy={seat.y} r={seat.radius + 7} style="stroke" strokeWidth={2} color={ring} opacity={0.9} />}
            {selected && (
              <Group>
                <Circle cx={seat.x} cy={seat.y} r={seat.radius + 13} style="stroke" strokeWidth={5} color={visual.selection} opacity={0.28} />
                <Circle cx={seat.x} cy={seat.y} r={seat.radius + 13} style="stroke" strokeWidth={1.8} color={visual.selection} />
              </Group>
            )}
            {showLabel && fonts && (() => {
              const width = textWidth(fonts.label, node.title);
              const lx = seat.x - width / 2;
              const ly = seat.y + seat.radius + fonts.label.getSize() + 5;
              return (
                <Group>
                  {LABEL_HALO_OFFSETS.map(([dx, dy], offset) => (
                    <SkiaText key={offset} x={lx + dx} y={ly + dy} text={node.title} font={fonts.label} color={visual.labelHalo} />
                  ))}
                  <SkiaText x={lx} y={ly} text={node.title} font={fonts.label} color={visual.labelInk} />
                </Group>
              );
            })()}
          </Group>
        );
      })}
    </Group>
  );
}
