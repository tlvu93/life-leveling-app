import { ArrowRight, Clock3, Code2, Compass, Dumbbell, Hammer, Headphones, Lightbulb, MapPin, Music2, Palette, SlidersHorizontal, Sparkles } from 'lucide-react-native';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ScreenScaffold } from '@/components/ScreenScaffold';
import { recommendPaths, timeLabels } from '@/domain/recommendations';
import { type InterestId, useJourney } from '@/state/journey-context';
import { useLifeTheme } from '@/state/theme-context';

const interestMeta: Record<InterestId, { label: string; color: string; icon: typeof Music2 }> = {
  music: { label: 'Music', color: '#E86555', icon: Music2 },
  technology: { label: 'Technology', color: '#0798A6', icon: Code2 },
  visual: { label: 'Visual creativity', color: '#D08A08', icon: Palette },
  performance: { label: 'Performance', color: '#7B87D3', icon: Sparkles },
  nature: { label: 'Nature', color: '#4DA665', icon: Compass },
  community: { label: 'Community', color: '#C45B9A', icon: MapPin },
  sports: { label: 'Sports & movement', color: '#E86555', icon: Dumbbell },
  making: { label: 'Making & crafts', color: '#D08A08', icon: Hammer },
  curiosity: { label: 'Learning & puzzles', color: '#0798A6', icon: Lightbulb },
};

export default function DiscoverScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const { theme } = useLifeTheme();
  const { hydrated, state } = useJourney();
  const router = useRouter();

  if (!hydrated) return <View style={[styles.loading, { backgroundColor: theme.surfaceStrong }]}><ActivityIndicator color={theme.green} /></View>;
  if (!state.profile.completed) return <Redirect href="/onboarding" />;

  const recommendations = recommendPaths(state.profile);
  const refined = state.branchRecommendation;

  return (
    <ScreenScaffold>
      <View style={styles.intro}>
        <Text style={[styles.eyebrow, { color: theme.green }]}>CROSSROADS / PERSONAL SIGNALS</Text>
        <Text style={[styles.title, compact && styles.titleCompact, { color: theme.ink }]}>Paths worth trying</Text>
        <Text style={[styles.subtitle, { color: theme.inkSecondary }]}>Personal fit and Alpha availability are separate. Preview Paths can rank highly, but only a route with a complete Quest, reflection, and Atlas loop is playable.</Text>
      </View>

      <View style={styles.signalRow}>
        <View style={styles.interests}>
          {state.profile.interests.length === 0 && (
            <View style={[styles.interest, { borderColor: theme.amber, backgroundColor: `${theme.amber}12` }]}>
              <Compass color={theme.amber} size={17} />
              <Text style={[styles.interestLabel, { color: theme.ink }]}>Starting without declared interests</Text>
            </View>
          )}
          {state.profile.interests.map((id) => {
            const meta = interestMeta[id];
            const Icon = meta.icon;
            return (
              <View key={id} style={[styles.interest, { borderColor: meta.color, backgroundColor: `${meta.color}12` }]}>
                <Icon color={meta.color} size={17} />
                <Text style={[styles.interestLabel, { color: theme.ink }]}>{meta.label}</Text>
              </View>
            );
          })}
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push('/onboarding')} style={({ pressed }) => [styles.refineButton, { borderColor: theme.borderSoft }, pressed && styles.pressed]}>
          <SlidersHorizontal color={theme.inkSecondary} size={15} />
          <Text style={[styles.refineText, { color: theme.inkSecondary }]}>REFINE</Text>
        </Pressable>
      </View>

      <View style={[styles.loadout, { borderColor: theme.borderSoft, backgroundColor: theme.surfaceMuted }]}>
        <Headphones color={theme.green} size={21} />
        <View style={styles.loadoutCopy}>
          <Text style={[styles.loadoutLabel, { color: theme.green }]}>YOUR CURRENT SHAPE</Text>
          <Text style={[styles.loadoutText, { color: theme.ink }]}>{timeLabels[state.profile.availableTime]} · {state.profile.skills.includes('starting-fresh') ? 'starting fresh' : `${state.profile.skills.length} useful skill signal${state.profile.skills.length === 1 ? '' : 's'}`} · private experiments first</Text>
        </View>
      </View>

      {refined && (
        <View testID="refined-recommendation" style={[styles.refined, { borderColor: theme.violet, backgroundColor: `${theme.violet}0D` }]}>
          <Sparkles color={theme.violet} size={20} />
          <View style={styles.refinedCopy}>
            <Text style={[styles.refinedLabel, { color: theme.violet }]}>{refined.outcome === 'stopped' ? 'REDIRECTED FROM AN ATTEMPTED QUEST' : 'REFINED FROM YOUR COMPLETED QUEST'}</Text>
            <Text style={[styles.refinedTitle, { color: theme.ink }]}>{refined.title}</Text>
            <Text style={[styles.refinedText, { color: theme.inkSecondary }]}>{refined.reason} {refined.whyDifferent}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/')} style={({ pressed }) => [styles.smallButton, { backgroundColor: theme.violet }, pressed && styles.pressed]}>
            <Text style={styles.smallButtonText}>SEE UNLOCK</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionIndex, { color: theme.green }]}>01</Text>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>Recommended at this Crossroads</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.inkSecondary }]}>Ordered by saved interests first, then skills and exploration goals. Time is shown as feasibility, not identity.</Text>
        </View>
      </View>

      <View style={[styles.pathGrid, compact && styles.pathGridCompact]}>
        {recommendations.map((recommendation) => {
          const { path } = recommendation;
          const playable = recommendation.availability === 'playable';
          const leadingStrongFit = recommendation.rank === 1 && recommendation.personalFit === 'strong';
          const fitLabel = leadingStrongFit
            ? 'STRONG PERSONAL FIT'
            : playable && recommendation.rank > 1
              ? 'PLAYABLE ALPHA BRIDGE'
              : `${recommendation.personalFit.toUpperCase()} PERSONAL FIT`;
          return (
            <View key={path.id} testID={`path-card-${path.id}`} style={[styles.pathCard, { borderColor: playable ? path.tone : theme.borderSoft, backgroundColor: theme.surface }]}>
              <View style={[styles.cardAccent, { backgroundColor: path.tone }]} />
              <View style={styles.cardTopline}>
                <View style={[styles.rare, { backgroundColor: `${path.tone}18` }]}><Sparkles color={path.tone} size={13} /><Text style={[styles.rareText, { color: path.tone }]}>{fitLabel}</Text></View>
                <Text style={[styles.rankText, { color: theme.inkSecondary }]}>RANK {recommendation.rank}</Text>
              </View>
              <Text style={[styles.cardTitle, { color: theme.ink }]}>{path.title}</Text>
              <Text style={[styles.cardDetail, { color: theme.inkSecondary }]}>{path.detail}</Text>
              <View style={[styles.why, { borderTopColor: theme.borderSoft }]}>
                <Text style={[styles.whyLabel, { color: path.tone }]}>WHY IT MATCHES</Text>
                <Text style={[styles.whyText, { color: theme.inkSecondary }]}>{recommendation.explanation}</Text>
              </View>
              <View style={styles.facts}>
                <View style={styles.fact}><Clock3 color={theme.inkSecondary} size={13} /><Text style={[styles.factText, { color: theme.inkSecondary }]}>{recommendation.firstQuestMinutes} min first Quest</Text></View>
                <Text style={[styles.factText, { color: theme.inkSecondary }]}>{path.access}</Text>
              </View>
              {playable ? (
                <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/path', params: { id: path.id } })} style={({ pressed }) => [styles.cardButton, { backgroundColor: path.tone }, pressed && styles.pressed]}>
                  <Text style={styles.cardButtonText}>{state.selectedPathId === path.id ? 'RETURN TO PATH' : 'EXPLORE THIS PATH'}</Text>
                  <ArrowRight color="#FFFFFF" size={16} />
                </Pressable>
              ) : (
                <View style={[styles.previewLabel, { borderColor: theme.borderSoft }]}><Text style={[styles.previewText, { color: theme.inkSecondary }]}>PREVIEW · NOT YET PLAYABLE</Text></View>
              )}
            </View>
          );
        })}
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  intro: { maxWidth: 760 },
  eyebrow: { fontSize: 9, fontWeight: '900' },
  title: { marginTop: 8, fontSize: 48, fontWeight: '900', lineHeight: 50 },
  titleCompact: { fontSize: 34, lineHeight: 37 },
  subtitle: { maxWidth: 680, marginTop: 12, fontSize: 14, lineHeight: 21 },
  signalRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 23 },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interest: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 6, paddingHorizontal: 11 },
  interestLabel: { fontSize: 10, fontWeight: '700' },
  refineButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 6, paddingHorizontal: 12 },
  refineText: { fontSize: 8, fontWeight: '900' },
  loadout: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, borderWidth: 1, borderRadius: 7, paddingHorizontal: 16 },
  loadoutCopy: { flex: 1 },
  loadoutLabel: { fontSize: 8, fontWeight: '900' },
  loadoutText: { marginTop: 4, fontSize: 10, lineHeight: 14 },
  refined: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 13, marginTop: 14, borderWidth: 1, borderRadius: 7, padding: 15 },
  refinedCopy: { minWidth: 220, flex: 1 },
  refinedLabel: { fontSize: 8, fontWeight: '900' },
  refinedTitle: { marginTop: 4, fontSize: 15, fontWeight: '900' },
  refinedText: { marginTop: 4, fontSize: 10, lineHeight: 15 },
  smallButton: { minHeight: 38, justifyContent: 'center', borderRadius: 5, paddingHorizontal: 13 },
  smallButtonText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  sectionHeading: { flexDirection: 'row', gap: 12, marginTop: 32, marginBottom: 14 },
  sectionIndex: { fontSize: 11, fontWeight: '900' },
  sectionTitle: { fontSize: 20, fontWeight: '900' },
  sectionSubtitle: { maxWidth: 760, marginTop: 3, fontSize: 10, lineHeight: 14 },
  pathGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pathGridCompact: { flexDirection: 'column' },
  pathCard: { position: 'relative', minWidth: 280, minHeight: 430, flexBasis: 340, flexGrow: 1, overflow: 'hidden', borderWidth: 1, borderRadius: 7, padding: 18 },
  cardAccent: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 4 },
  cardTopline: { minHeight: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  rare: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 5 },
  rareText: { fontSize: 7, fontWeight: '900' },
  rankText: { fontSize: 7, fontWeight: '900' },
  cardTitle: { marginTop: 13, fontSize: 19, fontWeight: '900', lineHeight: 22 },
  cardDetail: { marginTop: 8, fontSize: 10, lineHeight: 15 },
  why: { minHeight: 142, marginTop: 15, borderTopWidth: 1, paddingTop: 13 },
  whyLabel: { fontSize: 7, fontWeight: '900' },
  whyText: { marginTop: 6, fontSize: 9, lineHeight: 14 },
  facts: { gap: 7, marginTop: 12 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  factText: { fontSize: 8, lineHeight: 12 },
  cardButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 'auto', borderRadius: 5, paddingHorizontal: 12 },
  cardButtonText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  previewLabel: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 'auto', borderWidth: 1, borderRadius: 5 },
  previewText: { fontSize: 7, fontWeight: '900' },
  pressed: { opacity: 0.72 },
});
