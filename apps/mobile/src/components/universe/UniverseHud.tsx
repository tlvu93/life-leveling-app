import { BadgeCheck, Check, Compass, Layers3, Map, Minus, Plus, Route, Star, Users, X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/IconButton';
import { progressLabels } from '@/components/roadmap/pieces';
import type { UniverseNodeVm } from '@/domain/roadmap/selectors/universe';
import { useLifeTheme } from '@/state/theme-context';
import type { UniverseCamera, UniverseZoom } from './use-universe-camera';
import { domainVisual } from './universe-visuals';

const VERIFIED_BLUE = '#3B82F6';

export type UniverseRouteStep = { label: string; done: boolean };

export type UniverseHudProps = {
  camera: UniverseCamera;
  tier: UniverseZoom;
  tierLabel: string;
  selected: UniverseNodeVm | null;
  description: string;
  onPaths: { id: string; title: string }[];
  routeSteps: UniverseRouteStep[];
  journeyTitle: string | null;
  showRoute: boolean;
  panelOpen: boolean;
  onToggleRoute: () => void;
  onOpenPanel: () => void;
  onClosePanel: () => void;
  onOpenPath: (pathId: string) => void;
  onOpenStep: (() => void) | null;
};

/**
 * The Atlas HUD vocabulary — tool rail, zoom badge, destination inspector —
 * over catalog content. Layout and styling deliberately mirror AtlasHud so the
 * two maps feel like one product.
 */
export function UniverseHud({
  camera, tier, tierLabel, selected, description, onPaths, routeSteps, journeyTitle,
  showRoute, panelOpen, onToggleRoute, onOpenPanel, onClosePanel, onOpenPath, onOpenStep,
}: UniverseHudProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { theme } = useLifeTheme();
  const compact = width < 720;
  const wide = width >= 1100;
  const short = height < 560;
  const toolDimension = compact ? 38 : 42;
  const showSideCards = wide && height >= 640;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {!wide && (
        <View pointerEvents="none" style={[styles.titleBlock, { top: insets.top + (compact ? 74 : 100), left: compact ? 12 : 18 }]}>
          <Text style={[styles.eyebrow, { color: theme.accent }]}>{`THE SHARED UNIVERSE / ${tierLabel.toUpperCase()}`}</Text>
          <Text style={[styles.mapTitle, { color: theme.ink }]}>LIVING UNIVERSE</Text>
        </View>
      )}

      <View
        testID="universe-tool-rail"
        style={[styles.toolRail, {
          top: insets.top + (compact ? 118 : wide ? 120 : 172),
          left: compact ? 12 : wide ? 24 : 18,
          borderColor: theme.panelBorder,
          backgroundColor: theme.panel,
        }]}>
        <IconButton dimension={toolDimension} icon={Map} label="Fit the whole Universe" onPress={camera.fitWorld} />
        <IconButton dimension={toolDimension} icon={Plus} label="Zoom in" onPress={camera.zoomIn} />
        <IconButton dimension={toolDimension} icon={Minus} label="Zoom out" onPress={camera.zoomOut} />
        <IconButton dimension={toolDimension} icon={Route} label={showRoute ? 'Hide your Journey route' : 'Show your Journey route'} active={showRoute} onPress={onToggleRoute} />
        <IconButton dimension={toolDimension} icon={Layers3} label="Show selected concept details" active={panelOpen} onPress={onOpenPanel} />
        <IconButton
          dimension={toolDimension}
          icon={Compass}
          label="Focus the selected concept"
          onPress={() => selected && camera.focusNode(selected.id)}
        />
      </View>

      {!panelOpen && (
        <View pointerEvents="none" style={[styles.zoomBadge, { bottom: 108 + insets.bottom, borderColor: theme.panelBorder, backgroundColor: theme.panel }]}>
          <Text style={[styles.zoomBadgeLabel, { color: theme.inkSecondary }]}>ZOOM</Text>
          <Text testID="universe-tier" style={[styles.zoomBadgeValue, { color: theme.ink }]}>{tierLabel}</Text>
        </View>
      )}
      {panelOpen && <Text testID="universe-tier" style={styles.hiddenTier}>{tierLabel}</Text>}

      {panelOpen && selected && (
        <View
          testID="universe-inspector"
          style={[
            styles.inspector,
            compact
              ? { right: 10, bottom: 108 + insets.bottom, left: 10 }
              // When the Navigator card is on screen the inspector sits below
              // it, exactly as the Atlas stacks them.
              : { top: insets.top + (showSideCards ? 250 : wide ? 95 : 88), right: wide ? 24 : 32, width: wide ? 310 : 280 },
            short && styles.inspectorShort,
            { borderColor: theme.panelBorder, backgroundColor: theme.panel },
          ]}>
          <View style={styles.inspectorHeading}>
            <Text style={[styles.inspectorType, { color: domainVisual(selected.domainId).core }]}>
              {`${selected.type.toUpperCase()} / ${selected.domainId.toUpperCase()}`}
            </Text>
            <Pressable accessibilityLabel="Close concept details" accessibilityRole="button" hitSlop={8} onPress={onClosePanel} testID="inspector-close">
              <X color={theme.ink} size={18} />
            </Pressable>
          </View>

          <View style={styles.titleRow}>
            <Text numberOfLines={2} testID="inspector-title" style={[styles.inspectorTitle, { color: theme.ink }]}>{selected.title}</Text>
            {!compact && (
              <View style={[styles.starChip, { backgroundColor: theme.accentSoft }]}>
                <Star color={theme.accent} size={19} />
              </View>
            )}
          </View>

          {description.length > 0 && !short && (
            <Text numberOfLines={compact ? 2 : 4} style={[styles.inspectorDescription, { color: theme.inkSecondary }]}>{description}</Text>
          )}

          <View style={[styles.meta, { borderTopColor: theme.panelBorder }]}>
            <Users color={theme.inkSecondary} size={15} strokeWidth={2} />
            <Text numberOfLines={1} style={[styles.metaText, { color: theme.inkSecondary }]}>
              {onPaths.length > 1
                ? `Shared by ${onPaths.length} Paths`
                : onPaths[0] ? `On ${onPaths[0].title}` : 'Not on a Path yet'}
            </Text>
          </View>

          {selected.progressState && (
            <Text testID="inspector-progress" style={[styles.progress, { color: theme.accent }]}>
              {progressLabels[selected.progressState]}
            </Text>
          )}

          <View style={styles.actions}>
            {onPaths[0] && (
              <Pressable
                accessibilityRole="button"
                testID="inspector-open-path"
                onPress={() => onOpenPath(onPaths[0].id)}
                style={({ pressed }) => [styles.primaryAction, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
                <Text numberOfLines={1} style={styles.primaryActionText}>{`Explore ${onPaths[0].title}`}</Text>
              </Pressable>
            )}
            {onOpenStep && (
              <Pressable
                accessibilityRole="button"
                testID="inspector-open-step"
                onPress={onOpenStep}
                style={({ pressed }) => [styles.secondaryAction, { borderColor: theme.accent }, pressed && styles.pressed]}>
                <Text style={[styles.secondaryActionText, { color: theme.accent }]}>Open it in your Journey</Text>
              </Pressable>
            )}
          </View>

          {wide && routeSteps.length > 0 && (
            <View style={styles.routeSteps}>
              <Text style={[styles.routeLabel, { color: theme.accent }]}>ON THIS ROUTE</Text>
              {routeSteps.map((step) => (
                <View key={step.label} style={styles.routeStep}>
                  {step.done ? (
                    <View style={[styles.check, { backgroundColor: theme.success }]}>
                      <Check color="#FFFFFF" size={10} strokeWidth={3.4} />
                    </View>
                  ) : (
                    <View style={[styles.check, styles.checkPending, { borderColor: theme.accent }]} />
                  )}
                  <Text numberOfLines={1} style={[styles.routeStepText, { color: step.done ? theme.ink : theme.accent }]}>{step.label}</Text>
                </View>
              ))}
              {journeyTitle && (
                <View style={[styles.navigator, { borderTopColor: theme.panelBorder }]}>
                  <View style={styles.navigatorRow}>
                    <Text numberOfLines={1} style={[styles.navigatorTitle, { color: theme.ink }]}>{journeyTitle}</Text>
                    <BadgeCheck color="#FFFFFF" fill={VERIFIED_BLUE} size={16} />
                  </View>
                  <Text style={[styles.navigatorText, { color: theme.inkSecondary }]}>Your own route through this Path</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  titleBlock: { position: 'absolute', zIndex: 15 },
  eyebrow: { fontSize: 8, fontWeight: '800' },
  mapTitle: { marginTop: 3, fontSize: 28, fontWeight: '900', lineHeight: 29 },
  toolRail: { position: 'absolute', zIndex: 30, gap: 6, borderWidth: 1, borderRadius: 14, padding: 6 },
  zoomBadge: { position: 'absolute', zIndex: 20, left: 24, alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  zoomBadgeLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  zoomBadgeValue: { fontSize: 12, fontWeight: '800' },
  hiddenTier: { position: 'absolute', opacity: 0, top: 0, left: 0, fontSize: 1 },
  inspector: {
    position: 'absolute',
    zIndex: 35,
    gap: 9,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#2A2C55',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  inspectorShort: { gap: 6, padding: 12 },
  inspectorHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  inspectorType: { flex: 1, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  inspectorTitle: { flex: 1, fontSize: 21, fontWeight: '900', lineHeight: 25 },
  starChip: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  inspectorDescription: { fontSize: 12, lineHeight: 18 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, paddingTop: 9 },
  metaText: { flex: 1, fontSize: 11, fontWeight: '600' },
  progress: { fontSize: 11, fontWeight: '800' },
  actions: { gap: 8 },
  primaryAction: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingHorizontal: 14 },
  primaryActionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  secondaryAction: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14 },
  secondaryActionText: { fontSize: 13, fontWeight: '800' },
  routeSteps: { gap: 7 },
  routeLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  routeStep: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  check: { width: 17, height: 17, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  checkPending: { borderWidth: 1.6 },
  routeStepText: { flex: 1, fontSize: 12, fontWeight: '600' },
  navigator: { gap: 3, borderTopWidth: 1, paddingTop: 9 },
  navigatorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  navigatorTitle: { flex: 1, fontSize: 12, fontWeight: '800' },
  navigatorText: { fontSize: 10 },
  pressed: { opacity: 0.62 },
});
