import { Compass, PenLine, Route as RouteIcon, Share2 } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { usePathname, useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';

/**
 * No Universe tab yet: `/atlas` is still the Alpha screen, which redirects
 * anyone without a legacy journey profile into legacy onboarding and offers no
 * way back. It returns when the Universe canvas renders the shared catalog.
 */
const items: { label: string; href: Href; icon: LucideIcon }[] = [
  { label: 'Discover', href: '/', icon: Compass },
  { label: 'Journey', href: '/journey', icon: RouteIcon },
  { label: 'Create', href: '/create', icon: PenLine },
  { label: 'Share', href: '/share', icon: Share2 },
];

export function RoadmapScaffold({ children, title }: { children: ReactNode; title: string }) {
  const { theme } = useLifeTheme();
  const { persistenceError } = useRoadmap();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View testID="roadmap-screen" style={[styles.root, { backgroundColor: theme.surfaceStrong }]}>
      <View style={[styles.header, { borderBottomColor: theme.borderSoft, paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: theme.ink }]}>{title}</Text>
      </View>
      {persistenceError && (
        <View testID="persistence-error" style={[styles.banner, { backgroundColor: `${theme.amber}22`, borderColor: theme.amber }]}>
          <Text style={{ color: theme.ink }}>{persistenceError}</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
      <View testID="roadmap-nav" style={[styles.nav, { backgroundColor: theme.nav, borderTopColor: theme.borderSoft, paddingBottom: insets.bottom }]}>
        {items.map(({ label, href, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(String(href));
          return (
            <Pressable
              key={label}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: active }}
              onPress={() => router.navigate(href)}
              style={styles.navItem}>
              <Icon color={active ? theme.accent : theme.navInk} size={22} />
              <Text style={[styles.navLabel, { color: active ? theme.accent : theme.navInk }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '700' },
  banner: { marginHorizontal: 18, marginTop: 12, padding: 10, borderRadius: 10, borderWidth: 1 },
  content: { width: '100%', maxWidth: 1120, alignSelf: 'center', padding: 18, paddingBottom: 120, gap: 14 },
  nav: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 8 },
  navItem: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 6 },
  navLabel: { fontSize: 11, fontWeight: '700' },
});
