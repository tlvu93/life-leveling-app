import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Card, RoadmapLoading, SectionTitle } from '@/components/roadmap/pieces';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import { draftListView } from '@/domain/roadmap/selectors/draft';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';

export default function DraftListScreen() {
  const { theme } = useLifeTheme();
  const { hydrated, state, catalog, createDraft } = useRoadmap();
  const router = useRouter();

  if (!hydrated) return <RoadmapLoading />;

  const drafts = draftListView(catalog, state);
  const start = (pathId: string, pathTitle: string) => {
    const draftId = createDraft(pathId, `A route through ${pathTitle}`);
    router.push(`/create/${draftId}`);
  };

  return (
    <RoadmapScaffold title="Create a Guide">
      <Body>A Guide is your route through a Path — the order you would actually teach it, and what you would leave out.</Body>

      {drafts.length > 0 && <SectionTitle>Your Guides</SectionTitle>}
      {drafts.map((draft) => (
        <Card key={draft.draftId} testID={`draft-${draft.draftId}`} onPress={() => router.push(`/create/${draft.draftId}`)}>
          <Text style={[styles.title, { color: theme.ink }]}>{draft.title}</Text>
          <Body>{draft.pathTitle}</Body>
          <View style={styles.meta}>
            <Text style={[styles.metaText, { color: theme.inkSecondary }]}>
              {`${draft.stepCount} Step${draft.stepCount === 1 ? '' : 's'}`}
            </Text>
            {draft.issueCount > 0 && (
              <Text testID={`draft-issues-${draft.draftId}`} style={[styles.metaText, { color: theme.amber }]}>
                {`${draft.issueCount} thing${draft.issueCount === 1 ? '' : 's'} to fix`}
              </Text>
            )}
            {draft.visibility === 'unlisted' && (
              <Text testID={`draft-unlisted-${draft.draftId}`} style={[styles.metaText, { color: theme.accent }]}>Unlisted link is live</Text>
            )}
          </View>
        </Card>
      ))}

      <SectionTitle>Start a Guide through</SectionTitle>
      {catalog.paths.map((path) => (
        <Card key={path.id} testID={`start-${path.id}`} onPress={() => start(path.id, path.title)}>
          <Text style={[styles.title, { color: theme.ink }]}>{path.title}</Text>
          <Body>{path.overview.whatItIs}</Body>
        </Card>
      ))}
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '700' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaText: { fontSize: 12, fontWeight: '700' },
});
