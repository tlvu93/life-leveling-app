import {
  BlurMask,
  Circle,
  DashPathEffect,
  Group,
  Line,
  Path,
  RadialGradient,
  RoundedRect,
  Text as SkiaText,
  vec,
  type SkFont,
} from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';

import type { AtlasGraphNode } from '@/domain/atlas';
import { domainVisuals, GLOW, NODE_GEOMETRY, nodeRadius, type AtlasVisualTheme, type DomainVisual } from '@/theme/atlas-style';
import { clusterColors, type AppTheme } from '@/theme/tokens';
import { regularPolygonPath, sparklePath, starPath } from './atlas-geometry';

// Node renderers for the "Living Universe" atlas. Recipe per node:
//   1. blurred halo (BlurMask on a fill - the only real glow primitive we use)
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
  pulseOpacity: SharedValue<number>;
  /** Showcase density control: drop labels of redirect/advanced quest steps. */
  thinLabels?: boolean;
};

function labelWidth(label: string, prominent: boolean, fonts: AtlasFonts) {
  const font = prominent ? fonts.hub : fonts.label;
  return font.getTextWidth(label);
}

export function MarkerLabel({ node, theme, visual, fonts }: { node: AtlasGraphNode; theme: AppTheme; visual: AtlasVisualTheme; fonts: AtlasFonts }) {
  // Interest hubs are named by their glowing region label instead.
  if (node.kind === 'interest') return null;
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
            <SkiaText x={x} y={y} text={line} font={font} color={visual.labelHalo}>
              <BlurMask blur={GLOW.label} style="normal" />
            </SkiaText>
            <SkiaText x={x} y={y} text={line} font={font} color={visual.labelHalo}>
              <BlurMask blur={1.2} style="normal" />
            </SkiaText>
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
      {glyphs.map((glyph, index) => (
        <SkiaText key={`halo-${index}`} x={glyph.x} y={y} text={glyph.char} font={font} color={halo}>
          <BlurMask blur={blur} style="normal" />
        </SkiaText>
      ))}
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

function SelectionRing({ node, visual, pulseOpacity }: { node: AtlasGraphNode; visual: AtlasVisualTheme; pulseOpacity: SharedValue<number> }) {
  const radius = nodeRadius(node) + 12;
  return (
    <Group opacity={pulseOpacity}>
      <Circle cx={node.x} cy={node.y} r={radius} color={visual.selection} style="stroke" strokeWidth={2.5}>
        <BlurMask blur={4} style="solid" />
      </Circle>
    </Group>
  );
}

/** Shared glowing polygon badge: halo, gradient body, rim, all round-joined. */
function GlowBadge({ x, y, sides, radius, domain, glowBlur, glowOpacity, rimWidth, rotationRad }: {
  x: number;
  y: number;
  sides: number;
  radius: number;
  domain: DomainVisual;
  glowBlur: number;
  glowOpacity: number;
  rimWidth: number;
  rotationRad?: number;
}) {
  const shape = regularPolygonPath(x, y, sides, radius, rotationRad);
  return (
    <Group>
      <Path path={shape} color={domain.glow} opacity={glowOpacity}>
        <BlurMask blur={glowBlur} style="normal" />
      </Path>
      <Path path={shape} strokeJoin="round" style="stroke" strokeWidth={radius * 0.3} color={domain.core} />
      <Path path={shape}>
        <RadialGradient c={vec(x, y - radius * 0.6)} r={radius * 2.1} colors={[domain.bright, domain.core]} />
      </Path>
      <Path path={shape} style="stroke" strokeWidth={rimWidth} color={domain.bright} strokeJoin="round" />
    </Group>
  );
}

export function AtlasNodeView({ node, selected, theme, visual, fonts, pulseOpacity, thinLabels = false }: NodeProps) {
  const domain = domainVisuals[node.cluster];
  const violet = domainVisuals.crossroads;
  const radius = nodeRadius(node);
  const geometry = NODE_GEOMETRY[node.kind];
  const busyStep = node.kind === 'quest' && node.step ? /[R+]/.test(node.step) : false;
  const label = thinLabels && busyStep ? null : <MarkerLabel node={node} theme={theme} visual={visual} fonts={fonts} />;
  const ring = selected ? <SelectionRing node={node} visual={visual} pulseOpacity={pulseOpacity} /> : null;

  if (node.kind === 'interest') {
    return (
      <Group>
        {ring}
        <GlowBadge x={node.x} y={node.y} sides={6} radius={radius} domain={domain} glowBlur={geometry.glowBlur} glowOpacity={geometry.glowOpacity} rimWidth={geometry.rimWidth} />
        <InterestGlyph node={node} color="#FFFFFF" />
        {label}
      </Group>
    );
  }

  if (node.kind === 'path') {
    const preview = node.status === 'nearby';
    return (
      <Group opacity={preview ? 0.62 : 1}>
        {ring}
        <GlowBadge x={node.x} y={node.y} sides={6} radius={radius} domain={violet} glowBlur={geometry.glowBlur} glowOpacity={preview ? 0.4 : geometry.glowOpacity} rimWidth={geometry.rimWidth} />
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
        {ring}
        <GlowBadge x={node.x} y={node.y} sides={7} radius={radius} domain={violet} glowBlur={geometry.glowBlur} glowOpacity={geometry.glowOpacity} rimWidth={geometry.rimWidth} />
        <Path path={starPath(node.x, node.y, 5, radius * 0.52, radius * 0.22)} color="#FFFFFF" />
        {label}
      </Group>
    );
  }

  if (node.kind === 'quest') {
    return (
      <Group>
        {ring}
        <GlowBadge x={node.x} y={node.y} sides={7} radius={radius} domain={violet} glowBlur={geometry.glowBlur} glowOpacity={geometry.glowOpacity} rimWidth={geometry.rimWidth} />
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
  return (
    <Group opacity={dashed ? 0.78 : 1}>
      {ring}
      <Circle cx={node.x} cy={node.y} r={radius + 2} color={domain.glow} opacity={geometry.glowOpacity}>
        <BlurMask blur={geometry.glowBlur} style="normal" />
      </Circle>
      <Circle cx={node.x} cy={node.y} r={radius} color={visual.markerFill} />
      <Circle cx={node.x} cy={node.y} r={radius} color={domain.bright} style="stroke" strokeWidth={geometry.rimWidth}>
        {dashed && <DashPathEffect intervals={[4, 4]} />}
      </Circle>
      <Path path={sparklePath(node.x, node.y, radius * 0.62)} color={clusterColors[node.cluster]} />
      {node.status === 'completed' && <CompletedBadge node={node} theme={theme} />}
      {label}
    </Group>
  );
}
