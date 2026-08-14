import { BookOpen, Check, Compass, FileCheck2, Layers3, Map, Minus, Plus, Route, Star, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { atlasZoomLabels, type AtlasGraphNode, type AtlasZoom } from '@/domain/atlas';
import { useLifeTheme } from '@/state/theme-context';
import { IconButton } from '../IconButton';
import type { AtlasCamera } from './use-atlas-camera';

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
    ? pathStarted ? 'VIEW ACTIVE PATH' : 'EXPLORE PATH'
    : isFirstQuest
      ? questCompleted ? 'VIEW REFLECTION' : questStopped ? 'VIEW ATTEMPT' : 'OPEN QUEST'
      : isRecommendedUnlock ? 'VIEW UPDATED PATHS' : 'EXPLORE CONNECTION';
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
      {!constrainedHeight && <View pointerEvents="none" style={[styles.titleBlock, { top: insets.top + (compact ? 74 : wide ? 102 : 100), left: compact ? 12 : wide ? 24 : 18 }]}>
        <Text style={[styles.eyebrow, { color: theme.green }]}>YOUR PERSONAL WORLD / {atlasZoomLabels[semanticZoom].toUpperCase()}</Text>
        <Text style={[styles.atlasTitle, { color: theme.ink }]}>LIFE ATLAS</Text>
        {!compact && <Text style={[styles.atlasSubtitle, { color: theme.inkSecondary }]}>New route revealed from lived evidence</Text>}
      </View>}

      <View testID="atlas-tool-rail" style={[styles.toolRail, constrainedHeight && styles.toolRailHorizontal, { top: insets.top + (constrainedHeight ? 70 : compact ? 124 : wide ? 196 : 182), left: compact ? 12 : wide ? 24 : 18, borderColor: theme.borderSoft, backgroundColor: theme.surface }]}>
        <IconButton dimension={toolDimension} icon={Map} label="Fit world" onPress={camera.fitWorld} />
        <IconButton dimension={toolDimension} icon={Plus} label="Zoom in" onPress={camera.zoomIn} />
        <IconButton dimension={toolDimension} icon={Minus} label="Zoom out" onPress={camera.zoomOut} />
        <IconButton dimension={toolDimension} icon={Route} label={showGuide ? 'Hide community route' : 'Show community route'} active={showGuide} onPress={onToggleGuide} />
        <IconButton dimension={toolDimension} icon={Layers3} label="Show selected node details" active={panelOpen} onPress={onOpenPanel} />
        <IconButton dimension={toolDimension} icon={Compass} label="Focus selected node" onPress={() => camera.focusNode(selectedNode.id)} />
      </View>

      {!panelOpen && <View pointerEvents="none" style={[styles.zoomBadge, { bottom: (compactNavigation ? 76 : 88) + insets.bottom, borderColor: theme.borderSoft, backgroundColor: theme.surface }]}>
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
              : { top: insets.top + (wide ? 95 : 88), right: wide ? 24 : 32, width: wide ? 310 : 280 },
          { borderColor: theme.borderSoft, backgroundColor: theme.surface },
        ]} testID="atlas-inspector">
          <View style={styles.inspectorHeading}>
            <Text style={[styles.inspectorType, { color: theme.green }]}>{selectedNode.kind === 'nearby' ? 'NEARBY PATH' : selectedNode.kind.toUpperCase()}</Text>
            <View style={styles.inspectorControls}>
              <Star color={theme.green} size={19} />
              <Pressable accessibilityLabel="Close node details" accessibilityRole="button" hitSlop={8} onPress={onClosePanel}>
                <X color={theme.ink} size={18} />
              </Pressable>
            </View>
          </View>
          <Text numberOfLines={2} style={[styles.inspectorTitle, compact && styles.inspectorTitleCompact, short && styles.inspectorTitleShort, { color: theme.ink }]}>{title}</Text>
          {!compactNavigation && <Text style={[styles.inspectorDescription, { color: theme.inkSecondary }]}>{selectedNode.description ?? `${title} connects this region to nearby possibilities.`}</Text>}
          {!short && <View style={[styles.meta, compact && styles.metaCompact, { borderTopColor: theme.borderSoft, borderBottomColor: theme.borderSoft }]}>
            <View style={[styles.statusDot, { backgroundColor: selectedNode.status === 'completed' ? theme.success : theme.coral }]} />
            <Text style={[styles.metaText, { color: theme.inkSecondary }]}>{selectedNode.status ?? 'Connected'}</Text>
            <Text style={[styles.metaText, { color: theme.inkSecondary }]}>{selectedNode.kind === 'path' ? '214 verified attempts' : selectedNode.id === recommendedNodeId ? 'unlocked by your reflection' : 'personal connection'}</Text>
          </View>}
          {isFirstQuest && questCompleted && wide && (
            <View style={[styles.artifact, { borderColor: `${theme.success}55`, backgroundColor: `${theme.success}12` }]}>
              <FileCheck2 color={theme.success} size={14} />
              <Text style={[styles.artifactText, { color: theme.success }]}>PRIVATE EVIDENCE ATTACHED</Text>
            </View>
          )}
          <View style={[styles.actions, compact && styles.actionsCompact, short && styles.actionsShort]}>
            <Pressable
              accessibilityRole="button"
              onPress={openPrimary}
              style={({ pressed }) => [styles.primaryAction, compact && styles.actionCompact, short && styles.actionShort, { backgroundColor: theme.green }, pressed && styles.pressed]}>
              <Text style={styles.primaryActionText}>{primaryLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.navigate('/community')}
              style={({ pressed }) => [styles.secondaryAction, compact && styles.actionCompact, short && styles.actionShort, { borderColor: theme.border }, pressed && styles.pressed]}>
              <BookOpen color={theme.ink} size={16} />
              <Text style={[styles.secondaryActionText, { color: theme.ink }]}>GUIDES</Text>
            </Pressable>
          </View>
          {wide && (
            <View style={styles.routeSteps}>
              <Text style={[styles.routeLabel, { color: theme.inkSecondary }]}>ON THIS ROUTE</Text>
              {routeSteps.map((step, index) => (
                <View key={step.label} style={styles.routeStep}>
                  <View style={[
                    styles.check,
                    {
                      borderColor: step.done ? theme.success : theme.border,
                      backgroundColor: step.done ? `${theme.success}18` : 'transparent',
                    },
                  ]}>
                    {step.done && <Check color={theme.success} size={9} strokeWidth={3} />}
                  </View>
                  <Text style={[styles.routeStepText, { color: index === 2 && pathStarted && !questResolved ? theme.ink : theme.inkSecondary }]}>{step.label}</Text>
                </View>
              ))}
              <View style={[styles.navigator, { borderTopColor: theme.borderSoft, backgroundColor: theme.surfaceMuted }]}>
                <Text style={[styles.navigatorLabel, { color: theme.inkSecondary }]}>NAVIGATOR ROUTE</Text>
                <Text style={[styles.navigatorTitle, { color: theme.ink }]}>Sound to Screen  ◈</Text>
                <Text style={[styles.navigatorText, { color: theme.inkSecondary }]}>Verified by editors and 57 experienced explorers</Text>
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
  toolRail: { position: 'absolute', zIndex: 25, gap: 0, borderWidth: 1, borderRadius: 0, overflow: 'hidden' },
  toolRailHorizontal: { flexDirection: 'row' },
  zoomBadge: { position: 'absolute', zIndex: 20, left: 12, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 6 },
  zoomBadgeLabel: { fontSize: 7, fontWeight: '800' },
  zoomBadgeValue: { fontSize: 9, fontWeight: '800' },
  inspector: { position: 'absolute', zIndex: 45, borderWidth: 1, borderRadius: 7, padding: 16, shadowColor: '#1E2B23', shadowOpacity: 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  inspectorCompact: { padding: 12 },
  inspectorShort: { padding: 10 },
  inspectorHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inspectorType: { fontSize: 8, fontWeight: '900', letterSpacing: 0 },
  inspectorControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inspectorTitle: { marginTop: 10, fontSize: 23, fontWeight: '900', lineHeight: 23, letterSpacing: 0, textTransform: 'uppercase' },
  inspectorTitleCompact: { marginTop: 6, fontSize: 19, lineHeight: 20 },
  inspectorTitleShort: { marginTop: 4, fontSize: 19, lineHeight: 20 },
  inspectorDescription: { marginTop: 10, fontSize: 10, lineHeight: 15 },
  meta: { height: 36, flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12, borderTopWidth: 1, borderBottomWidth: 1 },
  metaCompact: { height: 30, marginTop: 8 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  metaText: { marginRight: 8, fontSize: 8, textTransform: 'capitalize' },
  artifact: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10, borderWidth: 1, paddingHorizontal: 10 },
  artifactText: { fontSize: 8, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionsCompact: { marginTop: 8 },
  actionsShort: { marginTop: 8 },
  primaryAction: { minHeight: 42, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 5, paddingHorizontal: 10 },
  primaryActionText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  secondaryAction: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 5, paddingHorizontal: 12 },
  actionShort: { minHeight: 36 },
  actionCompact: { minHeight: 38 },
  secondaryActionText: { fontSize: 9, fontWeight: '900' },
  routeSteps: { gap: 9, marginTop: 16 },
  routeLabel: { marginBottom: 2, fontSize: 7, fontWeight: '900' },
  routeStep: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  check: { width: 15, height: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 8 },
  routeStepText: { fontSize: 9 },
  navigator: { gap: 3, marginTop: 8, marginRight: -16, marginBottom: -16, marginLeft: -16, borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  navigatorLabel: { fontSize: 7, fontWeight: '900' },
  navigatorTitle: { fontSize: 9, fontWeight: '900' },
  navigatorText: { fontSize: 7, lineHeight: 11 },
  pressed: { opacity: 0.7 },
});
