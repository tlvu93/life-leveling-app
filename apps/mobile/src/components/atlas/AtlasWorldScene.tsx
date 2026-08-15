import {
  Circle,
  DashPathEffect,
  Group,
  Path,
  Points,
  RadialGradient,
  vec,
  type SkPoint,
} from '@shopify/react-native-skia';

import { atlasNodeIndex, atlasRegions, atlasStars, type AtlasCluster, type AtlasGraphNode, type AtlasZoom } from '@/domain/atlas';
import { domainVisuals, withAlpha, type AtlasVisualTheme } from '@/theme/atlas-style';
import { type AppTheme } from '@/theme/tokens';
import { sparklePath, starPath } from './atlas-geometry';
import { AtlasNodeView, SpacedText, type AtlasFonts } from './atlas-node-renderers';

// The world scene is baked to an SkPicture once per (theme, zoom tier,
// progress, selection, guide) change and replayed as ONE draw under the camera
// transform, so it must stay free of hooks and Reanimated SharedValues.
// Animated content (twinkle, selection ring, travelling particle) lives on the
// separate overlay canvas in AtlasScene.skia.tsx.

// The freeze-mode dust value (0.42 + 0.55 * 0.18): the baked base the overlay
// twinkle brightens from, and exactly what the screenshot harness captures.
export const STATIC_DUST_OPACITY = 0.519;

export type AtlasWorldSceneProps = {
  visibleNodes: AtlasGraphNode[];
  relationWebs: { cluster: AtlasCluster; path: string }[];
  guideRoutes: { routeId: string; path: string }[];
  personalPath: string;
  personalBeads: SkPoint[];
  goldWaypoints: SkPoint[];
  tinyStarPoints: SkPoint[];
  selectedId: string;
  theme: AppTheme;
  visual: AtlasVisualTheme;
  fonts: AtlasFonts;
  thinLabels: boolean;
  semanticZoom: AtlasZoom;
};

export function AtlasWorldScene({
  visibleNodes,
  relationWebs,
  guideRoutes,
  personalPath,
  personalBeads,
  goldWaypoints,
  tinyStarPoints,
  selectedId,
  theme,
  visual,
  fonts,
  thinLabels,
  semanticZoom,
}: AtlasWorldSceneProps) {
  return (
    <Group>
      <Group opacity={STATIC_DUST_OPACITY}>
        <Points points={tinyStarPoints} mode="points" strokeWidth={1.3} strokeCap="round" color={visual.starTiny} />
        {atlasStars.medium.map((star, index) => (
          <Group key={`star-m-${index}`} opacity={star.opacity}>
            <Circle cx={star.x} cy={star.y} r={star.radius * 2.4} color={visual.starMedium} opacity={0.22} />
            <Circle cx={star.x} cy={star.y} r={star.radius} color={visual.starMedium} />
          </Group>
        ))}
        {atlasStars.flare.map((star, index) => (
          <Group key={`star-f-${index}`} opacity={star.opacity}>
            <Circle cx={star.x} cy={star.y} r={star.radius * 0.45} color={visual.starFlare} opacity={0.28} />
            <Path path={sparklePath(star.x, star.y, star.radius, 0.08)} color={visual.starFlare} />
            <Circle cx={star.x} cy={star.y} r={Math.max(1.1, star.radius * 0.14)} color={visual.starFlare} />
          </Group>
        ))}
      </Group>

      {atlasRegions.map((region) => {
        const domain = domainVisuals[region.id];
        const hub = atlasNodeIndex.get(region.id);
        const cx = hub?.x ?? region.labelX;
        const cy = hub?.y ?? region.labelY;
        return (
          <Circle key={`field-${region.id}`} cx={cx} cy={cy} r={250}>
            <RadialGradient c={vec(cx, cy)} r={250} colors={[domain.nebula, withAlpha(domain.nebula, 0)]} />
          </Circle>
        );
      })}
      {atlasRegions.map((region) => (
        <SpacedText
          key={`label-${region.id}`}
          x={region.labelX}
          y={region.labelY}
          text={region.label}
          font={fonts.region}
          color={domainVisuals[region.id].core}
          halo={visual.regionLabelHalo}
        />
      ))}

      {relationWebs.map(({ cluster, path }) => (
        <Group key={`web-${cluster}`}>
          <Path path={path} color={domainVisuals[cluster].web} style="stroke" strokeWidth={4.6} opacity={0.16} />
          <Path path={path} color={domainVisuals[cluster].web} style="stroke" strokeWidth={2.2} opacity={0.28} />
          <Path path={path} color={domainVisuals[cluster].web} style="stroke" strokeWidth={0.9} opacity={0.75} />
        </Group>
      ))}
      {guideRoutes.map(({ routeId, path }) => {
        const color = visual.navigatorPalette[routeId] ?? visual.navigatorFallback;
        return (
          <Group key={`guide-${routeId}`}>
            <Path path={path} color={color} style="stroke" strokeWidth={5} opacity={0.12} />
            <Path path={path} color={color} style="stroke" strokeWidth={2.6} opacity={0.22} />
            <Path path={path} color={color} style="stroke" strokeWidth={1.5} opacity={0.85}>
              <DashPathEffect intervals={[7, 6]} />
            </Path>
          </Group>
        );
      })}
      {personalPath !== '' && (
        <Group>
          {/* Stacked plain strokes fake the old two mask-blur glow passes
              (sigma 12 + 5 over a near-world-sized path, every frame). */}
          <Path path={personalPath} color={visual.routeBloom} style="stroke" strokeWidth={24} strokeCap="round" opacity={0.14} />
          <Path path={personalPath} color={visual.routeBloom} style="stroke" strokeWidth={15} strokeCap="round" opacity={0.22} />
          <Path path={personalPath} color={visual.routeSoft} style="stroke" strokeWidth={8} strokeCap="round" opacity={0.4} />
          <Path path={personalPath} color={visual.routeSoft} style="stroke" strokeWidth={5} strokeCap="round" opacity={0.65} />
          <Path path={personalPath} color={visual.routeCore} style="stroke" strokeWidth={3} strokeCap="round" />
          {personalBeads.map((bead, index) => (
            <Group key={`bead-${index}`}>
              <Circle cx={bead.x} cy={bead.y} r={5.5} color={visual.routeCore} opacity={0.3} />
              <Circle cx={bead.x} cy={bead.y} r={3.6} color={visual.routeCore} opacity={0.55} />
              <Circle cx={bead.x} cy={bead.y} r={2} color={visual.routeCore} />
            </Group>
          ))}
          {goldWaypoints.map((point, index) => (
            <Group key={`waypoint-${index}`}>
              <Circle cx={point.x} cy={point.y} r={10}>
                <RadialGradient c={vec(point.x, point.y)} r={10} colors={[withAlpha(visual.waypoint, 0.55), withAlpha(visual.waypoint, 0)]} positions={[0.35, 1]} />
              </Circle>
              <Path path={starPath(point.x, point.y, 4, 7.5, 3)} color={visual.waypoint} />
            </Group>
          ))}
        </Group>
      )}

      {visibleNodes.map((node) => (
        <AtlasNodeView
          key={node.id}
          node={node}
          selected={selectedId === node.id}
          theme={theme}
          visual={visual}
          fonts={fonts}
          thinLabels={thinLabels}
          semanticZoom={semanticZoom}
        />
      ))}
    </Group>
  );
}
