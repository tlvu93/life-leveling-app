import {
  Blur,
  Circle,
  DashPathEffect,
  Group,
  Line,
  LinearGradient,
  Paint,
  Path,
  RadialGradient,
  RoundedRect,
  Text as SkiaText,
  vec,
  type SkFont,
} from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';

import type { AtlasGraphNode, AtlasZoom } from '@/domain/atlas';
import { domainVisuals, GLOW, NODE_GEOMETRY, nodeRadius, withAlpha, type AtlasVisualTheme, type DomainVisual } from '@/theme/atlas-style';
import { clusterColors, type AppTheme } from '@/theme/tokens';
import { regularPolygonPath, sparklePath, starPath } from './atlas-geometry';

// Node renderers for the "Living Universe" atlas. Recipe per node:
//   1. radial-gradient halo (mask-filter blurs are banned on the per-frame
//      path: each BlurMask is a saveLayer + Gaussian pass, the dominant GPU
//      cost on mid-range Android — see docs/superpowers/plans/2026-08-15-atlas-performance.md)
//   2. body fill with a lighter-at-top radial gradient
//   3. bright rim stroke (round joins fake the mock's rounded polygon corners)
//   4. white glyph
// Quest/path/milestone badges all draw in the violet route family like the
// mock; skills are tiny white badges with a domain-colored sparkle glint.

export type AtlasFonts = {
  label: SkFont;
  small: SkFont;
  hub: SkFont;
  region: SkFont;
  step: SkFont;
};

type NodeProps = {
  node: AtlasGraphNode;
  selected: boolean;
  theme: AppTheme;
  visual: AtlasVisualTheme;
  fonts: AtlasFonts;
  /** Showcase density control: drop labels of redirect/advanced quest steps. */
  thinLabels?: boolean;
  /** Current tier, for level-of-detail gating of sub-pixel decoration. */
  semanticZoom?: AtlasZoom;
};

function labelWidth(label: string, prominent: boolean, fonts: AtlasFonts) {
  const font = prominent ? fonts.hub : fonts.label;
  return font.getTextWidth(label);
}

// 4-way outline offsets that fake the old soft BlurMask(2.5) label halo.
const LABEL_HALO_OFFSETS: [number, number][] = [[1.3, 0], [-1.3, 0], [0, 1.3], [0, -1.3]];

/** Alpha component of an rgba() string (1 when absent). */
function haloAlpha(rgba: string): number {
  const match = /,\s*([\d.]+)\)\s*$/.exec(rgba);
  return match ? Number(match[1]) : 1;
}

export function MarkerLabel({ node, theme, visual, fonts }: { node: AtlasGraphNode; theme: AppTheme; visual: AtlasVisualTheme; fonts: AtlasFonts }) {
  // Interest hubs are named by their glowing region label instead.
  if (node.kind === 'interest') return null;
  const haloColor = withAlpha(visual.labelHalo, haloAlpha(visual.labelHalo) * 0.6);
  const lines = node.label.split('|');
  const prominent = node.kind === 'path' && node.status !== 'nearby';
  const font = prominent ? fonts.hub : node.kind === 'milestone' ? fonts.label : fonts.small;
  const lineHeight = prominent ? 17 : node.kind === 'milestone' ? 12 : 10;
  const radius = nodeRadius(node);
  const right = node.labelSide === 'right';

  return (
    <Group>
      {lines.map((line, index) => {
        const width = labelWidth(line, prominent, fonts);
        const x = right ? node.x + radius + 9 : node.x - width / 2;
        const y = right ? node.y - ((lines.length - 1) * lineHeight) / 2 + index * lineHeight + 4 : node.y + radius + 18 + index * lineHeight;
        return (
          <Group key={`${node.id}-${line}`}>
            {LABEL_HALO_OFFSETS.map(([dx, dy], offsetIndex) => (
              <SkiaText key={`halo-${offsetIndex}`} x={x + dx} y={y + dy} text={line} font={font} color={haloColor} />
            ))}
            <SkiaText x={x} y={y} text={line} font={font} color={visual.labelInk} />
          </Group>
        );
      })}
    </Group>
  );
}

/** Letter-spaced glowing text for region names (Skia Text has no letterSpacing). */
export function SpacedText({ x, y, text, font, color, halo, tracking = 3, blur = GLOW.regionLabel }: {
  x: number;
  y: number;
  text: string;
  font: SkFont;
  color: string;
  halo: string;
  tracking?: number;
  blur?: number;
}) {
  let cursor = x;
  const glyphs = [...text].map((char) => {
    const glyph = { char, x: cursor };
    cursor += font.getTextWidth(char) + tracking;
    return glyph;
  });
  return (
    <Group>
      {/* One layer blur for the whole label's halo instead of a saveLayer per
          glyph (was 62 mask-filter passes/frame across the six region names). */}
      <Group layer={<Paint><Blur blur={blur * 0.6} /></Paint>}>
        {glyphs.map((glyph, index) => (
          <SkiaText key={`halo-${index}`} x={glyph.x} y={y} text={glyph.char} font={font} color={halo} />
        ))}
      </Group>
      {glyphs.map((glyph, index) => (
        <SkiaText key={`core-${index}`} x={glyph.x} y={y} text={glyph.char} font={font} color={color} />
      ))}
    </Group>
  );
}

/** White glyph drawn inside an interest hub; geometry keyed by domain id. */
export function InterestGlyph({ node, color }: { node: AtlasGraphNode; color: string }) {
  const x = node.x;
  const y = node.y;

  if (node.id === 'music') {
    return (
      <Group>
        <Path path={`M ${x - 5} ${y + 7} L ${x - 5} ${y - 10} L ${x + 9} ${y - 13} L ${x + 9} ${y + 3}`} color={color} style="stroke" strokeWidth={3} />
        <Line p1={vec(x - 5, y - 5)} p2={vec(x + 9, y - 8)} color={color} strokeWidth={3} />
        <Circle cx={x - 10} cy={y + 9} r={5} color={color} />
        <Circle cx={x + 4} cy={y + 5} r={5} color={color} />
      </Group>
    );
  }

  if (node.id === 'technology') {
    return (
      <Group>
        <RoundedRect x={x - 11} y={y - 11} width={22} height={22} r={4} color={color} style="stroke" strokeWidth={3} />
        <RoundedRect x={x - 5} y={y - 5} width={10} height={10} r={2} color={color} />
        {[-7, 0, 7].map((offset) => (
          <Group key={`technology-${offset}`}>
            <Line p1={vec(x + offset, y - 16)} p2={vec(x + offset, y - 11)} color={color} strokeWidth={2} />
            <Line p1={vec(x + offset, y + 11)} p2={vec(x + offset, y + 16)} color={color} strokeWidth={2} />
            <Line p1={vec(x - 16, y + offset)} p2={vec(x - 11, y + offset)} color={color} strokeWidth={2} />
            <Line p1={vec(x + 11, y + offset)} p2={vec(x + 16, y + offset)} color={color} strokeWidth={2} />
          </Group>
        ))}
      </Group>
    );
  }

  if (node.id === 'visual') {
    const palette = `M ${x + 13} ${y + 2} C ${x + 12} ${y + 14}, ${x + 2} ${y + 17}, ${x - 8} ${y + 13} C ${x - 20} ${y + 8}, ${x - 19} ${y - 8}, ${x - 9} ${y - 15} C ${x + 1} ${y - 22}, ${x + 17} ${y - 14}, ${x + 18} ${y - 4} C ${x + 19} ${y + 1}, ${x + 17} ${y + 3}, ${x + 13} ${y + 2} Z`;
    return (
      <Group>
        <Path path={palette} color={color} style="stroke" strokeWidth={3} />
        <Circle cx={x - 8} cy={y - 8} r={2.8} color={color} />
        <Circle cx={x} cy={y - 11} r={2.8} color={color} />
        <Circle cx={x + 8} cy={y - 6} r={2.8} color={color} />
        <Circle cx={x - 7} cy={y + 2} r={2.8} color={color} />
      </Group>
    );
  }

  if (node.id === 'nature') {
    const leaf = `M ${x - 14} ${y + 12} C ${x - 12} ${y - 7}, ${x + 2} ${y - 17}, ${x + 16} ${y - 16} C ${x + 16} ${y + 1}, ${x + 7} ${y + 15}, ${x - 7} ${y + 14} C ${x - 10} ${y + 14}, ${x - 12} ${y + 13}, ${x - 14} ${y + 12} Z`;
    return (
      <Group>
        <Path path={leaf} color={color} style="stroke" strokeWidth={3} />
        <Path path={`M ${x - 12} ${y + 13} C ${x - 1} ${y + 5}, ${x + 3} ${y - 2}, ${x + 10} ${y - 10}`} color={color} style="stroke" strokeWidth={2.5} />
      </Group>
    );
  }

  if (node.id === 'movement') {
    return (
      <Group>
        <Path path={`M ${x - 16} ${y + 10} C ${x - 16} ${y - 8}, ${x - 8} ${y - 16}, ${x} ${y - 16} C ${x + 9} ${y - 16}, ${x + 16} ${y - 7}, ${x + 16} ${y + 10}`} color={color} style="stroke" strokeWidth={3} />
        <Line p1={vec(x - 10, y + 10)} p2={vec(x + 10, y + 10)} color={color} strokeWidth={3} />
        <Line p1={vec(x, y + 5)} p2={vec(x + 9, y - 6)} color={color} strokeWidth={3} />
        <Circle cx={x} cy={y + 5} r={3} color={color} />
      </Group>
    );
  }

  const heart = `M ${x} ${y + 14} C ${x - 4} ${y + 8}, ${x - 16} ${y + 1}, ${x - 16} ${y - 7} C ${x - 16} ${y - 17}, ${x - 3} ${y - 19}, ${x} ${y - 10} C ${x + 3} ${y - 19}, ${x + 16} ${y - 17}, ${x + 16} ${y - 7} C ${x + 16} ${y + 1}, ${x + 4} ${y + 8}, ${x} ${y + 14} Z`;
  return (
    <Group>
      <Path path={heart} color={color} style="stroke" strokeWidth={3} />
      <Path path={`M ${x - 9} ${y + 3} L ${x - 3} ${y - 2} L ${x + 2} ${y + 2} L ${x + 9} ${y - 4}`} color={color} style="stroke" strokeWidth={2} />
    </Group>
  );
}

function CompletedBadge({ node, theme }: { node: AtlasGraphNode; theme: AppTheme }) {
  const radius = nodeRadius(node);
  const cx = node.x + radius * 0.82;
  const cy = node.y - radius * 0.82;
  return (
    <Group>
      <Circle cx={cx} cy={cy} r={5} color={theme.success} />
      <Circle cx={cx} cy={cy} r={5} color="#FFFFFF" style="stroke" strokeWidth={1.2} />
      <Path
        path={`M ${cx - 2.2} ${cy + 0.2} L ${cx - 0.6} ${cy + 1.9} L ${cx + 2.4} ${cy - 1.7}`}
        color="#FFFFFF"
        style="stroke"
        strokeWidth={1.5}
        strokeCap="round"
        strokeJoin="round"
      />
    </Group>
  );
}

export function SelectionRing({ node, visual, pulseOpacity }: { node: AtlasGraphNode; visual: AtlasVisualTheme; pulseOpacity: SharedValue<number> }) {
  const radius = nodeRadius(node) + 12;
  return (
    <Group opacity={pulseOpacity}>
      <Circle cx={node.x} cy={node.y} r={radius} color={visual.selection} style="stroke" strokeWidth={7} opacity={0.35} />
      <Circle cx={node.x} cy={node.y} r={radius} color={visual.selection} style="stroke" strokeWidth={2.5} />
    </Group>
  );
}

/**
 * Shared layered shell, scaled by radius: atmospheric gradient halo ->
 * wide-band rim blooms faked with stacked plain strokes (wide+faint under
 * narrow+bright) -> single center-lit body -> crisp rim. Nothing solid sits
 * outside the rim, so the white always blooms outermost. The old BlurMask
 * halo/bloom passes cost a saveLayer + Gaussian blur per node per frame.
 */
function LayeredShell({ x, y, sides, radius, domain, active, rotationRad }: {
  x: number;
  y: number;
  sides: number;
  radius: number;
  domain: DomainVisual;
  active: boolean;
  rotationRad?: number;
}) {
  const shell = regularPolygonPath(x, y, sides, radius, rotationRad);
  const haloRadius = radius * 1.85;
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
      {active && (
        <Path path={shell} style="stroke" strokeWidth={radius * 0.44} color={domain.rim} opacity={0.26} strokeJoin="round" />
      )}
      {active && (
        <Path path={shell} style="stroke" strokeWidth={radius * 0.26} color={domain.rim} opacity={0.55} strokeJoin="round" />
      )}
      {active && (
        <Path path={shell} style="stroke" strokeWidth={radius * 0.14} color={domain.rim} opacity={0.9} strokeJoin="round" />
      )}
      <Path path={shell} opacity={active ? 0.94 : 0.7}>
        <RadialGradient c={vec(x, y)} r={radius * 1.35} colors={[domain.bright, domain.core]} />
      </Path>
      <Path
        path={shell}
        style="stroke"
        strokeWidth={active ? Math.max(1.5, radius * 0.086) : Math.max(1.2, radius * 0.05)}
        color={active ? '#FFFFFF' : domain.bright}
        opacity={active ? 1 : 0.85}
        strokeJoin="round"
      />
    </Group>
  );
}

/** Faint ring + short fading rays for mid-size badges (path / milestone). */
function MiniEnvironment({ x, y, radius, seedOffset }: { x: number; y: number; radius: number; seedOffset: number }) {
  const seedBase = x * 7.3 + y * 13.7 + seedOffset;
  return (
    <Group>
      <Circle cx={x} cy={y} r={radius * 1.55} style="stroke" strokeWidth={0.5} color="#FFFFFF" opacity={0.18} />
      {Array.from({ length: 8 }, (_, index) => {
        const angle = (index * 2 * Math.PI) / 8 + (frac(seedBase + index) - 0.5) * 0.4;
        const inner = radius * 1.12;
        const length = radius * (0.9 + frac(seedBase + index * 3.1) * 1.1);
        const x1 = x + inner * Math.cos(angle);
        const y1 = y + inner * Math.sin(angle);
        const x2 = x + (inner + length) * Math.cos(angle);
        const y2 = y + (inner + length) * Math.sin(angle);
        return (
          <Line key={`mini-ray-${index}`} p1={vec(x1, y1)} p2={vec(x2, y2)} strokeWidth={0.6} opacity={0.24}>
            <LinearGradient start={vec(x1, y1)} end={vec(x2, y2)} colors={['#FFFFFF', 'rgba(255, 255, 255, 0)']} />
          </Line>
        );
      })}
    </Group>
  );
}

/** A node counts as activated once it is part of the person's lived world. */
function isActiveStatus(node: AtlasGraphNode): boolean {
  return node.status === 'discovered' || node.status === 'attempted' || node.status === 'completed';
}

const frac = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

const RAY_COUNT = 16;

/**
 * Constellation hub matched to the mock close-up: a single-surface octagon
 * (center-lit, no inner bands) behind one luminous white rim, with the drama
 * coming from the environment - a starburst of fading rays, radar rings, and
 * sparkle dots. All glow comes from gradient fills and stacked strokes.
 */
function HubNode({ node, domain, active, radius, detailed }: { node: AtlasGraphNode; domain: DomainVisual; active: boolean; radius: number; detailed: boolean }) {
  const { x, y } = node;
  const seedBase = x * 7.3 + y * 13.7;
  const rays: { x1: number; y1: number; x2: number; y2: number; width: number; opacity: number; bright: boolean }[] = [];
  if (active && detailed) {
    for (let index = 0; index < RAY_COUNT; index += 1) {
      const angle = (index * 2 * Math.PI) / RAY_COUNT + (frac(seedBase + index) - 0.5) * 0.28;
      const inner = radius * 1.08;
      const length = radius * (1.4 + frac(seedBase + index * 3.1) * 1.6);
      const bright = index % 4 === 0;
      rays.push({
        x1: x + inner * Math.cos(angle),
        y1: y + inner * Math.sin(angle),
        x2: x + (inner + length) * Math.cos(angle),
        y2: y + (inner + length) * Math.sin(angle),
        width: bright ? 1.1 : 0.7,
        opacity: bright ? 0.5 : 0.2 + frac(seedBase + index * 5.7) * 0.15,
        bright,
      });
    }
  }
  return (
    <Group>
      {/* starburst rays, fading outward; a few carry a sparkle at the tip */}
      {rays.map((ray, index) => (
        <Line key={`ray-${index}`} p1={vec(ray.x1, ray.y1)} p2={vec(ray.x2, ray.y2)} strokeWidth={ray.width} opacity={ray.opacity}>
          <LinearGradient start={vec(ray.x1, ray.y1)} end={vec(ray.x2, ray.y2)} colors={['#FFFFFF', 'rgba(255, 255, 255, 0)']} />
        </Line>
      ))}
      {rays.filter((ray) => ray.bright).map((ray, index) => (
        <Group key={`glint-${index}`} opacity={0.75}>
          <Circle cx={ray.x2} cy={ray.y2} r={1.3} color="#FFFFFF" />
          <Circle cx={ray.x2} cy={ray.y2} r={2.6} color="#FFFFFF" opacity={0.35} />
        </Group>
      ))}
      {/* radar rings + short radial ticks between them; sub-pixel at the
          zoomed-out tier, so gated on `detailed` (semantic zoom >= 1) */}
      {detailed && <Circle cx={x} cy={y} r={radius * 1.5} style="stroke" strokeWidth={0.6} color="#FFFFFF" opacity={active ? 0.22 : 0.1} />}
      {detailed && <Circle cx={x} cy={y} r={radius * 1.95} style="stroke" strokeWidth={0.6} color="#FFFFFF" opacity={active ? 0.13 : 0.06} />}
      {active && detailed && <Circle cx={x} cy={y} r={radius * 2.45} style="stroke" strokeWidth={0.5} color="#FFFFFF" opacity={0.08} />}
      {active && detailed && Array.from({ length: 12 }, (_, index) => {
        const angle = (index * 2 * Math.PI) / 12 + 0.26;
        return (
          <Line
            key={`tick-${index}`}
            p1={vec(x + radius * 1.55 * Math.cos(angle), y + radius * 1.55 * Math.sin(angle))}
            p2={vec(x + radius * 1.9 * Math.cos(angle), y + radius * 1.9 * Math.sin(angle))}
            strokeWidth={0.5}
            color="#FFFFFF"
            opacity={0.22}
          />
        );
      })}
      <LayeredShell x={x} y={y} sides={8} radius={radius} domain={domain} active={active} />
      {/* large icon with a small soft glow */}
      <Circle cx={x} cy={y} r={radius * 0.78}>
        <RadialGradient
          c={vec(x, y)}
          r={radius * 0.78}
          colors={[`rgba(255, 255, 255, ${active ? 0.2 : 0.09})`, 'rgba(255, 255, 255, 0)']}
          positions={[0.4, 1]}
        />
      </Circle>
      <Group origin={vec(x, y)} transform={[{ scale: 0.82 }]}>
        <InterestGlyph node={node} color="#FFFFFF" />
      </Group>
    </Group>
  );
}

export function AtlasNodeView({ node, selected, theme, visual, fonts, thinLabels = false, semanticZoom = 1 }: NodeProps) {
  const domain = domainVisuals[node.cluster];
  const violet = domainVisuals.crossroads;
  const radius = nodeRadius(node);
  const geometry = NODE_GEOMETRY[node.kind];
  const busyStep = node.kind === 'quest' && node.step ? /[R+]/.test(node.step) : false;
  const label = thinLabels && busyStep ? null : <MarkerLabel node={node} theme={theme} visual={visual} fonts={fonts} />;
  // The pulsing selection ring is animated, so it renders on the overlay
  // canvas (AtlasScene) instead of inside the baked world picture.
  const active = selected || isActiveStatus(node);
  // LOD: at the zoomed-out Regions tier (scale 0.34-0.72) starburst rays,
  // radar ticks, and mini-environments render at under a pixel wide - skip them.
  const detailed = semanticZoom >= 1;

  if (node.kind === 'interest') {
    return (
      <Group>
        <HubNode node={node} domain={domain} active={active} radius={radius} detailed={detailed} />
        {label}
      </Group>
    );
  }

  if (node.kind === 'path') {
    const preview = node.status === 'nearby' && !selected;
    return (
      <Group opacity={preview ? 0.62 : 1}>
        {active && detailed && <MiniEnvironment x={node.x} y={node.y} radius={radius} seedOffset={1} />}
        <LayeredShell x={node.x} y={node.y} sides={7} radius={radius} domain={violet} active={active} />
        <Path
          path={`M ${node.x - 5} ${node.y - 12} L ${node.x + 2} ${node.y - 2} L ${node.x - 2} ${node.y - 2} L ${node.x + 6} ${node.y + 12} L ${node.x - 7} ${node.y + 1} L ${node.x - 1} ${node.y + 1} Z`}
          color="#FFFFFF"
        />
        {label}
      </Group>
    );
  }

  if (node.kind === 'milestone') {
    return (
      <Group>
        {active && detailed && <MiniEnvironment x={node.x} y={node.y} radius={radius} seedOffset={2} />}
        <LayeredShell x={node.x} y={node.y} sides={7} radius={radius} domain={violet} active={active} />
        <Path path={starPath(node.x, node.y, 5, radius * 0.52, radius * 0.22)} color="#FFFFFF" />
        {label}
      </Group>
    );
  }

  if (node.kind === 'quest') {
    return (
      <Group>
        <LayeredShell x={node.x} y={node.y} sides={7} radius={radius} domain={violet} active={active} />
        <SkiaText
          x={node.x - fonts.step.getTextWidth(node.step ?? '') / 2}
          y={node.y + 4}
          text={node.step ?? ''}
          font={fonts.step}
          color="#FFFFFF"
        />
        {node.status === 'completed' && <CompletedBadge node={node} theme={theme} />}
        {label}
      </Group>
    );
  }

  // skill + nearby: tiny white badge with a domain sparkle glint
  const dashed = node.kind === 'nearby';
  const glowRadius = radius + 2 + geometry.glowBlur * (active ? 1.6 : 0.9);
  return (
    <Group opacity={dashed ? 0.78 : 1}>
      <Circle cx={node.x} cy={node.y} r={glowRadius}>
        <RadialGradient
          c={vec(node.x, node.y)}
          r={glowRadius}
          colors={[
            withAlpha(domain.glow, active ? geometry.glowOpacity : geometry.glowOpacity * 0.45),
            withAlpha(domain.glow, 0),
          ]}
          positions={[(radius + 1) / glowRadius, 1]}
        />
      </Circle>
      <Circle cx={node.x} cy={node.y} r={radius} color={visual.markerFill} />
      {active ? (
        // White edge bloom drawn last so nothing colored sits outside it;
        // a wide faint band carries the energy under a crisp ring.
        <>
          <Circle cx={node.x} cy={node.y} r={radius + 0.8} color="#FFFFFF" opacity={0.4} style="stroke" strokeWidth={4.2} />
          <Circle cx={node.x} cy={node.y} r={radius + 0.6} color="#FFFFFF" opacity={0.8} style="stroke" strokeWidth={2.2} />
          <Circle cx={node.x} cy={node.y} r={radius + 0.4} color="#FFFFFF" style="stroke" strokeWidth={1.1} />
        </>
      ) : (
        <Circle cx={node.x} cy={node.y} r={radius} color={domain.bright} style="stroke" strokeWidth={geometry.rimWidth}>
          {dashed && <DashPathEffect intervals={[4, 4]} />}
        </Circle>
      )}
      <Path path={sparklePath(node.x, node.y, radius * 0.72)} color={clusterColors[node.cluster]} />
      {node.status === 'completed' && <CompletedBadge node={node} theme={theme} />}
      {label}
    </Group>
  );
}
