import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, BadgeCheck, Check, Clock3, Eye, EyeOff, Lock, Plus, Route, Send, Share2, ShieldCheck, Users, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { ScreenScaffold } from '@/components/ScreenScaffold';
import { parseSharedGuide, recommendGuides, serializeSharedGuide, type CuratedGuide, type GuideDecision, type UserGuide } from '@/domain/guides';
import { useJourney } from '@/state/journey-context';
import { useLifeTheme } from '@/state/theme-context';

const emptySteps = ['', '', ''];

export default function CommunityScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const { theme } = useLifeTheme();
  const { guide: sharedGuide } = useLocalSearchParams<{ guide?: string }>();
  const { state, setGuideDecision, adoptGuide, addUserGuide, setUserGuideVisibility } = useJourney();
  const router = useRouter();
  const guides = useMemo(() => recommendGuides(state.profile), [state.profile]);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [outcome, setOutcome] = useState('');
  const [steps, setSteps] = useState(emptySteps);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const importedGuide = useMemo(() => sharedGuide ? parseSharedGuide(sharedGuide) : null, [sharedGuide]);
  const importNotice = sharedGuide
    ? importedGuide
      ? `Imported “${importedGuide.title}” as a private route. Review it before using or resharing it.`
      : 'This unlisted route link is incomplete or no longer valid.'
    : null;

  useEffect(() => {
    if (importedGuide) addUserGuide(importedGuide);
  }, [addUserGuide, importedGuide]);

  const usableSteps = steps.map((step) => step.trim()).filter(Boolean);
  const canCreate = Boolean(title.trim() && outcome.trim() && usableSteps.length >= 2);

  const createGuide = () => {
    if (!canCreate) return;
    addUserGuide({
      id: `route-${Date.now().toString(36)}`,
      title: title.trim().slice(0, 80),
      outcome: outcome.trim().slice(0, 180),
      steps: usableSteps.slice(0, 6),
      visibility: 'private',
      source: 'created',
      createdAt: new Date().toISOString(),
    });
    setTitle('');
    setOutcome('');
    setSteps(emptySteps);
    setCreatorOpen(false);
  };

  const shareGuide = async (guide: UserGuide) => {
    const payload = serializeSharedGuide(guide);
    const url = Linking.createURL('/community', { queryParams: { guide: payload } });
    try {
      await Share.share({ title: guide.title, message: `${guide.title}\n${guide.outcome}\n\nOpen this unlisted Life Leveling route:\n${url}` });
      setShareNotice(`Opened sharing for “${guide.title}”. The route data is contained in the unlisted link.`);
    } catch (error) {
      setShareNotice(error instanceof Error ? error.message : 'This device could not open its share sheet.');
    }
  };

  return (
    <ScreenScaffold>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <View style={styles.verified}><Route color={theme.violet} size={16} /><Text style={[styles.verifiedText, { color: theme.violet }]}>GUIDES / FINITE DISCOVERY DECK</Text></View>
          <Text style={[styles.title, compact && styles.titleCompact, { color: theme.ink }]}>Find a route worth trying</Text>
          <Text style={[styles.subtitle, { color: theme.inkSecondary }]}>Five contextual Guides, then the deck stops. Swipe right to save, left to pass, or inspect the evidence before choosing one real experiment.</Text>
        </View>
        <View style={[styles.sessionRule, { borderColor: theme.borderSoft, backgroundColor: theme.surfaceMuted }]}>
          <Clock3 color={theme.green} size={18} />
          <View><Text style={[styles.sessionRuleLabel, { color: theme.green }]}>SESSION CAP</Text><Text style={[styles.sessionRuleValue, { color: theme.ink }]}>5 Guides</Text></View>
        </View>
      </View>

      {importNotice && <View accessibilityRole="alert" style={[styles.notice, { borderColor: theme.violet, backgroundColor: `${theme.violet}0D` }]}><Send color={theme.violet} size={17} /><Text style={[styles.noticeText, { color: theme.ink }]}>{importNotice}</Text></View>}

      <GuideDeck
        activeGuideId={state.activeGuideId}
        decisions={state.guideDecisions}
        guides={guides}
        onDecision={setGuideDecision}
        onTry={(guide) => {
          adoptGuide(guide.id);
          router.push({ pathname: '/path', params: { id: guide.pathId } });
        }}
      />

      <View style={styles.sectionHeading}>
        <View style={styles.sectionHeadingCopy}>
          <Text style={[styles.sectionEyebrow, { color: theme.green }]}>MY ROUTES / LOCAL-FIRST</Text>
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>Build your own Guide</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.inkSecondary }]}>Draft privately, then create an unlisted link if you deliberately want to share it. Public discovery and canonical Path creation remain review-gated.</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => setCreatorOpen((current) => !current)} style={({ pressed }) => [styles.createButton, { backgroundColor: theme.green }, pressed && styles.pressed]}>
          {creatorOpen ? <X color="#FFFFFF" size={17} /> : <Plus color="#FFFFFF" size={17} />}
          <Text style={styles.createButtonText}>{creatorOpen ? 'CLOSE BUILDER' : 'NEW PRIVATE ROUTE'}</Text>
        </Pressable>
      </View>

      {creatorOpen && (
        <View style={[styles.builder, { borderColor: theme.green, backgroundColor: theme.surface }]}>
          <View style={styles.privacyLine}><Lock color={theme.green} size={15} /><Text style={[styles.privacyText, { color: theme.green }]}>PRIVATE DRAFT · SAVED ONLY ON THIS DEVICE</Text></View>
          <Text style={[styles.fieldLabel, { color: theme.ink }]}>Route name</Text>
          <TextInput accessibilityLabel="Route name" maxLength={80} onChangeText={setTitle} placeholder="Example: Learn game photography without buying gear" placeholderTextColor={theme.inkSecondary} style={[styles.input, { borderColor: theme.borderSoft, backgroundColor: theme.surfaceMuted, color: theme.ink }]} value={title} />
          <Text style={[styles.fieldLabel, { color: theme.ink }]}>Visible outcome</Text>
          <TextInput accessibilityLabel="Route outcome" maxLength={180} onChangeText={setOutcome} placeholder="What can someone make, try, or demonstrate at the end?" placeholderTextColor={theme.inkSecondary} style={[styles.input, { borderColor: theme.borderSoft, backgroundColor: theme.surfaceMuted, color: theme.ink }]} value={outcome} />
          <Text style={[styles.fieldLabel, { color: theme.ink }]}>First steps</Text>
          {steps.map((step, index) => (
            <TextInput
              accessibilityLabel={`Route step ${index + 1}`}
              key={index}
              maxLength={140}
              onChangeText={(value) => setSteps((current) => current.map((candidate, candidateIndex) => candidateIndex === index ? value : candidate))}
              placeholder={`${index + 1}. ${index === 0 ? 'Start with a low-cost attempt' : index === 1 ? 'Add one meaningful variation' : 'Reflect or reach a visible finish'}`}
              placeholderTextColor={theme.inkSecondary}
              style={[styles.input, { borderColor: theme.borderSoft, backgroundColor: theme.surfaceMuted, color: theme.ink }]}
              value={step}
            />
          ))}
          <View style={styles.builderFooter}>
            <Text style={[styles.builderHint, { color: theme.inkSecondary }]}>At least two steps. Audience, cost, safety, and verification are required before any future public proposal.</Text>
            <Pressable accessibilityRole="button" disabled={!canCreate} onPress={createGuide} style={({ pressed }) => [styles.saveDraftButton, { backgroundColor: canCreate ? theme.green : theme.border }, pressed && canCreate && styles.pressed]}>
              <Lock color="#FFFFFF" size={15} /><Text style={styles.saveDraftText}>SAVE PRIVATE DRAFT</Text>
            </Pressable>
          </View>
        </View>
      )}

      {shareNotice && <Text accessibilityRole="alert" style={[styles.shareNotice, { color: theme.violet }]}>{shareNotice}</Text>}

      <View style={[styles.routeGrid, compact && styles.routeGridCompact]}>
        {state.userGuides.length === 0 ? (
          <View style={[styles.emptyRoutes, { borderColor: theme.borderSoft, backgroundColor: theme.surfaceMuted }]}>
            <Lock color={theme.inkSecondary} size={22} />
            <Text style={[styles.emptyTitle, { color: theme.ink }]}>No private routes yet</Text>
            <Text style={[styles.emptyText, { color: theme.inkSecondary }]}>Create a route for yourself, or open an unlisted route link from someone you trust.</Text>
          </View>
        ) : state.userGuides.map((guide) => (
          <View key={guide.id} style={[styles.userRoute, { borderColor: guide.visibility === 'unlisted' ? theme.violet : theme.borderSoft, backgroundColor: theme.surface }]}>
            <View style={styles.userRouteTopline}>
              <View style={[styles.visibilityBadge, { backgroundColor: guide.visibility === 'unlisted' ? `${theme.violet}14` : `${theme.green}14` }]}>
                {guide.visibility === 'unlisted' ? <Eye color={theme.violet} size={13} /> : <EyeOff color={theme.green} size={13} />}
                <Text style={[styles.visibilityText, { color: guide.visibility === 'unlisted' ? theme.violet : theme.green }]}>{guide.visibility.toUpperCase()}</Text>
              </View>
              <Text style={[styles.sourceText, { color: theme.inkSecondary }]}>{guide.source === 'imported' ? 'IMPORTED' : 'CREATED HERE'}</Text>
            </View>
            <Text style={[styles.userRouteTitle, { color: theme.ink }]}>{guide.title}</Text>
            <Text style={[styles.userRouteOutcome, { color: theme.inkSecondary }]}>{guide.outcome}</Text>
            <View style={styles.userSteps}>{guide.steps.map((step, index) => <View key={`${guide.id}-${index}`} style={styles.userStep}><Text style={[styles.userStepNumber, { color: theme.green }]}>0{index + 1}</Text><Text style={[styles.userStepText, { color: theme.ink }]}>{step}</Text></View>)}</View>
            <View style={styles.userRouteActions}>
              <Pressable accessibilityRole="button" onPress={() => setUserGuideVisibility(guide.id, guide.visibility === 'private' ? 'unlisted' : 'private')} style={({ pressed }) => [styles.routeAction, { borderColor: theme.borderSoft }, pressed && styles.pressed]}>
                {guide.visibility === 'private' ? <Eye color={theme.ink} size={15} /> : <Lock color={theme.ink} size={15} />}
                <Text style={[styles.routeActionText, { color: theme.ink }]}>{guide.visibility === 'private' ? 'MAKE UNLISTED' : 'MAKE PRIVATE'}</Text>
              </Pressable>
              {guide.visibility === 'unlisted' && <Pressable accessibilityRole="button" onPress={() => void shareGuide(guide)} style={({ pressed }) => [styles.routeAction, { borderColor: theme.violet }, pressed && styles.pressed]}><Share2 color={theme.violet} size={15} /><Text style={[styles.routeActionText, { color: theme.violet }]}>SHARE LINK</Text></Pressable>}
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.publicGate, { borderColor: theme.borderSoft, backgroundColor: theme.surfaceMuted }]}>
        <ShieldCheck color={theme.violet} size={21} />
        <View style={styles.publicGateCopy}><Text style={[styles.publicGateTitle, { color: theme.ink }]}>Public proposals are not open in this Alpha</Text><Text style={[styles.publicGateText, { color: theme.inkSecondary }]}>An eventual public Guide must disclose audience, prerequisites, time, cost, equipment, safety, author context, version, and evidence. New canonical Paths require review and deduplication.</Text></View>
      </View>
    </ScreenScaffold>
  );
}

function GuideDeck({ guides, decisions, activeGuideId, onDecision, onTry }: {
  guides: CuratedGuide[];
  decisions: Record<string, GuideDecision>;
  activeGuideId: string | null;
  onDecision: (guideId: string, decision: GuideDecision) => void;
  onTry: (guide: CuratedGuide) => void;
}) {
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const { theme } = useLifeTheme();
  const [index, setIndex] = useState(0);
  const [inspecting, setInspecting] = useState(false);
  const translateX = useSharedValue(0);
  const guide = guides[index];

  const advance = (decision: GuideDecision) => {
    if (!guide) return;
    onDecision(guide.id, decision);
    setInspecting(false);
    setIndex((current) => Math.min(guides.length, current + 1));
    translateX.value = 0;
  };

  const gesture = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .failOffsetY([-18, 18])
    .onUpdate((event) => { translateX.value = event.translationX; })
    .onEnd((event) => {
      if (Math.abs(event.translationX) < 90) {
        translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
        return;
      }
      const decision: GuideDecision = event.translationX > 0 ? 'saved' : 'skipped';
      translateX.value = withTiming(event.translationX > 0 ? width : -width, { duration: 180 }, (finished) => {
        if (finished) runOnJS(advance)(decision);
      });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { rotate: `${translateX.value / Math.max(width, 1) * 8}deg` }],
  }));

  if (!guide) {
    const saved = guides.filter((candidate) => decisions[candidate.id] === 'saved');
    return (
      <View style={[styles.deckComplete, { borderColor: theme.green, backgroundColor: `${theme.green}0A` }]}>
        <Check color={theme.green} size={26} />
        <Text style={[styles.deckCompleteTitle, { color: theme.ink }]}>Guide session complete</Text>
        <Text style={[styles.deckCompleteText, { color: theme.inkSecondary }]}>{saved.length ? `You saved ${saved.length} Guide${saved.length === 1 ? '' : 's'}. Choose one to inspect or try; there is no next page of endless content.` : 'Nothing fit well enough to save. Refine your signals or build a private route instead of continuing to scroll.'}</Text>
        <View style={styles.completeActions}>
          {saved.slice(0, 3).map((candidate) => <Pressable key={candidate.id} accessibilityRole="button" onPress={() => onTry(candidate)} style={({ pressed }) => [styles.tryButton, { backgroundColor: candidate.pathId === 'live-av' ? theme.green : theme.violet }, pressed && styles.pressed]}><Text style={styles.tryButtonText}>TRY {candidate.title.toUpperCase()}</Text><ArrowRight color="#FFFFFF" size={15} /></Pressable>)}
          <Pressable accessibilityRole="button" onPress={() => setIndex(0)} style={({ pressed }) => [styles.reviewButton, { borderColor: theme.borderSoft }, pressed && styles.pressed]}><Text style={[styles.reviewButtonText, { color: theme.ink }]}>REVIEW THIS FINITE DECK</Text></Pressable>
        </View>
      </View>
    );
  }

  const existingDecision = decisions[guide.id];
  return (
    <View style={styles.deckWrap}>
      <View style={styles.deckProgressRow}><Text style={[styles.deckProgress, { color: theme.inkSecondary }]}>GUIDE {index + 1} OF {guides.length}</Text><Text style={[styles.swipeHint, { color: theme.inkSecondary }]}>← PASS · SAVE →</Text></View>
      <View style={[styles.progressTrack, { backgroundColor: theme.borderSoft }]}><View style={[styles.progressFill, { width: `${((index + 1) / guides.length) * 100}%`, backgroundColor: theme.violet }]} /></View>
      <GestureDetector gesture={gesture}>
        <Animated.View testID="guide-deck-card" style={[styles.guideCard, compact && styles.guideCardCompact, { borderColor: existingDecision === 'saved' || activeGuideId === guide.id ? theme.violet : theme.borderSoft, backgroundColor: theme.surface }, animatedStyle]}>
          <View style={styles.guideMain}>
            <View style={styles.guideTopline}>
              <View style={[styles.validationBadge, { backgroundColor: `${theme.violet}12` }]}><BadgeCheck color={theme.violet} size={14} /><Text style={[styles.validationText, { color: theme.violet }]}>{guide.validation.toUpperCase()}</Text></View>
              {existingDecision && <Text style={[styles.previousDecision, { color: existingDecision === 'saved' ? theme.green : theme.inkSecondary }]}>PREVIOUSLY {existingDecision.toUpperCase()}</Text>}
            </View>
            <Text style={[styles.guideTitle, { color: theme.ink }]}>{guide.title}</Text>
            <Text style={[styles.guideOutcome, { color: theme.ink }]}>{guide.outcome}</Text>
            <Text style={[styles.guideSummary, { color: theme.inkSecondary }]}>{guide.summary}</Text>
            <View style={styles.guideFacts}>
              <Text style={[styles.guideFact, { color: theme.inkSecondary }]}>{guide.minutes} MIN</Text>
              <Text style={[styles.guideFact, { color: theme.inkSecondary }]}>{guide.cost}</Text>
              <Text style={[styles.guideFact, { color: theme.inkSecondary }]}>{guide.equipment}</Text>
            </View>
            {inspecting && <View style={[styles.inspectPanel, { borderTopColor: theme.borderSoft }]}><Text style={[styles.inspectLabel, { color: theme.green }]}>WHO THIS ASSUMES</Text><Text style={[styles.inspectText, { color: theme.inkSecondary }]}>{guide.intendedAudience}</Text>{guide.steps.map((step, stepIndex) => <View key={step} style={styles.inspectStep}><Text style={[styles.inspectNumber, { color: theme.violet }]}>0{stepIndex + 1}</Text><Text style={[styles.inspectStepText, { color: theme.ink }]}>{step}</Text></View>)}</View>}
          </View>
          <View style={[styles.guideTrust, compact && styles.guideTrustCompact, { borderLeftColor: compact ? 'transparent' : theme.borderSoft, borderTopColor: compact ? theme.borderSoft : 'transparent' }]}>
            <View style={styles.authorRow}><View style={[styles.avatar, { backgroundColor: theme.violet }]}><Text style={styles.avatarText}>{guide.author.split(' ').map((part) => part[0]).join('').slice(0, 2)}</Text></View><View style={styles.authorCopy}><Text style={[styles.authorName, { color: theme.ink }]}>{guide.author}</Text><Text style={[styles.authorContext, { color: theme.inkSecondary }]}>{guide.authorContext}</Text></View></View>
            <View style={styles.attemptRow}><Users color={theme.green} size={17} /><Text style={[styles.attemptValue, { color: theme.ink }]}>{guide.verifiedAttempts}</Text><Text style={[styles.attemptLabel, { color: theme.inkSecondary }]}>VERIFIED ATTEMPTS</Text></View>
            <Pressable accessibilityRole="button" onPress={() => setInspecting((current) => !current)} style={({ pressed }) => [styles.inspectButton, { borderColor: theme.borderSoft }, pressed && styles.pressed]}><Text style={[styles.inspectButtonText, { color: theme.ink }]}>{inspecting ? 'HIDE DETAILS' : 'INSPECT GUIDE'}</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => onTry(guide)} style={({ pressed }) => [styles.tryButton, { backgroundColor: theme.green }, pressed && styles.pressed]}><Text style={styles.tryButtonText}>TRY THIS ROUTE</Text><ArrowRight color="#FFFFFF" size={15} /></Pressable>
          </View>
        </Animated.View>
      </GestureDetector>
      <View style={styles.deckButtons}>
        <Pressable accessibilityRole="button" onPress={() => advance('skipped')} style={({ pressed }) => [styles.passButton, { borderColor: theme.borderSoft }, pressed && styles.pressed]}><ArrowLeft color={theme.inkSecondary} size={16} /><Text style={[styles.passButtonText, { color: theme.inkSecondary }]}>NOT FOR ME</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => advance('saved')} style={({ pressed }) => [styles.saveButton, { borderColor: theme.violet, backgroundColor: `${theme.violet}0A` }, pressed && styles.pressed]}><Text style={[styles.saveButtonText, { color: theme.violet }]}>SAVE FOR LATER</Text><ArrowRight color={theme.violet} size={16} /></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headingRow: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: 18 },
  headingCopy: { minWidth: 240, flex: 1 },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  verifiedText: { fontSize: 9, fontWeight: '900' },
  title: { marginTop: 9, fontSize: 46, fontWeight: '900', lineHeight: 49 },
  titleCompact: { fontSize: 34, lineHeight: 37 },
  subtitle: { maxWidth: 720, marginTop: 10, fontSize: 13, lineHeight: 20 },
  sessionRule: { minWidth: 145, minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 7, paddingHorizontal: 14 },
  sessionRuleLabel: { fontSize: 7, fontWeight: '900' },
  sessionRuleValue: { marginTop: 3, fontSize: 13, fontWeight: '900' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, borderWidth: 1, borderRadius: 7, padding: 13 },
  noticeText: { flex: 1, fontSize: 10, lineHeight: 15 },
  deckWrap: { marginTop: 24 },
  deckProgressRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  deckProgress: { fontSize: 8, fontWeight: '900' },
  swipeHint: { fontSize: 8, fontWeight: '800' },
  progressTrack: { height: 3, marginTop: 7, overflow: 'hidden', borderRadius: 2 },
  progressFill: { height: 3, borderRadius: 2 },
  guideCard: { minHeight: 390, flexDirection: 'row', marginTop: 12, overflow: 'hidden', borderWidth: 1, borderRadius: 9 },
  guideCardCompact: { flexDirection: 'column' },
  guideMain: { minWidth: 0, flex: 1.5, padding: 20 },
  guideTopline: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  validationBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 5 },
  validationText: { fontSize: 7, fontWeight: '900' },
  previousDecision: { fontSize: 7, fontWeight: '900' },
  guideTitle: { marginTop: 18, fontSize: 30, fontWeight: '900', lineHeight: 33 },
  guideOutcome: { maxWidth: 620, marginTop: 11, fontSize: 14, fontWeight: '800', lineHeight: 20 },
  guideSummary: { maxWidth: 650, marginTop: 9, fontSize: 11, lineHeight: 17 },
  guideFacts: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 17 },
  guideFact: { borderWidth: 1, borderColor: 'rgba(150,155,170,0.28)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 5, fontSize: 7, fontWeight: '800' },
  inspectPanel: { marginTop: 18, borderTopWidth: 1, paddingTop: 14 },
  inspectLabel: { fontSize: 7, fontWeight: '900' },
  inspectText: { marginTop: 5, fontSize: 9, lineHeight: 14 },
  inspectStep: { flexDirection: 'row', gap: 9, marginTop: 10 },
  inspectNumber: { width: 20, fontSize: 8, fontWeight: '900' },
  inspectStepText: { flex: 1, fontSize: 9, lineHeight: 14 },
  guideTrust: { width: 275, justifyContent: 'center', gap: 14, borderLeftWidth: 1, padding: 18 },
  guideTrustCompact: { width: '100%', borderLeftWidth: 0, borderTopWidth: 1 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  avatarText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  authorCopy: { minWidth: 0, flex: 1 },
  authorName: { fontSize: 11, fontWeight: '900' },
  authorContext: { marginTop: 3, fontSize: 8, lineHeight: 12 },
  attemptRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  attemptValue: { fontSize: 13, fontWeight: '900' },
  attemptLabel: { fontSize: 7, fontWeight: '800' },
  inspectButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 5 },
  inspectButtonText: { fontSize: 8, fontWeight: '900' },
  tryButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 5, paddingHorizontal: 13 },
  tryButtonText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  deckButtons: { flexDirection: 'row', gap: 9, marginTop: 10 },
  passButton: { minHeight: 46, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderRadius: 5 },
  passButtonText: { fontSize: 8, fontWeight: '900' },
  saveButton: { minHeight: 46, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderRadius: 5 },
  saveButtonText: { fontSize: 8, fontWeight: '900' },
  deckComplete: { minHeight: 260, alignItems: 'center', justifyContent: 'center', marginTop: 24, borderWidth: 1, borderRadius: 9, padding: 24 },
  deckCompleteTitle: { marginTop: 12, fontSize: 23, fontWeight: '900' },
  deckCompleteText: { maxWidth: 620, marginTop: 8, textAlign: 'center', fontSize: 11, lineHeight: 17 },
  completeActions: { width: '100%', maxWidth: 520, gap: 8, marginTop: 18 },
  reviewButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 5 },
  reviewButtonText: { fontSize: 8, fontWeight: '900' },
  sectionHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 16, marginTop: 38, marginBottom: 14 },
  sectionHeadingCopy: { minWidth: 240, flex: 1 },
  sectionEyebrow: { fontSize: 8, fontWeight: '900' },
  sectionTitle: { marginTop: 5, fontSize: 24, fontWeight: '900' },
  sectionSubtitle: { maxWidth: 720, marginTop: 5, fontSize: 10, lineHeight: 15 },
  createButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 5, paddingHorizontal: 14 },
  createButtonText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  builder: { gap: 9, borderWidth: 1, borderRadius: 8, padding: 18 },
  privacyLine: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3 },
  privacyText: { fontSize: 7, fontWeight: '900' },
  fieldLabel: { marginTop: 7, fontSize: 9, fontWeight: '900' },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 10 },
  builderFooter: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 8 },
  builderHint: { minWidth: 220, flex: 1, fontSize: 8, lineHeight: 13 },
  saveDraftButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 5, paddingHorizontal: 14 },
  saveDraftText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  shareNotice: { marginTop: 10, fontSize: 9, lineHeight: 14 },
  routeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  routeGridCompact: { flexDirection: 'column' },
  emptyRoutes: { minHeight: 180, flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 7, padding: 18 },
  emptyTitle: { marginTop: 10, fontSize: 15, fontWeight: '900' },
  emptyText: { maxWidth: 420, marginTop: 6, textAlign: 'center', fontSize: 9, lineHeight: 14 },
  userRoute: { minWidth: 280, flexBasis: 360, flexGrow: 1, borderWidth: 1, borderRadius: 7, padding: 16 },
  userRouteTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  visibilityBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 4 },
  visibilityText: { fontSize: 7, fontWeight: '900' },
  sourceText: { fontSize: 7, fontWeight: '800' },
  userRouteTitle: { marginTop: 13, fontSize: 17, fontWeight: '900' },
  userRouteOutcome: { marginTop: 6, fontSize: 9, lineHeight: 14 },
  userSteps: { marginTop: 12 },
  userStep: { flexDirection: 'row', gap: 8, marginTop: 7 },
  userStepNumber: { width: 20, fontSize: 7, fontWeight: '900' },
  userStepText: { flex: 1, fontSize: 9, lineHeight: 13 },
  userRouteActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 16 },
  routeAction: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 5, paddingHorizontal: 10 },
  routeActionText: { fontSize: 7, fontWeight: '900' },
  publicGate: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 16, borderWidth: 1, borderRadius: 7, padding: 15 },
  publicGateCopy: { flex: 1 },
  publicGateTitle: { fontSize: 12, fontWeight: '900' },
  publicGateText: { marginTop: 5, fontSize: 9, lineHeight: 14 },
  pressed: { opacity: 0.7 },
});
