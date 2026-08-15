import { BadgeCheck, Check, CircleCheck, Compass, Layers3, Map, Minus, Plus, Route, Star, Users, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { atlasZoomLabels, type AtlasGraphNode, type AtlasZoom } from '@/domain/atlas';
import { useLifeTheme } from '@/state/theme-context';
import { IconButton } from '../IconButton';
import { AtlasLegend } from './AtlasLegend';
import { NavigatorRoutesCard } from './NavigatorRoutesCard';
import type { AtlasCamera } from './use-atlas-camera';

const VERIFIED_BLUE = '#3B7DE8';

type AtlasHudProps = {
  camera: AtlasCamera;
  selectedNode: AtlasGraphNode;
  semanticZoom: AtlasZoom;
  showGuide: boolean;
  panelOpen: boolean;
  pathStarted: boolean;
  questStatus: 'not-started' | 'active' | 'completed' | 'stopped';
  recommendedNodeId: string | null;
  onToggleGuide: () => void;
  onOpenPanel: () => void;
  onClosePanel: () => void;
};

const kindEyebrow: Record<AtlasGraphNode['kind'], string> = {
  interest: 'CONSTELLATION',
  skill: 'SKILL',
  path: 'DESTINATION',
  quest: 'QUEST',
  milestone: 'MILESTONE',
  nearby: 'NEARBY PATH',
};

export function AtlasHud({ camera, selectedNode, semanticZoom, showGuide, panelOpen, pathStarted, questStatus, recommendedNodeId, onToggleGuide, onOpenPanel, onClosePanel }: AtlasHudProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { theme } = useLifeTheme();
  const router = useRouter();
  const compact = width < 720;
  const wide = width >= 1100;
  const constrainedHeight = height < 680;
  const short = height < 520 && width > height;
  const compactNavigation = compact || short;
  const toolDimension = compact ? 37 : 42;
  const title = selectedNode.label.replace('|', ' ');
  const isFirstQuest = selectedNode.id === 'make-track-visible';
  const questCompleted = questStatus === 'completed';
  const questStopped = questStatus === 'stopped';
  const questResolved = questCompleted || questStopped;
  const isRecommendedUnlock = questResolved && selectedNode.id === recommendedNodeId;
  const primaryLabel = selectedNode.kind === 'path'
    ? pathStarted ? 'View Active Path' : 'Explore Path'
    : isFirstQuest
      ? questCompleted ? 'View Reflection' : questStopped ? 'View Attempt' : 'Open Quest'
      : isRecommendedUnlock ? 'View Updated Paths' : 'Explore Connection';
  const openPrimary = () => {
    if (selectedNode.kind === 'path') router.navigate('/path');
    else if (isFirstQuest) router.navigate('/quest');
    else router.navigate('/discover');
  };
  const routeSteps = [
    { label: 'Choose a track', done: pathStarted },
    { label: 'Try reactive visuals', done: pathStarted },
    { label: `Make one track visible${questStopped ? ' · attempted' : questCompleted ? ' · completed' : ''}`, done: questCompleted },
    { label: questStopped ? 'Explore the adjacent experiment' : 'Perform a 10-minute audiovisual set', done: false },
  ];

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {!constrainedHeight && !wide && <View pointerEvents="none" style={[styles.titleBlock, { top: insets.top + (compact ? 74 : 100), left: compact ? 12 : 18 }]}>
        <Text style={[styles.eyebrow, { color: theme.accent }]}>YOUR PERSONAL WORLD / {atlasZoomLabels[semanticZoom].toUpperCase()}</Text>
        <Text style={[styles.atlasTitle, { color: theme.ink }]}>LIFE ATLAS</Text>
        {!compact && <Text style={[styles.atlasSubtitle, { color: theme.inkSecondary }]}>New route revealed from lived evidence</Text>}
      </View>}

      <View testID="atlas-tool-rail" style={[styles.toolRail, constrainedHeight && styles.toolRailHorizontal, { top: insets.top + (constrainedHeight ? 70 : compact ? 124 : wide ? 120 : 182), left: compact ? 12 : wide ? 24 : 18, borderColor: theme.panelBorder, backgroundColor: theme.panel }]}>
        <IconButton dimension={toolDimension} icon={Map} label="Fit world" onPress={camera.fitWorld} />
        <IconButton dimension={toolDimension} icon={Plus} label="Zoom in" onPress={camera.zoomIn} />
        <IconButton dimension={toolDimension} icon={Minus} label="Zoom out" onPress={camera.zoomOut} />
        <IconButton dimension={toolDimension} icon={Route} label={showGuide ? 'Hide community route' : 'Show community route'} active={showGuide} onPress={onToggleGuide} />
        <IconButton dimension={toolDimension} icon={Layers3} label="Show selected node details" active={panelOpen} onPress={onOpenPanel} />
        <IconButton dimension={toolDimension} icon={Compass} label="Focus selected node" onPress={() => camera.focusNode(selectedNode.id)} />
      </View>

      {wide && !compactNavigation && <AtlasLegend />}
      {wide && !compactNavigation && <NavigatorRoutesCard top={insets.top + 78} />}

      {!panelOpen && <View pointerEvents="none" style={[styles.zoomBadge, { bottom: (compactNavigation ? 76 : 100) + insets.bottom, borderColor: theme.panelBorder, backgroundColor: theme.panel }]}>
        <Text style={[styles.zoomBadgeLabel, { color: theme.inkSecondary }]}>ZOOM</Text>
        <Text style={[styles.zoomBadgeValue, { color: theme.ink }]}>{atlasZoomLabels[semanticZoom]}</Text>
      </View>}

      {panelOpen && (
        <View style={[
          styles.inspector,
          compact && styles.inspectorCompact,
          short && styles.inspectorShort,
          short
            ? { top: insets.top + 70, right: 10, width: Math.min(310, width - 250) }
            : compact
              ? { right: 10, bottom: 76 + insets.bottom, left: 10 }
              : { top: insets.top + (wide ? 244 : 88), right: wide ? 24 : 32, width: wide ? 310 : 280 },
          { borderColor: theme.panelBorder, backgroundColor: theme.panel },
        ]} testID="atlas-inspector">
          <View style={styles.inspectorHeading}>
            <Text style={[styles.inspectorType, { color: theme.accent }]}>{kindEyebrow[selectedNode.kind]}</Text>
            <Pressable accessibilityLabel="Close node details" accessibilityRole="button" hitSlop={8} onPress={onClosePanel}>
              <X color={theme.ink} size={18} />
            </Pressable>
          </View>
          <View style={styles.titleRow}>
            <Text numberOfLines={2} style={[styles.inspectorTitle, compact && styles.inspectorTitleCompact, short && styles.inspectorTitleShort, { color: theme.ink }]}>{title}</Text>
            {!compactNavigation && (
              <View style={[styles.starChip, { backgroundColor: theme.accentSoft }]}>
                <Star color={theme.accent} size={19} />
              </View>
            )}
          </View>
          {!compactNavigation && <Text style={[styles.inspectorDescription, { color: theme.inkSecondary }]}>{selectedNode.description ?? `${title} connects this region to nearby possibilities.`}</Text>}
          {!short && (
            <View style={[styles.meta, compact && styles.metaCompact, { borderTopColor: theme.panelBorder }]}>
              <Users color={theme.inkSecondary} size={15} strokeWidth={2} />
              <Text style={[styles.metaText, { color: theme.inkSecondary }]}>
                {selectedNode.kind === 'path' ? '214 community attempts' : selectedNode.id === recommendedNodeId ? 'Unlocked by your reflection' : 'Personal connection'}
              </Text>
            </View>
          )}
          <View style={[styles.actions, compact && styles.actionsCompact, short && styles.actionsShort]}>
            <Pressable
              accessibilityRole="button"
              onPress={openPrimary}
              style={({ pressed }) => [styles.primaryAction, compact && styles.actionCompact, short && styles.actionShort, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
              <Text style={styles.primaryActionText}>{primaryLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.navigate('/community')}
              style={({ pressed }) => [styles.secondaryAction, compact && styles.actionCompact, short && styles.actionShort, { borderColor: theme.accent }, pressed && styles.pressed]}>
              <Text style={[styles.secondaryActionText, { color: theme.accent }]}>View Guides</Text>
            </Pressable>
          </View>
          {wide && (
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
                  <Text style={[styles.routeStepText, { color: step.done ? theme.ink : theme.accent }]}>{step.label}</Text>
                </View>
              ))}
              <View style={[styles.navigator, { borderTopColor: theme.panelBorder }]}>
                <View style={styles.navigatorRow}>
                  <Text style={[styles.navigatorTitle, { color: theme.ink }]}>Navigator Route: Sound to Screen</Text>
                  <BadgeCheck color="#FFFFFF" fill={VERIFIED_BLUE} size={16} />
                </View>
                <View style={styles.navigatorRow}>
                  <Text style={[styles.navigatorText, { color: theme.inkSecondary }]}>Validated by 57 experienced explorers</Text>
                  <CircleCheck color={theme.success} size={14} strokeWidth={2.2} />
                </View>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  titleBlock: { position: 'absolute', zIndex: 15 },
  eyebrow: { fontSize: 8, fontWeight: '800', letterSpacing: 0 },
  atlasTitle: { marginTop: 3, fontSize: 28, fontWeight: '900', lineHeight: 29, letterSpacing: 0 },
  atlasSubtitle: { marginTop: 3, fontSize: 9 },
  toolRail: {
    position: 'absolute',
    zIndex: 25,
    gap: 4,
    borderWidth: 1,
    borderRadius: 14,
    padding: 5,
    shadowColor: '#2A2C55',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  toolRailHorizontal: { flexDirection: 'row' },
  zoomBadge: { position: 'absolute', zIndex: 20, left: 12, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  zoomBadgeLabel: { fontSize: 7, fontWeight: '800' },
  zoomBadgeValue: { fontSize: 9, fontWeight: '800' },
  inspector: {
    position: 'absolute',
    zIndex: 45,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    shadowColor: '#2A2C55',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  inspectorCompact: { padding: 12 },
  inspectorShort: { padding: 10 },
  inspectorHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inspectorType: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8 },
  inspectorTitle: { flex: 1, fontSize: 22, fontWeight: '800', lineHeight: 26, letterSpacing: 0 },
  inspectorTitleCompact: { marginTop: 0, fontSize: 19, lineHeight: 21 },
  inspectorTitleShort: { marginTop: 0, fontSize: 19, lineHeight: 21 },
  starChip: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  inspectorDescription: { marginTop: 8, fontSize: 12, lineHeight: 17 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, borderTopWidth: 1, paddingTop: 12 },
  metaCompact: { marginTop: 8, paddingTop: 8 },
  metaText: { fontSize: 11, fontWeight: '600' },
  actions: { gap: 8, marginTop: 14 },
  actionsCompact: { marginTop: 10, flexDirection: 'row' },
  actionsShort: { marginTop: 8, flexDirection: 'row' },
  primaryAction: { minHeight: 42, flex: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 9, paddingHorizontal: 10 },
  primaryActionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  secondaryAction: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.2, borderRadius: 9, paddingHorizontal: 12 },
  actionShort: { minHeight: 36, flex: 1 },
  actionCompact: { minHeight: 38, flex: 1 },
  secondaryActionText: { fontSize: 13, fontWeight: '700' },
  routeSteps: { gap: 9, marginTop: 16 },
  routeLabel: { marginBottom: 2, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  routeStep: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  check: { width: 17, height: 17, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  checkPending: { borderWidth: 1.6 },
  routeStepText: { flex: 1, fontSize: 11, fontWeight: '600' },
  navigator: { gap: 6, marginTop: 10, borderTopWidth: 1, paddingTop: 12 },
  navigatorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  navigatorTitle: { flex: 1, fontSize: 11, fontWeight: '800' },
  navigatorText: { flex: 1, fontSize: 10 },
  pressed: { opacity: 0.7 },
});
