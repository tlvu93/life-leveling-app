import { ArrowLeft, ArrowRight, Check, Clock3, GitBranch, Laptop, Route, ShieldCheck, Star, Zap } from 'lucide-react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ScreenScaffold } from '@/components/ScreenScaffold';
import { getPathExperience, isPlayablePathId } from '@/domain/path-experiences';
import { getPathRecommendation, timeLabels } from '@/domain/recommendations';
import { useJourney } from '@/state/journey-context';
import { useLifeTheme } from '@/state/theme-context';

const routeSteps = [
  { number: '01', title: 'Taste', detail: 'Make one track visible', commitment: '60 min', active: true },
  { number: '02', title: 'Learn', detail: 'Shape a three-track mini mix', commitment: '2–3 hr', active: false },
  { number: '03', title: 'Connect', detail: 'Observe a local or online live set', commitment: '90 min', active: false },
  { number: '04', title: 'Combine', detail: 'Perform a ten-minute audiovisual set', commitment: '4–6 hr', active: false },
];

const branches = [
  { title: 'DJ + reactive visuals', detail: 'Balanced sound and image. Uses free software and your current setup.', meta: 'Recommended · EUR 0–40', tone: '#3B8463' },
  { title: 'No-code VJ', detail: 'Fastest visual route with less setup and no programming.', meta: 'Visual emphasis · EUR 0–40', tone: '#D08A08' },
  { title: 'Generative visuals', detail: 'More technical, with code driving image and motion.', meta: 'Coding emphasis · EUR 0–60', tone: '#0798A6' },
  { title: 'DJ craft first', detail: 'Build confidence in music selection and transitions before visuals.', meta: 'Audio emphasis · EUR 40–100', tone: '#E86555' },
];

export default function PathScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const { theme } = useLifeTheme();
  const { hydrated, state, startPath } = useJourney();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  if (!hydrated) return <View style={[styles.loading, { backgroundColor: theme.surfaceStrong }]}><ActivityIndicator color={theme.green} /></View>;
  if (!state.profile.completed) return <Redirect href="/onboarding" />;

  const pathId = isPlayablePathId(id) ? id : state.selectedPathId ?? 'live-av';
  const experience = getPathExperience(pathId);
  const started = state.selectedPathId === pathId;
  const completed = started && state.quest.status === 'completed';
  const stopped = started && state.quest.status === 'stopped';
  const resolved = completed || stopped;
  const recommendation = getPathRecommendation(state.profile, pathId);
  const tone = recommendation.path.tone;
  const routeStepsForPath = pathId === 'live-av' ? routeSteps : experience.routeSteps.map((step, index) => ({ ...step, number: `0${index + 1}`, active: index === 0 }));
  const branchesForPath = pathId === 'live-av' ? branches : experience.branches;
  const matchedInterests = recommendation.matchedSignals.filter((signal) => signal.kind === 'interest');
  const fitName = { strong: 'Strong', plausible: 'Plausible', stretch: 'Stretch' }[recommendation.personalFit];
  const fitTitle = recommendation.rank === 1
    ? `${fitName} personal fit`
    : `${fitName} personal fit · playable bridge`;
  const primaryAction = () => {
    if (resolved) {
      router.push('/');
      return;
    }
    if (!started) startPath(pathId);
    router.push('/quest');
  };

  return (
    <ScreenScaffold>
      <Pressable accessibilityRole="button" onPress={() => router.push('/discover')} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <ArrowLeft color={theme.inkSecondary} size={15} />
        <Text style={[styles.backText, { color: theme.inkSecondary }]}>ALL RECOMMENDATIONS</Text>
      </Pressable>

      <View style={[styles.hero, compact && styles.heroCompact, { borderColor: theme.borderSoft, backgroundColor: theme.surface }]}>
        <View style={[styles.pathMark, { backgroundColor: `${tone}16`, borderColor: tone }]}><Zap color={tone} size={27} /></View>
        <View style={styles.heroCopy}>
          <Text style={[styles.eyebrow, { color: tone }]}>{experience.eyebrow}</Text>
          <Text testID="path-title" style={[styles.title, compact && styles.titleCompact, { color: theme.ink }]}>{recommendation.path.title}</Text>
          <Text style={[styles.subtitle, { color: theme.inkSecondary }]}>{experience.summary}</Text>
          <View style={styles.tags}>
            {matchedInterests.map((signal) => <View key={signal.id} style={[styles.tag, { borderColor: theme.borderSoft }]}><Text style={[styles.tagText, { color: theme.inkSecondary }]}>{signal.label}</Text></View>)}
          </View>
        </View>
        <View testID="path-recommendation" style={[styles.match, { borderColor: tone, backgroundColor: `${tone}0D` }]}>
          <SparkleLabel tone={tone} />
          <Text style={[styles.matchTitle, { color: theme.ink }]}>{fitTitle}</Text>
          <Text style={[styles.availability, { color: tone }]}>PLAYABLE PRIVATE EXPERIMENT</Text>
          <Text style={[styles.matchText, { color: theme.inkSecondary }]}>{recommendation.explanation}</Text>
        </View>
      </View>

      <View style={[styles.factGrid, compact && styles.factGridCompact]}>
        <Fact icon={Clock3} label="ESTIMATED COMMITMENT" value={`${recommendation.firstQuestMinutes} min first Quest`} detail={`${recommendation.timeFit} Selected: ${timeLabels[state.profile.availableTime]}.`} />
        <Fact icon={Star} label="COMMUNITY SIGNAL" value={experience.community.value} detail={experience.community.detail} />
        <Fact icon={Laptop} label="STARTING EQUIPMENT" value={experience.equipment.value} detail={experience.equipment.detail} />
        <Fact icon={ShieldCheck} label="SKILLS REQUIRED" value={experience.skills.value} detail={experience.skills.detail} />
      </View>

      <View style={[styles.fitGrid, compact && styles.fitGridCompact]}>
        <View style={[styles.fitCard, { borderColor: theme.borderSoft, backgroundColor: theme.surfaceMuted }]}>
          <Text style={[styles.fitLabel, { color: tone }]}>GOOD FIT IF</Text>
          {experience.goodFit.map((text) => <FitLine key={text} text={text} positive />)}
        </View>
        <View style={[styles.fitCard, { borderColor: theme.borderSoft, backgroundColor: theme.surfaceMuted }]}>
          <Text style={[styles.fitLabel, { color: theme.coral }]}>LESS SUITABLE IF</Text>
          {experience.lessFit.map((text) => <FitLine key={text} text={text} />)}
        </View>
      </View>

      <SectionHeading index="01" title="Your route" subtitle="The first node is fixed; lived evidence decides which branch opens next." />
      <View style={[styles.route, { borderColor: theme.borderSoft, backgroundColor: theme.surface }]}>
        {routeStepsForPath.map((step, index) => (
          <View key={step.number} style={styles.routeItem}>
            <View style={styles.routeMarkerColumn}>
              <View style={[styles.routeMarker, { borderColor: step.active ? tone : theme.border, backgroundColor: step.active ? tone : theme.surface }]}>
                <Text style={[styles.routeNumber, { color: step.active ? '#FFFFFF' : theme.inkSecondary }]}>{step.number}</Text>
              </View>
              {index < routeStepsForPath.length - 1 && <View style={[styles.routeLine, { backgroundColor: theme.borderSoft }]} />}
            </View>
            <View style={[styles.routeCopy, { borderBottomColor: index < routeStepsForPath.length - 1 ? theme.borderSoft : 'transparent' }]}>
              <View>
                <Text style={[styles.routeLabel, { color: step.active ? tone : theme.inkSecondary }]}>{step.title.toUpperCase()}</Text>
                <Text style={[styles.routeTitle, { color: theme.ink }]}>{step.detail}</Text>
              </View>
              <Text style={[styles.routeCommitment, { color: theme.inkSecondary }]}>{step.commitment}</Text>
            </View>
          </View>
        ))}
      </View>

      <SectionHeading index="02" title="Alternative branches" subtitle="These are possibilities inside the playable route. Your outcome, ratings, experience, time, and reflection decide what actually opens." />
      <View style={[styles.branchGrid, compact && styles.branchGridCompact]}>
        {branchesForPath.map((branch, index) => (
          <View key={branch.title} style={[styles.branch, { borderColor: index === 0 ? branch.tone : theme.borderSoft, backgroundColor: theme.surface }]}>
            <GitBranch color={branch.tone} size={19} />
            <Text style={[styles.branchTitle, { color: theme.ink }]}>{branch.title}</Text>
            <Text style={[styles.branchDetail, { color: theme.inkSecondary }]}>{branch.detail}</Text>
            <Text style={[styles.branchMeta, { color: branch.tone }]}>{branch.meta}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.startBar, compact && styles.startBarCompact, { borderColor: theme.borderSoft, backgroundColor: theme.surface }]}>
        <View style={styles.startCopy}>
          <Text style={[styles.startLabel, { color: stopped ? theme.coral : tone }]}>{completed ? 'FIRST QUEST COMPLETE' : stopped ? 'FIRST QUEST ATTEMPTED' : started ? 'PRIVATE BUILD IN PROGRESS' : 'READY TO TEST, NOT COMMIT'}</Text>
          <Text style={[styles.startText, { color: theme.ink }]}>{resolved ? 'Your reflection changed the Atlas and opened a next direction.' : `Start with one ${recommendation.firstQuestMinutes}-minute experiment. Stopping after a real attempt is meaningful progression.`}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={primaryAction} style={({ pressed }) => [styles.primaryButton, { backgroundColor: tone }, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>{resolved ? 'SEE ATLAS GROWTH' : started ? 'CONTINUE FIRST QUEST' : 'START THIS PATH'}</Text>
          <ArrowRight color="#FFFFFF" size={17} />
        </Pressable>
      </View>
    </ScreenScaffold>
  );

  function Fact({ icon: Icon, label, value, detail }: { icon: typeof Clock3; label: string; value: string; detail: string }) {
    return (
      <View style={[styles.fact, { borderColor: theme.borderSoft, backgroundColor: theme.surfaceMuted }]}>
        <Icon color={tone} size={20} />
        <Text style={[styles.factLabel, { color: theme.inkSecondary }]}>{label}</Text>
        <Text style={[styles.factValue, { color: theme.ink }]}>{value}</Text>
        <Text style={[styles.factDetail, { color: theme.inkSecondary }]}>{detail}</Text>
      </View>
    );
  }

  function FitLine({ text, positive = false }: { text: string; positive?: boolean }) {
    return <View style={styles.fitLine}><Check color={positive ? tone : theme.coral} size={14} /><Text style={[styles.fitText, { color: theme.inkSecondary }]}>{text}</Text></View>;
  }

  function SectionHeading({ index, title, subtitle }: { index: string; title: string; subtitle: string }) {
    return <View style={styles.sectionHeading}><Text style={[styles.sectionIndex, { color: theme.green }]}>{index}</Text><View><Text style={[styles.sectionTitle, { color: theme.ink }]}>{title}</Text><Text style={[styles.sectionSubtitle, { color: theme.inkSecondary }]}>{subtitle}</Text></View></View>;
  }
}

function SparkleLabel({ tone }: { tone: string }) {
  return <View style={styles.matchLabel}><Route color={tone} size={14} /><Text style={[styles.matchLabelText, { color: tone }]}>WHY ATLAS OFFERS IT</Text></View>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  back: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 13, paddingVertical: 5 },
  backText: { fontSize: 8, fontWeight: '900' },
  hero: { minHeight: 230, flexDirection: 'row', alignItems: 'center', gap: 20, borderWidth: 1, borderRadius: 8, padding: 24 },
  heroCompact: { alignItems: 'flex-start', flexWrap: 'wrap', padding: 18 },
  pathMark: { width: 62, height: 62, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderRadius: 10, transform: [{ rotate: '45deg' }] },
  heroCopy: { minWidth: 240, flex: 1 },
  eyebrow: { fontSize: 8, fontWeight: '900' },
  title: { marginTop: 8, fontSize: 41, fontWeight: '900', lineHeight: 43 },
  titleCompact: { fontSize: 30, lineHeight: 33 },
  subtitle: { maxWidth: 620, marginTop: 10, fontSize: 12, lineHeight: 18 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  tag: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 4 },
  tagText: { fontSize: 8, fontWeight: '700' },
  match: { width: 230, borderWidth: 1, borderRadius: 7, padding: 15 },
  matchLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  matchLabelText: { fontSize: 7, fontWeight: '900' },
  matchTitle: { marginTop: 9, fontSize: 15, fontWeight: '900' },
  availability: { marginTop: 5, fontSize: 7, fontWeight: '900' },
  matchText: { marginTop: 6, fontSize: 9, lineHeight: 14 },
  factGrid: { flexDirection: 'row', gap: 9, marginTop: 12 },
  factGridCompact: { flexWrap: 'wrap' },
  fact: { minWidth: 160, minHeight: 125, flex: 1, borderWidth: 1, borderRadius: 7, padding: 14 },
  factLabel: { marginTop: 10, fontSize: 7, fontWeight: '900' },
  factValue: { marginTop: 5, fontSize: 13, fontWeight: '900' },
  factDetail: { marginTop: 4, fontSize: 8, lineHeight: 12 },
  fitGrid: { flexDirection: 'row', gap: 10, marginTop: 12 },
  fitGridCompact: { flexDirection: 'column' },
  fitCard: { flex: 1, borderWidth: 1, borderRadius: 7, padding: 15 },
  fitLabel: { fontSize: 8, fontWeight: '900', marginBottom: 9 },
  fitLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 6 },
  fitText: { flex: 1, fontSize: 9, lineHeight: 14 },
  sectionHeading: { flexDirection: 'row', gap: 12, marginTop: 30, marginBottom: 13 },
  sectionIndex: { fontSize: 11, fontWeight: '900' },
  sectionTitle: { fontSize: 20, fontWeight: '900' },
  sectionSubtitle: { maxWidth: 720, marginTop: 3, fontSize: 10, lineHeight: 14 },
  route: { borderWidth: 1, borderRadius: 7, paddingHorizontal: 17, paddingVertical: 8 },
  routeItem: { flexDirection: 'row' },
  routeMarkerColumn: { width: 48, alignItems: 'center' },
  routeMarker: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', zIndex: 2, borderWidth: 1, borderRadius: 17, marginTop: 13 },
  routeNumber: { fontSize: 8, fontWeight: '900' },
  routeLine: { position: 'absolute', top: 47, bottom: -13, width: 2 },
  routeCopy: { minHeight: 76, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderBottomWidth: 1 },
  routeLabel: { fontSize: 7, fontWeight: '900' },
  routeTitle: { marginTop: 4, fontSize: 13, fontWeight: '800' },
  routeCommitment: { fontSize: 9, fontWeight: '700' },
  branchGrid: { flexDirection: 'row', gap: 9 },
  branchGridCompact: { flexWrap: 'wrap' },
  branch: { minWidth: 170, minHeight: 170, flex: 1, borderWidth: 1, borderRadius: 7, padding: 15 },
  branchTitle: { marginTop: 12, fontSize: 14, fontWeight: '900' },
  branchDetail: { marginTop: 6, fontSize: 9, lineHeight: 14 },
  branchMeta: { marginTop: 'auto', paddingTop: 10, fontSize: 8, fontWeight: '900' },
  startBar: { minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 22, borderWidth: 1, borderRadius: 7, padding: 14 },
  startBarCompact: { alignItems: 'stretch', flexDirection: 'column' },
  startCopy: { minWidth: 220, flex: 1 },
  startLabel: { fontSize: 8, fontWeight: '900' },
  startText: { marginTop: 5, fontSize: 11, lineHeight: 16 },
  primaryButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 5, paddingHorizontal: 18 },
  primaryText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  pressed: { opacity: 0.72 },
});
