import { BadgeCheck, GitCompare, MapPin, Route as RouteIcon, Users } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Card, CardCta, NotFound, PrimaryButton, RoadmapLoading, SectionHeading } from '@/components/roadmap/pieces';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import { domainVisual } from '@/components/universe/universe-visuals';
import { pathOverviewView } from '@/domain/roadmap/selectors/path-overview';
import { pathTransferView } from '@/domain/roadmap/selectors/path-transfer';
import { framingFlagsFrom, progressLabel } from '@/lib/framing-flags';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';

export default function PathOverviewScreen() {
  const params = useLocalSearchParams<{ pathId?: string; framing?: string; marker?: string }>();
  const pathId = params.pathId ?? '';
  const { theme } = useLifeTheme();
  const { hydrated, state, catalog, adoptGuide } = useRoadmap();
  const router = useRouter();

  if (!hydrated) return <RoadmapLoading />;

  const vm = pathOverviewView(catalog, pathId);
  if (!vm) return <RoadmapScaffold title="Path"><NotFound what="Path" /></RoadmapScaffold>;

  const path = catalog.paths.find((p) => p.id === pathId);
  const tone = domainVisual(path?.interestIds[0] ?? '').core;
  const transfer = pathTransferView(catalog, state, pathId);
  const flags = framingFlagsFrom(params);
  const featuredGuideId = path?.featuredGuideId;

  const facts: { icon: typeof MapPin; label: string; lines: string[] }[] = [
    { icon: MapPin, label: 'WHERE IT HAPPENS', lines: vm.overview.settings },
    { icon: RouteIcon, label: 'VARIANTS', lines: vm.overview.variants },
    { icon: Users, label: 'REALITIES', lines: vm.overview.realities },
  ];

  return (
    <RoadmapScaffold eyebrow="LIVING UNIVERSE / PATH" title={vm.title} subtitle={vm.overview.whatItIs}>
      {transfer && (
        <View style={styles.statusRow}>
          <View style={[styles.pill, { borderColor: tone, backgroundColor: `${tone}14` }]}>
            <Text testID="transfer-line" style={[styles.pillText, { color: theme.ink }]}>
              {progressLabel(flags, transfer.applyCount, transfer.totalNodes)}
            </Text>
          </View>
        </View>
      )}

      <SectionHeading index="01" title="What this Path actually is" subtitle="Written from how people describe it, not from a curriculum." />

      <View style={styles.factGrid}>
        {facts.map(({ icon: Icon, label, lines }) => (
          <Card key={label} grow tone={tone}>
            <View style={styles.factHead}>
              <Icon color={tone} size={16} />
              <Text style={[styles.factLabel, { color: tone }]}>{label}</Text>
            </View>
            {lines.map((line) => (
              <View key={line} style={styles.bulletRow}>
                <View style={[styles.bullet, { backgroundColor: tone }]} />
                <Text style={[styles.bulletText, { color: theme.inkSecondary }]}>{line}</Text>
              </View>
            ))}
          </Card>
        ))}
      </View>

      <Card tone={theme.amber}>
        <Text style={[styles.factLabel, { color: theme.amber }]}>COMMON GROUND, AND WHAT IS CONTESTED</Text>
        <Body>{vm.overview.foundations}</Body>
      </Card>

      <SectionHeading
        index="02"
        title="Guides through this Path"
        subtitle="Each Guide is one person's opinionated route. Adopting one copies its Steps into a Journey you can then rewrite."
      />

      {vm.guides.length >= 2 && (
        <Card testID="compare-guides" tone={theme.violet} onPress={() => router.push(`/compare?a=${vm.guides[0].id}&b=${vm.guides[1].id}`)}>
          <View style={styles.factHead}>
            <GitCompare color={theme.violet} size={17} />
            <Text style={[styles.cardTitle, { color: theme.ink }]}>Compare these two routes</Text>
          </View>
          <Body>They disagree in ways worth seeing before you pick one.</Body>
          <CardCta label="See where they differ" tone={theme.violet} />
        </Card>
      )}

      {vm.guides.map((guide) => (
        <Card key={guide.id} testID={`guide-${guide.id}`} tone={guide.id === featuredGuideId ? tone : theme.panelBorder}>
          <View style={styles.guideHead}>
            <Text style={[styles.cardTitle, { color: theme.ink }]}>{guide.title}</Text>
            {guide.id === featuredGuideId && (
              <View testID={`featured-${guide.id}`} style={[styles.featured, { borderColor: tone, backgroundColor: `${tone}14` }]}>
                <BadgeCheck color={tone} size={13} />
                <Text style={[styles.featuredText, { color: tone }]}>FEATURED</Text>
              </View>
            )}
          </View>
          <View style={[styles.personaRow, styles.personaDivider, { borderTopColor: theme.panelBorder }]}>
            <Text style={[styles.personaLabel, { color: theme.inkSecondary }]}>FOR</Text>
            <Text style={[styles.personaText, { color: theme.ink }]}>{guide.audience}</Text>
          </View>
          <View style={styles.personaRow}>
            <Text style={[styles.personaLabel, { color: theme.inkSecondary }]}>OUTCOME</Text>
            <Text style={[styles.personaText, { color: theme.ink }]}>{guide.outcome}</Text>
          </View>
          <PrimaryButton
            testID={`adopt-${guide.id}`}
            label="Make this my Journey"
            tone={tone}
            onPress={() => { adoptGuide(guide.id); router.push('/journey'); }}
          />
        </Card>
      ))}

      {vm.neighbors.length > 0 && (
        <SectionHeading index="03" title="Nearby Paths" subtitle="Where this Path touches another world, and what carries across." />
      )}
      {vm.neighbors.map((neighbor) => (
        <Card key={neighbor.id} testID={`neighbor-${neighbor.id}`} tone={theme.panelBorder} onPress={() => router.push(`/paths/${neighbor.id}`)}>
          <Text style={[styles.cardTitle, { color: theme.ink }]}>{neighbor.title}</Text>
          {neighbor.via === 'bridge' && neighbor.bridgeNote && (
            <Text testID={`bridge-${neighbor.id}`} style={[styles.bridge, { color: theme.accent }]}>{neighbor.bridgeNote}</Text>
          )}
          <Body>{neighbor.whatItIs}</Body>
        </Card>
      ))}
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { minHeight: 34, justifyContent: 'center', borderWidth: 1, borderRadius: 6, paddingHorizontal: 11 },
  pillText: { fontSize: 10, fontWeight: '700' },
  factGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  factHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  factLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  bulletRow: { flexDirection: 'row', gap: 8, paddingRight: 4 },
  bullet: { width: 5, height: 5, marginTop: 6, borderRadius: 3 },
  bulletText: { flex: 1, fontSize: 11, lineHeight: 17 },
  cardTitle: { fontSize: 17, fontWeight: '900' },
  guideHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  featured: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 4 },
  featuredText: { fontSize: 7, fontWeight: '900' },
  personaRow: { gap: 3, paddingTop: 8 },
  personaDivider: { marginTop: 4, borderTopWidth: 1, paddingTop: 12 },
  personaLabel: { fontSize: 7, fontWeight: '900' },
  personaText: { fontSize: 12, lineHeight: 17 },
  bridge: { fontSize: 12, fontStyle: 'italic' },
});
