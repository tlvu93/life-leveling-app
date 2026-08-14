import { ArrowRight, Check, Clock3, Compass, Sparkles, Wrench } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ScreenScaffold } from '@/components/ScreenScaffold';
import {
  type AvailableTime,
  type ExplorationId,
  type InterestId,
  type JourneyProfile,
  type SkillId,
  useJourney,
} from '@/state/journey-context';
import { useLifeTheme } from '@/state/theme-context';

const interestOptions: { id: InterestId; label: string }[] = [
  { id: 'music', label: 'Music' },
  { id: 'technology', label: 'Technology' },
  { id: 'visual', label: 'Visual creativity' },
  { id: 'performance', label: 'Performance' },
  { id: 'nature', label: 'Nature' },
  { id: 'community', label: 'Community' },
  { id: 'sports', label: 'Sports & movement' },
  { id: 'making', label: 'Making & crafts' },
  { id: 'curiosity', label: 'Learning & puzzles' },
];

const skillOptions: { id: SkillId; label: string }[] = [
  { id: 'starting-fresh', label: 'No strengths yet' },
  { id: 'music-production', label: 'Music production' },
  { id: 'coding', label: 'Coding' },
  { id: 'visual-design', label: 'Visual design' },
  { id: 'live-performance', label: 'Live performance' },
  { id: 'storytelling', label: 'Storytelling' },
  { id: 'photo-video', label: 'Photo or video' },
  { id: 'team-sports', label: 'Team sports' },
];

const timeOptions: { id: AvailableTime; label: string; detail: string }[] = [
  { id: '1-hour', label: '1 hour', detail: 'one small experiment' },
  { id: '2-hours', label: '2 hours', detail: 'a focused evening' },
  { id: '3-4-hours', label: '3–4 hours', detail: 'a weekly practice' },
  { id: '5-plus-hours', label: '5+ hours', detail: 'room to go deeper' },
];

const explorationOptions: { id: ExplorationId; label: string }[] = [
  { id: 'creative-hobby', label: 'A creative hobby' },
  { id: 'side-project', label: 'A side project' },
  { id: 'career-possibility', label: 'A career possibility' },
  { id: 'meet-people', label: 'A way to meet people' },
  { id: 'find-a-spark', label: 'Find what sparks me' },
];

function toggle<T extends string>(items: T[], item: T) {
  return items.includes(item) ? items.filter((current) => current !== item) : [...items, item];
}

function OnboardingForm({ initial }: { initial: JourneyProfile }) {
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const { theme } = useLifeTheme();
  const { completeOnboarding, flushJourney } = useJourney();
  const router = useRouter();
  const [interests, setInterests] = useState(initial.interests);
  const [skills, setSkills] = useState(initial.skills);
  const [availableTime, setAvailableTime] = useState(initial.availableTime);
  const [explorations, setExplorations] = useState(initial.explorations);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const ready = skills.length >= 1 && explorations.length >= 1;

  const toggleSkill = (id: SkillId) => {
    if (id === 'starting-fresh') {
      setSkills(['starting-fresh']);
      return;
    }
    setSkills((current) => {
      const withoutFresh = current.filter((skill) => skill !== 'starting-fresh');
      const next = toggle(withoutFresh, id);
      return next.length ? next : ['starting-fresh'];
    });
  };

  const toggleExploration = (id: ExplorationId) => {
    if (id === 'find-a-spark') {
      setExplorations(['find-a-spark']);
      return;
    }
    setExplorations((current) => {
      const withoutOpenStart = current.filter((exploration) => exploration !== 'find-a-spark');
      const next = toggle(withoutOpenStart, id);
      return next.length ? next : ['find-a-spark'];
    });
  };

  const continueToRecommendations = async () => {
    if (!ready || saving) return;
    setSaving(true);
    setSaveError(null);
    completeOnboarding({ interests, skills, availableTime, explorations });
    try {
      await flushJourney();
      router.replace('/discover');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Your starting point could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenScaffold showNavigation={initial.completed}>
      <View style={styles.intro}>
        <View style={[styles.stepBadge, { backgroundColor: `${theme.violet}14` }]}>
          <Compass color={theme.violet} size={15} />
          <Text style={[styles.stepBadgeText, { color: theme.violet }]}>YOUR STARTING POINT</Text>
        </View>
        <Text style={[styles.title, compact && styles.titleCompact, { color: theme.ink }]}>What should your Atlas look for?</Text>
        <Text style={[styles.subtitle, { color: theme.inkSecondary }]}>Choose the signals that feel true now. Nothing here locks you into an identity or a long-term plan.</Text>
      </View>

      <View style={[styles.section, { borderColor: theme.borderSoft, backgroundColor: theme.surface }]}>
        <View style={styles.sectionHeading}>
          <Sparkles color={theme.coral} size={20} />
          <View style={styles.sectionCopy}>
            <Text style={[styles.sectionTitle, { color: theme.ink }]}>What draws you in?</Text>
            <Text style={[styles.sectionHint, { color: theme.inkSecondary }]}>Choose any that feel true, or say that nothing stands out yet.</Text>
          </View>
          <Text style={[styles.count, { color: theme.coral }]}>{interests.length ? `${interests.length} SELECTED` : 'OPEN START'}</Text>
        </View>
        <View style={styles.options}>
          <Choice label="Nothing stands out yet" selected={interests.length === 0} onPress={() => setInterests([])} />
          {interestOptions.map((option) => {
            const selected = interests.includes(option.id);
            return <Choice key={option.id} label={option.label} selected={selected} onPress={() => setInterests((current) => toggle(current, option.id))} />;
          })}
        </View>
      </View>

      <View style={[styles.section, { borderColor: theme.borderSoft, backgroundColor: theme.surface }]}>
        <View style={styles.sectionHeading}>
          <Wrench color={theme.teal} size={20} />
          <View style={styles.sectionCopy}>
            <Text style={[styles.sectionTitle, { color: theme.ink }]}>What can you already use?</Text>
            <Text style={[styles.sectionHint, { color: theme.inkSecondary }]}>Experience helps shape the first Quest; it is never a gate.</Text>
          </View>
        </View>
        <View style={styles.options}>
          {skillOptions.map((option) => (
            <Choice key={option.id} label={option.label} selected={skills.includes(option.id)} onPress={() => toggleSkill(option.id)} />
          ))}
        </View>
      </View>

      <View style={[styles.section, { borderColor: theme.borderSoft, backgroundColor: theme.surface }]}>
        <View style={styles.sectionHeading}>
          <Clock3 color={theme.green} size={20} />
          <View style={styles.sectionCopy}>
            <Text style={[styles.sectionTitle, { color: theme.ink }]}>Time available each week</Text>
            <Text style={[styles.sectionHint, { color: theme.inkSecondary }]}>We will keep the first experiment inside this rhythm.</Text>
          </View>
        </View>
        <View accessibilityRole="radiogroup" style={[styles.timeGrid, compact && styles.timeGridCompact]}>
          {timeOptions.map((option) => {
            const selected = availableTime === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => setAvailableTime(option.id)}
                style={({ pressed }) => [styles.timeOption, { borderColor: selected ? theme.green : theme.borderSoft, backgroundColor: selected ? `${theme.green}12` : theme.surfaceMuted }, pressed && styles.pressed]}>
                <Text style={[styles.timeLabel, { color: theme.ink }]}>{option.label}</Text>
                <Text style={[styles.timeDetail, { color: theme.inkSecondary }]}>{option.detail}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.section, { borderColor: theme.borderSoft, backgroundColor: theme.surface }]}>
        <View style={styles.sectionHeading}>
          <Compass color={theme.amber} size={20} />
          <View style={styles.sectionCopy}>
            <Text style={[styles.sectionTitle, { color: theme.ink }]}>What do you want to explore?</Text>
            <Text style={[styles.sectionHint, { color: theme.inkSecondary }]}>Choose one or more. You can revise this after any Quest.</Text>
          </View>
        </View>
        <View style={styles.options}>
          {explorationOptions.map((option) => (
            <Choice key={option.id} label={option.label} selected={explorations.includes(option.id)} onPress={() => toggleExploration(option.id)} />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={[styles.footerLabel, { color: ready ? theme.green : theme.coral }]}>{ready ? interests.length ? 'SIGNALS READY' : 'READY TO DISCOVER SIGNALS' : 'CHOOSE WHAT YOU WANT TO EXPLORE'}</Text>
          <Text style={[styles.footerDetail, { color: theme.inkSecondary }]}>Saved only on this device.</Text>
          {saveError && <Text accessibilityRole="alert" style={[styles.saveError, { color: theme.coral }]}>{saveError}</Text>}
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!ready || saving}
          onPress={() => void continueToRecommendations()}
          style={({ pressed }) => [styles.primaryButton, { backgroundColor: ready ? theme.green : theme.border }, pressed && ready && !saving && styles.pressed]}>
          {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <ArrowRight color="#FFFFFF" size={17} />}
          <Text style={styles.primaryButtonText}>{saving ? 'SAVING...' : initial.completed ? 'UPDATE MY PATHS' : 'REVEAL MY PATHS'}</Text>
        </Pressable>
      </View>
    </ScreenScaffold>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { theme } = useLifeTheme();
  return (
    <Pressable
      aria-checked={selected}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.choice, { borderColor: selected ? theme.violet : theme.borderSoft, backgroundColor: selected ? `${theme.violet}10` : theme.surfaceMuted }, pressed && styles.pressed]}>
      <View style={[styles.choiceCheck, { borderColor: selected ? theme.violet : theme.border, backgroundColor: selected ? theme.violet : 'transparent' }]}>
        {selected && <Check color="#FFFFFF" size={12} />}
      </View>
      <Text style={[styles.choiceLabel, { color: theme.ink }]}>{label}</Text>
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const { hydrated, state } = useJourney();
  const { theme } = useLifeTheme();
  if (!hydrated) return <View style={[styles.loading, { backgroundColor: theme.surfaceStrong }]}><ActivityIndicator color={theme.green} /></View>;
  return <OnboardingForm initial={state.profile} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  intro: { maxWidth: 760, marginBottom: 24 },
  stepBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 5, paddingHorizontal: 9, paddingVertical: 6 },
  stepBadgeText: { fontSize: 8, fontWeight: '900' },
  title: { marginTop: 14, fontSize: 46, fontWeight: '900', lineHeight: 49 },
  titleCompact: { fontSize: 32, lineHeight: 35 },
  subtitle: { maxWidth: 650, marginTop: 12, fontSize: 14, lineHeight: 21 },
  section: { marginTop: 12, borderWidth: 1, borderRadius: 8, padding: 18 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  sectionCopy: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '900' },
  sectionHint: { marginTop: 3, fontSize: 10, lineHeight: 14 },
  count: { fontSize: 8, fontWeight: '900' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 15 },
  choice: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 6, paddingHorizontal: 12 },
  choiceCheck: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 5 },
  choiceLabel: { fontSize: 11, fontWeight: '700' },
  timeGrid: { flexDirection: 'row', gap: 9, marginTop: 15 },
  timeGridCompact: { flexWrap: 'wrap' },
  timeOption: { minHeight: 68, minWidth: 140, flex: 1, justifyContent: 'center', borderWidth: 1, borderRadius: 6, paddingHorizontal: 14 },
  timeLabel: { fontSize: 13, fontWeight: '900' },
  timeDetail: { marginTop: 4, fontSize: 9 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginTop: 22 },
  footerLabel: { fontSize: 9, fontWeight: '900' },
  footerDetail: { marginTop: 4, fontSize: 9 },
  saveError: { maxWidth: 500, marginTop: 5, fontSize: 9, lineHeight: 13 },
  primaryButton: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 6, paddingHorizontal: 20 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  pressed: { opacity: 0.72 },
});
