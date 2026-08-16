import { AlertTriangle, Link2, PenLine } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Body, Card, CardCta, RoadmapLoading, SectionHeading } from '@/components/roadmap/pieces';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import { domainVisual } from '@/components/universe/universe-visuals';
import { draftListView } from '@/domain/roadmap/selectors/draft';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';

export default function DraftListScreen() {
  const { theme } = useLifeTheme();
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const { hydrated, state, catalog, createDraft } = useRoadmap();
  const router = useRouter();

  if (!hydrated) return <RoadmapLoading />;

  const drafts = draftListView(catalog, state);
  const toneOf = (pathId: string) => domainVisual(catalog.paths.find((p) => p.id === pathId)?.interestIds[0] ?? '').core;
  const start = (pathId: string, pathTitle: string) => {
    const draftId = createDraft(pathId, `A route through ${pathTitle}`);
    router.push(`/create/${draftId}`);
  };

  return (
    <RoadmapScaffold
      eyebrow="LIVING UNIVERSE / NAVIGATOR ROUTES"
      title="Create a Guide"
      subtitle="A Guide is your route through a Path — the order you would actually teach it, and what you would leave out. Say why, and someone else can disagree with you honestly.">
      {drafts.length > 0 && (
        <>
          <SectionHeading index="01" title="Your Guides" subtitle="Drafts stay on this device until you publish an unlisted link." />
          {drafts.map((draft) => {
            const tone = toneOf(draft.pathId);
            return (
              <Card key={draft.draftId} testID={`draft-${draft.draftId}`} tone={tone} onPress={() => router.push(`/create/${draft.draftId}`)}>
                <Text style={[styles.eyebrow, { color: tone }]}>{draft.pathTitle.toUpperCase()}</Text>
                <Text style={[styles.title, { color: theme.ink }]}>{draft.title}</Text>
                <View style={styles.meta}>
                  <View style={[styles.metaPill, { borderColor: theme.panelBorder }]}>
                    <PenLine color={theme.inkSecondary} size={12} />
                    <Text style={[styles.metaText, { color: theme.inkSecondary }]}>
                      {`${draft.stepCount} Step${draft.stepCount === 1 ? '' : 's'}`}
                    </Text>
                  </View>
                  {draft.issueCount > 0 && (
                    <View style={[styles.metaPill, { borderColor: theme.amber, backgroundColor: `${theme.amber}14` }]}>
                      <AlertTriangle color={theme.amber} size={12} />
                      <Text testID={`draft-issues-${draft.draftId}`} style={[styles.metaText, { color: theme.amber }]}>
                        {`${draft.issueCount} thing${draft.issueCount === 1 ? '' : 's'} to fix`}
                      </Text>
                    </View>
                  )}
                  {draft.visibility === 'unlisted' && (
                    <View style={[styles.metaPill, { borderColor: theme.accent, backgroundColor: theme.accentSoft }]}>
                      <Link2 color={theme.accent} size={12} />
                      <Text testID={`draft-unlisted-${draft.draftId}`} style={[styles.metaText, { color: theme.accent }]}>Unlisted link is live</Text>
                    </View>
                  )}
                </View>
                <CardCta label="Keep editing" tone={tone} />
              </Card>
            );
          })}
        </>
      )}

      <SectionHeading
        index={drafts.length > 0 ? '02' : '01'}
        title="Start a Guide through"
        subtitle="Pick the Path you know well enough to have an opinion about."
      />

      <View style={[styles.grid, compact && styles.gridCompact]}>
        {catalog.paths.map((path) => {
          const tone = domainVisual(path.interestIds[0] ?? '').core;
          return (
            <Card key={path.id} grow testID={`start-${path.id}`} tone={tone} onPress={() => start(path.id, path.title)}>
              <Text style={[styles.title, { color: theme.ink }]}>{path.title}</Text>
              <Body>{path.overview.whatItIs}</Body>
              <View style={styles.spacer} />
              <CardCta label="Start a draft" tone={tone} />
            </Card>
          );
        })}
      </View>
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  title: { fontSize: 18, fontWeight: '900', lineHeight: 21 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaPill: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 5, paddingHorizontal: 9 },
  metaText: { fontSize: 9, fontWeight: '900' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCompact: { flexDirection: 'column' },
  spacer: { flex: 1 },
});
