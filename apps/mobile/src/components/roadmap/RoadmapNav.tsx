import { Compass, Orbit, PenLine, Route as RouteIcon } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { usePathname, useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLifeTheme } from '@/state/theme-context';

// Universe points at the shared-catalog canvas, never at the Alpha `/atlas`,
// which redirects anyone without a legacy journey profile into legacy
// onboarding. Share is reached from the Journey rather than the nav.
const items: { label: string; href: Href; icon: LucideIcon }[] = [
  { label: 'Universe', href: '/universe', icon: Orbit },
  { label: 'Discover', href: '/', icon: Compass },
  { label: 'Journey', href: '/journey', icon: RouteIcon },
  { label: 'Create', href: '/create', icon: PenLine },
];

/** The docked pill nav, shared by the list surfaces and the Universe canvas. */
export function RoadmapNav({ floating = false }: { floating?: boolean }) {
  const { theme } = useLifeTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View
      testID="roadmap-nav"
      style={[
        floating ? styles.floating : styles.docked,
        {
          backgroundColor: theme.nav,
          borderColor: theme.panelBorder,
          borderTopColor: theme.borderSoft,
          paddingBottom: floating ? 6 : insets.bottom,
          bottom: floating ? insets.bottom + 16 : undefined,
        },
      ]}>
      {items.map(({ label, href, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(String(href));
        return (
          <Pressable
            key={label}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
            onPress={() => router.navigate(href)}
            style={styles.item}>
            <Icon color={active ? theme.accent : theme.navInk} size={22} />
            <Text style={[styles.label, { color: active ? theme.accent : theme.navInk }]}>{label}</Text>
            {active && <View style={[styles.activeLine, { backgroundColor: theme.accent }]} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  docked: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 8 },
  floating: {
    position: 'absolute',
    zIndex: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 32,
    paddingTop: 8,
    paddingHorizontal: 10,
    minWidth: 420,
    shadowColor: '#1E2951',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  item: { position: 'relative', flex: 1, alignItems: 'center', gap: 2, paddingVertical: 6, paddingHorizontal: 8 },
  label: { fontSize: 11, fontWeight: '700' },
  activeLine: { position: 'absolute', right: 14, bottom: 0, left: 14, height: 3, borderRadius: 2 },
});
